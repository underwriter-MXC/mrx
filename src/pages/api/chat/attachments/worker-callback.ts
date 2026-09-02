import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  buildDocumentReadSummary,
  encryptDocumentText,
  inferDocumentType,
  verifyWorkerSignature,
} from '../../../../lib/platform/documents';
import { extractDocumentFacts } from '../../../../lib/platform/facts';
import { syncVerifiedOwnerToGhl } from '../../../../lib/platform/crm';
import { getSupabaseServer, saveMessage } from '../../../../lib/platform/supabase';
import { json, safeError } from '../../../../lib/platform/security';

const CallbackSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ready'),
    jobId: z.string().uuid(),
    attachmentId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
    rawText: z.string().max(250_000),
    redactedText: z.string().max(250_000),
    pageCount: z.number().int().nonnegative().max(10_000),
    piiCategories: z.array(z.string().max(80)).max(30),
  }),
  z.object({
    status: z.literal('rejected'),
    jobId: z.string().uuid(),
    attachmentId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
    reason: z.enum(['malware_detected', 'invalid_file', 'ocr_failed']),
  }),
]);

export const POST: APIRoute = async (context) => {
  try {
    const rawBody = await context.request.text();
    const timestamp = context.request.headers.get('x-mrx-timestamp');
    const nonce = context.request.headers.get('x-mrx-nonce');
    const signature = context.request.headers.get('x-mrx-signature');
    if (!(await verifyWorkerSignature({ rawBody, timestamp, nonce, signature }))) {
      return json({ ok: false, error: 'invalid_signature' }, { status: 401 });
    }
    const parsed = CallbackSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) return json({ ok: false, error: 'invalid_callback' }, { status: 400 });
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });
    const { error: nonceError } = await supabase.from('crm_sync_events').insert({
      provider: 'document_worker',
      external_event_id: nonce,
      event_type: `document.${parsed.data.status}`,
      payload: {
        jobId: parsed.data.jobId,
        attachmentId: parsed.data.attachmentId,
        idempotencyKey: parsed.data.idempotencyKey,
      },
    });
    if (nonceError && nonceError.code !== '23505') throw nonceError;
    const { data: job, error: jobLookupError } = await supabase
      .from('document_processing_jobs')
      .select('id,status,idempotency_key,attachment_id')
      .eq('id', parsed.data.jobId)
      .eq('attachment_id', parsed.data.attachmentId)
      .eq('idempotency_key', parsed.data.idempotencyKey)
      .single();
    if (jobLookupError) throw jobLookupError;
    if (!job) return json({ ok: false, error: 'job_not_found' }, { status: 404 });
    if (job.status === 'complete') return json({ ok: true, duplicate: true });
    if (job.status === 'failed' && parsed.data.status === 'rejected') {
      return json({ ok: true, duplicate: true });
    }

    const { data: attachment, error: attachmentLookupError } = await supabase
      .from('attachments')
      .select(
        'storage_path,conversation_id,profile_id,mineral_interest_id,original_name,document_type',
      )
      .eq('id', parsed.data.attachmentId)
      .single();
    if (attachmentLookupError) throw attachmentLookupError;
    if (!attachment) return json({ ok: false, error: 'attachment_not_found' }, { status: 404 });
    if (parsed.data.status === 'rejected') {
      const { error: removalError } = await supabase.storage
        .from('owner-documents')
        .remove([attachment.storage_path]);
      if (removalError) throw removalError;
      const { error: rejectionError } = await supabase
        .from('attachments')
        .update({ status: 'rejected', rejection_reason: parsed.data.reason })
        .eq('id', parsed.data.attachmentId);
      if (rejectionError) throw rejectionError;
      const { error: requirementError } = await supabase
        .from('underwriting_document_requirements')
        .update({ status: 'rejected' })
        .eq('profile_id', attachment.profile_id)
        .eq('attachment_id', parsed.data.attachmentId);
      if (requirementError) throw requirementError;
      const { error: jobError } = await supabase
        .from('document_processing_jobs')
        .update({
          status: 'failed',
          error_code: parsed.data.reason,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
      if (jobError) throw jobError;
      try {
        await syncVerifiedOwnerToGhl(attachment.profile_id);
      } catch (error) {
        console.error(
          '[GHL document status sync]',
          error instanceof Error ? error.message : 'failed',
        );
      }
      const { error: eventError } = await supabase
        .from('crm_sync_events')
        .update({ processed_at: new Date().toISOString(), error_code: null })
        .eq('provider', 'document_worker')
        .eq('external_event_id', nonce);
      if (eventError) throw eventError;
      return json({ ok: true, status: 'rejected' });
    }
    const encryptedRawText = await encryptDocumentText(parsed.data.rawText);
    const { error: extractionError } = await supabase.from('document_extractions').upsert(
      {
        attachment_id: parsed.data.attachmentId,
        encrypted_raw_text: encryptedRawText,
        redacted_text: parsed.data.redactedText,
        page_count: parsed.data.pageCount,
        pii_categories: parsed.data.piiCategories,
        extraction_version: 'worker-v2',
      },
      { onConflict: 'attachment_id' },
    );
    if (extractionError) throw extractionError;
    const memoryChunks = parsed.data.redactedText
      .split(/\n\s*\n/)
      .reduce<string[]>((chunks, paragraph) => {
        const clean = paragraph.trim();
        if (!clean) return chunks;
        const last = chunks[chunks.length - 1];
        if (last && last.length + clean.length < 3_500)
          chunks[chunks.length - 1] = `${last}\n\n${clean}`;
        else chunks.push(clean.slice(0, 4_000));
        return chunks;
      }, [])
      .slice(0, 100);
    const readSummary = buildDocumentReadSummary({
      originalName: attachment.original_name || 'uploaded document',
      documentType: attachment.document_type,
      redactedText: parsed.data.redactedText,
      pageCount: parsed.data.pageCount,
      piiCategories: parsed.data.piiCategories,
    });
    const { error: chunkDeleteError } = await supabase
      .from('owner_memory_chunks')
      .delete()
      .eq('attachment_id', parsed.data.attachmentId);
    if (chunkDeleteError) throw chunkDeleteError;
    const memoryRows = [
      {
        profile_id: attachment.profile_id,
        conversation_id: attachment.conversation_id,
        mineral_interest_id: attachment.mineral_interest_id,
        attachment_id: parsed.data.attachmentId,
        source_type: 'summary',
        content: readSummary.memory,
      },
      ...memoryChunks.map((content) => ({
        profile_id: attachment.profile_id,
        conversation_id: attachment.conversation_id,
        mineral_interest_id: attachment.mineral_interest_id,
        attachment_id: parsed.data.attachmentId,
        source_type: 'document',
        content,
      })),
    ];
    const { error: chunkInsertError } = await supabase
      .from('owner_memory_chunks')
      .insert(memoryRows);
    if (chunkInsertError) throw chunkInsertError;
    const summaryMessageId = await saveMessage({
      conversationId: attachment.conversation_id,
      role: 'assistant',
      content: readSummary.content,
      persona: 'travis',
      eventType: 'notice',
      metadata: {
        ...readSummary.metadata,
        attachmentId: parsed.data.attachmentId,
        source: 'document_worker_callback',
      },
    });
    if (!summaryMessageId) throw new Error('document_summary_not_persisted');
    let extractedInterestId = attachment.mineral_interest_id as string | null;
    try {
      extractedInterestId =
        (await extractDocumentFacts({
          attachmentId: parsed.data.attachmentId,
          conversationId: attachment.conversation_id,
          profileId: attachment.profile_id,
          mineralInterestId: attachment.mineral_interest_id,
          redactedText: parsed.data.redactedText,
        })) ?? extractedInterestId;
      if (extractedInterestId && extractedInterestId !== attachment.mineral_interest_id) {
        const { error: memoryInterestError } = await supabase
          .from('owner_memory_chunks')
          .update({ mineral_interest_id: extractedInterestId })
          .eq('attachment_id', parsed.data.attachmentId);
        if (memoryInterestError) throw memoryInterestError;
      }
    } catch (error) {
      console.error(
        '[Document fact extraction]',
        error instanceof Error ? error.message : 'failed',
      );
    }
    const { error: attachmentUpdateError } = await supabase
      .from('attachments')
      .update({
        status: 'ready',
        processed_at: new Date().toISOString(),
        mineral_interest_id: extractedInterestId,
        document_type: inferDocumentType(parsed.data.redactedText, attachment.document_type),
      })
      .eq('id', parsed.data.attachmentId);
    if (attachmentUpdateError) throw attachmentUpdateError;
    const { error: requirementUpdateError } = await supabase
      .from('underwriting_document_requirements')
      .update({ status: 'uploaded' })
      .eq('profile_id', attachment.profile_id)
      .eq('attachment_id', parsed.data.attachmentId);
    if (requirementUpdateError) throw requirementUpdateError;
    const { error: jobUpdateError } = await supabase
      .from('document_processing_jobs')
      .update({ status: 'complete', completed_at: new Date().toISOString() })
      .eq('id', job.id);
    if (jobUpdateError) throw jobUpdateError;
    try {
      await syncVerifiedOwnerToGhl(attachment.profile_id);
    } catch (error) {
      console.error(
        '[GHL document status sync]',
        error instanceof Error ? error.message : 'failed',
      );
    }
    const { error: eventError } = await supabase
      .from('crm_sync_events')
      .update({ processed_at: new Date().toISOString(), error_code: null })
      .eq('provider', 'document_worker')
      .eq('external_event_id', nonce);
    if (eventError) throw eventError;
    return json({ ok: true, status: 'ready', summaryMessageId });
  } catch (error) {
    return safeError(error);
  }
};
