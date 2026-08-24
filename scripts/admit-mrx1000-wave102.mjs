#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '102';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-field-search-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Field Search Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Field Search retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Field Search retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-field-search-retrieval-provenance-worksheet';
process.env.MRX_HERO_ALT =
  'A blank Field Search terminal and neutral retained-reference desk appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead three-mode Field Search criteria worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0285';
process.env.MRX_SELECTION_RANK = '182';
process.env.MRX_DECISION_ID = 'MRX1000-W102-SELECT-2026-08-24';
process.env.MRX_DECISION_PATH = 'docs/governance/mrx1000-wave102-selection-decision-2026-08-24.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave102';
process.env.MRX_PRIOR_TITLE =
  'Understanding Your Mineral Rights: Uncovering Their True Value and Potential for Fair Assessment';
process.env.MRX_PRIOR_SLUG =
  'understanding-your-mineral-rights-uncovering-their-true-value-and-potential-for-fair-assessment';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'searchatlas-topical-map:255581:title:3ebe3094-2898-4ff5-84bc-ebccda7637cb';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'Texas RRC Field Search retrieval',
  'RRC Field Search provenance worksheet',
  'Texas oil and gas field search',
  'field search criteria worksheet',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'texas-rrc-wellbore-query-retrieval-provenance-worksheet';
process.env.MRX_CANNIBALIZATION_SCORE = '0.625';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave102-distinct-generated-overhead-three-mode-field-search-criteria-worksheet';
process.env.MRX_PILLAR = 'mineral-rights-value';
process.env.MRX_PILLAR_URL = '/mineral-rights-value/';
process.env.MRX_CLUSTER = 'valuation-methodology-drivers';
process.env.MRX_FUNNEL_STAGE = 'consideration';
process.env.MRX_ACTION_REASON =
  'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original broad value-and-fair-assessment identity was rejected for material overlap with the valuation, qualification, eligibility, assessment, and owner-education corpus. The admitted replacement owns only one official Texas RRC Field Search retrieval provenance worksheet.',
  'Current official Railroad Commission sources support only the Field Rules Query index label, the launched Field Search page label, source-displayed search modes and minimum-character instruction, separate well-record and downloadable field-data channels, agency-authored navigation context, and stated data limitations. None establishes field identity or boundary, field-rule meaning, a private-property or well connection, ownership, title, acreage, lease effect, production, reserves, compliance, legal effect, value, offer quality, or a transaction result.',
  'The article remains distinct from the Completions, Severance, Wellbore, Drilling-Permit, Organization P-5, P-4, H-10, Inactive-Well, Oil-Proration, Gas-Proration, Injection-Storage, Pooling-Filing, Flare/Vent Exception, production-data, field-download, GIS, property-matching, title, valuation, and transaction jobs because it records only one launched Field Search attempt and preserves the official label mismatch without interpreting field rules or a result.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and the 2026-08-24 durable Chesty prompt contract; publication remains conditional on every article-specific gate and no owner publication approval applies.',
]);

await import('./admit-mrx1000-wave82.mjs');
