import type { APIRoute } from 'astro';
import { z } from 'zod';
import { CONSENT_VERSION } from '../../../lib/platform/consent';
import {
  normalizeEmail,
  normalizePhone,
  resolveOwnerSession,
} from '../../../lib/platform/identity';
import { refreshCompletedLead } from '../../../lib/platform/communications';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';
import { stagingTestAccessAllowed } from '../../../lib/platform/test-access';

const STAGING_UNDERWRITER_EMAIL = 'mrx-staging-underwriter-test@example.com';
const STAGING_UNDERWRITER_NAME = 'MRX Staging TEST Underwriter';

export const GET: APIRoute = async () => json({ ok: false, error: 'not_found' }, { status: 404 });

async function ensureStagingUnderwriter(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
) {
  const { data: activeUnderwriter, error: activeUnderwriterError } = await supabase
    .from('staff_profiles')
    .select('id')
    .eq('role', 'underwriter')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (activeUnderwriterError) throw activeUnderwriterError;
  if (activeUnderwriter?.id) return activeUnderwriter.id;

  // A fresh staging database may not have staff bootstrap data yet. The route is
  // already secret-protected and non-production-only, so create one reusable,
  // passwordless TEST underwriter instead of weakening the assignment assertion.
  const { data: listedUsers, error: listUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1_000,
  });
  if (listUsersError) throw listUsersError;
  let authUser = listedUsers.users.find(
    (user) => user.email?.toLowerCase() === STAGING_UNDERWRITER_EMAIL,
  );
  if (!authUser) {
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: STAGING_UNDERWRITER_EMAIL,
      email_confirm: true,
      user_metadata: {
        is_test: true,
        purpose: 'staging_owner_profile_underwriter',
      },
    });
    if (createUserError) throw createUserError;
    authUser = createdUser.user ?? undefined;
  }
  if (!authUser?.id) throw new Error('staging_underwriter_user_missing');

  const { data: staffProfile, error: staffProfileError } = await supabase
    .from('staff_profiles')
    .upsert(
      {
        user_id: authUser.id,
        role: 'underwriter',
        display_name: STAGING_UNDERWRITER_NAME,
        active: true,
      },
      { onConflict: 'user_id' },
    )
    .select('id')
    .single();
  if (staffProfileError) throw staffProfileError;
  if (!staffProfile?.id) throw new Error('staging_underwriter_profile_missing');
  return staffProfile.id;
}

export const StructuredInterestSchema = z
  .object({
    label: z.string().trim().min(1).max(160),
    propertyReference: z.string().trim().min(1).max(160),
    state: z.string().trim().min(2).max(80),
    county: z.string().trim().min(2).max(120),
    operator: z.string().trim().min(1).max(160),
    leaseName: z.string().trim().min(1).max(160),
    wellNames: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
    ownershipType: z.enum([
      'mineral_rights',
      'royalties_only',
      'overriding_royalties',
      'working_interest',
      'unknown',
    ]),
    royaltyDecimal: z.number().positive().max(1),
    producingStatus: z.enum(['yes', 'no', 'unknown']),
    productionMonth: z.string().regex(/^\d{4}-\d{2}$/),
    ownerNetVolume: z.number().nonnegative(),
    ownerGrossValue: z.number().nonnegative(),
    severanceTax: z.number().nonnegative(),
    regulatoryFee: z.number().nonnegative(),
    recentPaymentNet: z.number().nonnegative(),
    assessmentDetails: z.string().trim().min(1).max(8_000),
    unknownFields: z.array(z.string().trim().min(1).max(100)).max(24),
  })
  .superRefine((interest, context) => {
    const reconciledNet = Number(
      (interest.ownerGrossValue - interest.severanceTax - interest.regulatoryFee).toFixed(2),
    );
    if (reconciledNet !== Number(interest.recentPaymentNet.toFixed(2))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recentPaymentNet'],
        message: 'recent payment must reconcile to gross value less taxes and fees',
      });
    }
  });

export const TestOwnerSchema = z
  .object({
    runId: z.string().uuid(),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email(),
    phone: z.string().min(1).max(40),
    state: z.string().min(2).max(80).optional(),
    county: z.string().min(2).max(120).optional(),
    propertyCount: z.number().int().min(1).max(5).optional(),
    interests: z.array(StructuredInterestSchema).min(1).max(5).optional(),
    correction: z.boolean().default(false),
  })
  .superRefine((data, context) => {
    if (!data.interests && (!data.propertyCount || !data.state || !data.county)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'propertyCount, state, and county are required without structured interests',
      });
    }
    if (data.interests && data.lastName !== 'TEST') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lastName'],
        message: 'structured test profiles must use TEST as the last name',
      });
    }
  });

export const POST: APIRoute = async (context) => {
  try {
    if (!stagingTestAccessAllowed(context.request))
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    const parsed = TestOwnerSchema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_test_owner' }, { status: 400 });
    const session = await resolveOwnerSession(context);
    if (!session.persisted)
      return json({ ok: false, error: 'database_unavailable' }, { status: 503 });
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });
    const data = parsed.data;
    const normalizedEmail = normalizeEmail(data.email);
    const normalizedPhone = normalizePhone(data.phone);
    if (!normalizedPhone) return json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    const now = new Date().toISOString();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        normalized_email: normalizedEmail,
        phone: data.phone,
        normalized_phone: normalizedPhone,
        email_verified_at: now,
        phone_verified_at: now,
        is_test: true,
        test_run_id: data.runId,
      })
      .eq('id', session.profileId);
    if (profileError) throw profileError;

    const { error: conversationError } = await supabase
      .from('conversations')
      .update({ is_test: true, test_run_id: data.runId })
      .eq('id', session.conversationId);
    if (conversationError) throw conversationError;

    const { error: identifierError } = await supabase.from('profile_identifiers').upsert(
      [
        {
          profile_id: session.profileId,
          kind: 'email',
          normalized_value: normalizedEmail,
          display_value: data.email,
          verified_at: now,
          is_primary: true,
        },
        {
          profile_id: session.profileId,
          kind: 'phone',
          normalized_value: normalizedPhone,
          display_value: data.phone,
          verified_at: now,
          is_primary: true,
        },
      ],
      { onConflict: 'profile_id,kind,normalized_value' },
    );
    if (identifierError) throw identifierError;

    const interests = data.interests
      ? data.interests.map((interest) => ({
          profile_id: session.profileId,
          conversation_id: session.conversationId,
          label: interest.label,
          state: interest.state,
          state_code: interest.state === 'Texas' ? 'TX' : null,
          county: interest.county,
          county_fips: interest.state === 'Texas' && interest.county === 'Dawson' ? '48115' : null,
          operator: interest.operator,
          lease_name: interest.leaseName,
          well_names: interest.wellNames,
          ownership_type: interest.ownershipType,
          royalty_decimal: interest.royaltyDecimal,
          net_mineral_acres: null,
          gross_acres_under_lease: null,
          legal_description: null,
          parcel_reference: interest.propertyReference,
          lease_status: 'unknown',
          producing_status: interest.producingStatus,
          recent_check_amount: `$${interest.recentPaymentNet.toFixed(2)} net for ${interest.productionMonth}`,
          raw_intake_answers: {
            source: 'staging_structured_test',
            testRunId: data.runId,
            propertyReference: interest.propertyReference,
            productionMonth: interest.productionMonth,
            ownerNetVolume: interest.ownerNetVolume,
            ownerGrossValue: interest.ownerGrossValue,
            severanceTax: interest.severanceTax,
            regulatoryFee: interest.regulatoryFee,
            recentPaymentNet: interest.recentPaymentNet,
            assessmentDetails: interest.assessmentDetails,
          },
          unknown_fields: interest.unknownFields,
          inherited: false,
          geography_status: 'resolved',
          location_precision: 'county',
          status: 'active',
        }))
      : Array.from({ length: data.propertyCount! }, (_, propertyIndex) => ({
          profile_id: session.profileId,
          conversation_id: session.conversationId,
          label: `${data.county!} County test interest ${propertyIndex + 1}`,
          state: data.state!,
          county: data.county!,
          ownership_type: propertyIndex
            ? 'inherited non-producing minerals'
            : 'producing mineral interest',
          net_mineral_acres: 10 + propertyIndex,
          inherited: propertyIndex > 0,
          status: 'active',
        }));
    const { data: createdInterests, error: interestError } = await supabase
      .from('mineral_interests')
      .insert(interests as any[])
      .select('id');
    if (interestError) throw interestError;

    if (data.interests && createdInterests?.length) {
      const assessmentFacts = data.interests.flatMap((interest, index) => {
        const value = {
          intakeVersion: '2026-07-21-staging-test-v1',
          source: 'staging_structured_test',
          testRunId: data.runId,
          label: interest.label,
          propertyReference: interest.propertyReference,
          state: interest.state,
          county: interest.county,
          operator: interest.operator,
          leaseName: interest.leaseName,
          wellNames: interest.wellNames,
          ownershipType: interest.ownershipType,
          royaltyDecimal: interest.royaltyDecimal,
          producingStatus: interest.producingStatus,
          productionMonth: interest.productionMonth,
          ownerNetVolume: interest.ownerNetVolume,
          ownerGrossValue: interest.ownerGrossValue,
          severanceTax: interest.severanceTax,
          regulatoryFee: interest.regulatoryFee,
          recentPaymentNet: interest.recentPaymentNet,
          netMineralAcres: null,
          grossAcresUnderLease: null,
          leaseStatus: 'unknown',
          assessmentDetails: interest.assessmentDetails,
          missingFields: interest.unknownFields,
        };
        return [
          {
            profile_id: session.profileId,
            conversation_id: session.conversationId,
            mineral_interest_id: createdInterests[index]?.id ?? null,
            field: 'mineral_rights_assessment_intake',
            value,
            status: 'confirmed',
            source: 'owner_profile',
            confidence: 1,
            confirmed_at: now,
          },
          {
            profile_id: session.profileId,
            conversation_id: session.conversationId,
            mineral_interest_id: createdInterests[index]?.id ?? null,
            field: 'mineral_rights_assessment_details',
            value,
            status: 'confirmed',
            source: 'owner_profile',
            confidence: 1,
            confirmed_at: now,
          },
        ];
      });
      const { error: factError } = await supabase.from('owner_facts').insert(assessmentFacts);
      if (factError) throw factError;

      const confidenceGaps = [
        ...new Set(data.interests.flatMap((interest) => interest.unknownFields)),
      ].join('\n');
      const { error: workspaceError } = await supabase.from('internal_case_workspaces').upsert({
        profile_id: session.profileId,
        status: 'underwriting',
        verification_confidence: 'medium',
        underwriter_brief:
          'STAGING TEST: Review three producing Dawson County royalty interests and the synthetic MRX document fixture.',
        confidence_gaps: confidenceGaps,
        recommended_focus:
          'Confirm the TEST marker, three Panther interests, property references, royalty decimals, payment facts, and document visibility.',
        mineral_rights_count: createdInterests.length,
      });
      if (workspaceError) throw workspaceError;

      const underwriterId = await ensureStagingUnderwriter(supabase);
      const { error: assignmentError } = await supabase
        .from('case_assignments')
        .upsert(
          { profile_id: session.profileId, staff_profile_id: underwriterId },
          { onConflict: 'profile_id,staff_profile_id' },
        );
      if (assignmentError) throw assignmentError;

      const { error: primaryInterestError } = await supabase
        .from('profiles')
        .update({ primary_mineral_interest_id: createdInterests[0].id })
        .eq('id', session.profileId);
      if (primaryInterestError) throw primaryInterestError;
    }

    if (data.correction) {
      const interestId = createdInterests?.[0]?.id ?? null;
      const { data: oldFact, error: oldFactError } = await supabase
        .from('owner_facts')
        .insert({
          profile_id: session.profileId,
          conversation_id: session.conversationId,
          mineral_interest_id: interestId,
          field: 'net_mineral_acres',
          value: 8,
          status: 'superseded',
          source: 'owner_chat',
          confidence: 1,
          confirmed_at: now,
        })
        .select('id')
        .single();
      if (oldFactError) throw oldFactError;
      const { error: correctedFactError } = await supabase.from('owner_facts').insert({
        profile_id: session.profileId,
        conversation_id: session.conversationId,
        mineral_interest_id: interestId,
        field: 'net_mineral_acres',
        value: 10,
        status: 'confirmed',
        source: 'owner_chat',
        confidence: 1,
        supersedes_id: oldFact.id,
        confirmed_at: now,
      });
      if (correctedFactError) throw correctedFactError;
    }

    await supabase.from('consent_receipts').insert({
      profile_id: session.profileId,
      channel: 'account',
      purpose: 'staging_test_identity',
      granted: true,
      disclosure_version: CONSENT_VERSION,
      disclosure_text: 'Staging-only fictitious identity created by the MRX validation runner.',
      submitted_value: data.runId,
      destination: normalizedEmail,
      source_url: new URL(context.request.url).origin,
      utm: { test_run_id: data.runId },
    });
    await refreshCompletedLead(session.profileId);
    return json({
      ok: true,
      profileId: session.profileId,
      conversationId: session.conversationId,
      interestIds: (createdInterests ?? []).map((interest) => interest.id),
    });
  } catch (error) {
    return safeError(error);
  }
};
