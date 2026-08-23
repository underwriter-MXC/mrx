#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '88';
process.env.MRX_ARTICLE_SLUG =
  'how-to-build-a-texas-mineral-production-record-locator-sheet';
process.env.MRX_ARTICLE_TITLE =
  'How to Build a Texas Mineral Production Record Locator Sheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas mineral production record locator sheet';
process.env.MRX_INLINE_KEYWORD = 'Texas mineral production record locator sheet';
process.env.MRX_HERO_FILENAME =
  'how-to-build-a-texas-mineral-production-record-locator-sheet';
process.env.MRX_HERO_ALT =
  'A Texas public-record research desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down production-record locator worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0272';
process.env.MRX_SELECTION_RANK = '168';
process.env.MRX_DECISION_ID = 'MRX1000-W88-SELECT-2026-08-23';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave88-selection-decision-2026-08-23.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave88';
process.env.MRX_PRIOR_TITLE =
  "The Role of Production History in Determining Your Mineral Rights' True Value";
process.env.MRX_PRIOR_SLUG =
  'the-role-of-production-history-in-determining-your-mineral-rights-true-value';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:2dd26811-6a1b-40e8-89e2-fb378e5ef687';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC production record locator',
  'Texas production query reference sheet',
  'RRC production record retrieval log',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG = 'mineral-rights-operator-name-change-log';
process.env.MRX_CANNIBALIZATION_SCORE = '0.3333';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave88-distinct-generated-overhead-seven-field-production-record-locator-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The original production-history and true-value identity was rejected because it overlaps production-history, location, value-driver, producing-status, decline-curve, monthly-royalty-history, and valuation-process coverage and implies resolved value certainty. The approved replacement owns only Texas public production-record retrieval provenance. It records the official RRC source route, query-system name, displayed record class, identifier type and value, covered period, access date, update or reporting note, result-reference location, and located, not located, or unverified status. It stops before record interpretation, property connection, ownership, title, payment, production analysis, forecast, completeness, accuracy, value, offer, or transaction conclusions. Release remains controlled by the signed batch, matching evidence, deployment, and live verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original production-history and true-value identity was rejected for material corpus overlap and unsupported value certainty. The admitted replacement owns only a source-preserving locator sheet for Texas public production-record retrieval.',
  'Current official Railroad Commission sources support only official routes, query and dataset names, record classes, identifier fields, coverage context, update and reporting notes, and public-data limitations. None establishes property connection, ownership, entitlement, production performance, completeness, accuracy, suitability, or value.',
  'The article remains distinct from the general RRC tutorial, monthly royalty-history baseline, producing-status education, decline-curve modeling, operator-name log, and evidence-cutoff log because it records one retrieval trail without interpreting the located record or using it downstream.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W88-SELECT-2026-08-23; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
