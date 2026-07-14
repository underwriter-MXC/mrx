import type { APIRoute } from 'astro';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';

export const GET: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const supabase = getSupabaseServer();
    if (!token || !supabase) return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user) return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const userId = auth.user.id;
    const [profile, conversations, attachments] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('conversations').select('*,messages(*),owner_facts(*),appointments(*)').eq('user_id', userId).order('updated_at', { ascending: false }),
      supabase.from('attachments').select('id,conversation_id,original_name,mime_type,size_bytes,status,created_at').eq('user_id', userId),
    ]);
    return json({ exportedAt: new Date().toISOString(), account: { id: userId, email: auth.user.email }, profile: profile.data, conversations: conversations.data ?? [], attachments: attachments.data ?? [] }, {
      headers: { 'Content-Disposition': `attachment; filename="mrx-account-export-${new Date().toISOString().slice(0, 10)}.json"` },
    });
  } catch (error) {
    return safeError(error);
  }
};
