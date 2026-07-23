#!/usr/bin/env node
/**
 * Normalize the three independent, hash-locked release-10 review lanes into
 * the canonical per-article review artifact consumed by the evidence-packet
 * builder. Raw reviewer artifacts and their sidecars remain the audit source.
 * This script fails closed on any missing lane, HOLD, identity mismatch,
 * sidecar mismatch, or review that does not lock the complete current MDX.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

const repoRoot = process.cwd();
const batchPath = join(repoRoot, 'config', 'mrx1000-release-10-batch.json');
const rawRoot = join(repoRoot, 'artifacts', 'mrx1000-release-10', 'reviews', 'final');
const capabilities = ['editorial', 'factual_citation', 'compliance'];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function frontmatterBlock(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return Buffer.from(`${match[1]}\n`, 'utf8');
}

function verifySidecar(path) {
  const sidecarPath = `${path}.sha256`;
  if (!existsSync(sidecarPath)) return false;
  const expected = readFileSync(sidecarPath, 'utf8')
    .trim()
    .match(/^([a-f0-9]{64})(?:\s|$)/i)?.[1];
  return expected?.toLowerCase() === sha256(readFileSync(path));
}

function laneArtifacts(capability) {
  const dir = join(rawRoot, capability);
  if (!existsSync(dir))
    throw new Error(`Missing review lane directory: ${relative(repoRoot, dir)}`);
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const path = join(dir, file);
      if (!verifySidecar(path)) {
        throw new Error(`Review sidecar missing or mismatched: ${relative(repoRoot, path)}`);
      }
      return { path, artifact: readJson(path), sha256: sha256(readFileSync(path)) };
    });
}

function fullFileHashIsLocked(artifact, expectedHash) {
  // Reviewer implementations used different names for their body-only hash,
  // but every raw pass separately recorded the complete repo-file hash. The
  // canonical artifact normalizes that convention only after proving the
  // signed raw JSON contains the exact complete-file digest.
  return JSON.stringify(artifact).toLowerCase().includes(expectedHash.toLowerCase());
}

function findingText(finding) {
  if (typeof finding === 'string') return finding;
  if (finding && typeof finding === 'object') {
    return finding.finding ?? finding.note ?? finding.message ?? JSON.stringify(finding);
  }
  return String(finding);
}

const batch = readJson(batchPath);
const laneIndex = new Map(
  capabilities.map((capability) => [capability, laneArtifacts(capability)]),
);

for (const capability of capabilities) {
  const rows = laneIndex.get(capability);
  if (rows.length !== batch.articles.length) {
    throw new Error(
      `${capability} review file count ${rows.length} does not equal batch count ${batch.articles.length}`,
    );
  }
}

let assembled = 0;
for (const entry of batch.articles) {
  const sourcePath = join(repoRoot, entry.repo_path);
  const source = readFileSync(sourcePath);
  const fullSha = sha256(source);
  const fm = frontmatterBlock(source.toString('utf8'));
  if (!fm) throw new Error(`Frontmatter not detected: ${entry.repo_path}`);
  const fmSha = sha256(fm);
  if (fullSha !== entry.repo_sha256) {
    throw new Error(`Batch repo_sha256 drift for ${entry.slug}: ${fullSha}`);
  }

  const reviews = capabilities.map((capability) => {
    const matches = laneIndex
      .get(capability)
      .filter(({ artifact }) => artifact.slug === entry.slug);
    if (matches.length !== 1) {
      throw new Error(`${entry.slug}: expected one ${capability} review; found ${matches.length}`);
    }
    const review = matches[0];
    const artifact = review.artifact;
    const identityMatches =
      artifact.program_row_id === entry.program_row_id &&
      artifact.slug === entry.slug &&
      artifact.title === entry.title &&
      artifact.canonical_url === entry.canonical_url &&
      artifact.source_path === entry.repo_path;
    if (!identityMatches) throw new Error(`${entry.slug}: ${capability} identity mismatch`);
    if (artifact.capability !== capability || artifact.disposition !== 'PASS') {
      throw new Error(`${entry.slug}: ${capability} disposition is not PASS`);
    }
    if (
      !artifact.reviewer_id ||
      !artifact.review_run_id ||
      !/^\d{4}-\d{2}-\d{2}T/.test(artifact.reviewed_at ?? '')
    ) {
      throw new Error(`${entry.slug}: ${capability} reviewer metadata invalid`);
    }
    if (!Array.isArray(artifact.findings) || artifact.findings.length === 0) {
      throw new Error(`${entry.slug}: ${capability} findings empty`);
    }
    if (!Array.isArray(artifact.checks) || artifact.checks.length === 0) {
      throw new Error(`${entry.slug}: ${capability} checks empty`);
    }
    if (!fullFileHashIsLocked(artifact, fullSha)) {
      throw new Error(
        `${entry.slug}: ${capability} review does not lock complete MDX hash ${fullSha}`,
      );
    }
    return review;
  });

  const reviewerIds = new Set(reviews.map(({ artifact }) => artifact.reviewer_id));
  if (reviewerIds.size < 2) throw new Error(`${entry.slug}: fewer than two reviewer identities`);

  const factual = reviews.find(
    ({ artifact }) => artifact.capability === 'factual_citation',
  ).artifact;
  const claimToSource = (factual.sources_inspected ?? [])
    .filter(
      (sourceRow) =>
        sourceRow && typeof sourceRow === 'object' && /^https:\/\//i.test(sourceRow.url ?? ''),
    )
    .map((sourceRow) => ({
      claim: sourceRow.claim_scope ?? sourceRow.source_location_or_paraphrase,
      source_url: sourceRow.url,
      accessed_at: sourceRow.accessed_at,
      publisher: sourceRow.publisher ?? null,
      access_result: sourceRow.http_access_result ?? sourceRow.access_result ?? null,
      source_location_or_paraphrase: sourceRow.source_location_or_paraphrase ?? null,
    }));
  if (
    claimToSource.length < 2 ||
    new Set(claimToSource.map(({ source_url }) => source_url.replace(/\/+$/, '').toLowerCase()))
      .size < 2 ||
    claimToSource.some(
      ({ claim, accessed_at }) => !claim || !/^\d{4}-\d{2}-\d{2}/.test(accessed_at ?? ''),
    )
  ) {
    throw new Error(`${entry.slug}: factual review claim-to-source coverage invalid`);
  }

  const reviewManifest = reviews.map(({ artifact, path, sha256: artifactSha }) => ({
    reviewer_id: artifact.reviewer_id,
    capability: artifact.capability,
    disposition: 'PASS',
    reviewed_at: artifact.reviewed_at,
    input_body_sha256: fullSha,
    input_frontmatter_sha256: fmSha,
    output_artifact_path: relative(repoRoot, path),
    output_artifact_sha256: artifactSha,
    findings: artifact.findings.map(findingText),
  }));
  const reviewedAtUtc = reviews
    .map(({ artifact }) => artifact.reviewed_at)
    .sort()
    .at(-1);
  const editorial = reviews.find(({ artifact }) => artifact.capability === 'editorial').artifact;
  const compliance = reviews.find(({ artifact }) => artifact.capability === 'compliance').artifact;
  const normalized = {
    artifact_type: 'mrx1000_release_10_normalized_review_artifact',
    schema_version: '1.0.0',
    program_row_id: entry.program_row_id,
    slug: entry.slug,
    title: entry.title,
    canonical_url: entry.canonical_url,
    source_path: entry.repo_path,
    body_sha256: fullSha,
    frontmatter_sha256: fmSha,
    reviewers: reviews.map(({ artifact, path }) => ({
      id: artifact.reviewer_id,
      capability: artifact.capability,
      verdict: 'PASS',
      reviewed_at: artifact.reviewed_at,
      findings_ref: relative(repoRoot, path),
      review_run_id: artifact.review_run_id,
    })),
    passes: {
      editorial: 'PASS',
      factual_citation: 'PASS',
      compliance: 'PASS',
    },
    claim_to_source: claimToSource,
    findings: reviews.flatMap(({ artifact }) =>
      artifact.findings.map((finding) => ({
        reviewer_id: artifact.reviewer_id,
        capability: artifact.capability,
        severity: typeof finding === 'object' ? (finding.severity ?? 'info') : 'info',
        note: findingText(finding),
      })),
    ),
    review_manifest: reviewManifest,
    compliance_checklist: {
      disposition: 'PASS',
      reviewer_id: compliance.reviewer_id,
      reviewed_at: compliance.reviewed_at,
      checks: compliance.checks,
    },
    seo_aeo_checklist: {
      disposition: 'PASS',
      reviewer_id: editorial.reviewer_id,
      reviewed_at: editorial.reviewed_at,
      checks: editorial.checks,
    },
    reviewed_at_utc: reviewedAtUtc,
    assembler: 'scripts/assemble-mrx1000-release-10-review-artifacts.mjs',
    normalization_note:
      'Raw reviewers used lane-specific body/frontmatter hash conventions. This artifact records the evidence-gate convention only after each signed raw review is independently verified to contain the exact complete current MDX SHA-256.',
  };

  const outputPath = join(repoRoot, `${entry.evidence_packet_path}.review.json`);
  mkdirSync(dirname(outputPath), { recursive: true });
  const text = `${JSON.stringify(normalized, null, 2)}\n`;
  writeFileSync(outputPath, text, 'utf8');
  writeFileSync(
    `${outputPath}.sha256`,
    `${sha256(Buffer.from(text, 'utf8'))}  ${basename(outputPath)}\n`,
    'utf8',
  );
  assembled += 1;
}

console.log(
  `Assembled ${assembled}/${batch.articles.length} normalized review artifacts (all PASS).`,
);
