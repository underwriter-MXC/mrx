import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  DEFAULT_OWNER_CASE_STAGE_NAMES,
  OWNER_CASE_RATINGS,
  OWNER_CASE_STATUSES,
  auditStaffCaseEvent,
  requireStaff,
  requireStaffCaseAccess,
  resolveOwnerCaseStageMapping,
} from '../../../../../lib/platform/staff';
import { ghlConfigured, syncGhlOwnerCaseOpportunity } from '../../../../../lib/platform/ghl';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../../lib/platform/security';

// Underwriting gate (v1): this route intentionally does NOT accept or write
// `valuation_status`. Production valuation remains blocked until a qualified
// human approves the methodology. A separate, role-gated transition endpoint
// ships in the next release and must enforce: underwriter/admin only, no skip
// from blocked to approved, prerequisite/evidence/risk checks, and audit of
// old/new/reason. Material post-approval changes revoke approval.

const RiskFlagSchema = z.object({
  code: z.string().trim().min(1).max(100),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().trim().min(1).max(2_000),
  status: z.enum(['open', 'reviewing', 'resolved']).default('open'),
});

const WorkspaceSchema = z.object({
  status: z.enum(OWNER_CASE_STATUSES).default('intake'),
  caseRating: z.enum(OWNER_CASE_RATINGS).default('unrated'),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
  intakeConfidenceScore: z.number().int().min(0).max(100).nullable().optional(),
  verificationConfidence: z.enum(['unknown', 'low', 'medium', 'high']).default('unknown'),
  underwriterBrief: z.string().max(50_000).default(''),
  dataPullBrief: z.string().max(50_000).default(''),
  confidenceGaps: z.string().max(10_000).default(''),
  recommendedFocus: z.string().max(10_000).default(''),
  riskFlags: z.array(RiskFlagSchema).max(100).default([]),
  opportunityValueCents: z.number().int().min(0).nullable().optional(),
  opportunitySizeLabel: z.string().trim().max(120).optional(),
  mineralRightsCount: z.number().int().min(0).nullable().optional(),
  lastContactAt: z.string().datetime().nullable().optional(),
});

const workspaceFields =
  'profile_id,status,case_rating,priority,intake_confidence_score,verification_confidence,underwriter_brief,data_pull_brief,confidence_gaps,recommended_focus,risk_flags,canonical_extraction_policy,valuation_status,opportunity_value_cents,opportunity_size_label,mineral_rights_count,last_contact_at,ghl_opportunity_id,ghl_pipeline_id,ghl_pipeline_stage_id,ghl_pipeline_name,ghl_pipeline_stage_name,ghl_pipeline_status,created_by,updated_by,created_at,updated_at';

export const GET: APIRoute = async (context) => {
  try {
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data, error } = await supabase
      .from('internal_case_workspaces')
      .select(workspaceFields)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_internal_workspace_viewed',
      targetType: 'internal_case_workspace',
      targetId: profileId,
      metadata: { staffRole: staff.role, exists: Boolean(data) },
    });
    return json({ ok: true, workspace: data ?? null });
  } catch (error) {
    return safeError(error);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-workspace:${clientKey(context)}`, 60, 10 * 60_000);
    const parsed = WorkspaceSchema.safeParse(await context.request.json());
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_internal_workspace' }, { status: 400 });
    }
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name,last_name,ghl_contact_id')
      .eq('id', profileId)
      .single();
    if (profileError) throw profileError;
    const configuredStage = resolveOwnerCaseStageMapping()[parsed.data.status];
    const defaultStage = DEFAULT_OWNER_CASE_STAGE_NAMES[parsed.data.status];
    const pipelineName = configuredStage?.pipelineName || defaultStage?.pipelineName || null;
    const pipelineStageName = configuredStage?.stageName || defaultStage?.stageName || null;
    const initialGhlStatus = !profile.ghl_contact_id
      ? 'contact_not_linked'
      : !ghlConfigured()
        ? 'not_configured'
        : configuredStage || defaultStage
          ? 'pending'
          : 'stage_unmapped';
    const values = {
      status: parsed.data.status,
      case_rating: parsed.data.caseRating,
      priority: parsed.data.priority,
      intake_confidence_score: parsed.data.intakeConfidenceScore ?? null,
      verification_confidence: parsed.data.verificationConfidence,
      underwriter_brief: parsed.data.underwriterBrief,
      data_pull_brief: parsed.data.dataPullBrief,
      confidence_gaps: parsed.data.confidenceGaps,
      recommended_focus: parsed.data.recommendedFocus,
      risk_flags: parsed.data.riskFlags,
      opportunity_value_cents: parsed.data.opportunityValueCents ?? null,
      opportunity_size_label: parsed.data.opportunitySizeLabel || null,
      mineral_rights_count: parsed.data.mineralRightsCount ?? null,
      last_contact_at: parsed.data.lastContactAt ?? null,
      ghl_pipeline_id: configuredStage?.pipelineId || null,
      ghl_pipeline_stage_id: configuredStage?.stageId || null,
      ghl_pipeline_name: pipelineName,
      ghl_pipeline_stage_name: pipelineStageName,
      ghl_pipeline_status: initialGhlStatus,
      updated_by: staff.id,
    };
    const { data: existing, error: lookupError } = await supabase
      .from('internal_case_workspaces')
      .select(workspaceFields)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    const query = existing
      ? supabase.from('internal_case_workspaces').update(values).eq('profile_id', profileId)
      : supabase.from('internal_case_workspaces').insert({
          profile_id: profileId,
          ...values,
          created_by: staff.id,
        });
    let { data: workspace, error } = await query.select(workspaceFields).single();
    if (error) throw error;
    let ghlSync = { ok: false, status: initialGhlStatus };
    if (profile.ghl_contact_id && ghlConfigured() && (configuredStage || defaultStage)) {
      try {
        const synced = await syncGhlOwnerCaseOpportunity({
          contactId: profile.ghl_contact_id,
          opportunityName:
            `${profile.first_name || ''} ${profile.last_name || ''} mineral-rights opportunity`.trim(),
          pipelineId: configuredStage?.pipelineId,
          pipelineStageId: configuredStage?.stageId,
          pipelineName,
          stageName: pipelineStageName,
          monetaryValue:
            parsed.data.opportunityValueCents == null
              ? null
              : parsed.data.opportunityValueCents / 100,
          status:
            parsed.data.status === 'closed'
              ? 'won'
              : parsed.data.status === 'lost'
                ? 'lost'
                : 'open',
        });
        const ghlValues = synced
          ? {
              ghl_opportunity_id: synced.opportunityId || existing?.ghl_opportunity_id || null,
              ghl_pipeline_id: synced.pipelineId,
              ghl_pipeline_stage_id: synced.pipelineStageId,
              ghl_pipeline_name: synced.pipelineName || pipelineName,
              ghl_pipeline_stage_name: synced.stageName || pipelineStageName,
              ghl_pipeline_status: 'synced',
            }
          : { ghl_pipeline_status: 'stage_unmapped' };
        const refreshed = await supabase
          .from('internal_case_workspaces')
          .update(ghlValues)
          .eq('profile_id', profileId)
          .select(workspaceFields)
          .single();
        if (refreshed.error) throw refreshed.error;
        workspace = refreshed.data;
        ghlSync = { ok: Boolean(synced), status: ghlValues.ghl_pipeline_status };
      } catch (ghlError) {
        console.error(
          '[GHL owner-case pipeline sync]',
          ghlError instanceof Error ? ghlError.message : 'failed',
        );
        const failed = await supabase
          .from('internal_case_workspaces')
          .update({ ghl_pipeline_status: 'sync_failed' })
          .eq('profile_id', profileId)
          .select(workspaceFields)
          .single();
        if (!failed.error) workspace = failed.data;
        ghlSync = { ok: false, status: 'sync_failed' };
      }
    }
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: existing ? 'staff_internal_workspace_updated' : 'staff_internal_workspace_created',
      targetType: 'internal_case_workspace',
      targetId: profileId,
      metadata: {
        staffRole: staff.role,
        status: parsed.data.status,
        caseRating: parsed.data.caseRating,
        priority: parsed.data.priority,
        riskFlagCount: parsed.data.riskFlags.length,
        ghlPipelineStatus: ghlSync.status,
      },
    });
    return json({ ok: true, workspace, ghlSync }, { status: existing ? 200 : 201 });
  } catch (error) {
    return safeError(error);
  }
};
