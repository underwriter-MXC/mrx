import type { APIRoute } from 'astro';
import { verifyAccountDeletionToken } from '../../../lib/platform/account-deletion';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { requireVerifiedOwner, sha256 } from '../../../lib/platform/identity';
import { assertSameOrigin, clientKey, json, safeError } from '../../../lib/platform/security';

async function deletionPayload(request: Request) {
  try {
    return (await request.json()) as { deletionIntent?: boolean; deletionToken?: string };
  } catch {
    return {};
  }
}

export const DELETE: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const session = await requireVerifiedOwner(context);
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const parsed = await deletionPayload(context.request);
    if (parsed.deletionIntent !== true) {
      return json({ ok: false, error: 'deletion_intent_required' }, { status: 400 });
    }
    if (!parsed.deletionToken) {
      return json({ ok: false, error: 'deletion_token_required' }, { status: 400 });
    }
    const tokenValid = await verifyAccountDeletionToken({
      token: parsed.deletionToken,
      profileId: session.profileId,
    });
    if (!tokenValid) return json({ ok: false, error: 'deletion_token_invalid' }, { status: 400 });

    const key = clientKey(context);
    const { data: attachments } = await supabase
      .from('attachments')
      .select('storage_path')
      .eq('user_id', session.userId)
      .neq('status', 'deleted');
    if (attachments?.length)
      await supabase.storage
        .from('owner-documents')
        .remove(attachments.map((item) => item.storage_path));
    await supabase.from('deletion_receipts').insert({
      user_hash: await sha256(session.userId),
      scope: 'owner_account_and_content',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1_000).toISOString(),
    });
    await supabase.from('audit_events').insert({
      actor_user_id: session.userId,
      profile_id: session.profileId,
      event_type: 'account_deletion_completed',
      target_type: 'profile',
      target_id: session.profileId,
      metadata: { clientKey: key },
    });
    const { error } = await supabase.auth.admin.deleteUser(session.userId);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
