#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '90';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-drilling-permit-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Drilling-Permit Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC drilling permit query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC drilling permit query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-drilling-permit-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'An archival Texas permit-query counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down query-provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0275';
process.env.MRX_SELECTION_RANK = '170';
process.env.MRX_DECISION_ID = 'MRX1000-W90-SELECT-2026-08-23';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave90-selection-decision-2026-08-23.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave90';
process.env.MRX_PRIOR_TITLE =
  'Understanding How Location Impacts the Valuation of Your Mineral Rights Portfolio';
process.env.MRX_PRIOR_SLUG =
  'understanding-how-location-impacts-the-valuation-of-your-mineral-rights-portfolio';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:05b13935-f7cc-4126-a875-664f67f365a3';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-pooling-filing-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.4444';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave90-distinct-generated-overhead-eight-field-drilling-permit-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original location-and-mineral-valuation identity was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC drilling-permit query attempt.',
  'Current official Railroad Commission sources support only official routes, source-displayed query criteria and result labels, navigation behavior, public-query versus filing context, update notes, and data limitations. None establishes property connection, title, ownership, acreage, lease effect, entitlement, compliance, drilling likelihood, development, production, value, or a transaction result.',
  'The article remains distinct from the pooling-filing worksheet, production-record locator, broad RRC tutorial, operator-name log, property-connection cross-check, and development or DCF corpus because it records one query execution without interpreting a permit or using the result downstream.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W90-SELECT-2026-08-23; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
