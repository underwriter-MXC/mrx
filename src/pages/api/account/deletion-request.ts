import type { APIRoute } from 'astro';
import {
  createAccountDeletionToken,
  ACCOUNT_DELETION_TOKEN_TTL_MS,
} from '../../../lib/platform/account-deletion';
import { requireVerifiedOwner } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const key = clientKey(context);
    assertRateLimit(`account-deletion-request:${key}`, 5, 10 * 60_000);
    const session = await requireVerifiedOwner(context);
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const now = new Date().toISOString();
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ pending_deletion_at: now, last_seen_at: now })
      .eq('id', session.profileId)
      .eq('user_id', session.userId);
    if (profileError) throw profileError;

    await supabase.from('audit_events').insert({
      actor_user_id: session.userId,
      profile_id: session.profileId,
      event_type: 'account_deletion_requested',
      target_type: 'profile',
      target_id: session.profileId,
      metadata: { clientKey: key, pendingDeletionAt: now },
    });

    return json({
      ok: true,
      deletionToken: await createAccountDeletionToken({ profileId: session.profileId }),
      expiresInSeconds: ACCOUNT_DELETION_TOKEN_TTL_MS / 1_000,
      pendingDeletionAt: now,
      graceWindowHours: 24,
    });
  } catch (error) {
    return safeError(error);
  }
};
