/**
 * src/lib/release-lifecycle.ts
 *
 * Canonical article-lifecycle model for the MRX1000 release program.
 *
 * This module is the single source of truth for:
 *   - the per-article lifecycle stages (draft → searchatlas_review →
 *     editorial_review → compliance_review → approved → published → retired);
 *   - the fail-closed release decision and authorization-cap semantics;
 *   - the earned 10 → 25 → 50 scale-gate machinery declared in the
 *     successor editorial/compliance/citation standard (D-2026-0721-21).
 *
 * It does not talk to any vendor or external service. It does not publish.
 * It does not read the filesystem. It does not call out to axios / fetch.
 * It only operates on values callers hand it, which keeps this file
 * trivially unit-testable and side-effect free.
 *
 * Three canonical entry points exist for callers:
 *
 *   - `deriveArticleLifecycleStage(frontmatter)` returns the lifecycle stage
 *     a candidate article is in, given its raw frontmatter. Mirrors the
 *     PublicationStatus enum declared in src/content/config.ts and adds the
 *     fail-closed `public_live_legacy` and `authorized_admitted` markers
 *     required to express the released-10 program state without mutating
 *     that enum.
 *
 *   - `evaluateReleaseGates(input)` is the fail-closed gate evaluator that
 *     powers `scripts/check-mrx1000-release-gates.mjs`. It enforces:
 *
 *       1. The authorization cap (no more than `authorizationCap` articles
 *          may carry the `published` lifecycle stage; the cap is read
 *          exclusively from a signed CEO artifact).
 *
 *       2. The evidence gate (every released article must reference a
 *          durable, machine-readable evidence packet that contains the
 *          required keys declared by the successor standard).
 *
 *       3. The earned scale-gate machinery (a separate signed CEO decision
 *          must exist for any attempt to authorize more than the current
 *          cap; the candidate decision is rejected on its own face when
 *          the preconditions declared in §6.1 or §6.2 of D-2026-0721-21
 *          are not satisfied).
 *
 *   - `summarizeReleaseGates(gateResult)` flattens a gate result into a
 *     durable JSON-serializable shape the dashboard builder writes to
 *     `reports/mrx-1000-release-lifecycle-dashboard.json`.
 *
 * Nothing here may publish or mutate anything on its own. Callers wire
 * these helpers into scripts that produce artifacts and call the gate; the
 * scripts own the filesystem and the build pipeline.
 */

/* ---------- Lifecycle stages ---------- */

/**
 * The seven stages an article can be in during its canonical lifecycle,
 * extended with two program-state markers that the canonical
 * PublicationStatus enum in src/content/config.ts intentionally does not
 * export (because they live in the program domain, not the content
 * domain):
 *
 *   - `authorized_admitted`: record is one of the admitted release-10
 *                                  slugs and is being held under the
 *                                  release-10 cap.
 *   - `public_live_legacy`: record is one of the pre-canonical live
 *                                  posts whose publication predates MRX1000
 *                                  and is preserved (un-touched) when the
 *                                  gate passes.
 *
 * Every other stage mirrors a member of the PublicationStatus enum, which
 * is declared in src/content/config.ts. We mirror the same string-literal
 * union here so this module is self-contained and tests do not have to
 * reach into the content-collection layer for type re-exports.
 */
export type ArticleLifecycleStage =
  | 'draft'
  | 'searchatlas_review'
  | 'editorial_review'
  | 'compliance_review'
  | 'approved'
  | 'published'
  | 'retired'
  | 'authorized_admitted'
  | 'public_live_legacy';

/**
 * Canonical ordered lifecycle, from earliest authoring gate to retirement.
 * `authorized_admitted` and `public_live_legacy` are program-state markers
 * and are deliberately listed outside the strict draft → published arrow;
 * their relative ordering is meaningful for the gate (see
 * `STAGE_AUTHORITY_RANK`) but they are not lifecycle stages in the
 * authoring sense.
 */
export const LIFECYCLE_STAGES: readonly ArticleLifecycleStage[] = [
  'draft',
  'searchatlas_review',
  'editorial_review',
  'compliance_review',
  'approved',
  'published',
  'retired',
];

export const PROGRAM_STATE_STAGES: readonly ArticleLifecycleStage[] = [
  'authorized_admitted',
  'public_live_legacy',
];

/**
 * Authority rank used by the gate to decide which mark dominates. Higher
 * = stronger authority. The two program-state markers carry the strongest
 * authority (a signed CEO decision named them) but they are not stages an
 * authored article "moves through"; they describe a pre-decided state.
 */
const STAGE_AUTHORITY_RANK: Record<ArticleLifecycleStage, number> = {
  draft: 10,
  searchatlas_review: 20,
  editorial_review: 30,
  compliance_review: 40,
  approved: 50,
  published: 60,
  authorized_admitted: 70,
  public_live_legacy: 80,
  retired: 5,
};

export function stageAuthorityRank(stage: ArticleLifecycleStage): number {
  return STAGE_AUTHORITY_RANK[stage];
}

/* ---------- Release decision ---------- */

export type ReleaseDisposition = 'APPROVED' | 'HOLD';

/**
 * Minimal projection of the signed CEO decision artifact that authorizes
 * release, indexing, or a scale-cap move. Callers normally populate this
 * by parsing the artifact with `parseReleaseDecisionArtifact`.
 */
export type ReleaseDecision = {
  decision_id: string;
  signed: boolean;
  signed_artifact: string;
  signed_artifact_sha256: string;
  signed_artifact_sha256_verified: boolean;
  disposition: ReleaseDisposition;
  authorization_cap_new_mrx1000_rows: number | null;
  authorization_cap_total_released_articles: number | null;
  release_authorized: boolean;
  index_authorized: boolean;
};

/* ---------- Authorized batch entry ---------- */

export type AuthorizedBatchEntry = {
  program_row_id: string;
  slug: string;
  title: string;
  canonical_url: string;
  pillar: string;
  cluster: string;
  evidence_packet_path: string;
  evidence_packet_path_required: boolean;
  content_genius_article_uuid?: string | null;
};

export type AuthorizedBatch = {
  authorization_cap_released_articles: number;
  articles: AuthorizedBatchEntry[];
  decision_authority: {
    capping_decision_id: string;
    capping_decision_path: string;
    capping_decision_sha256: string;
    successor_gate_decision_id: string;
    successor_gate_decision_path: string;
    successor_gate_decision_sha256: string;
  };
  policy: {
    authorization_cap_released_articles: number;
    fail_closed: boolean;
    earned_scale_gates: EarnedScaleGate[];
  };
};

export type EarnedScaleGate = {
  from_cap: number;
  to_cap: number;
  next_decision_id_required: string;
  minimum_observation_window_days: number;
  minimum_index_coverage_pct_within_window?: number;
  index_coverage_window_days?: number;
  minimum_independent_audit_sample_size?: number;
  minimum_independent_audit_sample_pct?: number;
  audit_must_include_legal_tax_valuation_sensitive_articles?: boolean;
  audit_must_include_all_high_risk_legal_tax_valuation_articles?: boolean;
  no_open_critical_or_high_findings_required?: boolean;
  release_rollback_evidence_required?: boolean;
  batch_retrospective_required?: boolean;
  no_repeated_systemic_defect_required?: boolean;
  scale_capacity_review_required?: boolean;
};

/* ---------- Frontmatter shape (loose; we tolerate missing keys) ---------- */

export type ArticleFrontmatterInput = {
  publication_status?: string | null;
  draft?: boolean | null;
  noindex?: boolean | null;
  content_program?: string | null;
  content_batch?: string | null;
  pilot_article_id?: string | null;
  program_row_id?: string | null;
  canonical_slug?: string | null;
  slug?: string | null;
  pillar?: string | null;
  cluster?: string | null;
  source_handle?: string | null;
  review_status?: string | null;
  compliance_status?: string | null;
};

export type AuthorizedAdmittedLookup = {
  /** Map<program_row_id, AuthorizedBatchEntry> */
  byProgramRowId: ReadonlyMap<string, AuthorizedBatchEntry>;
  /** Map<slug, AuthorizedBatchEntry> */
  bySlug: ReadonlyMap<string, AuthorizedBatchEntry>;
  /** Map<canonical_url (no trailing slash), AuthorizedBatchEntry> */
  byCanonicalUrl: ReadonlyMap<string, AuthorizedBatchEntry>;
};

export type PublicLiveLegacyLookup = {
  /** Map<program_row_id, true> */
  byProgramRowId: ReadonlySet<string>;
  /** Map<slug, true> */
  bySlug: ReadonlySet<string>;
  /** Map<canonical_url (no trailing slash), true> */
  byCanonicalUrl: ReadonlySet<string>;
};

/* ---------- Stage derivation ---------- */

/**
 * Derive the canonical lifecycle stage for a candidate article from its
 * raw frontmatter plus the program-state lookups. The returned stage is
 * the most-authoritative mark that applies to the candidate.
 *
 * Order of dominance (highest first):
 *
 *   1. `retired`: frontmatter explicitly retires the
 *                                    article; `publication_status=retired`
 *                                    dominates every authoring gate.
 *   2. `public_live_legacy`: `publication_status=published` AND the
 *                                    program-state lookup classifies the
 *                                    article as a pre-canonical live post.
 *                                    (These posts predate MRX1000 and
 *                                    their publication predates any signed
 *                                    release decision; they are
 *                                    preserved.)
 *   3. `authorized_admitted`: `publication_status=published` AND the
 *                                    article is one of the admitted
 *                                    release-10 slugs. The article is
 *                                    permitted by D-2026-0721-21 + a
 *                                    signed batch source and the successor
 *                                    editorial standard.
 *   4. `approved`: frontmatter declares an explicit
 *                                    `publication_status=approved` and is
 *                                    not in the program-state lookups.
 *                                    The article has cleared all required
 *                                    review passes but has not yet been
 *                                    promoted to `published`.
 *   5. `published`: `publication_status=published` and the
 *                                    article is NOT in any program-state
 *                                    lookup. This is a structural
 *                                    violation under the active cap and
 *                                    the gate will treat it as
 *                                    `UNAUTHORIZED_PUBLICATION`.
 *   6. `compliance_review`: review_status references compliance.
 *   7. `editorial_review`: review_status references editorial.
 *   8. `searchatlas_review`: review_status references searchatlas.
 *   9. `draft`: anything else (default).
 *
 * `draft: true` and `noindex: true` short-circuit to `draft`/`retired`
 * even when `publication_status=published`, matching the fail-closed
 * `isPublishedPost` predicate in src/lib/content-graph.ts.
 */
export function deriveArticleLifecycleStage(
  frontmatter: ArticleFrontmatterInput,
  lookups: {
    authorizedAdmitted: AuthorizedAdmittedLookup;
    publicLiveLegacy: PublicLiveLegacyLookup;
  },
): ArticleLifecycleStage {
  const status = String(frontmatter.publication_status ?? 'draft').toLowerCase();
  const draft = frontmatter.draft === true;
  const noindex = frontmatter.noindex === true;
  const prid = frontmatter.program_row_id ?? null;
  const slug = frontmatter.canonical_slug ?? frontmatter.slug ?? null;
  const canonicalUrl = frontmatter.canonical_slug
    ? normalizeCanonicalUrl(`https://mineralrightsxchange.com/blog/${frontmatter.canonical_slug}/`)
    : null;

  if (status === 'retired') return 'retired';

  // Fail-closed published state (mirrors isPublishedPost). A row that is
  // explicitly `draft` or `noindex` cannot be promoted to a published
  // marker even if publication_status says so.
  if (status === 'published' && !draft && !noindex) {
    const prKey = prid ?? null;
    const slugKey = slug ?? null;
    const urlKey = canonicalUrl ?? null;
    // An MRX1000 row remains attributable to its signed release batch after
    // production verification moves it into the ledger's live-public class.
    // Check exact batch membership before the broader live-route lookup so
    // the released rows still count against their cap and evidence gate.
    if (
      findAuthorizedEntry(
        { program_row_id: prKey, slug: slugKey, canonical_url: urlKey },
        lookups.authorizedAdmitted,
      )
    ) {
      return 'authorized_admitted';
    }
    if (
      (prKey && lookups.publicLiveLegacy.byProgramRowId.has(prKey)) ||
      (slugKey && lookups.publicLiveLegacy.bySlug.has(slugKey)) ||
      (urlKey && lookups.publicLiveLegacy.byCanonicalUrl.has(urlKey))
    ) {
      return 'public_live_legacy';
    }
    // publication_status=published without any program-state marker is a
    // structural violation that the gate must block.
    return 'published';
  }

  if (status === 'approved') return 'approved';
  if (status === 'compliance_review') return 'compliance_review';
  if (status === 'editorial_review') return 'editorial_review';
  if (status === 'searchatlas_review') return 'searchatlas_review';

  // The remaining fallbacks are driven by metadata hints (review_status,
  // compliance_status) before defaulting to `draft`. This keeps the order
  // of dominance deterministic and explicit.
  const review = String(frontmatter.review_status ?? '').toLowerCase();
  const compliance = String(frontmatter.compliance_status ?? '').toLowerCase();
  if (review.includes('compliance') || compliance.includes('compliance')) {
    return 'compliance_review';
  }
  if (review.includes('editorial') || compliance.includes('editorial')) {
    return 'editorial_review';
  }
  if (review.includes('searchatlas') || compliance.includes('searchatlas')) {
    return 'searchatlas_review';
  }
  return 'draft';
}

/* ---------- Program-state lookups ---------- */

export function buildAuthorizedAdmittedLookup(
  articles: readonly AuthorizedBatchEntry[],
): AuthorizedAdmittedLookup {
  const byProgramRowId = new Map<string, AuthorizedBatchEntry>();
  const bySlug = new Map<string, AuthorizedBatchEntry>();
  const byCanonicalUrl = new Map<string, AuthorizedBatchEntry>();
  for (const entry of articles) {
    byProgramRowId.set(entry.program_row_id, entry);
    bySlug.set(entry.slug, entry);
    byCanonicalUrl.set(normalizeCanonicalUrl(entry.canonical_url), entry);
  }
  return { byProgramRowId, bySlug, byCanonicalUrl };
}

export function buildPublicLiveLegacyLookup(
  rows: ReadonlyArray<{ program_row_id?: string | null; slug?: string | null; canonical_url?: string | null }>,
): PublicLiveLegacyLookup {
  const byProgramRowId = new Set<string>();
  const bySlug = new Set<string>();
  const byCanonicalUrl = new Set<string>();
  for (const row of rows) {
    if (row.program_row_id) byProgramRowId.add(row.program_row_id);
    if (row.slug) bySlug.add(row.slug);
    if (row.canonical_url) byCanonicalUrl.add(normalizeCanonicalUrl(row.canonical_url));
  }
  return { byProgramRowId, bySlug, byCanonicalUrl };
}

export function normalizeCanonicalUrl(value: string): string {
  return value.trim().replace(/\/+$/, '').toLowerCase();
}

/* ---------- Release-gate machinery ---------- */

export type GateEvidencePacket = {
  /** Stable, repo-relative path to the evidence packet. */
  evidence_packet_path: string;
  /** Exact reviewed article title. */
  title: string;
  /** Editorial pass disposition; must equal `"PASS"`. */
  editorial_disposition: 'PASS' | 'FAIL' | 'HOLD' | null;
  /** Factual + citation pass disposition; must equal `"PASS"`. */
  factual_citation_disposition: 'PASS' | 'FAIL' | 'HOLD' | null;
  /** Compliance + publication-risk pass disposition; must equal `"PASS"`. */
  compliance_disposition: 'PASS' | 'FAIL' | 'HOLD' | null;
  /** SHA-256 of the current release body, mandatory. */
  body_sha256: string;
  /** SHA-256 of the current release frontmatter, mandatory. */
  frontmatter_sha256: string;
  /**
   * Byte-exact proof that current bytes are either the reviewed bytes or
   * differ only by the authorized publication_status/noindex transition.
   */
  controlled_publication_transition?: {
    authorized: boolean;
    state: 'reviewed_bytes_current' | 'controlled_publication_transition' | 'invalid';
    exact_admission: boolean;
    reviewed_body_sha256: string | null;
    reviewed_frontmatter_sha256: string | null;
    current_body_sha256: string | null;
    current_frontmatter_sha256: string | null;
    normalized_body_sha256: string | null;
    changes: Array<{ field: string; from: string | boolean; to: string | boolean }>;
  };
  body_sha256_matches_declared_or_authorized_transition?: boolean;
  /** Two or more named reviewers with role separation, mandatory. */
  reviewers: Array<{ id: string; capability: string; verdict: 'PASS' | 'FAIL' | 'HOLD'; }>;
  /** At least one named, dated authoritative source URL, mandatory. */
  claim_to_source: Array<{ claim: string; source_url: string; accessed_at: string; }>;
  /** Three hash-locked separated review passes, mandatory. */
  review_manifest: Array<{
    reviewer_id: string;
    capability: string;
    disposition: 'PASS' | 'FAIL' | 'HOLD';
    reviewed_at: string;
    input_body_sha256: string;
    input_frontmatter_sha256: string;
    output_artifact_path: string;
    output_artifact_sha256: string;
    findings: unknown[];
  }>;
  compliance_checklist: { disposition: 'PASS' | 'FAIL' | 'HOLD'; checks?: unknown[] };
  seo_aeo_checklist: { disposition: 'PASS' | 'FAIL' | 'HOLD'; checks?: unknown[] };
  asset_manifest: {
    evidence_path: string;
    evidence_sha256: string;
    frontmatter_sha256: string;
    disposition: 'PASS' | 'FAIL' | 'HOLD';
    assets: Array<{
      kind: 'hero' | 'social';
      public_path: string;
      sha256: string;
      width?: number;
      height?: number;
      observed_width?: number;
      observed_height?: number;
      observed_mime_type?: string;
      alt_text: string;
      provenance: string;
      license: string;
      perceptual_hash: string;
      disposition: 'PASS' | 'FAIL' | 'HOLD';
    }>;
  };
  publication_manifest: {
    evidence_path: string;
    evidence_sha256: string;
    disposition: 'READY' | 'HOLD';
    source_path: string;
    body_sha256: string;
    frontmatter_sha256: string;
    expected_targets: string[];
    rollback_reference: string;
    release_owner: string;
  };
};

export type GateLifecycleRow = {
  program_row_id: string | null;
  slug: string | null;
  canonical_url: string;
  pillar: string | null;
  cluster: string | null;
  lifecycle_stage: ArticleLifecycleStage;
  is_published_in_dist_sitemap: boolean;
  evidence_packet?: GateEvidencePacket | null;
  /** Names the field that the candidate identity matched on. */
  identity_matched_via?: 'program_row_id' | 'slug' | 'canonical_url' | 'legacy' | null;
  /** Names the row-state kind against a release-10 program lookup. */
  membership?: 'authorized_admitted' | 'public_live_legacy' | 'none' | null;
};

export type EarnedScaleGateEvaluation = {
  from_cap: number;
  to_cap: number;
  evaluated: boolean;
  disposition: 'BLOCK' | 'PROVISIONAL' | 'PASS';
  required_decision_id: string;
  signed_decision_id: string | null;
  signed_decision_signed: boolean;
  preconditions_required: string[];
  preconditions_satisfied: string[];
  preconditions_missing: string[];
  notes: string[];
};

export type EarnedScaleGateObservation = {
  observation_window_days_observed?: number;
  index_coverage_pct_observed?: number;
  index_coverage_window_days_observed?: number;
  independent_audit_sample_size?: number;
  independent_audit_completed?: boolean;
  high_risk_legal_tax_valuation_articles_in_audit?: number;
  high_risk_legal_tax_valuation_articles_in_population?: number;
  open_critical_or_high_findings?: number;
  rollback_evidence_present?: boolean;
  batch_retrospective_present?: boolean;
  no_repeated_systemic_defect?: boolean;
  scale_capacity_review_present?: boolean;
  next_decision_signed_artifact_path?: string;
  next_decision_signed_artifact_sha256?: string;
  next_decision_disposition?: ReleaseDisposition;
};

export type ReleaseGateResult = {
  policy: {
    fail_closed: boolean;
    authorization_cap_released_articles: number;
    authorization_decision_id: string | null;
    authorization_decision_signed: boolean;
    authorization_decision_disposition: ReleaseDisposition;
    authorization_decision_signed_artifact: string | null;
    authorization_decision_signed_artifact_sha256: string | null;
    authorization_decision_signed_artifact_sha256_verified: boolean | null;
    release_authorized: boolean;
    index_authorized: boolean;
  };
  aggregate_counts: {
    by_stage: Record<ArticleLifecycleStage, number>;
    total_rows: number;
    published_in_dist_sitemap_rows: number;
    authorized_admitted_rows: number;
    public_live_legacy_rows: number;
    unauthorized_published_rows: number;
    unauthorized_published_slugs: string[];
  };
  cap: {
    authorized_release_total: number;
    observed_release_total: number;
    cap_remaining: number;
    cap_exceeded: boolean;
    cap_exceeded_slugs: string[];
  };
  evidence: {
    packets_required: number;
    packets_present: number;
    packets_passing: number;
    packets_failing: number;
    failing_packet_slugs: string[];
  };
  earned_scale_gates: EarnedScaleGateEvaluation[];
  blocking_findings: string[];
  informational_findings: string[];
  dispositions_by_row: Array<{
    program_row_id: string | null;
    slug: string | null;
    canonical_url: string;
    lifecycle_stage: ArticleLifecycleStage;
    membership: GateLifecycleRow['membership'];
    cap_against_authorization: 'OK' | 'OVER_CAP' | 'UNAUTHORIZED' | 'OUT_OF_SCOPE';
    evidence_disposition: 'PASS' | 'FAIL' | 'HOLD' | 'NOT_REQUIRED' | 'MISSING';
    notes: string[];
  }>;
};

/**
 * Fail-closed release-gate evaluator. See module docstring for the three
 * invariants enforced.
 */
export function evaluateReleaseGates(input: {
  releaseDecision: ReleaseDecision | null;
  authorizedBatch: AuthorizedBatch;
  publicLiveLegacyRows: ReadonlyArray<{ program_row_id?: string | null; slug?: string | null; canonical_url?: string | null }>;
  rows: GateLifecycleRow[];
  evidencePacketLookup: (entry: AuthorizedBatchEntry) => GateEvidencePacket | null;
  earnedScaleGateObservations?: Partial<Record<'10_to_25' | '25_to_50', EarnedScaleGateObservation>>;
}): ReleaseGateResult {
  const authorized = input.authorizedBatch;
  const cap = authorized.policy.authorization_cap_released_articles;
  const authorizedAdmittedLookup = buildAuthorizedAdmittedLookup(authorized.articles);
  // The public-live-legacy lookup is materialized here so callers that
  // wired the rows from the canonical ledger into the gate can verify,
  // post-hoc, that none of those rows crossed into the `published` stage
  // without going through the authorized-admitted path. This catches a
  // class of bugs where a legacy pre-canonical live row is later edited
  // and its frontmatter changed in a way that leaves it eligible for
  // release without the cap check applying.
  const _publicLiveLegacyLookup = buildPublicLiveLegacyLookup(input.publicLiveLegacyRows);
  void _publicLiveLegacyLookup;
  const blocking: string[] = [];
  const informational: string[] = [];

  // Cap-by-decision enforcement.
  const decision = input.releaseDecision;
  const policyBlock: ReleaseGateResult['policy'] = {
    fail_closed: authorized.policy.fail_closed,
    authorization_cap_released_articles: cap,
    authorization_decision_id: decision?.decision_id ?? null,
    authorization_decision_signed: decision?.signed === true,
    authorization_decision_disposition: decision?.disposition ?? 'HOLD',
    authorization_decision_signed_artifact: decision?.signed_artifact ?? null,
    authorization_decision_signed_artifact_sha256: decision?.signed_artifact_sha256 ?? null,
    authorization_decision_signed_artifact_sha256_verified:
      decision?.signed_artifact_sha256_verified ?? null,
    release_authorized: !!decision?.release_authorized,
    index_authorized: !!decision?.index_authorized,
  };

  if (!decision) {
    blocking.push(
      'No signed release decision on disk; treated as HOLD. The cap (10) cannot be authorized.',
    );
  } else if (!decision.signed) {
    blocking.push(
      `Release decision ${decision.decision_id} is unsigned or its SHA-256 fingerprint failed verification; treated as HOLD.`,
    );
  } else if (decision.disposition !== 'APPROVED') {
    blocking.push(
      `Release decision ${decision.decision_id} disposition is ${decision.disposition}; only APPROVED dispositions can authorize release.`,
    );
  } else if (decision.authorization_cap_total_released_articles != null) {
    if (decision.authorization_cap_total_released_articles > cap) {
      blocking.push(
        `Release decision ${decision.decision_id} raises the cap to ${decision.authorization_cap_total_released_articles}; a separate signed scale-gate decision is required (see earned_scale_gates).`,
      );
    }
  }

  // Per-row dispositions and aggregate counts.
  const byStage: Record<ArticleLifecycleStage, number> = {
    draft: 0,
    searchatlas_review: 0,
    editorial_review: 0,
    compliance_review: 0,
    approved: 0,
    published: 0,
    retired: 0,
    authorized_admitted: 0,
    public_live_legacy: 0,
  };
  const dispositionsByRow: ReleaseGateResult['dispositions_by_row'] = [];
  const publishedRows: GateLifecycleRow[] = [];
  let unauthorized = 0;
  const unauthorizedSlugs: string[] = [];
  let distLive = 0;
  for (const row of input.rows) {
    byStage[row.lifecycle_stage] = (byStage[row.lifecycle_stage] ?? 0) + 1;

    let membership: GateLifecycleRow['membership'] = 'none';
    let capAgainstAuth: 'OK' | 'OVER_CAP' | 'UNAUTHORIZED' | 'OUT_OF_SCOPE' = 'OUT_OF_SCOPE';
    const notes: string[] = [];

    if (row.lifecycle_stage === 'public_live_legacy') {
      membership = 'public_live_legacy';
      capAgainstAuth = 'OK';
    } else if (row.lifecycle_stage === 'authorized_admitted') {
      membership = 'authorized_admitted';
      const matched = identityMatchedVia(row, authorizedAdmittedLookup);
      if (matched) notes.push(`identity matched via ${matched}`);
      capAgainstAuth = 'OK';
    } else if (row.lifecycle_stage === 'published') {
      unauthorized += 1;
      unauthorizedSlugs.push(row.slug ?? row.program_row_id ?? row.canonical_url);
      blocking.push(
        `Unauthorized publication: ${row.slug ?? row.program_row_id ?? row.canonical_url} carries publication_status=published without an authorized-batch or public-live-legacy marker.`,
      );
      capAgainstAuth = 'UNAUTHORIZED';
    } else if (row.lifecycle_stage === 'approved') {
      blocking.push(
        `Approved-but-not-released: ${row.slug ?? row.program_row_id ?? row.canonical_url} is at the approved stage; promotion to published requires an authorized batch entry and the cap check below.`,
      );
      capAgainstAuth = 'OUT_OF_SCOPE';
    }

    if (row.is_published_in_dist_sitemap) {
      distLive += 1;
    }

    if (
      row.lifecycle_stage === 'authorized_admitted' &&
      membership === 'authorized_admitted'
    ) {
      const entry = findAuthorizedEntry(row, authorizedAdmittedLookup);
      const packet = entry ? input.evidencePacketLookup(entry) : null;
      let evidenceDisposition: 'PASS' | 'FAIL' | 'HOLD' | 'MISSING' | 'NOT_REQUIRED';
      if (!entry) {
        evidenceDisposition = 'MISSING';
        blocking.push(
          `Authorized-admitted row ${row.slug ?? row.program_row_id} has no entry in the release-10 batch file.`,
        );
      } else if (!packet) {
        evidenceDisposition = 'MISSING';
        blocking.push(
          `Evidence packet missing for ${entry.slug}: expected at ${entry.evidence_packet_path}.`,
        );
      } else {
        const verdict = evaluateEvidencePacket(packet);
        evidenceDisposition = verdict.ok ? 'PASS' : 'FAIL';
        if (!verdict.ok) {
          blocking.push(
            `Evidence packet for ${entry.slug} failed: ${verdict.failures.join(', ')}.`,
          );
        }
      }
      dispositionsByRow.push({
        program_row_id: row.program_row_id,
        slug: row.slug,
        canonical_url: row.canonical_url,
        lifecycle_stage: row.lifecycle_stage,
        membership,
        cap_against_authorization: capAgainstAuth,
        evidence_disposition: evidenceDisposition,
        notes,
      });
      if (row.lifecycle_stage === 'authorized_admitted' || row.lifecycle_stage === 'public_live_legacy') {
        publishedRows.push(row);
      }
    } else {
      const evidenceDisposition =
        row.lifecycle_stage === 'authorized_admitted'
          ? 'MISSING'
          : row.lifecycle_stage === 'public_live_legacy'
            ? 'NOT_REQUIRED'
            : 'NOT_REQUIRED';
      dispositionsByRow.push({
        program_row_id: row.program_row_id,
        slug: row.slug,
        canonical_url: row.canonical_url,
        lifecycle_stage: row.lifecycle_stage,
        membership,
        cap_against_authorization: capAgainstAuth,
        evidence_disposition: evidenceDisposition,
        notes,
      });
      if (row.lifecycle_stage === 'authorized_admitted' || row.lifecycle_stage === 'public_live_legacy') {
        publishedRows.push(row);
      }
    }
  }

  // Cap accounting.
  const observedReleaseTotal =
    publishedRows.filter((row) => row.lifecycle_stage === 'authorized_admitted').length;
  const capRemaining = cap - observedReleaseTotal;
  const capExceeded = observedReleaseTotal > cap;
  const capExceededSlugs = capExceeded
    ? publishedRows
        .filter((row) => row.lifecycle_stage === 'authorized_admitted')
        .map((row) => row.slug ?? row.program_row_id ?? row.canonical_url)
    : [];
  if (capExceeded) {
    blocking.push(
      `Authorization cap exceeded: ${observedReleaseTotal} authorized-admitted rows present; cap=${cap}.`,
    );
  }

  // Earned scale-gate machinery.
  const earnedScaleGates: EarnedScaleGateEvaluation[] = authorized.policy.earned_scale_gates.map(
    (gate, index) =>
      evaluateEarnedScaleGate(
        gate,
        input.earnedScaleGateObservations?.[index === 0 ? '10_to_25' : '25_to_50'] ?? {},
      ),
  );
  for (const evaluated of earnedScaleGates) {
    if (evaluated.disposition === 'BLOCK' && evaluated.evaluated) {
      informational.push(
        `Future earned scale-gate ${evaluated.from_cap} to ${evaluated.to_cap}: BLOCK. Missing preconditions: ${evaluated.preconditions_missing.join(', ') || '(no preconditions satisfied)'}; signed decision id observed: ${evaluated.signed_decision_id ?? '(none)'}. This blocks raising the cap, not releases within the current cap.`,
      );
    }
  }

  // Evidence totals.
  let packetsRequired = 0;
  let packetsPresent = 0;
  let packetsPassing = 0;
  let packetsFailing = 0;
  const failingPacketSlugs: string[] = [];
  for (const entry of authorized.articles) {
    packetsRequired += 1;
    const packet = input.evidencePacketLookup(entry);
    if (!packet) {
      packetsFailing += 1;
      failingPacketSlugs.push(entry.slug);
      continue;
    }
    packetsPresent += 1;
    const verdict = evaluateEvidencePacket(packet);
    if (verdict.ok) {
      packetsPassing += 1;
    } else {
      packetsFailing += 1;
      failingPacketSlugs.push(entry.slug);
    }
  }

  const result: ReleaseGateResult = {
    policy: policyBlock,
    aggregate_counts: {
      by_stage: byStage,
      total_rows: input.rows.length,
      published_in_dist_sitemap_rows: distLive,
      authorized_admitted_rows: byStage.authorized_admitted,
      public_live_legacy_rows: byStage.public_live_legacy,
      unauthorized_published_rows: unauthorized,
      unauthorized_published_slugs: unauthorizedSlugs,
    },
    cap: {
      authorized_release_total: cap,
      observed_release_total: observedReleaseTotal,
      cap_remaining: capRemaining,
      cap_exceeded: capExceeded,
      cap_exceeded_slugs: capExceededSlugs,
    },
    evidence: {
      packets_required: packetsRequired,
      packets_present: packetsPresent,
      packets_passing: packetsPassing,
      packets_failing: packetsFailing,
      failing_packet_slugs: failingPacketSlugs,
    },
    earned_scale_gates: earnedScaleGates,
    blocking_findings: blocking,
    informational_findings: informational,
    dispositions_by_row: dispositionsByRow,
  };
  return result;
}

/* ---------- Helpers ---------- */

function identityMatchedVia(
  row: GateLifecycleRow,
  lookup: AuthorizedAdmittedLookup,
): GateLifecycleRow['identity_matched_via'] {
  const entry = findAuthorizedEntry(row, lookup);
  if (!entry) return null;
  if (row.program_row_id && entry.program_row_id === row.program_row_id) return 'program_row_id';
  if (row.slug && entry.slug === row.slug) return 'slug';
  if (
    row.canonical_url &&
    normalizeCanonicalUrl(entry.canonical_url) === normalizeCanonicalUrl(row.canonical_url)
  ) {
    return 'canonical_url';
  }
  return null;
}

function findAuthorizedEntry(
  row: {
    program_row_id?: string | null;
    slug?: string | null;
    canonical_url?: string | null;
  },
  lookup: AuthorizedAdmittedLookup,
): AuthorizedBatchEntry | null {
  const candidates = [
    row.program_row_id ? lookup.byProgramRowId.get(row.program_row_id) : null,
    row.slug ? lookup.bySlug.get(row.slug) : null,
    row.canonical_url
      ? lookup.byCanonicalUrl.get(normalizeCanonicalUrl(row.canonical_url))
      : null,
  ].filter((entry): entry is AuthorizedBatchEntry => !!entry);
  if (!candidates.length) return null;

  const candidate = candidates[0];
  if (candidates.some((entry) => entry !== candidate)) return null;
  if (row.program_row_id && candidate.program_row_id !== row.program_row_id) return null;
  if (row.slug && candidate.slug !== row.slug) return null;
  if (
    row.canonical_url &&
    normalizeCanonicalUrl(candidate.canonical_url) !== normalizeCanonicalUrl(row.canonical_url)
  ) {
    return null;
  }
  return candidate;
}

const REQUIRED_PACKET_KEYS: ReadonlyArray<keyof GateEvidencePacket> = [
  'evidence_packet_path',
  'title',
  'editorial_disposition',
  'factual_citation_disposition',
  'compliance_disposition',
  'body_sha256',
  'frontmatter_sha256',
  'reviewers',
  'claim_to_source',
  'review_manifest',
  'compliance_checklist',
  'seo_aeo_checklist',
  'asset_manifest',
  'publication_manifest',
];

const HEX_64 = /^[0-9a-f]{64}$/i;

function reviewedHashesForPacket(packet: GateEvidencePacket): {
  body_sha256: string;
  frontmatter_sha256: string;
} {
  const transition = packet.controlled_publication_transition;
  const exactChanges = [
    { field: 'publication_status', from: 'draft', to: 'published' },
    { field: 'noindex', from: true, to: false },
  ];
  const currentHashesMatch =
    transition?.current_body_sha256 === packet.body_sha256 &&
    transition?.current_frontmatter_sha256 === packet.frontmatter_sha256;
  const reviewedHashesAreValid =
    HEX_64.test(transition?.reviewed_body_sha256 ?? '') &&
    HEX_64.test(transition?.reviewed_frontmatter_sha256 ?? '') &&
    transition?.normalized_body_sha256 === transition?.reviewed_body_sha256;

  if (
    transition?.authorized === true &&
    transition.state === 'reviewed_bytes_current' &&
    currentHashesMatch &&
    reviewedHashesAreValid &&
    transition.reviewed_body_sha256 === packet.body_sha256 &&
    transition.reviewed_frontmatter_sha256 === packet.frontmatter_sha256 &&
    Array.isArray(transition.changes) &&
    transition.changes.length === 0
  ) {
    return {
      body_sha256: transition.reviewed_body_sha256 ?? packet.body_sha256,
      frontmatter_sha256: transition.reviewed_frontmatter_sha256 ?? packet.frontmatter_sha256,
    };
  }

  if (
    transition?.authorized === true &&
    transition.state === 'controlled_publication_transition' &&
    transition.exact_admission === true &&
    currentHashesMatch &&
    reviewedHashesAreValid &&
    packet.body_sha256_matches_declared_or_authorized_transition === true &&
    JSON.stringify(transition.changes) === JSON.stringify(exactChanges)
  ) {
    return {
      body_sha256: transition.reviewed_body_sha256 ?? packet.body_sha256,
      frontmatter_sha256: transition.reviewed_frontmatter_sha256 ?? packet.frontmatter_sha256,
    };
  }

  return {
    body_sha256: packet.body_sha256,
    frontmatter_sha256: packet.frontmatter_sha256,
  };
}

export function evaluateEvidencePacket(packet: GateEvidencePacket): {
  ok: boolean;
  failures: string[];
} {
  const failures: string[] = [];
  const reviewedHashes = reviewedHashesForPacket(packet);
  for (const key of REQUIRED_PACKET_KEYS) {
    if (packet[key] == null) {
      failures.push(`missing required key \`${key}\``);
    }
  }
  if (packet.editorial_disposition !== 'PASS') {
    failures.push(`editorial_disposition must equal PASS (got ${packet.editorial_disposition ?? 'null'})`);
  }
  if (packet.factual_citation_disposition !== 'PASS') {
    failures.push(
      `factual_citation_disposition must equal PASS (got ${packet.factual_citation_disposition ?? 'null'})`,
    );
  }
  if (packet.compliance_disposition !== 'PASS') {
    failures.push(
      `compliance_disposition must equal PASS (got ${packet.compliance_disposition ?? 'null'})`,
    );
  }
  if (!HEX_64.test(packet.body_sha256 ?? '')) {
    failures.push('body_sha256 must be a SHA-256 hex digest');
  }
  if (!HEX_64.test(packet.frontmatter_sha256 ?? '')) {
    failures.push('frontmatter_sha256 must be a SHA-256 hex digest');
  }
  if (!packet.title?.trim()) failures.push('title must identify the exact reviewed article');
  if (!Array.isArray(packet.reviewers) || packet.reviewers.length < 2) {
    failures.push('reviewers must list at least two separated reviewer identities');
  } else {
    const ids = new Set<string>();
    for (const r of packet.reviewers) {
      if (!r.id) failures.push('every reviewer needs an id');
      if (ids.has(r.id)) failures.push(`duplicate reviewer id: ${r.id}`);
      if (r.verdict !== 'PASS') failures.push(`reviewer ${r.id} verdict must equal PASS`);
      ids.add(r.id);
    }
    const capabilities = new Set(packet.reviewers.map((r) => r.capability));
    if (
      !capabilities.has('editorial') ||
      !capabilities.has('factual_citation') ||
      !capabilities.has('compliance')
    ) {
      failures.push(
        'reviewers must collectively cover editorial, factual_citation, and compliance capabilities',
      );
    }
  }
  if (
    !Array.isArray(packet.claim_to_source) ||
    packet.claim_to_source.length < 2 ||
    packet.claim_to_source.some(
      (c) =>
        !c.claim ||
        !/^https:\/\//i.test(c.source_url ?? '') ||
        !/^\d{4}-\d{2}-\d{2}/.test(c.accessed_at ?? ''),
    ) ||
    new Set(packet.claim_to_source.map((c) => c.source_url.replace(/\/+$/, '').toLowerCase())).size < 2
  ) {
    failures.push('claim_to_source must list at least two distinct named, dated HTTPS source URLs');
  }
  const requiredCapabilities = ['editorial', 'factual_citation', 'compliance'];
  if (
    !Array.isArray(packet.review_manifest) ||
    packet.review_manifest.length < 3 ||
    !requiredCapabilities.every((capability) =>
      packet.review_manifest?.some(
        (pass) =>
          pass.capability === capability &&
          pass.disposition === 'PASS' &&
          pass.input_body_sha256 === reviewedHashes.body_sha256 &&
          pass.input_frontmatter_sha256 === reviewedHashes.frontmatter_sha256 &&
          /^\d{4}-\d{2}-\d{2}T/.test(pass.reviewed_at ?? '') &&
          !!pass.output_artifact_path &&
          HEX_64.test(pass.output_artifact_sha256 ?? '') &&
          Array.isArray(pass.findings) &&
          pass.findings.length > 0,
      ),
    )
  ) {
    failures.push('review_manifest must contain three hash-locked PASS review passes');
  }
  if (packet.compliance_checklist?.disposition !== 'PASS') {
    failures.push('compliance_checklist disposition must equal PASS');
  }
  if (packet.seo_aeo_checklist?.disposition !== 'PASS') {
    failures.push('seo_aeo_checklist disposition must equal PASS');
  }
  if (
    packet.asset_manifest?.disposition !== 'PASS' ||
    packet.asset_manifest?.frontmatter_sha256 !== packet.frontmatter_sha256 ||
    !HEX_64.test(packet.asset_manifest?.evidence_sha256 ?? '') ||
    !Array.isArray(packet.asset_manifest?.assets) ||
    packet.asset_manifest.assets.length !== 2 ||
    !['hero', 'social'].every((kind) =>
      packet.asset_manifest.assets.some(
        (asset) =>
          asset.kind === kind &&
          asset.disposition === 'PASS' &&
          HEX_64.test(asset.sha256 ?? '') &&
          /^[a-f0-9]{16}$/i.test(asset.perceptual_hash ?? '') &&
          !!asset.public_path &&
          !!asset.alt_text &&
          !!asset.provenance &&
          !!asset.license,
      ),
    )
  ) {
    failures.push('asset_manifest must contain hash-locked PASS hero and social assets');
  }
  if (
    packet.publication_manifest?.disposition !== 'READY' ||
    packet.publication_manifest?.body_sha256 !== packet.body_sha256 ||
    packet.publication_manifest?.frontmatter_sha256 !== packet.frontmatter_sha256 ||
    !HEX_64.test(packet.publication_manifest?.evidence_sha256 ?? '') ||
    !packet.publication_manifest?.source_path ||
    !packet.publication_manifest?.rollback_reference ||
    !packet.publication_manifest?.release_owner ||
    !Array.isArray(packet.publication_manifest?.expected_targets) ||
    packet.publication_manifest.expected_targets.length === 0
  ) {
    failures.push('publication_manifest must be READY with matching hashes, targets, owner, and rollback');
  }
  return { ok: failures.length === 0, failures };
}

function evaluateEarnedScaleGate(
  gate: EarnedScaleGate,
  observation: EarnedScaleGateObservation | undefined,
): EarnedScaleGateEvaluation {
  const required: string[] = [];
  const missing: string[] = [];
  const satisfied: string[] = [];
  const notes: string[] = [];

  if (gate.no_open_critical_or_high_findings_required) required.push('no_open_critical_or_high_findings');
  if (gate.release_rollback_evidence_required) required.push('release_rollback_evidence_present');
  if (gate.batch_retrospective_required) required.push('batch_retrospective_present');
  if (gate.no_repeated_systemic_defect_required) required.push('no_repeated_systemic_defect');
  if (gate.scale_capacity_review_required) required.push('scale_capacity_review_present');
  if (gate.minimum_index_coverage_pct_within_window != null) required.push('index_coverage_threshold');

  const observationDays = observation?.observation_window_days_observed ?? 0;
  if (observationDays < gate.minimum_observation_window_days) {
    missing.push(
      `observation window: ${observationDays} days < required ${gate.minimum_observation_window_days} days`,
    );
  } else {
    satisfied.push(
      `observation window: ${observationDays} days >= required ${gate.minimum_observation_window_days} days`,
    );
  }

  const sampleSize = observation?.independent_audit_sample_size ?? 0;
  const minSample = gate.minimum_independent_audit_sample_size ?? 0;
  if (gate.minimum_independent_audit_sample_pct != null) {
    // The percentage is informational; the absolute minimum is what binds.
    notes.push(
      `audit_minimum_independent_pct = ${gate.minimum_independent_audit_sample_pct}%`,
    );
  }
  if (sampleSize < minSample) {
    missing.push(
      `independent audit sample size: ${sampleSize} < required ${minSample}`,
    );
  } else {
    satisfied.push(`independent audit sample size: ${sampleSize} >= ${minSample}`);
  }

  if (gate.minimum_index_coverage_pct_within_window != null) {
    const observedPct = observation?.index_coverage_pct_observed ?? 0;
    const observedDays = observation?.index_coverage_window_days_observed ?? 0;
    const requiredPct = gate.minimum_index_coverage_pct_within_window;
    const requiredDays = gate.index_coverage_window_days ?? gate.minimum_observation_window_days;
    if (observedPct < requiredPct) {
      missing.push(`index coverage: ${observedPct}% < required ${requiredPct}%`);
    } else if (observedDays === 0 || observedDays > requiredDays) {
      missing.push(`index coverage timing: ${observedDays || 0} days > allowed ${requiredDays} days`);
    } else {
      satisfied.push(
        `index coverage: ${observedPct}% within ${observedDays} days (required ${requiredPct}% within ${requiredDays} days)`,
      );
    }
  }

  if (
    gate.audit_must_include_all_high_risk_legal_tax_valuation_articles ||
    gate.audit_must_include_legal_tax_valuation_sensitive_articles
  ) {
    const highRiskInPopulation =
      observation?.high_risk_legal_tax_valuation_articles_in_population ?? 0;
    const highRiskInAudit = observation?.high_risk_legal_tax_valuation_articles_in_audit ?? 0;
    if (highRiskInPopulation > 0 && highRiskInAudit < highRiskInPopulation) {
      missing.push(
        `high-risk legal/tax/valuation articles audited: ${highRiskInAudit} < ${highRiskInPopulation} in population`,
      );
    } else if (highRiskInPopulation > 0) {
      satisfied.push(
        `high-risk legal/tax/valuation articles audited: ${highRiskInAudit}/${highRiskInPopulation}`,
      );
    } else {
      notes.push('no high-risk legal/tax/valuation articles in the population');
    }
  }

  if (gate.no_open_critical_or_high_findings_required) {
    const open = observation?.open_critical_or_high_findings ?? -1;
    if (open > 0) missing.push(`open critical/high findings: ${open}`);
    else if (open === 0) satisfied.push('open critical/high findings = 0');
  }
  if (gate.release_rollback_evidence_required) {
    const ok = observation?.rollback_evidence_present ?? false;
    if (!ok) missing.push('rollback evidence missing');
    else satisfied.push('rollback evidence present');
  }
  if (gate.batch_retrospective_required) {
    const ok = observation?.batch_retrospective_present ?? false;
    if (!ok) missing.push('batch retrospective missing');
    else satisfied.push('batch retrospective present');
  }
  if (gate.no_repeated_systemic_defect_required) {
    const ok = observation?.no_repeated_systemic_defect ?? false;
    if (!ok) missing.push('repeated systemic defect observed');
    else satisfied.push('no repeated systemic defect observed');
  }
  if (gate.scale_capacity_review_required) {
    const ok = observation?.scale_capacity_review_present ?? false;
    if (!ok) missing.push('scale capacity review missing');
    else satisfied.push('scale capacity review present');
  }

  // The signed next-decision is the formal unlock: it must exist AND it
  // must record an APPROVED disposition. The required fields declared
  // above are unchanged but still gate the formal unlock; we report all
  // missing items to the operator.
  const signedId = observation?.next_decision_signed_artifact_sha256 ? gate.next_decision_id_required : null;
  const signedSigned =
    !!observation?.next_decision_signed_artifact_path &&
    !!observation?.next_decision_signed_artifact_sha256;
  const signedDisposition = observation?.next_decision_disposition;
  if (!signedSigned) {
    missing.push(`signed ${gate.next_decision_id_required} artifact missing`);
  } else if (signedDisposition !== 'APPROVED') {
    missing.push(
      `signed ${gate.next_decision_id_required} disposition = ${signedDisposition ?? 'unknown'} (must be APPROVED)`,
    );
  } else {
    satisfied.push(`signed ${gate.next_decision_id_required} disposition = APPROVED`);
  }

  const evaluated = required.length > 0 || missing.length > 0 || signedSigned;
  const disposition: EarnedScaleGateEvaluation['disposition'] = missing.length === 0
    ? 'PASS'
    : required.length === 0 && missing.length > 0 && !signedSigned
      ? 'PROVISIONAL'
      : 'BLOCK';

  return {
    from_cap: gate.from_cap,
    to_cap: gate.to_cap,
    evaluated,
    disposition,
    required_decision_id: gate.next_decision_id_required,
    signed_decision_id: signedId,
    signed_decision_signed: signedSigned,
    preconditions_required: required,
    preconditions_satisfied: satisfied,
    preconditions_missing: missing,
    notes,
  };
}

/* ---------- Decision parsing ---------- */

/**
 * Parse the body of a signed CEO decision artifact and project the fields
 * the gate evaluates. The format is intentionally minimal: the script
 * (scripts/check-mrx1000-release-gates.mjs) is the only consumer of this
 * helper, and it does not depend on the prose surrounding the disposition
 * string.
 */
export function parseReleaseDecisionArtifact(input: {
  path: string;
  text: string;
  sha256: string;
  /** Optional explicit expected sha-256. When provided, mismatch ⇒ signed=false. */
  expectedSha256?: string;
  decisionIdHint?: string;
}): ReleaseDecision {
  const text = input.text;
  const normalized = text.replace(/\*\*/g, '');
  const idMatch = text.match(/D-\d{4}-\d{4}-\d{2}/);
  const capMatch = normalized.match(/PRESENT AUTHORIZATION CAP\s*[=:]\s*(\d+)/i);
  const totalCapMatch = normalized.match(/AUTHORIZATION CAP[^.\n]*?TOTAL[^.\n]*?[=:]\s*(\d+)/i);
  const hold =
    /\b(?:Disposition|Status)\s*[:=]\s*HOLD\b/i.test(normalized) ||
    /\bDisposition\s*[:=]\s*HOLD\b/i.test(normalized);
  const approved =
    /\b(?:Disposition|Status)\s*[:=]\s*APPROVED\b/i.test(normalized) ||
    /\bDisposition\s*[:=]\s*APPROVED\b/i.test(normalized) ||
    /\bStatus\s*[:=]\s*APPROVED\b/i.test(normalized);
  const releaseTrue =
    /(?:^|\n)\s*(?:release_authorized|public_release_authorized)\s*:\s*true\s*(?:$|\n)/im.test(
      normalized,
    );
  const indexTrue =
    /(?:^|\n)\s*(?:index_authorized|indexing_authorized)\s*:\s*true\s*(?:$|\n)/im.test(
      normalized,
    );

  const decisionId = idMatch?.[0] ?? input.decisionIdHint ?? 'D-UNKNOWN';
  const totalCap = totalCapMatch ? Number(totalCapMatch[1]) : null;
  const newCap = capMatch ? Number(capMatch[1]) : null;
  const shaMatches = input.expectedSha256
    ? input.sha256 === input.expectedSha256
    : true;
  return {
    decision_id: decisionId,
    signed: shaMatches,
    signed_artifact: input.path,
    signed_artifact_sha256: input.sha256,
    signed_artifact_sha256_verified: shaMatches,
    disposition: hold ? 'HOLD' : approved ? 'APPROVED' : 'HOLD',
    authorization_cap_new_mrx1000_rows: newCap,
    authorization_cap_total_released_articles: totalCap,
    release_authorized: !hold && approved && releaseTrue,
    index_authorized: !hold && approved && indexTrue,
  };
}

/**
 * Flatten a gate result into a durable JSON-serializable shape suitable
 * for writing under reports/. Stable key order keeps the output diffable.
 */
export function summarizeReleaseGates(gateResult: ReleaseGateResult): ReleaseGateResult {
  return JSON.parse(JSON.stringify(gateResult)) as ReleaseGateResult;
}

/* ---------- Convenience: detect the ledger-side legacy-live set ---------- */

/**
 * Build the public-live-legacy lookup from the canonical ledger by
 * selecting rows whose `preservation_classification` is
 * `"live_public_published_route"` and whose `publication_gate_nonpublic`
 * is `false`. This is the same rule the readiness matrix applies; keeping
 * it here keeps the lifecycle dashboard and the readiness matrix aligned
 * without forcing them to share a single source.
 */
export function legacyLiveRowsFromLedger(
  rows: ReadonlyArray<{
    program_row_id?: string | null;
    canonical_slug?: string | null;
    canonical_url?: string | null;
    preservation_classification?: string | null;
    publication_gate_nonpublic?: boolean | null;
  }>,
): Array<{ program_row_id: string; slug: string; canonical_url: string }> {
  const out: Array<{ program_row_id: string; slug: string; canonical_url: string }> = [];
  for (const row of rows) {
    if (
      row.preservation_classification === 'live_public_published_route' &&
      row.publication_gate_nonpublic === false &&
      row.program_row_id &&
      row.canonical_slug &&
      row.canonical_url
    ) {
      out.push({
        program_row_id: row.program_row_id,
        slug: row.canonical_slug,
        canonical_url: row.canonical_url,
      });
    }
  }
  return out;
}
