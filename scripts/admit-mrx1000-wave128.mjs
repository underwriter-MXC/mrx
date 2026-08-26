#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '128';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-oil-and-gas-lease-name-index-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Oil and Gas Lease Name Index Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Oil and Gas Lease Name Index retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Oil and Gas Lease Name Index retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-oil-and-gas-lease-name-index-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A dark archival index station appears beside the exact Lease Name Index worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down PDF retrieval evidence board appears above the exact Lease Name Index retrieval keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0333';
process.env.MRX_SELECTION_RANK = '205';
process.env.MRX_DECISION_ID = 'MRX1000-W128-SELECT-2026-08-25';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave128-selection-decision-2026-08-25.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave128';
process.env.MRX_PRIOR_TITLE =
  'Cash For Mineral Rights: Royalty Check Review Before Accepting An Offer';
process.env.MRX_PRIOR_SLUG =
  'cash-for-mineral-rights-royalty-check-review-before-accepting-an-offer';
process.env.MRX_PRIOR_SOURCE_HANDLE = 'factory-queue:MRX-AEO-00077';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Lease Name Index PDF',
  'Texas oil lease name index',
  'Texas gas well name index',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-production-by-lease-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.4615';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave128-distinct-generated-strict-overhead-month-record-class-district-pdf-evidence-board';
process.env.MRX_PILLAR = 'offer-review';
process.env.MRX_PILLAR_URL = '/offer-review/';
process.env.MRX_CLUSTER = 'offer-review-buyer-comparison-safety';
process.env.MRX_FUNNEL_STAGE = 'decision';
process.env.MRX_ACTION_REASON =
  'The original royalty-check cash-offer identity was rejected for direct overlap with the buyer-comparison, offer-review, fair-offer, lowball, negotiation, and sale-safety corpus. The approved replacement owns one no-login manual provenance record for exactly one monthly Texas RRC Oil and Gas Lease Name Index PDF selected by displayed month, record class, and district. It remains separate from Production by Lease, New Lease IDs Built, Wellbore, GIS, broad record locators, interpretation, property connection, current operator status, ownership, production, valuation, offer, legal, tax, compliance, and transaction tasks. Publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original royalty-check offer identity is rejected. No cash-offer, buyer-comparison, negotiation, acceptance, pricing, or transaction claim survives.',
  'Official Texas RRC sources support monthly PDF route, source-displayed month, Oil or Gas selection, district organization, displayed columns, page update context, and adjacent-route limitations only.',
  'The article preserves one manual PDF retrieval attempt and only located, not located, or unverified. It does not automate, bulk retrieve, interpret, or join a locator row to private rights or economic conclusions.',
  'Searched text and any retained artifact remain controlled; the public template contains no real lease, well, operator, organization, ID, owner, property, or result.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
