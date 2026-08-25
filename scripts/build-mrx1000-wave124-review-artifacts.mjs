#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '124';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-form-t-1-monthly-transportation-storage-report-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0329';
process.env.MRX_SELECTION_RANK = '201';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Form T-1 Monthly Transportation and Storage Report Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Form T-1 report retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Form T-1 report retrieval';
process.env.MRX_HERO_ALT =
  'A Texas records researcher reviews blank transportation-and-storage folders beside the exact title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead T-1 retrieval evidence board appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory identifies the Oil and Gas Imaged Records Menu and supplies the current official entry route and public-source context.',
      'The article uses the directory only for source identity and routing. It does not establish a completed query, report completeness, a facility or operator fact, property relationship, ownership, production, transportation, storage, inventory, value, offer, legal effect, or transaction conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/',
    [
      'The official Imaged Records page supplies the official imaged-record family route and archive context.',
      'The article uses the page only for route provenance and family separation. It makes no completeness, association, facility, operator, property, ownership, production, transportation, storage, inventory, value, legal, offer, or transaction inference.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official menu identifies Monthly Transportation and Storage Reports (Form T-1) profileId 29 and states January 2013-forward coverage.',
      'The article preserves that statement only as dated source-described collection scope and records only one authorized manual attempt. It does not convert the scope note, profile identity, or access response into a document, facility, operator, property, ownership, production, transportation, storage, inventory, value, offer, legal, or transaction fact.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/oil-and-gas-forms/',
    [
      'The official Oil and Gas Forms page identifies Form T-1 as the Monthly Transportation and Storage Report and supplies current form and instructions links.',
      'The article uses the page only to identify the form family and keep form materials separate from the imaged-record retrieval attempt. It does not prepare or submit a filing, interpret form entries, or infer any production, transportation, storage, inventory, facility, operator, property, ownership, value, legal, offer, or transaction fact.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/announcements/021524-nto-new-monthly-transportation-storage-report-and-skim-oilcondensate-report-available/',
    [
      'The official February 15, 2024 notice states that revised Form T-1 versions became required on May 1, 2024 and describes the added filing fields.',
      'The article uses the notice only as dated current-form context. It does not establish that any report was filed, accepted, complete, retrievable, connected to a reader, or substantively accurate, and it does not provide filing or compliance advice.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding hidden-cost identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Imaged Records Form T-1 profile retrieval attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The wide eye-level one-researcher archive scene and people-free strict-overhead T-1 evidence board are materially distinct in camera angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official RRC surfaces, source and profile identity, profileId 29 routing, January 2013-forward source-described coverage, current form context, adjacent-route separation, and attempt-state rules. None establishes a completed retrieval, report completeness, facility or operator identity, production, transportation, storage, inventory, property connection, ownership, title, lease, royalty, value, offer, legal effect, tax effect, or transaction conclusion.',
  'The direct profile request returned HTTP 403, no profile page was captured, and no query completed. The article publishes no actual organization number, facility, report identifier, district, location, reporting period, party, result, image, document, property, owner, payment, production, transportation, storage, inventory, value, offer, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps Form T-1 profileId 29 separate from other Imaged Records profiles, Form P-18, Oil and Gas Forms, EDI filing, production queries, Energy Depot, paid research, automation, bulk retrieval, interpretation, valuation, offer, and decision tasks.',
  'Image text is limited to the exact title and keyword and adds no identifier, actual report, source result, seal, logo, facility or operator fact, production, transportation, storage, inventory, ownership, payment, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_form_t1_profile29_one_manual_attempt_http403_unverified_no_adjacent_route_paid_research_automation_bulk_filing_interpretation_production_transportation_storage_inventory_facility_operator_property_ownership_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
