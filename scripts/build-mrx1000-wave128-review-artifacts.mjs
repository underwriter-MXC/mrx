#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '128';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-oil-and-gas-lease-name-index-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0333';
process.env.MRX_SELECTION_RANK = '205';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Oil and Gas Lease Name Index Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Oil and Gas Lease Name Index retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Oil and Gas Lease Name Index retrieval';
process.env.MRX_HERO_ALT =
  'A dark archival index station appears beside the exact Lease Name Index worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down PDF retrieval evidence board appears above the exact Lease Name Index retrieval keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/well-information/oil-and-gas-lease-name-index/',
    [
      'The official page identifies monthly PDF indexes organized by district and lease name and lists the field name, operator name, and oil lease or Gas ID fields.',
      'It supports route and index-structure claims only, not property connection, title, ownership, current operator status, production, value, or a transaction result.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/',
    [
      'The official research page separately lists the Oil and Gas Lease Name Index under Well Information.',
      'It supplies route context only and does not establish a result for any lease, well, operator, owner, or property.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory supplies adjacent-route separation plus current anti-automation and informational-data limitations for the online query systems it lists.',
      'The article does not misstate the monthly PDF Lease Name Index as an online query and does not import a query result into the index-PDF record.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/media/zpog0h1d/olm003_08_20260731_rrc021_sep2026.pdf',
    [
      'One current page-linked official PDF confirms an artifact can display a report date, Oil Lease Name Index label, district, lease name, field name, organization name, and lease number columns.',
      'It is evidence of document structure only. No row is published or treated as proof of private-property connection, current status, ownership, payment, production, value, or legal effect.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding royalty-check offer identity and owns one distinct administrative job: preserve one authorized manual retrieval attempt for exactly one monthly Texas RRC Lease Name Index PDF.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The dark oblique archival index station and cream strict-overhead PDF evidence board are materially distinct.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC sources, page-displayed index organization, one page-linked PDF structure, manual source selection, provenance fields, and attempt states.',
  'The article publishes no actual searched term, matched row, lease, well, operator, organization, ID, property, ownership, production, value, offer, legal, tax, compliance, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps one monthly Lease Name Index PDF separate from Production by Lease, New Lease IDs Built, Wellbore, GIS, broad record locators, automation, interpretation, and decision tasks.',
  'Image text is limited to the exact title and keyword and adds no identifier, official mark, result, property, ownership, production, valuation, legal, tax, compliance, or transaction claim.',
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
  'texas_rrc_lease_name_index_one_month_one_oil_or_gas_column_one_district_one_pdf_manual_retrieval_provenance_no_property_current_operator_ownership_title_payment_production_value_offer_legal_tax_compliance_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
