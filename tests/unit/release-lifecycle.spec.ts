/**
 * tests/unit/release-lifecycle.spec.ts
 *
 * Fail-closed unit tests for the canonical article-lifecycle dashboard
 * and earned scale-gate machinery declared in src/lib/release-lifecycle.ts.
 *
 * These tests pin:
 *   - the seven-stage lifecycle derivation order (including the two
 *     program-state markers `authorized_admitted` and `public_live_legacy`);
 *   - the fail-closed evidence-packet validator;
 *   - the earned scale-gate 10->25 / 25->50 evaluation contract;
 *   - the signed-CEO-decision parser;
 *   - the aggregate cap accounting and per-row disposition logic that
 *     downstream dashboards and scripts rely on.
 *
 * The lifecycle library is pure (no I/O); these tests do not touch the
 * filesystem. They are the canonical source of truth for the contract the
 * release-gate scripts depend on.
 */

import { describe, expect, it } from 'vitest';

import {
  LIFECYCLE_STAGES,
  PROGRAM_STATE_STAGES,
  buildAuthorizedAdmittedLookup,
  buildPublicLiveLegacyLookup,
  deriveArticleLifecycleStage,
  evaluateEvidencePacket,
  evaluateReleaseGates,
  legacyLiveRowsFromLedger,
  normalizeCanonicalUrl,
  parseReleaseDecisionArtifact,
  stageAuthorityRank,
  summarizeReleaseGates,
} from '../../src/lib/release-lifecycle';

import type {
  AuthorizedBatch,
  AuthorizedBatchEntry,
  ArticleLifecycleStage,
  GateEvidencePacket,
  GateLifecycleRow,
} from '../../src/lib/release-lifecycle';

/* ---------- constants ---------- */

const HEX64 = 'a'.repeat(64);
const HEX64_B = 'b'.repeat(64);
const HEX64_C = 'c'.repeat(64);
const HEX64_D = 'd'.repeat(64);

/* ---------- fixtures ---------- */

function evidencePacket(overrides: Partial<GateEvidencePacket> = {}): GateEvidencePacket {
  return {
    evidence_packet_path: 'artifacts/mrx1000-release-10/evidence/sample.json',
    title: 'Sample article',
    editorial_disposition: 'PASS',
    factual_citation_disposition: 'PASS',
    compliance_disposition: 'PASS',
    body_sha256: HEX64,
    frontmatter_sha256: HEX64_B,
    reviewers: [
      { id: 'editor-1', capability: 'editorial', verdict: 'PASS' },
      { id: 'factual-1', capability: 'factual_citation', verdict: 'PASS' },
      { id: 'compliance-1', capability: 'compliance', verdict: 'PASS' },
    ],
    claim_to_source: [
      { claim: 'numeric claim about RRC data', source_url: 'https://www.rrc.texas.gov/example', accessed_at: '2026-07-21' },
      { claim: 'price-series context', source_url: 'https://www.eia.gov/example', accessed_at: '2026-07-21' },
    ],
    review_manifest: ['editorial', 'factual_citation', 'compliance'].map((capability) => ({
      reviewer_id: `${capability}-1`,
      capability,
      disposition: 'PASS' as const,
      reviewed_at: '2026-07-21T12:00:00Z',
      input_body_sha256: HEX64,
      input_frontmatter_sha256: HEX64_B,
      output_artifact_path: `artifacts/reviews/${capability}.json`,
      output_artifact_sha256: HEX64,
      findings: [`${capability} checks completed`],
    })),
    compliance_checklist: { disposition: 'PASS', checks: ['no guarantees'] },
    seo_aeo_checklist: { disposition: 'PASS', checks: ['answer-first'] },
    asset_manifest: {
      evidence_path: 'artifacts/assets.json',
      evidence_sha256: HEX64,
      frontmatter_sha256: HEX64_B,
      disposition: 'PASS',
      assets: ['hero', 'social', 'inline'].map((kind) => ({
        kind: kind as 'hero' | 'social' | 'inline',
        public_path: `/assets/${kind}.webp`,
        sha256: HEX64,
        alt_text: `${kind} alt`,
        provenance: 'MRX owned',
        license: 'MRX-owned',
        perceptual_hash: '0123456789abcdef',
        rendered_text: kind === 'inline' ? 'sample keyword' : 'Sample article title',
        filename_text_identity: true,
        canonical_surface_identity: true,
        ocr_verified: true,
        disposition: 'PASS' as const,
      })),
    },
    publication_manifest: {
      evidence_path: 'artifacts/publication.json',
      evidence_sha256: HEX64,
      disposition: 'READY',
      source_path: 'src/content/posts/sample.mdx',
      body_sha256: HEX64,
      frontmatter_sha256: HEX64_B,
      expected_targets: ['production'],
      rollback_reference: 'rollback:sample',
      release_owner: 'release-owner',
    },
    ...overrides,
  };
}

function authorizedEntry(slug: string, programRowId: string, url?: string): AuthorizedBatchEntry {
  return {
    program_row_id: programRowId,
    slug,
    title: `Title for ${slug}`,
    canonical_url: url ?? `https://mineralrightsxchange.com/blog/${slug}/`,
    pillar: 'texas-mineral-rights',
    cluster: 'texas-county-basin-local-intent',
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${slug}.json`,
    evidence_packet_path_required: true,
    content_genius_article_uuid: null,
  };
}

function authorizedBatch(entries: AuthorizedBatchEntry[]): AuthorizedBatch {
  return {
    authorization_cap_released_articles: 10,
    articles: entries,
    decision_authority: {
      capping_decision_id: 'D-2026-0721-21',
      capping_decision_path: 'artifacts/mrx1000-release-10/decisions/mrx-ceo-successor-editorial-gate-decision.md',
      capping_decision_sha256: HEX64,
      successor_gate_decision_id: 'D-2026-0721-21',
      successor_gate_decision_path: 'artifacts/mrx1000-release-10/decisions/mrx-ceo-successor-editorial-gate-decision.md',
      successor_gate_decision_sha256: HEX64,
    },
    policy: {
      authorization_cap_released_articles: 10,
      fail_closed: true,
      earned_scale_gates: [
        {
          from_cap: 10,
          to_cap: 25,
          next_decision_id_required: 'D-2026-0721-22',
          minimum_observation_window_days: 7,
          minimum_index_coverage_pct_within_window: 80,
          index_coverage_window_days: 30,
          minimum_independent_audit_sample_size: 3,
          audit_must_include_legal_tax_valuation_sensitive_articles: true,
          no_open_critical_or_high_findings_required: true,
          release_rollback_evidence_required: true,
          batch_retrospective_required: true,
          no_repeated_systemic_defect_required: true,
          scale_capacity_review_required: false,
        },
        {
          from_cap: 25,
          to_cap: 50,
          next_decision_id_required: 'D-2026-0721-23',
          minimum_observation_window_days: 14,
          minimum_index_coverage_pct_within_window: 80,
          index_coverage_window_days: 30,
          minimum_independent_audit_sample_size: 5,
          minimum_independent_audit_sample_pct: 20,
          audit_must_include_all_high_risk_legal_tax_valuation_articles: true,
          no_open_critical_or_high_findings_required: true,
          release_rollback_evidence_required: true,
          batch_retrospective_required: true,
          no_repeated_systemic_defect_required: true,
          scale_capacity_review_required: true,
        },
      ],
    },
  };
}

/* ---------- constants & types ---------- */

describe('release-lifecycle constants', () => {
  it('declares the seven canonical lifecycle stages in publish-order', () => {
    expect(LIFECYCLE_STAGES).toEqual([
      'draft',
      'searchatlas_review',
      'editorial_review',
      'compliance_review',
      'approved',
      'published',
      'retired',
    ]);
  });

  it('declares the two program-state markers outside the authoring order', () => {
    expect(PROGRAM_STATE_STAGES).toEqual(['authorized_admitted', 'public_live_legacy']);
  });

  it('assigns authority ranks with retired as the floor and legacy as the ceiling', () => {
    expect(stageAuthorityRank('retired')).toBeLessThan(stageAuthorityRank('draft'));
    expect(stageAuthorityRank('public_live_legacy')).toBeGreaterThan(
      stageAuthorityRank('authorized_admitted'),
    );
    expect(stageAuthorityRank('authorized_admitted')).toBeGreaterThan(stageAuthorityRank('published'));
  });
});

/* ---------- normalizeCanonicalUrl ---------- */

describe('normalizeCanonicalUrl', () => {
  it('lowercases, trims whitespace, and removes trailing slashes', () => {
    expect(normalizeCanonicalUrl('  HTTPS://Example.com/Blog/Foo/  ')).toBe('https://example.com/blog/foo');
  });
});

/* ---------- deriveArticleLifecycleStage ---------- */

describe('deriveArticleLifecycleStage', () => {
  const lookups = {
    authorizedAdmitted: buildAuthorizedAdmittedLookup([
      authorizedEntry('how-title-defects-change-mineral-rights-offer', 'MRX1000-0001'),
    ]),
    publicLiveLegacy: buildPublicLiveLegacyLookup([
      { program_row_id: 'LEGACY-0001', slug: 'legacy-article', canonical_url: 'https://mineralrightsxchange.com/blog/legacy-article/' },
    ]),
  };

  it('defaults to `draft` when publication_status is omitted', () => {
    expect(deriveArticleLifecycleStage({}, lookups)).toBe('draft');
  });

  it('classifies a publication_status=published row in the authorized batch as `authorized_admitted`', () => {
    expect(
      deriveArticleLifecycleStage(
        {
          publication_status: 'published',
          canonical_slug: 'how-title-defects-change-mineral-rights-offer',
        },
        lookups,
      ),
    ).toBe('authorized_admitted');
  });

  it('fails closed when a slug matches the batch but the supplied program_row_id conflicts', () => {
    expect(
      deriveArticleLifecycleStage(
        {
          publication_status: 'published',
          program_row_id: 'MRX1000-WRONG-ID',
          canonical_slug: 'how-title-defects-change-mineral-rights-offer',
        },
        lookups,
      ),
    ).toBe('published');
  });

  it('classifies a publication_status=published legacy row as `public_live_legacy`', () => {
    expect(
      deriveArticleLifecycleStage(
        {
          publication_status: 'published',
          canonical_slug: 'legacy-article',
        },
        lookups,
      ),
    ).toBe('public_live_legacy');
  });

  it('classifies a publication_status=published row without a program-state marker as plain `published` (a structural violation the gate must catch)', () => {
    expect(
      deriveArticleLifecycleStage(
        {
          publication_status: 'published',
          canonical_slug: 'no-such-slug-in-any-program',
        },
        lookups,
      ),
    ).toBe('published');
  });

  it('short-circuits publication_status=published to `draft` when draft: true', () => {
    expect(
      deriveArticleLifecycleStage(
        { publication_status: 'published', draft: true, canonical_slug: 'how-title-defects-change-mineral-rights-offer' },
        lookups,
      ),
    ).toBe('draft');
  });

  it('short-circuits publication_status=published to `draft` when noindex: true', () => {
    expect(
      deriveArticleLifecycleStage(
        { publication_status: 'published', noindex: true, canonical_slug: 'how-title-defects-change-mineral-rights-offer' },
        lookups,
      ),
    ).toBe('draft');
  });

  it('prioritizes `retired` over every other stage including `published`', () => {
    expect(
      deriveArticleLifecycleStage(
        {
          publication_status: 'published',
          canonical_slug: 'how-title-defects-change-mineral-rights-offer',
        },
        lookups,
      ),
    ).toBe('authorized_admitted');
    expect(
      deriveArticleLifecycleStage(
        {
          publication_status: 'retired',
          canonical_slug: 'how-title-defects-change-mineral-rights-offer',
        },
        lookups,
      ),
    ).toBe('retired');
  });

  it('routes review_status hints through compliance -> editorial -> searchatlas -> draft', () => {
    // publication_status is deliberately left empty so the hint-derived
    // branch is exercised end-to-end.
    expect(
      deriveArticleLifecycleStage(
        { review_status: 'compliance pending' },
        lookups,
      ),
    ).toBe('compliance_review');
    expect(
      deriveArticleLifecycleStage(
        { review_status: 'editorial pending' },
        lookups,
      ),
    ).toBe('editorial_review');
    expect(
      deriveArticleLifecycleStage(
        { review_status: 'searchatlas pending' },
        lookups,
      ),
    ).toBe('searchatlas_review');
  });
});

/* ---------- program-state lookups ---------- */

describe('buildAuthorizedAdmittedLookup', () => {
  it('indexes entries by program_row_id, slug, and normalized canonical_url', () => {
    const entry = authorizedEntry('a', 'A-1', 'https://mineralrightsxchange.com/blog/a/');
    const lookup = buildAuthorizedAdmittedLookup([entry]);
    expect(lookup.byProgramRowId.get('A-1')).toBe(entry);
    expect(lookup.bySlug.get('a')).toBe(entry);
    expect(lookup.byCanonicalUrl.get('https://mineralrightsxchange.com/blog/a')).toBe(entry);
  });
});

describe('buildPublicLiveLegacyLookup', () => {
  it('drops rows with missing identity fields', () => {
    const lookup = buildPublicLiveLegacyLookup([
      { program_row_id: '', slug: 'has-slug-only', canonical_url: null },
      { program_row_id: null, slug: null, canonical_url: 'https://mineralrightsxchange.com/blog/has-url-only/' },
    ]);
    expect(lookup.bySlug.has('has-slug-only')).toBe(true);
    expect(lookup.byCanonicalUrl.has('https://mineralrightsxchange.com/blog/has-url-only')).toBe(true);
    expect(lookup.byProgramRowId.size).toBe(0);
  });
});

describe('legacyLiveRowsFromLedger', () => {
  it('returns rows whose preservation_classification is `live_public_published_route` and publication_gate_nonpublic is false', () => {
    const keep = legacyLiveRowsFromLedger([
      {
        program_row_id: 'A',
        canonical_slug: 'a',
        canonical_url: 'https://mineralrightsxchange.com/blog/a/',
        preservation_classification: 'live_public_published_route',
        publication_gate_nonpublic: false,
      },
    ]);
    expect(keep).toHaveLength(1);
    expect(keep[0]).toEqual({
      program_row_id: 'A',
      slug: 'a',
      canonical_url: 'https://mineralrightsxchange.com/blog/a/',
    });

    expect(
      legacyLiveRowsFromLedger([
        {
          program_row_id: 'B',
          canonical_slug: 'b',
          canonical_url: 'https://mineralrightsxchange.com/blog/b/',
          preservation_classification: 'live_public_published_route',
          publication_gate_nonpublic: true,
        },
      ]),
    ).toEqual([]);
  });
});

/* ---------- evaluateEvidencePacket ---------- */

describe('evaluateEvidencePacket', () => {
  it('passes a complete packet with two reviewers covering all three capabilities', () => {
    const verdict = evaluateEvidencePacket(evidencePacket());
    expect(verdict.ok).toBe(true);
    expect(verdict.failures).toEqual([]);
  });

  it('keeps reviews bound to pre-flip bytes during the exact authorized publication transition', () => {
    const packet = evidencePacket({
      body_sha256: HEX64_C,
      frontmatter_sha256: HEX64_D,
      body_sha256_matches_declared_or_authorized_transition: true,
      controlled_publication_transition: {
        authorized: true,
        state: 'controlled_publication_transition',
        exact_admission: true,
        reviewed_body_sha256: HEX64,
        reviewed_frontmatter_sha256: HEX64_B,
        current_body_sha256: HEX64_C,
        current_frontmatter_sha256: HEX64_D,
        normalized_body_sha256: HEX64,
        changes: [
          { field: 'publication_status', from: 'draft', to: 'published' },
          { field: 'noindex', from: true, to: false },
        ],
      },
      asset_manifest: {
        ...evidencePacket().asset_manifest,
        frontmatter_sha256: HEX64_D,
      },
      publication_manifest: {
        ...evidencePacket().publication_manifest,
        body_sha256: HEX64_C,
        frontmatter_sha256: HEX64_D,
      },
    });

    expect(evaluateEvidencePacket(packet)).toEqual({ ok: true, failures: [] });
  });

  it('rejects a claimed publication transition with any extra or reordered change', () => {
    const packet = evidencePacket({
      body_sha256: HEX64_C,
      frontmatter_sha256: HEX64_D,
      body_sha256_matches_declared_or_authorized_transition: true,
      controlled_publication_transition: {
        authorized: true,
        state: 'controlled_publication_transition',
        exact_admission: true,
        reviewed_body_sha256: HEX64,
        reviewed_frontmatter_sha256: HEX64_B,
        current_body_sha256: HEX64_C,
        current_frontmatter_sha256: HEX64_D,
        normalized_body_sha256: HEX64,
        changes: [
          { field: 'noindex', from: true, to: false },
          { field: 'publication_status', from: 'draft', to: 'published' },
        ],
      },
      asset_manifest: {
        ...evidencePacket().asset_manifest,
        frontmatter_sha256: HEX64_D,
      },
      publication_manifest: {
        ...evidencePacket().publication_manifest,
        body_sha256: HEX64_C,
        frontmatter_sha256: HEX64_D,
      },
    });

    const verdict = evaluateEvidencePacket(packet);
    expect(verdict.ok).toBe(false);
    expect(verdict.failures).toContain(
      'review_manifest must contain three hash-locked PASS review passes',
    );
  });

  it('fails closed when any required key is missing', () => {
    const verdict = evaluateEvidencePacket(
      evidencePacket({ editorial_disposition: undefined as unknown as GateEvidencePacket['editorial_disposition'] }),
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.some((f) => f.includes('editorial_disposition'))).toBe(true);
  });

  it('rejects a packet whose dispositions are not all PASS', () => {
    const verdict = evaluateEvidencePacket(evidencePacket({ compliance_disposition: 'FAIL' }));
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.some((f) => f.includes('compliance_disposition'))).toBe(true);
  });

  it('rejects a packet with malformed SHA-256 digests', () => {
    const verdict = evaluateEvidencePacket(evidencePacket({ body_sha256: 'not-a-hash' }));
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.some((f) => f.includes('body_sha256'))).toBe(true);
  });

  it('rejects a packet with fewer than two reviewers', () => {
    const verdict = evaluateEvidencePacket(
      evidencePacket({
        reviewers: [{ id: 'a', capability: 'editorial', verdict: 'PASS' }],
      }),
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.some((f) => f.includes('two separated reviewer'))).toBe(true);
  });

  it('rejects a packet where the reviewers do not cover all three capabilities', () => {
    const verdict = evaluateEvidencePacket(
      evidencePacket({
        reviewers: [
          { id: 'editor-1', capability: 'editorial', verdict: 'PASS' },
          { id: 'editor-2', capability: 'editorial', verdict: 'PASS' },
        ],
      }),
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.some((f) => f.includes('collectively cover'))).toBe(true);
  });

  it('rejects a packet with an empty or malformed claim_to_source ledger', () => {
    expect(evaluateEvidencePacket(evidencePacket({ claim_to_source: [] })).ok).toBe(false);
    expect(
      evaluateEvidencePacket(
        evidencePacket({
          claim_to_source: [{ claim: '', source_url: 'https://x', accessed_at: '2026-07-21' }],
        }),
      ).ok,
    ).toBe(false);
  });
});

/* ---------- parseReleaseDecisionArtifact ---------- */

describe('parseReleaseDecisionArtifact', () => {
  it('returns a HOLD decision when the body is empty', () => {
    const decision = parseReleaseDecisionArtifact({
      path: 'artifacts/mrx1000-release-10/decisions/sample.md',
      text: '',
      sha256: HEX64,
    });
    expect(decision.signed).toBe(true);
    expect(decision.disposition).toBe('HOLD');
    expect(decision.release_authorized).toBe(false);
  });

  it('returns an APPROVED decision with release_authorized=true when the body carries the canonical phrases', () => {
    const body = [
      '# Decision D-2026-0721-21',
      '',
      'Disposition: APPROVED',
      '',
      'AUTHORIZATION CAP TOTAL RELEASED ARTICLES: 10',
      'release_authorized: true',
      'index_authorized: true',
    ].join('\n');
    const decision = parseReleaseDecisionArtifact({
      path: 'artifacts/mrx1000-release-10/decisions/decision.md',
      text: body,
      sha256: HEX64,
    });
    expect(decision.decision_id).toBe('D-2026-0721-21');
    expect(decision.disposition).toBe('APPROVED');
    expect(decision.authorization_cap_total_released_articles).toBe(10);
    expect(decision.release_authorized).toBe(true);
    expect(decision.index_authorized).toBe(true);
  });

  it('does not invent release or indexing authorization from the D-2026-0721-21 successor-gate approval', () => {
    const body = [
      '# Signed Successor Decision',
      '',
      '- **Decision ID:** D-2026-0721-21',
      '- **Status:** APPROVED — EFFECTIVE IMMEDIATELY; FAIL-CLOSED',
      '- **Decision:** AUTHORIZE_SUCCESSOR_GATE_FOR_EXACT_AUTHORIZED_10_ONLY',
      '',
      'Authorization, if earned, is capped at **25 total released articles**, not 25 additional articles.',
    ].join('\n');
    const decision = parseReleaseDecisionArtifact({
      path: 'artifacts/mrx1000-release-10/decisions/mrx-ceo-successor-editorial-gate-decision.md',
      text: body,
      sha256: HEX64,
    });
    expect(decision.decision_id).toBe('D-2026-0721-21');
    expect(decision.disposition).toBe('APPROVED');
    expect(decision.release_authorized).toBe(false);
    expect(decision.index_authorized).toBe(false);
  });

  it('flips signed=false when the provided sha256 does not match expectedSha256', () => {
    const decision = parseReleaseDecisionArtifact({
      path: 'x.md',
      text: 'STATUS: APPROVED, Disposition: APPROVED, release_authorized: true, index_authorized: true, D-2026-0721-21',
      sha256: '0'.repeat(64),
      expectedSha256: 'f'.repeat(64),
    });
    expect(decision.signed).toBe(false);
    expect(decision.signed_artifact_sha256_verified).toBe(false);
  });

  it('treats a HOLD disposition as not authorizing release', () => {
    const body = 'D-2026-0721-21 Disposition: HOLD';
    const decision = parseReleaseDecisionArtifact({
      path: 'x.md',
      text: body,
      sha256: HEX64,
    });
    expect(decision.disposition).toBe('HOLD');
    expect(decision.release_authorized).toBe(false);
  });
});

/* ---------- evaluateReleaseGates ---------- */

describe('evaluateReleaseGates', () => {
  function row(stage: ArticleLifecycleStage, slug: string | null, prid: string | null): GateLifecycleRow {
    return {
      program_row_id: prid,
      slug,
      canonical_url: slug ? `https://mineralrightsxchange.com/blog/${slug}/` : 'https://mineralrightsxchange.com/blog/orphan/',
      pillar: 'texas-mineral-rights',
      cluster: 'texas-county-basin-local-intent',
      lifecycle_stage: stage,
      is_published_in_dist_sitemap: stage === 'authorized_admitted' || stage === 'public_live_legacy',
    };
  }

  const approvedDecisionBody = [
    'D-2026-0721-21',
    'STATUS: APPROVED — EFFECTIVE IMMEDIATELY; FAIL-CLOSED',
    'AUTHORIZATION CAP TOTAL RELEASED ARTICLES: 10',
    'release_authorized: true',
    'index_authorized: true',
  ].join('\n');

  const releaseDecision = parseReleaseDecisionArtifact({
    path: 'artifacts/mrx1000-release-10/decisions/mrx-ceo-successor-editorial-gate-decision.md',
    text: approvedDecisionBody,
    sha256: HEX64,
  });

  const legacyRows = [
    { program_row_id: 'L-1', slug: 'legacy-public', canonical_url: 'https://mineralrightsxchange.com/blog/legacy-public/' },
  ];

  it('rejects with blocking findings when no signed decision exists', () => {
    const batch = authorizedBatch([authorizedEntry('a', 'A-1')]);
    const result = evaluateReleaseGates({
      releaseDecision: null,
      authorizedBatch: batch,
      publicLiveLegacyRows: [],
      rows: [],
      evidencePacketLookup: () => evidencePacket(),
    });
    expect(result.policy.release_authorized).toBe(false);
    expect(result.blocking_findings.length).toBeGreaterThan(0);
    expect(result.blocking_findings[0]).toMatch(/No signed release decision/);
  });

  it('blocks unauthorized publication: a row published without authorization or legacy marker', () => {
    const batch = authorizedBatch([authorizedEntry('a', 'A-1')]);
    const result = evaluateReleaseGates({
      releaseDecision: releaseDecision,
      authorizedBatch: batch,
      publicLiveLegacyRows: [],
      rows: [row('published', 'a-published-not-authorized', 'X-1')],
      evidencePacketLookup: () => evidencePacket(),
    });
    expect(result.cap.cap_exceeded).toBe(false);
    expect(result.aggregate_counts.unauthorized_published_rows).toBe(1);
    expect(result.aggregate_counts.unauthorized_published_slugs).toEqual(['a-published-not-authorized']);
    expect(result.blocking_findings.some((f) => f.includes('Unauthorized publication'))).toBe(true);
  });

  it('enforces the cap: blocks more than 10 authorized_admitted rows', () => {
    const entries = Array.from({ length: 11 }, (_, i) =>
      authorizedEntry(`slug-${i}`, `PR-${i}`, `https://mineralrightsxchange.com/blog/slug-${i}/`),
    );
    const batch = authorizedBatch(entries);
    const rows = entries.map((e, i) => row('authorized_admitted', e.slug, e.program_row_id));
    // Simulate 11 dist-sitemap-published admitted rows so the cap check
    // engages. Use a flagged evidence packet for one of them so the gate
    // surfaces an evidence finding as well.
    const result = evaluateReleaseGates({
      releaseDecision: releaseDecision,
      authorizedBatch: batch,
      publicLiveLegacyRows: [],
      rows,
      evidencePacketLookup: (entry) => (entry.program_row_id === 'PR-10' ? null : evidencePacket()),
    });
    expect(result.cap.cap_exceeded).toBe(true);
    expect(result.cap.observed_release_total).toBe(11);
    expect(result.cap.cap_exceeded_slugs.length).toBeGreaterThan(0);
    expect(result.evidence.packets_required).toBe(11);
    expect(result.evidence.packets_present).toBe(10);
    expect(result.evidence.packets_failing).toBe(1);
  });

  it('passes cap accounting for the exact authorized 10 with evidence present', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      authorizedEntry(`slug-${i}`, `PR-${i}`, `https://mineralrightsxchange.com/blog/slug-${i}/`),
    );
    const batch = authorizedBatch(entries);
    const rows = entries.map((e) => row('authorized_admitted', e.slug, e.program_row_id));
    const result = evaluateReleaseGates({
      releaseDecision: releaseDecision,
      authorizedBatch: batch,
      publicLiveLegacyRows: legacyRows,
      rows: [...rows, row('public_live_legacy', 'legacy-public', 'L-1')],
      evidencePacketLookup: () => evidencePacket(),
    });
    expect(result.cap.cap_exceeded).toBe(false);
    expect(result.cap.observed_release_total).toBe(10);
    expect(result.cap.cap_remaining).toBe(0);
    expect(result.evidence.packets_required).toBe(10);
    expect(result.evidence.packets_passing).toBe(10);
    expect(result.aggregate_counts.authorized_admitted_rows).toBe(10);
    expect(result.aggregate_counts.public_live_legacy_rows).toBe(1);
  });

  it('blocks 10->25 when observation window is too short and no signed next-decision exists', () => {
    const batch = authorizedBatch([authorizedEntry('a', 'A-1')]);
    const result = evaluateReleaseGates({
      releaseDecision: releaseDecision,
      authorizedBatch: batch,
      publicLiveLegacyRows: [],
      rows: [],
      evidencePacketLookup: () => evidencePacket(),
      earnedScaleGateObservations: {
        // Partial — observation window short; no decision artifact.
        ...{
          '10_to_25': {
            observation_window_days_observed: 2,
            index_coverage_pct_observed: 0,
            index_coverage_window_days_observed: 0,
            independent_audit_sample_size: 1,
            open_critical_or_high_findings: 0,
            rollback_evidence_present: true,
            batch_retrospective_present: true,
            no_repeated_systemic_defect: true,
          },
        },
      } as Partial<Record<'10_to_25' | '25_to_50', import('../../src/lib/release-lifecycle').EarnedScaleGateObservation>>,
    });
    const gate = result.earned_scale_gates.find((g) => g.from_cap === 10 && g.to_cap === 25);
    expect(gate).toBeDefined();
    expect(gate?.disposition).toBe('BLOCK');
    expect(gate?.preconditions_missing.some((m) => m.includes('observation window'))).toBe(true);
    expect(gate?.preconditions_missing.some((m) => m.includes('index coverage'))).toBe(true);
    expect(gate?.preconditions_missing.some((m) => m.includes('signed D-2026-0721-22'))).toBe(true);
    expect(result.blocking_findings.some((f) => f.includes('Earned scale-gate'))).toBe(false);
    expect(result.informational_findings.some((f) => f.includes('Future earned scale-gate 10 to 25'))).toBe(true);
  });

  it('passes 10->25 only when all preconditions AND the signed next-decision are present', () => {
    const batch = authorizedBatch([authorizedEntry('a', 'A-1')]);
    const result = evaluateReleaseGates({
      releaseDecision: releaseDecision,
      authorizedBatch: batch,
      publicLiveLegacyRows: [],
      rows: [],
      evidencePacketLookup: () => evidencePacket(),
      earnedScaleGateObservations: {
        ...{
          '10_to_25': {
            observation_window_days_observed: 10,
            index_coverage_pct_observed: 82,
            index_coverage_window_days_observed: 28,
            independent_audit_sample_size: 5,
            high_risk_legal_tax_valuation_articles_in_audit: 1,
            high_risk_legal_tax_valuation_articles_in_population: 1,
            open_critical_or_high_findings: 0,
            rollback_evidence_present: true,
            batch_retrospective_present: true,
            no_repeated_systemic_defect: true,
            next_decision_signed_artifact_path: 'artifacts/mrx1000-release-10/decisions/D-2026-0721-22.md',
            next_decision_signed_artifact_sha256: HEX64,
            next_decision_disposition: 'APPROVED',
          },
        },
      } as Partial<Record<'10_to_25' | '25_to_50', import('../../src/lib/release-lifecycle').EarnedScaleGateObservation>>,
    });
    const gate = result.earned_scale_gates.find((g) => g.from_cap === 10 && g.to_cap === 25);
    expect(gate?.disposition).toBe('PASS');
    expect(gate?.preconditions_missing).toEqual([]);
  });

  it('emits a precise per-row disposition matrix with cap_and_evidence verdicts', () => {
    const entries = [
      authorizedEntry('a', 'A-1'),
      authorizedEntry('b', 'A-2'),
    ];
    const batch = authorizedBatch(entries);
    const result = evaluateReleaseGates({
      releaseDecision: releaseDecision,
      authorizedBatch: batch,
      publicLiveLegacyRows: [],
      rows: [
        row('authorized_admitted', 'a', 'A-1'),
        row('authorized_admitted', 'b', 'A-2'),
        row('public_live_legacy', 'legacy-1', 'L-1'),
      ],
      evidencePacketLookup: (entry) => (entry.slug === 'b' ? null : evidencePacket()),
    });
    expect(result.dispositions_by_row).toHaveLength(3);
    expect(result.dispositions_by_row.find((r) => r.slug === 'a')?.evidence_disposition).toBe('PASS');
    expect(result.dispositions_by_row.find((r) => r.slug === 'b')?.evidence_disposition).toBe('MISSING');
    expect(result.dispositions_by_row.find((r) => r.slug === 'legacy-1')?.evidence_disposition).toBe(
      'NOT_REQUIRED',
    );
    expect(result.dispositions_by_row.find((r) => r.slug === 'b')?.cap_against_authorization).toBe('OK');
  });

  it('summarizeReleaseGates returns a JSON-roundtrip of the gate result', () => {
    const entries = [authorizedEntry('a', 'A-1')];
    const batch = authorizedBatch(entries);
    const result = evaluateReleaseGates({
      releaseDecision: releaseDecision,
      authorizedBatch: batch,
      publicLiveLegacyRows: [],
      rows: [row('authorized_admitted', 'a', 'A-1')],
      evidencePacketLookup: () => evidencePacket(),
    });
    const summary = summarizeReleaseGates(result);
    expect(JSON.parse(JSON.stringify(summary))).toEqual(summary);
  });
});
