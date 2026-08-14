import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { runtimeEnv } from '../../../lib/platform/runtime-env';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';
import { getSupabaseServer } from '../../../lib/platform/supabase';

const RESERVED_PHONE = '+12025550199';
const SENTINEL_FIRST_NAME = 'MRX';
const SENTINEL_LAST_NAME = 'Production Smoke';
const MAX_LOOKBACK_MS = 30 * 60_000;
const EMAIL_PATTERN = /^mrx-smoke-\d+-[0-9a-f]{6}@[a-z0-9.-]+$/i;

const Schema = z.object({
  acknowledgement: z.literal('issue-sentinel-access-link'),
  createdAfter: z.string().datetime(),
  email: z.string().email().max(320),
});

function hasSmokeSecret(request: Request) {
  const expected = runtimeEnv('MRX_PRODUCTION_SMOKE_SECRET');
  const provided = request.headers.get('x-mrx-production-smoke-secret');
  if (!expected || !provided) return false;
  const expectedBytes = new TextEncoder().encode(expected);
  const providedBytes = new TextEncoder().encode(provided);
  return (
    expectedBytes.byteLength === providedBytes.byteLength &&
    timingSafeEqual(expectedBytes, providedBytes)
  );
}

export const GET: APIRoute = async () => json({ ok: false, error: 'not_found' }, { status: 404 });

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`production-smoke-access:${clientKey(context)}`, 2, 10 * 60_000);
    if (
      context.request.headers.get('x-mrx-production-smoke') !== 'issue-sentinel-access-link' ||
      !hasSmokeSecret(context.request)
    ) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_smoke_access_request' }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const createdAfter = new Date(parsed.data.createdAfter).getTime();
    const now = Date.now();
    if (
      !EMAIL_PATTERN.test(email) ||
      createdAfter < now - MAX_LOOKBACK_MS ||
      createdAfter > now + 60_000
    ) {
      return json({ ok: false, error: 'invalid_smoke_access_identity' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('first_name', SENTINEL_FIRST_NAME)
      .eq('last_name', SENTINEL_LAST_NAME)
      .eq('normalized_phone', RESERVED_PHONE)
      .eq('normalized_email', email)
      .gte('created_at', new Date(createdAfter).toISOString())
      .limit(2);
    if (profileError) throw profileError;
    if (profiles?.length !== 1) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const redirectTo = new URL('/account/?welcome=production-smoke', context.request.url).toString();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });
    const actionLink = data?.properties?.action_link;
    if (error || !actionLink) throw error || new Error('smoke_access_link_unavailable');
    return json({ ok: true, actionLink });
  } catch (error) {
    return safeError(error);
  }
};
