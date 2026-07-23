import { hmacSha256 } from './documents';
import { runtimeEnv } from './runtime-env';

export const ACCOUNT_DELETION_TOKEN_TTL_MS = 10 * 60 * 1_000;

function deletionSecret() {
  const secret = runtimeEnv('ACCOUNT_DELETION_SECRET') || runtimeEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) throw new Error('account_deletion_secret_unavailable');
  return secret;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function nonceValue() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function tokenPayload(profileId: string, nonce: string, timestamp: number) {
  return `${profileId}.${nonce}.${timestamp}`;
}

export async function createAccountDeletionToken(args: {
  profileId: string;
  nonce?: string;
  nowMs?: number;
}) {
  const timestamp = Math.floor((args.nowMs ?? Date.now()) / 1_000);
  const nonce = args.nonce || nonceValue();
  const signature = await hmacSha256(
    deletionSecret(),
    tokenPayload(args.profileId, nonce, timestamp),
  );
  return `v1.${args.profileId}.${timestamp}.${nonce}.${signature}`;
}

export async function verifyAccountDeletionToken(args: {
  token: string;
  profileId: string;
  nowMs?: number;
}) {
  const [version, profileId, timestampText, nonce, signature] = args.token.split('.');
  if (version !== 'v1' || profileId !== args.profileId || !timestampText || !nonce || !signature) {
    return false;
  }
  const timestamp = Number(timestampText);
  if (!Number.isInteger(timestamp)) return false;
  const nowMs = args.nowMs ?? Date.now();
  if (
    nowMs - timestamp * 1_000 > ACCOUNT_DELETION_TOKEN_TTL_MS ||
    timestamp * 1_000 - nowMs > 30_000
  ) {
    return false;
  }
  const expected = await hmacSha256(deletionSecret(), tokenPayload(profileId, nonce, timestamp));
  return constantTimeEqual(expected, signature);
}
