import type { APIRoute } from 'astro';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../lib/platform/security';

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const token = context.request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const conversationId = context.cookies.get('mrx_conversation')?.value;
    const supabase = getSupabaseServer();
    if (!token || !conversationId || !supabase) return json({ ok: false, error: 'account_not_configured' }, { status: 401 });
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user?.email) return json({ ok: false, error: 'verified_account_required' }, { status: 401 });
    const { error } = await supabase.from('conversations').update({ user_id: auth.user.id, updated_at: new Date().toISOString() }).eq('id', conversationId).is('user_id', null);
    if (error) throw error;
    await supabase.from('profiles').update({ user_id: auth.user.id, email: auth.user.email, updated_at: new Date().toISOString() }).eq('conversation_id', conversationId).is('user_id', null);
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
