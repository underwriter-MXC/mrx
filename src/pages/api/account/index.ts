import type { APIRoute } from 'astro';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../lib/platform/security';

export const DELETE: APIRoute = async ({ request }) => {
  try {
    assertSameOrigin(request);
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const supabase = getSupabaseServer();
    if (!token || !supabase) return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user) return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const { data: attachments } = await supabase.from('attachments').select('storage_path').eq('user_id', auth.user.id).neq('status', 'deleted');
    if (attachments?.length) await supabase.storage.from('owner-documents').remove(attachments.map((item) => item.storage_path));
    const { error } = await supabase.auth.admin.deleteUser(auth.user.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
