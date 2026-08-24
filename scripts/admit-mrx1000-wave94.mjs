#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '94';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-h-10-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC H-10 Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC H-10 query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC H-10 query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-h-10-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A Texas H-10 query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead H-10 query provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0277';
process.env.MRX_SELECTION_RANK = '174';
process.env.MRX_DECISION_ID = 'MRX1000-W94-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave94-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave94';
process.env.MRX_PRIOR_TITLE = 'Understanding Mineral Rights Valuation Calculations';
process.env.MRX_PRIOR_SLUG = 'understanding-mineral-rights-valuation-calculations';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:ecab83cc-5b9b-41c7-a333-69bda4134ebc';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'H-10 report query worksheet',
  'Texas H-10 provenance record',
  'H-10 public query retrieval',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-organization-p-5-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.5';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave94-distinct-generated-overhead-h10-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The original valuation-calculation explainer was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC Search for H10 attempt.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original valuation-calculation identity was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC Search for H10 attempt.',
  'Current official Railroad Commission sources support only official routes, source-displayed criteria and instructions, limited H-10 public-query context, navigation labels, and data limitations. None establishes property connection, title, ownership, acreage, lease effect, payment responsibility, entitlement, compliance, environmental condition, injection fact, production, value, or a transaction result.',
  'The article remains distinct from the Organization, P-4, Wellbore, and Drilling-Permit retrieval worksheets because it records one Search for H10 execution without interpreting a report or using the result downstream.',
  'Continuous quality-gated admission under D-2026-0804-16 and the 2026-08-14 no-approval owner directive; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
