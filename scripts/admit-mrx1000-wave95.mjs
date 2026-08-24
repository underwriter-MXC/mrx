#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '95';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-inactive-well-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Inactive Well Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Inactive Well query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Inactive Well query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-inactive-well-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A Texas inactive-well query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead inactive-well query provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0278';
process.env.MRX_SELECTION_RANK = '175';
process.env.MRX_DECISION_ID = 'MRX1000-W95-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave95-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave95';
process.env.MRX_PRIOR_TITLE = 'Understanding Mineral Rights Valuation Methods';
process.env.MRX_PRIOR_SLUG = 'understanding-mineral-rights-valuation-methods';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:fd448afd-b7af-4ace-b95b-c5ded6fa2377';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'inactive well query worksheet',
  'Texas inactive well provenance record',
  'RRC inactive well public query',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-wellbore-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.5';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave95-distinct-generated-overhead-inactive-well-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The original valuation-method explainer was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC Inactive Well Query attempt.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original valuation-method identity was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC Inactive Well Query attempt.',
  'Current official Railroad Commission sources support only official routes, source-displayed criteria and instructions, navigation labels, result-screen context, and data limitations. None establishes property connection, title, ownership, acreage, lease effect, payment responsibility, entitlement, compliance, environmental condition, operating status, production, value, or a transaction result.',
  'The article remains distinct from the Wellbore, Organization, P-4, H-10, Drilling-Permit, and Pooling-Filing worksheets because it records one Inactive Well Query execution without interpreting a result or using it downstream.',
  'Continuous quality-gated admission under D-2026-0804-16 and the 2026-08-14 no-approval owner directive; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
