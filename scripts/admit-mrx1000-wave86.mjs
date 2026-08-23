#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '86';
process.env.MRX_ARTICLE_SLUG =
  'how-to-extract-shut-in-clause-conditions-before-a-valuation-review';
process.env.MRX_ARTICLE_TITLE =
  'How to Extract Shut-In Clause Conditions Before a Valuation Review';
process.env.MRX_PRIMARY_KEYWORD = 'shut-in clause conditions valuation review';
process.env.MRX_INLINE_KEYWORD = 'shut-in clause conditions valuation review';
process.env.MRX_HERO_FILENAME =
  'how-to-extract-shut-in-clause-conditions-before-a-valuation-review';
process.env.MRX_HERO_ALT =
  'An open lease packet and clause worksheet appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down clause extraction worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0270';
process.env.MRX_SELECTION_RANK = '166';
process.env.MRX_DECISION_ID = 'MRX1000-W86-SELECT-2026-08-23';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave86-selection-decision-2026-08-23.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave86';
process.env.MRX_PRIOR_TITLE = 'Shut-In Wells: What They Mean for a Valuation Review';
process.env.MRX_PRIOR_SLUG = 'shut-in-wells-what-they-mean-for-a-valuation-review';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'factory-taxonomy-synthesis:valuation:shut-in-wells-valuation-review';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'shut-in clause extraction worksheet',
  'oil and gas lease document review',
  'mineral rights valuation records',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'inventory-mixed-status-mineral-interests-before-valuation-review';
process.env.MRX_CANNIBALIZATION_SCORE = '0.375';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave86-distinct-generated-overhead-shut-in-clause-condition-extraction-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The original shut-in-well valuation identity was rejected because it overlaps mixed-status inventory, operational-event, HBP and lease-maintenance, royalty-history, decline-curve, valuation-factor, and assessment-reset coverage and invites unsupported status, lease-effect, production, and value conclusions. The approved replacement owns only a source-preserving private lease-clause extraction worksheet. It records the controlling document version, exact excerpt and locator, stated trigger, covered scope, payment wording, timing, recipient, notice or cure language, duration, cross-references, version conflicts, and unresolved questions. It keeps private contract text, performance records, and RRC context separate and stops before legal effect, payment sufficiency, production treatment, valuation inputs, value, an offer, or a transaction result. Release remains controlled by the signed batch, matching evidence, deployment, and live verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original shut-in-well valuation identity was rejected for material overlap and prohibited-inference risk. The admitted replacement owns only source-located extraction of private clause conditions and linked-document unknowns.',
  'Current official GLO and RRC sources support only bounded state-lease examples, regulatory source roles, file locators, reporting limits, and no-private-authority boundaries. None supplies the terms or effect of an owner private lease, proves a shut-in event or clause trigger, establishes payment sufficiency, or determines production treatment or value.',
  'The article remains distinct from the mixed-status inventory, HBP, general lease, event-claim, royalty-history, and decline-curve corpus because it handles contract-text extraction only and creates no downstream legal, operational, or valuation conclusion.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W86-SELECT-2026-08-23; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
