#!/usr/bin/env node
/**
 * scripts/check-mrx1000-release-gates.mjs
 *
 * Fail-closed release-gate check for the MRX1000 release-10 program
 * declared by D-2026-0721-21 and superseded for numerical scale policy by
 * D-2026-0804-16.
 *
 *   Inputs (all required unless noted):
 *     - config/mrx1000-release-10-batch.json          (authorized batch)
 *     - artifacts/mrx1000-release-10/decisions/*.md   (signed CEO decision)
 *     - artifacts/mrx1000-release-10/evidence/*.json  (per-article packets)
 *     - config/mrx-1000-canonical-content-ledger.json (1000-row ledger)
 *     - dist/sitemap-articles.xml                     (built sitemap when present)
 *     - reports/mrx1000-release-10-scale-gate-observations.json (optional
 *       observations; if missing, gates evaluate with empty observations)
 *
 *   Outputs:
 *     - reports/mrx1000-release-10-lifecycle/check-gates.json  (machine-readable)
 *     - reports/mrx1000-release-10-lifecycle/check-gates.md    (human-readable)
 *     - .sha256 sidecars for both files
 *
 *   Exit codes:
 *     0 — all fail-closed invariants pass (program scope OK, no unauthorized
 *         publications, and evidence fully PASS).
 *     2 — any blocking finding present; remediation required.
 *     1 — usage error (bad flag, missing input the operator must supply).
 *
 * This script intentionally never publishes, indexes, or mutates the
 * site. Its only side-effects are writing the durable check artifacts
 * under reports/mrx1000-release-10-lifecycle/, plus a non-zero exit
 * when the gate blocks.
 *
 * Operator flags:
 *   --strict                   Treat any informational finding as blocking
 *                              (default: false). Forces maximum sensitivity
 *                              in production release flows.
 *   --observations=path/to/   Override the default observation-source file.
 *     observations.json        The file must be a JSON object with two keys,
 *                              "10_to_25" and "25_to_50", each matching the
 *                              EarnedScaleGateObservation contract declared
 *                              in src/lib/release-lifecycle.ts.
 *   --expected-decision-sha    When present, the controlling decision SHA-256
 *                              must equal this value or the check fails.
 *                              In exact-admission mode this binds to the
 *                              batch-admission decision; otherwise it binds
 *                              to the successor release/index decision.
 *   --require-pass-on-articles When present, every authorized-admitted slug
 *                              listed (comma-separated) must have an
 *                              evidence packet with PASS on every
 *                              disposition. Use during pre-publish sign-off.
 *   --help                     Print usage.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';

import process from 'node:process';

import {
  buildAuthorizedAdmittedLookup,
  buildPublicLiveLegacyLookup,
  deriveArticleLifecycleStage,
  evaluateReleaseGates,
  legacyLiveRowsFromLedger,
  parseReleaseDecisionArtifact,
} from './_release-lifecycle-embedded.mjs';
import {
  analyzeControlledPublicationTransition,
  transitionProofMatches,
} from './_mrx1000-controlled-publication-transition.mjs';

// Allow override via --tree=<abs-path> (used by tests) or MRX_TREE
// environment variable. Otherwise default to the script's parent dir.
function pickRepoRoot(argv) {
  for (const arg of argv) {
    if (arg.startsWith('--tree=')) {
      const candidate = resolve(arg.slice('--tree='.length));
      if (existsSync(join(candidate, 'config', 'mrx1000-release-10-batch.json'))) return candidate;
    }
  }
  const envTree = process.env.MRX_TREE;
  if (envTree && existsSync(join(envTree, 'config', 'mrx1000-release-10-batch.json')))
    return resolve(envTree);
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'config', 'mrx1000-release-10-batch.json'))) return cwd;
  return resolve(import.meta.dirname, '..');
}
// Note: argv here is the node-process argv, not a wrapper. We accept
// the parse-late trade-off for the test convenience.
const repoRoot = pickRepoRoot([...process.argv]);

/* ---------- arg parsing ---------- */

function parseArgs(argv) {
  const out = {
    strict: false,
    observations: null,
    expectedDecisionSha: null,
    requirePassOnArticles: [],
  };
  for (const raw of argv.slice(2)) {
    if (raw === '--strict') out.strict = true;
    else if (raw === '--help' || raw === '-h') out.help = true;
    else if (raw.startsWith('--observations='))
      out.observations = raw.slice('--observations='.length);
    else if (raw.startsWith('--tree=')) out.tree = raw.slice('--tree='.length);
    else if (raw.startsWith('--expected-decision-sha='))
      out.expectedDecisionSha = raw.slice('--expected-decision-sha='.length).toLowerCase();
    else if (raw.startsWith('--require-pass-on-articles=')) {
      out.requirePassOnArticles = raw
        .slice('--require-pass-on-articles='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      console.error(`Unknown flag: ${raw}`);
      console.error(use());
      process.exit(1);
    }
  }
  return out;
}

function use() {
  return [
    'Usage: node scripts/check-mrx1000-release-gates.mjs [flags]',
    '',
    'Flags:',
    '  --strict                                  treat any informational finding as blocking',
    '  --observations=path/to/observations.json  override scale-gate observation source',
    '  --tree=/absolute/path                    verify an alternate complete tree (tests/audits)',
    '  --expected-decision-sha=<hex64>           verify controlling decision SHA-256',
    '  --require-pass-on-articles=s1,s2,...      require PASS evidence packets for these slugs',
    '  --help | -h                               print this message',
  ].join('\n');
}

/* ---------- helpers ---------- */

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readText(path) {
  return readFileSync(path, 'utf8');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function sha256File(path) {
  return sha256(readFileSync(path));
}

function verifySidecar(path) {
  const sidecarPath = `${path}.sha256`;
  if (!existsSync(path) || !existsSync(sidecarPath)) return false;
  const expected = readFileSync(sidecarPath, 'utf8')
    .trim()
    .match(/^([a-f0-9]{64})(?:\s|$)/i)?.[1];
  return expected?.toLowerCase() === sha256File(path);
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

function canonicalizeExactSlate(rows) {
  return JSON.stringify(sortDeep(rows));
}

function parseDecisionIdFromText(text) {
  return (
    text.match(/^Decision ID:\s*(.+)$/m)?.[1]?.trim() ??
    text.match(/^\- Addendum ID:\s*\*\*(.+?)\*\*$/m)?.[1]?.trim() ??
    null
  );
}

function parseExactDecisionRows(text) {
  const rows = [];
  const pattern =
    /^\|\s*(MRX1000-\d{4})\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*`([a-f0-9]{64})`\s*\|\s*`([a-f0-9]{64})`\s*\|\s*(\d+)\s*\|\s*$/gim;
  for (const match of text.matchAll(pattern)) {
    rows.push({
      program_row_id: match[1],
      slug: match[2],
      title: match[3].trim(),
      article_sha256: match[4].toLowerCase(),
      hero_sha256: match[5].toLowerCase(),
      word_count: Number(match[6]),
    });
  }
  return rows;
}

function parseExactHeroRebindingAddendumRows(text) {
  const rows = [];
  const pattern =
    /^\|\s*(MRX1000-\d{4})\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*`([a-f0-9]{64})`\s*\|\s*`([a-f0-9]{64})`\s*\|\s*`([a-f0-9]{64})`\s*\|\s*$/gim;
  for (const match of text.matchAll(pattern)) {
    rows.push({
      program_row_id: match[1],
      slug: match[2],
      title: match[3].trim(),
      article_sha256: match[4].toLowerCase(),
      prior_hero_sha256: match[5].toLowerCase(),
      corrected_hero_sha256: match[6].toLowerCase(),
    });
  }
  return rows;
}

function validateBoundGscRecoveryEvidence({
  gscJson,
  addendumText,
  expectedJsonSha,
  expectedMdSha,
  expectedBatchSha,
  expectedRows,
}) {
  const findings = [];
  const addendum = String(addendumText ?? '');
  const expectedReceiptRows = Array.isArray(expectedRows) ? expectedRows : [];
  const records = Array.isArray(gscJson?.records) ? gscJson.records : [];
  if (!/^[a-f0-9]{64}$/i.test(expectedJsonSha ?? '')) {
    findings.push('GSC replacement receipt JSON SHA-256 binding is missing or malformed.');
  } else if (!addendum.includes(expectedJsonSha)) {
    findings.push('GSC recovery addendum does not bind the configured JSON receipt SHA-256.');
  }
  if (!/^[a-f0-9]{64}$/i.test(expectedMdSha ?? '')) {
    findings.push('GSC replacement receipt markdown SHA-256 binding is missing or malformed.');
  } else if (!addendum.includes(expectedMdSha)) {
    findings.push('GSC recovery addendum does not bind the configured markdown receipt SHA-256.');
  }
  if (!/^[a-f0-9]{64}$/i.test(expectedBatchSha ?? '')) {
    findings.push(
      'GSC replacement receipt pre-edit batch SHA-256 binding is missing or malformed.',
    );
  }
  if (!gscJson || typeof gscJson !== 'object') {
    findings.push('GSC replacement receipt JSON is missing or unreadable.');
    return findings;
  }
  if (!/Parent decision:\s*\*\*D-2026-0801-10\*\*/.test(addendum)) {
    findings.push('GSC recovery addendum parent decision binding is missing or malformed.');
  }
  if (!/Related prior addendum:\s*\*\*D-2026-0801-10A\*\*/.test(addendum)) {
    findings.push('GSC recovery addendum prior addendum binding is missing or malformed.');
  }
  if (expectedReceiptRows.length !== 10) {
    findings.push(
      `GSC replacement receipt expected-row binding mismatch: expected 10 immutable pre-edit rows, got ${expectedReceiptRows.length}.`,
    );
  }
  if (records.length !== 10) {
    findings.push(
      `GSC replacement receipt record count mismatch: expected 10, got ${records.length}.`,
    );
  }
  if (gscJson.batch_article_count !== 10) {
    findings.push(
      `GSC replacement receipt batch_article_count mismatch: expected 10, got ${gscJson.batch_article_count ?? '(missing)'}.`,
    );
  }
  if (gscJson.summary?.urls_inspected !== 10) {
    findings.push(
      `GSC replacement receipt summary URL count mismatch: expected 10, got ${gscJson.summary?.urls_inspected ?? '(missing)'}.`,
    );
  }
  if (gscJson.property !== 'sc-domain:mineralrightsxchange.com') {
    findings.push(
      `GSC replacement receipt property mismatch: expected sc-domain:mineralrightsxchange.com, got ${gscJson.property ?? '(missing)'}.`,
    );
  }
  if (gscJson.scope !== 'https://www.googleapis.com/auth/webmasters.readonly') {
    findings.push(
      `GSC replacement receipt scope mismatch: expected https://www.googleapis.com/auth/webmasters.readonly, got ${gscJson.scope ?? '(missing)'}.`,
    );
  }
  if (gscJson.request_indexing_mutation_used !== false) {
    findings.push('GSC replacement receipt must prove request_indexing_mutation_used=false.');
  }
  if (gscJson.batch_sha256 !== expectedBatchSha) {
    findings.push(
      `GSC replacement receipt batch SHA-256 mismatch: expected ${expectedBatchSha ?? '(missing)'}, got ${gscJson.batch_sha256 ?? '(missing)'}.`,
    );
  }
  if (records.some((row) => row.raw_verdict !== 'PASS')) {
    findings.push('GSC replacement receipt contains non-PASS raw verdicts.');
  }
  if (records.some((row) => row.indexing_state !== 'INDEXING_ALLOWED')) {
    findings.push('GSC replacement receipt contains non-INDEXING_ALLOWED indexing states.');
  }
  if (records.some((row) => row.property !== 'sc-domain:mineralrightsxchange.com')) {
    findings.push('GSC replacement receipt contains a row with the wrong property binding.');
  }
  if (records.some((row) => row.scope !== 'https://www.googleapis.com/auth/webmasters.readonly')) {
    findings.push('GSC replacement receipt contains a row with the wrong scope binding.');
  }
  if (records.some((row) => row.request_indexing_mutation_used !== false)) {
    findings.push('GSC replacement receipt contains a row that used request indexing mutation.');
  }
  for (let index = 0; index < Math.min(records.length, expectedReceiptRows.length); index += 1) {
    const row = records[index] ?? {};
    const expected = expectedReceiptRows[index] ?? {};
    const rank = index + 1;
    if (
      row.selection_rank !== expected.selection_rank ||
      row.program_row_id !== expected.program_row_id ||
      row.slug !== expected.slug ||
      row.url !== expected.canonical_url
    ) {
      findings.push(
        `GSC replacement receipt immutable row identity/order mismatch at rank ${rank}.`,
      );
    }
    if (row.https !== 'yes') {
      findings.push(`GSC replacement receipt row ${rank} must prove https=yes.`);
    }
    if (row.page_fetch_state !== 'SUCCESSFUL') {
      findings.push(`GSC replacement receipt row ${rank} must prove page_fetch_state=SUCCESSFUL.`);
    }
    if (row.robots_txt_state !== 'ALLOWED') {
      findings.push(`GSC replacement receipt row ${rank} must prove robots_txt_state=ALLOWED.`);
    }
    if (row.google_canonical !== expected.canonical_url) {
      findings.push(`GSC replacement receipt row ${rank} Google canonical mismatch.`);
    }
    if (row.user_canonical !== expected.canonical_url) {
      findings.push(`GSC replacement receipt row ${rank} user canonical mismatch.`);
    }
  }
  return findings;
}

function validateRetainedProductionBaseline({ manifest }) {
  const findings = [];
  if (!manifest || typeof manifest !== 'object') {
    return ['Retained production baseline manifest is missing or unreadable.'];
  }
  if (manifest.artifact_type !== 'mrx1000_retained_production_baseline') {
    findings.push('Retained production baseline manifest artifact_type is missing or incorrect.');
  }
  if (!manifest.source_authority?.source_deployment_id) {
    findings.push('Retained production baseline source deployment ID is missing.');
  }
  if (manifest.source_authority?.decision_id !== 'D-2026-0811-17') {
    findings.push('Retained production baseline does not cite the two-image rebind decision.');
  }
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const retainedRoutes = Array.isArray(manifest.retained_routes) ? manifest.retained_routes : [];
  if (retainedRoutes.length !== 2) {
    findings.push(`Retained production baseline route count mismatch: expected 2, got ${retainedRoutes.length}.`);
  }
  if (files.length !== retainedRoutes.length * 3) {
    findings.push(`Retained production baseline must bind source, hero, and inline files per route.`);
  }
  for (const manifestEntry of files) {
    const relPath = manifestEntry?.path ?? '';
    const absPath = relPath ? join(repoRoot, relPath) : null;
    if (!/^[a-f0-9]{64}$/i.test(manifestEntry?.sha256 ?? '')) {
      findings.push(`Retained production baseline SHA-256 is invalid for ${relPath || '(missing path)'}.`);
    }
    if (!['page_source', 'hero_asset', 'inline_asset'].includes(manifestEntry?.role)) {
      findings.push(`Retained production baseline role is invalid for ${relPath || '(missing path)'}.`);
    }
    if (!manifestEntry?.page_url) {
      findings.push(`Retained production baseline page URL is missing for ${relPath || '(missing path)'}.`);
    }
    if (!absPath || !existsSync(absPath)) {
      findings.push(`Retained production baseline file is missing on disk: ${relPath || '(missing path)'}.`);
      continue;
    }
    const observedSha = sha256File(absPath);
    if (observedSha !== manifestEntry.sha256) {
      findings.push(
        `Retained production baseline on-disk SHA mismatch for ${relPath}: expected ${manifestEntry.sha256}, got ${observedSha}.`,
      );
    }
  }
  for (const route of retainedRoutes) {
    if (
      !route.slug ||
      !route.page_url ||
      !route.expected_h1 ||
      !route.source_path ||
      !route.hero_path ||
      !route.inline_path ||
      !/^[a-f0-9]{64}$/i.test(route.source_sha256 ?? '') ||
      !/^[a-f0-9]{64}$/i.test(route.hero_sha256 ?? '') ||
      !/^[a-f0-9]{64}$/i.test(route.inline_sha256 ?? '') ||
      route.hero_path === route.inline_path ||
      route.hero_sha256 === route.inline_sha256
    ) {
      findings.push(`Retained production baseline route is incomplete for ${route.slug ?? '(missing slug)'}.`);
      continue;
    }
    const expectedBindings = [
      ['page_source', route.source_path, route.source_sha256],
      ['hero_asset', `public${route.hero_path}`, route.hero_sha256],
      ['inline_asset', `public${route.inline_path}`, route.inline_sha256],
    ];
    for (const [role, path, hash] of expectedBindings) {
      const match = files.find(
        (entry) =>
          entry.role === role &&
          entry.path === path &&
          entry.sha256 === hash &&
          entry.page_url === route.page_url,
      );
      if (!match) {
        findings.push(`Retained production baseline ${role} binding mismatch for ${route.slug}.`);
      }
    }
    const absPath = join(repoRoot, route.source_path);
    if (!existsSync(absPath)) {
      findings.push(`Retained production baseline source is missing for ${route.slug}.`);
      continue;
    }
    const source = readText(absPath);
    if (!source.includes(`title: '${route.expected_h1.replace(/'/g, "''")}'`) &&
        !source.includes(`title: "${route.expected_h1}"`)) {
      findings.push(
        `Retained production baseline title binding mismatch for ${route.slug}.`,
      );
    }
  }
  return findings;
}

function loadBoundPreEditBatch(snapshotRelPath, expectedSha) {
  const relPath =
    snapshotRelPath ?? 'artifacts/mrx1000-release-10/release/bound-pre-edit-batch.json';
  const absPath = join(repoRoot, relPath);
  if (!existsSync(absPath)) {
    return {
      available: false,
      path: relPath,
      sidecar_verified: false,
      sha256: null,
      batch: null,
      matches_expected: null,
    };
  }

  try {
    const bytes = readFileSync(absPath);
    const observedSha = sha256(bytes);
    return {
      available: true,
      path: relPath,
      sidecar_verified: verifySidecar(absPath),
      sha256: observedSha,
      batch: JSON.parse(bytes.toString('utf8')),
      matches_expected: expectedSha ? observedSha === expectedSha : null,
    };
  } catch {
    return {
      available: false,
      path: relPath,
      sidecar_verified: false,
      sha256: null,
      batch: null,
      matches_expected: null,
    };
  }
}

function normalizeUrl(value) {
  return String(value ?? '')
    .trim()
    .replace(/\/+$/, '')
    .toLowerCase();
}

function listSitemapUrls() {
  const sitemapCandidates = [
    join(repoRoot, 'dist', 'sitemap-articles.xml'),
    join(repoRoot, 'dist', 'client', 'sitemap-articles.xml'),
  ];
  const sitemap = sitemapCandidates.find((candidate) => existsSync(candidate));
  if (!existsSync(sitemap)) return new Set();
  const text = readText(sitemap);
  const urls = new Set();
  for (const m of text.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    urls.add(m[1].trim().replace(/\/+$/, '').toLowerCase());
  }
  return urls;
}

function deriveStagesForLedger(
  ledgerArticles,
  sitemapUrls,
  admittedLookup,
  legacyLookup,
  publicationOverrides = new Map(),
) {
  const rows = [];
  for (const article of ledgerArticles) {
    const override = publicationOverrides.get(article.canonical_slug) ?? null;
    const frontmatter = {
      publication_status: override?.publication_status ?? article.publication_status ?? null,
      draft: override?.draft ?? !!article.draft,
      noindex: override?.noindex ?? !!article.frontmatter_noindex,
      canonical_slug: article.canonical_slug ?? null,
      pillar: article.pillar ?? null,
      cluster: article.cluster ?? null,
      program_row_id: article.program_row_id ?? null,
    };
    const stage = deriveArticleLifecycleStage(frontmatter, {
      authorizedAdmitted: admittedLookup,
      publicLiveLegacy: legacyLookup,
    });
    rows.push({
      program_row_id: article.program_row_id ?? null,
      slug: article.canonical_slug ?? null,
      canonical_url: normalizeUrl(article.canonical_url ?? ''),
      pillar: article.pillar ?? null,
      cluster: article.cluster ?? null,
      lifecycle_stage: stage,
      is_published_in_dist_sitemap: sitemapUrls.has(normalizeUrl(article.canonical_url ?? '')),
    });
  }
  return rows;
}

function loadObservations(args) {
  const candidate = args.observations
    ? resolve(args.observations)
    : join(repoRoot, 'reports', 'mrx1000-release-10-scale-gate-observations.json');
  if (!existsSync(candidate)) return { observations: {}, found: false, path: candidate };
  return { observations: readJson(candidate), found: true, path: candidate };
}

function ensurePolicyThresholds(_report, batch) {
  const thresholds = batch.policy?.continuing_batch_thresholds_after_50;
  const findings = [];
  if (thresholds) {
    if (thresholds.minimum_non_branded_impressions_pct_within_window != null) {
      findings.push({
        kind: 'threshold_registered',
        threshold: 'minimum_non_branded_impressions_pct_within_window',
        window_days: thresholds.non_branded_impressions_window_days ?? null,
        value: thresholds.minimum_non_branded_impressions_pct_within_window,
        applies_to: thresholds.applies_to ?? null,
      });
    }
  }
  // Surface 80% index coverage for 10->25 / 25->50 as informational so
  // operators do not silently regress the user-approved scale gates.
  for (const gate of batch.policy?.earned_scale_gates ?? []) {
    if (gate.minimum_index_coverage_pct_within_window != null) {
      findings.push({
        kind: 'threshold_registered',
        threshold: 'minimum_index_coverage_pct_within_window',
        from_cap: gate.from_cap,
        to_cap: gate.to_cap,
        window_days: gate.index_coverage_window_days ?? null,
        value: gate.minimum_index_coverage_pct_within_window,
      });
    }
  }
  return findings;
}

/* ---------- main ---------- */

function buildCheck() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(use());
    process.exit(0);
  }

  const inputs = {};
  const blocking = [];
  const informational = [];

  const batchRel = 'config/mrx1000-release-10-batch.json';
  const batchPath = join(repoRoot, batchRel);
  if (!existsSync(batchPath)) {
    blocking.push(`Missing authorized batch: ${batchRel}`);
    return { result: { inputs, blocking, informational }, blockingCount: blocking.length };
  }
  const batch = readJson(batchPath);
  inputs.batch = {
    path: batchRel,
    sha256: sha256File(batchPath),
    authorized_count: batch.articles?.length ?? 0,
    policy: batch.policy,
  };

  const exactCount = batch.policy?.exact_admitted_count ?? null;
  const exactSlateSha = batch.policy?.exact_admitted_slate_sha256 ?? null;
  const continuousQualityGated = batch.policy?.admission_mode === 'continuous_quality_gated';
  const exactAdmissionEnabled = Number.isInteger(exactCount) && exactCount > 0;
  const verifiedReleaseEvidence = {};
  const twoImagePolicy = batch.two_image_policy ?? null;
  let twoImageRebindActive = false;
  if (twoImagePolicy) {
    const twoImageFindings = [];
    const decisionRel = batch.decision_authority?.two_image_retrofit_decision_path ?? null;
    const decisionPath = decisionRel ? join(repoRoot, decisionRel) : null;
    const decisionText = decisionPath && existsSync(decisionPath) ? readText(decisionPath) : '';
    const decisionSha = decisionPath && existsSync(decisionPath) ? sha256File(decisionPath) : null;
    const decisionId = parseDecisionIdFromText(decisionText);
    const retrofitRel = twoImagePolicy.retrofit_manifest_path ?? null;
    const retrofitPath = retrofitRel ? join(repoRoot, retrofitRel) : null;
    const retrofitSha = retrofitPath && existsSync(retrofitPath) ? sha256File(retrofitPath) : null;
    const retrofit = retrofitPath && existsSync(retrofitPath) ? readJson(retrofitPath) : null;
    const assetEvidenceRel = 'artifacts/mrx1000-release-10/assets/asset-evidence.json';
    const assetEvidencePath = join(repoRoot, assetEvidenceRel);
    const assetEvidence = existsSync(assetEvidencePath) ? readJson(assetEvidencePath) : null;
    const evidenceManifestRel = 'artifacts/mrx1000-release-10/evidence/_manifest.json';
    const evidenceManifestPath = join(repoRoot, evidenceManifestRel);
    const evidenceManifest = existsSync(evidenceManifestPath) ? readJson(evidenceManifestPath) : null;
    const expectedCorpusCount = twoImagePolicy.public_article_count ?? null;
    const expectedBatchCount = batch.articles?.length ?? 0;

    if (!decisionPath || !existsSync(decisionPath)) {
      twoImageFindings.push(`Missing two-image retrofit decision: ${decisionRel ?? '(unset)'}.`);
    } else {
      if (decisionId !== batch.decision_authority?.two_image_retrofit_decision_id) {
        twoImageFindings.push('Two-image retrofit decision ID mismatch.');
      }
      if (decisionSha !== batch.decision_authority?.two_image_retrofit_decision_sha256) {
        twoImageFindings.push('Two-image retrofit decision SHA-256 mismatch.');
      }
      if (!verifySidecar(decisionPath)) {
        twoImageFindings.push('Two-image retrofit decision sidecar is missing or stale.');
      }
      if (!/authorizes replacement and hash rebinding/i.test(decisionText)) {
        twoImageFindings.push('Two-image retrofit decision lacks source-and-asset rebind authority.');
      }
    }
    if (!retrofitPath || !existsSync(retrofitPath)) {
      twoImageFindings.push(`Missing two-image retrofit manifest: ${retrofitRel ?? '(unset)'}.`);
    } else {
      if (retrofitSha !== twoImagePolicy.retrofit_manifest_sha256) {
        twoImageFindings.push('Two-image retrofit manifest SHA-256 mismatch.');
      }
      if (
        !Number.isInteger(expectedCorpusCount) ||
        retrofit?.rows?.length !== expectedCorpusCount ||
        retrofit?.summary?.article_count !== expectedCorpusCount ||
        retrofit?.summary?.asset_count !== expectedCorpusCount * 2 ||
        retrofit?.summary?.unique_source_art_count !== expectedCorpusCount ||
        retrofit?.summary?.unique_hero_sha256_count !== expectedCorpusCount ||
        retrofit?.summary?.unique_inline_sha256_count !== expectedCorpusCount ||
        retrofit?.summary?.distinct_article_pair_count !== expectedCorpusCount ||
        retrofit?.summary?.hero_ocr_pass_count !== expectedCorpusCount ||
        retrofit?.summary?.inline_ocr_pass_count !== expectedCorpusCount ||
        retrofit?.summary?.exact_filename_identity_count !== expectedCorpusCount
      ) {
        twoImageFindings.push(
          `Two-image retrofit manifest does not prove the complete ${expectedCorpusCount ?? 'current'}-route corpus.`,
        );
      }
    }
    if (!assetEvidence || !verifySidecar(assetEvidencePath)) {
      twoImageFindings.push('Two-image release asset evidence is missing or has a stale sidecar.');
    } else if (
      assetEvidence.summary?.article_count !== expectedBatchCount ||
      assetEvidence.summary?.passing_article_count !== expectedBatchCount ||
      assetEvidence.summary?.all_assets_pass !== true ||
      assetEvidence.rows?.length !== expectedBatchCount ||
      assetEvidence.rows.some(
        (row) =>
          row.disposition !== 'PASS' ||
          row.assets?.length !== 3 ||
          !['hero', 'social', 'inline'].every((kind) =>
            row.assets.some(
              (asset) =>
                asset.kind === kind &&
                asset.disposition === 'PASS' &&
                asset.ocr_verified === true &&
                asset.filename_text_identity === true &&
                asset.canonical_surface_identity === true,
            ),
          ),
      )
    ) {
      twoImageFindings.push(
        `Two-image release asset evidence is incomplete or not PASS ${expectedBatchCount}/${expectedBatchCount}.`,
      );
    }
    if (!evidenceManifest || !verifySidecar(evidenceManifestPath)) {
      twoImageFindings.push('Two-image evidence-packet manifest is missing or has a stale sidecar.');
    } else if (
      evidenceManifest.packets?.length !== expectedBatchCount ||
      evidenceManifest.packets.some(
        (packet) =>
          packet.editorial_disposition !== 'PASS' ||
          packet.factual_citation_disposition !== 'PASS' ||
          packet.compliance_disposition !== 'PASS' ||
          packet.hold_reason != null,
      )
    ) {
      twoImageFindings.push(
        `Two-image evidence packets are not PASS ${expectedBatchCount}/${expectedBatchCount}.`,
      );
    }
    if (twoImagePolicy.authorized_source_and_asset_rebinding !== true) {
      twoImageFindings.push('Two-image policy does not authorize source-and-asset hash rebinding.');
    }
    inputs.two_image_retrofit = {
      decision: {
        id: decisionId,
        path: decisionRel,
        sha256: decisionSha,
      },
      manifest: {
        path: retrofitRel,
        sha256: retrofitSha,
        summary: retrofit?.summary ?? null,
      },
      asset_evidence: {
        path: assetEvidenceRel,
        summary: assetEvidence?.summary ?? null,
      },
      evidence_packets: {
        path: evidenceManifestRel,
        packet_count: evidenceManifest?.packets?.length ?? 0,
      },
      findings: twoImageFindings,
      disposition: twoImageFindings.length === 0 ? 'PASS' : 'HOLD',
    };
    blocking.push(...twoImageFindings);
    twoImageRebindActive = twoImageFindings.length === 0;
  }
  if (exactAdmissionEnabled) {
    const observedCount = batch.articles?.length ?? 0;
    const observedSlateSha = sha256(
      Buffer.from(canonicalizeExactSlate(batch.articles ?? []), 'utf8'),
    );
    inputs.exact_admission = {
      enabled: true,
      configured_exact_count: exactCount,
      configured_cap: batch.policy?.authorization_cap_released_articles ?? null,
      configured_exact_slate_sha256: exactSlateSha,
      observed_article_count: observedCount,
      observed_exact_slate_sha256: observedSlateSha,
      admission_mode: batch.policy?.admission_mode ?? 'historical_exact_batch',
    };
    if (
      !continuousQualityGated &&
      batch.policy?.authorization_cap_released_articles !== exactCount
    ) {
      blocking.push(
        `Exact-admission cap mismatch: authorization_cap_released_articles=${batch.policy?.authorization_cap_released_articles ?? '(unset)'} but exact_admitted_count=${exactCount}.`,
      );
    }
    if (
      continuousQualityGated &&
      (!Number.isInteger(batch.policy?.authorization_cap_released_articles) ||
        batch.policy.authorization_cap_released_articles < exactCount)
    ) {
      blocking.push(
        `Continuous quality-gated program scope is smaller than the admitted manifest: scope=${batch.policy?.authorization_cap_released_articles ?? '(unset)'}, admitted=${exactCount}.`,
      );
    }
    if (observedCount !== exactCount) {
      blocking.push(
        `Exact-admission row count mismatch: expected exactly ${exactCount} rows, observed ${observedCount}.`,
      );
    }
    if (exactSlateSha !== observedSlateSha) {
      blocking.push(
        `Exact-admission slate SHA-256 mismatch: expected ${exactSlateSha ?? '(unset)'}, got ${observedSlateSha}.`,
      );
    }

    if (continuousQualityGated) {
      const ownerDecisionRel =
        batch.decision_authority?.owner_continuous_publication_decision_path ?? null;
      const ownerDecisionPath = ownerDecisionRel ? join(repoRoot, ownerDecisionRel) : null;
      const expectedOwnerDecisionId =
        batch.decision_authority?.owner_continuous_publication_decision_id ?? null;
      const expectedOwnerDecisionSha =
        batch.decision_authority?.owner_continuous_publication_decision_sha256 ?? null;
      const observedOwnerDecisionSha =
        ownerDecisionPath && existsSync(ownerDecisionPath) ? sha256File(ownerDecisionPath) : null;
      const ownerDecisionText =
        ownerDecisionPath && existsSync(ownerDecisionPath) ? readText(ownerDecisionPath) : '';
      const observedOwnerDecisionId = parseDecisionIdFromText(ownerDecisionText);
      inputs.exact_admission.owner_continuous_publication_decision = {
        id: expectedOwnerDecisionId,
        path: ownerDecisionRel,
        expected_sha256: expectedOwnerDecisionSha,
        observed_id: observedOwnerDecisionId,
        observed_sha256: observedOwnerDecisionSha,
      };
      if (!ownerDecisionPath || !existsSync(ownerDecisionPath)) {
        blocking.push(
          `Missing owner continuous-publication decision: ${ownerDecisionRel ?? '(unset)'}.`,
        );
      } else {
        if (expectedOwnerDecisionId !== observedOwnerDecisionId) {
          blocking.push(
            `Owner continuous-publication decision ID mismatch: expected ${expectedOwnerDecisionId ?? '(unset)'}, got ${observedOwnerDecisionId ?? '(missing)'}.`,
          );
        }
        if (expectedOwnerDecisionSha !== observedOwnerDecisionSha) {
          blocking.push(
            `Owner continuous-publication decision SHA-256 mismatch: expected ${expectedOwnerDecisionSha ?? '(unset)'}, got ${observedOwnerDecisionSha}.`,
          );
        }
        if (!/Article count is not a publication gate\./.test(ownerDecisionText)) {
          blocking.push(
            'Owner continuous-publication decision is missing its controlling article-count statement.',
          );
        }
      }
    }

    const admissionDecisionRel = batch.decision_authority?.batch_admission_decision_path;
    const admissionDecisionPath = admissionDecisionRel
      ? join(repoRoot, admissionDecisionRel)
      : null;
    const configuredAdmissionDecisionId =
      batch.decision_authority?.batch_admission_decision_id ?? null;
    const configuredAdmissionDecisionSha =
      batch.decision_authority?.batch_admission_decision_sha256 ?? null;
    inputs.exact_admission.decision = {
      id: configuredAdmissionDecisionId,
      path: admissionDecisionRel ?? null,
      expected_sha256: configuredAdmissionDecisionSha,
      observed_sha256: null,
    };
    let admissionDecisionText = null;
    let admissionDecisionRows = [];
    let heroRebindingRows = [];
    if (!admissionDecisionPath || !existsSync(admissionDecisionPath)) {
      blocking.push(
        `Missing batch-admission decision artifact: ${admissionDecisionRel ?? '(unset)'}.`,
      );
    } else {
      admissionDecisionText = readText(admissionDecisionPath);
      const admissionDecisionSha = sha256File(admissionDecisionPath);
      const admissionDecisionId = parseDecisionIdFromText(admissionDecisionText);
      admissionDecisionRows = parseExactDecisionRows(admissionDecisionText);
      inputs.exact_admission.decision.observed_sha256 = admissionDecisionSha;
      inputs.exact_admission.decision.observed_id = admissionDecisionId;
      inputs.exact_admission.decision.bound_exact_rows = admissionDecisionRows.length;
      if (configuredAdmissionDecisionSha !== admissionDecisionSha) {
        blocking.push(
          `Batch-admission decision SHA-256 mismatch: expected ${configuredAdmissionDecisionSha ?? '(unset)'}, got ${admissionDecisionSha}.`,
        );
      }
      if (configuredAdmissionDecisionId !== admissionDecisionId) {
        blocking.push(
          `Batch-admission decision ID mismatch: expected ${configuredAdmissionDecisionId ?? '(unset)'}, got ${admissionDecisionId ?? '(missing)'}.`,
        );
      }
      if (
        args.expectedDecisionSha &&
        admissionDecisionSha !== args.expectedDecisionSha.toLowerCase()
      ) {
        blocking.push(
          `Batch-admission decision SHA-256 does not match --expected-decision-sha (got ${admissionDecisionSha}).`,
        );
      }
      if (!verifySidecar(admissionDecisionPath)) {
        blocking.push(
          `Batch-admission decision SHA-256 sidecar is missing or stale for ${admissionDecisionRel}.`,
        );
      }
    }

    const heroRebindingRel =
      batch.decision_authority?.batch_admission_hero_rebinding_addendum_path ?? null;
    const heroRebindingPath = heroRebindingRel ? join(repoRoot, heroRebindingRel) : null;
    const configuredHeroRebindingId =
      batch.decision_authority?.batch_admission_hero_rebinding_addendum_id ?? null;
    const configuredHeroRebindingSha =
      batch.decision_authority?.batch_admission_hero_rebinding_addendum_sha256 ?? null;
    inputs.exact_admission.hero_rebinding_addendum = {
      id: configuredHeroRebindingId,
      path: heroRebindingRel,
      expected_sha256: configuredHeroRebindingSha,
      observed_id: null,
      observed_sha256: null,
      bound_exact_rows: 0,
    };
    if (heroRebindingRel || configuredHeroRebindingId || configuredHeroRebindingSha) {
      if (!heroRebindingPath || !existsSync(heroRebindingPath)) {
        blocking.push(
          `Missing hero-rebinding addendum artifact: ${heroRebindingRel ?? '(unset)'}.`,
        );
      } else {
        const heroRebindingText = readText(heroRebindingPath);
        const heroRebindingSha = sha256File(heroRebindingPath);
        const heroRebindingId =
          heroRebindingText.match(/^\- Addendum ID:\s*\*\*(.+?)\*\*$/m)?.[1]?.trim() ??
          parseDecisionIdFromText(heroRebindingText);
        heroRebindingRows = parseExactHeroRebindingAddendumRows(heroRebindingText);
        inputs.exact_admission.hero_rebinding_addendum.observed_sha256 = heroRebindingSha;
        inputs.exact_admission.hero_rebinding_addendum.observed_id = heroRebindingId;
        inputs.exact_admission.hero_rebinding_addendum.bound_exact_rows = heroRebindingRows.length;
        if (configuredHeroRebindingSha !== heroRebindingSha) {
          blocking.push(
            `Hero-rebinding addendum SHA-256 mismatch: expected ${configuredHeroRebindingSha ?? '(unset)'}, got ${heroRebindingSha}.`,
          );
        }
        if (configuredHeroRebindingId !== heroRebindingId) {
          blocking.push(
            `Hero-rebinding addendum ID mismatch: expected ${configuredHeroRebindingId ?? '(unset)'}, got ${heroRebindingId ?? '(missing)'}.`,
          );
        }
        if (!verifySidecar(heroRebindingPath)) {
          blocking.push(
            `Hero-rebinding addendum SHA-256 sidecar is missing or stale for ${heroRebindingRel}.`,
          );
        }
      }
    }

    const gscRecoveryRel =
      batch.decision_authority?.batch_admission_gsc_recovery_addendum_path ?? null;
    const gscRecoveryPath = gscRecoveryRel ? join(repoRoot, gscRecoveryRel) : null;
    const configuredGscRecoveryId =
      batch.decision_authority?.batch_admission_gsc_recovery_addendum_id ?? null;
    const configuredGscRecoverySha =
      batch.decision_authority?.batch_admission_gsc_recovery_addendum_sha256 ?? null;
    inputs.exact_admission.gsc_recovery_addendum = {
      id: configuredGscRecoveryId,
      path: gscRecoveryRel,
      expected_sha256: configuredGscRecoverySha,
      observed_id: null,
      observed_sha256: null,
    };
    let gscRecoveryText = null;
    if (configuredGscRecoveryId !== 'D-2026-0801-10B') {
      blocking.push('Exact admission requires GSC recovery addendum ID D-2026-0801-10B.');
    }
    if (!gscRecoveryRel) {
      blocking.push('Exact admission requires a GSC recovery addendum path.');
    }
    if (!/^[a-f0-9]{64}$/i.test(configuredGscRecoverySha ?? '')) {
      blocking.push('Exact admission requires a valid GSC recovery addendum SHA-256.');
    }
    if (!gscRecoveryPath || !existsSync(gscRecoveryPath)) {
      blocking.push(`Missing GSC recovery addendum artifact: ${gscRecoveryRel ?? '(unset)'}.`);
    } else {
      gscRecoveryText = readText(gscRecoveryPath);
      const gscRecoverySha = sha256File(gscRecoveryPath);
      const gscRecoveryId = parseDecisionIdFromText(gscRecoveryText);
      inputs.exact_admission.gsc_recovery_addendum.observed_sha256 = gscRecoverySha;
      inputs.exact_admission.gsc_recovery_addendum.observed_id = gscRecoveryId;
      if (configuredGscRecoverySha !== gscRecoverySha) {
        blocking.push(
          `GSC recovery addendum SHA-256 mismatch: expected ${configuredGscRecoverySha ?? '(unset)'}, got ${gscRecoverySha}.`,
        );
      }
      if (configuredGscRecoveryId !== gscRecoveryId) {
        blocking.push(
          `GSC recovery addendum ID mismatch: expected ${configuredGscRecoveryId ?? '(unset)'}, got ${gscRecoveryId ?? '(missing)'}.`,
        );
      }
      if (!verifySidecar(gscRecoveryPath)) {
        blocking.push(
          `GSC recovery addendum SHA-256 sidecar is missing or stale for ${gscRecoveryRel}.`,
        );
      }
    }

    const releaseEvidenceBindings = batch.release_evidence_bindings ?? {};
    for (const requiredBinding of [
      'gsc_url_inspection_json',
      'gsc_url_inspection_md',
      'retained_production_baseline_manifest_json',
    ]) {
      if (!releaseEvidenceBindings[requiredBinding]) {
        blocking.push(
          `Missing required exact-admission release evidence binding: ${requiredBinding}.`,
        );
      }
    }
    inputs.exact_admission.release_evidence_bindings = {};
    for (const [key, binding] of Object.entries(releaseEvidenceBindings)) {
      const relPath = binding?.path ?? null;
      const expectedSha = binding?.sha256 ?? null;
      const absPath = relPath ? join(repoRoot, relPath) : null;
      const exists = !!absPath && existsSync(absPath);
      const observedSha = exists ? sha256File(absPath) : null;
      inputs.exact_admission.release_evidence_bindings[key] = {
        path: relPath,
        expected_sha256: expectedSha,
        observed_sha256: observedSha,
        sidecar_verified: exists ? verifySidecar(absPath) : false,
      };
      if (!exists) {
        blocking.push(`Missing bound release evidence artifact ${key}: ${relPath ?? '(unset)'}.`);
        continue;
      }
      if (observedSha !== expectedSha) {
        blocking.push(
          `Bound release evidence SHA-256 mismatch for ${key}: expected ${expectedSha ?? '(unset)'}, got ${observedSha}.`,
        );
      }
      if (!verifySidecar(absPath)) {
        blocking.push(`Bound release evidence sidecar is missing or stale for ${relPath}.`);
      }
      if (key.endsWith('_json')) {
        verifiedReleaseEvidence[key] = readJson(absPath);
      }
    }

    const boundPreEdit = loadBoundPreEditBatch(
      batch.decision_authority?.batch_admission_bound_pre_edit_batch_path ?? null,
      batch.decision_authority?.batch_admission_bound_pre_edit_batch_sha256 ?? null,
    );
    inputs.exact_admission.pre_edit_batch = {
      available: boundPreEdit.available,
      path: boundPreEdit.path,
      sidecar_verified: boundPreEdit.sidecar_verified,
      expected_sha256:
        batch.decision_authority?.batch_admission_bound_pre_edit_batch_sha256 ?? null,
      observed_sha256: boundPreEdit.sha256,
      matches_expected: boundPreEdit.matches_expected,
    };
    if (!boundPreEdit.available || !boundPreEdit.batch) {
      blocking.push(
        `Exact-admission pre-edit batch snapshot is missing or unreadable: ${boundPreEdit.path ?? '(unset)'}.`,
      );
    } else {
      const gscBindingJson = releaseEvidenceBindings.gsc_url_inspection_json ?? null;
      const gscBindingMd = releaseEvidenceBindings.gsc_url_inspection_md ?? null;
      blocking.push(
        ...validateBoundGscRecoveryEvidence({
          gscJson: verifiedReleaseEvidence.gsc_url_inspection_json ?? null,
          addendumText: gscRecoveryText,
          expectedJsonSha: gscBindingJson?.sha256 ?? null,
          expectedMdSha: gscBindingMd?.sha256 ?? null,
          expectedBatchSha:
            batch.decision_authority?.batch_admission_bound_pre_edit_batch_sha256 ?? null,
          expectedRows: boundPreEdit.batch.articles ?? [],
        }),
      );
      blocking.push(
        ...validateRetainedProductionBaseline({
          manifest: verifiedReleaseEvidence.retained_production_baseline_manifest_json ?? null,
        }),
      );
      if (!boundPreEdit.sidecar_verified) {
        blocking.push(
          `Exact-admission pre-edit batch sidecar is missing or stale for ${boundPreEdit.path}.`,
        );
      }
      if (boundPreEdit.matches_expected === false) {
        blocking.push(
          `Exact-admission pre-edit batch SHA-256 mismatch: expected ${batch.decision_authority?.batch_admission_bound_pre_edit_batch_sha256 ?? '(unset)'}, got ${boundPreEdit.sha256}.`,
        );
      }
      const preservedRows = batch.articles.slice(0, boundPreEdit.batch.articles.length);
      if (
        !twoImageRebindActive &&
        canonicalizeExactSlate(preservedRows) !==
        canonicalizeExactSlate(boundPreEdit.batch.articles ?? [])
      ) {
        blocking.push(
          'Existing authorized rows 1..10 are not preserved verbatim from the bound pre-edit batch.',
        );
      }

      const continuousStartRank = Number(
        batch.policy?.continuous_quality_gated_from_selection_rank ?? exactCount + 1,
      );
      const historicalExactCount = continuousQualityGated ? continuousStartRank - 1 : exactCount;
      const expectedAppendedCount =
        historicalExactCount - (boundPreEdit.batch.articles?.length ?? 0);
      const appendedRows = batch.articles.slice(
        boundPreEdit.batch.articles.length,
        historicalExactCount,
      );
      inputs.exact_admission.appended_rows = {
        expected_count: expectedAppendedCount,
        observed_count: appendedRows.length,
      };
      if (expectedAppendedCount <= 0) {
        blocking.push(
          `Exact-admission append count must be positive; got ${expectedAppendedCount}.`,
        );
      }
      if (admissionDecisionRows.length !== expectedAppendedCount) {
        blocking.push(
          `Batch-admission decision exact-row count mismatch: expected ${expectedAppendedCount}, got ${admissionDecisionRows.length}.`,
        );
      }
      if (appendedRows.length !== expectedAppendedCount) {
        blocking.push(
          `Exact-admission appended row count mismatch: expected ${expectedAppendedCount}, got ${appendedRows.length}.`,
        );
      }
      const heroRebindingConfigured =
        Boolean(heroRebindingRel) ||
        Boolean(configuredHeroRebindingId) ||
        Boolean(configuredHeroRebindingSha);
      if (heroRebindingConfigured && heroRebindingRows.length !== expectedAppendedCount) {
        blocking.push(
          `Hero-rebinding addendum exact-row count mismatch: expected ${expectedAppendedCount}, got ${heroRebindingRows.length}.`,
        );
      }

      const wave2QaRows = verifiedReleaseEvidence.wave2_pre_release_qa_json?.rows ?? [];
      const wave2ManifestRows = verifiedReleaseEvidence.wave2_release_manifest_json?.rows ?? [];
      const creativeQa = verifiedReleaseEvidence.wave2_creative_revalidation_json ?? null;
      const creativeQaRows = creativeQa?.rows ?? [];
      const creativeRemediation = verifiedReleaseEvidence.wave2_creative_remediation_json ?? null;
      const creativeRemediationRows = creativeRemediation?.rows ?? [];
      const qaBySlug = new Map(wave2QaRows.map((row) => [row.slug, row]));
      const manifestBySlug = new Map(wave2ManifestRows.map((row) => [row.slug, row]));
      const creativeQaBySlug = new Map(creativeQaRows.map((row) => [row.slug, row]));
      const creativeRemediationBySlug = new Map(
        creativeRemediationRows.map((row) => [row.slug, row]),
      );
      if (
        !twoImageRebindActive &&
        (creativeRemediation?.summary?.article_count !== expectedAppendedCount ||
          creativeRemediation?.summary?.passing_article_count !== expectedAppendedCount ||
          creativeRemediation?.summary?.exact_sha_duplicate_count !== 0 ||
          Number(creativeRemediation?.summary?.minimum_production_9x8_hamming_distance ?? 0) < 9 ||
          creativeRemediation?.summary?.exact_titles_visible_at_all_three_sizes !== true ||
          creativeRemediation?.summary?.all_assets_pass !== true ||
          creativeRemediation?.summary?.disposition !== 'PASS')
      ) {
        blocking.push(
          'Wave 2 creative remediation packet is missing, stale, incomplete, or not PASS for all exact-admission rows.',
        );
      }
      if (
        !twoImageRebindActive &&
        (creativeQa?.final_disposition !== 'PASS' ||
          creativeQa?.summary?.article_count !== expectedAppendedCount ||
          creativeQa?.summary?.pass_count !== expectedAppendedCount ||
          creativeQa?.summary?.hold_count !== 0 ||
          creativeQa?.summary?.all_pass !== true ||
          creativeQa?.summary?.exact_sha_duplicates_found !== 0 ||
          Number(creativeQa?.summary?.minimum_nearest_nonself_hamming_distance ?? 0) < 9 ||
          creativeQa?.comparison_universe?.image_count !== 142)
      ) {
        blocking.push(
          'Fresh Wave 2 creative revalidation summary is missing, stale, incomplete, or not PASS across the 142-image 9x8 comparison universe.',
        );
      }
      const observedAppendRows = [];
      for (let index = 0; index < appendedRows.length; index += 1) {
        const entry = appendedRows[index];
        const bound = admissionDecisionRows[index] ?? null;
        const heroRebinding = heroRebindingRows[index] ?? null;
        const qa = qaBySlug.get(entry.slug) ?? null;
        const manifest = manifestBySlug.get(entry.slug) ?? null;
        const creativeQaRow = creativeQaBySlug.get(entry.slug) ?? null;
        const creativeRemediationRow = creativeRemediationBySlug.get(entry.slug) ?? null;
        const observed = {
          selection_rank: entry.selection_rank,
          program_row_id: entry.program_row_id,
          slug: entry.slug,
          title: entry.title,
          article_sha256:
            (entry.article_sha256 ?? entry.repo_sha256 ?? null)?.toLowerCase?.() ?? null,
          hero_sha256:
            (entry.hero_asset_sha256 ?? entry.hero_sha256 ?? null)?.toLowerCase?.() ?? null,
          finalization_state: entry.finalization_state ?? null,
          admission_status: entry.admission_status ?? null,
        };
        observedAppendRows.push(observed);
        if (observed.selection_rank !== boundPreEdit.batch.articles.length + index + 1) {
          blocking.push(
            `Exact-admission selection rank mismatch for ${entry.slug}: expected ${boundPreEdit.batch.articles.length + index + 1}, got ${observed.selection_rank}.`,
          );
        }
        if (observed.finalization_state !== 'draft_noindex_admitted') {
          blocking.push(
            `Exact-admission finalization_state mismatch for ${entry.slug}: expected draft_noindex_admitted.`,
          );
        }
        if (observed.admission_status !== 'admitted_exact') {
          blocking.push(
            `Exact-admission admission_status mismatch for ${entry.slug}: expected admitted_exact.`,
          );
        }
        if (!bound) {
          blocking.push(
            `Exact-admission row ${entry.slug} is missing from the signed batch-admission decision ordering.`,
          );
          continue;
        }
        if (
          heroRebinding &&
          (heroRebinding.program_row_id !== bound.program_row_id ||
            heroRebinding.slug !== bound.slug ||
            heroRebinding.title !== bound.title ||
            heroRebinding.article_sha256 !== bound.article_sha256 ||
            heroRebinding.prior_hero_sha256 !== bound.hero_sha256)
        ) {
          blocking.push(
            `Hero-rebinding addendum mismatch for ${entry.slug}: it must preserve the parent decision row identity/article hash and supersede only the hero SHA-256.`,
          );
        }
        const expectedHeroSha = heroRebinding?.corrected_hero_sha256 ?? bound.hero_sha256;
        if (
          observed.program_row_id !== bound.program_row_id ||
          observed.slug !== bound.slug ||
          observed.title !== bound.title ||
          (!twoImageRebindActive &&
            (observed.article_sha256 !== bound.article_sha256 ||
              observed.hero_sha256 !== expectedHeroSha))
        ) {
          blocking.push(
            `Exact-admission decision binding mismatch for ${entry.slug}: program_row_id/slug/title/article_sha256 must match D-2026-0801-10 in exact order and hero_sha256 must match the controlling CEO binding${heroRebinding ? ' (D-2026-0801-10A corrected hero addendum)' : ''}.`,
          );
        }
        if (!qa) {
          blocking.push(
            `Exact-admission QA binding missing for ${entry.slug} in wave2_pre_release_qa_json.`,
          );
        } else if (
          qa.row_id !== observed.program_row_id ||
          qa.slug !== observed.slug ||
          qa.title !== observed.title ||
          qa.article_sha256?.toLowerCase() !== bound.article_sha256 ||
          qa.asset?.sha256?.toLowerCase() !== bound.hero_sha256 ||
          qa.final_status !== 'PASS'
        ) {
          blocking.push(
            `Historical exact-admission QA binding mismatch for ${entry.slug}: row/article identity must match D-2026-0801-10 and its asset SHA must match the parent decision's prior hero.`,
          );
        }
        if (!manifest) {
          blocking.push(
            `Exact-admission manifest binding missing for ${entry.slug} in wave2_release_manifest_json.`,
          );
        } else if (
          manifest.row_id !== observed.program_row_id ||
          manifest.slug !== observed.slug ||
          manifest.title !== observed.title ||
          manifest.asset?.sha256?.toLowerCase() !== bound.hero_sha256 ||
          manifest.status !== 'PASS'
        ) {
          blocking.push(
            `Historical exact-admission manifest binding mismatch for ${entry.slug}: row identity and prior hero must match D-2026-0801-10.`,
          );
        }
        const metadataChecks = creativeQaRow?.metadata_checks ?? {};
        const duplicateChecks = creativeQaRow?.duplicate_checks ?? {};
        const visualChecks = creativeQaRow?.visual_checks ?? {};
        if (!twoImageRebindActive && !creativeQaRow) {
          blocking.push(`Fresh creative revalidation row missing for ${entry.slug}.`);
        } else if (
          !twoImageRebindActive &&
          (creativeQaRow.program_row_id !== observed.program_row_id ||
            creativeQaRow.slug !== observed.slug ||
            creativeQaRow.title !== observed.title ||
            creativeQaRow.body_sha256?.toLowerCase() !== observed.article_sha256 ||
            creativeQaRow.asset?.sha256?.toLowerCase() !== observed.hero_sha256 ||
            creativeQaRow.hero_path_from_batch !== entry.hero_path ||
            creativeQaRow.same_hero_social_schema_path !== true ||
            creativeQaRow.final_disposition !== 'PASS' ||
            creativeQaRow.asset?.observed_width !== 1200 ||
            creativeQaRow.asset?.observed_height !== 630 ||
            creativeQaRow.asset?.observed_mime_type !== 'image/webp' ||
            Object.values(metadataChecks).some((value) => value !== true) ||
            duplicateChecks.exact_sha_duplicates_absent !== true ||
            duplicateChecks.nearest_nonself_distance_gte_9 !== true ||
            visualChecks.exact_title_visible_in_1200x630 !== true ||
            visualChecks.exact_title_visible_in_600x315 !== true ||
            visualChecks.exact_title_visible_in_300x158 !== true ||
            visualChecks.tiny_metadata_absent !== true ||
            visualChecks.truncation_absent !== true ||
            visualChecks.overlap_absent !== true ||
            visualChecks.clipping_absent !== true ||
            visualChecks.generic_duplicate_composition_absent !== true ||
            visualChecks.closing_costs_table_inside_frame === false)
        ) {
          blocking.push(
            `Fresh creative revalidation mismatch for ${entry.slug}: current hero identity, visual title, dimensions/MIME/alt metadata, and 9x8 uniqueness must all match D-2026-0801-10A.`,
          );
        }
        if (
          !twoImageRebindActive &&
          (!creativeRemediationRow ||
            creativeRemediationRow.program_row_id !== observed.program_row_id ||
            creativeRemediationRow.slug !== observed.slug ||
            creativeRemediationRow.title !== observed.title ||
            creativeRemediationRow.asset_public_path !== entry.hero_path ||
            creativeRemediationRow.sha256?.toLowerCase() !== observed.hero_sha256 ||
            creativeRemediationRow.observed_width !== 1200 ||
            creativeRemediationRow.observed_height !== 630 ||
            creativeRemediationRow.observed_mime_type !== 'image/webp' ||
            creativeRemediationRow.disposition !== 'PASS' ||
            Object.values(creativeRemediationRow.checks ?? {}).some((value) => value !== true) ||
            creativeRemediationRow.visual_checks?.['1200x630'] !== 'PASS' ||
            creativeRemediationRow.visual_checks?.['600x315'] !== 'PASS' ||
            creativeRemediationRow.visual_checks?.['300x158'] !== 'PASS')
        ) {
          blocking.push(
            `Creative remediation binding mismatch for ${entry.slug}: exact current hero/title/metadata/uniqueness proof must be PASS.`,
          );
        }
      }
      inputs.exact_admission.observed_append_rows = observedAppendRows;

      if (continuousQualityGated) {
        const continuousRows = batch.articles.slice(historicalExactCount);
        const expectedContinuousCount = exactCount - historicalExactCount;
        inputs.exact_admission.continuous_quality_gated_rows = {
          start_selection_rank: continuousStartRank,
          expected_count: expectedContinuousCount,
          observed_count: continuousRows.length,
          rows: [],
        };
        if (continuousStartRank < 1 || historicalExactCount < 25) {
          blocking.push(
            `Invalid continuous quality-gated start rank: ${continuousStartRank}. Historical exact-25 bindings must remain intact.`,
          );
        }
        if (continuousRows.length !== expectedContinuousCount) {
          blocking.push(
            `Continuous quality-gated row count mismatch: expected ${expectedContinuousCount}, got ${continuousRows.length}.`,
          );
        }
        const ids = new Set();
        const slugs = new Set();
        const canonicals = new Set();
        for (let index = 0; index < continuousRows.length; index += 1) {
          const entry = continuousRows[index];
          const expectedRank = continuousStartRank + index;
          const sourcePath = entry.repo_path ? join(repoRoot, entry.repo_path) : null;
          const source = sourcePath && existsSync(sourcePath) ? readFileSync(sourcePath) : null;
          const transition = source ? analyzeControlledPublicationTransition(source, entry) : null;
          inputs.exact_admission.continuous_quality_gated_rows.rows.push({
            selection_rank: entry.selection_rank ?? null,
            program_row_id: entry.program_row_id ?? null,
            slug: entry.slug ?? null,
            admission_status: entry.admission_status ?? null,
            finalization_state: entry.finalization_state ?? null,
            source_exists: Boolean(source),
            source_transition_authorized: transition?.authorized === true,
            source_transition_state: transition?.state ?? null,
          });
          if (entry.selection_rank !== expectedRank) {
            blocking.push(
              `Continuous quality-gated selection rank mismatch for ${entry.slug}: expected ${expectedRank}, got ${entry.selection_rank}.`,
            );
          }
          if (entry.admission_status !== 'admitted_quality_gated') {
            blocking.push(`Continuous quality-gated admission status mismatch for ${entry.slug}.`);
          }
          if (entry.finalization_state !== 'draft_noindex_admitted') {
            blocking.push(
              `Continuous quality-gated finalization state mismatch for ${entry.slug}.`,
            );
          }
          if (!source || transition?.authorized !== true) {
            blocking.push(
              `Continuous quality-gated reviewed bytes are missing or drifted for ${entry.slug}: ${transition?.reason ?? 'source_missing'}.`,
            );
          }
          if (!entry.evidence_packet_path_required || !entry.evidence_packet_path) {
            blocking.push(
              `Continuous quality-gated evidence packet declaration missing for ${entry.slug}.`,
            );
          }
          for (const [value, set, label] of [
            [entry.program_row_id, ids, 'program_row_id'],
            [entry.slug, slugs, 'slug'],
            [entry.canonical_url, canonicals, 'canonical_url'],
          ]) {
            if (!value || set.has(value)) {
              blocking.push(
                `Continuous quality-gated ${label} is missing or duplicated for ${entry.slug ?? '(unknown)'}.`,
              );
            }
            set.add(value);
          }
        }
      }
    }
    informational.push(
      continuousQualityGated
        ? 'Numerical scale gates are superseded by D-2026-0804-16. Historical exact-25 bindings remain verified; later rows are admitted continuously only with complete quality evidence.'
        : 'Controlling shortlist exact-match enforcement is superseded by exact_admitted_count + exact_admitted_slate_sha256 + batch admission decision bindings for this batch.',
    );
  } else {
    const shortlistRel = batch.decision_authority?.batch_source_admitted_shortlist_path;
    const shortlistPath = shortlistRel ? join(repoRoot, shortlistRel) : null;
    if (!shortlistPath || !existsSync(shortlistPath)) {
      blocking.push(`Missing controlling admitted shortlist: ${shortlistRel ?? '(unset)'}.`);
    } else {
      const shortlistSha = sha256File(shortlistPath);
      const shortlist = readJson(shortlistPath);
      const admitted = shortlist.admitted_shortlist ?? [];
      const admittedBySlug = new Map(admitted.map((entry) => [entry.slug, entry]));
      const configuredSlugs = new Set((batch.articles ?? []).map((entry) => entry.slug));
      const shortlistSlugs = new Set(admitted.map((entry) => entry.slug));
      inputs.admitted_shortlist = {
        path: shortlistRel,
        sha256: shortlistSha,
        expected_sha256: batch.decision_authority?.batch_source_admitted_shortlist_sha256 ?? null,
        configured_slug_count: configuredSlugs.size,
        admitted_slug_count: shortlistSlugs.size,
      };
      if (shortlistSha !== batch.decision_authority?.batch_source_admitted_shortlist_sha256) {
        blocking.push(
          `Controlling admitted shortlist SHA-256 mismatch: expected ${batch.decision_authority?.batch_source_admitted_shortlist_sha256 ?? '(unset)'}, got ${shortlistSha}.`,
        );
      }
      if (
        configuredSlugs.size !== shortlistSlugs.size ||
        [...configuredSlugs].some((slug) => !shortlistSlugs.has(slug))
      ) {
        blocking.push(
          'Configured release-10 slugs do not exactly match the controlling shortlist.',
        );
      }
      for (const entry of batch.articles ?? []) {
        const source = admittedBySlug.get(entry.slug);
        if (!source || source.program_row_id !== entry.source_shortlist_program_row_id) {
          blocking.push(
            `Shortlist provenance mismatch for ${entry.slug}: source_shortlist_program_row_id must match the controlling shortlist.`,
          );
        }
      }
    }
  }

  // --- 1. Signed CEO decision ---
  const decisionRel = batch.decision_authority?.successor_gate_decision_path;
  const decisionPath = decisionRel ? join(repoRoot, decisionRel) : null;
  let decision = null;
  if (decisionRel && existsSync(decisionPath)) {
    const text = readText(decisionPath);
    const sha = sha256File(decisionPath);
    decision = parseReleaseDecisionArtifact({
      path: relative(repoRoot, decisionPath),
      text,
      sha256: sha,
      expectedSha256: batch.decision_authority?.successor_gate_decision_sha256 ?? undefined,
    });
    inputs.decision = {
      path: relative(repoRoot, decisionPath),
      sha256: sha,
      decision_id: decision.decision_id,
      disposition: decision.disposition,
      release_authorized: decision.release_authorized,
      index_authorized: decision.index_authorized,
    };
    if (decision.signed === false) {
      blocking.push(
        `Successor decision SHA-256 mismatch: expected ${batch.decision_authority?.successor_gate_decision_sha256 ?? '(unset)'}, got ${sha}.`,
      );
    }
    if (
      !exactAdmissionEnabled &&
      args.expectedDecisionSha &&
      sha !== args.expectedDecisionSha.toLowerCase()
    ) {
      blocking.push(
        `Successor decision SHA-256 does not match --expected-decision-sha (got ${sha}).`,
      );
    }
    if (decision.disposition !== 'APPROVED') {
      blocking.push(
        `Successor decision disposition is ${decision.disposition}; only APPROVED dispositions can authorize release.`,
      );
    }
    if (!decision.release_authorized || !decision.index_authorized) {
      blocking.push(
        `Successor decision does not authorize release and/or indexing (release_authorized=${decision.release_authorized}, index_authorized=${decision.index_authorized}).`,
      );
    }
  } else {
    blocking.push(`Missing successor decision artifact: ${decisionRel ?? '(unset)'}.`);
  }

  // --- 2. Materialize the gate's authorized-batch shape ---
  const authorizedArticles = (batch.articles ?? []).map((a) => ({
    program_row_id: a.program_row_id,
    slug: a.canonical_slug ?? a.slug,
    title: a.canonical_title ?? a.title ?? a.canonical_slug ?? a.slug,
    canonical_url: a.canonical_url,
    pillar: a.pillar ?? null,
    cluster: a.cluster ?? null,
    evidence_packet_path: a.evidence_packet_path,
    evidence_packet_path_required: !!a.evidence_packet_path_required,
    content_genius_article_uuid: a.content_genius_article_uuid ?? null,
  }));
  const authorizedBatch = {
    authorization_cap_released_articles:
      batch.policy?.authorization_cap_released_articles ?? batch.articles?.length ?? 0,
    articles: authorizedArticles,
    decision_authority: {
      capping_decision_id: batch.decision_authority?.capping_decision_id ?? '',
      capping_decision_path: batch.decision_authority?.capping_decision_path ?? '',
      capping_decision_sha256: batch.decision_authority?.capping_decision_sha256 ?? '',
      successor_gate_decision_id: batch.decision_authority?.successor_gate_decision_id ?? '',
      successor_gate_decision_path: batch.decision_authority?.successor_gate_decision_path ?? '',
      successor_gate_decision_sha256:
        batch.decision_authority?.successor_gate_decision_sha256 ?? '',
    },
    policy: {
      authorization_cap_released_articles:
        batch.policy?.authorization_cap_released_articles ?? batch.articles?.length ?? 0,
      fail_closed: batch.policy?.fail_closed !== false,
      earned_scale_gates: batch.policy?.earned_scale_gates ?? [],
    },
  };
  const admittedLookup = buildAuthorizedAdmittedLookup(authorizedArticles);

  // --- 3. Ledger, legacy rows, and sitemap ---
  const ledgerRel = 'config/mrx-1000-canonical-content-ledger.json';
  const ledgerPath = join(repoRoot, ledgerRel);
  if (!existsSync(ledgerPath)) {
    blocking.push(`Missing canonical ledger: ${ledgerRel}.`);
  }
  const ledger = existsSync(ledgerPath) ? readJson(ledgerPath) : { articles: [] };
  const legacyRows = legacyLiveRowsFromLedger(ledger.articles ?? []);
  const legacyLookup = buildPublicLiveLegacyLookup(legacyRows);
  const sitemapUrls = listSitemapUrls();
  inputs.ledger = {
    path: ledgerRel,
    sha256: sha256File(ledgerPath),
    total_rows: ledger.articles?.length ?? 0,
    legacy_live_rows: legacyRows.length,
    sitemap_indexed_urls: sitemapUrls.size,
  };
  const identityLedgerRel = batch.identity_authority?.canonical_ledger_path;
  const identityLedgerSha = existsSync(ledgerPath) ? sha256File(ledgerPath) : null;
  inputs.ledger.identity_authority = {
    path: identityLedgerRel ?? null,
    expected_sha256: batch.identity_authority?.canonical_ledger_sha256 ?? null,
    observed_sha256: identityLedgerSha,
    strategy: batch.identity_authority?.program_row_id_strategy ?? null,
  };
  if (identityLedgerRel !== ledgerRel) {
    blocking.push(
      `Batch identity authority must reference ${ledgerRel} (got ${identityLedgerRel ?? '(unset)'}).`,
    );
  }
  if (identityLedgerSha !== batch.identity_authority?.canonical_ledger_sha256) {
    blocking.push(
      `Canonical ledger SHA-256 mismatch: expected ${batch.identity_authority?.canonical_ledger_sha256 ?? '(unset)'}, got ${identityLedgerSha ?? '(missing)'}.`,
    );
  }
  if (ledger.identity_registry?.strategy !== 'preserve_program_row_id_by_canonical_slug') {
    blocking.push(
      'Canonical ledger does not declare stable program-row identity by canonical slug.',
    );
  }

  const ledgerBySlug = new Map(
    (ledger.articles ?? []).map((article) => [article.canonical_slug, article]),
  );
  const identityMismatches = [];
  for (const entry of authorizedArticles) {
    const canonical = ledgerBySlug.get(entry.slug);
    if (!canonical) {
      identityMismatches.push({ slug: entry.slug, reason: 'slug_missing_from_canonical_ledger' });
      blocking.push(`Authorized slug ${entry.slug} is missing from the canonical ledger.`);
      continue;
    }
    const mismatchedFields = [];
    if (canonical.program_row_id !== entry.program_row_id) mismatchedFields.push('program_row_id');
    if (normalizeUrl(canonical.canonical_url) !== normalizeUrl(entry.canonical_url)) {
      mismatchedFields.push('canonical_url');
    }
    if (canonical.pillar !== entry.pillar) mismatchedFields.push('pillar');
    if (canonical.cluster !== entry.cluster) mismatchedFields.push('cluster');
    if (mismatchedFields.length) {
      identityMismatches.push({
        slug: entry.slug,
        reason: 'batch_identity_mismatch',
        fields: mismatchedFields,
        batch_program_row_id: entry.program_row_id,
        ledger_program_row_id: canonical.program_row_id,
      });
      blocking.push(
        `Authorized batch identity for ${entry.slug} disagrees with the canonical ledger (${mismatchedFields.join(', ')}).`,
      );
    }
  }
  inputs.ledger.authorized_batch_identity_mismatches = identityMismatches;

  // Publication state for hash-locked exact-admission and later continuous
  // quality-gated rows is derived from each current MDX only after the
  // byte-exact controlled-frontmatter transition proves valid. The historical
  // D-04 ledger remains the identity authority until post-publication
  // verification refreshes its production state.
  const publicationOverrides = new Map();
  const publicationOverrideSummary = [];
  for (const entry of batch.articles ?? []) {
    if (!['admitted_exact', 'admitted_quality_gated'].includes(entry.admission_status)) continue;
    const sourcePath = entry.repo_path ? join(repoRoot, entry.repo_path) : null;
    const sourceBytes = sourcePath && existsSync(sourcePath) ? readFileSync(sourcePath) : null;
    const transition = sourceBytes
      ? analyzeControlledPublicationTransition(sourceBytes, entry)
      : null;
    if (!transition?.authorized) {
      blocking.push(
        `Exact-admission runtime publication state cannot be derived for ${entry.slug}: ${transition?.reason ?? 'source_missing'}.`,
      );
      continue;
    }
    const sourceText = sourceBytes?.toString('utf8') ?? '';
    const reviewedCurrentPublished =
      twoImageRebindActive &&
      transition.state === 'reviewed_bytes_current' &&
      /^publication_status:\s*published\s*$/m.test(sourceText) &&
      !/^draft:\s*true\s*$/m.test(sourceText) &&
      !/^noindex:\s*true\s*$/m.test(sourceText);
    const isPublished =
      transition.state === 'controlled_publication_transition' || reviewedCurrentPublished;
    publicationOverrides.set(entry.slug, {
      publication_status: isPublished ? 'published' : 'draft',
      draft: false,
      noindex: !isPublished,
    });
    publicationOverrideSummary.push({
      program_row_id: entry.program_row_id,
      slug: entry.slug,
      state: transition.state,
      current_body_sha256: transition.current_body_sha256,
      normalized_body_sha256: transition.normalized_body_sha256,
    });
  }
  inputs.ledger.runtime_publication_overrides = publicationOverrideSummary;

  const rows = deriveStagesForLedger(
    ledger.articles ?? [],
    sitemapUrls,
    admittedLookup,
    legacyLookup,
    publicationOverrides,
  );

  // --- 4. Evidence packets ---
  const evidenceBySlug = new Map();
  let missingPacketCount = 0;
  let passingPacketCount = 0;
  let holdPacketCount = 0;
  const packetDispositionSummary = [];
  for (const entry of authorizedArticles) {
    const packetPath = join(repoRoot, entry.evidence_packet_path);
    if (!existsSync(packetPath)) {
      missingPacketCount += 1;
      packetDispositionSummary.push({
        slug: entry.slug,
        path: entry.evidence_packet_path,
        editorial: 'MISSING',
        factual_citation: 'MISSING',
        compliance: 'MISSING',
        hold_reason: 'packet_file_missing',
      });
      blocking.push(
        `Evidence packet missing for ${entry.slug}; expected at ${entry.evidence_packet_path}.`,
      );
      continue;
    }
    if (!verifySidecar(packetPath)) {
      blocking.push(`Evidence packet SHA-256 sidecar is missing or stale for ${entry.slug}.`);
      continue;
    }
    const packet = readJson(packetPath);
    evidenceBySlug.set(entry.slug, packet);
    const bodyPath = join(
      repoRoot,
      batch.articles.find((article) => article.slug === entry.slug)?.repo_path ?? '',
    );
    const bodySha = existsSync(bodyPath) ? sha256File(bodyPath) : null;
    const batchEntry = batch.articles.find((article) => article.slug === entry.slug) ?? null;
    const sourceBytes = existsSync(bodyPath) ? readFileSync(bodyPath) : null;
    const transition =
      sourceBytes && batchEntry
        ? analyzeControlledPublicationTransition(sourceBytes, batchEntry)
        : null;
    const identityFailures = [];
    if (packet.program_row_id !== entry.program_row_id) identityFailures.push('program_row_id');
    if (packet.slug !== entry.slug) identityFailures.push('slug');
    if (packet.title !== entry.title) identityFailures.push('title');
    if (normalizeUrl(packet.canonical_url) !== normalizeUrl(entry.canonical_url))
      identityFailures.push('canonical_url');
    if (
      packet.body_path_declared !==
      batch.articles.find((article) => article.slug === entry.slug)?.repo_path
    ) {
      identityFailures.push('body_path_declared');
    }
    if (packet.body_sha256 !== bodySha) identityFailures.push('body_sha256');
    if (
      !transition?.authorized ||
      packet.body_sha256_matches_declared_or_authorized_transition !== true ||
      !transitionProofMatches(packet.controlled_publication_transition, transition)
    ) {
      identityFailures.push('controlled_publication_transition');
    }
    if (identityFailures.length) {
      blocking.push(
        `Evidence packet identity/hash mismatch for ${entry.slug}: ${identityFailures.join(', ')}.`,
      );
    }
    const ed = packet.editorial_disposition ?? 'MISSING';
    const fc = packet.factual_citation_disposition ?? 'MISSING';
    const cm = packet.compliance_disposition ?? 'MISSING';
    const allPass = ed === 'PASS' && fc === 'PASS' && cm === 'PASS';
    if (allPass) passingPacketCount += 1;
    else {
      holdPacketCount += 1;
      if (packet.hold_reason) {
        informational.push(`Evidence packet ${entry.slug} HOLD: ${packet.hold_reason}.`);
      }
    }
    packetDispositionSummary.push({
      slug: entry.slug,
      path: entry.evidence_packet_path,
      editorial: ed,
      factual_citation: fc,
      compliance: cm,
      hold_reason: packet.hold_reason ?? null,
    });
    if (packet.body_sha256_matches_declared_or_authorized_transition !== true) {
      blocking.push(
        `Body SHA-256 for ${entry.slug} matches neither the reviewed bytes nor the exact controlled publication transition.`,
      );
    }
  }
  inputs.evidence = {
    packets_required: authorizedArticles.length,
    packets_present: evidenceBySlug.size,
    packets_passing: passingPacketCount,
    packets_hold_or_failing: holdPacketCount,
    packets_missing: missingPacketCount,
    per_packet: packetDispositionSummary,
  };

  // --- 5. Optional SLUG-level PASS requirement ---
  if (args.requirePassOnArticles.length) {
    for (const slug of args.requirePassOnArticles) {
      const summary = packetDispositionSummary.find((p) => p.slug === slug);
      if (!summary) {
        blocking.push(`--require-pass-on-articles referenced unknown slug: ${slug}.`);
        continue;
      }
      if (
        summary.editorial !== 'PASS' ||
        summary.factual_citation !== 'PASS' ||
        summary.compliance !== 'PASS'
      ) {
        blocking.push(
          `Required slug ${slug} evidence packet is not PASS (editorial=${summary.editorial}, factual_citation=${summary.factual_citation}, compliance=${summary.compliance}).`,
        );
      }
    }
  }

  // --- 6. Scale-gate observations ---
  const obs = loadObservations(args);
  inputs.observations_source = {
    path: relative(repoRoot, obs.path),
    found: obs.found,
  };
  const earnedScaleGateObservations = {
    ...(obs.observations['10_to_25'] ? { '10_to_25': obs.observations['10_to_25'] } : {}),
    ...(obs.observations['25_to_50'] ? { '25_to_50': obs.observations['25_to_50'] } : {}),
  };

  // --- 7. Drive the canonical gate ---
  const gateResult = evaluateReleaseGates({
    releaseDecision: decision,
    authorizedBatch,
    publicLiveLegacyRows: legacyRows,
    rows,
    evidencePacketLookup: (entry) => evidenceBySlug.get(entry.slug) ?? null,
    earnedScaleGateObservations,
  });
  for (const f of gateResult.blocking_findings) blocking.push(f);
  for (const f of gateResult.informational_findings) informational.push(f);

  // --- 8. Surface user-approved scale gates (Codex verification finding) ---
  const thresholdFindings = ensurePolicyThresholds(inputs, batch);
  inputs.user_approved_thresholds = thresholdFindings;
  for (const t of thresholdFindings) {
    informational.push(
      `User-approved scale-gate threshold registered: ${t.threshold}=${t.value}${t.window_days ? ` within ${t.window_days} days` : ''}${t.applies_to ? ` (${t.applies_to})` : ''}.`,
    );
  }

  // --- 9. Operator strict mode escalates informational findings ---
  if (args.strict) {
    for (const f of informational) blocking.push(`[strict] ${f}`);
    informational.length = 0;
  }

  return {
    result: {
      inputs,
      policy: gateResult.policy,
      cap: gateResult.cap,
      evidence: gateResult.evidence,
      aggregate_counts: gateResult.aggregate_counts,
      earned_scale_gates: gateResult.earned_scale_gates,
      packet_dispositions: packetDispositionSummary,
      blocking_findings: blocking,
      informational_findings: informational,
      generated_at_utc: new Date().toISOString(),
      generator: 'scripts/check-mrx1000-release-gates.mjs',
      artifact_type: 'mrx1000_release_10_release_gate_check',
    },
    blockingCount: blocking.length,
  };
}

function renderMarkdown(result) {
  const lines = [];
  lines.push('# MRX1000 release-10 release-gate check');
  lines.push('');
  lines.push(`_Generated_: ${result.result.generated_at_utc}`);
  lines.push('');
  lines.push('## Decision');
  lines.push('');
  const policy = result.result.policy;
  lines.push(`- decision_id: \`${policy.authorization_decision_id ?? '(none)'}\``);
  lines.push(`- disposition: ${policy.authorization_decision_disposition}`);
  lines.push(`- signed: ${policy.authorization_decision_signed}`);
  lines.push(`- release_authorized: ${policy.release_authorized}`);
  lines.push(`- index_authorized: ${policy.index_authorized}`);
  lines.push('');
  lines.push('## Authorization cap');
  lines.push('');
  const cap = result.result.cap;
  lines.push(`- authorized_release_total: **${cap.authorized_release_total}**`);
  lines.push(`- observed_release_total: ${cap.observed_release_total}`);
  lines.push(`- cap_remaining: ${cap.cap_remaining}`);
  lines.push(`- cap_exceeded: ${cap.cap_exceeded}`);
  if (cap.cap_exceeded_slugs.length) {
    lines.push('');
    lines.push('Cap-exceeded slugs:');
    for (const s of cap.cap_exceeded_slugs) lines.push(`- ${s}`);
  }
  lines.push('');
  lines.push('## Evidence packets');
  lines.push('');
  const ev = result.result.evidence;
  const evInputs = result.result.inputs.evidence ?? {};
  lines.push(`- packets_required: ${ev.packets_required}`);
  lines.push(`- packets_present: ${ev.packets_present}`);
  lines.push(`- packets_passing: ${ev.packets_passing}`);
  lines.push(
    `- packets_hold_or_failing: ${evInputs.packets_hold_or_failing ?? ev.packets_failing}`,
  );
  lines.push(
    `- packets_missing: ${evInputs.packets_missing ?? Math.max(0, ev.packets_required - ev.packets_present)}`,
  );
  if (result.result.inputs.exact_admission?.enabled) {
    lines.push('');
    lines.push('## Exact admission bindings');
    lines.push('');
    lines.push(
      `- exact_admitted_count: ${result.result.inputs.exact_admission.configured_exact_count}`,
    );
    lines.push(
      `- observed_article_count: ${result.result.inputs.exact_admission.observed_article_count}`,
    );
    lines.push(
      `- exact_admitted_slate_sha256: \`${result.result.inputs.exact_admission.configured_exact_slate_sha256 ?? '(unset)'}\``,
    );
    lines.push(
      `- observed_exact_slate_sha256: \`${result.result.inputs.exact_admission.observed_exact_slate_sha256 ?? '(unset)'}\``,
    );
  }
  lines.push('');
  lines.push('## Earned scale gates');
  for (const g of result.result.earned_scale_gates) {
    lines.push('');
    lines.push(`### ${g.from_cap} → ${g.to_cap} (${g.disposition})`);
    lines.push(`- required_decision_id: ${g.required_decision_id}`);
    lines.push(`- signed_decision_id: ${g.signed_decision_id ?? '(none)'}`);
    lines.push(`- preconditions_satisfied: ${g.preconditions_satisfied.length}`);
    lines.push(`- preconditions_missing: ${g.preconditions_missing.length}`);
    if (g.preconditions_missing.length) {
      lines.push('');
      lines.push('Missing preconditions:');
      for (const m of g.preconditions_missing) lines.push(`- ${m}`);
    }
  }
  lines.push('');
  lines.push('## User-approved thresholds');
  for (const t of result.result.inputs.user_approved_thresholds ?? []) {
    lines.push(
      `- ${t.threshold} = ${t.value}${t.window_days != null ? ` within ${t.window_days} days` : ''}${t.applies_to ? ` — ${t.applies_to}` : ''}`,
    );
  }
  if (!(result.result.inputs.user_approved_thresholds ?? []).length) {
    lines.push('_None registered in batch._');
  }
  lines.push('');
  lines.push('## Blocking findings');
  if (result.result.blocking_findings.length === 0) {
    lines.push('');
    lines.push('_None._');
  } else {
    lines.push('');
    for (const f of result.result.blocking_findings) lines.push(`- ${f}`);
  }
  lines.push('');
  lines.push('## Informational findings');
  if (result.result.informational_findings.length === 0) {
    lines.push('');
    lines.push('_None._');
  } else {
    lines.push('');
    for (const f of result.result.informational_findings) lines.push(`- ${f}`);
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const built = buildCheck();
  const outDir = join(repoRoot, 'reports', 'mrx1000-release-10-lifecycle');
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, 'check-gates.json');
  const mdPath = join(outDir, 'check-gates.md');
  const jsonText = JSON.stringify(built.result, null, 2) + '\n';
  const mdText = renderMarkdown(built);
  writeFileSync(jsonPath, jsonText, 'utf8');
  writeFileSync(mdPath, mdText, 'utf8');
  writeFileSync(
    `${jsonPath}.sha256`,
    `${sha256(Buffer.from(jsonText, 'utf8'))}  ${relative(repoRoot, jsonPath)}\n`,
    'utf8',
  );
  writeFileSync(
    `${mdPath}.sha256`,
    `${sha256(Buffer.from(mdText, 'utf8'))}  ${relative(repoRoot, mdPath)}\n`,
    'utf8',
  );
  console.log(`Wrote ${relative(repoRoot, jsonPath)}`);
  console.log(`Wrote ${relative(repoRoot, mdPath)}`);
  console.log(
    `Cap: ${built.result.cap.authorized_release_total} (observed ${built.result.cap.observed_release_total}, remaining ${built.result.cap.cap_remaining}); packets passing ${built.result.evidence.packets_passing}/${built.result.evidence.packets_required}; blocking findings ${built.result.blocking_findings.length}.`,
  );
  if (built.blockingCount > 0) {
    for (const finding of built.result.blocking_findings) {
      console.error(`BLOCKING: ${finding}`);
    }
    process.exit(2);
  }
}

main();
