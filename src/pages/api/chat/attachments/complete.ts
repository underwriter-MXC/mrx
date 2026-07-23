import type { APIRoute } from 'astro';
import { z } from 'zod';
import { dispatchDocumentJob, documentWorkerAvailable } from '../../../../lib/platform/documents';
import { requireOwnerProfileAccess } from '../../../../lib/platform/identity';
import { getSupabaseServer } from '../../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../../lib/platform/security';

const Schema = z.object({ attachmentId: z.string().uuid() });

function validMagic(bytes: Uint8Array, mime: string) {
  if (mime === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 4)) === '%PDF';
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.slice(0, 8).every((byte, index) => byte === signature[index]);
  }
  return false;
}

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    const session = await requireOwnerProfileAccess(context);
    const supabase = getSupabaseServer()!;
    const { data: record } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', parsed.data.attachmentId)
      .eq('conversation_id', session.conversationId)
      .eq('profile_id', session.profileId)
      .single();
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    const { data: blob, error: downloadError } = await supabase.storage
      .from('owner-documents')
      .download(record.storage_path);
    if (downloadError || !blob) throw downloadError || new Error('download_failed');
    const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    if (blob.size !== Number(record.size_bytes) || !validMagic(header, record.mime_type)) {
      await supabase.storage.from('owner-documents').remove([record.storage_path]);
      await supabase
        .from('attachments')
        .update({ status: 'rejected', rejection_reason: 'file_signature_mismatch' })
        .eq('id', record.id);
      return json({ ok: false, error: 'file_signature_mismatch' }, { status: 400 });
    }
    if (!(await documentWorkerAvailable())) {
      return json(
        {
          ok: false,
          error: 'document_processing_unavailable',
          status: 'quarantined',
          stored: true,
          processingPending: true,
        },
        { status: 503 },
      );
    }
    const dispatched = await dispatchDocumentJob({
      attachmentId: record.id,
      storagePath: record.storage_path,
      mimeType: record.mime_type,
      originalName: record.original_name,
      callbackOrigin: new URL(context.request.url).origin,
    });
    return json({ ok: true, status: 'queued', jobId: dispatched.jobId }, { status: 202 });
  } catch (error) {
    return safeError(error);
  }
};
