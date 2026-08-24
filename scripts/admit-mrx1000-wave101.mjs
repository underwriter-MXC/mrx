#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '101';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-completions-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Completions Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Completions Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Completions Query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-completions-query-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A blank completion-packet archive appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead Completions Query criteria worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0284';
process.env.MRX_SELECTION_RANK = '181';
process.env.MRX_DECISION_ID = 'MRX1000-W101-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave101-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave101';
process.env.MRX_PRIOR_TITLE =
  'Understanding Your Mineral Rights: How to Determine Eligibility for Evaluation Today';
process.env.MRX_PRIOR_SLUG =
  'understanding-your-mineral-rights-how-to-determine-eligibility-for-evaluation-today';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:7a211d63-6c2f-4b00-b771-36da02a16c1a';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Completions Query retrieval',
  'RRC completion packet query provenance worksheet',
  'Texas oil and gas Completions Query',
  'completion packet retrieval worksheet',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-severance-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.7143';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave101-distinct-generated-overhead-completions-query-criteria-and-route-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original generic eligibility-and-evaluation identity was rejected for material overlap with the qualification, assessment, underwriter-review, valuation, and owner-education corpus. The admitted replacement owns only one official Texas RRC Completions Query retrieval provenance worksheet.',
  'Current official Railroad Commission sources support only the separately named query route, source-stated online-packet coverage, source-displayed criteria and all-criteria behavior, result or packet navigation, separate Imaged Records and downloadable-data channels, and stated data limitations. None establishes completion, current well status, production, permitting, compliance, commercial viability, a private-property connection, ownership, title, acreage, lease effect, royalty entitlement, value, offer quality, or a transaction result.',
  'The article remains distinct from the Severance, Wellbore, Drilling-Permit, Organization P-5, P-4, H-10, Inactive-Well, Oil-Proration, Gas-Proration, Injection-Storage, Pooling-Filing, Flare/Vent Exception, production-data, Imaged Records, bulk-download, directional-survey, property-matching, title, valuation, and transaction jobs because it records only one separately named Completions Query attempt without interpreting a packet, form, status, result, survey, record, or private-interest relationship.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and the 2026-08-24 durable Chesty prompt contract; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
