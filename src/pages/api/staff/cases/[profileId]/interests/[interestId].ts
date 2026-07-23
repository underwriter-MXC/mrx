import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  auditStaffCaseEvent,
  requireStaff,
  requireStaffCaseAccess,
} from '../../../../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../../../lib/platform/security';

const OptionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const Schema = z.object({
  label: z.string().trim().min(1).max(160),
  state: OptionalText(80),
  county: OptionalText(120),
  legalDescription: OptionalText(2_000),
  townshipDistrict: OptionalText(240),
  taxParcelId: OptionalText(160),
  blockSection: OptionalText(240),
  abstractSurvey: OptionalText(240),
  sectionTownshipRange: OptionalText(240),
  ownershipType: OptionalText(80),
  netMineralAcres: OptionalText(80),
  grossAcresUnderLease: OptionalText(80),
  leaseStatus: z.enum(['yes', 'no', 'unknown']).default('unknown'),
  producingStatus: z.enum(['yes', 'no', 'unknown']).default('unknown'),
  recentCheckAmount: OptionalText(120),
  operator: OptionalText(160),
  leaseName: OptionalText(160),
  unknownFields: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  updateSource: z.enum([
    'owner_text',
    'owner_email',
    'owner_phone',
    'owner_document',
    'staff_research',
  ]),
  sourceNote: z.string().trim().max(2_000).optional(),
});

function numericValue(value: string | null | undefined) {
  const cleaned = String(value || '')
    .trim()
    .replaceAll(',', '');
  if (!cleaned || !/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

const interestFields =
  'id,profile_id,conversation_id,label,state,county,legal_description,parcel_reference,township_district,block_section,abstract_survey,section_township_range,ownership_type,net_mineral_acres,gross_acres_under_lease,lease_status,producing_status,recent_check_amount,operator,lease_name,unknown_fields,status,updated_at';

export const PUT: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-owner-profile-interest:${clientKey(context)}`, 60, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_owner_profile_update' }, { status: 400 });

    const profileId = context.params.profileId!;
    const interestId = context.params.interestId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);

    const { data: existing, error: lookupError } = await supabase
      .from('mineral_interests')
      .select('id,conversation_id')
      .eq('id', interestId)
      .eq('profile_id', profileId)
      .neq('status', 'archived')
      .single();
    if (lookupError) throw lookupError;

    const values = {
      label: parsed.data.label,
      state: parsed.data.state || null,
      county: parsed.data.county || null,
      legal_description: parsed.data.legalDescription || null,
      parcel_reference: parsed.data.taxParcelId || null,
      township_district: parsed.data.townshipDistrict || null,
      block_section: parsed.data.blockSection || null,
      abstract_survey: parsed.data.abstractSurvey || null,
      section_township_range: parsed.data.sectionTownshipRange || null,
      ownership_type: parsed.data.ownershipType || null,
      net_mineral_acres: numericValue(parsed.data.netMineralAcres),
      gross_acres_under_lease: numericValue(parsed.data.grossAcresUnderLease),
      lease_status: parsed.data.leaseStatus,
      producing_status: parsed.data.producingStatus,
      recent_check_amount: parsed.data.recentCheckAmount || null,
      operator: parsed.data.operator || null,
      lease_name: parsed.data.leaseName || null,
      unknown_fields: parsed.data.unknownFields,
    };
    const { data: interest, error: updateError } = await supabase
      .from('mineral_interests')
      .update(values)
      .eq('id', interestId)
      .eq('profile_id', profileId)
      .select(interestFields)
      .single();
    if (updateError) throw updateError;

    let conversationId = existing.conversation_id as string | null;
    if (!conversationId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('conversation_id')
        .eq('id', profileId)
        .single();
      conversationId = profile?.conversation_id || null;
    }
    if (conversationId) {
      const { error: factError } = await supabase.from('owner_facts').insert({
        conversation_id: conversationId,
        profile_id: profileId,
        mineral_interest_id: interestId,
        field: 'staff_profile_update',
        value: {
          updateSource: parsed.data.updateSource,
          sourceNote: parsed.data.sourceNote || null,
          propertyLabel: parsed.data.label,
          updatedFields: values,
          updatedByRole: staff.role,
        },
        source: 'staff',
        confidence: 1,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      });
      if (factError) throw factError;
    }

    const { data: remaining } = await supabase
      .from('mineral_interests')
      .select('unknown_fields')
      .eq('profile_id', profileId)
      .neq('status', 'archived');
    const remainingMissing = [
      ...new Set(
        (remaining ?? []).flatMap((item) =>
          Array.isArray(item.unknown_fields) ? item.unknown_fields : [],
        ),
      ),
    ];
    const workspaceValues = {
      confidence_gaps: remainingMissing.join('\n'),
      recommended_focus: remainingMissing.length
        ? 'Review the remaining owner-profile checklist and any new owner replies.'
        : 'Owner profile was updated from a staff-reviewed reply or source. Continue Senior Underwriter review.',
      last_contact_at: ['owner_text', 'owner_email', 'owner_phone'].includes(
        parsed.data.updateSource,
      )
        ? new Date().toISOString()
        : undefined,
      updated_by: staff.id,
    };
    await supabase
      .from('internal_case_workspaces')
      .update(workspaceValues)
      .eq('profile_id', profileId);
    if (!remainingMissing.length) {
      await supabase
        .from('internal_case_workspaces')
        .update({ status: 'underwriting', updated_by: staff.id })
        .eq('profile_id', profileId)
        .eq('status', 'needs_info');
    }

    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_owner_profile_interest_updated',
      targetType: 'mineral_interest',
      targetId: interestId,
      metadata: {
        staffRole: staff.role,
        updateSource: parsed.data.updateSource,
        remainingMissingCount: remainingMissing.length,
        ownerVisible: true,
      },
    });
    return json({ ok: true, interest, remainingMissing });
  } catch (error) {
    return safeError(error);
  }
};
