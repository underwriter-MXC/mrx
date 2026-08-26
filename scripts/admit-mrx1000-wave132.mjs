#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '132';
process.env.MRX_ARTICLE_SLUG = 'reeves-county-mineral-records-search-log';
process.env.MRX_ARTICLE_TITLE =
  'Reeves County Mineral Records: A Source-by-Source Search Log';
process.env.MRX_PRIMARY_KEYWORD = 'Reeves County mineral records search';
process.env.MRX_INLINE_KEYWORD = 'Reeves County mineral records search';
process.env.MRX_HERO_FILENAME =
  'reeves-county-mineral-records-a-source-by-source-search-log';
process.env.MRX_HERO_ALT =
  'Four separated records stations appear beside the exact Reeves County search-log title.';
process.env.MRX_INLINE_ALT =
  'Four separate overhead source-log zones appear above the exact Reeves County search keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0337';
process.env.MRX_SELECTION_RANK = '209';
process.env.MRX_DECISION_ID = 'MRX1000-W132-SELECT-2026-08-26';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave132-selection-decision-2026-08-26.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave132';
process.env.MRX_PRIOR_TITLE = 'Comparing Mineral Valuation Offers: Key Insights';
process.env.MRX_PRIOR_SLUG = 'comparing-mineral-valuation-offers-key-insights';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:17552482-ba5d-4a11-a83f-9473ea5fb5cc';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Reeves County public records',
  'Reeves County mineral search log',
  'Reeves County Clerk property records',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG = 'mineral-rights-buyers-documents-step-by-step';
process.env.MRX_CANNIBALIZATION_SCORE = '0.1538';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave132-distinct-generated-strict-overhead-four-source-reeves-county-search-log';
process.env.MRX_PILLAR = 'offer-review';
process.env.MRX_PILLAR_URL = '/offer-review/';
process.env.MRX_CLUSTER = 'offer-review-buyer-comparison-safety';
process.env.MRX_FUNNEL_STAGE = 'decision';
process.env.MRX_ACTION_REASON =
  'The original general valuation-offer identity was rejected for material overlap with the live offer-fairness, multiple-offer, buyer-comparison, offer-range, offer-analysis, valuation-methodology, lowball, predatory, red-flag, property-scope, sender-identity, correspondence, version-control, and purchase-agreement corpus. A first page-and-exhibit replacement was also rejected because the live sale-document package index already owns it. The approved replacement owns one Reeves County source-separated search log: preserve one controlled reference, route, access timestamp and timezone, exact field and value, displayed reference, evidence pointer, bounded result, and next source-specific question separately for the County Clerk, CAD, GLO, and RRC. It does not determine ownership, title, acreage, value, taxes owed, lease status, well ownership, property connection, legal effect, or cross-system identity. Publication remains controlled by matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original valuation-offer identity and the colliding page-and-exhibit proposal are rejected. No offer evaluation, document-package completeness job, valuation, fairness, buyer comparison, or transaction recommendation survives.',
  'Current official Reeves County Clerk, Reeves CAD, Texas Comptroller, Texas GLO, and RRC sources support only their separate route identities, displayed field context, and bounded source roles.',
  'The article preserves only record located, no record displayed, route unavailable, or unverified within one source row. It does not infer that similarly named or numbered entries refer to the same person, tract, instrument, lease, well, or property.',
  'Public examples remain blank and privacy-safe; exact names, account numbers, instrument references, screenshots, amounts, legal descriptions, and retained captures stay in an authorized controlled record.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
