#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '125';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-groundwater-protection-determination-letter-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0330';
process.env.MRX_SELECTION_RANK = '202';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Groundwater Protection Determination Letter Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC groundwater determination letter retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC groundwater determination letter retrieval';
process.env.MRX_HERO_ALT =
  'A people-free microfilm station appears beside the exact groundwater-letter worksheet title.';
process.env.MRX_INLINE_ALT =
  'Three blank groundwater-letter evidence sleeves appear above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory supplies the current Oil and Gas Imaged Records entry route.',
      'The article uses it only for source identity and routing; it establishes no completed query, letter, environmental, engineering, property, ownership, value, offer, legal, or transaction fact.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/',
    [
      'The official Imaged Records page supplies the collection route and bounded historical context for Groundwater Protection Determination Letters.',
      'The article uses it only for route provenance and source-described context; it makes no completeness, water-zone, casing, environmental, engineering, compliance, property, ownership, or value inference.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official menu identifies Groundwater Protection Determination Letters profileId 23, Fall 2008 through June 6 2015 coverage, and separate later, earlier, and microfilm routes.',
      'The article preserves those statements only as dated source-described collection scope and route boundaries. It does not convert them into a letter, water-zone, well, operator, property, environmental, engineering, compliance, ownership, or transaction fact.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/applications-and-permits/groundwater-advisory-unit/',
    [
      'The official Groundwater Advisory Unit page identifies the unit and Form GW-2 determination-letter context.',
      'The article uses it only to distinguish current unit and form context from the imaged-record profile attempt. It provides no application, payment, filing, water-zone, casing, environmental, engineering, compliance, or legal guidance.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/applications-and-permits/groundwater-advisory-unit/researching-groundwater-protection-determinations-and-data/',
    [
      'The official research page identifies a separate All Applications search for GW-1 and GW-2 materials.',
      'The article uses it only to separate the current online research route from profileId 23. It performs no login, application, submission, payment, interpretation, or substantive determination.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding offer-mistakes identity and owns one distinct administrative reader job: preserve one authorized manual Texas RRC Groundwater Protection Determination Letters profileId 23 retrieval attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The people-free wide microfilm reading station and close oblique three-sleeve evidence scene are materially distinct in camera angle, composition, subject arrangement, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official RRC surfaces, profileId 23 routing, source-described era coverage, separate later and earlier routes, and attempt-state rules. None establishes a completed retrieval, letter completeness, water-zone, casing, cementing, groundwater, drilling, injection, disposal, environmental, engineering, compliance, facility, operator, well, property, ownership, royalty, value, offer, legal, tax, or transaction conclusion.',
  'The direct profile request returned HTTP 403, no profile page was captured, and no query completed. The article publishes no actual GAU number, coordinate, county, lease, operator, well, property, owner, result, letter, depth, environmental finding, payment, value, offer, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps profileId 23 separate from P-18, T-1, EDMS injection-disposal, GW-1/GW-2 filing, RRC Online login, GAU or Central Records requests, Energy Depot, paid research, automation, bulk retrieval, interpretation, valuation, offer, and decision tasks.',
  'Image text is limited to the exact title and keyword and adds no identifier, actual letter, source result, seal, logo, coordinate, water-zone, casing, environmental, engineering, compliance, ownership, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
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
  'texas_rrc_groundwater_determination_letters_profile23_one_manual_attempt_http403_unverified_no_login_paid_request_filing_automation_bulk_interpretation_environmental_engineering_compliance_property_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
