import type { APIRoute } from 'astro';
import { requireOwnerProfileAccess } from '../../../../lib/platform/identity';
import { getSupabaseServer } from '../../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../../lib/platform/security';

async function owned(context: Parameters<APIRoute>[0]) {
  const session = await requireOwnerProfileAccess(context);
  const supabase = getSupabaseServer()!;
  const { data } = await supabase
    .from('attachments')
    .select('*')
    .eq('id', context.params.id!)
    .eq('conversation_id', session.conversationId)
    .eq('profile_id', session.profileId)
    .single();
  return { record: data, supabase, session };
}

export const GET: APIRoute = async (context) => {
  try {
    const { record, supabase } = await owned(context);
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    const wantsPreview = new URL(context.request.url).searchParams.get('preview') === '1';
    let previewUrl: string | null = null;
    if (wantsPreview && record.status === 'ready') {
      const { data } = await supabase.storage
        .from('owner-documents')
        .createSignedUrl(record.storage_path, 60, { download: record.original_name });
      previewUrl = data?.signedUrl ?? null;
    }
    return json({
      ok: true,
      attachment: {
        id: record.id,
        name: record.original_name,
        mimeType: record.mime_type,
        size: record.size_bytes,
        status: record.status,
        createdAt: record.created_at,
        previewUrl,
      },
    });
  } catch (error) {
    return safeError(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const { record, supabase } = await owned(context);
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    await supabase.storage.from('owner-documents').remove([record.storage_path]);
    await supabase.from('document_extractions').delete().eq('attachment_id', record.id);
    await supabase.from('owner_memory_chunks').delete().eq('attachment_id', record.id);
    await supabase
      .from('owner_facts')
      .update({ status: 'rejected' })
      .eq('source_attachment_id', record.id)
      .in('status', ['candidate', 'confirmed']);
    await supabase
      .from('attachments')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', record.id);
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
