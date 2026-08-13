/**
 * tests/unit/mrx1000-readiness-matrix.spec.ts
 *
 * Vitest spec for scripts/build-mrx-1000-readiness-matrix.mjs.
 *
 * Proves:
 *   1. The generator produces exactly 1,000 rows.
 *   2. Aggregate counts equal the per-row totals (no double counting).
 *   3. No row is marked as publicly live, SearchAtlas-created, or LLM-verdicted
 *      unless an authoritative local artifact actually exists on disk; in the
 *      current snapshot that means the corresponding aggregate counts are 0.
 *   4. Hero-path collision groups are reported when the same hero path is
 *      referenced by multiple rows, and counts use UNIQUE row cardinality
 *      (not hero+social double-counted).
 *   5. Sitemap eligibility is gated on the fail-closed published state.
 *   6. Release / index authorization tracks checksum-bound owner decision
 *      D-2026-0804-16, which removes numerical and elapsed-time blockers while
 *      preserving article-specific quality gates.
 *   7. Output is byte-deterministic aside from the generated_at timestamp.
 *   8. SearchAtlas map evidence joins exactly the 25 pilot ledger rows.
 *   9. The 246 ledger-side title UUID planning handles are tracked separately
 *      from authoritative evidence and remain distinct from the 298 generic
 *      artifact UUID scan that doesn't match any ledger row.
 *  10. Content Genius created-article UUID evidence stays at 0 unless an
 *      authoritative local artifact names a row.
 *  11. Texas dynamic pillar route (/mineral-rights/texas/) is recognized via
 *      src/pages/mineral-rights/[state].astro + src/data/states.ts coverage.
 *  12. The 9 legacy rows plus all quality-cleared release rows are preserved as
 *      public_live_known_route in the current local sitemap.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadContentGeniusCanaryArtifactRecords,
  safeReaddir,
  selectCanonicalArticlesSitemap,
  validateContentGeniusCanaryArtifact,
} from '../../scripts/build-mrx-1000-readiness-matrix.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(HERE, '..', '..');
const SCRIPT = path.join(MRX_ROOT, 'scripts/build-mrx-1000-readiness-matrix.mjs');
const JSON_OUT = path.join(MRX_ROOT, 'reports/mrx-1000-readiness-matrix.json');
const SUMMARY_OUT = path.join(MRX_ROOT, 'reports/mrx-1000-readiness-summary.md');
const LEDGER = path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json');
const RELEASE_BATCH = JSON.parse(
  readFileSync(path.join(MRX_ROOT, 'config/mrx1000-release-10-batch.json'), 'utf8'),
) as { articles: Array<{ program_row_id: string }> };
const PUBLIC_ROUTE_COUNT = RELEASE_BATCH.articles.length + 9;
const READONLY_DIR = path.join(MRX_ROOT, 'tmp');
const CONTENT_GENIUS_EXPORT = path.join(
  MRX_ROOT,
  'reports/searchatlas-cg-reconciliation-t_0c427a87/content-genius-export-raw-by-status.json',
);
const CANONICAL_ARTICLES_SITEMAP_CANDIDATES = [
  path.join(MRX_ROOT, 'dist/client/sitemap-articles.xml'),
  path.join(MRX_ROOT, 'dist/sitemap-articles.xml'),
];
const STATES_FILE = path.join(MRX_ROOT, 'src/data/states.ts');
const STATE_ASTRO = path.join(MRX_ROOT, 'src/pages/mineral-rights/[state].astro');
const ROW1_PREFLIGHT = path.join(
  MRX_ROOT,
  'reports/mrx1000-pilot-001-preflight-2026-07-20T07-08-39-887Z.md',
);
const D10_EXTERNAL_PATH = path.join(
  MRX_ROOT,
  '..',
  'program-plans',
  'mrx-1000-ceo-decision-row2-canary-remediation.md',
);
const D10_EXPECTED_SHA256 = '4fd80d8f3316d06b5b8bd58d028d9c24b0fb4523c1cad0c58a9a2163dbbb6000';

const D11_EXTERNAL_PATH = path.join(
  MRX_ROOT,
  '..',
  'program-plans',
  'mrx-1000-ceo-decision-no-spend-capacity.md',
);
const D11_EXPECTED_SHA256 = '46a9d02548e97a794d1cdaa919682bb159bcfbeabb5b9d8e559431c6ca34091d';
const OWNER_DECISION_PATH = path.join(
  MRX_ROOT,
  'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
);
const OWNER_DECISION_EXPECTED_SHA256 =
  'edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f';

function runGenerator() {
  const r = spawnSync('node', [SCRIPT], { cwd: MRX_ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`generator exited ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  }
  return r;
}

function maskGeneratedAt(matrix: ReadinessMatrix): string {
  return JSON.stringify(matrix, (k, v) => (k === 'generated_at' ? '<masked>' : v));
}

interface ReadinessMatrix {
  generated_at: string;
  inputs: Record<string, unknown>;
  aggregate: Record<string, any>;
  hero_path_collision_groups: {
    path: string;
    unique_row_count: number;
    members: string[];
  }[];
  rows: any[];
  release_decision: any;
  searchatlas_evidence: any;
  policy: Record<string, unknown>;
}

describe('MRX1000 readiness matrix', () => {
  let matrix: ReadinessMatrix;

  beforeAll(() => {
    runGenerator();
    expect(existsSync(JSON_OUT)).toBe(true);
    expect(existsSync(SUMMARY_OUT)).toBe(true);
    matrix = JSON.parse(readFileSync(JSON_OUT, 'utf8')) as ReadinessMatrix;
  });

  it('treats absent optional directories as empty without hiding programming errors', () => {
    expect(safeReaddir(path.join(MRX_ROOT, 'reports/does-not-exist'))).toEqual([]);
    expect(safeReaddir(undefined)).toEqual([]);
    expect(() => safeReaddir('\0invalid-path')).toThrow();
  });

  it('prefers the active dist/client sitemap and retains a flat-adapter fallback', () => {
    const candidates = ['dist/client/sitemap-articles.xml', 'dist/sitemap-articles.xml'];
    expect(
      selectCanonicalArticlesSitemap(candidates, (candidate) =>
        String(candidate).includes('/client/'),
      ),
    ).toBe('dist/client/sitemap-articles.xml');
    expect(
      selectCanonicalArticlesSitemap(
        candidates,
        (candidate) => !String(candidate).includes('/client/'),
      ),
    ).toBe('dist/sitemap-articles.xml');
    expect(selectCanonicalArticlesSitemap(candidates, () => false)).toBeNull();
  });

  it('produces exactly 1,000 rows with unique program_row_id', () => {
    expect(matrix.aggregate.total_rows).toBe(1000);
    expect(matrix.rows.length).toBe(1000);
    const ids = matrix.rows.map((r) => r.program_row_id);
    expect(new Set(ids).size).toBe(1000);
    for (const id of ids) {
      expect(id).toMatch(/^MRX1000-\d{4}$/);
    }
  });

  it('aggregate counts equal the per-row totals', () => {
    const a = matrix.aggregate;
    expect(a.repo_mdx_present).toBe(matrix.rows.filter((r) => r.repo.mdx_exists).length);
    expect(a.repo_mdx_missing).toBe(matrix.rows.filter((r) => !r.repo.mdx_exists).length);
    expect(a.pillar_route_present).toBe(matrix.rows.filter((r) => r.pillar_route_exists).length);
    expect(a.pillar_route_missing).toBe(
      matrix.rows.filter((r) => r.pillar_route_exists === false).length,
    );
    expect(a.internal_link_triangle_complete).toBe(
      matrix.rows.filter((r) => r.internal_link_triangle.complete).length,
    );
    expect(a.internal_link_triangle_missing).toBe(
      matrix.rows.filter((r) => !r.internal_link_triangle.complete).length,
    );
    expect(a.conversion_cta_covered).toBe(
      matrix.rows.filter((r) => r.conversion_cta.covered).length,
    );
    expect(a.conversion_cta_missing).toBe(
      matrix.rows.filter((r) => !r.conversion_cta.covered).length,
    );
    expect(a.hero_src_on_disk).toBe(matrix.rows.filter((r) => r.hero.src_on_disk).length);
    expect(a.hero_src_missing).toBe(
      matrix.rows.filter((r) => r.hero.src && !r.hero.src_on_disk).length,
    );
    expect(a.hero_social_src_on_disk).toBe(
      matrix.rows.filter((r) => r.hero.social_src_on_disk).length,
    );
    expect(a.seo_aeo_all_covered).toBe(matrix.rows.filter((r) => r.seo_aeo.all_covered).length);
    expect(a.seo_aeo_partial_or_missing).toBe(
      matrix.rows.filter((r) => !r.seo_aeo.all_covered).length,
    );
    expect(a.llm_any_verdict_recorded).toBe(
      matrix.rows.filter((r) => r.llm_review.any_verdict_recorded).length,
    );
    expect(a.llm_no_verdict_recorded).toBe(
      matrix.rows.filter((r) => !r.llm_review.any_verdict_recorded).length,
    );
    expect(a.sitemap_eligible).toBe(matrix.rows.filter((r) => r.sitemap.eligible).length);
    expect(a.sitemap_ineligible).toBe(matrix.rows.filter((r) => !r.sitemap.eligible).length);
    expect(a.sitemap_currently_included).toBe(
      matrix.rows.filter((r) => r.sitemap.currently_included).length,
    );
    expect(a.public_live_known_route).toBe(
      matrix.rows.filter((r) => r.public_live_known_route).length,
    );
    expect(a.searchatlas_handle_present_in_authoritative_local_artifact).toBe(
      matrix.rows.filter((r) => r.searchatlas.map_handle_in_authoritative_local_artifact).length,
    );
    expect(a.searchatlas_title_uuid_present_in_authoritative_local_artifact).toBe(
      matrix.rows.filter((r) => r.searchatlas.title_uuid_in_authoritative_local_artifact).length,
    );
    expect(a.content_genius_article_uuid_present_in_authoritative_local_artifact).toBe(
      matrix.rows.filter(
        (r) => r.searchatlas.content_genius_article_uuid_in_authoritative_local_artifact,
      ).length,
    );
    expect(a.ledger_searchatlas_title_uuid_planning_handle_count).toBe(
      matrix.rows.filter((r) => r.searchatlas.ledger_has_searchatlas_title_uuid).length,
    );
    expect(a.ledger_content_genius_article_uuid_count).toBe(
      matrix.rows.filter((r) => r.searchatlas.ledger_has_content_genius_article_uuid).length,
    );
    const byPillarSum = Object.values(a.by_pillar as Record<string, number>).reduce(
      (s, v) => s + v,
      0,
    );
    expect(byPillarSum).toBe(1000);
    const byClusterSum = Object.values(a.by_cluster as Record<string, number>).reduce(
      (s, v) => s + v,
      0,
    );
    expect(byClusterSum).toBe(1000);
    expect(a.by_source && typeof a.by_source === 'object').toBe(true);
  });

  it('never claims a row is publicly live or SearchAtlas-created in the current snapshot', () => {
    expect((matrix.aggregate as any).public_live_claim_count).toBe(0);
    expect((matrix.aggregate as any).searchatlas_created_claim_count).toBe(0);
    for (const row of matrix.rows) {
      // No row carries a 'public_live' or 'searchatlas_created' field at all.
      expect((row as any).public_live).toBeUndefined();
      expect((row as any).searchatlas_created).toBeUndefined();
    }
  });

  it('reports the actual SearchAtlas/LLM evidence picture from the repo', () => {
    for (const row of matrix.rows) {
      if (row.searchatlas.map_handle_in_authoritative_local_artifact) {
        expect(typeof row.searchatlas.map_handle_in_authoritative_local_artifact).toBe('boolean');
      }
      if (row.searchatlas.title_uuid_in_authoritative_local_artifact) {
        expect(typeof row.searchatlas.title_uuid_in_authoritative_local_artifact).toBe('boolean');
      }
      if (row.llm_review.chatgpt) {
        expect(row.llm_review.chatgpt.verdict).toMatch(/^(PASS|FAIL|HOLD)$/);
        expect(row.llm_review.chatgpt.source).toMatch(/^reports\/llm-aeo-evals\//);
      }
      if (row.llm_review.claude_opus_4_6) {
        expect(row.llm_review.claude_opus_4_6.verdict).toMatch(/^(PASS|FAIL|HOLD)$/);
      }
    }
  });

  it('joins exactly 25 pilot ledger rows to the 7 readonly-current map IDs', () => {
    // Independently compute the join from raw inputs.
    const readonlyMapIds = new Set<number>();
    for (const f of readdirSync(READONLY_DIR)) {
      if (!/mrx1000-f9-/.test(f) || !f.endsWith('.json')) continue;
      const t = readFileSync(path.join(READONLY_DIR, f), 'utf8');
      for (const m of t.matchAll(/"map_id":\s*(\d+)/g)) readonlyMapIds.add(Number(m[1]));
    }
    expect(matrix.aggregate.readonly_distinct_map_ids).toBe(readonlyMapIds.size);
    expect(readonlyMapIds.size).toBe(7);

    const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
    const joined = ledger.articles.filter(
      (r: any) => r.searchatlas_map_id != null && readonlyMapIds.has(r.searchatlas_map_id),
    );
    expect(joined.length).toBe(25);
    expect(matrix.aggregate.searchatlas_handle_present_in_authoritative_local_artifact).toBe(25);

    const joinedIds = new Set(joined.map((r: any) => r.program_row_id));
    const matrixJoinedIds = new Set(
      matrix.rows
        .filter((r) => r.searchatlas.map_handle_in_authoritative_local_artifact)
        .map((r) => r.program_row_id),
    );
    expect([...matrixJoinedIds].sort()).toEqual([...joinedIds].sort());
  });

  it('tracks 246 ledger title UUID planning handles separately from authoritative evidence', () => {
    const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
    const ledgerTitleUuids = new Set<string>();
    for (const r of ledger.articles) {
      if (r.searchatlas_title_uuid) ledgerTitleUuids.add(String(r.searchatlas_title_uuid));
    }
    expect(ledgerTitleUuids.size).toBe(246);
    expect(matrix.aggregate.ledger_searchatlas_title_uuid_planning_handle_count).toBe(246);
    // Authoritative evidence still requires the title UUID to actually appear
    // in a current readonly artifact. None of the 246 ledger UUIDs match any
    // readonly UUID in the current snapshot.
    expect(matrix.aggregate.searchatlas_title_uuid_present_in_authoritative_local_artifact).toBe(0);

    const readonlyUuids = new Set<string>();
    for (const f of readdirSync(READONLY_DIR)) {
      if (!/mrx1000-f9-/.test(f) || !f.endsWith('.json')) continue;
      const t = readFileSync(path.join(READONLY_DIR, f), 'utf8');
      for (const m of t.matchAll(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      )) {
        readonlyUuids.add(m[0].toLowerCase());
      }
    }
    expect(matrix.aggregate.artifact_distinct_generic_uuid_count).toBe(readonlyUuids.size);
    let join = 0;
    for (const u of ledgerTitleUuids) {
      if (readonlyUuids.has(u.toLowerCase())) join++;
    }
    expect(join).toBe(0);
  });

  it('Content Genius created-article UUID evidence stays at 0 without authoritative source', () => {
    expect(
      matrix.aggregate.content_genius_article_uuid_present_in_authoritative_local_artifact,
    ).toBe(0);
    expect(matrix.aggregate.ledger_content_genius_article_uuid_count).toBe(0);
  });

  it('sitemap eligibility tracks fail-closed published state', () => {
    for (const row of matrix.rows) {
      if (row.sitemap.eligible) {
        expect(row.publication_status).toBe('published');
        expect(row.draft === undefined || row.draft !== true).toBe(true);
        expect(row.noindex === undefined || row.noindex !== true).toBe(true);
        expect(row.pillar_route_exists).toBe(true);
      }
    }
  });

  it('preserves the legacy and quality-cleared routes as public_live_known_route', () => {
    const liveRoutes = matrix.rows.filter((r) => r.public_live_known_route);
    expect(liveRoutes.length).toBe(PUBLIC_ROUTE_COUNT);
    for (const row of liveRoutes) {
      expect(row.publication_status).toBe('published');
      expect(row.sitemap.currently_included).toBe(true);
      expect(row.sitemap.public_url).toMatch(/^https:\/\/mineralrightsxchange\.com\/blog\//);
    }
    expect(matrix.aggregate.public_live_claim_count).toBe(0);
  });

  it('release / index authorization follows owner decision D-2026-0804-16', () => {
    expect(matrix.release_decision).not.toBeNull();
    expect(matrix.release_decision.decision_id).toBe('D-2026-0804-16');
    expect(matrix.release_decision.signed).toBe(true);
    expect(matrix.release_decision.disposition).toBe(
      'APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION',
    );
    expect(matrix.release_decision.authorization_cap_new_mrx1000_rows).toBeNull();
    expect(matrix.release_decision.numerical_release_cap_applies).toBe(false);
    expect(matrix.release_decision.elapsed_time_gate_applies).toBe(false);
    expect(matrix.release_decision.release_authorized).toBe(true);
    expect(matrix.release_decision.index_authorized).toBe(true);
    expect(matrix.release_decision.signed_artifact_sha256).toBe(OWNER_DECISION_EXPECTED_SHA256);
    expect(matrix.release_decision.signed_artifact_sha256_verified).toBe(true);
    for (const row of matrix.rows) {
      expect(row.release_index.release_authorized).toBe(true);
      expect(row.release_index.index_authorized).toBe(true);
      expect(row.release_index.decision_id).toBe('D-2026-0804-16');
      expect(row.release_index.authorization_cap_new_mrx1000_rows).toBeNull();
      expect(row.release_index.numerical_release_cap_applies).toBe(false);
      expect(row.release_index.elapsed_time_gate_applies).toBe(false);
    }
    expect(matrix.aggregate.release_authorized).toBe(1000);
    expect(matrix.aggregate.index_authorized).toBe(1000);
  });

  it('records the signed D11 vendor inventory snapshot without treating it as public live or authorization', () => {
    const snapshot = matrix.searchatlas_evidence.vendor_inventory_snapshot;
    expect(snapshot).toBeDefined();
    expect(snapshot.total).toBe(299);
    expect(snapshot.by_status).toEqual({ NEEDS_REVIEW: 200, COMPLETED: 70, NOT_BEGUN: 29 });
    expect(snapshot.public_inventory_claimed).toBe(false);
    expect(snapshot.release_authorization_claimed).toBe(false);
    expect(matrix.release_decision.vendor_inventory_snapshot).toEqual(snapshot);
  });

  it('parses the canonical article sitemap only for current article inclusion', () => {
    const selected = selectCanonicalArticlesSitemap(CANONICAL_ARTICLES_SITEMAP_CANDIDATES);
    expect(selected).not.toBeNull();
    expect(matrix.inputs.sitemap_xml_files_indexed).toEqual([
      path.relative(MRX_ROOT, selected as string),
    ]);
    const sitemap = readFileSync(selected as string, 'utf8').toLowerCase();
    for (const row of matrix.rows.filter((r) => r.sitemap.currently_included)) {
      expect(sitemap).toContain(row.sitemap.public_url.toLowerCase().replace(/\/$/, ''));
    }
    expect(matrix.aggregate.sitemap_currently_included).toBe(PUBLIC_ROUTE_COUNT);
  });

  it('separates Content Genius exact-title records from ledger-created UUID evidence', () => {
    expect(existsSync(CONTENT_GENIUS_EXPORT)).toBe(true);
    const cg = JSON.parse(readFileSync(CONTENT_GENIUS_EXPORT, 'utf8'));
    expect(matrix.searchatlas_evidence.content_genius_export.source).toBe(
      'reports/searchatlas-cg-reconciliation-t_0c427a87/content-genius-export-raw-by-status.json',
    );
    expect(matrix.searchatlas_evidence.content_genius_export.list_item_count).toBe(
      cg.list_item_count,
    );
    expect(matrix.searchatlas_evidence.content_genius_export.detail_found_count).toBe(
      cg.detail_found_count,
    );
    expect(matrix.searchatlas_evidence.content_genius_export.summary_by_status).toEqual({
      COMPLETED: 70,
      NEEDS_REVIEW: 198,
      NOT_BEGUN: 29,
      IN_PROGRESS: 0,
      AI_IN_PROGRESS: 0,
      ARCHIVED: 0,
      FAILED: 0,
    });
    expect(matrix.aggregate.content_genius_exact_title_match_rows).toBe(153);
    expect(matrix.aggregate.content_genius_exact_title_unambiguous_rows).toBe(147);
    expect(matrix.aggregate.content_genius_exact_title_ambiguous_rows).toBe(6);
    expect(matrix.aggregate.content_genius_exact_title_total_records).toBe(160);
    expect(matrix.aggregate.ledger_content_genius_article_uuid_count).toBe(0);

    const row1 = matrix.rows.find(
      (r) => r.title === 'Mineral Rights Offers Explained for Inherited Properties',
    );
    const row2 = matrix.rows.find(
      (r) => r.title === 'Inherited Mineral Rights Buyers Compared: What to Look For',
    );
    expect(row1.program_row_id).toBe('MRX1000-0439');
    expect(row2.program_row_id).toBe('MRX1000-0438');
    expect(row1.searchatlas.content_genius_exact_title_records.unambiguous).toBe(true);
    expect(row1.searchatlas.content_genius_exact_title_records.uuids).toEqual([
      '0f41794e-2ef4-4de5-b228-589dd2c0f0f7',
    ]);
    expect(row1.searchatlas.content_genius_exact_title_records.statuses).toEqual(['NEEDS_REVIEW']);
    expect(row1.searchatlas.content_genius_exact_title_records.records[0]).toMatchObject({
      uuid: '0f41794e-2ef4-4de5-b228-589dd2c0f0f7',
      status: 'NEEDS_REVIEW',
      provenance: 'row1_preflight_snapshot',
      pilot_article_id: 'MRX1000-PILOT-001-01',
      source: 'reports/mrx1000-pilot-001-preflight-2026-07-20T07-08-39-887Z.md',
    });
    expect(row2.searchatlas.content_genius_exact_title_records.unambiguous).toBe(true);
    expect(row2.searchatlas.content_genius_exact_title_records.uuids).toEqual([
      '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c',
    ]);
    expect(row2.searchatlas.content_genius_exact_title_records.statuses).toEqual(['NEEDS_REVIEW']);
    expect(row2.searchatlas.content_genius_exact_title_records.records[0]).toMatchObject({
      uuid: '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c',
      status: 'NEEDS_REVIEW',
      provenance: 'signed_d10_row2_canary',
      pilot_article_id: 'MRX1000-PILOT-001-02',
      source: '../program-plans/mrx-1000-ceo-decision-row2-canary-remediation.md',
    });
    expect(matrix.searchatlas_evidence.content_genius_export.artifact_canary_records).toHaveLength(
      2,
    );
  });

  it('loads canary records only after validating the actual source artifacts', () => {
    expect(existsSync(ROW1_PREFLIGHT)).toBe(true);
    expect(existsSync(D10_EXTERNAL_PATH)).toBe(true);
    const records = loadContentGeniusCanaryArtifactRecords();
    expect(records).toHaveLength(2);
    expect(records.every((record) => record.source_fields_verified === true)).toBe(true);
    const row2 = records.find((record) => record.pilot_article_id === 'MRX1000-PILOT-001-02');
    expect(row2?.source_sha256).toBe(D10_EXPECTED_SHA256);
    expect(row2?.source_sha256_verified).toBe(true);

    const row1Text = readFileSync(ROW1_PREFLIGHT);
    expect(
      validateContentGeniusCanaryArtifact(
        {
          path: ROW1_PREFLIGHT,
          pilot_article_id: 'MRX1000-PILOT-001-01',
          title: 'a title absent from the source',
          uuid: '0f41794e-2ef4-4de5-b228-589dd2c0f0f7',
          status: 'NEEDS_REVIEW',
          source: 'synthetic',
          provenance: 'synthetic',
        },
        row1Text,
      ),
    ).toBeNull();
    expect(
      validateContentGeniusCanaryArtifact({
        path: D10_EXTERNAL_PATH,
        pilot_article_id: 'MRX1000-PILOT-001-02',
        title: 'Inherited Mineral Rights Buyers Compared: What to Look For',
        uuid: '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c',
        status: 'NEEDS_REVIEW',
        source: 'synthetic',
        provenance: 'synthetic',
        expectedSha256: '0'.repeat(64),
      }),
    ).toBeNull();
    expect(
      validateContentGeniusCanaryArtifact({
        path: path.join(MRX_ROOT, 'reports/does-not-exist.md'),
        pilot_article_id: 'missing',
        title: 'missing',
        uuid: 'missing',
        status: 'NEEDS_REVIEW',
        source: 'synthetic',
        provenance: 'synthetic',
      }),
    ).toBeNull();
  });

  it('honors the outside-workspace D-2026-0720-11 only when its SHA-256 matches the recorded fingerprint', () => {
    // D11 remains historical vendor-inventory evidence, not release authority.
    expect(existsSync(D11_EXTERNAL_PATH)).toBe(true);
    const sha = createHash('sha256').update(readFileSync(D11_EXTERNAL_PATH)).digest('hex');
    expect(sha).toBe(D11_EXPECTED_SHA256);
  });

  it('Texas dynamic pillar route resolves via src/pages/mineral-rights/[state].astro', () => {
    expect(existsSync(STATE_ASTRO)).toBe(true);
    expect(existsSync(STATES_FILE)).toBe(true);
    const tx = matrix.rows.filter((r) => r.pillar === 'texas-mineral-rights');
    expect(tx.length).toBeGreaterThan(0);
    for (const row of tx) {
      expect(row.pillar_route_exists).toBe(true);
    }
    expect(matrix.aggregate.pillar_route_present).toBe(1000);
    expect(matrix.aggregate.pillar_route_missing).toBe(0);
  });

  it('hero-path collision groups use UNIQUE row cardinality (not hero+social double-counted)', () => {
    // Independent recomputation using the same rule as the generator: a row
    // counts once per unique path, regardless of whether it appears as
    // hero.src or hero.social_src.
    const collisions = new Map<string, Set<string>>();
    for (const row of matrix.rows) {
      for (const p of [row.hero.src, row.hero.social_src]) {
        if (!p) continue;
        if (!collisions.has(p)) collisions.set(p, new Set());
        collisions.get(p)!.add(row.program_row_id);
      }
    }
    const expected = [...collisions.entries()].filter(([, s]) => s.size > 1);
    expect(matrix.hero_path_collision_groups.length).toBe(expected.length);
    for (const g of matrix.hero_path_collision_groups) {
      const set = collisions.get(g.path)!;
      expect(g.unique_row_count).toBe(set.size);
      expect([...g.members].sort()).toEqual([...set].sort());
    }
    // The pilot rows share exactly one unique hero path with exactly 25 unique
    // ledger rows; no other path appears on more than one row.
    const sharedAsset = '/assets/brand/mrx-underwriter-review-og.png';
    const sharedGroup = matrix.hero_path_collision_groups.find((g) => g.path === sharedAsset);
    expect(sharedGroup).toBeDefined();
    expect(sharedGroup!.unique_row_count).toBe(25);
    expect(sharedGroup!.members.length).toBe(25);
  });

  it('summary markdown is non-empty and references the policy posture', () => {
    const summary = readFileSync(SUMMARY_OUT, 'utf8');
    expect(summary.length).toBeGreaterThan(200);
    expect(summary).toContain('# MRX1000 readiness matrix');
    expect(summary).toContain('authoritative_local_artifact_only');
    expect(summary).toContain('no inference');
    expect(summary).toContain('D-2026-0804-16');
    expect(summary).toContain('APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION');
    expect(summary).toContain('numerical_cap=false');
    expect(summary).toContain('public_live_known_route');
  });

  it('generated output is deterministic aside from generated_at', () => {
    const before = maskGeneratedAt(matrix);
    const beforeHash = createHash('sha256').update(before).digest('hex');
    // Run the generator a second time and compare.
    runGenerator();
    const second = JSON.parse(readFileSync(JSON_OUT, 'utf8')) as ReadinessMatrix;
    const after = maskGeneratedAt(second);
    const afterHash = createHash('sha256').update(after).digest('hex');
    expect(afterHash).toBe(beforeHash);
  });

  it('fails closed on a malformed ledger', () => {
    // We do not mutate the real ledger; we just confirm the invariant via the
    // existence/parse of the file and the 1,000-row total asserted above.
    const ledgerRaw = readFileSync(LEDGER, 'utf8');
    const ledger = JSON.parse(ledgerRaw);
    expect(Array.isArray(ledger.articles)).toBe(true);
    expect(ledger.articles.length).toBe(1000);
    const ids = ledger.articles.map((a: any) => a.program_row_id);
    expect(new Set(ids).size).toBe(1000);
  });

  it('output files are on disk with non-zero size', () => {
    for (const f of [JSON_OUT, SUMMARY_OUT]) {
      expect(existsSync(f)).toBe(true);
      expect(statSync(f).size).toBeGreaterThan(0);
    }
  });
});

describe('MRX1000 readiness matrix — load-bearing fact regressions', () => {
  let matrix: ReadinessMatrix;
  let readonlyMapIds: Set<number>;
  let readonlyUuids: Set<string>;

  beforeAll(() => {
    runGenerator();
    matrix = JSON.parse(readFileSync(JSON_OUT, 'utf8')) as ReadinessMatrix;
    readonlyMapIds = new Set<number>();
    readonlyUuids = new Set<string>();
    for (const f of readdirSync(READONLY_DIR)) {
      if (!/mrx1000-f9-/.test(f) || !f.endsWith('.json')) continue;
      const t = readFileSync(path.join(READONLY_DIR, f), 'utf8');
      for (const m of t.matchAll(/"map_id":\s*(\d+)/g)) readonlyMapIds.add(Number(m[1]));
      for (const m of t.matchAll(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      )) {
        readonlyUuids.add(m[0].toLowerCase());
      }
    }
  });

  it('D-2026-0804-16 is the release decision with the recorded path, SHA-256, and signed=true', () => {
    expect(existsSync(OWNER_DECISION_PATH)).toBe(true);
    expect(createHash('sha256').update(readFileSync(OWNER_DECISION_PATH)).digest('hex')).toBe(
      OWNER_DECISION_EXPECTED_SHA256,
    );
    expect(matrix.release_decision).toBeTruthy();
    expect(matrix.release_decision.decision_id).toBe('D-2026-0804-16');
    expect(matrix.release_decision.signed_artifact).toBe(
      'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
    );
    expect(matrix.release_decision.signed_artifact_sha256).toBe(OWNER_DECISION_EXPECTED_SHA256);
    expect(matrix.release_decision.signed_artifact_sha256_verified).toBe(true);
  });

  it('release disposition removes numerical and elapsed-time blockers', () => {
    expect(matrix.release_decision.disposition).toBe(
      'APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION',
    );
    expect(matrix.release_decision.authorization_cap_new_mrx1000_rows).toBeNull();
    expect(matrix.release_decision.numerical_release_cap_applies).toBe(false);
    expect(matrix.release_decision.elapsed_time_gate_applies).toBe(false);
    expect(matrix.release_decision.release_authorized).toBe(true);
    expect(matrix.release_decision.index_authorized).toBe(true);
    for (const row of matrix.rows) {
      expect(row.release_index.authorization_cap_new_mrx1000_rows).toBeNull();
      expect(row.release_index.numerical_release_cap_applies).toBe(false);
      expect(row.release_index.elapsed_time_gate_applies).toBe(false);
      expect(row.release_index.release_authorized).toBe(true);
      expect(row.release_index.index_authorized).toBe(true);
    }
    expect(matrix.aggregate.release_authorized).toBe(1000);
    expect(matrix.aggregate.index_authorized).toBe(1000);
  });

  it('safeReaddir distinguishes an absent optional directory (returns []) from a present one (returns entries), and propagates non-ENOENT errors', () => {
    // absent optional directory returns [] via the try/catch ENOENT branch
    expect(safeReaddir(path.join(MRX_ROOT, 'reports/does-not-exist'))).toEqual([]);
    expect(safeReaddir('/path/that/does/not/exist/anywhere')).toEqual([]);
    // undefined dir returns [] via the !dir guard (different code path)
    expect(safeReaddir(undefined)).toEqual([]);
    expect(safeReaddir(null as unknown as string)).toEqual([]);
    // present directory returns a non-empty list
    const pagesEntries = safeReaddir(path.join(MRX_ROOT, 'src/pages'));
    expect(Array.isArray(pagesEntries)).toBe(true);
    expect(pagesEntries.length).toBeGreaterThan(0);
    expect(pagesEntries.some((d: any) => d.name === 'index.astro')).toBe(true);
    // Distinguishability: absent vs present produce different outcomes.
    expect(safeReaddir(path.join(MRX_ROOT, 'reports/does-not-exist')).length).toBe(0);
    expect(safeReaddir(path.join(MRX_ROOT, 'src/pages')).length).toBeGreaterThan(0);
    // Non-ENOENT errors (including the TypeError that would arise if
    // readdirSync were undefined at call time) must propagate, not be
    // masked as []. A null-byte path produces ERR_INVALID_ARG_VALUE,
    // exercising the re-throw branch.
    expect(() => safeReaddir('\0invalid-path')).toThrow();
    let caught: unknown = null;
    try {
      safeReaddir('\0invalid-path');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as NodeJS.ErrnoException).code).not.toBe('ENOENT');
  });

  it('all 9 pillar URLs (including the [state].astro dynamic route) resolve to discoverable Astro sources', () => {
    const pillarUrls = [
      '/sell-mineral-rights/',
      '/mineral-rights-value/',
      '/offer-review/',
      '/inherited-mineral-rights/',
      '/learning-center/oil-and-gas-royalties/',
      '/learning-center/mineral-rights-taxes/',
      '/mineral-rights/texas/',
      '/learning-center/title-lease-ownership/',
      '/methodology/',
    ];
    const expectedAstroByUrl: Record<string, string> = {
      '/sell-mineral-rights/': 'src/pages/sell-mineral-rights.astro',
      '/mineral-rights-value/': 'src/pages/mineral-rights-value.astro',
      '/offer-review/': 'src/pages/offer-review.astro',
      '/inherited-mineral-rights/': 'src/pages/inherited-mineral-rights.astro',
      '/learning-center/oil-and-gas-royalties/':
        'src/pages/learning-center/oil-and-gas-royalties/index.astro',
      '/learning-center/mineral-rights-taxes/':
        'src/pages/learning-center/mineral-rights-taxes/index.astro',
      '/mineral-rights/texas/': 'src/pages/mineral-rights/[state].astro',
      '/learning-center/title-lease-ownership/':
        'src/pages/learning-center/title-lease-ownership/index.astro',
      '/methodology/': 'src/pages/methodology.astro',
    };
    for (const url of pillarUrls) {
      expect(existsSync(path.join(MRX_ROOT, expectedAstroByUrl[url]))).toBe(true);
    }
    // Every row points at one of the 9 pillar URLs and pillar_route_exists=true
    const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
    const ledgerPillars = new Set(ledger.articles.map((a: any) => a.pillar_url));
    expect(new Set(pillarUrls)).toEqual(ledgerPillars);
    // Texas dynamic route: states.ts contains 'texas'
    expect(readFileSync(STATES_FILE, 'utf8').toLowerCase()).toContain('texas');
    for (const row of matrix.rows.filter((r) => r.pillar === 'texas-mineral-rights')) {
      expect(row.pillar_route_exists).toBe(true);
    }
    expect(matrix.aggregate.pillar_route_present).toBe(1000);
    expect(matrix.aggregate.pillar_route_missing).toBe(0);
  });

  it('legacy and quality-cleared release rows are eligible in the current local sitemap', () => {
    const live = matrix.rows.filter((r) => r.public_live_known_route);
    expect(live.length).toBe(PUBLIC_ROUTE_COUNT);
    const legacyIds = [
      'MRX1000-0151',
      'MRX1000-0154',
      'MRX1000-0165',
      'MRX1000-0166',
      'MRX1000-0302',
      'MRX1000-0636',
      'MRX1000-0641',
      'MRX1000-0877',
      'MRX1000-0882',
    ];
    const expectedIds = [
      ...legacyIds,
      ...RELEASE_BATCH.articles.map(({ program_row_id }) => program_row_id),
    ];
    expect(live.map((r) => r.program_row_id).sort()).toEqual([...expectedIds].sort());
    for (const row of live) {
      expect(row.publication_status).toBe('published');
      // draft/noindex omitted in frontmatter → null, which is NOT explicitly true.
      expect(row.draft !== true).toBe(true);
      expect(row.noindex !== true).toBe(true);
      expect(row.sitemap.eligible).toBe(true);
      expect(row.sitemap.currently_included).toBe(true);
    }
    // Eligibility rule holds for the whole matrix.
    for (const row of matrix.rows) {
      const eligible = row.sitemap.eligible;
      const draftExplicit = row.draft === true;
      const noindexExplicit = row.noindex === true;
      expect(eligible).toBe(
        row.publication_status === 'published' &&
          !draftExplicit &&
          !noindexExplicit &&
          row.pillar_route_exists,
      );
    }
  });

  it('sitemap inclusion is parsed from one selected adapter output and matches local live rows', () => {
    const selected = selectCanonicalArticlesSitemap(CANONICAL_ARTICLES_SITEMAP_CANDIDATES);
    expect(selected).not.toBeNull();
    expect(matrix.inputs.sitemap_xml_files_indexed).toEqual([
      path.relative(MRX_ROOT, selected as string),
    ]);
    const sitemap = readFileSync(selected as string, 'utf8');
    const sitemapLower = sitemap.toLowerCase();
    expect(matrix.aggregate.sitemap_currently_included).toBe(PUBLIC_ROUTE_COUNT);
    for (const row of matrix.rows.filter((r) => r.sitemap.currently_included)) {
      expect(sitemapLower).toContain(row.sitemap.public_url.toLowerCase().replace(/\/$/, ''));
    }
  });

  it('public article-route counts are independent of release authorization', () => {
    // public_live_known_route comes from dist sitemap only; release_authorized
    // comes from D-2026-0804-16. They remain distinct measurements.
    const live = matrix.rows.filter((r) => r.public_live_known_route);
    const released = matrix.rows.filter((r) => r.release_index.release_authorized);
    const indexed = matrix.rows.filter((r) => r.release_index.index_authorized);
    expect(live.length).toBe(PUBLIC_ROUTE_COUNT);
    expect(released.length).toBe(1000);
    expect(indexed.length).toBe(1000);
    expect(matrix.aggregate.public_live_known_route).toBe(PUBLIC_ROUTE_COUNT);
    expect(matrix.aggregate.release_authorized).toBe(1000);
    expect(matrix.aggregate.index_authorized).toBe(1000);
    for (const row of live) {
      expect(row.release_index.release_authorized).toBe(true);
    }
  });

  it('SearchAtlas inventory 299 = 200 NEEDS_REVIEW + 70 COMPLETED + 29 NOT_BEGUN, sourced only from signed D11', () => {
    const snapshot = matrix.searchatlas_evidence.vendor_inventory_snapshot;
    expect(snapshot).not.toBeNull();
    expect(snapshot.total).toBe(299);
    expect(snapshot.by_status.NEEDS_REVIEW).toBe(200);
    expect(snapshot.by_status.COMPLETED).toBe(70);
    expect(snapshot.by_status.NOT_BEGUN).toBe(29);
    expect(snapshot.public_inventory_claimed).toBe(false);
    expect(snapshot.release_authorization_claimed).toBe(false);
    expect(snapshot.source).toBe('historical_signed_d11_capacity_baseline_not_release_authority');
    // Independent read of the signed artifact
    const d11Text = readFileSync(D11_EXTERNAL_PATH, 'utf8');
    const d11Sha = createHash('sha256').update(d11Text).digest('hex');
    expect(d11Sha).toBe(D11_EXPECTED_SHA256);
  });

  it('246 topical-map planning handles report map IDs and do not claim article-created proof', () => {
    const evidence = matrix.searchatlas_evidence.topical_map_planning_handles;
    expect(evidence.ledger_searchatlas_title_uuid_planning_handle_count).toBe(246);
    expect(evidence.ledger_searchatlas_map_id_planning_handle_count).toBeGreaterThan(0);
    expect(evidence.readonly_distinct_map_ids).toBe(readonlyMapIds.size);
    expect(evidence.article_created_proof_claimed).toBe(false);
    expect(Array.isArray(evidence.map_ids)).toBe(true);
    expect(evidence.map_ids.length).toBe(readonlyMapIds.size);
    // Sanity: every ledger map_id that joins a readonly artifact is among the reported map_ids.
    const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
    const ledgerJoinedMapIds = new Set(
      ledger.articles
        .filter(
          (a: any) => a.searchatlas_map_id != null && readonlyMapIds.has(a.searchatlas_map_id),
        )
        .map((a: any) => a.searchatlas_map_id),
    );
    expect(new Set(evidence.map_ids)).toEqual(ledgerJoinedMapIds);
    // And the joined row count is 25.
    const joinedRows = matrix.rows.filter(
      (r) => r.searchatlas.map_handle_in_authoritative_local_artifact,
    );
    expect(joinedRows.length).toBe(25);
  });

  it('Content Genius exact-title emits UUID/status arrays, ambiguity counts, and row1/row2 canary records', () => {
    const cg = matrix.searchatlas_evidence.content_genius_export;
    expect(cg.list_item_count).toBeGreaterThan(0);
    expect(cg.detail_found_count).toBeGreaterThan(0);
    expect(matrix.aggregate.content_genius_exact_title_match_rows).toBe(153);
    expect(matrix.aggregate.content_genius_exact_title_unambiguous_rows).toBe(147);
    expect(matrix.aggregate.content_genius_exact_title_ambiguous_rows).toBe(6);
    expect(matrix.aggregate.content_genius_exact_title_total_records).toBe(160);

    const row1 = matrix.rows.find(
      (r) => r.title === 'Mineral Rights Offers Explained for Inherited Properties',
    );
    const row2 = matrix.rows.find(
      (r) => r.title === 'Inherited Mineral Rights Buyers Compared: What to Look For',
    );
    expect(row1).toBeTruthy();
    expect(row2).toBeTruthy();
    expect(row1!.program_row_id).toBe('MRX1000-0439');
    expect(row2!.program_row_id).toBe('MRX1000-0438');

    // Every exact-title record carries a non-empty uuid and status array.
    for (const row of matrix.rows) {
      const recs = row.searchatlas.content_genius_exact_title_records;
      if (recs.match_count === 0) continue;
      expect(Array.isArray(recs.uuids)).toBe(true);
      expect(recs.uuids.length).toBe(recs.match_count);
      expect(recs.uuids.every((u: string) => typeof u === 'string' && u.length > 0)).toBe(true);
      expect(Array.isArray(recs.statuses)).toBe(true);
      expect(recs.statuses.length).toBeGreaterThan(0);
      expect(recs.records.length).toBe(recs.match_count);
      expect(recs.ambiguous).toBe(recs.match_count > 1);
      expect(recs.unambiguous).toBe(recs.match_count === 1);
    }

    // row1 canary: 1 record, uuid + status array, unambiguous
    const r1 = row1!.searchatlas.content_genius_exact_title_records;
    expect(r1.match_count).toBe(1);
    expect(r1.unambiguous).toBe(true);
    expect(r1.ambiguous).toBe(false);
    expect(r1.uuids).toEqual(['0f41794e-2ef4-4de5-b228-589dd2c0f0f7']);
    expect(r1.statuses).toEqual(['NEEDS_REVIEW']);

    // row2 canary: 1 record, uuid + status array, unambiguous
    const r2 = row2!.searchatlas.content_genius_exact_title_records;
    expect(r2.match_count).toBe(1);
    expect(r2.unambiguous).toBe(true);
    expect(r2.ambiguous).toBe(false);
    expect(r2.uuids).toEqual(['6cfc4a3f-e793-4d20-9a74-a9966c25ee8c']);
    expect(r2.statuses).toEqual(['NEEDS_REVIEW']);
  });

  it('zero persisted ledger content_genius_article_uuid values across the matrix', () => {
    let persisted = 0;
    const persistedIds: string[] = [];
    for (const row of matrix.rows) {
      if (row.searchatlas.ledger_has_content_genius_article_uuid) {
        persisted++;
        persistedIds.push(row.program_row_id);
      }
    }
    expect(persisted).toBe(0);
    expect(persistedIds).toEqual([]);
    expect(matrix.aggregate.ledger_content_genius_article_uuid_count).toBe(0);
    expect(
      matrix.aggregate.content_genius_article_uuid_present_in_authoritative_local_artifact,
    ).toBe(0);
  });

  it('exactly 1,000 unique matrix rows with no duplicate program_row_id or canonical_slug', () => {
    expect(matrix.aggregate.total_rows).toBe(1000);
    expect(matrix.rows.length).toBe(1000);
    const ids = new Set(matrix.rows.map((r) => r.program_row_id));
    const slugs = new Set(matrix.rows.map((r) => r.slug));
    expect(ids.size).toBe(1000);
    expect(slugs.size).toBe(1000);
  });

  it('no vendor-dashboard-to-public-live conflation and no per-row LLM verdict claims', () => {
    // The vendor inventory is not allowed to imply public liveness or release auth.
    const snapshot = matrix.searchatlas_evidence.vendor_inventory_snapshot;
    expect(snapshot.public_inventory_claimed).toBe(false);
    expect(snapshot.release_authorization_claimed).toBe(false);
    expect(matrix.aggregate.public_live_claim_count).toBe(0);
    expect(matrix.aggregate.searchatlas_created_claim_count).toBe(0);
    // LLM: a row only reports a verdict when a local capture file names it.
    // In the current snapshot no row has any verdict recorded.
    expect(matrix.aggregate.llm_any_verdict_recorded).toBe(0);
    for (const row of matrix.rows) {
      expect(row.llm_review.any_verdict_recorded).toBe(false);
      for (const key of ['chatgpt', 'gemini', 'claude_opus_4_6', 'perplexity'] as const) {
        expect(row.llm_review[key]).toBeNull();
      }
      expect(Array.isArray(row.llm_review.other)).toBe(true);
      expect(row.llm_review.other.length).toBe(0);
    }
  });
});
