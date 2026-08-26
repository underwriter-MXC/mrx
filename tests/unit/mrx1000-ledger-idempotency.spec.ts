/**
 * tests/unit/mrx1000-ledger-idempotency.spec.ts
 *
 * Vitest spec for scripts/build-mrx-1000-content-ledger.mjs.
 *
 * Proves the MRX1000-036 invariants: the canonical-ledger generator is
 * pilot-aware, idempotent, evidence-taxonomy-correct, and produces byte-
 * deterministic output for unchanged inputs.
 *
 *  P1. Reports pilot-aware + deterministic generated_at.
 *  P2. Produces exactly 1,000 rows with the 9 cluster quotas filled.
 *  P3. Pilot slugs are NOT double-counted: `astro_repo` matches the
 *      non-pilot MDX corpus and `searchatlas_topical_map_pilot` is exactly 25.
 *  P4. Every pilot slug from the manifest appears exactly once and maps
 *      to a real on-disk MDX shell.
 *  P5. Each pilot row preserves manifest metadata + clear fail-closed
 *      publication/noindex facts from its MDX frontmatter.
 *  P6. Pilot rows preserve `pilot_article_id` (local manifest ID) but
 *      leave `searchatlas_record_id` and `content_genius_article_uuid`
 *      as `null` — no local-manifest IDs ever leak into authoritative
 *      UUID fields.
 *  P7. Every non-null `searchatlas_record_id`/`content_genius_article_uuid`
 *      (today: zero) matches the UUID v4/v5 shape, and the current
 *      authoritative expected persisted count is 0 for both.
 *  P8. The four preservation classes partition the 1,000 rows after each
 *      continuous-publication admission.
 *  P9. `frontmatter_noindex` and `publication_gate_nonpublic` are
 *      tracked as separate fields; nonpublic incumbents are explicitly
 *      held via `publication_gate_nonpublic=true` even when frontmatter
 *      `noindex` is absent.
 * P10. Pilot manifest `searchatlas_record_status` lives under
 *      `pilot_searchatlas_workflow_status` with a non-creation label.
 * P11. Deterministic `program_row_id`, identical `last_verified_at`.
 * P12. Idempotency: two consecutive runs produce byte-identical JSON /
 *      CSV / report and identical `content_fingerprint_sha256`.
 * P13. The report documents the pilot-aware invariant, the preservation
 *      classes, and the SearchAtlas-vs-Content-Genius distinction.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(HERE, '..', '..');
const SCRIPT = path.join(MRX_ROOT, 'scripts/build-mrx-1000-content-ledger.mjs');
const CANONICAL_JSON = path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json');
const CANONICAL_CSV = path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.csv');
const EXPECTED_CANONICAL_JSON_SHA256 =
  '7d6dddbb0b4681ad5de2081f96ef26e472e3bf03ffc80315871cf1a3f23c51fc';
const EXPECTED_CANONICAL_CSV_SHA256 =
  '32b59b6a97474017d0c642a52bd1b7831464d7b85067ac5b3191a95ebde1fdf5';
const TEST_OUTPUT_DIR = mkdtempSync(path.join(tmpdir(), 'mrx1000-ledger-idempotency-'));
const JSON_OUT = path.join(TEST_OUTPUT_DIR, 'mrx-1000-canonical-content-ledger.json');
const CSV_OUT = path.join(TEST_OUTPUT_DIR, 'mrx-1000-canonical-content-ledger.csv');
const POST_PUBLICATION_VERIFICATION = path.join(
  MRX_ROOT,
  'artifacts/mrx1000-release-10/release/post-publication-verification.json',
);
const REPORT_OUT = path.join(TEST_OUTPUT_DIR, 'mrx-1000-canonical-content-ledger-report.md');
const PILOT_MANIFEST = path.join(MRX_ROOT, 'config/mrx-1000-pilot-batch-001.json');
const POSTS_DIR = path.join(MRX_ROOT, 'src/content/posts');
const RETIRED_REPO_SOURCE_SLUGS = new Set([
  'avoiding-predatory-offers-fair-valuation-for-mineral-rights',
  'how-to-identify-unfair-offers-for-mineral-rights',
  'texas-mineral-rights-valuation-vs-predatory-offers-what-to-know',
  'what-to-do-when-you-have-multiple-offers-for-your-mineral-rights',
  '5-essential-steps-to-verify-the-legitimacy-of-your-mineral-rights-offer',
  'are-there-unexpected-fees-when-evaluating-your-mineral-rights-find-out-here',
  'assessing-competing-mineral-rights-offers-what-you-need-to-know',
  'avoid-surprises-key-costs-to-consider-during-your-mineral-rights-assessment-process',
  'avoid-these-key-mistakes-when-evaluating-mineral-rights-offers-for-maximum-value',
]);
const RELEASE_BATCH = JSON.parse(
  readFileSync(path.join(MRX_ROOT, 'config/mrx1000-release-10-batch.json'), 'utf8'),
) as { articles: unknown[] };
const EXPECTED_PUBLIC_COUNT = (
  JSON.parse(readFileSync(CANONICAL_JSON, 'utf8')) as {
    verification: {
      preservation_classification_counts: { live_public_published_route: number };
    };
  }
).verification.preservation_classification_counts.live_public_published_route;
let expectedIncumbentCount = 0;
let expectedHeldCount = 0;
let expectedPlanningCount = 0;

interface PilotArticle {
  article_id: string;
  cluster_id: string;
  map_id: number;
  map_cluster: string;
  primary_keyword: string;
  title: string;
  slug: string;
  canonical_url?: string;
  mdx_path: string;
  searchatlas_record_status: string;
  externally_published?: boolean;
  publication_state: string;
  dedupe_disposition?: string;
  compliance?: {
    gate?: string;
    disposition?: string;
    publication_approval?: string;
    legal_tax_sensitive?: boolean;
    human_escalation_required_on_advice_like_language?: boolean;
    human_escalation_specialist?: string;
  };
}

interface PilotManifest {
  batch_id: string;
  articles: PilotArticle[];
}

interface LedgerArticleRow {
  program_row_id: string;
  canonical_title: string;
  canonical_slug: string;
  cluster: string;
  pillar: string;
  source_system: string;
  source_record_id: string;
  repo_path: string | null;
  publication_status: string | null;
  draft: boolean | null;
  // MRX1000-036 split: the literal frontmatter `noindex` field, distinct from
  // the derived publication-gate flag.
  frontmatter_noindex: boolean;
  publication_gate_nonpublic: boolean;
  noindex_required: boolean | null;
  preservation_classification:
    | 'live_public_published_route'
    | 'incumbent_draft_nonpublic_held'
    | 'pilot_draft_noindex_stage'
    | 'planning_only_inventory';
  normalized_status: string;
  publication_state: string;
  deployment_id: string | null;
  production_verification_sha256: string | null;
  index_status: string | null;
  is_pilot_001: boolean;
  searchatlas_map_id: number | null;
  searchatlas_title_uuid: string | null;
  searchatlas_record_id: string | null;
  searchatlas_record_id_dropped: string | null;
  content_genius_article_uuid: string | null;
  content_genius_editor_url: string | null;
  pilot_article_id: string | null;
  pilot_batch_id: string | null;
  pilot_mdx_path: string | null;
  pilot_searchatlas_workflow_status: string | null;
  pilot_searchatlas_workflow_status_evidence_is_non_creation: boolean;
  pilot_searchatlas_record_status: string | null;
  pilot_dedupe_disposition: string | null;
  pilot_compliance_gate: string | null;
  pilot_compliance_disposition: string | null;
  pilot_compliance_publication_approval: boolean | null;
  pilot_compliance_legal_tax_sensitive: boolean | null;
  pilot_compliance_human_escalation_required: boolean | null;
  pilot_compliance_human_escalation_specialist: string | null;
  last_verified_at: string;
  [k: string]: unknown;
}

interface Ledger {
  generated_at: string;
  content_fingerprint_sha256: string;
  identity_registry: {
    preserved_existing_id_count: number;
    newly_allocated_id_count: number;
    wave100_rekey?: { program_row_id: string };
    wave101_rekey?: { program_row_id: string };
    wave102_rekey?: { program_row_id: string };
    wave103_rekey?: { program_row_id: string };
    wave104_rekey?: { program_row_id: string };
    wave105_rekey?: { program_row_id: string };
    wave106_rekey?: { program_row_id: string };
    wave107_rekey?: { program_row_id: string };
    wave108_rekey?: { program_row_id: string };
    wave110_rekey?: { program_row_id: string };
    wave112_rekey?: { program_row_id: string };
    wave114_rekey?: { program_row_id: string };
    wave115_rekey?: { program_row_id: string };
    wave116_rekey?: { program_row_id: string };
    wave117_rekey?: { program_row_id: string };
    wave118_rekey?: { program_row_id: string };
    wave119_rekey?: { program_row_id: string };
    wave120_rekey?: { program_row_id: string };
    wave121_rekey?: { program_row_id: string };
    wave122_rekey?: { program_row_id: string };
    wave123_rekey?: { program_row_id: string };
    wave124_rekey?: { program_row_id: string };
    wave125_rekey?: { program_row_id: string };
  };
  policy: {
    pilot_aware: boolean;
    deterministic_generated_at_from_input_state: boolean;
    evidence_taxonomy: Record<string, boolean>;
    preservation_classification_taxonomy: Record<string, string>;
  };
  verification: {
    row_count: number;
    incumbent_repo_count: number;
    pilot_001_count: number;
    pilot_001_count_with_repo_mdx: number;
    pilot_manifest_article_count: number;
    pilot_manifest_articles_with_mdx_shell: number;
    unique_slug_count: number;
    unique_normalized_title_count: number;
    all_quota_checks_pass: boolean;
    preservation_classification_counts: {
      live_public_published_route: number;
      incumbent_draft_nonpublic_held: number;
      pilot_draft_noindex_stage: number;
      planning_only_inventory: number;
    };
    aggregate_eq_1000: boolean;
    evidence_taxonomy: {
      searchatlas_record_id_non_null_uuid_count: number;
      content_genius_article_uuid_non_null_count: number;
      searchatlas_title_uuid_non_null_count: number;
      searchatlas_record_id_dropped_count: number;
      pilot_article_id_non_null_count: number;
      pilot_searchatlas_workflow_status_pilot_rows_with_non_creation_label: number;
    };
  };
  source_summary: Record<string, number>;
  articles: LedgerArticleRow[];
}

// UUID v4/v5 shape used by the auditor. Must accept both rfc4122 versions;
// reject local manifest IDs like `MRX1000-PILOT-001-12`.
const UUID_V4_V5_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function runGenerator(): void {
  const r = spawnSync(process.execPath, [SCRIPT], {
    cwd: MRX_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      MRX1000_LEDGER_OUTPUT_DIR: TEST_OUTPUT_DIR,
      MRX1000_LEDGER_REPORT_PATH: REPORT_OUT,
      MRX1000_LEDGER_PRIOR_PATH: CANONICAL_JSON,
    },
  });
  if (r.status !== 0) {
    throw new Error(
      `build-mrx-1000-content-ledger.mjs exited ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`,
    );
  }
}

function sha256File(p: string): string {
  return createHash('sha256').update(readFileSync(p)).digest('hex');
}

function readLedger(): Ledger {
  return JSON.parse(readFileSync(JSON_OUT, 'utf8')) as Ledger;
}

describe('MRX1000 canonical ledger generator (pilot-aware + idempotent)', () => {
  let manifest: PilotManifest;
  let ledger: Ledger;
  let pilotSlugSet: Set<string>;
  let onDiskMdxSlugs: Set<string>;
  let md5First: { json: string; csv: string; report: string };
  let fingerprintFirst: string;
  let generatedAtFirst: string;
  let expectedReleaseDeploymentId: string | null;
  let expectedReleaseVerifiedCount: number;

  beforeAll(() => {
    expect(sha256File(CANONICAL_JSON)).toBe(EXPECTED_CANONICAL_JSON_SHA256);
    expect(sha256File(CANONICAL_CSV)).toBe(EXPECTED_CANONICAL_CSV_SHA256);
    manifest = JSON.parse(readFileSync(PILOT_MANIFEST, 'utf8')) as PilotManifest;
    const productionVerification = existsSync(POST_PUBLICATION_VERIFICATION)
      ? JSON.parse(readFileSync(POST_PUBLICATION_VERIFICATION, 'utf8'))
      : null;
    expectedReleaseDeploymentId = productionVerification?.deployment?.deployment_id ?? null;
    expectedReleaseVerifiedCount = productionVerification?.summary?.expected_articles ?? 0;
    pilotSlugSet = new Set(manifest.articles.map((a) => a.slug));
    onDiskMdxSlugs = new Set(
      readdirSync(POSTS_DIR)
        .filter((name) => name.endsWith('.mdx'))
        .map((name) => name.replace(/\.mdx$/, '')),
    );
    const retiredRepoSourceCount = [...RETIRED_REPO_SOURCE_SLUGS].filter((slug) =>
      onDiskMdxSlugs.has(slug),
    ).length;
    expectedIncumbentCount =
      onDiskMdxSlugs.size - manifest.articles.length - retiredRepoSourceCount;
    expectedHeldCount = expectedIncumbentCount - EXPECTED_PUBLIC_COUNT;
    expectedPlanningCount = 1000 - expectedIncumbentCount - manifest.articles.length;

    expect(manifest.articles.length).toBe(25);
    // The 25 pilot slugs must each have an MDX shell on disk. This is a
    // precondition of the pilot-aware repo-skip behavior the generator
    // depends on; if it ever breaks, the generator must hard-fail rather
    // than silently fabricate a row.
    for (const a of manifest.articles) {
      expect(onDiskMdxSlugs.has(a.slug)).toBe(true);
    }

    // Run #1 captures the baseline. The same generator will be re-run
    // in the byte-determinism test below; the bytes must be identical.
    runGenerator();
    expect(existsSync(JSON_OUT)).toBe(true);
    expect(existsSync(CSV_OUT)).toBe(true);
    expect(existsSync(REPORT_OUT)).toBe(true);
    ledger = readLedger();
    md5First = {
      json: sha256File(JSON_OUT),
      csv: sha256File(CSV_OUT),
      report: sha256File(REPORT_OUT),
    };
    fingerprintFirst = ledger.content_fingerprint_sha256;
    generatedAtFirst = ledger.generated_at;
  });

  afterAll(() => {
    expect(sha256File(CANONICAL_JSON)).toBe(EXPECTED_CANONICAL_JSON_SHA256);
    expect(sha256File(CANONICAL_CSV)).toBe(EXPECTED_CANONICAL_CSV_SHA256);
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  it('reports pilot-aware policy and a deterministic generated_at method', () => {
    expect(ledger.policy.pilot_aware).toBe(true);
    expect(ledger.policy.deterministic_generated_at_from_input_state).toBe(true);
    expect(ledger.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('produces exactly 1,000 rows with all 9 cluster quotas filled', () => {
    expect(ledger.articles.length).toBe(1000);
    expect(ledger.verification.row_count).toBe(1000);
    expect(ledger.verification.unique_slug_count).toBe(1000);
    expect(ledger.verification.unique_normalized_title_count).toBe(1000);
    expect(ledger.verification.all_quota_checks_pass).toBe(true);
  });

  it('preserves post-Wave-99 rekeys and restores displaced planning identities', () => {
    const bySlug = new Map(ledger.articles.map((row) => [row.canonical_slug, row]));
    expect(ledger.identity_registry.preserved_existing_id_count).toBe(1000);
    expect(ledger.identity_registry.newly_allocated_id_count).toBe(0);
    expect(ledger.identity_registry.wave100_rekey?.program_row_id).toBe('MRX1000-0283');
    expect(ledger.identity_registry.wave101_rekey?.program_row_id).toBe('MRX1000-0284');
    expect(ledger.identity_registry.wave102_rekey?.program_row_id).toBe('MRX1000-0285');
    expect(ledger.identity_registry.wave103_rekey?.program_row_id).toBe('MRX1000-0287');
    expect(ledger.identity_registry.wave104_rekey?.program_row_id).toBe('MRX1000-0288');
    expect(ledger.identity_registry.wave105_rekey?.program_row_id).toBe('MRX1000-0289');
    expect(ledger.identity_registry.wave106_rekey?.program_row_id).toBe('MRX1000-0291');
    expect(ledger.identity_registry.wave107_rekey?.program_row_id).toBe('MRX1000-0292');
    expect(ledger.identity_registry.wave108_rekey?.program_row_id).toBe('MRX1000-0293');
    expect(ledger.identity_registry.wave110_rekey?.program_row_id).toBe('MRX1000-0295');
    expect(ledger.identity_registry.wave112_rekey?.program_row_id).toBe('MRX1000-0297');
    expect(ledger.identity_registry.wave114_rekey?.program_row_id).toBe('MRX1000-0298');
    expect(ledger.identity_registry.wave115_rekey?.program_row_id).toBe('MRX1000-0299');
    expect(ledger.identity_registry.wave116_rekey?.program_row_id).toBe('MRX1000-0300');
    expect(ledger.identity_registry.wave117_rekey?.program_row_id).toBe('MRX1000-0301');
    expect(ledger.identity_registry.wave118_rekey?.program_row_id).toBe('MRX1000-0308');
    expect(ledger.identity_registry.wave119_rekey?.program_row_id).toBe('MRX1000-0317');
    expect(ledger.identity_registry.wave120_rekey?.program_row_id).toBe('MRX1000-0321');
    expect(ledger.identity_registry.wave121_rekey?.program_row_id).toBe('MRX1000-0326');
    expect(ledger.identity_registry.wave122_rekey?.program_row_id).toBe('MRX1000-0327');
    expect(ledger.identity_registry.wave123_rekey?.program_row_id).toBe('MRX1000-0328');
    expect(ledger.identity_registry.wave124_rekey?.program_row_id).toBe('MRX1000-0329');
    expect(ledger.identity_registry.wave125_rekey?.program_row_id).toBe('MRX1000-0330');
    expect(bySlug.has('understanding-the-true-worth-of-your-mineral-interests')).toBe(false);
    expect(
      bySlug.has(
        'understanding-your-mineral-rights-how-to-determine-eligibility-for-evaluation-today',
      ),
    ).toBe(false);
    expect(
      bySlug.has(
        'understanding-your-mineral-rights-uncovering-their-true-value-and-potential-for-fair-assessment',
      ),
    ).toBe(false);
    expect(
      bySlug.has(
        'unlocking-the-hidden-worth-of-your-mineral-rights-what-every-owner-needs-to-know',
      ),
    ).toBe(false);
    expect(
      bySlug.get('texas-rrc-inactive-well-aging-report-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0287');
    expect(
      bySlug.has('unlocking-the-secrets-how-to-determine-the-worth-of-your-mineral-rights'),
    ).toBe(false);
    expect(
      bySlug.get('texas-rrc-p-5-renewal-status-query-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0288');
    expect(bySlug.has('well-spacing-permits-and-drilling-inventory-in-mineral-valuation')).toBe(
      false,
    );
    expect(
      bySlug.get('texas-rrc-orphan-well-query-retrieval-provenance-worksheet')?.program_row_id,
    ).toBe('MRX1000-0289');
    expect(bySlug.has('what-factors-determine-the-value-of-mineral-rights')).toBe(false);
    expect(
      bySlug.get('texas-rrc-online-inspection-lookup-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0291');
    expect(bySlug.has('what-factors-impact-your-mineral-rights-valuation')).toBe(false);
    expect(
      bySlug.get('texas-rrc-new-lease-ids-built-query-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0292');
    expect(bySlug.has('what-factors-influence-mineral-rights-valuation')).toBe(false);
    expect(
      bySlug.get('texas-rrc-g-10-w-10-well-status-report-query-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0293');
    expect(
      bySlug.has('what-influences-the-value-of-your-mineral-rights-during-the-assessment-process'),
    ).toBe(false);
    expect(bySlug.get('texas-rrc-h-9-query-retrieval-provenance-worksheet')?.program_row_id).toBe(
      'MRX1000-0295',
    );
    expect(bySlug.has('what-to-expect-from-your-mineral-rights-evaluation')).toBe(false);
    expect(
      bySlug.get('texas-rrc-production-data-query-retrieval-provenance-worksheet')?.program_row_id,
    ).toBe('MRX1000-0297');
    expect(
      bySlug.has('what-variables-should-mineral-rights-owners-know-to-determine-asset-value'),
    ).toBe(false);
    expect(
      bySlug.get('texas-comptroller-lease-drop-retrieval-provenance-worksheet')?.program_row_id,
    ).toBe('MRX1000-0298');
    expect(bySlug.has('why-a-mineral-rights-assessment-is-essential-for-owners')).toBe(false);
    expect(
      bySlug.get('texas-rrc-production-by-lease-retrieval-provenance-worksheet')?.program_row_id,
    ).toBe('MRX1000-0299');
    expect(
      bySlug.has('your-guide-to-understanding-the-true-value-of-your-mineral-rights-asset'),
    ).toBe(false);
    expect(
      bySlug.get('texas-rrc-production-by-filing-operator-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0300');
    expect(bySlug.has('avoiding-predatory-offers-fair-valuation-for-mineral-rights')).toBe(false);
    expect(
      bySlug.get('texas-rrc-production-by-operator-of-record-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0301');
    expect(bySlug.has('how-to-identify-unfair-offers-for-mineral-rights')).toBe(false);
    expect(
      bySlug.get('texas-rrc-edms-injection-disposal-permit-document-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0308');
    expect(bySlug.has('texas-mineral-rights-valuation-vs-predatory-offers-what-to-know')).toBe(
      false,
    );
    expect(
      bySlug.get('texas-rrc-imaged-well-log-retrieval-provenance-worksheet')?.program_row_id,
    ).toBe('MRX1000-0317');
    expect(bySlug.has('what-to-do-when-you-have-multiple-offers-for-your-mineral-rights')).toBe(
      false,
    );
    expect(
      bySlug.get('texas-rrc-imaged-potential-file-retrieval-provenance-worksheet')?.program_row_id,
    ).toBe('MRX1000-0321');
    expect(
      bySlug.has('5-essential-steps-to-verify-the-legitimacy-of-your-mineral-rights-offer'),
    ).toBe(false);
    expect(
      bySlug.get('texas-rrc-dry-hole-file-retrieval-provenance-worksheet')?.program_row_id,
    ).toBe('MRX1000-0326');
    expect(
      bySlug.has('are-there-unexpected-fees-when-evaluating-your-mineral-rights-find-out-here'),
    ).toBe(false);
    expect(
      bySlug.get('texas-rrc-district-office-well-records-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0327');
    expect(bySlug.has('assessing-competing-mineral-rights-offers-what-you-need-to-know')).toBe(
      false,
    );
    expect(
      bySlug.get('texas-rrc-form-p-18-skim-oil-condensate-report-retrieval-provenance-worksheet')
        ?.program_row_id,
    ).toBe('MRX1000-0328');
    expect(
      bySlug.has(
        'avoid-surprises-key-costs-to-consider-during-your-mineral-rights-assessment-process',
      ),
    ).toBe(false);
    expect(
      bySlug.get(
        'texas-rrc-form-t-1-monthly-transportation-storage-report-retrieval-provenance-worksheet',
      )?.program_row_id,
    ).toBe('MRX1000-0329');
    expect(
      bySlug.has(
        'avoid-these-key-mistakes-when-evaluating-mineral-rights-offers-for-maximum-value',
      ),
    ).toBe(false);
    expect(
      bySlug.get(
        'texas-rrc-groundwater-protection-determination-letter-retrieval-provenance-worksheet',
      )?.program_row_id,
    ).toBe('MRX1000-0330');
    expect(
      bySlug.get('mineral-rights-valuation-checklist-without-obligation')?.program_row_id,
    ).toBe('MRX1000-0237');
    expect(
      bySlug.get('mineral-rights-valuation-negotiation-tips-without-obligation')?.program_row_id,
    ).toBe('MRX1000-0252');
  });

  it('separates the growing incumbent corpus from 25 pilot rows with no slug collision', () => {
    // The original bug: pilot slugs exist on disk as MDX QA shells, so a
    // naive `astro_repo` scan would try to add them and then collide with
    // the pilot manifest's required-rows on canonical_slug. The pilot-
    // aware skip in loadRepoCandidates keeps every non-pilot MDX row under
    // `astro_repo` while the 25 pilot shells remain manifest-owned rows.
    expect(ledger.verification.incumbent_repo_count).toBe(expectedIncumbentCount);
    expect(ledger.verification.pilot_001_count).toBe(25);
    expect(ledger.source_summary['astro_repo']).toBe(expectedIncumbentCount);
    expect(ledger.source_summary['searchatlas_topical_map_pilot']).toBe(25);
    // No row is in both buckets.
    const astroSlugs = new Set(
      ledger.articles.filter((r) => r.source_system === 'astro_repo').map((r) => r.canonical_slug),
    );
    const pilotSlugsInLedger = new Set(
      ledger.articles
        .filter((r) => r.source_system === 'searchatlas_topical_map_pilot')
        .map((r) => r.canonical_slug),
    );
    for (const slug of pilotSlugsInLedger) {
      expect(astroSlugs.has(slug)).toBe(false);
    }
  });

  it('every pilot slug from the manifest appears in the ledger exactly once', () => {
    const slugsInLedger = new Map<string, number>();
    for (const row of ledger.articles) {
      if (!row.is_pilot_001) continue;
      slugsInLedger.set(row.canonical_slug, (slugsInLedger.get(row.canonical_slug) ?? 0) + 1);
    }
    expect(slugsInLedger.size).toBe(25);
    for (const article of manifest.articles) {
      expect(slugsInLedger.has(article.slug)).toBe(true);
    }
    for (const [slug, count] of slugsInLedger) {
      expect(count).toBe(1);
      expect(pilotSlugSet.has(slug)).toBe(true);
    }
  });

  it('preserves pilot manifest metadata on each pilot row', () => {
    const bySlug = new Map(ledger.articles.map((r) => [r.canonical_slug, r]));
    for (const article of manifest.articles) {
      const row = bySlug.get(article.slug) as LedgerArticleRow | undefined;
      expect(row, `pilot row ${article.slug} missing from ledger`).toBeDefined();
      expect(row!.is_pilot_001).toBe(true);
      expect(row!.source_system).toBe('searchatlas_topical_map_pilot');
      expect(row!.pilot_article_id).toBe(article.article_id);
      expect(row!.pilot_batch_id).toBe(manifest.batch_id);
      expect(row!.searchatlas_map_id).toBe(article.map_id);
      expect(row!.map_cluster).toBe(article.map_cluster);
      expect(row!.pilot_searchatlas_record_status).toBe(article.searchatlas_record_status);
      expect(row!.pilot_dedupe_disposition).toBe(article.dedupe_disposition ?? null);
      expect(row!.pilot_mdx_path).toBe(article.mdx_path);
      expect(row!.repo_path).toBe(`mrx/src/content/posts/${article.slug}.mdx`);
      // Compliance fields preserved through the manifest.
      expect(row!.pilot_compliance_gate).toBe(article.compliance?.gate ?? null);
      expect(row!.pilot_compliance_disposition).toBe(article.compliance?.disposition ?? null);
      expect(row!.pilot_compliance_publication_approval).toBe(
        article.compliance?.publication_approval ?? null,
      );
      expect(row!.pilot_compliance_legal_tax_sensitive).toBe(
        article.compliance?.legal_tax_sensitive ?? false,
      );
      expect(row!.pilot_compliance_human_escalation_required).toBe(
        article.compliance?.human_escalation_required_on_advice_like_language ?? false,
      );
      expect(row!.pilot_compliance_human_escalation_specialist).toBe(
        article.compliance?.human_escalation_specialist ?? null,
      );
    }
  });

  it('every pilot row preserves fail-closed publication/noindex facts from its MDX frontmatter', () => {
    for (const article of manifest.articles) {
      const row = ledger.articles.find((r) => r.canonical_slug === article.slug);
      expect(row).toBeDefined();
      // The MDX frontmatter is the fail-closed truth for noindex/draft. Each
      // pilot shell was authored with noindex: true, draft: true. The ledger
      // must reflect that, not the manifest's `publication_state: noindex_stage`.
      expect(row!.frontmatter_noindex).toBe(true);
      expect(row!.draft).toBe(true);
      expect(row!.publication_status).toBe('draft');
      expect(row!.publication_gate_nonpublic).toBe(true);
      expect(row!.noindex_required).toBe(true);
      expect(row!.preservation_classification).toBe('pilot_draft_noindex_stage');
      expect(row!.normalized_status).toBe('pilot_draft_noindex_stage_planned_workflow');
    }
  });

  it('keeps local manifest IDs out of authoritative UUID fields (pilot_article_id preserved, searchatlas_record_id null)', () => {
    // `pilot_article_id` (e.g. `MRX1000-PILOT-001-12`) is the local manifest
    // handle. It MUST live only under `pilot_article_id` and `source_record_id`
    // and MUST NOT leak into `searchatlas_record_id` or
    // `content_genius_article_uuid`. This prevents the ledger from being
    // mistaken for evidence of a created article.
    let pilotWithNonUuidSearchAtlasRecordId = 0;
    let pilotWithContentGeniusUuid = 0;
    for (const row of ledger.articles) {
      if (!row.is_pilot_001) continue;
      if (row.searchatlas_record_id) pilotWithNonUuidSearchAtlasRecordId += 1;
      if (row.content_genius_article_uuid) pilotWithContentGeniusUuid += 1;
      // The local manifest ID must still be present in its proper field.
      expect(row.pilot_article_id).toMatch(/^MRX1000-PILOT-001-\d+$/);
      expect(row.source_record_id).toMatch(/^MRX1000-PILOT-001:\d{2}$/);
    }
    expect(pilotWithNonUuidSearchAtlasRecordId).toBe(0);
    expect(pilotWithContentGeniusUuid).toBe(0);
    expect(ledger.verification.evidence_taxonomy.pilot_article_id_non_null_count).toBe(25);
    // No row across the whole 1,000 has any of these authoritative UUIDs set.
    expect(ledger.verification.evidence_taxonomy.searchatlas_record_id_non_null_uuid_count).toBe(0);
    expect(ledger.verification.evidence_taxonomy.content_genius_article_uuid_non_null_count).toBe(
      0,
    );
    expect(ledger.verification.evidence_taxonomy.searchatlas_record_id_dropped_count).toBe(0);
  });

  it('every non-null searchatlas_record_id / content_genius_article_uuid matches UUID v4/v5 shape (current authoritative expected persisted count = 0)', () => {
    let totalAuthoritativeUuids = 0;
    for (const row of ledger.articles) {
      if (row.searchatlas_record_id) {
        expect(row.searchatlas_record_id).toMatch(UUID_V4_V5_RE);
        totalAuthoritativeUuids += 1;
      }
      if (row.content_genius_article_uuid) {
        expect(row.content_genius_article_uuid).toMatch(UUID_V4_V5_RE);
        totalAuthoritativeUuids += 1;
      }
    }
    // Current authoritative expected count from the evidence-taxonomy guard:
    // the ledger asserts zero Content Genius article UUIDs and zero SearchAtlas
    // record IDs anywhere in the 1,000 rows.
    expect(ledger.verification.evidence_taxonomy.searchatlas_record_id_non_null_uuid_count).toBe(0);
    expect(ledger.verification.evidence_taxonomy.content_genius_article_uuid_non_null_count).toBe(
      0,
    );
    expect(totalAuthoritativeUuids).toBe(0);
  });

  it('preservation classes partition the 1,000 rows after the current continuous wave', () => {
    const counts = ledger.verification.preservation_classification_counts;
    expect(counts.live_public_published_route).toBe(EXPECTED_PUBLIC_COUNT);
    expect(counts.incumbent_draft_nonpublic_held).toBe(expectedHeldCount);
    expect(counts.pilot_draft_noindex_stage).toBe(25);
    expect(counts.planning_only_inventory).toBe(expectedPlanningCount);
    expect(ledger.verification.aggregate_eq_1000).toBe(true);
    expect(
      counts.live_public_published_route +
        counts.incumbent_draft_nonpublic_held +
        counts.pilot_draft_noindex_stage +
        counts.planning_only_inventory,
    ).toBe(1000);
    // The remaining incumbent drafts stay fail-closed. Admitted rows receive
    // production verification only after a successful deployment.
    const drafts = ledger.articles.filter(
      (r) => r.preservation_classification === 'incumbent_draft_nonpublic_held',
    );
    expect(drafts.length).toBe(expectedHeldCount);
    for (const row of drafts) {
      expect(row.publication_gate_nonpublic).toBe(true);
    }
    const verifiedRelease10 = ledger.articles.filter(
      (row) => row.normalized_status === 'live_public_published_route_release_10_verified',
    );
    expect(verifiedRelease10).toHaveLength(expectedReleaseVerifiedCount);
    expect(
      verifiedRelease10.every(
        (row) =>
          row.publication_state === 'released_public_article' &&
          row.publication_gate_nonpublic === false &&
          row.production_verification_sha256 &&
          row.deployment_id === expectedReleaseDeploymentId &&
          row.index_status === 'published_indexable_pending_search_engine_index_confirmation' &&
          typeof row.action_reason === 'string' &&
          row.action_reason.includes('not a numerical release gate') &&
          !row.action_reason.includes('10-to-25'),
      ),
    ).toBe(true);
    const pendingProductionVerification = ledger.articles.filter(
      (row) => row.normalized_status === 'authorized_release_candidate_pending_gate_and_deployment',
    );
    expect(pendingProductionVerification).toHaveLength(
      RELEASE_BATCH.articles.length - expectedReleaseVerifiedCount,
    );
    const ordinaryHeldDrafts = drafts;
    expect(ordinaryHeldDrafts).toHaveLength(expectedHeldCount);
    expect(
      ordinaryHeldDrafts.every(
        (row) =>
          row.normalized_status === 'incumbent_draft_nonpublic_publication_held' &&
          row.publication_state === 'draft_workspace_article',
      ),
    ).toBe(true);
    // The 9 legacy routes and all quality-cleared release routes are live-public,
    // while retaining distinct normalized statuses for provenance.
    const live = ledger.articles.filter(
      (r) => r.preservation_classification === 'live_public_published_route',
    );
    expect(live.length).toBe(EXPECTED_PUBLIC_COUNT);
    for (const row of live) {
      expect(row.publication_gate_nonpublic).toBe(false);
      expect([
        'live_public_published_route_existing_route_verified',
        'live_public_published_route_release_10_verified',
        'authorized_release_candidate_pending_gate_and_deployment',
      ]).toContain(row.normalized_status);
    }
  });

  it('nonpublic incumbents carry publication_gate_nonpublic=true regardless of frontmatter_noindex', () => {
    let nonpublicRows = 0;
    let nonpublicRowsWithFrontmatterNoindexTrue = 0;
    let nonpublicRowsWithFrontmatterNoindexFalse = 0;
    for (const row of ledger.articles) {
      if (row.publication_gate_nonpublic) {
        nonpublicRows += 1;
        if (row.frontmatter_noindex) {
          nonpublicRowsWithFrontmatterNoindexTrue += 1;
        } else {
          nonpublicRowsWithFrontmatterNoindexFalse += 1;
        }
      }
    }
    // Nonpublic rows are held incumbents, pilots, and planning-only rows.
    expect(nonpublicRows).toBe(expectedHeldCount + 25 + expectedPlanningCount);
    // The 25 pilots explicitly declare frontmatter `noindex: true`.
    expect(nonpublicRowsWithFrontmatterNoindexTrue).toBe(25);
    expect(nonpublicRowsWithFrontmatterNoindexFalse).toBe(
      expectedHeldCount + expectedPlanningCount,
    );
    // `noindex_required` is the derived disjunction; nonpublic rows keep the
    // safe downstream default of `true` regardless of the frontmatter fact.
    for (const row of ledger.articles) {
      if (row.publication_gate_nonpublic) expect(row.noindex_required).toBe(true);
    }
  });

  it('pilot manifest searchatlas_record_status lives under pilot_searchatlas_workflow_status with a non-creation label', () => {
    // The pilot manifest carries `searchatlas_record_status: "needs_review"`
    // on all 25 articles. That value is planning/staging workflow metadata,
    // NOT an authoritative Content Genius readback. It must be stored under
    // a clearly-named workflow field with a non-creation label, and never
    // surfaced as evidence of a created article.
    for (const article of manifest.articles) {
      const row = ledger.articles.find((r) => r.canonical_slug === article.slug);
      expect(row).toBeDefined();
      expect(row!.pilot_searchatlas_workflow_status).toBe(article.searchatlas_record_status);
      expect(row!.pilot_searchatlas_workflow_status_evidence_is_non_creation).toBe(true);
      // Back-compat alias still works for callers that reference the old field.
      expect(row!.pilot_searchatlas_record_status).toBe(article.searchatlas_record_status);
    }
    expect(
      ledger.verification.evidence_taxonomy
        .pilot_searchatlas_workflow_status_pilot_rows_with_non_creation_label,
    ).toBe(25);
  });

  it('all 25 pilots have a corresponding on-disk MDX shell referenced from repo_path', () => {
    expect(ledger.verification.pilot_manifest_articles_with_mdx_shell).toBe(25);
    expect(ledger.verification.pilot_001_count_with_repo_mdx).toBe(25);
    const pilotRows = ledger.articles.filter((r) => r.is_pilot_001);
    expect(pilotRows.length).toBe(25);
    for (const row of pilotRows) {
      expect(row.repo_path).toMatch(/^mrx\/src\/content\/posts\/.+\.mdx$/);
      const localPath = path.join(MRX_ROOT, row.repo_path!.replace(/^mrx\//, ''));
      expect(existsSync(localPath)).toBe(true);
      expect(statSync(localPath).size).toBeGreaterThan(0);
    }
  });

  it('distinguishes topical-map title handles from Content Genius article UUIDs', () => {
    // Each pilot row MAY carry a searchatlas_record_id (= pilot article_id,
    // a planning-style handle). None of them carry a Content Genius article
    // UUID; the ledger field is reserved but stays null until an authoritative
    // local artifact names it.
    let pilotWithCgUuid = 0;
    let pilotWithTitleUuid = 0;
    let totalCgUuids = 0;
    let totalTitleUuids = 0;
    for (const row of ledger.articles) {
      if (row.content_genius_article_uuid) totalCgUuids += 1;
      if (row.searchatlas_title_uuid) totalTitleUuids += 1;
      if (!row.is_pilot_001) continue;
      if (row.content_genius_article_uuid) pilotWithCgUuid += 1;
      if (row.searchatlas_title_uuid) pilotWithTitleUuid += 1;
    }
    expect(pilotWithCgUuid).toBe(0);
    expect(totalCgUuids).toBe(0);
    // Topical-map title UUIDs come from searchatlas_topical_map_export rows,
    // NOT from pilot rows; pilot rows have map_id + record_id but no
    // title_uuid planning handle.
    expect(pilotWithTitleUuid).toBe(0);
    expect(totalTitleUuids).toBeGreaterThan(0);
    // Confirmation that the ledger explicitly distinguishes the two:
    expect(ledger.articles.some((r) => 'searchatlas_title_uuid' in r)).toBe(true);
    expect(ledger.articles.every((r) => 'content_genius_article_uuid' in r)).toBe(true);
  });

  it('no row claims SearchAtlas article creation or Content Genius authorship', () => {
    for (const row of ledger.articles) {
      expect((row as any).searchatlas_created).toBeUndefined();
      expect((row as any).content_genius_authored).toBeUndefined();
    }
  });

  it('every row has a deterministic, unique program_row_id and last_verified_at', () => {
    const ids = new Set<string>();
    for (const row of ledger.articles) {
      expect(row.program_row_id).toMatch(/^MRX1000-\d{4}$/);
      expect(ids.has(row.program_row_id)).toBe(false);
      ids.add(row.program_row_id);
      expect(row.last_verified_at).toBe(ledger.generated_at);
    }
    expect(ids.size).toBe(1000);
  });

  it('idempotent: two consecutive runs produce byte-identical output for unchanged inputs', () => {
    // Run #2: capture hashes and a fresh fingerprint + generated_at.
    runGenerator();
    const md5Second = {
      json: sha256File(JSON_OUT),
      csv: sha256File(CSV_OUT),
      report: sha256File(REPORT_OUT),
    };
    const second = readLedger();
    // JSON / CSV / report bytes must be byte-identical across the two runs.
    expect(md5Second.json).toBe(md5First.json);
    expect(md5Second.csv).toBe(md5First.csv);
    expect(md5Second.report).toBe(md5First.report);
    // The deterministic generated_at must also match — proving it is
    // derived from input state, not wall-clock time.
    expect(second.generated_at).toBe(generatedAtFirst);
    // The row-content fingerprint must also match: same 1,000 rows, same
    // slugs, same titles, same sources, same clusters.
    expect(second.content_fingerprint_sha256).toBe(fingerprintFirst);
  });

  it('report documents the pilot-aware, idempotent, evidence-taxonomy invariants', () => {
    const report = readFileSync(REPORT_OUT, 'utf8');
    expect(report).toContain('Pilot-aware');
    expect(report).toContain('Idempotent');
    expect(report).toContain('deterministic');
    expect(report).toContain('Generated at:');
    expect(report).toContain('pilot manifest');
    expect(report).toContain('MRX1000-PILOT-001');
    // SearchAtlas-vs-Content-Genius distinction is explicit.
    expect(report).toContain('Content Genius');
    expect(report).toContain('no Content Genius `article_uuid`');
    // MRX1000-036 evidence-taxonomy & preservation-classification sections.
    expect(report).toContain('Preservation classification');
    expect(report).toContain('Evidence taxonomy');
    expect(report).toContain('incumbent_draft_nonpublic_held');
    expect(report).toContain('live_public_published_route');
    expect(report).toContain('pilot_draft_noindex_stage');
    expect(report).toContain('planning_only_inventory');
    expect(report).toContain(
      `${EXPECTED_PUBLIC_COUNT} + ${expectedHeldCount} + 25 + ${expectedPlanningCount} = 1,000`,
    );
    expect(report).toContain('SearchAtlas map evidence');
    expect(report).toContain('workflow_status_evidence_is_non_creation');
  });
});
