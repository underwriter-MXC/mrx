#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '83';
process.env.MRX_ARTICLE_SLUG = 'inventory-mixed-status-mineral-interests-before-valuation-review';
process.env.MRX_ARTICLE_TITLE =
  'How to Inventory Mixed-Status Mineral Interests Before a Valuation Review';
process.env.MRX_PRIMARY_KEYWORD = 'mixed-status mineral interest inventory';
process.env.MRX_INLINE_KEYWORD = 'mixed-status mineral interest inventory';
process.env.MRX_HERO_FILENAME =
  'how-to-inventory-mixed-status-mineral-interests-before-a-valuation-review';
process.env.MRX_HERO_ALT =
  'A mixed-status mineral portfolio folder appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A blank overhead evidence inventory worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0268';
process.env.MRX_SELECTION_RANK = '163';
process.env.MRX_DECISION_ID = 'MRX1000-W83-SELECT-2026-08-23';
process.env.MRX_DECISION_PATH =
  'docs/governance/mrx1000-wave83-selection-decision-2026-08-23.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave83';
process.env.MRX_PRIOR_TITLE = 'Producing vs. Non-Producing Minerals: Which Inputs Change?';
process.env.MRX_PRIOR_SLUG = 'producing-vs-non-producing-minerals-which-inputs-change';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'factory-taxonomy-synthesis:valuation:producing-vs-non-producing-mineral-valuation';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'mixed-status mineral interest inventory',
  'mineral interest records checklist',
  'mineral portfolio document inventory',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'how-texas-mineral-rights-are-valued-producing-vs-non-producing-interests';
process.env.MRX_CANNIBALIZATION_SCORE = '0.22';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave83-distinct-generated-overhead-blank-mixed-status-evidence-inventory';
process.env.MRX_ACTION_REASON =
  'The original producing-versus-non-producing valuation identity was rejected because the live corpus already owns that status comparison and its supporting records. The approved replacement owns only a blank administrative line-item inventory for mixed claimed or unknown statuses, dated evidence references, missing-record questions, and follow-up assignments. It does not determine or interpret ownership, title, lease, operating, production, suspense, shut-in, payment, economics, valuation, offer, legal, tax, engineering, accounting, appraisal, investment, or financial conclusions. Release remains controlled by the signed batch, matching evidence, deployment, and live verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original producing-versus-non-producing valuation identity was rejected because it materially collides with the live status-and-inputs comparison guide. The admitted replacement owns only an administrative mixed-status inventory.',
  'Current Texas regulator, GLO, and unclaimed-property sources support only record-location and query-reference logistics. None proves private ownership, determines operating or payment status, interprets a document, establishes entitlement, or determines value.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W83-SELECT-2026-08-23; no numerical cap, elapsed-time gate, or owner publication approval applies.',
  'Publication remains conditional on current editorial, factual-citation, compliance, two-image, metadata, build, rollback, deployment, and live-verification evidence.',
]);

await import('./admit-mrx1000-wave82.mjs');
