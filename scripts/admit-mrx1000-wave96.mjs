#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '96';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-oil-proration-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Oil Proration Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Oil Proration query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Oil Proration query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-oil-proration-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A Texas oil-proration query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead oil-proration query provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0279';
process.env.MRX_SELECTION_RANK = '176';
process.env.MRX_DECISION_ID = 'MRX1000-W96-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave96-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave96';
process.env.MRX_PRIOR_TITLE = 'Understanding Mineral Rights Value Assessment';
process.env.MRX_PRIOR_SLUG = 'understanding-mineral-rights-value-assessment';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:c1198cca-5b3b-442a-925a-f79b0a66e6d5';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Oil Proration query retrieval',
  'oil proration query worksheet',
  'Texas oil proration provenance record',
  'RRC oil proration schedule query',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-wellbore-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.625';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave96-distinct-generated-overhead-oil-proration-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original mineral-value assessment identity was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC Oil Proration Schedule Query attempt.',
  'Current official Railroad Commission sources support only official routes, source-displayed criteria and instructions, navigation labels, query-screen context, and stated limitations. None establishes property connection, title, ownership, acreage, lease effect, payment responsibility, entitlement, compliance, environmental condition, operating status, production, value, or a transaction result.',
  'The article remains distinct from the Wellbore, Inactive Well, Organization P-5, P-4, H-10, Drilling-Permit, and Pooling-Filing worksheets because it records one Oil Proration Schedule Query execution without interpreting a result or using it downstream.',
  'Continuous quality-gated admission under D-2026-0804-16 and the 2026-08-14 no-approval owner directive; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
