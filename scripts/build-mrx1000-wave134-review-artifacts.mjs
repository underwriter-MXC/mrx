#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '134';
process.env.MRX_ARTICLE_SLUG =
  'texas-secretary-of-state-business-organization-document-order-request-preparation-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0339';
process.env.MRX_SELECTION_RANK = '211';
process.env.MRX_EXPECTED_SOURCE_COUNT = '2';
process.env.MRX_ARTICLE_TITLE =
  'Texas Secretary of State Business Organization Document Order Request Preparation Worksheet';
process.env.MRX_PRIMARY_KEYWORD =
  'Texas Secretary of State business organization document order request preparation';
process.env.MRX_INLINE_KEYWORD =
  'Texas Secretary of State business organization document order request preparation';
process.env.MRX_HERO_ALT =
  'Blank document-order preparation materials appear beside the exact Texas Secretary of State worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank request-preparation field board appears above the exact Texas Secretary of State keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.sos.state.tx.us/corp/copies.shtml',
    [
      'The current Texas Secretary of State Copies and Certificates page lists SOSDirect, email, and mail as order routes and names certified copies and certificates of fact - status.',
      'It distinguishes a Secretary of State certificate of fact - status from a Comptroller certificate of account status and supports exact agency terminology only, not a sender, offer, property, legal-effect, or transaction conclusion.',
    ],
  ],
  [
    'https://www.sos.state.tx.us/corp/instructions-for-copies.shtml',
    [
      'The current instructions page supplies exact copy and certificate terminology, SOS file-number context, order choices, current agency-published fees, and operational steps that this article deliberately stops before.',
      'It supports blank request preparation and dated fee context only; the article does not reproduce login, payment, checkout, submission, or retrieval instructions and never incurs or authorizes a charge.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding generic pitfalls identity and owns one distinct deliverable: a blank, source-linked preparation record for one Texas Secretary of State business-organization document order request.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The oblique right-weighted records desk and strict-overhead blank field board are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to two current official Texas Secretary of State pages, their agency-listed routes, exact document and certificate terminology, current request context, certificate distinction, and dated published fee context.',
  'The article invents no entity, requester, document, file number, property, contact, account, payment, result, standing, sender relationship, authority, endorsement, fairness, legal effect, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, uses bracketed labels, separates provenance classes, and sends every completed record to an authorized controlled location.',
  'Image text is limited to the exact title and keyword and adds no real entity, requester, document, contact, account, payment, fee, order, sender, authority, legal, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'two_distinct_https_sources',
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
  'texas_secretary_of_state_business_organization_document_order_request_blank_one_request_no_submit_no_purchase_no_payment_no_fee_incurrence_no_account_access_no_search_no_certificate_verification_no_automation_no_real_data_no_total_calculation_exact_agency_terminology_provenance_labels_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
