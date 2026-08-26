#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '133';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-taxable-entity-search-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0338';
process.env.MRX_SELECTION_RANK = '210';
process.env.MRX_EXPECTED_SOURCE_COUNT = '3';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller Taxable Entity Search Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas Comptroller taxable entity search retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas Comptroller taxable entity search retrieval';
process.env.MRX_HERO_ALT =
  'A public-record research workstation appears beside the exact Taxable Entity Search worksheet title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead three-field provenance board appears above the exact Taxable Entity Search keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://comptroller.texas.gov/transparency/open-data/cpa-databases/',
    [
      'The current Texas Comptroller database directory identifies the Taxable Entity Search as an official public database route.',
      'It supports source-route identity only; it does not connect a record to an offer sender or establish identity, legitimacy, authority, endorsement, capacity, fairness, legal effect, or transaction quality.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/franchise/coas-instructions.php',
    [
      'The current Franchise Tax Account Status overview explains that printed search results reflect Comptroller records at query time and distinguishes the public search from a purpose-specific certificate.',
      'It supports query-time status context and the certificate boundary only; it does not authenticate a contact person, approve a transaction, or establish broader legal or commercial conclusions.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/franchise/account-status/search',
    [
      'The current public search page exposes Tax ID, Entity Name, and Texas Secretary of State File Number as the three source-labeled search choices.',
      'It supports the exact route and field labels actually documented by the worksheet; it does not prove that a displayed record belongs to a sender, signer, solicitation, website, property, or proposed transaction.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding broad legitimacy identity and owns one distinct deliverable: a source-bounded provenance record for one manual Texas Comptroller account-status search attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The oblique monitor-and-folder workstation and strict-overhead three-input evidence board are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to three current official Comptroller sources, their route identity, current search-field labels, query-time status context, and certificate distinction.',
  'The article invents no input, entity, result, status, address, representative, offer-sender relationship, authority, endorsement, capacity, fairness, legal effect, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article stores real Tax ID, entity-name, file-number, result, address, registered-agent, screenshot, and evidence values outside the reusable public template.',
  'Image text is limited to the exact title and keyword and adds no real entity, identifier, status, address, sender, authority, legitimacy, offer, legal, or transaction claim.',
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
  'texas_comptroller_account_status_single_manual_attempt_tax_id_entity_name_or_sos_file_number_query_time_record_context_located_not_located_or_unverified_no_offer_sender_identity_legitimacy_authority_endorsement_capacity_fairness_legal_effect_transaction_conclusion_certificate_request_open_records_submission_automation_or_public_sensitive_values_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
