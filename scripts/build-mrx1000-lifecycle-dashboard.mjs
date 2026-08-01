#!/usr/bin/env node
/**
 * scripts/build-mrx1000-lifecycle-dashboard.mjs
 *
 * Build the canonical article-lifecycle dashboard for MRX1000 release-10.
 *
 *   Inputs (declared in config/mrx1000-release-10-batch.json):
 *     - config/mrx1000-release-10-batch.json          (authorized batch)
 *     - artifacts/mrx1000-release-10/decisions/*.md   (signed CEO decision)
 *     - artifacts/mrx1000-release-10/evidence/*.json  (per-article evidence)
 *     - config/mrx-1000-canonical-content-ledger.json (1000-row ledger)
 *     - dist/sitemap-articles.xml                    (canonical sitemap)
 *
 *   Outputs (written under reports/mrx1000-release-10-lifecycle/):
 *     - dashboard.json   (gate result + per-row dispositions + earned scale gates)
 *     - dashboard.md     (human-readable summary)
 *     - dashboard.json.sha256 / dashboard.md.sha256  (integrity sidecars)
 *
 * The dashboard is fail-closed: if any required input is missing, the
 * script exits non-zero and writes a dashboard with the blocking
 * findings populated. The script never publishes, indexes, or mutates
 * the site. It only reports.
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
import { projectLedgerArticlesForRuntime } from './_mrx1000-runtime-publication-projection.mjs';

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
const repoRoot = pickRepoRoot([...process.argv]);

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

function safeExtractArticle(article) {
  return {
    program_row_id: article.program_row_id ?? null,
    slug: article.canonical_slug ?? null,
    canonical_url: normalizeUrl(article.canonical_url ?? ''),
    pillar: article.pillar ?? null,
    cluster: article.cluster ?? null,
    frontmatter_publication_status: article.publication_status ?? null,
    frontmatter_draft: !!article.draft,
    frontmatter_noindex: !!article.frontmatter_noindex,
    preservation_classification: article.preservation_classification ?? null,
    publication_gate_nonpublic: article.publication_gate_nonpublic !== false,
  };
}

function normalizeUrl(value) {
  return String(value ?? '').trim().replace(/\/+$/, '').toLowerCase();
}

function deriveStagesForLedger(ledgerArticles, sitemapUrls, admittedLookup, legacyLookup) {
  const rows = [];
  for (const article of ledgerArticles) {
    const canonical = safeExtractArticle(article);
    const frontmatter = {
      publication_status: canonical.frontmatter_publication_status,
      draft: canonical.frontmatter_draft,
      noindex: canonical.frontmatter_noindex,
      canonical_slug: canonical.slug,
      pillar: canonical.pillar,
      cluster: canonical.cluster,
      program_row_id: canonical.program_row_id,
    };
    const stage = deriveArticleLifecycleStage(frontmatter, {
      authorizedAdmitted: admittedLookup,
      publicLiveLegacy: legacyLookup,
    });
    rows.push({
      program_row_id: canonical.program_row_id,
      slug: canonical.slug,
      canonical_url: canonical.canonical_url,
      pillar: canonical.pillar,
      cluster: canonical.cluster,
      lifecycle_stage: stage,
      is_published_in_dist_sitemap: sitemapUrls.has(canonical.canonical_url),
    });
  }
  return rows;
}

function buildDashboard() {
  const inputs = {};
  const findings = [];

  // --- 1. Load authorized batch ---
  const batchRel = 'config/mrx1000-release-10-batch.json';
  const batchPath = join(repoRoot, batchRel);
  if (!existsSync(batchPath)) {
    findings.push(`Missing authorized batch: ${batchRel}`);
    return stubFailure({ inputs, findings });
  }
  const batch = readJson(batchPath);
  inputs.batch = {
    path: batchRel,
    sha256: sha256File(batchPath),
    authorized_count: batch.articles?.length ?? 0,
    policy: batch.policy,
  };

  // --- 2. Load successor (or comparable) signed decision ---
  const decisionRel = batch.decision_authority?.successor_gate_decision_path;
  const decisionPath = decisionRel ? join(repoRoot, decisionRel) : null;
  let decision = null;
  if (decisionRel && existsSync(decisionPath)) {
    const text = readText(decisionPath);
    const sha = sha256File(decisionPath);
    decision = parseReleaseDecisionArtifact({ path: decisionRel, text, sha256: sha });
    inputs.decision = {
      path: decisionRel,
      sha256: sha,
      decision_id: decision.decision_id,
      disposition: decision.disposition,
      release_authorized: decision.release_authorized,
      index_authorized: decision.index_authorized,
    };
  } else {
    findings.push(`Missing successor decision artifact: ${decisionRel ?? '(unset)'}`);
  }

  // --- 3. Materialize authorized batch in the type the gate expects ---
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
    authorization_cap_released_articles: batch.policy?.authorization_cap_released_articles ?? batch.articles?.length ?? 0,
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
      authorization_cap_released_articles: batch.policy?.authorization_cap_released_articles ?? batch.articles?.length ?? 0,
      fail_closed: batch.policy?.fail_closed !== false,
      earned_scale_gates: batch.policy?.earned_scale_gates ?? [],
    },
  };

  const admittedLookup = buildAuthorizedAdmittedLookup(authorizedArticles);

  // --- 4. Load ledger (1000 rows) and derive lifecycle rows ---
  const ledgerRel = 'config/mrx-1000-canonical-content-ledger.json';
  const ledgerPath = join(repoRoot, ledgerRel);
  if (!existsSync(ledgerPath)) {
    findings.push(`Missing canonical ledger: ${ledgerRel}`);
    return stubFailure({
      inputs,
      findings,
      authorizedBatch,
      decision,
      admittedLookup,
    });
  }
  const ledger = readJson(ledgerPath);
  const runtime = projectLedgerArticlesForRuntime(ledger.articles ?? [], repoRoot);
  const runtimeArticles = runtime.articles;
  const legacyRows = legacyLiveRowsFromLedger(ledger.articles ?? []);
  const legacyLookup = buildPublicLiveLegacyLookup(legacyRows);
  const sitemapUrls = listSitemapUrls();
  inputs.ledger = {
    path: ledgerRel,
    sha256: sha256File(ledgerPath),
    total_rows: ledger.articles?.length ?? 0,
    legacy_live_rows: legacyRows.length,
    sitemap_indexed_urls: sitemapUrls.size,
    runtime_publication_override_count: [...runtime.projection.bySlug.values()].filter(
      (entry) => entry.published,
    ).length,
  };
  const rows = deriveStagesForLedger(runtimeArticles, sitemapUrls, admittedLookup, legacyLookup);

  // --- 5. Load per-article evidence packets ---
  const evidenceBySlug = new Map();
  let missingPacketCount = 0;
  for (const entry of authorizedArticles) {
    const packetPath = join(repoRoot, entry.evidence_packet_path);
    if (!existsSync(packetPath)) {
      missingPacketCount += 1;
      continue;
    }
    const packet = readJson(packetPath);
    evidenceBySlug.set(entry.slug, {
      ...packet,
      _artifact_sha256: sha256File(packetPath),
    });
  }
  inputs.evidence = {
    packets_required: authorizedArticles.length,
    packets_present: evidenceBySlug.size,
    packets_missing: missingPacketCount,
  };

  // --- 6. Evaluate the release gates ---
  const gateResult = evaluateReleaseGates({
    releaseDecision: decision,
    authorizedBatch,
    publicLiveLegacyRows: legacyRows,
    rows,
    evidencePacketLookup: (entry) => evidenceBySlug.get(entry.slug) ?? null,
  });

  // The gate result is JSON-serializable already; we emit it as-is so
  // the deterministic shape is preserved across runs.
  const dashboard = {
    artifact_type: 'mrx1000_release_10_lifecycle_dashboard',
    generated_at_utc: new Date().toISOString(),
    generator: 'scripts/build-mrx1000-lifecycle-dashboard.mjs',
    inputs,
    gate: gateResult,
    blocking_findings: [...gateResult.blocking_findings, ...findings],
    informational_findings: gateResult.informational_findings,
  };

  return { dashboard, admittedLookup, decision, gateResult };
}

function stubFailure(state) {
  // Fail-closed stub when batch/ledger is missing. Always renders a
  // dashboard-shaped object so callers downstream (tests, CI, MRX
  // orchestrator) can read the failure deterministically.
  const dashboard = {
    artifact_type: 'mrx1000_release_10_lifecycle_dashboard',
    generated_at_utc: new Date().toISOString(),
    generator: 'scripts/build-mrx1000-lifecycle-dashboard.mjs',
    inputs: state.inputs ?? {},
    gate: {
      policy: {
        fail_closed: true,
        authorization_cap_released_articles: 10,
        authorization_decision_id: state.decision?.decision_id ?? null,
        authorization_decision_signed: !!state.decision?.signed,
        authorization_decision_disposition: state.decision?.disposition ?? 'HOLD',
        authorization_decision_signed_artifact: state.decision?.signed_artifact ?? null,
        authorization_decision_signed_artifact_sha256: state.decision?.signed_artifact_sha256 ?? null,
        authorization_decision_signed_artifact_sha256_verified:
          state.decision?.signed_artifact_sha256_verified ?? null,
        release_authorized: !!state.decision?.release_authorized,
        index_authorized: !!state.decision?.index_authorized,
      },
      aggregate_counts: {
        by_stage: {
          draft: 0,
          searchatlas_review: 0,
          editorial_review: 0,
          compliance_review: 0,
          approved: 0,
          published: 0,
          retired: 0,
          authorized_admitted: 0,
          public_live_legacy: 0,
        },
        total_rows: 0,
        published_in_dist_sitemap_rows: 0,
        authorized_admitted_rows: 0,
        public_live_legacy_rows: 0,
        unauthorized_published_rows: 0,
        unauthorized_published_slugs: [],
      },
      cap: {
        authorized_release_total: 10,
        observed_release_total: 0,
        cap_remaining: 10,
        cap_exceeded: false,
        cap_exceeded_slugs: [],
      },
      evidence: { packets_required: 0, packets_present: 0, packets_passing: 0, packets_failing: 0, failing_packet_slugs: [] },
      earned_scale_gates: [],
      blocking_findings: state.findings ?? [],
      informational_findings: [],
      dispositions_by_row: [],
    },
    blocking_findings: state.findings ?? [],
    informational_findings: [],
  };
  return { dashboard, admittedLookup: null, decision: state.decision ?? null, gateResult: null };
}

function renderMarkdown(dashboard) {
  const gate = dashboard.gate;
  const policy = gate.policy;
  const counts = gate.aggregate_counts;
  const cap = gate.cap;
  const findings = dashboard.blocking_findings ?? [];
  const admitted = gate.dispositions_by_row.filter((r) => r.membership === 'authorized_admitted');
  const lines = [];
  lines.push('# MRX1000 release-10 lifecycle dashboard');
  lines.push('');
  lines.push(`_Generated_: ${dashboard.generated_at_utc}`);
  lines.push(`_Generator_: ${dashboard.generator}`);
  lines.push('');
  lines.push('## Authorization cap');
  lines.push('');
  lines.push(`- authorization_cap_released_articles: **${cap.authorized_release_total}**`);
  lines.push(`- observed_release_total: ${cap.observed_release_total}`);
  lines.push(`- cap_remaining: ${cap.cap_remaining}`);
  lines.push(`- cap_exceeded: ${cap.cap_exceeded}`);
  if (cap.cap_exceeded_slugs.length) {
    lines.push('');
    lines.push('Cap-exceeded slugs:');
    for (const s of cap.cap_exceeded_slugs) lines.push(`- ${s}`);
  }
  lines.push('');
  lines.push('## Signed CEO decision');
  lines.push('');
  lines.push(
    `- decision_id: \`${policy.authorization_decision_id ?? '(none)'}\``,
  );
  lines.push(`- disposition: ${policy.authorization_decision_disposition}`);
  lines.push(`- signed: ${policy.authorization_decision_signed}`);
  lines.push(`- release_authorized: ${policy.release_authorized}`);
  lines.push(`- index_authorized: ${policy.index_authorized}`);
  lines.push(`- artifact_sha256: \`${policy.authorization_decision_signed_artifact_sha256 ?? '(missing)'}\``);
  lines.push('');
  lines.push('## Aggregate stage counts');
  lines.push('');
  lines.push('| stage | rows |');
  lines.push('|---|---|');
  for (const [stage, count] of Object.entries(counts.by_stage)) {
    lines.push(`| ${stage} | ${count} |`);
  }
  lines.push('');
  lines.push(`- ledger rows: ${counts.total_rows}`);
  lines.push(`- unauthorized_published_rows: ${counts.unauthorized_published_rows}`);
  if (counts.unauthorized_published_slugs?.length) {
    lines.push('');
    lines.push('Unauthorized slugs:');
    for (const s of counts.unauthorized_published_slugs) lines.push(`- ${s}`);
  }
  lines.push('');
  lines.push('## Evidence packets');
  const ev = gate.evidence;
  lines.push('');
  lines.push(`- packets_required: ${ev.packets_required}`);
  lines.push(`- packets_present: ${ev.packets_present}`);
  lines.push(`- packets_passing: ${ev.packets_passing}`);
  lines.push(`- packets_failing: ${ev.packets_failing}`);
  if (ev.failing_packet_slugs?.length) {
    lines.push('');
    lines.push('Failing-evidence slugs:');
    for (const s of ev.failing_packet_slugs) lines.push(`- ${s}`);
  }
  lines.push('');
  lines.push('## Earned scale gates');
  for (const g of gate.earned_scale_gates) {
    lines.push('');
    lines.push(`### ${g.from_cap} → ${g.to_cap} (${g.disposition})`);
    lines.push('');
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
  lines.push('## Authorized-admitted dispositions');
  if (admitted.length === 0) {
    lines.push('');
    lines.push('_No authorized-admitted rows observed._');
  } else {
    lines.push('');
    lines.push('| slug | cap_against_authorization | evidence_disposition | notes |');
    lines.push('|---|---|---|---|');
    for (const r of admitted) {
      lines.push(
        `| ${r.slug} | ${r.cap_against_authorization} | ${r.evidence_disposition} | ${r.notes?.join('; ') ?? ''} |`,
      );
    }
  }
  lines.push('');
  lines.push('## Blocking findings');
  if (findings.length === 0) {
    lines.push('');
    lines.push('_None._');
  } else {
    lines.push('');
    for (const f of findings) lines.push(`- ${f}`);
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const result = buildDashboard();
  const dashboard = result.dashboard;
  const outDir = join(repoRoot, 'reports', 'mrx1000-release-10-lifecycle');
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, 'dashboard.json');
  const mdPath = join(outDir, 'dashboard.md');
  const jsonText = JSON.stringify(dashboard, null, 2) + '\n';
  const mdText = renderMarkdown(dashboard);
  writeFileSync(jsonPath, jsonText, 'utf8');
  writeFileSync(mdPath, mdText, 'utf8');
  writeFileSync(`${jsonPath}.sha256`, `${sha256(Buffer.from(jsonText, 'utf8'))}  ${relative(repoRoot, jsonPath)}\n`, 'utf8');
  writeFileSync(`${mdPath}.sha256`, `${sha256(Buffer.from(mdText, 'utf8'))}  ${relative(repoRoot, mdPath)}\n`, 'utf8');
  console.log(`Wrote ${relative(repoRoot, jsonPath)}`);
  console.log(`Wrote ${relative(repoRoot, mdPath)}`);
  console.log(
    `Authorization cap: ${dashboard.gate.cap.authorized_release_total}; observed: ${dashboard.gate.cap.observed_release_total}; remaining: ${dashboard.gate.cap.cap_remaining}; exceeded: ${dashboard.gate.cap.cap_exceeded}.`,
  );
  console.log(
    `Blocking findings: ${dashboard.gate.blocking_findings.length}; earned scale gates: ${dashboard.gate.earned_scale_gates.length}.`,
  );
  if (dashboard.gate.cap.cap_exceeded || dashboard.gate.blocking_findings.length > 0) {
    process.exit(2);
  }
}

main();
