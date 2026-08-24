#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '110';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-h-9-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC H-9 Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC H-9 Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC H-9 Query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-h-9-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'An upright source-neutral H-9 route card appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead H-9 provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0295';
process.env.MRX_SELECTION_RANK = '189';
process.env.MRX_DECISION_ID = 'MRX1000-W110-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave110-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave110';
process.env.MRX_PRIOR_TITLE =
  'What Influences the Value of Your Mineral Rights During the Assessment Process?';
process.env.MRX_PRIOR_SLUG =
  'what-influences-the-value-of-your-mineral-rights-during-the-assessment-process';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:657fc9e3-850c-4e4a-adbf-d57f8d39796b';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC H-9 Query retrieval',
  'RRC H-9 provenance worksheet',
  'Texas H-9 public query documentation',
  'H-9 search record',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG = 'texas-rrc-h-10-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.75';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave110-distinct-generated-overhead-h9-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original valuation identity was rejected for material overlap. The replacement owns only one official H-9 public-query retrieval provenance worksheet.',
  'Official RRC sources support route identity, exact query criteria and result labels, current-versus-legacy channel separation, forms and manual context, and retrieval mechanics only. None establishes substantive filing, certificate, status, compliance, regulatory condition, production, property, ownership, title, value, legal, offer, or transaction conclusions.',
  'The article remains distinct from H-10, G-10/W-10, P-5 renewal, Organization P-5, Field Search, Drilling Permit, and other retrieval jobs because it records only one H-9 route attempt.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
