#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '150';
process.env.MRX_ARTICLE_SLUG = 'cash-for-mineral-rights-irs-tax-transcripts-cpa-handoff';
process.env.MRX_ARTICLE_TITLE =
  'Cash for Mineral Rights: How to Retrieve IRS Tax Transcripts for a CPA Handoff';
process.env.MRX_PRIMARY_KEYWORD = 'cash for mineral rights tax transcripts';
process.env.MRX_INLINE_KEYWORD = 'cash for mineral rights tax transcripts';
process.env.MRX_HERO_FILENAME =
  'cash-for-mineral-rights-how-to-retrieve-irs-tax-transcripts-for-a-cpa-handoff';
process.env.MRX_HERO_ALT =
  'A dark secure record-retrieval handoff station appears beside the exact IRS tax-transcript article title.';
process.env.MRX_INLINE_ALT =
  'An overhead blank transcript source-scope matrix appears above the exact cash-for-mineral-rights tax-transcripts keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0651';
process.env.MRX_SELECTION_RANK = '222';
process.env.MRX_DECISION_ID = 'MRX1000-W150-SELECT-2026-08-26';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave150-selection-decision-2026-08-26.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave150';
process.env.MRX_PRIOR_TITLE = 'Cash For Mineral Rights: Tax Questions Before Accepting An Offer';
process.env.MRX_PRIOR_SLUG = 'cash-for-mineral-rights-tax-questions-before-accepting-an-offer';
process.env.MRX_PRIOR_SOURCE_HANDLE = 'factory-queue:MRX-AEO-00167';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'IRS transcript retrieval for mineral owners',
  'mineral rights CPA document handoff',
  'IRS transcript source scope',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'cash-for-mineral-rights-tax-questions-for-royalty-owners';
process.env.MRX_CANNIBALIZATION_SCORE = '0.4167';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave150-distinct-generated-strict-overhead-pale-transcript-source-scope-matrix';
process.env.MRX_PILLAR = 'mineral-rights-taxes';
process.env.MRX_PILLAR_URL = '/learning-center/mineral-rights-taxes/';
process.env.MRX_CLUSTER = 'tax-1031-legal-education';
process.env.MRX_FUNNEL_STAGE = 'education';
process.env.MRX_ACTION_REASON =
  'MRX1000-0649 was rejected because its 1031 comparison identity duplicates the live comparison page, and MRX1000-0650 was rejected because its 1031 eligibility and benefits identity is saturated. The broad MRX1000-0651 cash-offer tax-question factory identity was also rejected as written. The approved replacement owns only current official IRS transcript retrieval routes, IRS-stated transcript-type scope, retrieval-date and tax-year capture, preservation of the unaltered copy, limitation notes, and secure CPA handoff before a cash-offer decision. It does not select or interpret a transcript, establish completeness, prove mineral ownership or basis, characterize income or gain, calculate tax, validate an offer, compare buyers, value an interest, complete a form, file a return, set retention, recommend a transaction, or provide owner-specific advice. Publication remains controlled by matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'MRX1000-0649 and MRX1000-0650 remain preserved, uncounted planning rows with REJECT_NO_SAFE_IDENTITY decisions; no duplicate 1031 article is drafted or admitted.',
  'The original MRX1000-0651 broad tax-question identity is replaced by one narrow IRS transcript retrieval, source-scope, unaltered-copy, limitation, and CPA-handoff job.',
  'Current official IRS sources support retrieval routes, limited transcript descriptions, masking and third-party-mailing boundaries, April 2025 Form 4506-T revision control, and transcript-versus-return-copy context only.',
  'A transcript is not treated as title, deed, lease, division-order, valuation, basis, complete return, complete transaction, offer, or tax-treatment proof. Missing or unavailable data is not treated as negative evidence.',
  'The public article and images expose no real or fictional taxpayer, tax ID, address, account, return, tax year, transcript entry, payer, property, legal description, offer, date, amount, signature, form facsimile, seal, logo, result, or conclusion.',
  'Transcript selection, interpretation, completeness, income or gain character, basis, tax, filing, retention, title, offer, valuation, security choice, and transaction decisions force an immediate CPA or attorney handoff.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
