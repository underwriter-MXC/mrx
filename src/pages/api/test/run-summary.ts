import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';
import { stagingTestAccessAllowed } from '../../../lib/platform/test-access';

const Schema = z.object({ runId: z.string().uuid() });
const ExpectedInterests = [
  {
    label: 'Panther B Unit #D 1H',
    propertyReference: 'TX1034001',
    royaltyDecimal: 0.00105976,
    ownerNetVolume: 7.43,
    ownerGrossValue: 799.87,
    severanceTax: 36.79,
    regulatoryFee: 0.04,
    recentPaymentNet: 763.04,
  },
  {
    label: 'Panther C Unit #D 2H',
    propertyReference: 'TX1035002',
    royaltyDecimal: 0.00038124,
    ownerNetVolume: 1.17,
    ownerGrossValue: 125.66,
    severanceTax: 5.78,
    regulatoryFee: 0.01,
    recentPaymentNet: 119.87,
  },
  {
    label: 'Panther D Unit #D 3H',
    propertyReference: 'TX1036003',
    royaltyDecimal: 0.00022329,
    ownerNetVolume: 1.3,
    ownerGrossValue: 139.84,
    severanceTax: 6.43,
    regulatoryFee: 0.01,
    recentPaymentNet: 133.4,
  },
];

export const GET: APIRoute = async () => json({ ok: false, error: 'not_found' }, { status: 404 });

function expectedIdentity(index: number) {
  const sequence = String(index + 1).padStart(2, '0');
  return {
    firstName: `Dawson${sequence}`,
    email: `mrx-dawson-${sequence}-test@example.com`,
    phone: `+143255501${sequence}`,
  };
}

function numericFact(value: unknown) {
  return typeof value === 'number' ? value : Number(value);
}

export const POST: APIRoute = async (context) => {
  try {
    if (!stagingTestAccessAllowed(context.request)) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_test_run' }, { status: 400 });
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });

    const runId = parsed.data.runId;
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id,first_name,last_name,email,phone,ghl_contact_id')
      .eq('is_test', true)
      .eq('test_run_id', runId)
      .order('first_name', { ascending: true });
    if (profileError) throw profileError;
    const profileIds = (profiles ?? []).map((profile) => profile.id);

    const empty = { data: [], error: null };
    const [interestResult, attachmentResult, workspaceResult, assignmentResult, dispatchResult] =
      profileIds.length > 0
        ? await Promise.all([
            supabase
              .from('mineral_interests')
              .select(
                'id,profile_id,label,state,county,operator,lease_name,well_names,ownership_type,royalty_decimal,net_mineral_acres,gross_acres_under_lease,parcel_reference,lease_status,producing_status,recent_check_amount,raw_intake_answers,unknown_fields',
              )
              .in('profile_id', profileIds)
              .neq('status', 'archived'),
            supabase
              .from('attachments')
              .select('id,profile_id,mineral_interest_id,original_name,status')
              .in('profile_id', profileIds)
              .neq('status', 'deleted'),
            supabase
              .from('internal_case_workspaces')
              .select('profile_id,status,verification_confidence,mineral_rights_count')
              .in('profile_id', profileIds),
            supabase
              .from('case_assignments')
              .select(
                'profile_id,staff_profile_id,assigned_staff:staff_profiles!case_assignments_staff_profile_id_fkey(role,active)',
              )
              .in('profile_id', profileIds),
            supabase
              .from('communication_dispatches')
              .select('profile_id,channel,status,attempted_at')
              .in('profile_id', profileIds),
          ])
        : [empty, empty, empty, empty, empty];
    const firstError = [
      interestResult.error,
      attachmentResult.error,
      workspaceResult.error,
      assignmentResult.error,
      dispatchResult.error,
    ].find(Boolean);
    if (firstError) throw firstError;

    const interests = interestResult.data ?? [];
    const attachments = attachmentResult.data ?? [];
    const workspaces = workspaceResult.data ?? [];
    const assignments = assignmentResult.data ?? [];
    const dispatches = dispatchResult.data ?? [];
    const activeDispatches = dispatches.filter(
      (dispatch) =>
        ['queued', 'sent', 'delivered', 'failed'].includes(dispatch.status) ||
        Boolean(dispatch.attempted_at),
    );
    const profileSummaries = (profiles ?? []).map((profile, index) => {
      const profileInterests = interests.filter((interest) => interest.profile_id === profile.id);
      const profileAttachments = attachments.filter(
        (attachment) => attachment.profile_id === profile.id,
      );
      const workspace = workspaces.find((item) => item.profile_id === profile.id) ?? null;
      const profileAssignments = assignments.filter(
        (assignment) => assignment.profile_id === profile.id,
      );
      const profileDispatches = dispatches.filter((dispatch) => dispatch.profile_id === profile.id);
      return {
        profileId: profile.id,
        displayName: [profile.first_name, profile.last_name].filter(Boolean).join(' '),
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        expectedIdentity: expectedIdentity(index),
        interestCount: profileInterests.length,
        interests: profileInterests.map((interest) => ({
          label: interest.label,
          propertyReference: interest.parcel_reference,
          state: interest.state,
          county: interest.county,
          operator: interest.operator,
          leaseName: interest.lease_name,
          wellNames: interest.well_names,
          ownershipType: interest.ownership_type,
          royaltyDecimal: Number(interest.royalty_decimal),
          netMineralAcres: interest.net_mineral_acres,
          grossAcresUnderLease: interest.gross_acres_under_lease,
          leaseStatus: interest.lease_status,
          producingStatus: interest.producing_status,
          recentCheckAmount: interest.recent_check_amount,
          facts: interest.raw_intake_answers as Record<string, unknown> | null,
          unknownFields: interest.unknown_fields,
        })),
        documentCount: profileAttachments.length,
        documentStatuses: profileAttachments.map((attachment) => attachment.status),
        profileLevelDocumentCount: profileAttachments.filter(
          (attachment) => !attachment.mineral_interest_id,
        ).length,
        workspaceStatus: workspace?.status ?? null,
        verificationConfidence: workspace?.verification_confidence ?? null,
        workspaceInterestCount: workspace?.mineral_rights_count ?? null,
        assignmentCount: profileAssignments.length,
        hasActiveUnderwriterAssignment: profileAssignments.some((assignment) => {
          const assignedStaff = Array.isArray(assignment.assigned_staff)
            ? assignment.assigned_staff[0]
            : assignment.assigned_staff;
          return assignedStaff?.role === 'underwriter' && assignedStaff.active === true;
        }),
        communicationCount: profileDispatches.length,
        hasGhlContact: Boolean(profile.ghl_contact_id),
      };
    });
    const acceptedDocumentStates = new Set(['quarantined', 'queued', 'ready']);
    const hasExpectedInterests = (profile: (typeof profileSummaries)[number]) =>
      ExpectedInterests.every((expected) =>
        profile.interests.some((interest) => {
          const facts = interest.facts ?? {};
          return (
            interest.label === expected.label &&
            interest.propertyReference === expected.propertyReference &&
            interest.state === 'Texas' &&
            interest.county === 'Dawson' &&
            interest.operator === 'Laguna Resources' &&
            interest.leaseName === expected.label &&
            interest.wellNames?.length === 1 &&
            interest.wellNames[0] === expected.label &&
            interest.ownershipType === 'royalties_only' &&
            interest.royaltyDecimal === expected.royaltyDecimal &&
            interest.netMineralAcres === null &&
            interest.grossAcresUnderLease === null &&
            interest.leaseStatus === 'unknown' &&
            interest.producingStatus === 'yes' &&
            interest.recentCheckAmount ===
              `$${expected.recentPaymentNet.toFixed(2)} net for 2026-05` &&
            interest.unknownFields?.includes('Net mineral acres owned') &&
            interest.unknownFields?.includes('Gross acres under lease') &&
            interest.unknownFields?.includes('Lease status') &&
            facts.productionMonth === '2026-05' &&
            numericFact(facts.ownerNetVolume) === expected.ownerNetVolume &&
            numericFact(facts.ownerGrossValue) === expected.ownerGrossValue &&
            numericFact(facts.severanceTax) === expected.severanceTax &&
            numericFact(facts.regulatoryFee) === expected.regulatoryFee &&
            numericFact(facts.recentPaymentNet) === expected.recentPaymentNet &&
            String(facts.assessmentDetails).includes('Staging-only TEST')
          );
        }),
      );
    const valid =
      profileSummaries.length === 10 &&
      profileSummaries.every(
        (profile) =>
          profile.firstName === profile.expectedIdentity.firstName &&
          profile.lastName === 'TEST' &&
          profile.email === profile.expectedIdentity.email &&
          profile.phone === profile.expectedIdentity.phone &&
          profile.interestCount === 3 &&
          hasExpectedInterests(profile) &&
          profile.documentCount === 1 &&
          profile.documentStatuses.every((status) => acceptedDocumentStates.has(status)) &&
          profile.profileLevelDocumentCount === 1 &&
          profile.workspaceStatus === 'underwriting' &&
          profile.workspaceInterestCount === 3 &&
          profile.assignmentCount === 1 &&
          profile.hasActiveUnderwriterAssignment &&
          !profile.hasGhlContact,
      ) &&
      activeDispatches.length === 0;

    return json({
      ok: true,
      runId,
      valid,
      totals: {
        profiles: profileSummaries.length,
        interests: interests.length,
        documents: attachments.length,
        workspaces: workspaces.length,
        assignments: assignments.length,
        communications: dispatches.length,
        activeOutboundDispatches: activeDispatches.length,
      },
      documentStates: [...new Set(attachments.map((attachment) => attachment.status))].sort(),
      profiles: profileSummaries,
    });
  } catch (error) {
    return safeError(error);
  }
};
