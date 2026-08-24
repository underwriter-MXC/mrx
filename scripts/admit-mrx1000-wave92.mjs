#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '92';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-p-4-gatherer-purchaser-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC P-4 Gatherer/Purchaser Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC P-4 gatherer/purchaser query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC P-4 gatherer/purchaser query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-p-4-gatherer-purchaser-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A Texas P-4 query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead P-4 query provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0290';
process.env.MRX_SELECTION_RANK = '172';
process.env.MRX_DECISION_ID = 'MRX1000-W92-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave92-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave92';
process.env.MRX_PRIOR_TITLE = 'What Are Your Mineral Rights Really Worth?';
process.env.MRX_PRIOR_SLUG = 'what-are-your-mineral-rights-really-worth';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:b9ec7833-d584-47e1-948e-d5592cd3d68c';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'RRC P-4 query worksheet',
  'Texas P-4 gatherer purchaser record trail',
  'P-4 query retrieval provenance',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-wellbore-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.5';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave92-distinct-generated-overhead-eight-field-p4-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original mineral-value question was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC P-4 Gatherer/Purchaser Query attempt.',
  'Current official Railroad Commission sources support only official routes, source-displayed query criteria and labels, daily update context, separate record-access context, and data limitations. None establishes property connection, title, ownership, acreage, lease effect, payment responsibility, entitlement, compliance, production, value, or a transaction result.',
  'The article remains distinct from the Wellbore, Drilling-Permit, and Pooling-Filing retrieval worksheets, production-record locator, broad RRC tutorial, operator-name log, property-connection cross-check, and development or DCF corpus because it records one P-4 query execution without interpreting a result or using it downstream.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W92-SELECT-2026-08-24; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
