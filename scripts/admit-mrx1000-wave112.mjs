#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '112';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-production-data-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Production Data Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Production Data Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Production Data Query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-production-data-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'One mineral owner reviews a blank two-path production-query board beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead two-path production-query worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0297';
process.env.MRX_SELECTION_RANK = '190';
process.env.MRX_DECISION_ID = 'MRX1000-W112-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH =
  'docs/governance/mrx1000-wave112-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave112';
process.env.MRX_PRIOR_TITLE = 'What to Expect From Your Mineral Rights Evaluation';
process.env.MRX_PRIOR_SLUG = 'what-to-expect-from-your-mineral-rights-evaluation';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:19dfb47b-9658-4c14-be54-38084452ba22';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Production Data Query retrieval',
  'RRC PDQ provenance worksheet',
  'Texas production query documentation',
  'PDQ search record',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-completions-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.625';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave112-distinct-generated-overhead-production-data-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original evaluation-benefits identity was rejected for material overlap. The replacement owns only one authorized manual attempt in the official limited-area Production Data Query application.',
  'Official RRC sources support route identity, General Production Query versus Specific Lease Query separation, source-displayed coverage and update state, navigation limitations, operator-report context, lag, revision risk, and retrieval mechanics only. None establishes production attribution, property connection, title, ownership, acreage, reserves, value, legal effect, offer quality, or a transaction conclusion.',
  'The article remains distinct from Production Reports Query Form PR, any separately routed statewide PDQ surface, Wellbore, New Lease IDs, proration, the broad production-record locator, and other retrieval jobs because it records only one limited-area PDQ attempt.',
  'The article expressly prohibits automated or bulk RRC retrieval and preserves the source system warning.',
  'Continuous quality-gated admission under the owner no-approval directives; no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
