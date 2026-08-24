#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '91';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-wellbore-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0276';
process.env.MRX_SELECTION_RANK = '171';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Wellbore Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC wellbore query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC wellbore query retrieval';
process.env.MRX_HERO_ALT =
  'A Texas wellbore-query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead wellbore-query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies the Oil & Gas Data Query as a public research route and publishes the limitation that online data is continually updated, informational, non-authoritative, and without legal force.',
      'The article records the named route, access time, and source limitation without treating a query result as complete, legally controlling, connected to private property, or suitable for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official data-query overview explains that the Wellbore Query can search by displayed categories including well type, district, lease or gas-well identifier, county, field, operator, permit number, API number, and current or historical selection.',
      'The article uses those source-displayed categories only to construct a criteria snapshot and never interprets the identifiers or record.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaMain.do',
    [
      'The official Oil & Gas Data Query menu presents the Wellbore Query as a separate route from production, injection, severance, P-4, proration, organization, inactive-well, orphan-well, drilling-permit, inspection, and violation routes.',
      'The article preserves that route identity so records from separate systems are not merged or mislabeled.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/wellboreQueryAction.do',
    [
      'The official public Wellbore Query entry displays current criteria labels and the route used for one query attempt.',
      'The article records only criteria actually used, navigation steps that occurred, and bounded retrieval state. It does not submit a filing or reproduce an actual property query.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/WellboreGeneralHowTo.html',
    [
      'The official Wellbore Query help describes criteria, the 10,000-record display limit for broad searches, displayed result columns, navigation and sorting controls, result links, and lease-detail tabs.',
      'The article keeps result headers, result rows, navigation state, and detail routes separate and rejects well, operator, lease, field, county, schedule, production, property, or valuation interpretation.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official well-records page identifies separate channels for Commission well records and document access.',
      'The article uses that context only to turn a query gap into a neutral next retrieval question, not to claim that an online result is the complete agency record.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding value-assessment explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Wellbore Query through its entry route, criteria snapshot, navigation steps, result-header state, result-row labels, detail routes, access timestamp, source limits, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique warm public-record counter and people-free strict-overhead cool-gray eight-field technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed criteria and result labels, navigation behavior, result-display limits, record-access context, update context, and published data limitations. None of the sources is used to interpret a wellbore or establish property connection, title, ownership, acreage, lease effect, entitlement, compliance, drilling, completion, production, development, reserves, value, or a transaction result.',
  'The article publishes no actual query values, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, well conclusion, production result, drilling forecast, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, result headers, rows, and detail routes; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, engineering, geological, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real well record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'six_distinct_https_sources',
  'current_source_access_review_pass',
  'claim_to_source_scope_present',
  'official_source_priority_pass',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'texas_rrc_wellbore_query_retrieval_no_interpretation_property_connection_title_ownership_acreage_lease_entitlement_compliance_drilling_completion_production_development_reserves_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_privacy_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
