import type { APIRoute } from 'astro';
import { getSupabaseServer } from '../../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../../lib/platform/security';

async function owned(request: Request, id: string) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const supabase = getSupabaseServer();
  if (!supabase || !token) return null;
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return null;
  const { data } = await supabase.from('attachments').select('*').eq('id', id).eq('user_id', auth.user.id).single();
  return data;
}

export const GET: APIRoute = async ({ request, params }) => {
  try {
    const record = await owned(request, params.id!);
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    return json({ ok: true, attachment: { id: record.id, name: record.original_name, mimeType: record.mime_type, size: record.size_bytes, status: record.status, createdAt: record.created_at } });
  } catch (error) {
    return safeError(error);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    assertSameOrigin(request);
    const record = await owned(request, params.id!);
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    const supabase = getSupabaseServer()!;
    await supabase.storage.from('owner-documents').remove([record.storage_path]);
    await supabase.from('attachments').update({ status: 'deleted', deleted_at: new Date().toISOString(), extracted_text: null }).eq('id', record.id);
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
