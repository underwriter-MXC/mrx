#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '127';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-oil-and-gas-well-records-request-preparation-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Oil and Gas Well Records Request Preparation Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC well records request preparation';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC well records request preparation';
process.env.MRX_HERO_FILENAME = 'texas-rrc-oil-and-gas-well-records-request-preparation-worksheet';
process.env.MRX_HERO_ALT =
  'A no-submit well-record request preparation desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'Five blank locator-field groups appear above the exact request-preparation keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0332';
process.env.MRX_SELECTION_RANK = '204';
process.env.MRX_DECISION_ID = 'MRX1000-W127-SELECT-2026-08-25';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave127-selection-decision-2026-08-25.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave127';
process.env.MRX_PRIOR_TITLE = 'Cash For Mineral Rights: Offer Review For First-Time Sellers';
process.env.MRX_PRIOR_SLUG = 'cash-for-mineral-rights-offer-review-for-first-time-sellers';
process.env.MRX_PRIOR_SOURCE_HANDLE = 'factory-queue:MRX-AEO-00069';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC oil and gas well records',
  'Texas RRC well record request fields',
  'no-submit records request worksheet',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-district-office-well-records-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.3333';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave127-distinct-generated-top-down-five-group-field-classification-scene';
process.env.MRX_PILLAR = 'offer-review';
process.env.MRX_PILLAR_URL = '/offer-review/';
process.env.MRX_CLUSTER = 'offer-review-buyer-comparison-safety';
process.env.MRX_FUNNEL_STAGE = 'decision';
process.env.MRX_ACTION_REASON =
  'The original first-time-seller cash-offer identity was rejected for direct overlap with the buyer-comparison, offer-review, fair-offer, lowball, scam, negotiation, and seller-guidance corpus. The approved replacement owns one no-submit Texas RRC Oil and Gas Well Records request-preparation handoff and remains separate from online query execution, Imaged Records profile retrieval, record interpretation, property connection, production, valuation, offer, legal, tax, and transaction tasks. Publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original cash-offer and first-time-seller identity is rejected. No pricing, buyer-comparison, offer, negotiation, acceptance, promotional, or transaction claim survives.',
  'Official Texas RRC sources support request fields, record classes, channels, stated online coverage, troubleshooting context, and data-use or agency limitations only. None establishes a request submission, response, record, property connection, ownership, production, value, offer, legal, tax, or transaction conclusion.',
  'The article prepares one blank no-submit handoff only. It does not contact the agency, pay, log in, scrape, automate, repeat retrieval, or interpret records.',
  'Owner-specific locators remain controlled; unknown or unchecked fields stay explicit and are never manufactured.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
