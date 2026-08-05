#!/usr/bin/env node

/**
 * Build the local-only MRX1000 internal-link and conversion activation plan.
 *
 * This generator is intentionally additive. It reads the canonical content
 * ledger and the signed D16 continuous-publication decision, then writes JSON/CSV/report
 * sidecars. It never edits content, the canonical ledger, or a production
 * surface. Planned future article URLs are valid targets when they resolve to
 * another row in the canonical ledger.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectLedgerArticlesForRuntime } from './_mrx1000-runtime-publication-projection.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const MRX_ROOT = resolve(HERE, '..');
export const LEDGER_PATH = join(MRX_ROOT, 'config', 'mrx-1000-canonical-content-ledger.json');
export const OWNER_DECISION_PATH = resolve(
  MRX_ROOT,
  'docs',
  'governance',
  'mrx1000-owner-continuous-publication-directive-2026-08-04.md',
);
export const JSON_OUT = join(MRX_ROOT, 'config', 'mrx-1000-content-activation-plan.json');
export const CSV_OUT = join(MRX_ROOT, 'config', 'mrx-1000-content-activation-plan.csv');
export const REPORT_OUT = join(MRX_ROOT, 'reports', 'mrx-1000-content-activation-plan.md');

const SITE_ORIGIN = 'https://mineralrightsxchange.com';
const PLAN_VERSION = 'mrx1000-content-activation-v1.1.0';
export const EXPECTED_OWNER_DECISION_SHA256 =
  'edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f';

export const CLUSTER_PILLARS = Object.freeze({
  'sell-mineral-rights-decision-process': Object.freeze({
    pillar: 'sell-mineral-rights',
    url: '/sell-mineral-rights/',
    routeEvidence: 'src/pages/sell-mineral-rights.astro',
    bookLabel: 'Talk Through My Selling Options',
  }),
  'valuation-methodology-drivers': Object.freeze({
    pillar: 'mineral-rights-value',
    url: '/mineral-rights-value/',
    routeEvidence: 'src/pages/mineral-rights-value.astro',
    bookLabel: 'Understand My Value Factors',
  }),
  'offer-review-buyer-comparison-safety': Object.freeze({
    pillar: 'offer-review',
    url: '/offer-review/',
    routeEvidence: 'src/pages/offer-review.astro',
    bookLabel: 'Review My Written Offer',
  }),
  'inherited-estate-probate': Object.freeze({
    pillar: 'inherited-mineral-rights',
    url: '/inherited-mineral-rights/',
    routeEvidence: 'src/pages/inherited-mineral-rights.astro',
    bookLabel: 'Organize My Inherited-Rights Records',
  }),
  'royalties-owner-operations': Object.freeze({
    pillar: 'oil-and-gas-royalties',
    url: '/learning-center/oil-and-gas-royalties/',
    routeEvidence: 'src/pages/learning-center/oil-and-gas-royalties/index.astro',
    bookLabel: 'Review My Royalty Information',
  }),
  'tax-1031-legal-education': Object.freeze({
    pillar: 'mineral-rights-taxes',
    url: '/learning-center/mineral-rights-taxes/',
    routeEvidence: 'src/pages/learning-center/mineral-rights-taxes/index.astro',
    bookLabel: 'Prepare Questions for My Adviser',
  }),
  'texas-county-basin-local-intent': Object.freeze({
    pillar: 'texas-mineral-rights',
    url: '/mineral-rights/texas/',
    routeEvidence: 'src/pages/mineral-rights/[state].astro#stateGuides:texas',
    bookLabel: 'Discuss My Texas Mineral Rights',
  }),
  'title-lease-ownership-documents': Object.freeze({
    pillar: 'title-lease-ownership',
    url: '/learning-center/title-lease-ownership/',
    routeEvidence: 'src/pages/learning-center/title-lease-ownership/index.astro',
    bookLabel: 'Organize My Ownership Documents',
  }),
  'mrx-methodology-transparency-underwriter-process': Object.freeze({
    pillar: 'mrx-methodology',
    url: '/methodology/',
    routeEvidence: 'src/pages/methodology.astro',
    bookLabel: 'Talk With the MRX Team',
  }),
});

export const APPROVED_CONVERSION_DESTINATIONS = Object.freeze({
  education: Object.freeze({
    url: '/free-guide/',
    action: 'free_guide',
    label: 'Get the Free Mineral Rights Guide',
    assignmentRule: 'education_stage_nurture',
    placementCode: 'mid_article',
    placementGuidance:
      'Place after the direct answer or first useful checklist, before the first deep-dive section.',
  }),
  consideration: Object.freeze({
    url: '/book/',
    action: 'book_review',
    assignmentRule: 'consideration_stage_assisted_review',
    placementCode: 'contextual_inline',
    placementGuidance:
      'Place after the first comparison, risk, document, or decision-framework section.',
  }),
  decision: Object.freeze({
    url: '/book/',
    action: 'book_review',
    assignmentRule: 'decision_stage_team_handoff',
    placementCode: 'closing_panel',
    placementGuidance:
      'Place in the closing decision panel after key takeaways and before related articles.',
  }),
});

const APPROVED_ROUTE_EVIDENCE = Object.freeze({
  '/book/': 'src/pages/book.astro',
  '/free-guide/': 'src/pages/free-guide.astro',
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Recompute the canonical ledger's documented row fingerprint exactly as
 * scripts/build-mrx-1000-content-ledger.mjs#hashRows does. Keep this local so
 * the activation plan does not trust a self-declared source fingerprint.
 */
export function canonicalLedgerRowFingerprint(rows) {
  return sha256(
    JSON.stringify(
      rows.map((row) => ({
        slug: row.canonical_slug,
        title: row.canonical_title,
        cluster: row.cluster,
        keyword: row.primary_keyword,
        source: row.source_handle,
      })),
    ),
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function internalArticleUrl(article) {
  const parsed = new URL(article.canonical_url);
  assert(parsed.origin === SITE_ORIGIN, `${article.program_row_id}: unexpected canonical origin`);
  assert(
    parsed.search === '' && parsed.hash === '',
    `${article.program_row_id}: canonical URL has query/hash`,
  );
  assert(
    parsed.pathname.endsWith('/'),
    `${article.program_row_id}: canonical URL lacks trailing slash`,
  );
  assert(
    parsed.pathname === `/blog/${article.canonical_slug}/`,
    `${article.program_row_id}: canonical URL does not match canonical_slug`,
  );
  return parsed.pathname;
}

function readOwnerDecisionEvidence(decisionText) {
  const decisionSha256 = sha256(decisionText);
  assert(
    decisionSha256 === EXPECTED_OWNER_DECISION_SHA256,
    `Owner decision SHA-256 mismatch: expected ${EXPECTED_OWNER_DECISION_SHA256}, found ${decisionSha256}`,
  );
  assert(
    decisionText.includes('Decision ID: D-2026-0804-16'),
    'Owner decision id is missing or changed',
  );
  assert(
    decisionText.includes('Disposition: APPROVED — CONTINUOUS QUALITY-GATED ARTICLE PUBLICATION'),
    'Owner continuous-publication disposition is missing or changed',
  );
  assert(
    decisionText.includes('release_authorized: true'),
    'Owner release authorization is missing or changed',
  );
  assert(
    decisionText.includes('Article count and elapsed time do not.'),
    'Owner numerical-cap supersession is missing or changed',
  );

  return {
    decision_id: 'D-2026-0804-16',
    signed_disposition: 'APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION',
    numerical_release_cap_applies: false,
    elapsed_time_gate_applies: false,
    spend_authorized: false,
    publication_authorized: true,
    index_authorized: true,
    decision_sha256: decisionSha256,
    decision_sha256_verified: true,
    source_path: 'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
  };
}

function validateApprovedConversionRoutes() {
  for (const [url, relativePath] of Object.entries(APPROVED_ROUTE_EVIDENCE)) {
    assert(
      url.startsWith('/') && url.endsWith('/'),
      `approved conversion URL is not canonical: ${url}`,
    );
    assert(
      existsSync(join(MRX_ROOT, relativePath)),
      `${url}: route evidence is missing at ${relativePath}`,
    );
  }
}

function validatePillarRoutes() {
  for (const pillar of Object.values(CLUSTER_PILLARS)) {
    const relativePath = pillar.routeEvidence.split('#', 1)[0];
    assert(
      pillar.url.startsWith('/') && pillar.url.endsWith('/'),
      `pillar URL is not canonical: ${pillar.url}`,
    );
    assert(
      existsSync(join(MRX_ROOT, relativePath)),
      `${pillar.url}: pillar route evidence is missing at ${relativePath}`,
    );
  }
}

/**
 * Build a deterministic sidecar plan from an already-parsed canonical ledger.
 * Exported for focused invariant tests; no files are written here.
 */
export function buildActivationPlan(ledger, ownerDecisionText) {
  assert(Array.isArray(ledger.articles), 'canonical ledger articles must be an array');
  assert(
    ledger.articles.length === 1000,
    `expected 1,000 canonical rows, found ${ledger.articles.length}`,
  );
  assert(
    ledger.verification?.aggregate_eq_1000 === true,
    'canonical ledger does not assert aggregate_eq_1000',
  );
  const computedLedgerFingerprint = canonicalLedgerRowFingerprint(ledger.articles);
  assert(
    ledger.content_fingerprint_sha256 === computedLedgerFingerprint,
    `canonical ledger fingerprint mismatch: expected ${ledger.content_fingerprint_sha256}, ` +
      `computed ${computedLedgerFingerprint}`,
  );
  validateApprovedConversionRoutes();
  validatePillarRoutes();
  const runtimeArticles = projectLedgerArticlesForRuntime(ledger.articles, MRX_ROOT).articles;

  const ownerDecision = readOwnerDecisionEvidence(ownerDecisionText);
  const rowsByCluster = new Map();
  for (const article of runtimeArticles) {
    assert(
      CLUSTER_PILLARS[article.cluster],
      `${article.program_row_id}: unmapped cluster ${article.cluster}`,
    );
    const clusterRows = rowsByCluster.get(article.cluster) ?? [];
    clusterRows.push(article);
    rowsByCluster.set(article.cluster, clusterRows);
  }
  for (const clusterRows of rowsByCluster.values()) {
    clusterRows.sort((a, b) => a.program_row_id.localeCompare(b.program_row_id));
    assert(
      clusterRows.length > 1,
      `cluster ${clusterRows[0]?.cluster ?? '(unknown)'} has no sibling candidate`,
    );
  }

  const rows = runtimeArticles
    .map((article) => {
      const pillar = CLUSTER_PILLARS[article.cluster];
      assert(article.pillar === pillar.pillar, `${article.program_row_id}: ledger pillar mismatch`);
      assert(
        article.pillar_url === pillar.url,
        `${article.program_row_id}: ledger pillar URL mismatch`,
      );

      const clusterRows = rowsByCluster.get(article.cluster);
      const index = clusterRows.findIndex(
        (candidate) => candidate.program_row_id === article.program_row_id,
      );
      assert(index >= 0, `${article.program_row_id}: missing from deterministic cluster group`);
      const sibling = clusterRows[(index + 1) % clusterRows.length];
      assert(
        sibling.program_row_id !== article.program_row_id,
        `${article.program_row_id}: self-link selected`,
      );

      const conversion = APPROVED_CONVERSION_DESTINATIONS[article.funnel_stage];
      assert(
        conversion,
        `${article.program_row_id}: unsupported funnel stage ${article.funnel_stage}`,
      );
      const ctaLabel = conversion.url === '/book/' ? pillar.bookLabel : conversion.label;
      const appointmentIsPrimary = conversion.url === '/book/';
      const appointmentPlacementCode = appointmentIsPrimary
        ? conversion.placementCode
        : 'closing_team_handoff';
      const appointmentPlacementGuidance = appointmentIsPrimary
        ? conversion.placementGuidance
        : 'Place after the final takeaway and primary guide CTA, before related articles, as the optional MRX team handoff.';
      const appointmentAssignmentRule = appointmentIsPrimary
        ? conversion.assignmentRule
        : 'education_stage_optional_team_handoff';
      const sourceRouteLive = article.preservation_classification === 'live_public_published_route';

      return {
        program_row_id: article.program_row_id,
        canonical_title: article.canonical_title,
        canonical_slug: article.canonical_slug,
        canonical_url: internalArticleUrl(article),
        cluster: article.cluster,
        pillar: article.pillar,
        search_intent: article.search_intent,
        funnel_stage: article.funnel_stage,
        source_preservation_classification: article.preservation_classification,
        source_route_live: sourceRouteLive,
        pillar_link: {
          url: pillar.url,
          route_evidence: pillar.routeEvidence,
          status: 'planned_local_only',
        },
        sibling_link: {
          target_program_row_id: sibling.program_row_id,
          target_title: sibling.canonical_title,
          url: internalArticleUrl(sibling),
          relationship: 'same_cluster_next_by_program_row_id_cyclic',
          target_source_preservation_classification: sibling.preservation_classification,
          target_route_live: sibling.preservation_classification === 'live_public_published_route',
          status: 'planned_local_only',
        },
        primary_cta: {
          url: conversion.url,
          label: ctaLabel,
          name: `mrx1000-${article.pillar}-${conversion.action}-${conversion.placementCode}`,
          placement_code: conversion.placementCode,
          placement_guidance: conversion.placementGuidance,
          assignment_rule: conversion.assignmentRule,
          assignment_basis: `${article.funnel_stage}:${article.search_intent}`,
          approved_route_evidence: APPROVED_ROUTE_EVIDENCE[conversion.url],
          role: appointmentIsPrimary ? 'primary_appointment' : 'primary_nurture',
          is_appointment_cta: appointmentIsPrimary,
          status: 'planned_local_only',
        },
        appointment_cta: {
          url: '/book/',
          label: pillar.bookLabel,
          name: `mrx1000-${article.pillar}-book_review-${appointmentPlacementCode}`,
          placement_code: appointmentPlacementCode,
          placement_guidance: appointmentPlacementGuidance,
          assignment_rule: appointmentAssignmentRule,
          assignment_basis: `${article.funnel_stage}:${article.search_intent}`,
          approved_route_evidence: APPROVED_ROUTE_EVIDENCE['/book/'],
          role: appointmentIsPrimary
            ? 'same_as_primary_appointment'
            : 'secondary_appointment_after_primary_nurture',
          distinct_from_primary_cta: !appointmentIsPrimary,
          status: 'planned_local_only',
        },
        evidence: {
          triangle_plan_status: 'planned_complete',
          primary_cta_plan_status: 'planned_complete',
          appointment_cta_plan_status: 'planned_complete',
          rendered_status: 'not_rendered_or_verified_by_this_plan',
          rendered_triangle_verified: false,
          live_status: 'not_published_or_verified_by_this_plan',
          live_triangle_verified: false,
          release_status: sourceRouteLive
            ? 'released_under_d16_continuous_quality_gate'
            : 'eligible_for_continuous_quality_review_not_yet_cleared',
          numerical_release_cap_applies: false,
        },
      };
    })
    .sort((a, b) => a.program_row_id.localeCompare(b.program_row_id));

  const rowIds = new Set(rows.map((row) => row.program_row_id));
  const articleUrls = new Set(rows.map((row) => row.canonical_url));
  let invalidSiblingTargets = 0;
  let selfTargets = 0;
  let crossClusterTargets = 0;
  let nonCanonicalUrls = 0;
  const rowById = new Map(rows.map((row) => [row.program_row_id, row]));

  for (const row of rows) {
    const target = rowById.get(row.sibling_link.target_program_row_id);
    if (!target || target.canonical_url !== row.sibling_link.url) invalidSiblingTargets++;
    if (row.sibling_link.target_program_row_id === row.program_row_id) selfTargets++;
    if (target && target.cluster !== row.cluster) crossClusterTargets++;
    for (const url of [
      row.canonical_url,
      row.pillar_link.url,
      row.sibling_link.url,
      row.primary_cta.url,
      row.appointment_cta.url,
    ]) {
      if (!url.startsWith('/') || !url.endsWith('/') || url.includes('?') || url.includes('#')) {
        nonCanonicalUrls++;
      }
    }
  }

  const verification = {
    row_count: rows.length,
    unique_program_row_id_count: rowIds.size,
    unique_canonical_article_url_count: articleUrls.size,
    planned_complete_triangle_count: rows.filter(
      (row) => row.evidence.triangle_plan_status === 'planned_complete',
    ).length,
    primary_cta_planned_count: rows.filter(
      (row) => row.evidence.primary_cta_plan_status === 'planned_complete',
    ).length,
    appointment_cta_planned_count: rows.filter(
      (row) => row.evidence.appointment_cta_plan_status === 'planned_complete',
    ).length,
    primary_appointment_cta_count: rows.filter((row) => row.primary_cta.is_appointment_cta).length,
    secondary_appointment_cta_count: rows.filter(
      (row) => row.appointment_cta.distinct_from_primary_cta,
    ).length,
    appointment_cta_book_url_count: rows.filter((row) => row.appointment_cta.url === '/book/')
      .length,
    rendered_triangle_verified_count: rows.filter((row) => row.evidence.rendered_triangle_verified)
      .length,
    live_triangle_verified_count: rows.filter((row) => row.evidence.live_triangle_verified).length,
    invalid_sibling_target_count: invalidSiblingTargets,
    self_sibling_target_count: selfTargets,
    cross_cluster_sibling_target_count: crossClusterTargets,
    noncanonical_or_nontrailing_url_count: nonCanonicalUrls,
    approved_primary_cta_destination_count: new Set(rows.map((row) => row.primary_cta.url)).size,
    approved_appointment_cta_destination_count: new Set(rows.map((row) => row.appointment_cta.url))
      .size,
    owner_decision_sha256_verified: ownerDecision.decision_sha256_verified,
    numerical_release_cap_applies: ownerDecision.numerical_release_cap_applies,
    continuous_quality_gating_active: ownerDecision.publication_authorized,
    canonical_ledger_fingerprint_verified:
      ledger.content_fingerprint_sha256 === computedLedgerFingerprint,
    all_invariants_pass:
      rows.length === 1000 &&
      rowIds.size === 1000 &&
      articleUrls.size === 1000 &&
      invalidSiblingTargets === 0 &&
      selfTargets === 0 &&
      crossClusterTargets === 0 &&
      nonCanonicalUrls === 0 &&
      rows.every((row) => row.evidence.triangle_plan_status === 'planned_complete') &&
      rows.every((row) => row.evidence.primary_cta_plan_status === 'planned_complete') &&
      rows.every((row) => row.evidence.appointment_cta_plan_status === 'planned_complete') &&
      rows.every((row) => row.appointment_cta.url === '/book/') &&
      rows.filter((row) => row.primary_cta.is_appointment_cta).length === 625 &&
      rows.filter((row) => row.appointment_cta.distinct_from_primary_cta).length === 375 &&
      rows.every((row) => row.evidence.rendered_triangle_verified === false) &&
      rows.every((row) => row.evidence.live_triangle_verified === false) &&
      ownerDecision.decision_sha256_verified === true &&
      ledger.content_fingerprint_sha256 === computedLedgerFingerprint &&
      ownerDecision.numerical_release_cap_applies === false &&
      ownerDecision.elapsed_time_gate_applies === false &&
      ownerDecision.publication_authorized === true,
  };
  assert(verification.all_invariants_pass, 'activation-plan invariants failed');

  const distributions = {
    by_cluster: countBy(rows, (row) => row.cluster),
    by_pillar: countBy(rows, (row) => row.pillar),
    by_funnel_stage: countBy(rows, (row) => row.funnel_stage),
    by_primary_cta_url: countBy(rows, (row) => row.primary_cta.url),
    by_appointment_cta_url: countBy(rows, (row) => row.appointment_cta.url),
    by_primary_cta_placement: countBy(rows, (row) => row.primary_cta.placement_code),
    by_appointment_cta_placement: countBy(rows, (row) => row.appointment_cta.placement_code),
    by_source_preservation_classification: countBy(
      rows,
      (row) => row.source_preservation_classification,
    ),
  };

  const fingerprintPayload = {
    plan_version: PLAN_VERSION,
    source_ledger_fingerprint_sha256: computedLedgerFingerprint,
    owner_decision_sha256: ownerDecision.decision_sha256,
    rows,
  };

  return {
    artifact_type: 'mrx1000_content_activation_plan',
    plan_version: PLAN_VERSION,
    generated_at: ledger.generated_at,
    generated_at_method: 'canonical_ledger_generated_at',
    generator: 'scripts/build-mrx-1000-activation-plan.mjs',
    content_fingerprint_sha256: sha256(JSON.stringify(fingerprintPayload)),
    inputs: {
      canonical_ledger_path: 'config/mrx-1000-canonical-content-ledger.json',
      canonical_ledger_fingerprint_sha256: computedLedgerFingerprint,
      canonical_ledger_fingerprint_verified: true,
      canonical_ledger_generated_at: ledger.generated_at,
      owner_decision: ownerDecision,
    },
    policy: {
      local_sidecar_only: true,
      edits_article_content: false,
      publishes_or_deploys: false,
      performs_external_calls: false,
      spends_or_mutates_vendor_state: false,
      planned_future_canonical_rows_are_valid_sibling_targets: true,
      planned_status_is_not_rendered_or_live_evidence: true,
      continuous_quality_gated_publication: true,
      numerical_release_cap_applies: false,
      elapsed_time_gate_applies: false,
      owner_decision_exact_sha256_required: EXPECTED_OWNER_DECISION_SHA256,
      canonical_ledger_fingerprint_recomputed: true,
      sibling_selection: 'same_cluster_next_by_program_row_id_cyclic',
      primary_cta_selection:
        'education=>/free-guide/ nurture; consideration|decision=>/book/ appointment; search intent retained as assignment evidence',
      appointment_cta_selection:
        'all rows=>/book/; education receives a distinct secondary handoff, consideration|decision use their primary CTA as the appointment handoff',
      approved_conversion_destinations: APPROVED_ROUTE_EVIDENCE,
    },
    verification,
    distributions,
    rows,
  };
}

function csvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function renderCsv(plan) {
  const columns = [
    'program_row_id',
    'canonical_title',
    'canonical_slug',
    'canonical_url',
    'cluster',
    'pillar',
    'search_intent',
    'funnel_stage',
    'source_preservation_classification',
    'source_route_live',
    'pillar_url',
    'pillar_route_evidence',
    'pillar_link_status',
    'sibling_target_program_row_id',
    'sibling_target_title',
    'sibling_url',
    'sibling_relationship',
    'sibling_target_source_preservation_classification',
    'sibling_target_route_live',
    'sibling_link_status',
    'primary_cta_url',
    'primary_cta_label',
    'primary_cta_name',
    'primary_cta_placement_code',
    'primary_cta_placement_guidance',
    'primary_cta_assignment_rule',
    'primary_cta_assignment_basis',
    'primary_cta_approved_route_evidence',
    'primary_cta_role',
    'primary_cta_is_appointment',
    'primary_cta_status',
    'appointment_cta_url',
    'appointment_cta_label',
    'appointment_cta_name',
    'appointment_cta_placement_code',
    'appointment_cta_placement_guidance',
    'appointment_cta_assignment_rule',
    'appointment_cta_assignment_basis',
    'appointment_cta_approved_route_evidence',
    'appointment_cta_role',
    'appointment_cta_distinct_from_primary',
    'appointment_cta_status',
    'triangle_plan_status',
    'primary_cta_plan_status',
    'appointment_cta_plan_status',
    'rendered_status',
    'rendered_triangle_verified',
    'live_status',
    'live_triangle_verified',
    'release_status',
    'numerical_release_cap_applies',
  ];
  const values = (row) => [
    row.program_row_id,
    row.canonical_title,
    row.canonical_slug,
    row.canonical_url,
    row.cluster,
    row.pillar,
    row.search_intent,
    row.funnel_stage,
    row.source_preservation_classification,
    row.source_route_live,
    row.pillar_link.url,
    row.pillar_link.route_evidence,
    row.pillar_link.status,
    row.sibling_link.target_program_row_id,
    row.sibling_link.target_title,
    row.sibling_link.url,
    row.sibling_link.relationship,
    row.sibling_link.target_source_preservation_classification,
    row.sibling_link.target_route_live,
    row.sibling_link.status,
    row.primary_cta.url,
    row.primary_cta.label,
    row.primary_cta.name,
    row.primary_cta.placement_code,
    row.primary_cta.placement_guidance,
    row.primary_cta.assignment_rule,
    row.primary_cta.assignment_basis,
    row.primary_cta.approved_route_evidence,
    row.primary_cta.role,
    row.primary_cta.is_appointment_cta,
    row.primary_cta.status,
    row.appointment_cta.url,
    row.appointment_cta.label,
    row.appointment_cta.name,
    row.appointment_cta.placement_code,
    row.appointment_cta.placement_guidance,
    row.appointment_cta.assignment_rule,
    row.appointment_cta.assignment_basis,
    row.appointment_cta.approved_route_evidence,
    row.appointment_cta.role,
    row.appointment_cta.distinct_from_primary_cta,
    row.appointment_cta.status,
    row.evidence.triangle_plan_status,
    row.evidence.primary_cta_plan_status,
    row.evidence.appointment_cta_plan_status,
    row.evidence.rendered_status,
    row.evidence.rendered_triangle_verified,
    row.evidence.live_status,
    row.evidence.live_triangle_verified,
    row.evidence.release_status,
    row.evidence.numerical_release_cap_applies,
  ];
  return `${columns.join(',')}\n${plan.rows.map((row) => values(row).map(csvValue).join(',')).join('\n')}\n`;
}

function markdownCountList(counts) {
  return Object.entries(counts)
    .map(([key, count]) => `- \`${key}\`: ${count}`)
    .join('\n');
}

export function renderReport(plan) {
  const v = plan.verification;
  return (
    `# MRX1000 local content activation plan\n\n` +
    `Generated from the canonical 1,000-row ledger. This sidecar supplies a **local planning assignment** for each row's internal-link triangle, primary CTA, and appointment handoff. It does not claim those plans are implemented, and it does not edit article bodies/frontmatter, render links, publish routes, deploy, submit indexing, mutate a vendor, or authorize spend.\n\n` +
    `## Truth boundary\n\n` +
    `- Planned complete internal-link triangles: **${v.planned_complete_triangle_count}**. Pillar and same-cluster sibling guidance exists in this local sidecar.\n` +
    `- Planned primary CTAs: **${v.primary_cta_planned_count}**. This is stage-appropriate nurture or appointment guidance, not rendered coverage.\n` +
    `- Planned appointment CTAs: **${v.appointment_cta_planned_count}**. All rows have an explicit \`/book/\` MRX-team handoff; ${v.secondary_appointment_cta_count} education rows carry it as a secondary CTA after the primary guide CTA.\n` +
    `- Rendered triangles verified: **${v.rendered_triangle_verified_count}**. No rendered coverage claim is made by this plan.\n` +
    `- Live triangles verified: **${v.live_triangle_verified_count}**. No production coverage claim is made by this plan.\n\n` +
    `The source ledger contains ${plan.distributions.by_source_preservation_classification.live_public_published_route ?? 0} public routes, but source-route publication is tracked separately from rendered/live triangle evidence.\n\n` +
    `## Deterministic assignment\n\n` +
    `- Pillar URLs come from the canonical ledger and are checked against the nine cluster-to-pillar mappings.\n` +
    `- The sibling is the next \`program_row_id\` in the same cluster, wrapping cyclically. Every target is another canonical row; no self-link or cross-cluster target is allowed.\n` +
    `- Education rows use \`/free-guide/\` as the primary nurture CTA and receive a distinct secondary \`/book/\` team handoff. Consideration and decision rows use \`/book/\` as both their primary CTA and appointment handoff.\n` +
    `- Primary and appointment CTA labels, controlled analytics names, placement codes, and placement guidance are explicit per row. The row's funnel stage and search intent are retained in \`assignment_basis\`.\n\n` +
    `## Verification\n\n` +
    `- Rows: **${v.row_count}**\n` +
    `- Unique row IDs: **${v.unique_program_row_id_count}**\n` +
    `- Unique canonical article URLs: **${v.unique_canonical_article_url_count}**\n` +
    `- Primary CTA plans: **${v.primary_cta_planned_count}**\n` +
    `- Appointment CTA plans: **${v.appointment_cta_planned_count}**\n` +
    `- Appointment CTAs targeting \`/book/\`: **${v.appointment_cta_book_url_count}**\n` +
    `- Primary appointment CTAs: **${v.primary_appointment_cta_count}**\n` +
    `- Secondary appointment CTAs after primary nurture: **${v.secondary_appointment_cta_count}**\n` +
    `- Invalid sibling targets: **${v.invalid_sibling_target_count}**\n` +
    `- Self sibling targets: **${v.self_sibling_target_count}**\n` +
    `- Cross-cluster sibling targets: **${v.cross_cluster_sibling_target_count}**\n` +
    `- Noncanonical/non-trailing URLs: **${v.noncanonical_or_nontrailing_url_count}**\n` +
    `- Canonical-ledger row fingerprint verified: **${v.canonical_ledger_fingerprint_verified ? 'PASS' : 'FAIL'}**\n` +
    `- Exact owner decision SHA-256 verified: **${v.owner_decision_sha256_verified ? 'PASS' : 'FAIL'}**\n` +
    `- Numerical release cap applies: **${v.numerical_release_cap_applies}**\n` +
    `- Continuous quality gating active: **${v.continuous_quality_gating_active}**\n` +
    `- All invariants pass: **${v.all_invariants_pass ? 'PASS' : 'FAIL'}**\n\n` +
    `## Primary CTA distribution\n\n` +
    `${markdownCountList(plan.distributions.by_primary_cta_url)}\n\n` +
    `${markdownCountList(plan.distributions.by_primary_cta_placement)}\n\n` +
    `## Appointment CTA distribution\n\n` +
    `${markdownCountList(plan.distributions.by_appointment_cta_url)}\n\n` +
    `${markdownCountList(plan.distributions.by_appointment_cta_placement)}\n\n` +
    `## Pillar distribution\n\n` +
    `${markdownCountList(plan.distributions.by_pillar)}\n\n` +
    `## Continuous quality gate\n\n` +
    `Owner decision \`${plan.inputs.owner_decision.decision_id}\` is \`${plan.inputs.owner_decision.signed_disposition}\`. It removes numerical release caps and elapsed-time gates while preserving article-specific editorial, factual, compliance, creative, build, rollback, and production-verification requirements. The exact decision SHA-256 was verified as \`${plan.inputs.owner_decision.decision_sha256}\`.\n\n` +
    `Canonical-ledger row fingerprint verified as \`${plan.inputs.canonical_ledger_fingerprint_sha256}\`.\n\n` +
    `Activation-plan content fingerprint: \`${plan.content_fingerprint_sha256}\`.\n`
  );
}

export function main() {
  const ledgerText = readFileSync(LEDGER_PATH, 'utf8');
  const ownerDecisionText = readFileSync(OWNER_DECISION_PATH, 'utf8');
  const ledger = JSON.parse(ledgerText);
  const plan = buildActivationPlan(ledger, ownerDecisionText);
  writeFileSync(JSON_OUT, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  writeFileSync(CSV_OUT, renderCsv(plan), 'utf8');
  writeFileSync(REPORT_OUT, renderReport(plan), 'utf8');
  process.stdout.write(
    `MRX1000 activation plan: ${plan.verification.row_count} rows; ` +
      `${plan.verification.planned_complete_triangle_count} planned; ` +
      `${plan.verification.appointment_cta_planned_count} appointment CTAs planned; ` +
      `${plan.verification.rendered_triangle_verified_count} rendered verified; ` +
      `${plan.verification.live_triangle_verified_count} live verified; ` +
      `numerical release cap ${plan.verification.numerical_release_cap_applies}.\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
