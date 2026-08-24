#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '99';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-severance-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Severance Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC severance query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC severance query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-severance-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A public-record archive counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead severance-query provenance worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0282';
process.env.MRX_SELECTION_RANK = '179';
process.env.MRX_DECISION_ID = 'MRX1000-W99-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave99-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave99';
process.env.MRX_PRIOR_TITLE = 'Understanding the Elements That Impact Your Mineral Rights Valuation Process';
process.env.MRX_PRIOR_SLUG = 'understanding-the-elements-that-impact-your-mineral-rights-valuation-process';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:8fc149cd-68cb-4b18-8322-95f78ccce9a0';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC severance query retrieval',
  'RRC severance query provenance worksheet',
  'Texas oil and gas severance query',
  'severance query retrieval worksheet',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-injection-storage-permit-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.5';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave99-distinct-generated-overhead-severance-query-provenance-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original generic valuation identity was rejected for material corpus overlap. The admitted replacement owns only a source-preserving provenance worksheet for one official Texas RRC Severance Query retrieval attempt.',
  'Current official Railroad Commission sources support only official routes, source-displayed criteria and instructions, result/help navigation labels, and stated limitations. None establishes severance status, legal effect, compliance, reconnection eligibility, production, property connection, title, ownership, acreage, lease effect, value, offer quality, or a transaction result.',
  'The article remains distinct from the Drilling-Permit, Wellbore, Inactive-Well, H-10, Organization P-5, P-4, Pooling-Filing, Oil-Proration, Gas-Proration, and Injection-Storage worksheets because it records one separately named Severance Query execution without interpreting a result or using it downstream.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and the 2026-08-24 durable Chesty prompt contract; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
