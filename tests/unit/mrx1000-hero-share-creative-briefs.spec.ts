/**
 * Deterministic and fail-closed coverage for the local-only MRX 1,000-row
 * hero/share creative-brief plan. This spec never creates an image or edits an
 * article. It proves that the generator only refreshes its three sidecars.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parsePostFrontmatter } from './helpers/post-frontmatter';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(HERE, '..', '..');
const WORKSPACE_ROOT = path.resolve(MRX_ROOT, '..');
const SCRIPT = path.join(MRX_ROOT, 'scripts/build-mrx-1000-hero-share-creative-briefs.mjs');
const JSON_OUT = path.join(MRX_ROOT, 'config/mrx-1000-hero-share-creative-briefs.json');
const CSV_OUT = path.join(MRX_ROOT, 'config/mrx-1000-hero-share-creative-briefs.csv');
const REPORT_OUT = path.join(MRX_ROOT, 'reports/mrx-1000-hero-share-creative-briefs.md');
const LEDGER_JSON = path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json');
const OWNER_DECISION = path.join(
  MRX_ROOT,
  'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
);
const TWO_IMAGE_DECISION = path.join(
  MRX_ROOT,
  'artifacts/mrx1000-release-10/decisions/mrx-owner-two-image-retrofit-authorization-20260811.md',
);
const TWO_IMAGE_MANIFEST = path.join(MRX_ROOT, 'config/mrx-article-two-image-retrofit.json');
const POSTS_DIR = path.join(MRX_ROOT, 'src/content/posts');
const EXPECTED_OWNER_DECISION_SHA =
  'edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f';
const REUSE_RULE =
  'canonical_exact_title_hero_reused_identically_for_visible_hero_open_graph_twitter_and_featured_share_surfaces';

interface CreativeBriefRow {
  program_row_id: string;
  canonical_title: string;
  canonical_slug: string;
  primary_keyword: string;
  preservation_classification: string;
  repo_path: string | null;
  is_pilot_001: boolean;
  final_hero_asset_path: string;
  final_social_asset_path: string;
  final_inline_asset_path: string;
  social_asset_reuse_rule: string;
  hero_rendered_text: string;
  inline_rendered_text: string;
  hero_filename_text_identity: boolean;
  inline_filename_text_identity: boolean;
  alt_text: string;
  social_alt_text: string;
  inline_alt_text: string;
  visible_canonical_title: string;
  share_seo_title: string;
  topic_rule_id: string;
  topic_rule_source: string;
  semantic_signature_sha256: string;
  semantic_appropriateness_checks: Record<string, boolean>;
  topic_semantics: {
    rule_id: string;
    rule_source: string;
    subject_terms: string[];
    object_cue: string;
    action_cue: string;
    location_cue: string;
    risk_cue: string;
    decision_cue: string;
    intent_cue: string;
    semantic_signature_sha256: string;
  };
  visual_concept: string;
  generation_prompt: string;
  inline_visual_concept: string;
  inline_generation_prompt: string;
  focal_point: string;
  crop_guidance: string;
  share_title: string;
  share_title_plan: string;
  share_description: string;
  share_description_plan: string;
  share_image_plan: string;
  prohibited_motifs_and_claims: string[];
  brief_status: string;
  brief_ready: boolean;
  asset_generated: boolean;
  on_disk: boolean;
  published: boolean;
  release_blocked: boolean;
  release_status: string;
  planned_replacement_required: boolean;
  current_asset_path: string | null;
  current_social_asset_path: string | null;
  current_asset_on_disk: boolean;
  current_asset_format: string | null;
  current_asset_width: number | null;
  current_asset_height: number | null;
  current_asset_path_unique: boolean;
  current_asset_content_unique: boolean;
  current_asset_article_match: boolean;
  current_asset_match_tokens: string[];
  current_asset_usable: boolean;
  current_asset_preserved: boolean;
  current_asset_is_shared_pilot_placeholder: boolean;
  current_asset_sha256: string | null;
  current_inline_asset_sha256: string | null;
  inline_asset_generated: boolean;
  inline_on_disk: boolean;
  two_image_policy_evidence_verified: boolean;
  visual_seed_sha256: string;
}

interface CreativePlan {
  schema_version: string;
  generated_at: string;
  source_ledger: { sha256: string; row_count: number };
  controlling_decision: {
    sha256: string;
    signed: boolean;
    disposition: string;
    numerical_release_cap_applies: boolean;
    elapsed_time_gate_applies: boolean;
    generation_authorized: boolean;
    publication_authorized: boolean;
    indexing_authorized: boolean;
    deployment_authorized: boolean;
    spend_authorized: boolean;
  };
  asset_architecture: {
    one_unique_hero_per_article: boolean;
    one_distinct_inline_image_per_article: boolean;
    final_distinct_asset_path_count: number;
    rendered_text_filename_identity_required: boolean;
    social_asset_reuse_rule: string;
    hero_and_social_same_path_within_row_count: number;
    dedicated_social_asset_row_count: number;
    hero_or_social_path_reuse_across_rows_allowed: boolean;
  };
  scope_attestation: Record<string, boolean>;
  source_input_fingerprint_sha256: string;
  row_plan_fingerprint_sha256: string;
  verification: Record<string, number>;
  rows: CreativeBriefRow[];
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function snapshotFiles(paths: string[]): Map<string, string> {
  return new Map(paths.map((filePath) => [filePath, sha256File(filePath)]));
}

function runGenerator(outputDir: string, ledgerPath: string): void {
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: MRX_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      MRX1000_HERO_SHARE_OUTPUT_DIR: outputDir,
      MRX1000_HERO_SHARE_LEDGER_PATH: ledgerPath,
    },
  });
  if (result.status !== 0) {
    throw new Error(
      `creative-brief generator exited ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}

function repoPathToAbsolute(repoPath: string): string {
  return repoPath.startsWith('mrx/')
    ? path.join(MRX_ROOT, repoPath.slice('mrx/'.length))
    : path.join(WORKSPACE_ROOT, repoPath);
}

describe('MRX 1,000-row hero/share creative-brief generator', () => {
  let plan: CreativePlan;
  let firstOutputHashes: Map<string, string>;
  let secondOutputHashes: Map<string, string>;
  let guardedBefore: Map<string, string>;
  let guardedAfter: Map<string, string>;
  let isolatedOutputDir: string | null = null;
  let isolatedOutputs: { json: string; csv: string; report: string };
  let isolatedLedgerPath: string;

  beforeAll(() => {
    isolatedOutputDir = mkdtempSync(path.join(tmpdir(), 'mrx1000-hero-share-'));
    isolatedLedgerPath = path.join(isolatedOutputDir, 'canonical-content-ledger.snapshot.json');
    const ledgerBytes = readFileSync(LEDGER_JSON);
    const ledger = JSON.parse(ledgerBytes.toString('utf8')) as { articles?: unknown[] };
    expect(ledger.articles).toHaveLength(1000);
    writeFileSync(isolatedLedgerPath, ledgerBytes);

    const articlePaths = readdirSync(POSTS_DIR)
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => path.join(POSTS_DIR, name));
    const guardPaths = [
      isolatedLedgerPath,
      OWNER_DECISION,
      TWO_IMAGE_DECISION,
      TWO_IMAGE_MANIFEST,
      ...articlePaths,
    ];

    guardedBefore = snapshotFiles(guardPaths);
    isolatedOutputs = {
      json: path.join(isolatedOutputDir, 'mrx-1000-hero-share-creative-briefs.json'),
      csv: path.join(isolatedOutputDir, 'mrx-1000-hero-share-creative-briefs.csv'),
      report: path.join(isolatedOutputDir, 'mrx-1000-hero-share-creative-briefs.md'),
    };
    runGenerator(isolatedOutputDir, isolatedLedgerPath);
    firstOutputHashes = snapshotFiles(Object.values(isolatedOutputs));
    runGenerator(isolatedOutputDir, isolatedLedgerPath);
    secondOutputHashes = snapshotFiles(Object.values(isolatedOutputs));
    guardedAfter = snapshotFiles(guardPaths);
    plan = JSON.parse(readFileSync(isolatedOutputs.json, 'utf8')) as CreativePlan;
  });

  afterAll(() => {
    if (isolatedOutputDir) rmSync(isolatedOutputDir, { recursive: true, force: true });
  });

  it('is byte-deterministic in isolation and matches checked-in sidecars without modifying guarded inputs', () => {
    expect(secondOutputHashes).toEqual(firstOutputHashes);
    expect(guardedAfter).toEqual(guardedBefore);
    expect(readFileSync(isolatedOutputs.json, 'utf8')).toBe(readFileSync(JSON_OUT, 'utf8'));
    expect(readFileSync(isolatedOutputs.csv, 'utf8')).toBe(readFileSync(CSV_OUT, 'utf8'));
    expect(readFileSync(isolatedOutputs.report, 'utf8')).toBe(readFileSync(REPORT_OUT, 'utf8'));
    expect(plan.source_ledger.sha256).toBe(sha256File(isolatedLedgerPath));
    expect(plan.source_input_fingerprint_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(plan.schema_version).toBe('mrx1000-two-image-creative-brief-v2.0.0');
    expect(plan.row_plan_fingerprint_sha256).toBe(
      createHash('sha256')
        .update(`${JSON.stringify(plan.rows)}\n`)
        .digest('hex'),
    );
  });

  it('covers all 1,000 canonical rows with collision-free per-article hero/share paths', () => {
    expect(plan.source_ledger.row_count).toBe(1000);
    expect(plan.rows).toHaveLength(1000);
    expect(new Set(plan.rows.map((row) => row.program_row_id)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.final_hero_asset_path)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.final_social_asset_path)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.final_inline_asset_path)).size).toBe(1000);
    expect(plan.asset_architecture).toMatchObject({
      one_unique_hero_per_article: true,
      one_distinct_inline_image_per_article: true,
      final_distinct_asset_path_count: 2000,
      rendered_text_filename_identity_required: true,
      social_asset_reuse_rule: REUSE_RULE,
      hero_and_social_same_path_within_row_count: 1000,
      dedicated_social_asset_row_count: 0,
      hero_or_social_path_reuse_across_rows_allowed: false,
    });

    expect(
      plan.rows.filter((row) => row.final_social_asset_path === row.final_hero_asset_path),
    ).toHaveLength(1000);
    expect(
      plan.rows.filter((row) => row.final_social_asset_path !== row.final_hero_asset_path),
    ).toHaveLength(0);
    expect(plan.rows.every((row) => row.social_asset_reuse_rule === REUSE_RULE)).toBe(true);
  });

  it('provides a complete, unique, non-placeholder brief and share metadata plan per row', () => {
    expect(new Set(plan.rows.map((row) => row.alt_text)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.visual_concept)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.generation_prompt)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.semantic_signature_sha256)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.share_title)).size).toBe(1000);
    expect(new Set(plan.rows.map((row) => row.share_description)).size).toBe(1000);

    for (const row of plan.rows) {
      expect(row.brief_status, row.program_row_id).toBe('brief_ready');
      expect(row.brief_ready, row.program_row_id).toBe(true);
      expect(row.alt_text.length, row.program_row_id).toBeGreaterThanOrEqual(40);
      expect(row.alt_text.length, row.program_row_id).toBeLessThanOrEqual(125);
      expect(row.alt_text.toLowerCase(), row.program_row_id).not.toContain('placeholder');
      expect(row.social_alt_text.length, row.program_row_id).toBeGreaterThanOrEqual(30);
      expect(row.social_alt_text.length, row.program_row_id).toBeLessThanOrEqual(125);
      if (row.final_social_asset_path === row.final_hero_asset_path) {
        expect(row.social_alt_text, row.program_row_id).toBe(row.alt_text);
      }
      expect(row.visual_concept, row.program_row_id).toContain(row.canonical_title);
      expect(row.generation_prompt, row.program_row_id).toContain(row.canonical_title);
      expect(row.generation_prompt, row.program_row_id).toContain(row.primary_keyword);
      expect(row.generation_prompt, row.program_row_id).toContain(
        `Render exactly “${row.canonical_title}”`,
      );
      expect(row.inline_generation_prompt, row.program_row_id).toContain(
        `Render exactly “${row.inline_rendered_text}”`,
      );
      expect(row.hero_rendered_text, row.program_row_id).toBe(row.canonical_title);
      expect(row.hero_filename_text_identity, row.program_row_id).toBe(true);
      expect(row.inline_filename_text_identity, row.program_row_id).toBe(true);
      expect(row.final_inline_asset_path, row.program_row_id).not.toBe(row.final_hero_asset_path);
      expect(row.visible_canonical_title, row.program_row_id).toBe(row.canonical_title);
      expect(row.share_seo_title, row.program_row_id).toBe(row.share_title);
      expect(row.share_title.length, row.program_row_id).toBeLessThanOrEqual(60);
      expect(Object.values(row.semantic_appropriateness_checks).every(Boolean)).toBe(true);
      expect(row.topic_semantics.semantic_signature_sha256, row.program_row_id).toBe(
        row.semantic_signature_sha256,
      );
      expect(row.topic_semantics.subject_terms.length, row.program_row_id).toBeGreaterThanOrEqual(
        3,
      );
      expect(row.visual_concept, row.program_row_id).toContain(row.topic_semantics.object_cue);
      expect(row.visual_concept, row.program_row_id).toContain(row.topic_semantics.risk_cue);
      expect(row.generation_prompt, row.program_row_id).toContain(row.topic_semantics.action_cue);
      expect(row.generation_prompt, row.program_row_id).toContain(row.topic_semantics.decision_cue);
      expect(row.focal_point.length, row.program_row_id).toBeGreaterThan(20);
      expect(row.crop_guidance, row.program_row_id).toContain('16:9');
      expect(row.crop_guidance, row.program_row_id).toContain('1.91:1');
      expect(row.share_description.length, row.program_row_id).toBeGreaterThanOrEqual(130);
      expect(row.share_description.length, row.program_row_id).toBeLessThanOrEqual(160);
      expect(row.share_description, row.program_row_id).not.toContain('…');
      expect(row.share_description, row.program_row_id).toMatch(/[.!?]$/);
      expect(row.share_title_plan, row.program_row_id).toContain('og:title');
      expect(row.share_description_plan, row.program_row_id).toContain('og:description');
      expect(row.share_image_plan, row.program_row_id).toContain('og:image');
      expect(row.prohibited_motifs_and_claims.length, row.program_row_id).toBeGreaterThanOrEqual(5);
      expect(row.visual_seed_sha256, row.program_row_id).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('uses representative topic-specific semantics instead of cluster-only boilerplate', () => {
    const cases: Array<[RegExp, string, RegExp]> = [
      [/personal information confidential/i, 'privacy-confidentiality', /sealed owner records/i],
      [/mineral rights in probate/i, 'probate-estate-inheritance', /probate folder/i],
      [/how are mineral rights valued/i, 'valuation-dcf-drivers', /production curves/i],
      [/1031 exchange process/i, 'tax-1031-exchange', /exchange timeline/i],
      [/separate from surface rights/i, 'title-lease-ownership', /deed chain/i],
      [/decode your royalty check statement/i, 'royalty-payments-operations', /royalty statement/i],
      [/permian basin/i, 'county-basin-local', /county and basin map/i],
      [/compare mineral rights buyers/i, 'offer-comparison-safety', /two neutral offer folders/i],
    ];

    for (const [titlePattern, ruleId, objectPattern] of cases) {
      const row = plan.rows.find((candidate) => titlePattern.test(candidate.canonical_title));
      expect(row, String(titlePattern)).toBeDefined();
      expect(row?.topic_rule_id, row?.program_row_id).toBe(ruleId);
      expect(row?.topic_rule_source, row?.program_row_id).toBe('explicit_topic_rule');
      expect(row?.topic_semantics.object_cue, row?.program_row_id).toMatch(objectPattern);
    }
  });

  it('preserves the 99 current public-workspace two-image sets and their frontmatter metadata', () => {
    const publicRows = plan.rows.filter(
      (row) => row.preservation_classification === 'live_public_published_route',
    );
    expect(publicRows).toHaveLength(99);

    for (const row of publicRows) {
      expect(row.repo_path).not.toBeNull();
      const post = parsePostFrontmatter(
        readFileSync(repoPathToAbsolute(row.repo_path as string), 'utf8'),
        row.canonical_slug,
      );
      expect(row.final_hero_asset_path, row.program_row_id).toBe(post.hero.src);
      expect(row.final_social_asset_path, row.program_row_id).toBe(
        post.hero.socialSrc || post.hero.src,
      );
      expect(row.final_inline_asset_path, row.program_row_id).toBe(post.inline.src);
      expect(row.inline_rendered_text, row.program_row_id).toBe(post.inline.renderedText);
      expect(row.inline_alt_text, row.program_row_id).toBe(post.inline.alt);
      expect(row.alt_text, row.program_row_id).toBe(post.hero.alt);
      expect(row.share_title, row.program_row_id).toBe(post.seoTitle || post.title);
      expect(row.share_description, row.program_row_id).toBe(post.description);
      expect(row.current_asset_path, row.program_row_id).toBe(post.hero.src);
      expect(row.asset_generated, row.program_row_id).toBe(true);
      expect(row.inline_asset_generated, row.program_row_id).toBe(true);
      expect(row.on_disk, row.program_row_id).toBe(true);
      expect(row.inline_on_disk, row.program_row_id).toBe(true);
      expect(row.two_image_policy_evidence_verified, row.program_row_id).toBe(true);
      expect(row.published, row.program_row_id).toBe(true);
      expect(row.release_blocked, row.program_row_id).toBe(false);
      expect(row.current_asset_sha256, row.program_row_id).toMatch(/^[0-9a-f]{64}$/);
      expect(row.current_inline_asset_sha256, row.program_row_id).toMatch(/^[0-9a-f]{64}$/);
      expect(
        existsSync(path.join(MRX_ROOT, 'public', row.final_hero_asset_path.slice(1))),
        row.program_row_id,
      ).toBe(true);
    }
  });

  it('requires all 29 held incumbents to satisfy the two-image policy before release', () => {
    const heldRows = plan.rows.filter(
      (row) => row.preservation_classification === 'incumbent_draft_nonpublic_held',
    );
    expect(heldRows).toHaveLength(29);

    for (const row of heldRows) {
      expect(row.repo_path).not.toBeNull();
      const post = parsePostFrontmatter(
        readFileSync(repoPathToAbsolute(row.repo_path as string), 'utf8'),
        row.canonical_slug,
      );
      expect(row.current_asset_path, row.program_row_id).toBe(post.hero.src);
      expect(row.current_social_asset_path, row.program_row_id).toBe(
        post.hero.socialSrc || post.hero.src,
      );
      expect(row.published, row.program_row_id).toBe(false);
      expect(row.release_blocked, row.program_row_id).toBe(true);

      expect(row.current_asset_usable, row.program_row_id).toBe(false);
      expect(row.current_asset_preserved, row.program_row_id).toBe(false);
      expect(row.planned_replacement_required, row.program_row_id).toBe(true);
      expect(row.asset_generated, row.program_row_id).toBe(false);
      expect(row.inline_asset_generated, row.program_row_id).toBe(false);
      expect(row.on_disk, row.program_row_id).toBe(false);
      expect(row.inline_on_disk, row.program_row_id).toBe(false);
      expect(row.two_image_policy_evidence_verified, row.program_row_id).toBe(false);
      expect(row.release_status, row.program_row_id).toContain('quality_blocked');
    }

    expect(heldRows.filter((row) => row.current_asset_usable)).toHaveLength(0);
    expect(heldRows.filter((row) => row.planned_replacement_required)).toHaveLength(29);
  });

  it('assigns 25 unique pilot replacements while leaving every pilot blocked and ungenerated', () => {
    const pilots = plan.rows.filter((row) => row.is_pilot_001);
    expect(pilots).toHaveLength(25);
    expect(new Set(pilots.map((row) => row.final_hero_asset_path)).size).toBe(25);

    for (const row of pilots) {
      expect(row.current_asset_path, row.program_row_id).toBe(
        '/assets/brand/mrx-underwriter-review-og.png',
      );
      expect(row.current_social_asset_path, row.program_row_id).toBe(
        '/assets/brand/mrx-underwriter-review-og.png',
      );
      expect(row.current_asset_is_shared_pilot_placeholder, row.program_row_id).toBe(true);
      expect(row.final_hero_asset_path, row.program_row_id).toMatch(
        /^\/assets\/articles\/hero\/.+\.webp$/,
      );
      expect(row.final_inline_asset_path, row.program_row_id).toMatch(
        /^\/assets\/articles\/inline\/.+\/.+\.webp$/,
      );
      expect(row.final_hero_asset_path, row.program_row_id).not.toBe(row.current_asset_path);
      expect(row.planned_replacement_required, row.program_row_id).toBe(true);
      expect(row.asset_generated, row.program_row_id).toBe(false);
      expect(row.on_disk, row.program_row_id).toBe(false);
      expect(row.published, row.program_row_id).toBe(false);
      expect(row.release_blocked, row.program_row_id).toBe(true);
      expect(row.release_status, row.program_row_id).toContain('quality_blocked');
    }
  });

  it('removes numerical blockers while retaining article-specific quality gates', () => {
    expect(sha256File(OWNER_DECISION)).toBe(EXPECTED_OWNER_DECISION_SHA);
    expect(plan.controlling_decision).toEqual({
      decision_id: 'D-2026-0804-16',
      path: 'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
      sha256: EXPECTED_OWNER_DECISION_SHA,
      signed: true,
      disposition: 'APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION',
      numerical_release_cap_applies: false,
      elapsed_time_gate_applies: false,
      generation_authorized: true,
      publication_authorized: true,
      indexing_authorized: true,
      deployment_authorized: true,
      spend_authorized: false,
    });
    expect(plan.rows.filter((row) => row.asset_generated)).toHaveLength(99);
    expect(plan.rows.filter((row) => row.inline_asset_generated)).toHaveLength(99);
    expect(plan.rows.filter((row) => row.on_disk)).toHaveLength(99);
    expect(plan.rows.filter((row) => row.inline_on_disk)).toHaveLength(99);
    expect(plan.rows.filter((row) => row.published)).toHaveLength(99);
    expect(plan.rows.filter((row) => row.release_blocked)).toHaveLength(901);
    expect(plan.scope_attestation).toMatchObject({
      local_only: true,
      images_generated_or_edited: false,
      article_frontmatter_edited: false,
      source_articles_edited: false,
      external_calls_made: false,
      publication_or_indexing_performed: false,
      deployment_performed: false,
      spend_performed: false,
    });
  });

  it('emits complete JSON, CSV, and human-readable report sidecars', () => {
    const csvLines = readFileSync(CSV_OUT, 'utf8').trimEnd().split('\n');
    const report = readFileSync(REPORT_OUT, 'utf8');
    expect(csvLines).toHaveLength(1001);
    expect(csvLines[0]).toContain('final_hero_asset_path');
    expect(csvLines[0]).toContain('final_inline_asset_path');
    expect(csvLines[0]).toContain('prohibited_motifs_and_claims');
    expect(csvLines[0]).toContain('semantic_signature_sha256');
    expect(csvLines[0]).toContain('current_asset_usable');
    expect(report).toMatch(/\| Canonical ledger rows\s+\|\s+1000 \|/);
    expect(report).toMatch(/\| Final hero path collisions\s+\|\s+0 \|/);
    expect(report).toMatch(/\| Unique semantic signatures\s+\|\s+1000 \|/);
    expect(report).toMatch(/\| Semantic appropriateness failures\s+\|\s+0 \|/);
    expect(report).toMatch(/\| Held current assets preserved\s+\|\s+0 \|/);
    expect(report).toMatch(/\| Held assets still requiring replacement\s+\|\s+29 \|/);
    expect(report).toMatch(/\| Pilot rows still quality-blocked\s+\|\s+25 \|/);
    expect(report).toContain(EXPECTED_OWNER_DECISION_SHA);
  });
});
