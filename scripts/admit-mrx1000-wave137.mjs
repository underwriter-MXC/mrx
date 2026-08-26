#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '137';
process.env.MRX_ARTICLE_SLUG =
  'sec-edgar-mineral-rights-offeror-filing-search-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'SEC EDGAR Mineral Rights Offeror Filing Search Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'SEC EDGAR mineral rights offeror filing search';
process.env.MRX_INLINE_KEYWORD = 'SEC EDGAR mineral rights offeror filing search';
process.env.MRX_HERO_FILENAME =
  'sec-edgar-mineral-rights-offeror-filing-search-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'An oblique public-filings research station appears beside the exact SEC EDGAR offeror worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank search-attempt worksheet appears above the exact SEC EDGAR offeror filing-search keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0342';
process.env.MRX_SELECTION_RANK = '214';
process.env.MRX_DECISION_ID = 'MRX1000-W137-SELECT-2026-08-26';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave137-selection-decision-2026-08-26.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave137';
process.env.MRX_PRIOR_TITLE = 'Evaluating Cash Offers for Mineral Rights';
process.env.MRX_PRIOR_SLUG = 'evaluating-cash-offers-for-mineral-rights';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:254654:title:b23fb5aa-bcab-43d8-92bc-d8f17267d474';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'EDGAR offeror search record',
  'public filing search provenance',
  'offeror filing search worksheet',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG = 'mineral-rights-offer-sender-identity-cross-check';
process.env.MRX_CANNIBALIZATION_SCORE = '0.3077';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave137-distinct-generated-strict-overhead-blank-sec-edgar-search-attempt-provenance-worksheet';
process.env.MRX_PILLAR = 'offer-review';
process.env.MRX_PILLAR_URL = '/offer-review/';
process.env.MRX_CLUSTER = 'offer-review-buyer-comparison-safety';
process.env.MRX_FUNNEL_STAGE = 'decision';
process.env.MRX_ACTION_REASON =
  'The original cash-offer evaluation identity materially overlaps the live offer-comparison, fair-offer, lowball, buyer, competing-offer, correspondence, property-scope, sender-identity, and version-control corpus. The approved replacement owns only one authorized manual SEC EDGAR route and search attempt using an exact retained-correspondence query. It records source-displayed fields and a bounded located, not located, or unverified outcome. It never merges identities, validates an offeror, evaluates an offer, infers financial capacity, interprets a filing or contract, or produces a legal, valuation, due-diligence, acceptance, or transaction conclusion. Publication remains controlled by matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original generic cash-offer evaluation identity is rejected for material collision with the live offer-review corpus.',
  'Current official SEC Search Filings and EDGAR Full Text Search pages support only the described inputs, filters, and source-displayed result fields.',
  'One worksheet records one authorized manual route and one attempt; it never silently aggregates interfaces, attempts, retained correspondence, or filing evidence.',
  'Located, not located, and unverified are attempt-level observations only and never establish identity, legitimacy, authorization, registration, solvency, funding, capacity, affiliation, filing relevance, offer quality, value, or legal effect.',
  'The public article and images expose no actual or fictional party, CIK, ticker, offer, filing, address, property, correspondence, private data, result, or conclusion.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
