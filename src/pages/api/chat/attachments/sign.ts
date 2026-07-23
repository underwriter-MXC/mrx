import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  ownerAttachmentUserId,
  requireOwnerProfileAccess,
} from '../../../../lib/platform/identity';
import { getSupabaseServer } from '../../../../lib/platform/supabase';
import { UNDERWRITING_DOCUMENT_TYPES } from '../../../../lib/platform/underwriting-packet';
import { documentWorkerAvailable } from '../../../../lib/platform/documents';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../lib/platform/security';

const Schema = z.object({
  filename: z.string().min(1).max(180),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  size: z
    .number()
    .int()
    .positive()
    .max(15 * 1024 * 1024),
  mineralInterestId: z.string().uuid().nullable().optional(),
  documentType: z.enum(UNDERWRITING_DOCUMENT_TYPES),
  requirementKey: z.string().min(1).max(240).optional(),
  documentProcessingConsent: z.literal(true),
  disclosureVersion: z.string().min(1).max(100),
  sourceUrl: z.string().url().max(1_000),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`attachment-sign:${clientKey(context)}`, 8, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_file_or_consent' }, { status: 400 });
    const session = await requireOwnerProfileAccess(context);
    if (!(await documentWorkerAvailable())) {
      return json(
        { ok: false, error: 'document_processing_unavailable', uploadsEnabled: false },
        { status: 503 },
      );
    }
    const supabase = getSupabaseServer()!;
    const attachmentUserId = await ownerAttachmentUserId(session);
    const { count: totalAttachmentCount } = await supabase
      .from('attachments')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', session.conversationId)
      .neq('status', 'deleted');
    if ((totalAttachmentCount ?? 0) >= 25)
      return json({ ok: false, error: 'file_limit_reached' }, { status: 400 });
    if (parsed.data.mineralInterestId) {
      const { count: ownedInterestCount } = await supabase
        .from('mineral_interests')
        .select('*', { count: 'exact', head: true })
        .eq('id', parsed.data.mineralInterestId)
        .eq('profile_id', session.profileId)
        .neq('status', 'archived');
      if ((ownedInterestCount ?? 0) !== 1)
        return json({ ok: false, error: 'invalid_mineral_interest' }, { status: 400 });
    }
    let matchedRequirementId: string | null = null;
    if (parsed.data.requirementKey) {
      const { data: requirement, error: requirementError } = await supabase
        .from('underwriting_document_requirements')
        .select('id,mineral_interest_id,accepted_document_types,status')
        .eq('profile_id', session.profileId)
        .eq('requirement_key', parsed.data.requirementKey)
        .maybeSingle();
      if (requirementError) throw requirementError;
      const requirementInterestId = requirement?.mineral_interest_id ?? null;
      const requestedInterestId = parsed.data.mineralInterestId ?? null;
      if (
        !requirement ||
        requirement.status === 'not_applicable' ||
        requirementInterestId !== requestedInterestId ||
        !Array.isArray(requirement.accepted_document_types) ||
        !requirement.accepted_document_types.includes(parsed.data.documentType)
      ) {
        return json({ ok: false, error: 'invalid_document_requirement' }, { status: 400 });
      }
      matchedRequirementId = requirement.id;
    }
    let propertyAttachmentQuery = supabase
      .from('attachments')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', session.conversationId)
      .neq('status', 'deleted');
    propertyAttachmentQuery = parsed.data.mineralInterestId
      ? propertyAttachmentQuery.eq('mineral_interest_id', parsed.data.mineralInterestId)
      : propertyAttachmentQuery.is('mineral_interest_id', null);
    const { count: propertyAttachmentCount } = await propertyAttachmentQuery;
    if ((propertyAttachmentCount ?? 0) >= 5)
      return json({ ok: false, error: 'file_limit_reached' }, { status: 400 });
    const safeName = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
    const ownerPath = session.userId || `device-${session.deviceHash.slice(0, 32)}`;
    const path = `quarantine/${ownerPath}/${session.conversationId}/${crypto.randomUUID()}-${safeName}`;
    const { data: signed, error } = await supabase.storage
      .from('owner-documents')
      .createSignedUploadUrl(path);
    if (error) throw error;
    const { data: attachment, error: insertError } = await supabase
      .from('attachments')
      .insert({
        conversation_id: session.conversationId,
        profile_id: session.profileId,
        mineral_interest_id: parsed.data.mineralInterestId || null,
        user_id: attachmentUserId,
        storage_path: path,
        original_name: parsed.data.filename,
        document_type: parsed.data.documentType,
        mime_type: parsed.data.mimeType,
        size_bytes: parsed.data.size,
        status: 'quarantined',
      })
      .select('id')
      .single();
    if (insertError) throw insertError;
    if (matchedRequirementId) {
      const { error: requirementLinkError } = await supabase
        .from('underwriting_document_requirements')
        .update({ attachment_id: attachment.id })
        .eq('id', matchedRequirementId)
        .eq('profile_id', session.profileId);
      if (requirementLinkError) {
        await supabase.from('attachments').delete().eq('id', attachment.id);
        throw requirementLinkError;
      }
    }
    const { error: consentError } = await supabase.from('consent_receipts').insert({
      profile_id: session.profileId,
      channel: 'documentAi',
      purpose: 'scan_ocr_redact_and_extract',
      granted: true,
      disclosure_version: parsed.data.disclosureVersion,
      disclosure_text:
        'MRX may scan, OCR, redact, and analyze this document to help answer mineral-rights questions.',
      source_url: parsed.data.sourceUrl,
    });
    if (consentError) {
      if (matchedRequirementId) {
        await supabase
          .from('underwriting_document_requirements')
          .update({ attachment_id: null, status: 'needed' })
          .eq('id', matchedRequirementId)
          .eq('profile_id', session.profileId)
          .eq('attachment_id', attachment.id);
      }
      await supabase.from('attachments').delete().eq('id', attachment.id);
      throw consentError;
    }
    return json({
      ok: true,
      attachmentId: attachment.id,
      path,
      token: signed.token,
      signedUrl: signed.signedUrl,
    });
  } catch (error) {
    return safeError(error);
  }
};
