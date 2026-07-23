import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireOwnerProfileAccess } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import {
  persistGeographyResolution,
  publicGeography,
  resolveUSGeography,
} from '../../../lib/platform/geography';
import { syncVerifiedOwnerToGhl } from '../../../lib/platform/crm';
import { UNDERWRITING_SITUATIONS } from '../../../lib/platform/underwriting-packet';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const OptionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const Schema = z.object({
  label: OptionalText(160),
  locationDescription: OptionalText(2_000),
  state: OptionalText(80),
  county: OptionalText(120),
  townshipDistrict: OptionalText(240),
  taxParcelId: OptionalText(160),
  blockSection: OptionalText(240),
  abstractSurvey: OptionalText(240),
  sectionTownshipRange: OptionalText(240),
  netMineralAcres: z
    .union([z.string().trim().max(80), z.number().nonnegative()])
    .nullable()
    .optional(),
  grossAcresUnderLease: OptionalText(80),
  leaseStatus: z.enum(['yes', 'no', 'unknown']).nullable().optional(),
  producingStatus: z.enum(['yes', 'no', 'unknown']).nullable().optional(),
  recentCheckAmount: OptionalText(120),
  ownershipType: z
    .enum([
      'mineral_rights',
      'royalties_only',
      'overriding_royalties',
      'working_interest',
      'unknown',
    ])
    .nullable()
    .optional(),
  operator: OptionalText(160),
  leaseName: OptionalText(160),
  assessmentDetails: OptionalText(8_000),
  situationCode: z.enum(UNDERWRITING_SITUATIONS).nullable().optional(),
  unknownFields: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
  intakeVersion: z.string().trim().max(100).optional(),
  source: z
    .enum(['account_guided_intake', 'angela_post_signup', 'standalone_guided_intake'])
    .optional(),
});

function text(value: string | number | null | undefined) {
  return value == null ? '' : String(value).trim();
}

function numericValue(value: string | number | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = text(value).replaceAll(',', '');
  if (!cleaned || !/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function missingIntakeFields(data: z.infer<typeof Schema>) {
  const labels: Record<string, string> = {
    state: 'State where the minerals are located',
    county: 'County where the minerals are located',
    mineralLocation: 'Property location or legal description',
    townshipDistrict: 'Township or district name',
    taxParcelId: 'Tax parcel or other property identifier',
    netMineralAcres: 'Net mineral acres owned',
    recentCheckAmount: 'A recent royalty-check amount',
  };
  const missing: string[] = [];
  if (!text(data.state)) missing.push('State where the minerals are located');
  if (!text(data.county)) missing.push('County where the minerals are located');
  if (
    ![
      data.locationDescription,
      data.townshipDistrict,
      data.taxParcelId,
      data.blockSection,
      data.abstractSurvey,
      data.sectionTownshipRange,
    ].some((value) => text(value))
  )
    missing.push('Parcel number or legal/property description');
  if (!text(data.netMineralAcres)) missing.push('Net mineral acres owned');
  if (!data.leaseStatus || data.leaseStatus === 'unknown')
    missing.push('Whether the property is currently leased');
  if (data.leaseStatus === 'yes' && !text(data.grossAcresUnderLease))
    missing.push('Gross acres under lease');
  if (!data.producingStatus || data.producingStatus === 'unknown')
    missing.push('Whether the property is currently producing');
  if (data.producingStatus === 'yes' && !text(data.recentCheckAmount))
    missing.push('A recent royalty-check amount');
  if (!data.ownershipType || data.ownershipType === 'unknown')
    missing.push('Type of interest owned');
  return [
    ...new Set([...(data.unknownFields ?? []).map((field) => labels[field] || field), ...missing]),
  ];
}

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`account-mineral-interest:${clientKey(context)}`, 12, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_mineral_interest' }, { status: 400 });
    const session = await requireOwnerProfileAccess(context);
    const supabase = getSupabaseServer()!;

    const suppliedLocation = text(parsed.data.locationDescription);
    const locationDescription =
      suppliedLocation ||
      [
        text(parsed.data.county) && `${text(parsed.data.county)} County`,
        text(parsed.data.state),
        text(parsed.data.townshipDistrict),
        text(parsed.data.sectionTownshipRange),
      ]
        .filter(Boolean)
        .join(', ');
    const label =
      text(parsed.data.label) ||
      [text(parsed.data.county) && `${text(parsed.data.county)} County`, text(parsed.data.state)]
        .filter(Boolean)
        .join(', ') ||
      'Mineral interest - location to be confirmed';
    const legalDescription =
      [
        suppliedLocation,
        text(parsed.data.townshipDistrict) &&
          `Township/district: ${text(parsed.data.townshipDistrict)}`,
        text(parsed.data.blockSection) && `Block/section: ${text(parsed.data.blockSection)}`,
        text(parsed.data.abstractSurvey) && `Abstract/survey: ${text(parsed.data.abstractSurvey)}`,
        text(parsed.data.sectionTownshipRange) &&
          `Section/township/range: ${text(parsed.data.sectionTownshipRange)}`,
      ]
        .filter(Boolean)
        .join(' | ') || null;
    const missingFields = missingIntakeFields(parsed.data);

    let interestId: string | null = null;
    let geography = null;
    const resolution = locationDescription
      ? await resolveUSGeography(locationDescription, {
          scope: 'mineral_interest',
          mode: 'profile',
        })
      : null;

    if (resolution && resolution.status !== 'not_found') {
      const saved = await persistGeographyResolution({
        conversationId: session.conversationId,
        profileId: session.profileId,
        resolution,
        createNewMineralInterest: true,
      });
      interestId = saved.interestId;
      geography = publicGeography(resolution);
    }

    if (interestId) {
      const { error } = await supabase
        .from('mineral_interests')
        .update({
          label,
          state: text(parsed.data.state) || undefined,
          county: text(parsed.data.county) || undefined,
          operator: parsed.data.operator || null,
          lease_name: parsed.data.leaseName || null,
          legal_description: legalDescription,
          parcel_reference: parsed.data.taxParcelId || null,
          township_district: parsed.data.townshipDistrict || null,
          block_section: parsed.data.blockSection || null,
          abstract_survey: parsed.data.abstractSurvey || null,
          section_township_range: parsed.data.sectionTownshipRange || null,
          ownership_type: parsed.data.ownershipType || null,
          net_mineral_acres: numericValue(parsed.data.netMineralAcres),
          gross_acres_under_lease: numericValue(parsed.data.grossAcresUnderLease),
          lease_status: parsed.data.leaseStatus || 'unknown',
          producing_status: parsed.data.producingStatus || 'unknown',
          recent_check_amount: parsed.data.recentCheckAmount || null,
          raw_intake_answers: parsed.data,
          unknown_fields: missingFields,
        })
        .eq('id', interestId)
        .eq('profile_id', session.profileId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('mineral_interests')
        .insert({
          profile_id: session.profileId,
          conversation_id: session.conversationId,
          label,
          state: text(parsed.data.state) || null,
          county: text(parsed.data.county) || null,
          operator: parsed.data.operator || null,
          lease_name: parsed.data.leaseName || null,
          legal_description: legalDescription,
          parcel_reference: parsed.data.taxParcelId || null,
          township_district: parsed.data.townshipDistrict || null,
          block_section: parsed.data.blockSection || null,
          abstract_survey: parsed.data.abstractSurvey || null,
          section_township_range: parsed.data.sectionTownshipRange || null,
          ownership_type: parsed.data.ownershipType || null,
          net_mineral_acres: numericValue(parsed.data.netMineralAcres),
          gross_acres_under_lease: numericValue(parsed.data.grossAcresUnderLease),
          lease_status: parsed.data.leaseStatus || 'unknown',
          producing_status: parsed.data.producingStatus || 'unknown',
          recent_check_amount: parsed.data.recentCheckAmount || null,
          raw_intake_answers: parsed.data,
          unknown_fields: missingFields,
          status: 'active',
        })
        .select('id')
        .single();
      if (error) throw error;
      interestId = data.id as string;
    }

    const now = new Date().toISOString();
    const intakeFact = {
      conversation_id: session.conversationId,
      profile_id: session.profileId,
      mineral_interest_id: interestId,
      field: 'mineral_rights_assessment_intake',
      value: {
        intakeVersion: parsed.data.intakeVersion || '2026-07-20-angela-v1',
        source: parsed.data.source || 'account_guided_intake',
        label,
        locationDescription: locationDescription || null,
        state: parsed.data.state || null,
        county: parsed.data.county || null,
        townshipDistrict: parsed.data.townshipDistrict || null,
        taxParcelId: parsed.data.taxParcelId || null,
        blockSection: parsed.data.blockSection || null,
        abstractSurvey: parsed.data.abstractSurvey || null,
        sectionTownshipRange: parsed.data.sectionTownshipRange || null,
        netMineralAcres: text(parsed.data.netMineralAcres) || null,
        grossAcresUnderLease: parsed.data.grossAcresUnderLease || null,
        leaseStatus: parsed.data.leaseStatus || 'unknown',
        producingStatus: parsed.data.producingStatus || 'unknown',
        recentCheckAmount: parsed.data.recentCheckAmount || null,
        ownershipType: parsed.data.ownershipType || 'unknown',
        operator: parsed.data.operator || null,
        leaseName: parsed.data.leaseName || null,
        assessmentDetails: parsed.data.assessmentDetails || null,
        situationCodes: parsed.data.situationCode ? [parsed.data.situationCode] : [],
        missingFields,
      },
      source: 'owner_profile',
      confidence: 1,
      status: 'confirmed',
      confirmed_at: now,
    };
    const facts: Array<Record<string, unknown>> = [
      intakeFact,
      {
        ...intakeFact,
        field: 'mineral_rights_assessment_details',
      },
    ];
    if (missingFields.length) {
      facts.push({
        conversation_id: session.conversationId,
        profile_id: session.profileId,
        mineral_interest_id: interestId,
        field: 'missing_info_checklist',
        value: {
          items: missingFields,
          replyInstructions:
            'Reply by text with pictures, or email underwriter@mineralrightsxchange.com. Documents are reviewed by a Senior Underwriter. Submission does not constitute an offer.',
        },
        source: 'system',
        confidence: 1,
        status: 'confirmed',
        confirmed_at: now,
      });
    }
    const { error: factError } = await supabase.from('owner_facts').insert(facts);
    if (factError) throw factError;

    const { count: mineralRightsCount } = await supabase
      .from('mineral_interests')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', session.profileId)
      .neq('status', 'archived');
    try {
      const { error: workspaceError } = await supabase.from('internal_case_workspaces').upsert({
        profile_id: session.profileId,
        status: missingFields.length ? 'needs_info' : 'underwriting',
        verification_confidence: missingFields.length ? 'low' : 'medium',
        underwriter_brief:
          `Senior Underwriter review requested for ${label}. ${parsed.data.assessmentDetails || ''}`.trim(),
        confidence_gaps: missingFields.join('\n'),
        recommended_focus: missingFields.length
          ? 'Review the missing-information checklist and owner replies before valuation preparation.'
          : 'Review owner-provided intake and uploaded property documents.',
        mineral_rights_count: mineralRightsCount ?? 1,
      });
      if (workspaceError) throw workspaceError;

      const { data: underwriter } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('role', 'underwriter')
        .eq('active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (underwriter?.id) {
        await supabase
          .from('case_assignments')
          .upsert(
            { profile_id: session.profileId, staff_profile_id: underwriter.id },
            { onConflict: 'profile_id,staff_profile_id' },
          );
      }
    } catch (workspaceError) {
      console.error(
        '[Owner intake staff workspace]',
        workspaceError instanceof Error ? workspaceError.message : 'failed',
      );
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ primary_mineral_interest_id: interestId, last_seen_at: now })
      .eq('id', session.profileId);
    if (profileError) throw profileError;

    try {
      await syncVerifiedOwnerToGhl(session.profileId);
    } catch (syncError) {
      console.error(
        '[GHL mineral interest sync]',
        syncError instanceof Error ? syncError.message : 'failed',
      );
    }

    return json({ ok: true, interestId, geography, label, missingFields });
  } catch (error) {
    return safeError(error);
  }
};
