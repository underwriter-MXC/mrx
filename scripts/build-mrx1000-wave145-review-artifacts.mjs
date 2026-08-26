#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '145';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-county-appraisal-district-directory-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0460';
process.env.MRX_SELECTION_RANK = '217';
process.env.MRX_EXPECTED_SOURCE_COUNT = '3';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller County Appraisal District Directory Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas county appraisal district directory retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas county appraisal district directory retrieval';
process.env.MRX_HERO_ALT =
  'A low-oblique county-directory archive appears beside the exact Texas appraisal-district worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank directory worksheet appears above the exact Texas county appraisal-district retrieval keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/',
    [
      'The current Texas Comptroller county-directory index says the agency does not have local appraisal or tax information, directs most local questions to appraisal districts or tax offices, lists all 254 counties, and describes the directory as contact information plus taxing units served.',
      'It supports the official starting route, selected county code and name, directory scope, and source limitation. It does not identify a property or owner, retrieve a local record, prove contact accuracy or currency, or establish title, mineral connection, appraisal, tax treatment, value, or legal effect.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/montgomery.php',
    [
      'The current representative official county page displays an Appraisal District section, Last Updated label, chief-appraiser and taxpayer-liaison labels, contact and address fields, and active-taxing-unit codes and names.',
      'It validates the blank worksheet field structure only. The article does not republish contact values, certify an officeholder, infer that a blank field means none, connect a taxing unit to a property, or expand into local appraisal or tax-record research.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/basics.php',
    [
      'The current Texas Comptroller Property Tax System Basics page describes local appraisal-district functions and directs local appraisal-process questions to the applicable district.',
      'It supports the stop-and-handoff boundary only. The article does not interpret an appraisal, tax bill, exemption, protest, ownership, title, mineral interest, valuation, offer, or transaction.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding broad inherited-mineral identity and owns one distinct deliverable: a blank provenance record for one authorized manual official Texas Comptroller county-directory attempt and one selected county appraisal-district directory entry.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique county-directory archive and strict-overhead blank directory worksheet are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to three current official Texas Comptroller sources, exact directory scope, exact displayed-field labels, and attempt-level outcomes.',
  'The article invents no person, contact, address, taxing unit, property, owner, heir, estate, title, mineral connection, appraisal, tax result, value, offer, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, covers one manual official index route and one selected county page, keeps completed contact values and evidence in controlled records, places non-verification warnings beside the outcome, and stops at authorized-human review.',
  'Image text is limited to the exact title and keyword and adds no identity, officeholder, contact, property, appraisal, tax, title, ownership, mineral, valuation, offer, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'three_distinct_https_sources',
  'current_primary_source_http_review_pass',
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
  'one_authorized_manual_official_texas_comptroller_county_directory_index_and_selected_county_page_attempt_exact_source_displayed_fields_only_controlled_retained_evidence_located_not_located_unverified_outcomes_login_contact_submission_payment_captcha_bypass_scrape_or_bulk_collection_stop_no_property_search_identity_match_authenticity_currentness_appraisal_tax_title_ownership_mineral_value_offer_transaction_or_legal_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
