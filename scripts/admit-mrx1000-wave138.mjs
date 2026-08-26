#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '138';
process.env.MRX_ARTICLE_SLUG = 'texas-tdi-title-agent-report-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas TDI Title Agent Report Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas TDI title agent report retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas TDI title agent report retrieval';
process.env.MRX_HERO_FILENAME = 'texas-tdi-title-agent-report-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'An oblique public-report retrieval station appears beside the exact Texas TDI worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank report-attempt worksheet appears above the exact Texas TDI title-agent keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0343';
process.env.MRX_SELECTION_RANK = '215';
process.env.MRX_DECISION_ID = 'MRX1000-W138-SELECT-2026-08-26';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave138-selection-decision-2026-08-26.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave138';
process.env.MRX_PRIOR_TITLE = 'How to Compare Competing Mineral Rights Valuation Offers';
process.env.MRX_PRIOR_SLUG = 'how-to-compare-competing-mineral-rights-valuation-offers';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:254654:title:24c9d522-52de-43b8-9130-90ea0876b011';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'TDI title agent report worksheet',
  'Texas escrow officer report retrieval',
  'title agent report provenance',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-inactive-well-aging-report-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.4167';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave138-distinct-generated-strict-overhead-blank-tdi-title-agent-report-attempt-worksheet';
process.env.MRX_PILLAR = 'offer-review';
process.env.MRX_PILLAR_URL = '/offer-review/';
process.env.MRX_CLUSTER = 'offer-review-buyer-comparison-safety';
process.env.MRX_FUNNEL_STAGE = 'decision';
process.env.MRX_ACTION_REASON =
  'The original competing-offer comparison identity and a first claim-to-public-record umbrella materially overlapped the live offer-review corpus. The approved replacement owns only one authorized manual Texas Department of Insurance Title Agent and Escrow Officer report route and attempt. It records source-displayed report fields and a bounded located, not located, or unverified outcome while keeping retained correspondence private and separate. It never compares a report row to correspondence, interprets licensure or appointment, validates a party, evaluates an offer, or produces a legal, valuation, acceptance, or transaction conclusion. Publication remains controlled by matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original generic competing-offer identity and the first broad claim-to-public-record replacement are rejected for material collision with the live corpus.',
  'Current official Texas Department of Insurance pages support only the described title-agent and escrow-officer report route and source-stated context.',
  'One worksheet records one authorized manual route, one named report, and one attempt; it never aggregates reports, compares correspondence, or interprets licensure, appointment, conduct, or transaction involvement.',
  'Located, not located, and unverified are attempt-level observations only and never establish identity, legitimacy, authority, solvency, capacity, affiliation, reputation, offer quality, value, legal effect, or transaction suitability.',
  'The public article and images expose no actual or fictional party, license, appointment, address, county, offer, property, correspondence, report row, result, status, or conclusion.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
