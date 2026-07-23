/**
 * scripts/_release-lifecycle-embedded.mjs
 *
 * Pure-function mirror of src/lib/release-lifecycle.ts. This file is
 * generated/synced manually with the canonical implementation; both
 * modules are covered by the same vitest spec under
 * tests/unit/release-lifecycle.spec.ts. Keeping an embedded mirror
 * inside scripts/ lets the canonical lifecycle dashboard run under
 * Node without a TS loader, while the test contract still verifies the
 * two implementations stay in sync.
 *
 * If you change src/lib/release-lifecycle.ts, mirror the change here
 * and re-run `pnpm test`. The dashboard script will use whichever
 * version is on disk; both must agree.
 */

/* ---------- Lifecycle stages ---------- */

export const LIFECYCLE_STAGES = [
  'draft',
  'searchatlas_review',
  'editorial_review',
  'compliance_review',
  'approved',
  'published',
  'retired',
];

export const PROGRAM_STATE_STAGES = ['authorized_admitted', 'public_live_legacy'];

const STAGE_AUTHORITY_RANK = {
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

export function stageAuthorityRank(stage) {
  return STAGE_AUTHORITY_RANK[stage] ?? -1;
}

/* ---------- URL helpers ---------- */

export function normalizeCanonicalUrl(value) {
  return String(value ?? '').trim().replace(/\/+$/, '').toLowerCase();
}

/* ---------- Program-state lookups ---------- */

export function buildAuthorizedAdmittedLookup(articles) {
  const byProgramRowId = new Map();
  const bySlug = new Map();
  const byCanonicalUrl = new Map();
  for (const entry of articles) {
    byProgramRowId.set(entry.program_row_id, entry);
    bySlug.set(entry.slug, entry);
    byCanonicalUrl.set(normalizeCanonicalUrl(entry.canonical_url), entry);
  }
  return { byProgramRowId, bySlug, byCanonicalUrl };
}

export function buildPublicLiveLegacyLookup(rows) {
  const byProgramRowId = new Set();
  const bySlug = new Set();
  const byCanonicalUrl = new Set();
  for (const row of rows) {
    if (row.program_row_id) byProgramRowId.add(row.program_row_id);
    if (row.slug) bySlug.add(row.slug);
    if (row.canonical_url) byCanonicalUrl.add(normalizeCanonicalUrl(row.canonical_url));
  }
  return { byProgramRowId, bySlug, byCanonicalUrl };
}

export function legacyLiveRowsFromLedger(rows) {
  const out = [];
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

/* ---------- Stage derivation ---------- */

export function deriveArticleLifecycleStage(frontmatter, lookups) {
  const status = String(frontmatter.publication_status ?? 'draft').toLowerCase();
  const draft = frontmatter.draft === true;
  const noindex = frontmatter.noindex === true;
  const prid = frontmatter.program_row_id ?? null;
  const slug = frontmatter.canonical_slug ?? frontmatter.slug ?? null;
  const canonicalUrl = frontmatter.canonical_slug
    ? normalizeCanonicalUrl(`https://mineralrightsxchange.com/blog/${frontmatter.canonical_slug}/`)
    : null;

  if (status === 'retired') return 'retired';

  if (status === 'published' && !draft && !noindex) {
    const prKey = prid ?? null;
    const slugKey = slug ?? null;
    const urlKey = canonicalUrl ?? null;
    if (
      (prKey && lookups.authorizedAdmitted.byProgramRowId.has(prKey)) ||
      (slugKey && lookups.authorizedAdmitted.bySlug.has(slugKey)) ||
      (urlKey && lookups.authorizedAdmitted.byCanonicalUrl.has(urlKey))
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
    return 'published';
  }

  if (status === 'approved') return 'approved';
  if (status === 'compliance_review') return 'compliance_review';
  if (status === 'editorial_review') return 'editorial_review';
  if (status === 'searchatlas_review') return 'searchatlas_review';

  const review = String(frontmatter.review_status ?? '').toLowerCase();
  const compliance = String(frontmatter.compliance_status ?? '').toLowerCase();
  if (review.includes('compliance') || compliance.includes('compliance')) return 'compliance_review';
  if (review.includes('editorial') || compliance.includes('editorial')) return 'editorial_review';
  if (review.includes('searchatlas') || compliance.includes('searchatlas')) return 'searchatlas_review';
  return 'draft';
}

/* ---------- Evidence packet evaluation ---------- */

const REQUIRED_PACKET_KEYS = [
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

export function evaluateEvidencePacket(packet) {
  const failures = [];
  for (const key of REQUIRED_PACKET_KEYS) {
    if (packet[key] == null) failures.push(`missing required key \`${key}\``);
  }
  if (packet.editorial_disposition !== 'PASS') {
    failures.push(`editorial_disposition must equal PASS (got ${packet.editorial_disposition ?? 'null'})`);
  }
  if (packet.factual_citation_disposition !== 'PASS') {
    failures.push(`factual_citation_disposition must equal PASS (got ${packet.factual_citation_disposition ?? 'null'})`);
  }
  if (packet.compliance_disposition !== 'PASS') {
    failures.push(`compliance_disposition must equal PASS (got ${packet.compliance_disposition ?? 'null'})`);
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
    const ids = new Set();
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
          pass.input_body_sha256 === packet.body_sha256 &&
          pass.input_frontmatter_sha256 === packet.frontmatter_sha256 &&
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

/* ---------- Decision parsing ---------- */

export function parseReleaseDecisionArtifact({ path, text, sha256, expectedSha256 }) {
  const normalized = String(text ?? '').replace(/\*\*/g, '');
  const idMatch = text.match(/D-\d{4}-\d{4}-\d{2}/);
  const capMatch = normalized.match(/PRESENT AUTHORIZATION CAP\s*[=:]\s*(\d+)/i);
  const totalCapMatch = normalized.match(/AUTHORIZATION CAP[^.\n]*?TOTAL[^.\n]*?[=:]\s*(\d+)/i);
  // Disposition signals: "Disposition: APPROVED|HOLD" wins; the canonical
  // artifact format in artifacts/mrx1000-release-10/decisions/ records
  // "**Status:** APPROVED — EFFECTIVE IMMEDIATELY; FAIL-CLOSED", so we
  // also accept "Status: APPROVED|HOLD" after stripping markdown bold.
  // The bare-word \bHOLD\b in earlier revisions was over-broad and
  // produced false positives whenever the body referenced HOLD in policy
  // language; we strip it.
  const hold = /\b(?:Disposition|Status)\s*[:=]\s*HOLD\b/i.test(normalized);
  const approved = /\b(?:Disposition|Status)\s*[:=]\s*APPROVED\b/i.test(normalized);
  const releaseTrue =
    /(?:^|\n)\s*(?:release_authorized|public_release_authorized)\s*:\s*true\s*(?:$|\n)/im.test(normalized);
  const indexTrue =
    /(?:^|\n)\s*(?:index_authorized|indexing_authorized)\s*:\s*true\s*(?:$|\n)/im.test(normalized);

  const decisionId = idMatch?.[0] ?? 'D-UNKNOWN';
  const totalCap = totalCapMatch ? Number(totalCapMatch[1]) : null;
  const newCap = capMatch ? Number(capMatch[1]) : null;
  const shaMatches = expectedSha256 ? sha256 === expectedSha256 : true;
  return {
    decision_id: decisionId,
    signed: shaMatches,
    signed_artifact: path,
    signed_artifact_sha256: sha256,
    signed_artifact_sha256_verified: shaMatches,
    disposition: hold ? 'HOLD' : approved ? 'APPROVED' : 'HOLD',
    authorization_cap_new_mrx1000_rows: newCap,
    authorization_cap_total_released_articles: totalCap,
    release_authorized: !hold && approved && releaseTrue,
    index_authorized: !hold && approved && indexTrue,
  };
}

/* ---------- Gate evaluation ---------- */

function identityMatchedVia(row, lookup) {
  const entry = findAuthorizedEntry(row, lookup);
  if (!entry) return null;
  if (row.program_row_id && entry.program_row_id === row.program_row_id) return 'program_row_id';
  if (row.slug && entry.slug === row.slug) return 'slug';
  if (
    row.canonical_url &&
    normalizeCanonicalUrl(entry.canonical_url) === normalizeCanonicalUrl(row.canonical_url)
  ) return 'canonical_url';
  return null;
}

function findAuthorizedEntry(row, lookup) {
  const candidates = [
    row.program_row_id ? lookup.byProgramRowId.get(row.program_row_id) : null,
    row.slug ? lookup.bySlug.get(row.slug) : null,
    row.canonical_url
      ? lookup.byCanonicalUrl.get(normalizeCanonicalUrl(row.canonical_url))
      : null,
  ].filter(Boolean);
  if (!candidates.length) return null;
  const candidate = candidates[0];
  if (candidates.some((entry) => entry !== candidate)) return null;
  if (row.program_row_id && candidate.program_row_id !== row.program_row_id) return null;
  if (row.slug && candidate.slug !== row.slug) return null;
  if (
    row.canonical_url &&
    normalizeCanonicalUrl(candidate.canonical_url) !== normalizeCanonicalUrl(row.canonical_url)
  ) return null;
  return candidate;
}

function evaluateEarnedScaleGate(gate, observation) {
  const required = [];
  const missing = [];
  const satisfied = [];
  const notes = [];

  if (gate.no_open_critical_or_high_findings_required) required.push('no_open_critical_or_high_findings');
  if (gate.release_rollback_evidence_required) required.push('release_rollback_evidence_present');
  if (gate.batch_retrospective_required) required.push('batch_retrospective_present');
  if (gate.no_repeated_systemic_defect_required) required.push('no_repeated_systemic_defect');
  if (gate.scale_capacity_review_required) required.push('scale_capacity_review_present');

  const observationDays = observation?.observation_window_days_observed ?? 0;
  if (observationDays < (gate.minimum_observation_window_days ?? 0)) {
    missing.push(`observation window: ${observationDays} days < required ${gate.minimum_observation_window_days} days`);
  } else {
    satisfied.push(`observation window: ${observationDays} days >= required ${gate.minimum_observation_window_days} days`);
  }

  const sampleSize = observation?.independent_audit_sample_size ?? 0;
  const minSample = gate.minimum_independent_audit_sample_size ?? 0;
  if (gate.minimum_independent_audit_sample_pct != null) {
    notes.push(`audit_minimum_independent_pct = ${gate.minimum_independent_audit_sample_pct}%`);
  }
  if (sampleSize < minSample) {
    missing.push(`independent audit sample size: ${sampleSize} < required ${minSample}`);
  } else {
    satisfied.push(`independent audit sample size: ${sampleSize} >= ${minSample}`);
  }

  if (
    gate.audit_must_include_all_high_risk_legal_tax_valuation_articles ||
    gate.audit_must_include_legal_tax_valuation_sensitive_articles
  ) {
    const highRiskInPopulation = observation?.high_risk_legal_tax_valuation_articles_in_population ?? 0;
    const highRiskInAudit = observation?.high_risk_legal_tax_valuation_articles_in_audit ?? 0;
    if (highRiskInPopulation > 0 && highRiskInAudit < highRiskInPopulation) {
      missing.push(`high-risk legal/tax/valuation articles audited: ${highRiskInAudit} < ${highRiskInPopulation} in population`);
    } else if (highRiskInPopulation > 0) {
      satisfied.push(`high-risk legal/tax/valuation articles audited: ${highRiskInAudit}/${highRiskInPopulation}`);
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
  const disposition = missing.length === 0
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

export function evaluateReleaseGates({
  releaseDecision,
  authorizedBatch,
  publicLiveLegacyRows,
  rows,
  evidencePacketLookup,
  earnedScaleGateObservations = {},
}) {
  const authorized = authorizedBatch;
  const cap = authorized.policy.authorization_cap_released_articles;
  const authorizedAdmittedLookup = buildAuthorizedAdmittedLookup(authorized.articles);
  buildPublicLiveLegacyLookup(publicLiveLegacyRows); // for symmetry, not strictly used here
  const blocking = [];
  const informational = [];

  const decision = releaseDecision;
  const policy = {
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
    blocking.push('No signed release decision on disk; treated as HOLD. The cap (10) cannot be authorized.');
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

  const byStage = {
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
  const dispositionsByRow = [];
  const publishedRows = [];
  let unauthorized = 0;
  const unauthorizedSlugs = [];
  let distLive = 0;
  for (const row of rows) {
    byStage[row.lifecycle_stage] = (byStage[row.lifecycle_stage] ?? 0) + 1;

    let membership = 'none';
    let capAgainstAuth = 'OUT_OF_SCOPE';
    const notes = [];

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

    if (row.lifecycle_stage === 'authorized_admitted' && membership === 'authorized_admitted') {
      const entry = findAuthorizedEntry(row, authorizedAdmittedLookup);
      const packet = entry ? evidencePacketLookup(entry) : null;
      let evidenceDisposition;
      if (!entry) {
        evidenceDisposition = 'MISSING';
        blocking.push(
          `Authorized-admitted row ${row.slug ?? row.program_row_id} has no entry in the release-10 batch file.`,
        );
      } else if (!packet) {
        evidenceDisposition = 'MISSING';
        blocking.push(`Evidence packet missing for ${entry.slug}: expected at ${entry.evidence_packet_path}.`);
      } else {
        const verdict = evaluateEvidencePacket(packet);
        evidenceDisposition = verdict.ok ? 'PASS' : 'FAIL';
        if (!verdict.ok) {
          blocking.push(`Evidence packet for ${entry.slug} failed: ${verdict.failures.join(', ')}.`);
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

  const observedReleaseTotal = publishedRows.filter((row) => row.lifecycle_stage === 'authorized_admitted').length;
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

  const earnedScaleGates = (authorized.policy.earned_scale_gates ?? []).map((gate, index) =>
    evaluateEarnedScaleGate(gate, earnedScaleGateObservations[index === 0 ? '10_to_25' : '25_to_50'] ?? {}),
  );
  for (const evaluated of earnedScaleGates) {
    if (evaluated.disposition === 'BLOCK' && evaluated.evaluated) {
      informational.push(
        `Future earned scale-gate ${evaluated.from_cap} to ${evaluated.to_cap}: BLOCK. Missing preconditions: ${evaluated.preconditions_missing.join(', ') || '(no preconditions satisfied)'}; signed decision id observed: ${evaluated.signed_decision_id ?? '(none)'}. This blocks raising the cap, not releases within the current cap.`,
      );
    }
  }

  let packetsRequired = 0;
  let packetsPresent = 0;
  let packetsPassing = 0;
  let packetsFailing = 0;
  const failingPacketSlugs = [];
  for (const entry of authorized.articles) {
    packetsRequired += 1;
    const packet = evidencePacketLookup(entry);
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

  return {
    policy,
    aggregate_counts: {
      by_stage: byStage,
      total_rows: rows.length,
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
}
