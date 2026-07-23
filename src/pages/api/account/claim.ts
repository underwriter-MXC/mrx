import type { APIRoute } from 'astro';
import { resolveOwnerSession } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../lib/platform/security';

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const session = await resolveOwnerSession(context);
    if (!session.userId || !session.emailVerified) {
      return json({ ok: false, error: 'verified_account_required' }, { status: 401 });
    }
    const supabase = getSupabaseServer();
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ pending_deletion_at: null, last_seen_at: new Date().toISOString() })
        .eq('id', session.profileId)
        .not('pending_deletion_at', 'is', null);
      if (error) throw error;
    }
    return json({
      ok: true,
      profileId: session.profileId,
      conversationId: session.conversationId,
    });
  } catch (error) {
    return safeError(error);
  }
};
