#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '126';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-injection-storage-test-report-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0331';
process.env.MRX_SELECTION_RANK = '203';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Injection-Storage Test Report Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC injection-storage test report retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC injection-storage test report retrieval';
process.env.MRX_HERO_ALT =
  'An archival research station appears beside the exact injection-storage worksheet title.';
process.env.MRX_INLINE_ALT =
  'Three evidence sleeves and a pressure-chart roll appear above the exact retrieval keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory supplies the current Oil and Gas Imaged Records route.',
      'It establishes route identity only, not a completed query or substantive result.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/',
    [
      'The official page supplies Imaged Records context.',
      'It establishes collection context only, not completeness or a report conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official menu identifies Injection-Storage Test Reports at profileId 7 and states Form H-5 online filing and May 2021 through current-date scope.',
      'The article preserves those statements as source-described routing and scope only.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/applications-and-permits/injection-storage-permits/resources/',
    [
      'The official resources page distinguishes H-5 filing, permit queries, H-10 monitoring, and Injection-Storage Test Reports.',
      'It is used only for adjacent-route separation and provides no filing or interpretation instruction here.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-edms/',
    [
      'The official EDMS page identifies older H-5 image coverage and separates it from current Imaged Records routes.',
      'It is used only as source-described route separation, not as a substituted query.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding buyer-comparison identity and owns one distinct administrative job: preserve one authorized manual Injection-Storage Test Reports profileId 7 attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The wide people-free archive station and top-down pressure-chart evidence desk are materially distinct.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five official RRC sources, profileId 7 routing, source-described scope, adjacent-route separation, and attempt-state rules.',
  'The direct profile request returned HTTP 403, no profile page was captured, and no query completed. The article publishes no actual identifier, result, report, well, operator, property, pressure, compliance, value, offer, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps profileId 7 separate from UIC permits, EDMS H-1/H-1A/W-14 documents, H-10 monitoring, H-5 filing, paid research, automation, interpretation, and decision tasks.',
  'Image text is limited to the exact title and keyword and adds no identifier, result, official mark, compliance, engineering, environmental, valuation, or transaction claim.',
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
  'texas_rrc_injection_storage_test_reports_profile7_one_manual_attempt_http403_unverified_no_login_payment_filing_automation_interpretation_compliance_engineering_environmental_property_production_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
