#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '85';
process.env.MRX_ARTICLE_SLUG = 'andrews-county-mineral-rights-public-record-locator';
process.env.MRX_ARTICLE_TITLE =
  'How to Build an Andrews County Mineral Rights Public-Record Locator';
process.env.MRX_PRIMARY_KEYWORD = 'Andrews County mineral rights public-record locator';
process.env.MRX_INLINE_KEYWORD = 'Andrews County mineral rights public-record locator';
process.env.MRX_HERO_FILENAME =
  'how-to-build-an-andrews-county-mineral-rights-public-record-locator';
process.env.MRX_HERO_ALT = 'An Andrews County records desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down four-source locator worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0741';
process.env.MRX_SELECTION_RANK = '165';
process.env.MRX_DECISION_ID = 'MRX1000-W85-SELECT-2026-08-23';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave85-selection-decision-2026-08-23.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave85';
process.env.MRX_PRIOR_TITLE =
  'Andrews County, Texas Mineral Rights Value: Family Decision Guide Step By Step';
process.env.MRX_PRIOR_SLUG =
  'andrews-county-texas-mineral-rights-value-family-decision-guide-step-by-step';
process.env.MRX_PRIOR_SOURCE_HANDLE = 'factory-queue:MRX-AEO-07041';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Andrews County official public records search',
  'Andrews County property search fields',
  'Andrews County oil and gas record locator',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG = 'robertson-county-mineral-rights-public-record-locator';
process.env.MRX_CANNIBALIZATION_SCORE = '0.7143';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave85-distinct-generated-overhead-andrews-four-source-public-record-locator';
process.env.MRX_PILLAR = 'texas-mineral-rights';
process.env.MRX_PILLAR_URL = '/mineral-rights/texas/';
process.env.MRX_CLUSTER = 'texas-county-basin-local-intent';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The original Andrews County mineral-value family guide was rejected because it duplicates the county-value and family-decision corpus and would invite unsupported local valuation claims. The approved replacement owns only an Andrews-specific administrative source map that preserves the exact office or system, access route, search field, displayed identifier, access date, posting or interface limitation, and next request. Its county-specific value comes from current Andrews County Clerk posting guidance, the county-linked Tyler portal, Andrews CAD search fields and appraisal disclaimers, and bounded GLO and RRC source roles. It does not determine title, ownership, acreage, lease effect, legal effect, property connection, production, development, value, an offer, or a transaction decision. Release remains controlled by the signed batch, matching evidence, deployment, and live verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original Andrews County value and family-decision identity was rejected for cannibalization. The admitted replacement owns only a county-specific administrative public-record locator with source-separated fields and limitations.',
  'Current Andrews County, Andrews CAD, Texas GLO, and Texas RRC sources support only office, portal, field, identifier, access-date, posting-lag, appraisal-purpose, archive-purpose, and regulatory-locator statements. None establishes private title, ownership, acreage, lease meaning, property connection, production entitlement, value, offer quality, or a transaction result.',
  'The title deliberately resembles the Robertson County locator only at the reusable county-locator pattern. Andrews-specific official systems, access instructions, posting timing, appraisal fields, source limitations, and follow-up workflow make the substantive evidence job county-distinct.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W85-SELECT-2026-08-23; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
