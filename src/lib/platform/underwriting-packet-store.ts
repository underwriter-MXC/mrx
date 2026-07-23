import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildUnderwritingRequirementDefinitions,
  buildUnderwritingSourceFingerprint,
  deriveUnderwritingPacket,
  inferUnderwritingSituations,
  type DerivedUnderwritingPacket,
  type StoredUnderwritingRequirement,
  type UnderwritingAttachment,
  type UnderwritingInterest,
  type UnderwritingPacketRecord,
  type UnderwritingSituation,
  type UnderwritingWorkspace,
} from './underwriting-packet';

const INTEREST_FIELDS =
  'id,label,state,county,legal_description,parcel_reference,lease_status,producing_status,inherited,unknown_fields,raw_intake_answers,updated_at';
const ATTACHMENT_FIELDS =
  'id,mineral_interest_id,document_type,status,original_name,created_at,updated_at';
const REQUIREMENT_FIELDS =
  'id,profile_id,mineral_interest_id,requirement_key,label,rationale,situation_code,requirement_level,required,accepted_document_types,status,attachment_id,verified_by,verified_at,waived_by,waived_at,waiver_reason,created_at,updated_at';
const WORKSPACE_FIELDS = 'verification_confidence,underwriter_brief,risk_flags,updated_at';
const PACKET_FIELDS =
  'profile_id,status,readiness_version,packet_version,packet_hash,source_fingerprint,packet_snapshot,blocker_snapshot,finalized_by,finalized_at,reopened_by,reopened_at,reopen_reason,created_at,updated_at';

export type UnderwritingPacketBundle = {
  packet: DerivedUnderwritingPacket;
  interests: UnderwritingInterest[];
  attachments: UnderwritingAttachment[];
  requirements: StoredUnderwritingRequirement[];
  workspace: UnderwritingWorkspace | null;
  packetRecord: UnderwritingPacketRecord | null;
};

function rowError(result: { error?: unknown }) {
  if (result.error) throw result.error;
}

async function readPacketSources(supabase: SupabaseClient, profileId: string) {
  const [
    interestResult,
    factResult,
    attachmentResult,
    requirementResult,
    workspaceResult,
    packetResult,
  ] = await Promise.all([
    supabase
      .from('mineral_interests')
      .select(INTEREST_FIELDS)
      .eq('profile_id', profileId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false }),
    supabase
      .from('owner_facts')
      .select('field,value,status,updated_at')
      .eq('profile_id', profileId)
      .in('status', ['candidate', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('attachments')
      .select(ATTACHMENT_FIELDS)
      .eq('profile_id', profileId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }),
    supabase
      .from('underwriting_document_requirements')
      .select(REQUIREMENT_FIELDS)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true }),
    supabase
      .from('internal_case_workspaces')
      .select(WORKSPACE_FIELDS)
      .eq('profile_id', profileId)
      .maybeSingle(),
    supabase
      .from('underwriting_packets')
      .select(PACKET_FIELDS)
      .eq('profile_id', profileId)
      .maybeSingle(),
  ]);
  for (const result of [
    interestResult,
    factResult,
    attachmentResult,
    requirementResult,
    workspaceResult,
    packetResult,
  ]) {
    rowError(result);
  }

  const interests = (interestResult.data ?? []) as UnderwritingInterest[];
  const ownerFacts = (factResult.data ?? []) as Array<{
    field?: string;
    value?: unknown;
    status?: string | null;
    updated_at?: string | null;
  }>;
  const attachments = (attachmentResult.data ?? []) as UnderwritingAttachment[];
  const requirements = (requirementResult.data ?? []) as StoredUnderwritingRequirement[];
  const workspace = (workspaceResult.data ?? null) as UnderwritingWorkspace | null;
  const packetRecord = (packetResult.data ?? null) as UnderwritingPacketRecord | null;
  const situations = inferUnderwritingSituations({ interests, ownerFacts });
  return { interests, ownerFacts, attachments, requirements, workspace, packetRecord, situations };
}

async function reconcileRequirementRows(args: {
  supabase: SupabaseClient;
  profileId: string;
  interests: UnderwritingInterest[];
  situations: UnderwritingSituation[];
  requirements: StoredUnderwritingRequirement[];
}) {
  const definitions = buildUnderwritingRequirementDefinitions({
    situations: args.situations,
    interests: args.interests,
  });
  const existingByKey = new Map(args.requirements.map((item) => [item.requirement_key, item]));
  const currentKeys = new Set(definitions.map((item) => item.requirementKey));
  const toUpsert = definitions.map((item) => {
    const existing = existingByKey.get(item.requirementKey);
    return {
      profile_id: args.profileId,
      mineral_interest_id: item.mineralInterestId,
      requirement_key: item.requirementKey,
      label: item.label,
      rationale: item.rationale,
      situation_code: item.situation,
      requirement_level: item.requirementLevel,
      required: item.required,
      accepted_document_types: item.acceptedDocumentTypes,
      status:
        existing?.status === 'not_applicable' && item.required
          ? 'needed'
          : (existing?.status ?? 'needed'),
    };
  });
  if (toUpsert.length) {
    const result = await args.supabase
      .from('underwriting_document_requirements')
      .upsert(toUpsert, { onConflict: 'profile_id,requirement_key' });
    rowError(result);
  }
  const obsolete = args.requirements
    .filter((item) => !currentKeys.has(item.requirement_key) && item.status !== 'not_applicable')
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id));
  if (obsolete.length) {
    const result = await args.supabase
      .from('underwriting_document_requirements')
      .update({
        status: 'not_applicable',
        attachment_id: null,
        verified_by: null,
        verified_at: null,
        waived_by: null,
        waived_at: null,
        waiver_reason: null,
      })
      .eq('profile_id', args.profileId)
      .in('id', obsolete);
    rowError(result);
  }
}

export async function loadUnderwritingPacket(
  supabase: SupabaseClient,
  profileId: string,
  options: { reconcile?: boolean } = {},
): Promise<UnderwritingPacketBundle> {
  let sources = await readPacketSources(supabase, profileId);
  if (options.reconcile) {
    await reconcileRequirementRows({
      supabase,
      profileId,
      interests: sources.interests,
      situations: sources.situations,
      requirements: sources.requirements,
    });
    sources = await readPacketSources(supabase, profileId);
  }
  const sourceFingerprint = await buildUnderwritingSourceFingerprint({
    situations: sources.situations,
    interests: sources.interests,
    attachments: sources.attachments,
    requirements: sources.requirements,
    ownerFacts: sources.ownerFacts,
    workspace: sources.workspace,
  });
  const packet = deriveUnderwritingPacket({
    situations: sources.situations,
    interests: sources.interests,
    attachments: sources.attachments,
    requirements: sources.requirements,
    ownerFacts: sources.ownerFacts,
    workspace: sources.workspace,
    packet: sources.packetRecord,
    sourceFingerprint,
  });
  return {
    packet,
    interests: sources.interests,
    attachments: sources.attachments,
    requirements: sources.requirements,
    workspace: sources.workspace,
    packetRecord: sources.packetRecord,
  };
}
