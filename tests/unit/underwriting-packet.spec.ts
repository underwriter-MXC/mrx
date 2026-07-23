import { describe, expect, it } from 'vitest';
import {
  UNDERWRITING_DOCUMENT_TYPES,
  buildUnderwritingRequirementDefinitions,
  buildUnderwritingSourceFingerprint,
  canStaffPerformPacketAction,
  deriveUnderwritingPacket,
  inferUnderwritingSituations,
  projectOwnerUnderwritingChecklist,
} from '../../src/lib/platform/underwriting-packet';

const interest = {
  id: '11111111-1111-4111-8111-111111111111',
  label: 'Reeves County royalties',
  state: 'Texas',
  county: 'Reeves',
  legal_description: 'Section 12, Block 13',
  lease_status: 'yes',
  producing_status: 'yes',
  inherited: true,
  unknown_fields: [],
  updated_at: '2026-07-22T12:00:00.000Z',
};

const workspace = {
  verification_confidence: 'high' as const,
  underwriter_brief: 'Ownership and current payment evidence reviewed for packet readiness.',
  risk_flags: [],
  updated_at: '2026-07-22T12:00:00.000Z',
};

describe('MRX underwriting intake packet', () => {
  it('applies the conditional required and recommended checklist without a universal document set', () => {
    const base = {
      ...interest,
      inherited: false,
      lease_status: 'unknown',
      producing_status: 'yes',
    };
    const producing = buildUnderwritingRequirementDefinitions({
      situations: ['producing'],
      interests: [base],
    });
    expect(producing.filter((item) => item.required).map((item) => item.requirementKey)).toEqual([
      `interest:${interest.id}:lease`,
      `interest:${interest.id}:royalty-statement`,
      `interest:${interest.id}:division-order`,
    ]);
    expect(producing.map((item) => item.requirementKey)).not.toContain(
      `interest:${interest.id}:ownership-record`,
    );
    expect(
      producing
        .filter((item) => item.requirementLevel === 'recommended')
        .map((item) => item.requirementKey),
    ).toEqual([
      `interest:${interest.id}:operator-well-details`,
      `interest:${interest.id}:1099-misc`,
    ]);

    const leasedNonProducing = buildUnderwritingRequirementDefinitions({
      situations: ['leased'],
      interests: [{ ...base, lease_status: 'yes', producing_status: 'no' }],
    });
    expect(
      leasedNonProducing.filter((item) => item.required).map((item) => item.requirementKey),
    ).toEqual([`interest:${interest.id}:ownership-record`, `interest:${interest.id}:lease`]);
    expect(
      leasedNonProducing.find((item) => item.requirementKey.endsWith(':legal-unit-permit'))
        ?.requirementLevel,
    ).toBe('recommended');

    const uncertain = buildUnderwritingRequirementDefinitions({
      situations: ['unleased_or_uncertain'],
      interests: [{ ...base, producing_status: 'unknown' }],
    });
    expect(uncertain.filter((item) => item.required)).toHaveLength(1);
    expect(uncertain[0]?.requirementKey).toBe(`interest:${interest.id}:ownership-record`);

    const inheritedOffer = buildUnderwritingRequirementDefinitions({
      situations: ['inherited_or_probate', 'offer_review'],
      interests: [{ ...base, inherited: true, producing_status: 'unknown' }],
    });
    expect(inheritedOffer.map((item) => item.requirementKey)).toEqual(
      expect.arrayContaining([
        `interest:${interest.id}:ownership-record`,
        'case:inheritance-transfer',
        'case:purchase-offer',
        'case:competing-offers',
      ]),
    );
    expect(
      inheritedOffer.find((item) => item.requirementKey === 'case:competing-offers')
        ?.requirementLevel,
    ).toBe('recommended');
  });

  it('uses an allowlisted upload taxonomy and generates situation-specific requirements', () => {
    expect(UNDERWRITING_DOCUMENT_TYPES).toContain('mineral_deed');
    expect(UNDERWRITING_DOCUMENT_TYPES).toContain('royalty_statement');
    expect(UNDERWRITING_DOCUMENT_TYPES).toContain('oil_gas_lease');
    expect(UNDERWRITING_DOCUMENT_TYPES).toContain('probate_order');
    expect(UNDERWRITING_DOCUMENT_TYPES).toContain('purchase_offer');

    expect(
      inferUnderwritingSituations({
        interests: [interest],
        ownerFacts: [{ value: { situationCodes: ['offer_review', 'tax_sensitive_1031'] } }],
      }),
    ).toEqual([
      'inherited_or_probate',
      'leased',
      'producing',
      'offer_review',
      'tax_sensitive_1031',
    ]);

    const requirements = buildUnderwritingRequirementDefinitions({
      situations: [
        'inherited_or_probate',
        'leased',
        'producing',
        'offer_review',
        'tax_sensitive_1031',
      ],
      interests: [interest],
    });

    expect(requirements.map((item) => item.requirementKey)).toEqual(
      expect.arrayContaining([
        `interest:${interest.id}:ownership-record`,
        `interest:${interest.id}:lease`,
        `interest:${interest.id}:royalty-statement`,
        'case:inheritance-transfer',
        'case:purchase-offer',
        'case:tax-adviser-plan',
      ]),
    );
    expect(
      requirements.find((item) => item.requirementKey === 'case:tax-adviser-plan')?.required,
    ).toBe(false);
  });

  it('derives actionable blockers until required documents are staff-verified or waived', () => {
    const situations = inferUnderwritingSituations({ interests: [interest] });
    const definitions = buildUnderwritingRequirementDefinitions({
      situations,
      interests: [interest],
    });
    const stored = definitions.map((item, index) => ({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      profile_id: '22222222-2222-4222-8222-222222222222',
      mineral_interest_id: item.mineralInterestId,
      requirement_key: item.requirementKey,
      label: item.label,
      rationale: item.rationale,
      required: item.required,
      accepted_document_types: item.acceptedDocumentTypes,
      status: 'needed' as const,
      attachment_id: null,
      verified_at: null,
      waived_at: null,
      waiver_reason: null,
      updated_at: '2026-07-22T12:00:00.000Z',
    }));
    const attachments = [
      {
        id: '33333333-3333-4333-8333-333333333331',
        mineral_interest_id: interest.id,
        document_type: 'mineral_deed',
        status: 'ready',
        updated_at: '2026-07-22T12:01:00.000Z',
      },
      {
        id: '33333333-3333-4333-8333-333333333332',
        mineral_interest_id: interest.id,
        document_type: 'oil_gas_lease',
        status: 'extracting',
        updated_at: '2026-07-22T12:01:00.000Z',
      },
    ];

    const packet = deriveUnderwritingPacket({
      situations,
      interests: [interest],
      attachments,
      requirements: stored,
      workspace,
      packet: null,
      sourceFingerprint: 'fingerprint-a',
    });

    expect(
      packet.requirements.find((item) => item.requirementKey.endsWith(':ownership-record'))
        ?.effectiveStatus,
    ).toBe('uploaded');
    expect(
      packet.requirements.find((item) => item.requirementKey.endsWith(':lease'))?.effectiveStatus,
    ).toBe('processing');
    expect(packet.canFinalize).toBe(false);
    expect(packet.blockers.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'document_needs_staff_verification',
        'document_processing_pending',
        'required_document_missing',
      ]),
    );
  });

  it('permits final readiness only when required rows are reconciled and dispositioned', () => {
    const situations = inferUnderwritingSituations({ interests: [interest] });
    const definitions = buildUnderwritingRequirementDefinitions({
      situations,
      interests: [interest],
    });
    const requirements = definitions.map((item, index) => ({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      profile_id: '22222222-2222-4222-8222-222222222222',
      mineral_interest_id: item.mineralInterestId,
      requirement_key: item.requirementKey,
      label: item.label,
      rationale: item.rationale,
      required: item.required,
      accepted_document_types: item.acceptedDocumentTypes,
      status: item.required ? ('verified' as const) : ('not_applicable' as const),
      attachment_id: item.required
        ? `33333333-3333-4333-8333-${String(index + 1).padStart(12, '0')}`
        : null,
      verified_at: item.required ? '2026-07-22T12:30:00.000Z' : null,
      waived_at: null,
      waiver_reason: null,
      updated_at: '2026-07-22T12:30:00.000Z',
    }));
    const sourceFingerprint = 'fingerprint-ready';
    const packet = deriveUnderwritingPacket({
      situations,
      interests: [interest],
      attachments: [],
      requirements,
      workspace,
      packet: {
        status: 'ready',
        source_fingerprint: sourceFingerprint,
        finalized_at: '2026-07-22T12:31:00.000Z',
      },
      sourceFingerprint,
    });

    expect(packet.blockers).toEqual([]);
    expect(packet.canFinalize).toBe(true);
    expect(packet.isFinalized).toBe(true);
    expect(packet.readinessStatus).toBe('ready');

    const stale = deriveUnderwritingPacket({
      situations,
      interests: [interest],
      attachments: [],
      requirements,
      workspace,
      packet: {
        status: 'ready',
        source_fingerprint: sourceFingerprint,
        finalized_at: '2026-07-22T12:31:00.000Z',
      },
      sourceFingerprint: 'changed-source',
    });
    expect(stale.isFinalized).toBe(false);
    expect(stale.blockers.map((item) => item.code)).toContain('packet_changed_after_finalization');
  });

  it('does not block readiness when recommended documents are unavailable', () => {
    const producingInterest = { ...interest, inherited: false };
    const situations = ['leased', 'producing'] as const;
    const definitions = buildUnderwritingRequirementDefinitions({
      situations,
      interests: [producingInterest],
    });
    const requirements = definitions.map((item) => ({
      requirement_key: item.requirementKey,
      label: item.label,
      required: item.required,
      requirement_level: item.requirementLevel,
      accepted_document_types: item.acceptedDocumentTypes,
      status: item.required ? ('verified' as const) : ('needed' as const),
      attachment_id: item.required ? crypto.randomUUID() : null,
      verified_at: item.required ? '2026-07-22T12:30:00.000Z' : null,
    }));
    const packet = deriveUnderwritingPacket({
      situations,
      interests: [producingInterest],
      attachments: [],
      requirements,
      workspace,
      sourceFingerprint: 'recommended-does-not-block',
    });

    expect(
      packet.requirements.some((item) => !item.required && item.effectiveStatus === 'missing'),
    ).toBe(true);
    expect(packet.blockers).toEqual([]);
    expect(packet.canFinalize).toBe(true);
  });

  it('keeps staff verification details and waiver reasons out of the owner checklist', () => {
    const situations = ['inherited_or_probate'] as const;
    const definitions = buildUnderwritingRequirementDefinitions({
      situations,
      interests: [interest],
    });
    const requirements = definitions.map((item, index) => ({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      profile_id: '22222222-2222-4222-8222-222222222222',
      mineral_interest_id: item.mineralInterestId,
      requirement_key: item.requirementKey,
      label: item.label,
      rationale: item.rationale,
      required: item.required,
      accepted_document_types: item.acceptedDocumentTypes,
      status: item.required ? ('waived' as const) : ('not_applicable' as const),
      attachment_id: null,
      verified_by: 'staff-secret-id',
      verified_at: null,
      waived_by: 'staff-secret-id',
      waived_at: '2026-07-22T12:30:00.000Z',
      waiver_reason: 'Staff confirmed equivalent county record outside the owner upload channel.',
      updated_at: '2026-07-22T12:30:00.000Z',
    }));
    const packet = deriveUnderwritingPacket({
      situations: [...situations],
      interests: [interest],
      attachments: [],
      requirements,
      workspace,
      packet: null,
      sourceFingerprint: 'fingerprint-owner',
    });
    const owner = projectOwnerUnderwritingChecklist(packet);
    const serialized = JSON.stringify(owner);

    expect(serialized).not.toContain('staff-secret-id');
    expect(serialized).not.toContain('equivalent county record');
    expect(serialized).not.toContain('underwriter_brief');
    expect(
      owner.items.every((item) =>
        ['complete', 'wait', 'upload', 'reupload'].includes(item.ownerAction),
      ),
    ).toBe(true);
  });

  it('enforces role separation for verification, waiver, and final readiness', () => {
    expect(canStaffPerformPacketAction('reviewer', 'verify')).toBe(true);
    expect(canStaffPerformPacketAction('reviewer', 'reopen_requirement')).toBe(true);
    expect(canStaffPerformPacketAction('reviewer', 'confirm_fact')).toBe(true);
    expect(canStaffPerformPacketAction('reviewer', 'reject_fact')).toBe(true);
    expect(canStaffPerformPacketAction('reviewer', 'waive')).toBe(false);
    expect(canStaffPerformPacketAction('reviewer', 'finalize')).toBe(false);
    expect(canStaffPerformPacketAction('underwriter', 'waive')).toBe(true);
    expect(canStaffPerformPacketAction('underwriter', 'finalize')).toBe(true);
    expect(canStaffPerformPacketAction('admin', 'finalize')).toBe(true);
  });

  it('creates a stable audit fingerprint and changes it when source evidence changes', async () => {
    const input = {
      situations: ['producing' as const],
      interests: [interest],
      attachments: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          mineral_interest_id: interest.id,
          document_type: 'royalty_statement',
          status: 'ready',
          updated_at: '2026-07-22T12:01:00.000Z',
        },
      ],
      requirements: [],
      workspace,
    };
    const first = await buildUnderwritingSourceFingerprint(input);
    const second = await buildUnderwritingSourceFingerprint({
      ...input,
      attachments: [...input.attachments].reverse(),
    });
    const changed = await buildUnderwritingSourceFingerprint({
      ...input,
      attachments: [{ ...input.attachments[0], status: 'rejected' }],
    });
    const workspaceTimestampOnly = await buildUnderwritingSourceFingerprint({
      ...input,
      workspace: { ...workspace, updated_at: '2026-07-22T13:00:00.000Z' },
    });

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
    expect(changed).not.toBe(first);
    expect(workspaceTimestampOnly).toBe(first);
  });

  it('does not preserve verification when a linked document is still processing', () => {
    const producingInterest = { ...interest, inherited: false };
    const definitions = buildUnderwritingRequirementDefinitions({
      situations: ['leased', 'producing'],
      interests: [producingInterest],
    });
    const leaseRequirement = definitions.find((item) => item.requirementKey.endsWith(':lease'))!;
    const linkedAttachmentId = '33333333-3333-4333-8333-333333333390';
    const requirements = definitions.map((item) => ({
      requirement_key: item.requirementKey,
      label: item.label,
      required: item.required,
      requirement_level: item.requirementLevel,
      accepted_document_types: item.acceptedDocumentTypes,
      status: item.requirementKey === leaseRequirement.requirementKey ? ('verified' as const) : ('waived' as const),
      attachment_id: item.requirementKey === leaseRequirement.requirementKey ? linkedAttachmentId : null,
      verified_at: item.requirementKey === leaseRequirement.requirementKey ? '2026-07-22T12:30:00.000Z' : null,
      waived_at: item.requirementKey === leaseRequirement.requirementKey ? null : '2026-07-22T12:30:00.000Z',
      waiver_reason: item.requirementKey === leaseRequirement.requirementKey ? null : 'Equivalent record reviewed by staff.',
    }));
    const packet = deriveUnderwritingPacket({
      situations: ['leased', 'producing'],
      interests: [producingInterest],
      attachments: [
        {
          id: linkedAttachmentId,
          mineral_interest_id: producingInterest.id,
          document_type: 'oil_gas_lease',
          status: 'extracting',
        },
      ],
      requirements,
      workspace,
      sourceFingerprint: 'processing-linked-document',
    });
    expect(
      packet.requirements.find((item) => item.requirementKey === leaseRequirement.requirementKey)
        ?.effectiveStatus,
    ).toBe('processing');
    expect(packet.blockers.map((item) => item.code)).toContain('document_processing_pending');
    expect(packet.canFinalize).toBe(false);
  });

  it('treats a verified requirement with a deleted attachment as unresolved', () => {
    const packet = deriveUnderwritingPacket({
      situations: ['producing'],
      interests: [{ ...interest, inherited: false, lease_status: 'yes', producing_status: 'yes' }],
      attachments: [],
      requirements: [
        {
          requirement_key: `interest:${interest.id}:royalty-statement`,
          label: 'Recent royalty statement',
          required: true,
          requirement_level: 'required',
          accepted_document_types: ['royalty_statement'],
          status: 'verified',
          attachment_id: null,
        },
      ],
      workspace,
      sourceFingerprint: 'deleted-attachment',
    });
    expect(
      packet.requirements.find((item) => item.requirementKey.endsWith(':royalty-statement'))
        ?.effectiveStatus,
    ).toBe('missing');
    expect(packet.canFinalize).toBe(false);
  });

  it('does not accept a waiver without a verifier, timestamp, and reason', () => {
    const packet = deriveUnderwritingPacket({
      situations: ['producing'],
      interests: [{ ...interest, inherited: false, lease_status: 'yes', producing_status: 'yes' }],
      attachments: [],
      requirements: [
        {
          requirement_key: `interest:${interest.id}:royalty-statement`,
          label: 'Recent royalty statement',
          required: true,
          requirement_level: 'required',
          accepted_document_types: ['royalty_statement'],
          status: 'waived',
          attachment_id: null,
          waived_by: null,
          waived_at: null,
          waiver_reason: 'too short',
        },
      ],
      workspace,
      sourceFingerprint: 'incomplete-waiver',
    });
    expect(packet.blockers.map((item) => item.code)).toContain('waiver_incomplete');
    expect(packet.canFinalize).toBe(false);
  });

  it('blocks final readiness while extracted facts remain candidates', () => {
    const packet = deriveUnderwritingPacket({
      situations: [],
      interests: [],
      attachments: [],
      requirements: [],
      ownerFacts: [
        {
          field: 'operator',
          value: 'Candidate operator',
          status: 'candidate',
          updated_at: '2026-07-22T12:00:00.000Z',
        },
      ],
      workspace,
      sourceFingerprint: 'candidate-fact',
    });
    expect(packet.canFinalize).toBe(false);
    expect(packet.blockers.map((item) => item.code)).toContain('candidate_facts_unresolved');
    expect(packet.readiness.version).toBe('mrx-underwriting-readiness-v1');
  });
});
