import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  buildOutcomeAnalyticsParams,
  buildOutcomeDedupKey,
  buildPrivacySafeAttributionContext,
  MRX_OUTCOME_ATTRIBUTION_CONTRACT_VERSION,
  type MrxOutcomeEvent,
  type OutcomeEvidenceLabel,
} from '../../../../../lib/platform/attribution-outcomes';
import { sendGa4ServerEvent } from '../../../../../lib/platform/analytics';
import { requireStaff, requireStaffCaseAccess } from '../../../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../../lib/platform/security';

const ActionId = z.string().trim().min(8).max(160);

const RelevantCaseAction = z
  .object({
    action: z.literal('record_relevant_case_completed'),
    actionId: ActionId,
    evidenceSource: z.enum(['required_case_fields', 'authorized_staff_attestation']),
    occurredAt: z.string().datetime(),
    evidenceLabel: z.literal('actual'),
  })
  .strict();

const CompleteHumanReviewAction = z
  .object({
    action: z.literal('complete_human_review'),
    actionId: ActionId,
    reviewScope: z.enum(['case_review', 'offer_review', 'title_review']).default('case_review'),
    occurredAt: z.string().datetime(),
    evidenceLabel: z.literal('actual'),
  })
  .strict();

const AgreedNextStepAction = z
  .object({
    action: z.literal('record_agreed_next_step'),
    actionId: ActionId,
    agreementStatus: z.literal('agreed'),
    nextStepType: z.enum([
      'book_underwriter_call',
      'request_documents',
      'send_offer_packet',
      'owner_requested_follow_up',
    ]),
    occurredAt: z.string().datetime(),
    evidenceLabel: z.literal('actual'),
  })
  .strict();

const OutcomeSchema = z.discriminatedUnion('action', [
  RelevantCaseAction,
  CompleteHumanReviewAction,
  AgreedNextStepAction,
]);

type OutcomeAction = z.infer<typeof OutcomeSchema>;

type Supabase = Awaited<ReturnType<typeof requireStaff>>['supabase'];

function eventForAction(action: OutcomeAction): MrxOutcomeEvent {
  if (action.action === 'record_relevant_case_completed') return 'relevant_case_completed';
  if (action.action === 'complete_human_review') return 'case_human_review_completed';
  return 'case_agreed_next_step';
}

function auditEventForAction(action: OutcomeAction) {
  if (action.action === 'record_relevant_case_completed') return 'staff_owner_relevant_case_completed';
  if (action.action === 'complete_human_review') return 'staff_owner_case_review_completed';
  return 'staff_owner_case_agreed_next_step';
}

function actionMetadata(action: OutcomeAction) {
  if (action.action === 'record_relevant_case_completed') {
    return { evidenceSource: action.evidenceSource };
  }
  if (action.action === 'complete_human_review') return { reviewScope: action.reviewScope };
  return { agreementStatus: action.agreementStatus, nextStepType: action.nextStepType, agreedNextStep: true };
}

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function findExisting(args: {
  supabase: Supabase;
  profileId: string;
  eventType: string;
  dedupKey: string;
}) {
  const result = await args.supabase
    .from('audit_events')
    .select('id,created_at,metadata')
    .eq('profile_id', args.profileId)
    .eq('event_type', args.eventType)
    .eq('metadata->>dedupKey', args.dedupKey)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data ?? null;
}

async function requireRequiredCaseEvidence(args: {
  supabase: Supabase;
  profileId: string;
  evidenceSource: string;
}) {
  if (args.evidenceSource === 'authorized_staff_attestation') return null;
  const [interestResult, objectiveResult] = await Promise.all([
    args.supabase
      .from('mineral_interests')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', args.profileId),
    args.supabase
      .from('owner_facts')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', args.profileId)
      .eq('status', 'confirmed')
      .in('field', ['decision_goal', 'owner_objective', 'assessment_details']),
  ]);
  if (interestResult.error) throw interestResult.error;
  if (objectiveResult.error) throw objectiveResult.error;
  return (interestResult.count ?? 0) > 0 && (objectiveResult.count ?? 0) > 0
    ? null
    : 'required_case_fields_unavailable';
}

async function latestPriorOutcome(args: {
  supabase: Supabase;
  profileId: string;
  eventType: string;
}) {
  const result = await args.supabase
    .from('audit_events')
    .select('id,metadata')
    .eq('profile_id', args.profileId)
    .eq('event_type', args.eventType)
    .eq('metadata->>evidenceLabel', 'actual')
    .order('metadata->>occurredAt', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data ? metadataObject(result.data.metadata) : null;
}

async function outcomeSequenceError(args: {
  supabase: Supabase;
  profileId: string;
  action: OutcomeAction;
}) {
  if (args.action.action === 'record_relevant_case_completed') {
    return requireRequiredCaseEvidence({
      supabase: args.supabase,
      profileId: args.profileId,
      evidenceSource: args.action.evidenceSource,
    });
  }
  const priorEventType =
    args.action.action === 'complete_human_review'
      ? 'staff_owner_relevant_case_completed'
      : 'staff_owner_case_review_completed';
  const prior = await latestPriorOutcome({
    supabase: args.supabase,
    profileId: args.profileId,
    eventType: priorEventType,
  });
  if (!prior) {
    return args.action.action === 'complete_human_review'
      ? 'relevant_case_completion_required'
      : 'completed_human_review_required';
  }
  const priorOccurredAt = typeof prior.occurredAt === 'string' ? Date.parse(prior.occurredAt) : NaN;
  const occurredAt = Date.parse(args.action.occurredAt);
  if (!Number.isFinite(priorOccurredAt) || priorOccurredAt > occurredAt) {
    return 'outcome_sequence_out_of_order';
  }
  return null;
}

async function updateAnalyticsStatus(args: {
  supabase: Supabase;
  auditId: string;
  metadata: Record<string, unknown>;
  analyticsStatus: 'sent' | 'suppressed_consent' | 'failed';
  analyticsError?: string;
}) {
  const result = await args.supabase
    .from('audit_events')
    .update({
      metadata: {
        ...args.metadata,
        analyticsStatus: args.analyticsStatus,
        ...(args.analyticsError ? { analyticsError: args.analyticsError.slice(0, 120) } : {}),
      },
    })
    .eq('id', args.auditId);
  if (result.error) throw result.error;
}

async function deliverAnalytics(args: {
  supabase: Supabase;
  auditId: string;
  metadata: Record<string, unknown>;
  event: MrxOutcomeEvent;
  profileId: string;
  evidenceLabel: OutcomeEvidenceLabel;
  occurredAt: string;
  attribution: Awaited<ReturnType<typeof buildPrivacySafeAttributionContext>>;
  extra: Record<string, unknown>;
}) {
  if (args.attribution.analyticsConsent !== 'granted') {
    await updateAnalyticsStatus({
      supabase: args.supabase,
      auditId: args.auditId,
      metadata: args.metadata,
      analyticsStatus: 'suppressed_consent',
    });
    return 'suppressed_consent' as const;
  }
  const analyticsParams = await buildOutcomeAnalyticsParams({
    profileId: args.profileId,
    event: args.event,
    evidenceLabel: args.evidenceLabel,
    occurredAt: args.occurredAt,
    attribution: args.attribution,
    extra: args.extra,
  });
  try {
    const result = await sendGa4ServerEvent({
      event: args.event,
      profileId: args.profileId,
      params: analyticsParams,
      analyticsConsent: args.attribution.analyticsConsent,
    });
    if (!result.sent) {
      await updateAnalyticsStatus({
        supabase: args.supabase,
        auditId: args.auditId,
        metadata: args.metadata,
        analyticsStatus: 'failed',
        analyticsError: result.reason,
      });
      return result.reason;
    }
    await updateAnalyticsStatus({
      supabase: args.supabase,
      auditId: args.auditId,
      metadata: args.metadata,
      analyticsStatus: 'sent',
    });
    return 'sent' as const;
  } catch (error) {
    await updateAnalyticsStatus({
      supabase: args.supabase,
      auditId: args.auditId,
      metadata: args.metadata,
      analyticsStatus: 'failed',
      analyticsError: error instanceof Error ? error.message : 'send_failed',
    });
    return 'failed' as const;
  }
}

async function loadAttribution(args: { supabase: Supabase; profileId: string }) {
  const consentResult = await args.supabase
    .from('consent_receipts')
    .select('channel,purpose,source_url,utm,created_at,granted')
    .eq('profile_id', args.profileId)
    .order('created_at', { ascending: false });
  if (consentResult.error) throw consentResult.error;
  return buildPrivacySafeAttributionContext({
    profileId: args.profileId,
    receipts: consentResult.data ?? [],
    refreshedAt: new Date().toISOString(),
  });
}

export function outcomeReport(rows: Array<{ event_type?: string | null; metadata?: unknown }>) {
  const byKey = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const metadata = metadataObject(row.metadata);
    if (metadata.evidenceLabel !== 'actual') continue;
    const dedupKey = typeof metadata.dedupKey === 'string' ? metadata.dedupKey : '';
    if (!dedupKey) continue;
    byKey.set(`${row.event_type}:${dedupKey}`, metadata);
  }
  const values = [...byKey.values()];
  const hasEvent = (event: string) => values.some((item) => item.event === event);
  const hasHistory = values.length > 0;
  const relevantCompletedCase = hasEvent('relevant_case_completed') ? 1 : 0;
  const completedHumanReview = hasEvent('case_human_review_completed') ? 1 : 0;
  const agreedNextStepCase = hasEvent('case_agreed_next_step') ? 1 : 0;
  const byVerifiedSource: Record<string, { completedHumanReview: 0 | 1; agreedNextStepCase: 0 | 1 }> = {};
  for (const item of values) {
    if (item.attributionLabel !== 'actual') continue;
    const source = typeof item.sourcePath === 'string' ? item.sourcePath : 'unavailable';
    if (source === 'unavailable') continue;
    byVerifiedSource[source] ??= { completedHumanReview: 0, agreedNextStepCase: 0 };
    if (item.event === 'case_human_review_completed') byVerifiedSource[source].completedHumanReview = 1;
    if (item.event === 'case_agreed_next_step') byVerifiedSource[source].agreedNextStepCase = 1;
  }
  return {
    formula: 'agreed-next-step cases / completed human reviews',
    observationCoverage: hasHistory ? 'instrumented' : 'unavailable',
    relevantCompletedCase: hasHistory ? relevantCompletedCase : 'unavailable',
    completedHumanReview: hasHistory ? completedHumanReview : 'unavailable',
    agreedNextStepCase: hasHistory ? agreedNextStepCase : 'unavailable',
    conversionRate:
      completedHumanReview > 0 ? agreedNextStepCase / completedHumanReview : 'unavailable',
    byVerifiedSource,
  };
}

export const GET: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-case-outcome-report:${clientKey(context)}`, 40, 10 * 60_000);
    const profileId = context.params.profileId!;
    const { staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const result = await supabase
      .from('audit_events')
      .select('event_type,metadata,created_at')
      .eq('profile_id', profileId)
      .in('event_type', [
        'staff_owner_relevant_case_completed',
        'staff_owner_case_review_completed',
        'staff_owner_case_agreed_next_step',
      ])
      .order('created_at', { ascending: true });
    if (result.error) throw result.error;
    return json({ ok: true, report: outcomeReport(result.data ?? []) });
  } catch (error) {
    return safeError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-case-outcome:${clientKey(context)}`, 40, 10 * 60_000);
    const parsed = OutcomeSchema.safeParse(await context.request.json());
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_case_outcome_action' }, { status: 400 });
    }
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);

    const action = parsed.data;
    if (Date.parse(action.occurredAt) > Date.now() + 60_000) {
      return json({ ok: false, error: 'case_outcome_occurred_at_in_future' }, { status: 400 });
    }
    const event = eventForAction(action);
    const eventType = auditEventForAction(action);
    const dedupKey = await buildOutcomeDedupKey({ profileId, event, actionId: action.actionId });
    const existing = await findExisting({ supabase, profileId, eventType, dedupKey });
    if (existing) {
      const existingMetadata = metadataObject(existing.metadata);
      const analyticsStatus = String(existingMetadata.analyticsStatus || 'unknown');
      return json({
        ok: true,
        deduped: true,
        eventType,
        recordedAt: existing.created_at,
        analyticsStatus,
        reconciliationRequired: ['pending', 'failed', 'not_configured', 'unknown'].includes(
          analyticsStatus,
        ),
      });
    }

    const sequenceError = await outcomeSequenceError({ supabase, profileId, action });
    if (sequenceError) return json({ ok: false, error: sequenceError }, { status: 409 });

    const attribution = await loadAttribution({ supabase, profileId });
    const evidenceLabel = action.evidenceLabel as OutcomeEvidenceLabel;
    const metadata = {
      contractVersion: MRX_OUTCOME_ATTRIBUTION_CONTRACT_VERSION,
      dedupKey,
      actionId: action.actionId,
      event,
      occurredAt: action.occurredAt,
      evidenceLabel,
      attributionLabel: attribution.attributionLabel,
      analyticsConsent: attribution.analyticsConsent,
      sourceRefreshedAt: attribution.sourceRefreshedAt,
      sourcePath: attribution.sourcePath,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      staffRole: staff.role,
      analyticsStatus: 'pending',
      ...actionMetadata(action),
    } satisfies Record<string, unknown>;

    const insertResult = await supabase
      .from('audit_events')
      .insert({
        actor_user_id: user.id,
        profile_id: profileId,
        event_type: eventType,
        target_type: 'owner_case_outcome',
        target_id: profileId,
        metadata,
      })
      .select('id,created_at')
      .single();
    if (insertResult.error) {
      if ('code' in insertResult.error && insertResult.error.code === '23505') {
        const raced = await findExisting({ supabase, profileId, eventType, dedupKey });
        const raceMetadata = metadataObject(raced?.metadata);
        const analyticsStatus = String(raceMetadata.analyticsStatus || 'unknown');
        return json({
          ok: true,
          deduped: true,
          eventType,
          recordedAt: raced?.created_at ?? null,
          analyticsStatus,
          reconciliationRequired: ['pending', 'failed', 'not_configured', 'unknown'].includes(
            analyticsStatus,
          ),
        });
      }
      throw insertResult.error;
    }

    const analyticsStatus = await deliverAnalytics({
      supabase,
      auditId: insertResult.data.id,
      metadata,
      event,
      profileId,
      evidenceLabel,
      occurredAt: action.occurredAt,
      attribution,
      extra: actionMetadata(action),
    });

    return json({
      ok: true,
      deduped: false,
      analyticsStatus,
      eventType,
      event,
      occurredAt: action.occurredAt,
    });
  } catch (error) {
    return safeError(error);
  }
};
