import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  auditStaffCaseEvent,
  requireStaff,
  requireStaffCaseAccess,
} from '../../../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../../lib/platform/security';
import {
  canStaffPerformPacketAction,
  UNDERWRITING_DOCUMENT_TYPES,
  UNDERWRITING_PACKET_VERSION,
  UNDERWRITING_READINESS_VERSION,
  type UnderwritingPacketAction,
} from '../../../../../lib/platform/underwriting-packet';
import { loadUnderwritingPacket } from '../../../../../lib/platform/underwriting-packet-store';
import { documentWorkerAvailable } from '../../../../../lib/platform/documents';
import { syncVerifiedOwnerToGhl } from '../../../../../lib/platform/crm';
import { sendGa4ServerEvent } from '../../../../../lib/platform/analytics';

const READINESS_VERSION = UNDERWRITING_READINESS_VERSION;
const PACKET_VERSION = UNDERWRITING_PACKET_VERSION;

const RequirementId = z.string().uuid();
const AttachmentId = z.string().uuid();
const VerifyAction = z.object({
  action: z.literal('verify'),
  requirementId: RequirementId,
  attachmentId: AttachmentId,
});
const WaiveAction = z.object({
  action: z.literal('waive'),
  requirementId: RequirementId,
  reason: z.string().trim().min(10).max(2_000),
});
const FactId = z.string().uuid();
const ConfirmFactAction = z.object({
  action: z.literal('confirm_fact'),
  factId: FactId,
});
const RejectFactAction = z.object({
  action: z.literal('reject_fact'),
  factId: FactId,
});
const ReopenRequirementAction = z.object({
  action: z.literal('reopen_requirement'),
  requirementId: RequirementId,
});
const FinalizeAction = z.object({
  action: z.literal('finalize'),
});
const ReopenPacketAction = z.object({
  action: z.literal('reopen_packet'),
  reason: z.string().trim().min(10).max(2_000),
});
const ActionSchema = z.discriminatedUnion('action', [
  VerifyAction,
  WaiveAction,
  ConfirmFactAction,
  RejectFactAction,
  ReopenRequirementAction,
  FinalizeAction,
  ReopenPacketAction,
]);

function packetResponse(bundle: Awaited<ReturnType<typeof loadUnderwritingPacket>>) {
  return {
    packet: bundle.packet,
    requirements: bundle.requirements.map((requirement) => ({
      ...requirement,
      accepted_document_types: (requirement.accepted_document_types ?? []).filter((type) =>
        (UNDERWRITING_DOCUMENT_TYPES as readonly string[]).includes(type),
      ),
    })),
    attachments: bundle.attachments,
    packetRecord: bundle.packetRecord
      ? {
          status: bundle.packetRecord.status,
          readiness_version: bundle.packetRecord.readiness_version,
          packet_version: bundle.packetRecord.packet_version,
          packet_hash: bundle.packetRecord.packet_hash,
          source_fingerprint: bundle.packetRecord.source_fingerprint,
          finalized_at: bundle.packetRecord.finalized_at,
          reopened_at: bundle.packetRecord.reopened_at,
        }
      : null,
  };
}

async function sha256Json(value: unknown) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function packetContext(
  supabase: Awaited<ReturnType<typeof requireStaff>>['supabase'],
  profileId: string,
) {
  const [profileResult, factsResult, appointmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,first_name,last_name,email,phone,timezone,created_at,updated_at')
      .eq('id', profileId)
      .single(),
    supabase
      .from('owner_facts')
      .select(
        'id,field,value,status,confidence,source,source_page,source_excerpt,source_attachment_id,mineral_interest_id,created_at,updated_at',
      )
      .eq('profile_id', profileId)
      .in('status', ['candidate', 'confirmed'])
      .order('created_at', { ascending: true }),
    supabase
      .from('appointments')
      .select('id,ghl_appointment_id,starts_at,ends_at,timezone,status,created_at')
      .eq('profile_id', profileId)
      .order('starts_at', { ascending: false }),
  ]);
  for (const result of [profileResult, factsResult, appointmentsResult]) {
    if (result.error) throw result.error;
  }
  return {
    profile: profileResult.data,
    facts: factsResult.data ?? [],
    appointments: appointmentsResult.data ?? [],
  };
}

async function auditAction(args: {
  actorUserId: string;
  profileId: string;
  eventType: string;
  targetType: string;
  targetId?: string | null;
  metadata: Record<string, unknown>;
}) {
  await auditStaffCaseEvent({
    actorUserId: args.actorUserId,
    profileId: args.profileId,
    eventType: args.eventType,
    targetType: args.targetType,
    targetId: args.targetId,
    metadata: args.metadata,
  });
}

export const GET: APIRoute = async (context) => {
  try {
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const bundle = await loadUnderwritingPacket(supabase, profileId, { reconcile: true });
    await auditAction({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_underwriting_packet_viewed',
      targetType: 'underwriting_packet',
      targetId: profileId,
      metadata: {
        staffRole: staff.role,
        readinessStatus: bundle.packet.readinessStatus,
        blockerCount: bundle.packet.blockers.length,
        requirementCount: bundle.packet.requirements.length,
      },
    });
    const processingAvailable = await documentWorkerAvailable();
    return json({
      ok: true,
      ...packetResponse(bundle),
      processing: { available: processingAvailable, uploadsEnabled: processingAvailable },
    });
  } catch (error) {
    return safeError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-underwriting-packet:${clientKey(context)}`, 60, 10 * 60_000);
    const parsed = ActionSchema.safeParse(await context.request.json());
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_underwriting_packet_action' }, { status: 400 });
    }
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const actionData = parsed.data;
    const action = actionData.action as UnderwritingPacketAction;
    if (!canStaffPerformPacketAction(staff.role, action)) {
      return json({ ok: false, error: 'underwriting_action_forbidden' }, { status: 403 });
    }

    let bundle = await loadUnderwritingPacket(supabase, profileId, { reconcile: true });
    if (actionData.action === 'verify') {
      const requirementId = actionData.requirementId;
      const attachmentId = actionData.attachmentId;
      const requirement = bundle.requirements.find((item) => item.id === requirementId);
      if (!requirement) {
        return json({ ok: false, error: 'underwriting_requirement_not_found' }, { status: 404 });
      }
      const attachment = bundle.attachments.find(
        (item) =>
          item.id === attachmentId &&
          item.status === 'ready' &&
          (requirement.accepted_document_types ?? []).includes(item.document_type || '') &&
          (!requirement.mineral_interest_id ||
            item.mineral_interest_id === requirement.mineral_interest_id),
      );
      if (!attachment) {
        return json({ ok: false, error: 'matching_ready_document_required' }, { status: 400 });
      }
      const now = new Date().toISOString();
      const result = await supabase
        .from('underwriting_document_requirements')
        .update({
          status: 'verified',
          attachment_id: attachment.id,
          verified_by: staff.id,
          verified_at: now,
          waived_by: null,
          waived_at: null,
          waiver_reason: null,
        })
        .eq('id', requirement.id!)
        .eq('profile_id', profileId);
      if (result.error) throw result.error;
      await auditAction({
        actorUserId: user.id,
        profileId,
        eventType: 'staff_underwriting_requirement_verified',
        targetType: 'underwriting_document_requirement',
        targetId: requirement.id,
        metadata: {
          staffRole: staff.role,
          requirementKey: requirement.requirement_key,
          attachmentId: attachment.id,
          documentType: attachment.document_type,
        },
      });
    } else if (actionData.action === 'waive') {
      const requirementId = actionData.requirementId;
      const waiverReason = actionData.reason;
      const requirement = bundle.requirements.find((item) => item.id === requirementId);
      if (!requirement) {
        return json({ ok: false, error: 'underwriting_requirement_not_found' }, { status: 404 });
      }
      const now = new Date().toISOString();
      const result = await supabase
        .from('underwriting_document_requirements')
        .update({
          status: 'waived',
          attachment_id: null,
          verified_by: null,
          verified_at: null,
          waived_by: staff.id,
          waived_at: now,
          waiver_reason: waiverReason,
        })
        .eq('id', requirement.id!)
        .eq('profile_id', profileId);
      if (result.error) throw result.error;
      await auditAction({
        actorUserId: user.id,
        profileId,
        eventType: 'staff_underwriting_requirement_waived',
        targetType: 'underwriting_document_requirement',
        targetId: requirement.id,
        metadata: {
          staffRole: staff.role,
          requirementKey: requirement.requirement_key,
          reason: waiverReason,
        },
      });
    } else if (actionData.action === 'reopen_requirement') {
      const requirementId = actionData.requirementId;
      const requirement = bundle.requirements.find((item) => item.id === requirementId);
      if (!requirement) {
        return json({ ok: false, error: 'underwriting_requirement_not_found' }, { status: 404 });
      }
      const result = await supabase
        .from('underwriting_document_requirements')
        .update({
          status: 'needed',
          attachment_id: null,
          verified_by: null,
          verified_at: null,
          waived_by: null,
          waived_at: null,
          waiver_reason: null,
        })
        .eq('id', requirement.id!)
        .eq('profile_id', profileId);
      if (result.error) throw result.error;
      await auditAction({
        actorUserId: user.id,
        profileId,
        eventType: 'staff_underwriting_requirement_reopened',
        targetType: 'underwriting_document_requirement',
        targetId: requirement.id,
        metadata: { staffRole: staff.role, requirementKey: requirement.requirement_key },
      });
    } else if (actionData.action === 'confirm_fact' || actionData.action === 'reject_fact') {
      const nextStatus = actionData.action === 'confirm_fact' ? 'confirmed' : 'rejected';
      const factResult = await supabase
        .from('owner_facts')
        .select('id,field,status')
        .eq('id', actionData.factId)
        .eq('profile_id', profileId)
        .maybeSingle();
      if (factResult.error) throw factResult.error;
      if (!factResult.data) {
        return json({ ok: false, error: 'owner_fact_not_found' }, { status: 404 });
      }
      const updateResult = await supabase
        .from('owner_facts')
        .update({
          status: nextStatus,
          confirmed_at: nextStatus === 'confirmed' ? new Date().toISOString() : null,
        })
        .eq('id', actionData.factId)
        .eq('profile_id', profileId)
        .in('status', ['candidate', 'confirmed']);
      if (updateResult.error) throw updateResult.error;
      await auditAction({
        actorUserId: user.id,
        profileId,
        // Keep the event names explicit for audit consumers and static policy checks:
        // eventType: 'staff_underwriting_fact_confirmed'
        // eventType: 'staff_underwriting_fact_rejected'
        eventType:
          nextStatus === 'confirmed'
            ? 'staff_underwriting_fact_confirmed'
            : 'staff_underwriting_fact_rejected',
        targetType: 'owner_fact',
        targetId: actionData.factId,
        metadata: {
          staffRole: staff.role,
          field: factResult.data.field,
          previousStatus: factResult.data.status,
          nextStatus,
        },
      });
    } else if (actionData.action === 'finalize') {
      if (!bundle.packet.canFinalize || bundle.packet.blockers.length) {
        return json(
          {
            ok: false,
            error: 'underwriting_packet_blocked',
            blockers: bundle.packet.blockers,
          },
          { status: 409 },
        );
      }
      if (!bundle.packet.sourceFingerprint) {
        return json(
          { ok: false, error: 'underwriting_source_fingerprint_unavailable' },
          { status: 409 },
        );
      }
      const finalizedAt = new Date().toISOString();
      const context = await packetContext(supabase, profileId);
      const profileRow = context.profile as {
        id: string;
        first_name?: string | null;
        last_name?: string | null;
      } | null;
      const ownerObjective = context.facts.find((fact) =>
        ['decision_goal', 'owner_objective', 'assessment_details'].includes(fact.field),
      );
      const packetSnapshot = {
        version: PACKET_VERSION,
        readinessVersion: READINESS_VERSION,
        sourceFingerprint: bundle.packet.sourceFingerprint,
        owner: {
          id: profileRow?.id ?? profileId,
          name: profileRow
            ? [profileRow.first_name, profileRow.last_name].filter(Boolean).join(' ')
            : 'Owner profile unavailable',
          objective: ownerObjective?.value ?? null,
        },
        appointmentContext: context.appointments,
        situations: bundle.packet.situations,
        properties: bundle.interests,
        facts: context.facts.map((fact) => ({
          id: fact.id,
          field: fact.field,
          value: fact.value,
          status: fact.status,
          confidence: fact.confidence,
          source: fact.source,
          sourcePage: fact.source_page,
          sourceExcerpt: fact.source_excerpt,
          sourceAttachmentId: fact.source_attachment_id,
          mineralInterestId: fact.mineral_interest_id,
          updatedAt: fact.updated_at,
        })),
        documentInventory: bundle.attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.original_name,
          documentType: attachment.document_type,
          status: attachment.status,
          mineralInterestId: attachment.mineral_interest_id,
          secureSourcePath: `/api/staff/documents/${attachment.id}`,
        })),
        requirements: bundle.packet.requirements.map((item) => ({
          requirementKey: item.requirementKey,
          mineralInterestId: item.mineralInterestId,
          label: item.label,
          required: item.required,
          requirementLevel: item.requirementLevel,
          status: item.effectiveStatus,
          attachmentId: item.attachmentId,
          verifiedAt: item.verifiedAt,
          waivedAt: item.waivedAt,
        })),
        missingItems: bundle.packet.requirements
          .filter((item) =>
            ['missing', 'processing', 'uploaded', 'rejected'].includes(item.effectiveStatus),
          )
          .map((item) => ({ requirementKey: item.requirementKey, status: item.effectiveStatus })),
        waivedItems: bundle.requirements
          .filter((item) => item.status === 'waived')
          .map((item) => ({
            requirementKey: item.requirement_key,
            reason: item.waiver_reason,
            waivedBy: item.waived_by,
            waivedAt: item.waived_at,
          })),
        risks: bundle.workspace?.risk_flags ?? [],
        staffBrief: bundle.workspace?.underwriter_brief ?? '',
        counts: bundle.packet.counts,
        finalizedAt,
      };
      const packetHash = await sha256Json(packetSnapshot);
      const result = await supabase.rpc('finalize_underwriting_packet', {
        p_profile_id: profileId,
        p_staff_id: staff.id,
        p_readiness_version: READINESS_VERSION,
        p_packet_version: PACKET_VERSION,
        p_packet_hash: packetHash,
        p_source_fingerprint: bundle.packet.sourceFingerprint,
        p_packet_snapshot: packetSnapshot,
        p_finalized_at: finalizedAt,
      });
      if (result.error) throw result.error;
      await auditAction({
        actorUserId: user.id,
        profileId,
        eventType: 'staff_underwriting_packet_finalized',
        targetType: 'underwriting_packet',
        targetId: profileId,
        metadata: {
          staffRole: staff.role,
          sourceFingerprint: bundle.packet.sourceFingerprint,
          packetHash,
          readinessVersion: READINESS_VERSION,
          packetVersion: PACKET_VERSION,
          requirementCount: bundle.packet.requirements.length,
        },
      });
    } else if (actionData.action === 'reopen_packet') {
      const reopenReason = actionData.reason;
      const reopenedAt = new Date().toISOString();
      if (!bundle.packet.sourceFingerprint) {
        return json(
          { ok: false, error: 'underwriting_source_fingerprint_unavailable' },
          { status: 409 },
        );
      }
      const result = await supabase.rpc('reopen_underwriting_packet', {
        p_profile_id: profileId,
        p_staff_id: staff.id,
        p_readiness_version: READINESS_VERSION,
        p_packet_version: PACKET_VERSION,
        p_source_fingerprint: bundle.packet.sourceFingerprint,
        p_packet_snapshot: bundle.packetRecord?.packet_snapshot ?? {},
        p_blocker_snapshot: bundle.packet.blockers,
        p_reopen_reason: reopenReason,
        p_reopened_at: reopenedAt,
      });
      if (result.error) throw result.error;
      await auditAction({
        actorUserId: user.id,
        profileId,
        eventType: 'staff_underwriting_packet_reopened',
        targetType: 'underwriting_packet',
        targetId: profileId,
        metadata: { staffRole: staff.role, reason: reopenReason },
      });
    }

    bundle = await loadUnderwritingPacket(supabase, profileId, { reconcile: false });
    if (
      actionData.action === 'finalize' ||
      actionData.action === 'reopen_packet' ||
      actionData.action === 'confirm_fact' ||
      actionData.action === 'reject_fact'
    ) {
      await syncVerifiedOwnerToGhl(profileId).catch((error) =>
        console.error(
          '[GHL underwriting readiness sync]',
          error instanceof Error ? error.message : 'sync_failed',
        ),
      );
    }
    if (actionData.action === 'finalize') {
      await sendGa4ServerEvent({
        event: 'case_ready',
        profileId,
        params: { packet_version: PACKET_VERSION, readiness_version: READINESS_VERSION },
      }).catch((error) =>
        console.error(
          '[GA4 case-ready event]',
          error instanceof Error ? error.message : 'send_failed',
        ),
      );
    }
    const processingAvailable = await documentWorkerAvailable();
    return json({
      ok: true,
      ...packetResponse(bundle),
      processing: { available: processingAvailable, uploadsEnabled: processingAvailable },
    });
  } catch (error) {
    return safeError(error);
  }
};
