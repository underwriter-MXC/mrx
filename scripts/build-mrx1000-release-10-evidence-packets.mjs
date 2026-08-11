#!/usr/bin/env node
/**
 * scripts/build-mrx1000-release-10-evidence-packets.mjs
 *
 * Materialize per-article evidence packet JSON files for the authorized
 * release-10 articles whose paths are declared in
 * config/mrx1000-release-10-batch.json.
 *
 * Each packet pins the eight required keys declared by the canonical
 * release-lifecycle dashboard:
 *
 *   1. evidence_packet_path       (durable, repo-relative path)
 *   2. editorial_disposition      (PASS / FAIL / HOLD)
 *   3. factual_citation_disposition
 *   4. compliance_disposition
 *   5. body_sha256                (SHA-256 of the in-tree .mdx file)
 *   6. frontmatter_sha256         (SHA-256 of the frontmatter block only)
 *   7. reviewers                  (>=2 independent roles when promoted; [] while HOLD)
 *   8. claim_to_source            (>=1 dated authoritative source URL)
 *
 * The packets are write-once-with-idempotent-promotion, fail-closed by
 * default. Per D-2026-0721-21 §4.1-4.2 and the Codex verification
 * finding recorded on this task:
 *
 *   - Disposition defaults to HOLD. Hash identity proves bytes-under-
 *     review only and may not satisfy editorial, factual/citation, or
 *     compliance review.
 *   - Disposition is promoted to PASS **only** when a durable
 *     independent review-artifact file is present at
 *         artifacts/mrx1000-release-10/evidence/<slug>.review.json
 *     (or any file named `<evidence_packet_path>.review.json`) whose
 *     `.sha256` sidecar verifies the review artifact, `body_sha256`
 *     and `frontmatter_sha256` exactly match the
 *     bytes-under-review in this run, and whose `reviewers` list covers
 *     the three required capabilities with at least two independent
 *     reviewer identities. The reviewer's verdict plus per-pass findings
 *     are then ingested; missing / mismatched / unsigned / single-source
 *     artifacts leave the packet HOLD.
 *   - No PASS is ever inferred from MDX existence or from matching
 *     SHA-256 alone. Required reviewer capabilities are editorial,
 *     factual_citation, and compliance (matches D-2026-0721-21 §4.3).
 *   - Output is byte-stable across reruns that see the same inputs.
 *
 * The dashboard script refuses to publish any article whose evidence
 * packet is missing or whose dispositions are not all PASS; this script
 * therefore guarantees the default rendering is HOLD on a clean tree.
 *
 * Run idempotently — running twice against unchanged inputs produces
 * byte-identical packets and manifests. The stable materialization
 * timestamp is declared in the authorized batch config rather than
 * sampled from the wall clock during every build.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';

import process from 'node:process';

import {
  analyzeControlledPublicationTransition,
  transitionProofMatches,
} from './_mrx1000-controlled-publication-transition.mjs';

// Allow override via --tree=<abs-path> (used by tests) or MRX_TREE
// environment variable. Default behavior is unchanged: cwd if it
// contains config/mrx1000-release-10-batch.json, else script-parent.
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

/* ---------- tiny utilities ---------- */

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function frontmatterBlock(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return Buffer.from(match[1] + '\n', 'utf8');
}

function verifySidecar(path) {
  const sidecarPath = `${path}.sha256`;
  if (!existsSync(path) || !existsSync(sidecarPath)) return false;
  const expected = readFileSync(sidecarPath, 'utf8').trim().match(/^([a-f0-9]{64})(?:\s|$)/i)?.[1];
  return expected?.toLowerCase() === sha256(readFileSync(path));
}

/* ---------- review-artifact ingestion (Codex verification finding) ---------- */

/**
 * If a review-artifact file exists at the conventional path beside the
 * evidence packet, attempt to ingest it. The artifact must:
 *   - be valid JSON;
 *   - have a sibling `.sha256` sidecar whose digest matches the exact
 *     artifact bytes;
 *   - include `body_sha256` and `frontmatter_sha256` that exactly match
 *     the bytes-under-review we just computed;
 *   - include a `reviewers` array of at least 2 entries with distinct
 *     ids and verdicts === 'PASS' (or the per-capability verdict
 *     equivalent);
 *   - include a `passes` object whose three keys ('editorial',
 *     'factual_citation', 'compliance') all map to 'PASS';
 *   - include a `claim_to_source` array meeting the same minimum
 *     contract as GateEvidencePacket.claim_to_source;
 *   - include a non-empty `findings` array (substantive review signal).
 *
 * Returns { disposition: 'PASS', reviewers: [...] } on success or
 *         { disposition: 'HOLD', reason: '...' } on any mismatch.
 */
function ingestReviewArtifact({ artifactPath, bodySha, fmSha, entry, transition }) {
  if (!existsSync(artifactPath)) {
    return { disposition: 'HOLD', reason: 'no_review_artifact_file' };
  }
  const raw = readFileSync(artifactPath);
  const observedArtifactSha = sha256(raw);
  const sidecarPath = `${artifactPath}.sha256`;
  if (!existsSync(sidecarPath)) {
    return { disposition: 'HOLD', reason: 'review_artifact_sha256_sidecar_missing' };
  }
  const sidecarMatch = readFileSync(sidecarPath, 'utf8').trim().match(/^([a-f0-9]{64})(?:\s|$)/i);
  if (!sidecarMatch || sidecarMatch[1].toLowerCase() !== observedArtifactSha.toLowerCase()) {
    return { disposition: 'HOLD', reason: 'review_artifact_sha256_sidecar_mismatch' };
  }
  let artifact;
  try {
    artifact = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    return { disposition: 'HOLD', reason: `review_artifact_unparseable:${err.message}` };
  }
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return { disposition: 'HOLD', reason: 'review_artifact_not_object' };
  }
  if (
    artifact.slug !== entry.slug ||
    artifact.program_row_id !== entry.program_row_id ||
    artifact.title !== entry.title ||
    artifact.canonical_url !== entry.canonical_url
  ) {
    return { disposition: 'HOLD', reason: 'review_artifact_identity_mismatch' };
  }
  if (artifact.body_sha256?.toLowerCase() !== bodySha.toLowerCase()) {
    return { disposition: 'HOLD', reason: 'review_artifact_body_sha256_mismatch' };
  }
  if (artifact.frontmatter_sha256?.toLowerCase() !== fmSha.toLowerCase()) {
    return { disposition: 'HOLD', reason: 'review_artifact_frontmatter_sha256_mismatch' };
  }
  if (!transition?.authorized) {
    return { disposition: 'HOLD', reason: `source_transition_invalid:${transition?.reason ?? 'unknown'}` };
  }
  if (
    artifact.reviewed_body_sha256?.toLowerCase() !== transition.reviewed_body_sha256 ||
    artifact.reviewed_frontmatter_sha256?.toLowerCase() !== transition.reviewed_frontmatter_sha256 ||
    artifact.current_body_sha256?.toLowerCase() !== transition.current_body_sha256 ||
    artifact.current_frontmatter_sha256?.toLowerCase() !== transition.current_frontmatter_sha256 ||
    !transitionProofMatches(artifact.controlled_publication_transition, transition)
  ) {
    return { disposition: 'HOLD', reason: 'review_artifact_controlled_transition_mismatch' };
  }
  const passes = artifact.passes ?? {};
  const passDispositions = {
    editorial: passes.editorial,
    factual_citation: passes.factual_citation,
    compliance: passes.compliance,
  };
  for (const [cap, disp] of Object.entries(passDispositions)) {
    if (disp !== 'PASS') {
      return { disposition: 'HOLD', reason: `review_artifact_pass_${cap}=${disp ?? 'null'}` };
    }
  }
  const reviewers = Array.isArray(artifact.reviewers) ? artifact.reviewers : null;
  if (!reviewers || reviewers.length < 2) {
    return { disposition: 'HOLD', reason: 'review_artifact_reviewers_lt_2' };
  }
  const ids = new Set();
  for (const r of reviewers) {
    if (!r.id || ids.has(r.id)) {
      return { disposition: 'HOLD', reason: 'review_artifact_reviewer_id_invalid' };
    }
    if (typeof r.verdict !== 'string' || r.verdict.toUpperCase() !== 'PASS') {
      return { disposition: 'HOLD', reason: `review_artifact_reviewer_${r.id}_verdict_${r.verdict}` };
    }
    ids.add(r.id);
  }
  const capabilities = new Set(reviewers.map((r) => r.capability));
  const requiredCaps = ['editorial', 'factual_citation', 'compliance'];
  if (!requiredCaps.every((c) => capabilities.has(c))) {
    return { disposition: 'HOLD', reason: 'review_artifact_reviewers_missing_capability' };
  }
  const findings = Array.isArray(artifact.findings) ? artifact.findings : [];
  if (findings.length === 0) {
    return { disposition: 'HOLD', reason: 'review_artifact_findings_empty' };
  }
  const claimToSource = Array.isArray(artifact.claim_to_source) ? artifact.claim_to_source : [];
  if (
    claimToSource.length < 2 ||
    claimToSource.some(
      (c) =>
        !c.claim ||
        !/^https:\/\//i.test(c.source_url ?? '') ||
        !/^\d{4}-\d{2}-\d{2}/.test(c.accessed_at ?? ''),
    ) ||
    new Set(claimToSource.map((c) => c.source_url.replace(/\/+$/, '').toLowerCase())).size < 2
  ) {
    return { disposition: 'HOLD', reason: 'review_artifact_claim_to_source_invalid' };
  }
  const reviewManifest = Array.isArray(artifact.review_manifest) ? artifact.review_manifest : [];
  if (
    reviewManifest.length < 3 ||
    reviewManifest.some(
      (pass) =>
        !pass.reviewer_id ||
        !requiredCaps.includes(pass.capability) ||
        pass.disposition !== 'PASS' ||
        pass.input_body_sha256?.toLowerCase() !== transition.reviewed_body_sha256 ||
        pass.input_frontmatter_sha256?.toLowerCase() !== transition.reviewed_frontmatter_sha256 ||
        !/^\d{4}-\d{2}-\d{2}T/.test(pass.reviewed_at ?? '') ||
        !pass.output_artifact_path ||
        !/^[a-f0-9]{64}$/i.test(pass.output_artifact_sha256 ?? '') ||
        !existsSync(join(repoRoot, pass.output_artifact_path)) ||
        sha256(readFileSync(join(repoRoot, pass.output_artifact_path))) !==
          pass.output_artifact_sha256?.toLowerCase() ||
        !Array.isArray(pass.findings) ||
        pass.findings.length === 0,
    ) ||
    !requiredCaps.every((capability) => reviewManifest.some((pass) => pass.capability === capability))
  ) {
    return { disposition: 'HOLD', reason: 'review_artifact_manifest_invalid' };
  }
  if (artifact.compliance_checklist?.disposition !== 'PASS') {
    return { disposition: 'HOLD', reason: 'review_artifact_compliance_checklist_not_pass' };
  }
  if (artifact.seo_aeo_checklist?.disposition !== 'PASS') {
    return { disposition: 'HOLD', reason: 'review_artifact_seo_aeo_checklist_not_pass' };
  }
  return {
    disposition: 'PASS',
    reviewers,
    passes,
    findings,
    claim_to_source: claimToSource,
    review_manifest: reviewManifest,
    compliance_checklist: artifact.compliance_checklist,
    seo_aeo_checklist: artifact.seo_aeo_checklist,
    reviewed_at_utc: artifact.reviewed_at_utc ?? null,
    review_artifact_path: relative(repoRoot, artifactPath),
    review_artifact_sha256: observedArtifactSha,
    controlled_publication_transition: transition,
  };
}

/* ---------- packet assembly ---------- */

function buildPacket({ entry, bodyPath, materializedAt, assetEvidence, publicationManifest }) {
  const bodyExists = existsSync(bodyPath);
  const bodySource = bodyExists ? readFileSync(bodyPath) : null;
  const bodySha = bodyExists ? sha256(bodySource) : null;
  const fm = bodySource ? frontmatterBlock(bodySource.toString('utf8')) : null;
  const fmSha = fm ? sha256(fm) : null;
  const transition = bodySource
    ? analyzeControlledPublicationTransition(bodySource, entry)
    : {
        authorized: false,
        state: 'invalid',
        reason: 'body_md_not_found',
        reviewed_body_sha256: entry.article_sha256 ?? entry.repo_sha256 ?? null,
        reviewed_frontmatter_sha256: null,
        current_body_sha256: null,
        current_frontmatter_sha256: null,
        normalized_body_sha256: null,
        changes: [],
      };

  // Fail-closed default: HOLD. Hash identity is supporting evidence
  // only and does not satisfy editorial/factual/compliance review.
  const disposition = 'HOLD';
  let reviewers = [];
  let reviewArtifactPath = null;
  let reviewArtifactSha = null;
  let reviewPasses = null;
  let reviewFindings = [];
  let reviewManifest = [];
  let complianceChecklist = null;
  let seoAeoChecklist = null;
  let claimToSource = [];
  let reviewedAtUtc = null;
  let holdReason = 'no_review_artifact_file';
  const assetRow = assetEvidence?.rows?.find((row) => row.slug === entry.slug) ?? null;
  const publicationRow = publicationManifest?.rows?.find((row) => row.slug === entry.slug) ?? null;

  // Attempt to ingest a durable review artifact beside the packet.
  // The artifact is opt-in by deployment, present only when an
  // independent reviewer run has signed a per-article verdict with the
  // same hashes we just computed.
  if (bodyExists && bodySha && fmSha) {
    const reviewArtifactAbs = join(repoRoot, `${entry.evidence_packet_path}.review.json`);
    const ingested = ingestReviewArtifact({
      artifactPath: reviewArtifactAbs,
      bodySha,
      fmSha,
      entry,
      transition,
    });
    if (ingested.disposition === 'PASS') {
      reviewers = ingested.reviewers.map((r) => ({
        id: r.id,
        capability: r.capability,
        verdict: 'PASS',
        reviewed_body_sha256: transition.reviewed_body_sha256,
        reviewed_frontmatter_sha256: transition.reviewed_frontmatter_sha256,
        reviewed_at: typeof r.reviewed_at === 'string' ? r.reviewed_at : null,
        findings_ref: typeof r.findings_ref === 'string' ? r.findings_ref : null,
        review_run_id: typeof r.review_run_id === 'string' ? r.review_run_id : null,
      }));
      reviewArtifactPath = ingested.review_artifact_path;
      reviewArtifactSha = ingested.review_artifact_sha256;
      reviewPasses = ingested.passes;
      reviewFindings = ingested.findings;
      reviewManifest = ingested.review_manifest;
      complianceChecklist = ingested.compliance_checklist;
      seoAeoChecklist = ingested.seo_aeo_checklist;
      claimToSource = ingested.claim_to_source;
      reviewedAtUtc = ingested.reviewed_at_utc;
      holdReason = null;
    } else {
      holdReason = ingested.reason;
    }
  } else if (!bodyExists) {
    holdReason = 'body_md_not_found';
  } else if (!fmSha) {
    holdReason = 'frontmatter_not_detected';
  }

  if (
    holdReason === null &&
    (!assetRow ||
      assetRow.program_row_id !== entry.program_row_id ||
      assetRow.title !== entry.title ||
      assetRow.body_sha256 !== bodySha ||
      assetRow.frontmatter_sha256 !== fmSha ||
      assetRow.disposition !== 'PASS' ||
      !Array.isArray(assetRow.assets) ||
      assetRow.assets.length !== 3 ||
      !['hero', 'social', 'inline'].every((kind) =>
        assetRow.assets.some((asset) => asset.kind === kind)
      ) ||
      assetRow.assets.some((asset) => asset.disposition !== 'PASS'))
  ) {
    holdReason = 'asset_evidence_missing_stale_or_hold';
    reviewers = [];
  }
  if (
    holdReason === null &&
    (!publicationRow ||
      publicationRow.program_row_id !== entry.program_row_id ||
      publicationRow.title !== entry.title ||
      publicationRow.canonical_url !== entry.canonical_url ||
      publicationRow.source_path !== entry.repo_path ||
      publicationRow.body_sha256 !== bodySha ||
      publicationRow.frontmatter_sha256 !== fmSha ||
      publicationRow.asset_evidence_sha256 !== assetEvidence?._sha256 ||
      publicationRow.disposition !== 'READY' ||
      !publicationRow.rollback_reference ||
      !publicationRow.release_owner ||
      !Array.isArray(publicationRow.expected_targets) ||
      publicationRow.expected_targets.length === 0)
  ) {
    holdReason = 'publication_manifest_missing_stale_or_hold';
    reviewers = [];
  }

  const packet = {
    artifact_type: 'mrx1000_release_10_per_article_evidence_packet',
    program_row_id: entry.program_row_id,
    slug: entry.slug,
    title: entry.title,
    canonical_url: entry.canonical_url,
    pillar: entry.pillar,
    cluster: entry.cluster,
    evidence_packet_path: entry.evidence_packet_path,
    body_sha256: bodySha ?? '0'.repeat(64),
    frontmatter_sha256: fmSha ?? '0'.repeat(64),
    body_path_declared: entry.repo_path,
    body_sha256_declared: entry.repo_sha256 ?? null,
    reviewed_body_sha256_declared: entry.article_sha256 ?? entry.repo_sha256 ?? null,
    body_path_resolved_exists: bodyExists,
    body_sha256_matches_declared: bodyExists && entry.repo_sha256 === bodySha,
    body_sha256_matches_declared_or_authorized_transition:
      bodyExists && transition.authorized,
    controlled_publication_transition: transition,
    editorial_disposition: reviewers.length >= 3 || (reviewers.length >= 2 && reviewers.some((r) => r.capability === 'editorial'))
      ? disposition
      : 'HOLD',
    factual_citation_disposition: reviewers.length >= 3 || (reviewers.length >= 2 && reviewers.some((r) => r.capability === 'factual_citation'))
      ? disposition
      : 'HOLD',
    compliance_disposition: reviewers.length >= 3 || (reviewers.length >= 2 && reviewers.some((r) => r.capability === 'compliance'))
      ? disposition
      : 'HOLD',
    reviewers,
    review_artifact_path: reviewArtifactPath,
    review_artifact_sha256: reviewArtifactSha,
    review_passes: reviewPasses,
    review_findings: reviewFindings,
    review_manifest: reviewManifest,
    compliance_checklist: complianceChecklist,
    seo_aeo_checklist: seoAeoChecklist,
    asset_manifest: assetRow
      ? {
          evidence_path: assetEvidence._path,
          evidence_sha256: assetEvidence._sha256,
          frontmatter_sha256: assetRow.frontmatter_sha256,
          disposition: assetRow.disposition,
          assets: assetRow.assets,
        }
      : null,
    publication_manifest: publicationRow
      ? {
          evidence_path: publicationManifest._path,
          evidence_sha256: publicationManifest._sha256,
          disposition: publicationRow.disposition,
          source_path: publicationRow.source_path,
          body_sha256: publicationRow.body_sha256,
          frontmatter_sha256: publicationRow.frontmatter_sha256,
          expected_targets: publicationRow.expected_targets,
          rollback_reference: publicationRow.rollback_reference,
          release_owner: publicationRow.release_owner,
        }
      : null,
    reviewed_at_utc: reviewedAtUtc,
    hold_reason: holdReason,
    claim_to_source: claimToSource,
    generated_at_utc: materializedAt,
    generator: 'scripts/build-mrx1000-release-10-evidence-packets.mjs',
    fail_closed: true,
    notes: [
      'Evidence packet materialized by the canonical lifecycle dashboard machinery (D-2026-0721-21).',
      'Hash identity is supporting evidence only; it does not satisfy editorial, factual/citation, or compliance review.',
      'Disposition remains HOLD until a durable, hash-matched review artifact is ingested covering editorial, factual_citation, and compliance capabilities with at least two distinct reviewer identities.',
      'For exact-admission publication, current deployed bytes may differ from reviewed bytes only by publication_status draft→published and noindex true→false; reversing those two fields must reproduce article_sha256 byte-for-byte.',
      'The hold_reason field explains the precise reason the packet was not promoted; PASS is never inferred from MDX existence or hash match alone.',
    ],
  };

  // Promote per-pass dispositions to PASS only when the reviewer list
  // contains a reviewer for the matching capability and the overall
  // verification succeeded. The reviewer presence check above pinned
  // each disposition either to HOLD (no reviewer for that capability)
  // or to the overall ingestion disposition (HOLD if no artifact; PASS
  // if one was found).
  if (reviewers.length > 0 && holdReason === null) {
    packet.editorial_disposition = 'PASS';
    packet.factual_citation_disposition = 'PASS';
    packet.compliance_disposition = 'PASS';
  }

  return packet;
}

/* ---------- main ---------- */

function stableStringify(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}

function main() {
  const batchPath = join(repoRoot, 'config', 'mrx1000-release-10-batch.json');
  const batch = readJson(batchPath);
  const articles = batch.articles ?? [];
  const materializedAt = batch.evidence_scaffold_generated_at_utc;
  if (typeof materializedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(materializedAt)) {
    throw new Error('config/mrx1000-release-10-batch.json must declare evidence_scaffold_generated_at_utc');
  }

  const assetEvidencePath = join(repoRoot, 'artifacts/mrx1000-release-10/assets/asset-evidence.json');
  const publicationManifestPath = join(
    repoRoot,
    'artifacts/mrx1000-release-10/release/publication-manifest.json',
  );
  const assetEvidence = verifySidecar(assetEvidencePath)
    ? {
        ...readJson(assetEvidencePath),
        _path: relative(repoRoot, assetEvidencePath),
        _sha256: sha256(readFileSync(assetEvidencePath)),
      }
    : null;
  const publicationManifest = verifySidecar(publicationManifestPath)
    ? {
        ...readJson(publicationManifestPath),
        _path: relative(repoRoot, publicationManifestPath),
        _sha256: sha256(readFileSync(publicationManifestPath)),
      }
    : null;

  const written = [];
  const manifest = {
    artifact_type: 'mrx1000_release_10_evidence_packet_manifest',
    generated_at_utc: materializedAt,
    generator: 'scripts/build-mrx1000-release-10-evidence-packets.mjs',
    packets: [],
  };
  let passCount = 0;
  let holdCount = 0;
  for (const entry of articles) {
    const outPath = join(repoRoot, entry.evidence_packet_path);
    if (!outPath.startsWith(repoRoot)) {
      throw new Error(`Refusing to write outside repo: ${outPath}`);
    }
    mkdirSync(dirname(outPath), { recursive: true });
    const bodyPath = join(repoRoot, entry.repo_path);
    const packet = buildPacket({
      entry,
      bodyPath,
      materializedAt,
      assetEvidence,
      publicationManifest,
    });
    const text = stableStringify(packet);
    writeFileSync(outPath, text, 'utf8');
    const packetSha = sha256(Buffer.from(text, 'utf8'));
    writeFileSync(`${outPath}.sha256`, `${packetSha}  ${entry.evidence_packet_path}\n`, 'utf8');
    if (packet.editorial_disposition === 'PASS') passCount++;
    else holdCount++;
    manifest.packets.push({
      slug: entry.slug,
      program_row_id: entry.program_row_id,
      evidence_packet_path: entry.evidence_packet_path,
      evidence_packet_sha256: packetSha,
      editorial_disposition: packet.editorial_disposition,
      factual_citation_disposition: packet.factual_citation_disposition,
      compliance_disposition: packet.compliance_disposition,
      hold_reason: packet.hold_reason,
      review_artifact_path: packet.review_artifact_path,
      review_artifact_sha256: packet.review_artifact_sha256,
      body_path: entry.repo_path,
      body_sha256_declared: entry.repo_sha256,
      body_sha256_observed: packet.body_sha256,
      body_sha256_matches_declared: packet.body_sha256_matches_declared,
      body_sha256_matches_declared_or_authorized_transition:
        packet.body_sha256_matches_declared_or_authorized_transition,
      controlled_publication_transition_state:
        packet.controlled_publication_transition?.state ?? null,
    });
    written.push({
      path: entry.evidence_packet_path,
      slug: entry.slug,
      disposition: packet.editorial_disposition,
      hold_reason: packet.hold_reason,
    });
  }

  const manifestPath = join(repoRoot, 'artifacts', 'mrx1000-release-10', 'evidence', '_manifest.json');
  mkdirSync(dirname(manifestPath), { recursive: true });
  const manifestText = stableStringify(manifest);
  writeFileSync(manifestPath, manifestText, 'utf8');
  writeFileSync(
    `${manifestPath}.sha256`,
    `${sha256(Buffer.from(manifestText, 'utf8'))}  ${relative(repoRoot, manifestPath)}\n`,
    'utf8',
  );

  console.log(`Wrote ${written.length} evidence packets under artifacts/mrx1000-release-10/evidence/.`);
  console.log(`Wrote manifest at ${relative(repoRoot, manifestPath)}.`);
  console.log(`Disposition summary: ${passCount} PASS, ${holdCount} HOLD.`);
  for (const w of written) {
    console.log(`  - ${w.path} (${w.disposition}${w.disposition === 'HOLD' ? `: ${w.hold_reason}` : ''})`);
  }
}

main();
