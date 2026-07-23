#!/usr/bin/env node
/**
 * scripts/check-mrx1000-release-gates.mjs
 *
 * Fail-closed release-gate check for the MRX1000 release-10 program
 * declared by D-2026-0721-21.
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
 *     0 — all fail-closed invariants pass (cap OK, no unauthorized
 *         publications, evidence fully PASS, scale-gate observations
 *         do not yet satisfy a higher cap → no premature authorization).
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
 *   --expected-decision-sha    When present, the successor decision SHA-256
 *                              must equal this value or the check fails.
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
  if (envTree && existsSync(join(envTree, 'config', 'mrx1000-release-10-batch.json'))) return resolve(envTree);
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'config', 'mrx1000-release-10-batch.json'))) return cwd;
  return resolve(import.meta.dirname, '..');
}
// Note: argv here is the node-process argv, not a wrapper. We accept
// the parse-late trade-off for the test convenience.
const repoRoot = pickRepoRoot([...process.argv]);

/* ---------- arg parsing ---------- */

function parseArgs(argv) {
  const out = { strict: false, observations: null, expectedDecisionSha: null, requirePassOnArticles: [] };
  for (const raw of argv.slice(2)) {
    if (raw === '--strict') out.strict = true;
    else if (raw === '--help' || raw === '-h') out.help = true;
    else if (raw.startsWith('--observations=')) out.observations = raw.slice('--observations='.length);
    else if (raw.startsWith('--expected-decision-sha=')) out.expectedDecisionSha = raw.slice('--expected-decision-sha='.length).toLowerCase();
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
    '  --expected-decision-sha=<hex64>           verify successor decision SHA-256',
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
  const expected = readFileSync(sidecarPath, 'utf8').trim().match(/^([a-f0-9]{64})(?:\s|$)/i)?.[1];
  return expected?.toLowerCase() === sha256File(path);
}

function normalizeUrl(value) {
  return String(value ?? '').trim().replace(/\/+$/, '').toLowerCase();
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

function deriveStagesForLedger(ledgerArticles, sitemapUrls, admittedLookup, legacyLookup) {
  const rows = [];
  for (const article of ledgerArticles) {
    const frontmatter = {
      publication_status: article.publication_status ?? null,
      draft: !!article.draft,
      noindex: !!article.frontmatter_noindex,
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
      expected_sha256:
        batch.decision_authority?.batch_source_admitted_shortlist_sha256 ?? null,
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
      blocking.push('Configured release-10 slugs do not exactly match the controlling shortlist.');
    }
    for (const entry of batch.articles ?? []) {
      const source = admittedBySlug.get(entry.slug);
      if (
        !source ||
        source.program_row_id !== entry.source_shortlist_program_row_id
      ) {
        blocking.push(
          `Shortlist provenance mismatch for ${entry.slug}: source_shortlist_program_row_id must match the controlling shortlist.`,
        );
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
      blocking.push(`Successor decision SHA-256 mismatch: expected ${batch.decision_authority?.successor_gate_decision_sha256 ?? '(unset)'}, got ${sha}.`);
    }
    if (args.expectedDecisionSha && sha !== args.expectedDecisionSha.toLowerCase()) {
      blocking.push(`Successor decision SHA-256 does not match --expected-decision-sha (got ${sha}).`);
    }
    if (decision.disposition !== 'APPROVED') {
      blocking.push(`Successor decision disposition is ${decision.disposition}; only APPROVED dispositions can authorize release.`);
    }
    if (!decision.release_authorized || !decision.index_authorized) {
      blocking.push(`Successor decision does not authorize release and/or indexing (release_authorized=${decision.release_authorized}, index_authorized=${decision.index_authorized}).`);
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
      batch.policy?.authorization_cap_released_articles ?? batch.articles?.length ?? 10,
    articles: authorizedArticles,
    decision_authority: {
      capping_decision_id: batch.decision_authority?.capping_decision_id ?? '',
      capping_decision_path: batch.decision_authority?.capping_decision_path ?? '',
      capping_decision_sha256: batch.decision_authority?.capping_decision_sha256 ?? '',
      successor_gate_decision_id: batch.decision_authority?.successor_gate_decision_id ?? '',
      successor_gate_decision_path: batch.decision_authority?.successor_gate_decision_path ?? '',
      successor_gate_decision_sha256: batch.decision_authority?.successor_gate_decision_sha256 ?? '',
    },
    policy: {
      authorization_cap_released_articles:
        batch.policy?.authorization_cap_released_articles ?? batch.articles?.length ?? 10,
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
    blocking.push('Canonical ledger does not declare stable program-row identity by canonical slug.');
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

  const rows = deriveStagesForLedger(
    ledger.articles ?? [],
    sitemapUrls,
    admittedLookup,
    legacyLookup,
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
      blocking.push(`Evidence packet missing for ${entry.slug}; expected at ${entry.evidence_packet_path}.`);
      continue;
    }
    if (!verifySidecar(packetPath)) {
      blocking.push(`Evidence packet SHA-256 sidecar is missing or stale for ${entry.slug}.`);
      continue;
    }
    const packet = readJson(packetPath);
    evidenceBySlug.set(entry.slug, packet);
    const bodyPath = join(repoRoot, batch.articles.find((article) => article.slug === entry.slug)?.repo_path ?? '');
    const bodySha = existsSync(bodyPath) ? sha256File(bodyPath) : null;
    const identityFailures = [];
    if (packet.program_row_id !== entry.program_row_id) identityFailures.push('program_row_id');
    if (packet.slug !== entry.slug) identityFailures.push('slug');
    if (packet.title !== entry.title) identityFailures.push('title');
    if (normalizeUrl(packet.canonical_url) !== normalizeUrl(entry.canonical_url)) identityFailures.push('canonical_url');
    if (packet.body_path_declared !== batch.articles.find((article) => article.slug === entry.slug)?.repo_path) {
      identityFailures.push('body_path_declared');
    }
    if (packet.body_sha256 !== bodySha) identityFailures.push('body_sha256');
    if (identityFailures.length) {
      blocking.push(`Evidence packet identity/hash mismatch for ${entry.slug}: ${identityFailures.join(', ')}.`);
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
    if (packet.body_sha256_matches_declared === false) {
      blocking.push(`Body SHA-256 for ${entry.slug} does not match the authorized batch repo_sha256.`);
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
      if (summary.editorial !== 'PASS' || summary.factual_citation !== 'PASS' || summary.compliance !== 'PASS') {
        blocking.push(`Required slug ${slug} evidence packet is not PASS (editorial=${summary.editorial}, factual_citation=${summary.factual_citation}, compliance=${summary.compliance}).`);
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
  lines.push(`- packets_required: ${ev.packets_required}`);
  lines.push(`- packets_present: ${ev.packets_present}`);
  lines.push(`- packets_passing: ${ev.packets_passing}`);
  lines.push(`- packets_hold_or_failing: ${ev.packets_hold_or_failing}`);
  lines.push(`- packets_missing: ${ev.packets_missing}`);
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
    lines.push(`- ${t.threshold} = ${t.value}${t.window_days != null ? ` within ${t.window_days} days` : ''}${t.applies_to ? ` — ${t.applies_to}` : ''}`);
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
  writeFileSync(`${jsonPath}.sha256`, `${sha256(Buffer.from(jsonText, 'utf8'))}  ${relative(repoRoot, jsonPath)}\n`, 'utf8');
  writeFileSync(`${mdPath}.sha256`, `${sha256(Buffer.from(mdText, 'utf8'))}  ${relative(repoRoot, mdPath)}\n`, 'utf8');
  console.log(`Wrote ${relative(repoRoot, jsonPath)}`);
  console.log(`Wrote ${relative(repoRoot, mdPath)}`);
  console.log(
    `Cap: ${built.result.cap.authorized_release_total} (observed ${built.result.cap.observed_release_total}, remaining ${built.result.cap.cap_remaining}); packets passing ${built.result.evidence.packets_passing}/${built.result.evidence.packets_required}; blocking findings ${built.result.blocking_findings.length}.`,
  );
  if (built.blockingCount > 0) {
    process.exit(2);
  }
}

main();
