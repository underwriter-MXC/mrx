#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '89';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-pooling-filing-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Pooling-Filing Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC pooling filing retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC pooling filing retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-pooling-filing-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A Texas public-record filing desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down filing-retrieval provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0286';
process.env.MRX_SELECTION_RANK = '169';
process.env.MRX_DECISION_ID = 'MRX1000-W89-SELECT-2026-08-23';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave89-selection-decision-2026-08-23.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave89';
process.env.MRX_PRIOR_TITLE = 'Unitization and Pooling as Mineral Valuation Inputs';
process.env.MRX_PRIOR_SLUG = 'unitization-and-pooling-as-mineral-valuation-inputs';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'factory-taxonomy-synthesis:valuation:unitization-pooling-mineral-valuation';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'mineral-rights-worksheet-question-locator';
process.env.MRX_CANNIBALIZATION_SCORE = '0.1111';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave89-distinct-generated-overhead-eight-field-pooling-filing-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original unitization, pooling, and mineral-valuation identity was rejected for material corpus overlap and unsupported property, development, and value implications. The admitted replacement owns only a source-preserving retrieval-provenance worksheet for one Texas RRC pooling-filing search.',
  'Current official Railroad Commission sources support only official routes, system and form labels, displayed search-identifier categories, record classes, coverage descriptions, access notes, and public-data limitations. None establishes property connection, ownership, tract inclusion, lease effect, pooling authority, entitlement, compliance, completeness, accuracy, development, production, or value.',
  'The article remains distinct from the broad RRC tutorial, privacy policy, redaction checklist, property-connection cross-check, acreage-development article, DCF future-locations article, depth and formation-rights article, and production-record locator because it records one different record-family retrieval trail without interpretation or downstream use.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W89-SELECT-2026-08-23; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
