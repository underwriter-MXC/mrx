#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '115';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-production-by-lease-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Production by Lease Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Production by Lease retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Production by Lease retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-production-by-lease-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A researcher records a Production by Lease attempt beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'An overhead one-attempt provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0299';
process.env.MRX_SELECTION_RANK = '192';
process.env.MRX_DECISION_ID = 'MRX1000-W115-SELECT-2026-08-25';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave115-selection-decision-2026-08-25.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave115';
process.env.MRX_PRIOR_TITLE = 'Why a Mineral Rights Assessment Is Essential for Owners';
process.env.MRX_PRIOR_SLUG = 'why-a-mineral-rights-assessment-is-essential-for-owners';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:486733b5-39ba-478c-a04c-2e16c5ccd5c2';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Production by Lease retrieval',
  'Production Reports Query provenance worksheet',
  'Texas lease production search record',
  'RRC production query evidence',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-production-data-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.625';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave115-distinct-generated-overhead-production-by-lease-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original generic assessment and valuation identity is rejected for material overlap. The approved replacement owns only one authorized manual Production by Lease attempt.',
  'Official Texas RRC sources support route identity, distinct application paths, visible criteria labels, displayed source state, and source-scope limitations only. None establishes production interpretation, property connection, title, ownership, payment, acreage, decimals, taxes, reserves, forecasts, value, legal effect, offer quality, compliance, or a transaction conclusion.',
  'The article remains distinct from Filing Operator, Operator of Record, Production Data Query, New Lease IDs, proration, Wellbore, broad production-record locator, and all production-history interpretation work.',
  'The article prohibits automated or bulk retrieval and records validation, result, empty-result, error, timeout, and access states without bypassing them.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
