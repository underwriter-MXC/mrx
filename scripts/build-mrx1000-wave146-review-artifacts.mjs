#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '146';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-county-tax-assessor-collector-directory-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0521';
process.env.MRX_SELECTION_RANK = '218';
process.env.MRX_EXPECTED_SOURCE_COUNT = '3';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller County Tax Assessor-Collector Directory Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas county tax assessor collector directory retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas county tax assessor collector directory retrieval';
process.env.MRX_HERO_ALT =
  'A front-facing civic-office directory panel appears beside the exact Texas tax-assessor worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank collecting-unit card set appears above the exact Texas tax-assessor directory keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/',
    [
      'The current Texas Comptroller county-directory index distinguishes appraisal-district questions from county tax-office questions, says the agency does not have local appraisal or tax information, and describes the directory as contact information plus taxing units served.',
      'It supports the official starting route, county selection, tax-office directory scope, and source limitation. It does not identify a property or owner, prove collecting responsibility, retrieve a local record, or establish tax status, title, mineral connection, value, or legal effect.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/montgomery.php',
    [
      'The current representative official county page displays a Tax Assessor/Collector section, Last Updated label, officeholder/contact/address fields, a Collecting Unit label, and Consolidated Taxing Units Served codes and names.',
      'It validates the blank worksheet field structure only. The article does not republish values, certify an officeholder, infer property service or collection responsibility, contact the office, or expand into local tax or property records.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/austin.php',
    [
      'The current representative official Austin County page displays a Tax Assessor/Collector section and an alternative Collecting Unit statement that the tax office does not collect property taxes.',
      'It supports preserving collecting-unit language exactly and forbids inferring responsibility from the county name or a different page section. It does not authorize a local-system search, contact, appraisal, tax, title, mineral, valuation, offer, or transaction conclusion.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding broad heir identity and owns one distinct deliverable: a blank provenance record for one authorized manual official Texas Comptroller county-directory attempt and only one selected county page Tax Assessor/Collector section.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The front-facing civic-office directory panel and strict-overhead collecting-unit card layout are materially distinct from one another and from Article 217 assets.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to three current official Texas Comptroller sources, exact tax-office directory scope, exact displayed-field labels, collecting-unit statement variants, and attempt-level outcomes.',
  'The article invents no officeholder, contact, address, collecting unit, taxing unit, owner, heir, estate, property, tax status, title, mineral connection, value, offer, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, covers one manual official index route and one selected county Tax Assessor/Collector section, excludes Article 217 appraisal-district fields, keeps completed values and evidence controlled, and stops at authorized-human review.',
  'Image text is limited to the exact title and keyword and adds no identity, officeholder, contact, tax, property, title, ownership, mineral, valuation, offer, or transaction claim.',
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
  'one_authorized_manual_official_texas_comptroller_county_directory_index_and_selected_county_tax_assessor_collector_section_attempt_exact_source_displayed_fields_and_collecting_unit_language_only_controlled_retained_evidence_located_not_located_unverified_outcomes_no_appraisal_district_fields_local_record_search_login_contact_submission_payment_captcha_bypass_scrape_bulk_collection_identity_officeholder_currentness_jurisdiction_tax_title_ownership_mineral_value_offer_transaction_or_legal_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
