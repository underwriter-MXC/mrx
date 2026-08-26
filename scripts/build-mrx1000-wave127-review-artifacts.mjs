#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '127';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-oil-and-gas-well-records-request-preparation-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0332';
process.env.MRX_SELECTION_RANK = '204';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Oil and Gas Well Records Request Preparation Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC well records request preparation';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC well records request preparation';
process.env.MRX_HERO_ALT =
  'A no-submit well-record request preparation desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'Five blank locator-field groups appear above the exact request-preparation keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory identifies distinct research systems and supplies the current anti-automation and informational-data limitations.',
      'It establishes route and data-use boundaries only, not record completeness or a substantive result.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official page lists useful request fields, request channels, record categories, historical context, and agency-scope limitations.',
      'It supports preparation only and does not establish ownership, property connection, availability, cost, timing, completeness, or request outcome.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/well-records-faqs/',
    [
      'The official FAQ supplies record-type and search-troubleshooting context.',
      'It does not authorize record interpretation or private-rights conclusions.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records-online/',
    [
      'The official page describes online well-record categories, stated coverage, and identifier context.',
      'It does not prove that a particular record is online, that a request is unnecessary, or that a record applies to an owner interest.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding first-time-seller offer identity and owns one distinct administrative job: prepare one no-submit Texas RRC well-record request handoff.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The oblique preparation desk and people-free overhead field-classification board are materially distinct.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC sources, source-listed locator fields, route and record-class context, agency limitations, and no-submit preparation states.',
  'The article publishes no actual identifier, request, response, record, well, operator, property, ownership, production, value, offer, legal, tax, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article stops before submission, agency contact, payment, login, scraping, automation, repeated retrieval, record interpretation, and private-rights or decision conclusions.',
  'Image text is limited to the exact title and keyword and adds no identifier, official mark, submission, result, valuation, compliance, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'four_distinct_https_sources',
  'current_source_http_200_review_pass',
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
  'texas_rrc_well_records_one_no_submit_request_preparation_handoff_no_contact_payment_login_scraping_automation_retrieval_interpretation_property_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
