#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '144';
process.env.MRX_ARTICLE_SLUG =
  'texas-probate-court-appointment-record-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0442';
process.env.MRX_SELECTION_RANK = '216';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas Probate Court Appointment Record Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas probate court appointment record retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas probate court appointment record retrieval';
process.env.MRX_HERO_ALT =
  'A low-oblique court-directory retrieval station appears beside the exact Texas probate worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank probate record retrieval worksheet appears above the exact Texas appointment-record keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.txcourts.gov/about-texas-courts/trial-courts/',
    [
      'The current Texas Judicial Branch Trial Courts page states that Texas has several trial-court levels with some overlap and separately describes constitutional county courts, county courts at law, district courts, and statutory probate courts.',
      'It supports preserving exact court and county routing labels and explains why one statewide interface cannot be assumed. It does not select the legally correct court for a matter or establish case existence, appointment, authority, title, ownership, or legal effect.',
    ],
  ],
  [
    'https://www.txcourts.gov/judicial-directory/',
    [
      'The current Texas Judicial Branch Judicial Directory page says its annual information is current as of April 2026 unless otherwise noted and links to the live directory database for more current court information.',
      'It supports the official starting-route and access-time fields only. A directory listing is not a probate case record and does not establish venue, jurisdiction for a particular matter, filing location, case existence, appointment, or authority.',
    ],
  ],
  [
    'https://card.txcourts.gov/DirectorySearch.aspx',
    [
      'The Texas Office of Court Administration public page identifies itself as the Court Activity Reporting and Directory System Directory Search and displays court-search controls.',
      'It supports recording exact source-displayed search controls and court-routing context. It does not authenticate a probate record, identify a representative, or provide title, ownership, mineral, valuation, offer, or transaction evidence.',
    ],
  ],
  [
    'https://tcss.legis.texas.gov/resources/SDocs/ESTATESCODE.pdf',
    [
      'The official Estates Code PDF rendered April 10, 2026 contains Chapter 32 probate-jurisdiction text and Chapter 306 provisions distinguishing orders granting letters, issuance, form/content, and statutory effect.',
      'It supports preserving exact source-displayed court and document labels and the strict non-interpretation boundary. The article does not apply the statutes to select a court, determine authenticity or certification, interpret appointment or qualification, decide present authority, connect a record to minerals, or state legal effect.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding broad inherited-mineral identity and owns one distinct deliverable: a blank provenance record for one authorized manual official Texas court or county route and one probate appointment, order, or letters record-search attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique court-directory station and strict-overhead blank probate record worksheet are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official Texas sources, exact court-routing context, exact displayed labels, the verified Chapter 32 and 306 distinctions, and attempt-level fields.',
  'The article invents no person, case, cause, docket, document, court result, appointment, qualification, authority, record authenticity, certification, title, ownership, mineral connection, value, offer, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, covers one manual official route and one controlled search attempt, keeps real criteria and retained evidence in separate controlled references, places non-verification warnings beside the result and outcome fields, and stops at authorized-human review.',
  'Image text is limited to the exact title and keyword and adds no case, identity, appointment, authority, legal-effect, property, mineral, valuation, offer, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'four_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'official_estates_code_pdf_text_extraction_pass',
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
  'one_authorized_manual_official_texas_court_or_county_route_and_probate_appointment_order_or_letters_record_search_attempt_exact_source_displayed_fields_only_controlled_private_references_located_not_located_unverified_outcomes_login_contact_payment_order_certified_copy_submission_bypass_scrape_or_bulk_collection_stop_no_identity_match_authentication_certification_appointment_authority_legal_effect_title_ownership_mineral_value_offer_or_transaction_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
