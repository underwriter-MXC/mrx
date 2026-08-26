#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '126';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-injection-storage-test-report-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Injection-Storage Test Report Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC injection-storage test report retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC injection-storage test report retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-injection-storage-test-report-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'An archival research station appears beside the exact injection-storage worksheet title.';
process.env.MRX_INLINE_ALT =
  'Three evidence sleeves and a pressure-chart roll appear above the exact retrieval keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0331';
process.env.MRX_SELECTION_RANK = '203';
process.env.MRX_DECISION_ID = 'MRX1000-W126-SELECT-2026-08-25';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave126-selection-decision-2026-08-25.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave126';
process.env.MRX_PRIOR_TITLE = 'Cash For Mineral Rights: Buyer Comparison Before Accepting An Offer';
process.env.MRX_PRIOR_SLUG = 'cash-for-mineral-rights-buyer-comparison-before-accepting-an-offer';
process.env.MRX_PRIOR_SOURCE_HANDLE = 'factory-queue:MRX-AEO-00067';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Injection-Storage Test Reports profile',
  'RRC Imaged Records profileId 7',
  'Form H-5 retrieval provenance worksheet',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-form-t-1-monthly-transportation-storage-report-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.4615';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave126-distinct-generated-top-down-three-sleeve-pressure-chart-evidence-scene';
process.env.MRX_PILLAR = 'offer-review';
process.env.MRX_PILLAR_URL = '/offer-review/';
process.env.MRX_CLUSTER = 'offer-review-buyer-comparison-safety';
process.env.MRX_FUNNEL_STAGE = 'decision';
process.env.MRX_ACTION_REASON =
  'The original cash-for-mineral-rights buyer-comparison identity was rejected for direct overlap with the buyer-comparison, offer-safety, fair-offer, negotiation, and acceptance corpus. The approved replacement owns one authorized manual Texas RRC Imaged Records Injection-Storage Test Reports profile retrieval provenance record and remains separate from the UIC permit query, EDMS H-1/H-1A/W-14 application documents, H-10 annual monitoring reports, H-5 filing, interpretation, compliance, engineering, environmental, property, production, valuation, offer, legal, tax, and transaction tasks. Current direct profile access returned HTTP 403, so the article records no completed query and keeps the present state unverified. Publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original cash-for-mineral-rights identity is rejected for direct overlap. No buyer-comparison, pricing, negotiation, offer, promotional, acceptance, or transaction claim survives.',
  'Official Texas RRC sources support only the Imaged Records route, the source-displayed Injection-Storage Test Reports profileId 7 identity and scope, adjacent-route separation, and current source limitations. None establishes a completed retrieval, test result, well, permit, injection or storage condition, compliance, engineering, environmental, property, production, value, offer, legal, tax, or transaction conclusion.',
  'Direct profile access returned HTTP 403 and no profile page was captured, so the article claims no completed query. Every blocked, error, timeout, validation-failure, default, session, CAPTCHA, viewer, inaccessible, or otherwise inconclusive state remains unverified.',
  'The article prohibits automation, scraping, repeated or bulk retrieval, bypass, login, payment, request, filing instruction, interpretation, and substantive inference.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
