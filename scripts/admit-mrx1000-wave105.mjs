#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '105';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-orphan-well-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Orphan Well Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Orphan Well Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Orphan Well Query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-orphan-well-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'An archival locator rack and blank reference cards appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead criteria grid appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0289';
process.env.MRX_SELECTION_RANK = '185';
process.env.MRX_DECISION_ID = 'MRX1000-W105-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave105-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave105';
process.env.MRX_PRIOR_TITLE = 'Well Spacing, Permits, and Drilling Inventory in Mineral Valuation';
process.env.MRX_PRIOR_SLUG = 'well-spacing-permits-and-drilling-inventory-in-mineral-valuation';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'factory-taxonomy-synthesis:valuation:well-spacing-drilling-inventory-valuation';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Orphan Well Query retrieval',
  'RRC orphan well provenance worksheet',
  'Texas orphan well query documentation',
  'orphan well search record',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-inactive-well-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.72';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave105-distinct-generated-overhead-orphan-well-query-criteria-grid';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original spacing, permit, drilling-inventory, and valuation identity was rejected for material overlap with the drilling-permit, existing-wells-versus-future-locations, PDP/PUD, acreage-contiguity, DCF, valuation, and broad RRC-guide corpus. The admitted replacement owns only one official Texas RRC Orphan Well Query retrieval provenance worksheet.',
  'Current official Railroad Commission sources support only the separately named Orphan Well route, exact page and help labels, source-displayed criteria, selector and navigation labels, source description, monthly update label, result-field names, detail navigation, pagination, sorting, and download behavior. None establishes a private-property relationship or an orphan-well, operator, compliance, delinquency, plugging, environmental, ownership, title, valuation, legal, offer, or transaction conclusion.',
  'The article remains distinct from the separately named IWAR, general Inactive Well, and P-5 Renewal Status jobs because it records only one orphanWellQueryAction.do attempt and never interprets a criterion, selector, source definition, result, or status.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and the 2026-08-24 durable Chesty prompt contract; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
