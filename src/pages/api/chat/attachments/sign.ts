import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseServer } from '../../../../lib/platform/supabase';
import { assertRateLimit, assertSameOrigin, clientKey, json, safeError } from '../../../../lib/platform/security';

const Schema = z.object({
  filename: z.string().min(1).max(180),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  size: z.number().int().positive().max(15 * 1024 * 1024),
});

async function authenticatedUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const supabase = getSupabaseServer();
  if (!token || !supabase) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user;
}

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`attachment-sign:${clientKey(context)}`, 8, 10 * 60_000);
    const user = await authenticatedUser(context.request);
    if (!user?.email) return json({ ok: false, error: 'verified_account_required' }, { status: 401 });
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_file' }, { status: 400 });
    const conversationId = context.cookies.get('mrx_conversation')?.value;
    if (!conversationId) return json({ ok: false, error: 'conversation_required' }, { status: 400 });
    const supabase = getSupabaseServer()!;
    const { count } = await supabase.from('attachments').select('*', { count: 'exact', head: true }).eq('conversation_id', conversationId).neq('status', 'deleted');
    if ((count ?? 0) >= 5) return json({ ok: false, error: 'file_limit_reached' }, { status: 400 });
    const safeName = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
    const path = `quarantine/${user.id}/${conversationId}/${crypto.randomUUID()}-${safeName}`;
    const { data: signed, error } = await supabase.storage.from('owner-documents').createSignedUploadUrl(path);
    if (error) throw error;
    const { data: attachment, error: insertError } = await supabase.from('attachments').insert({
      conversation_id: conversationId,
      user_id: user.id,
      storage_path: path,
      original_name: parsed.data.filename,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.size,
      status: 'quarantined',
    }).select('id').single();
    if (insertError) throw insertError;
    return json({ ok: true, attachmentId: attachment.id, path, token: signed.token, signedUrl: signed.signedUrl });
  } catch (error) {
    return safeError(error);
  }
};
