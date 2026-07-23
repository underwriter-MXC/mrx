export const UNDERWRITING_DOCUMENT_TYPES = [
  'mineral_deed',
  'royalty_statement',
  'royalty_check_stub',
  'form_1099_misc',
  'oil_gas_lease',
  'lease_amendment',
  'division_order',
  'probate_order',
  'trust_document',
  'purchase_offer',
  'competing_offer',
  'tax_statement',
  'operator_correspondence',
  'county_record',
  'other',
] as const;

/**
 * These versions are part of the persisted packet contract. Bump them when
 * the readiness rules or packet shape change so old decisions remain
 * auditable instead of silently being interpreted under new rules.
 */
export const UNDERWRITING_READINESS_VERSION = 'mrx-underwriting-readiness-v1';
export const UNDERWRITING_PACKET_VERSION = 'mrx-underwriting-packet-v1';

export type UnderwritingDocumentType = (typeof UNDERWRITING_DOCUMENT_TYPES)[number];
export const UNDERWRITING_SITUATIONS = [
  'inherited_or_probate',
  'leased',
  'producing',
  'offer_review',
  'tax_sensitive_1031',
  'unleased_or_uncertain',
] as const;
export type UnderwritingSituation = (typeof UNDERWRITING_SITUATIONS)[number];
export type RequirementLevel = 'required' | 'recommended';
export type UnderwritingPacketAction =
  | 'verify'
  | 'waive'
  | 'confirm_fact'
  | 'reject_fact'
  | 'finalize'
  | 'reopen_requirement'
  | 'reopen_packet';
export type RequirementStatus =
  | 'needed'
  | 'uploaded'
  | 'processing'
  | 'verified'
  | 'waived'
  | 'rejected'
  | 'not_applicable';
export type EffectiveRequirementStatus = RequirementStatus | 'missing';

export type MineralInterestForPacket = {
  id: string;
  label?: string | null;
  state?: string | null;
  county?: string | null;
  legal_description?: string | null;
  lease_status?: string | null;
  producing_status?: string | null;
  inherited?: boolean | null;
  unknown_fields?: string[] | null;
  updated_at?: string | null;
};
export type UnderwritingInterest = MineralInterestForPacket;

export type OwnerFactForPacket = {
  field?: string | null;
  value?: unknown;
  status?: string | null;
  updated_at?: string | null;
};

export type AttachmentForPacket = {
  id: string;
  mineral_interest_id?: string | null;
  document_type?: string | null;
  status?: string | null;
  updated_at?: string | null;
  original_name?: string | null;
  created_at?: string | null;
};
export type UnderwritingAttachment = AttachmentForPacket;

export type StoredRequirementForPacket = {
  id?: string;
  profile_id?: string;
  mineral_interest_id?: string | null;
  requirement_key: string;
  label: string;
  rationale?: string | null;
  required: boolean;
  requirement_level?: RequirementLevel | string | null;
  accepted_document_types: readonly string[];
  status?: RequirementStatus | string | null;
  attachment_id?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  waived_by?: string | null;
  waived_at?: string | null;
  waiver_reason?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  situation_code?: UnderwritingSituation | string | null;
};
export type StoredUnderwritingRequirement = StoredRequirementForPacket;
/** Canonical requirement record used by owner, staff, and packet APIs. */
export type DocumentRequirement = StoredRequirementForPacket;

export type UnderwritingWorkspace = NonNullable<UnderwritingPacketInput['workspace']>;
export type UnderwritingPacketRecord = {
  status?: string | null;
  source_fingerprint?: string | null;
  finalized_at?: string | null;
  packet_hash?: string | null;
  packet_version?: string | null;
  readiness_version?: string | null;
  packet_snapshot?: unknown;
  blocker_snapshot?: unknown;
  finalized_by?: string | null;
  reopened_by?: string | null;
  reopened_at?: string | null;
  reopen_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  profile_id?: string | null;
};

export type UnderwritingRequirementDefinition = {
  requirementKey: string;
  mineralInterestId: string | null;
  situation: UnderwritingSituation | 'base';
  label: string;
  rationale: string;
  required: boolean;
  requirementLevel: RequirementLevel;
  acceptedDocumentTypes: UnderwritingDocumentType[];
};

export type DerivedUnderwritingRequirement = UnderwritingRequirementDefinition & {
  storedStatus: RequirementStatus;
  effectiveStatus: EffectiveRequirementStatus;
  attachmentId: string | null;
  verifiedAt: string | null;
  waivedAt: string | null;
  updatedAt: string | null;
};

export type UnderwritingBlocker = {
  code:
    | 'required_document_missing'
    | 'document_processing_pending'
    | 'document_needs_staff_verification'
    | 'required_document_rejected'
    | 'waiver_incomplete'
    | 'workspace_verification_low'
    | 'candidate_facts_unresolved'
    | 'underwriter_brief_missing'
    | 'material_risk_open'
    | 'packet_changed_after_finalization';
  label: string;
  requirementKey?: string;
};

export type UnderwritingReadiness = {
  version: typeof UNDERWRITING_READINESS_VERSION;
  status: 'blocked' | 'needs_verification' | 'ready';
  blockers: UnderwritingBlocker[];
  sourceFingerprint: string | null;
};

export type UnderwritingPacketInput = {
  situations: readonly UnderwritingSituation[];
  interests: readonly MineralInterestForPacket[];
  attachments: readonly AttachmentForPacket[];
  requirements: readonly StoredRequirementForPacket[];
  /** Candidate facts must be confirmed or explicitly rejected before final readiness. */
  ownerFacts?: readonly OwnerFactForPacket[];
  workspace?: {
    verification_confidence?: 'unknown' | 'low' | 'medium' | 'high' | string | null;
    underwriter_brief?: string | null;
    risk_flags?:
      | readonly (
          | string
          | { code?: string; severity?: string; status?: string; description?: string }
        )[]
      | null;
    updated_at?: string | null;
  } | null;
  packet?: {
    status?: string | null;
    source_fingerprint?: string | null;
    finalized_at?: string | null;
  } | null;
  sourceFingerprint?: string | null;
};

export type DerivedUnderwritingPacket = {
  situations: UnderwritingSituation[];
  requirements: DerivedUnderwritingRequirement[];
  blockers: UnderwritingBlocker[];
  counts: { total: number; required: number; complete: number; blockers: number };
  canFinalize: boolean;
  isFinalized: boolean;
  readinessStatus: 'blocked' | 'needs_verification' | 'ready';
  sourceFingerprint: string | null;
  readiness: UnderwritingReadiness;
};

function normalizedText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function hasAffirmative(value: unknown) {
  return ['yes', 'true', 'producing', 'leased', 'active'].includes(normalizedText(value));
}

function pushUnique<T>(items: T[], value: T) {
  if (!items.includes(value)) items.push(value);
}

const SITUATION_CODE_ALIASES: Record<string, UnderwritingSituation> = {
  inherited: 'inherited_or_probate',
  inheritance: 'inherited_or_probate',
  probate: 'inherited_or_probate',
  'estate-heir': 'inherited_or_probate',
  estate_heir: 'inherited_or_probate',
  'confused-inheritor': 'inherited_or_probate',
  confused_inheritor: 'inherited_or_probate',
  leased: 'leased',
  producing: 'producing',
  offer: 'offer_review',
  offer_review: 'offer_review',
  'suspicious-seller': 'offer_review',
  suspicious_seller: 'offer_review',
  '1031': 'tax_sensitive_1031',
  '1031-exchange': 'tax_sensitive_1031',
  tax_sensitive_1031: 'tax_sensitive_1031',
  unleased: 'unleased_or_uncertain',
  uncertain: 'unleased_or_uncertain',
  unleased_or_uncertain: 'unleased_or_uncertain',
};

function underwritingSituation(value: unknown): UnderwritingSituation | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replaceAll(' ', '_');
  return SITUATION_CODE_ALIASES[normalized] ?? null;
}

export function inferUnderwritingSituations(input: {
  interests?: readonly MineralInterestForPacket[];
  ownerFacts?: readonly OwnerFactForPacket[];
}): UnderwritingSituation[] {
  const situations: UnderwritingSituation[] = [];
  for (const interest of input.interests ?? []) {
    if (interest.inherited) pushUnique(situations, 'inherited_or_probate');
    if (hasAffirmative(interest.lease_status)) pushUnique(situations, 'leased');
    if (hasAffirmative(interest.producing_status)) pushUnique(situations, 'producing');
    if (!hasAffirmative(interest.lease_status) && !hasAffirmative(interest.producing_status)) {
      pushUnique(situations, 'unleased_or_uncertain');
    }
  }
  for (const fact of input.ownerFacts ?? []) {
    const value = fact.value;
    const codes =
      value &&
      typeof value === 'object' &&
      Array.isArray((value as { situationCodes?: unknown }).situationCodes)
        ? (value as { situationCodes: unknown[] }).situationCodes
        : [];
    for (const code of codes) {
      const situation = underwritingSituation(code);
      if (situation) pushUnique(situations, situation);
    }
  }
  return UNDERWRITING_SITUATIONS.filter((situation) => situations.includes(situation));
}

export function buildUnderwritingRequirementDefinitions(input: {
  situations: readonly UnderwritingSituation[];
  interests: readonly MineralInterestForPacket[];
}): UnderwritingRequirementDefinition[] {
  const situations = new Set(input.situations);
  const requirements: UnderwritingRequirementDefinition[] = [];

  const add = (
    definition: Omit<UnderwritingRequirementDefinition, 'required' | 'requirementLevel'> & {
      requirementLevel: RequirementLevel;
    },
  ) => {
    requirements.push({
      ...definition,
      required: definition.requirementLevel === 'required',
    });
  };

  for (const interest of input.interests) {
    const label =
      interest.label ||
      [interest.county, interest.state].filter(Boolean).join(', ') ||
      'Mineral interest';
    const singleInterest = input.interests.length === 1;
    const inherited =
      Boolean(interest.inherited) || (singleInterest && situations.has('inherited_or_probate'));
    const producing =
      hasAffirmative(interest.producing_status) || (singleInterest && situations.has('producing'));
    const leased =
      hasAffirmative(interest.lease_status) || (singleInterest && situations.has('leased'));
    const unleasedOrUncertain =
      (!leased && !producing) || (singleInterest && situations.has('unleased_or_uncertain'));

    if (inherited || (leased && !producing) || unleasedOrUncertain) {
      add({
        requirementKey: `interest:${interest.id}:ownership-record`,
        mineralInterestId: interest.id,
        situation: inherited
          ? 'inherited_or_probate'
          : unleasedOrUncertain
            ? 'unleased_or_uncertain'
            : 'leased',
        label: `${label}: deed, conveyance, or ownership record`,
        rationale: 'Confirms the ownership and legal-description record available for review.',
        requirementLevel: 'required',
        acceptedDocumentTypes: [
          'mineral_deed',
          'county_record',
          'trust_document',
          'probate_order',
          'other',
        ],
      });
    }
    if (leased || producing) {
      add({
        requirementKey: `interest:${interest.id}:lease`,
        mineralInterestId: interest.id,
        situation: producing ? 'producing' : 'leased',
        label: `${label}: lease and amendments`,
        rationale:
          'Lease terms and amendments help reconcile depths, obligations, and payment rights.',
        requirementLevel: 'required',
        acceptedDocumentTypes: ['oil_gas_lease', 'lease_amendment'],
      });
    }
    if (producing) {
      add({
        requirementKey: `interest:${interest.id}:royalty-statement`,
        mineralInterestId: interest.id,
        situation: 'producing',
        label: `${label}: recent royalty statement or check stub`,
        rationale:
          'Recent payment records help underwriters compare owner statements to public production records.',
        requirementLevel: 'required',
        acceptedDocumentTypes: ['royalty_statement', 'royalty_check_stub'],
      });
      add({
        requirementKey: `interest:${interest.id}:division-order`,
        mineralInterestId: interest.id,
        situation: 'producing',
        label: `${label}: division order`,
        rationale:
          'The division order documents the operator decimal and payee interest used for royalty payments.',
        requirementLevel: 'required',
        acceptedDocumentTypes: ['division_order'],
      });
      add({
        requirementKey: `interest:${interest.id}:operator-well-details`,
        mineralInterestId: interest.id,
        situation: 'producing',
        label: `${label}: operator, unit, or well details`,
        rationale:
          'Operator and well details are useful supporting context when they are available.',
        requirementLevel: 'recommended',
        acceptedDocumentTypes: ['operator_correspondence', 'county_record', 'other'],
      });
      add({
        requirementKey: `interest:${interest.id}:1099-misc`,
        mineralInterestId: interest.id,
        situation: 'producing',
        label: `${label}: Form 1099-MISC Box 2`,
        rationale:
          'A royalty-income 1099-MISC can help reconcile annual payments but is not required to book or complete the review.',
        requirementLevel: 'recommended',
        acceptedDocumentTypes: ['form_1099_misc'],
      });
    }
    if (leased && !producing) {
      add({
        requirementKey: `interest:${interest.id}:legal-unit-permit`,
        mineralInterestId: interest.id,
        situation: 'leased',
        label: `${label}: legal, unit, or permit information`,
        rationale:
          'Legal descriptions, unit records, and permit information are useful when available.',
        requirementLevel: 'recommended',
        acceptedDocumentTypes: ['county_record', 'operator_correspondence', 'other'],
      });
    }
  }

  if (situations.has('inherited_or_probate')) {
    add({
      requirementKey: 'case:inheritance-transfer',
      mineralInterestId: null,
      situation: 'inherited_or_probate',
      label: 'Inheritance, probate, or trust record',
      rationale: 'Inherited interests need transfer context before final readiness.',
      requirementLevel: 'required',
      acceptedDocumentTypes: [
        'probate_order',
        'trust_document',
        'county_record',
        'mineral_deed',
        'other',
      ],
    });
  }
  if (situations.has('offer_review')) {
    add({
      requirementKey: 'case:purchase-offer',
      mineralInterestId: null,
      situation: 'offer_review',
      label: 'Written purchase offer',
      rationale: 'Offer-review cases need the complete written offer and attachments.',
      requirementLevel: 'required',
      acceptedDocumentTypes: ['purchase_offer'],
    });
    add({
      requirementKey: 'case:competing-offers',
      mineralInterestId: null,
      situation: 'offer_review',
      label: 'Competing written offers, if any',
      rationale: 'Competing offers are helpful comparison evidence but are not required.',
      requirementLevel: 'recommended',
      acceptedDocumentTypes: ['competing_offer'],
    });
  }
  if (situations.has('tax_sensitive_1031')) {
    add({
      requirementKey: 'case:tax-adviser-plan',
      mineralInterestId: null,
      situation: 'tax_sensitive_1031',
      label: 'Tax adviser question plan',
      rationale:
        'Tax-sensitive cases should identify questions for a qualified tax adviser; MRX does not provide tax advice.',
      requirementLevel: 'recommended',
      acceptedDocumentTypes: ['tax_statement', 'other'],
    });
  }

  return requirements;
}

function normalizeRequirementStatus(status: unknown): RequirementStatus {
  if (
    status === 'needed' ||
    status === 'uploaded' ||
    status === 'processing' ||
    status === 'verified' ||
    status === 'waived' ||
    status === 'rejected' ||
    status === 'not_applicable'
  ) {
    return status;
  }
  return 'needed';
}

function attachmentMatchesRequirement(
  attachment: AttachmentForPacket,
  requirement: UnderwritingRequirementDefinition,
) {
  if (
    requirement.mineralInterestId &&
    attachment.mineral_interest_id !== requirement.mineralInterestId
  ) {
    return false;
  }
  return requirement.acceptedDocumentTypes.includes(
    attachment.document_type as UnderwritingDocumentType,
  );
}

function effectiveStatus(
  definition: UnderwritingRequirementDefinition,
  stored: StoredRequirementForPacket | undefined,
  attachments: readonly AttachmentForPacket[],
): { status: EffectiveRequirementStatus; attachmentId: string | null } {
  const storedStatus = normalizeRequirementStatus(stored?.status);
  if (storedStatus === 'waived' || storedStatus === 'not_applicable') {
    return { status: storedStatus, attachmentId: stored?.attachment_id ?? null };
  }
  if (storedStatus === 'verified') {
    // A verified disposition is only meaningful while its matched document
    // remains a successfully processed, type-compatible attachment. The
    // The database check requires attachment_id for verified rows. A null
    // attachment id can still occur after an attachment is deleted via the
    // foreign-key's ON DELETE SET NULL, so treat that as missing evidence.
    // When the attachment list is unavailable, retaining the status keeps this
    // pure projection backwards-compatible with old snapshots/tests. A loaded
    // attachment in any other state must block readiness.
    if (!stored?.attachment_id) return { status: 'missing', attachmentId: null };
    const linked = attachments.find((attachment) => attachment.id === stored.attachment_id);
    if (!linked) return { status: 'verified', attachmentId: stored?.attachment_id ?? null };
    if (!attachmentMatchesRequirement(linked, definition)) {
      return { status: 'rejected', attachmentId: linked.id };
    }
    if (linked.status === 'ready') return { status: 'verified', attachmentId: linked.id };
    if (linked.status === 'rejected' || linked.status === 'failed') {
      return { status: 'rejected', attachmentId: linked.id };
    }
    return { status: 'processing', attachmentId: linked.id };
  }
  if (storedStatus === 'rejected')
    return { status: 'rejected', attachmentId: stored?.attachment_id ?? null };

  const matching = attachments.find((attachment) =>
    attachmentMatchesRequirement(attachment, definition),
  );
  if (!matching) return { status: 'missing', attachmentId: null };
  if (matching.status === 'ready') return { status: 'uploaded', attachmentId: matching.id };
  if (matching.status === 'rejected' || matching.status === 'failed') {
    return { status: 'rejected', attachmentId: matching.id };
  }
  return { status: 'processing', attachmentId: matching.id };
}

export function deriveUnderwritingPacket(
  input: UnderwritingPacketInput,
): DerivedUnderwritingPacket {
  const definitions = buildUnderwritingRequirementDefinitions({
    situations: input.situations,
    interests: input.interests,
  });
  const storedByKey = new Map(input.requirements.map((row) => [row.requirement_key, row]));
  const requirements = definitions.map((definition) => {
    const stored = storedByKey.get(definition.requirementKey);
    const effective = effectiveStatus(definition, stored, input.attachments);
    return {
      ...definition,
      storedStatus: normalizeRequirementStatus(stored?.status),
      effectiveStatus: effective.status,
      attachmentId: effective.attachmentId,
      verifiedAt: stored?.verified_at ?? null,
      waivedAt: stored?.waived_at ?? null,
      updatedAt: stored?.updated_at ?? null,
    };
  });

  const blockers: UnderwritingBlocker[] = [];
  for (const requirement of requirements) {
    const stored = storedByKey.get(requirement.requirementKey);
    if (
      requirement.effectiveStatus === 'waived' &&
      (!stored?.waived_by ||
        !stored.waived_at ||
        (stored.waiver_reason ?? '').trim().length < 10)
    ) {
      blockers.push({
        code: 'waiver_incomplete',
        label: `${requirement.label} has an incomplete waiver record.`,
        requirementKey: requirement.requirementKey,
      });
      continue;
    }
    if (!requirement.required) continue;
    if (requirement.effectiveStatus === 'missing') {
      blockers.push({
        code: 'required_document_missing',
        label: `${requirement.label} is missing.`,
        requirementKey: requirement.requirementKey,
      });
    } else if (requirement.effectiveStatus === 'processing') {
      blockers.push({
        code: 'document_processing_pending',
        label: `${requirement.label} is still processing.`,
        requirementKey: requirement.requirementKey,
      });
    } else if (requirement.effectiveStatus === 'uploaded') {
      blockers.push({
        code: 'document_needs_staff_verification',
        label: `${requirement.label} needs staff verification or waiver.`,
        requirementKey: requirement.requirementKey,
      });
    } else if (requirement.effectiveStatus === 'rejected') {
      blockers.push({
        code: 'required_document_rejected',
        label: `${requirement.label} was rejected and needs replacement.`,
        requirementKey: requirement.requirementKey,
      });
    }
  }

  const confidence = input.workspace?.verification_confidence ?? 'unknown';
  if (confidence !== 'medium' && confidence !== 'high') {
    blockers.push({
      code: 'workspace_verification_low',
      label: 'Staff verification confidence is not ready.',
    });
  }
  const unresolvedFacts = (input.ownerFacts ?? []).filter((fact) => {
    const status = normalizedText(fact.status || 'candidate');
    return status === 'candidate';
  });
  if (unresolvedFacts.length) {
    blockers.push({
      code: 'candidate_facts_unresolved',
      label: `${unresolvedFacts.length} extracted fact${unresolvedFacts.length === 1 ? '' : 's'} still need staff confirmation or rejection.`,
    });
  }
  if (!input.workspace?.underwriter_brief?.trim()) {
    blockers.push({
      code: 'underwriter_brief_missing',
      label: 'An underwriter brief is required.',
    });
  }
  const materialRisks = (input.workspace?.risk_flags ?? []).filter((risk) => {
    if (typeof risk === 'string') return Boolean(risk.trim());
    const status = risk?.status ?? 'open';
    return (
      (status === 'open' || status === 'reviewing') &&
      (risk?.severity === 'high' || risk?.severity === 'critical')
    );
  });
  if (materialRisks.length) {
    blockers.push({ code: 'material_risk_open', label: 'A material case risk remains open.' });
  }

  const wasFinalized = Boolean(input.packet?.finalized_at && input.packet?.status === 'ready');
  const fingerprintMatches = Boolean(
    wasFinalized &&
    input.packet?.source_fingerprint &&
    input.packet.source_fingerprint === input.sourceFingerprint,
  );
  if (wasFinalized && !fingerprintMatches) {
    blockers.push({
      code: 'packet_changed_after_finalization',
      label: 'Packet source evidence changed after finalization.',
    });
  }

  const canFinalize = blockers.length === 0;
  const complete = requirements.filter((item) =>
    ['verified', 'waived', 'not_applicable'].includes(item.effectiveStatus),
  ).length;
  const readinessStatus = canFinalize
    ? 'ready'
    : blockers.some((item) => item.code === 'document_needs_staff_verification')
      ? 'needs_verification'
      : 'blocked';
  const readiness: UnderwritingReadiness = {
    version: UNDERWRITING_READINESS_VERSION,
    status: readinessStatus,
    blockers,
    sourceFingerprint: input.sourceFingerprint ?? null,
  };
  return {
    situations: [...input.situations],
    requirements,
    blockers,
    counts: {
      total: requirements.length,
      required: requirements.filter((item) => item.required).length,
      complete,
      blockers: blockers.length,
    },
    canFinalize,
    isFinalized: canFinalize && fingerprintMatches,
    readinessStatus,
    sourceFingerprint: input.sourceFingerprint ?? null,
    readiness,
  };
}

export function projectOwnerUnderwritingChecklist(packet: DerivedUnderwritingPacket) {
  return {
    readinessStatus: packet.isFinalized ? 'ready' : 'collecting',
    summary: {
      total: packet.counts.total,
      complete: packet.counts.complete,
      needsUpload: packet.requirements.filter((requirement) =>
        ['missing', 'rejected'].includes(requirement.effectiveStatus),
      ).length,
      processing: packet.requirements.filter(
        (requirement) => requirement.effectiveStatus === 'processing',
      ).length,
      needsStaffReview: packet.requirements.filter(
        (requirement) => requirement.effectiveStatus === 'uploaded',
      ).length,
    },
    items: packet.requirements.map((requirement) => {
      const ownerAction =
        requirement.effectiveStatus === 'verified' ||
        requirement.effectiveStatus === 'waived' ||
        requirement.effectiveStatus === 'not_applicable'
          ? 'complete'
          : requirement.effectiveStatus === 'uploaded' ||
              requirement.effectiveStatus === 'processing'
            ? 'wait'
            : requirement.effectiveStatus === 'rejected'
              ? 'reupload'
              : 'upload';
      return {
        requirementKey: requirement.requirementKey,
        mineralInterestId: requirement.mineralInterestId,
        label: requirement.label,
        required: requirement.required,
        requirementLevel: requirement.requirementLevel,
        acceptedDocumentTypes: requirement.acceptedDocumentTypes,
        status: requirement.effectiveStatus,
        ownerAction,
      };
    }),
  };
}

export function canStaffPerformPacketAction(
  role: 'admin' | 'underwriter' | 'reviewer' | string,
  action: UnderwritingPacketAction | string,
) {
  if (role === 'admin') return true;
  if (role === 'underwriter')
    return [
      'verify',
      'waive',
      'confirm_fact',
      'reject_fact',
      'finalize',
      'reopen_requirement',
      'reopen_packet',
    ].includes(action);
  if (role === 'reviewer') {
    return ['verify', 'confirm_fact', 'reject_fact', 'reopen_requirement'].includes(action);
  }
  return false;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function buildUnderwritingSourceFingerprint(
  input: Omit<UnderwritingPacketInput, 'packet' | 'sourceFingerprint'>,
) {
  const material = {
    situations: [...input.situations].sort(),
    interests: [...input.interests]
      .map((item) => ({
        id: item.id,
        updated_at: item.updated_at ?? null,
        lease_status: item.lease_status ?? null,
        producing_status: item.producing_status ?? null,
        inherited: item.inherited ?? null,
        unknown_fields: [...(item.unknown_fields ?? [])].sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    attachments: [...input.attachments]
      .map((item) => ({
        id: item.id,
        mineral_interest_id: item.mineral_interest_id ?? null,
        document_type: item.document_type ?? null,
        status: item.status ?? null,
        updated_at: item.updated_at ?? null,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    requirements: [...input.requirements]
      .map((item) => ({
        key: item.requirement_key,
        required: item.required,
        requirement_level: item.requirement_level ?? (item.required ? 'required' : 'recommended'),
        status: item.status ?? null,
        attachment_id: item.attachment_id ?? null,
        verified_at: item.verified_at ?? null,
        waived_at: item.waived_at ?? null,
        updated_at: item.updated_at ?? null,
      }))
      .sort((a, b) => a.key.localeCompare(b.key)),
    ownerFacts: [...(input.ownerFacts ?? [])]
      .map((fact) => ({
        field: fact.field ?? null,
        value: fact.value ?? null,
        status: fact.status ?? null,
        updated_at: fact.updated_at ?? null,
      }))
      .sort((a, b) => `${a.field}:${a.updated_at}`.localeCompare(`${b.field}:${b.updated_at}`)),
    workspace: {
      verification_confidence: input.workspace?.verification_confidence ?? null,
      underwriter_brief: input.workspace?.underwriter_brief ?? null,
      risk_flags: [...(input.workspace?.risk_flags ?? [])].sort((a, b) =>
        stableJson(a).localeCompare(stableJson(b)),
      ),
    },
  };
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(stableJson(material)),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
