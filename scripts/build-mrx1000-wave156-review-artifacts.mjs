#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '156';
process.env.MRX_ARTICLE_SLUG = 'brazos-cad-mineral-property-arb-hearing-notice-inventory';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0750';
process.env.MRX_SELECTION_RANK = '228';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE = 'Brazos CAD Mineral Property ARB Hearing Notice Inventory';
process.env.MRX_PRIMARY_KEYWORD = 'Brazos CAD mineral property ARB hearing notice';
process.env.MRX_INLINE_KEYWORD = 'Brazos CAD mineral property ARB hearing notice';
process.env.MRX_HERO_ALT =
  'A blank notice sleeve and archival tray appear beside the exact Brazos CAD hearing-notice inventory title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank notice inventory appears above the exact Brazos CAD mineral property ARB hearing notice keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://esearch.brazoscad.org/',
    [
      'The current official Brazos CAD Property Search supplies local publisher identity, protest-related field context, and explicit research-use and verification limitations.',
      'It supports local source identity and limitations only. The article does not search for an account or status, enter an identifier, retrieve a record, treat a displayed field as a written notice, or infer ownership, appraisal correctness, tax liability, mineral value, notice, scheduling, or legal effect.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/protests/',
    [
      'The Texas Comptroller property-tax protest page supplies current statewide context that a post-filing written hearing notice contains the hearing date, time, place, subject matter, and access-to-estimated-tax information, plus the Comptroller no-advice boundary for matters under protest.',
      'It supports the literal field inventory and professional-handoff boundary only. The article does not calculate a notice interval or deadline, determine validity or service, choose a hearing method, prepare evidence, recommend action, or predict a hearing or outcome.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/forms/',
    [
      'The current official Texas Comptroller property-tax forms index identifies Form 50-216 as the Appraisal Review Board Protest Hearing Notice.',
      'It supports the current form identity and revision-awareness stop only. The article does not reproduce, complete, submit, interpret, authenticate, or decide whether an owner-specific item is the controlling form or notice.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/arb/',
    [
      'The Texas Comptroller appraisal review board page supplies current statewide context for ARB authority, independence, training, and hearing procedures.',
      'It supports separating the deciding body from an administrative inventory. The article does not speak for an ARB, verify a proceeding, select representation, interpret procedure, or promise scheduling, acceptance, relief, or another outcome.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/docs/tx/pdf/tx.41.pdf',
    [
      'Texas Tax Code Chapter 41 supplies the current official statutory context for protest hearing notices and local review procedures.',
      'It supports identifying the governing chapter and preserving current-law provenance only. The article does not interpret the statute, calculate a deadline, determine delivery or legal effect, identify an owner-specific right or remedy, or substitute for qualified legal or tax guidance.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the generic Brazos county-value timeline identity and owns one distinct deliverable: a blank inventory of one retained written ARB hearing notice and its visibly labeled accompanying materials. It does not repeat account search, contact routing, pre-submission evidence assembly, public status observation, valuation, legal interpretation, or next-action work.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The eye-level archival intake hero and strict-overhead blank enclosure-index flat lay are materially distinct compositions and contain no person, real notice, form, identifier, date, time, place, value, government mark, recommendation, legal conclusion, appraisal conclusion, hearing result, or outcome.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official Brazos source-identity and limitation context, Texas Comptroller post-filing notice and Form 50-216 identity, ARB institutional context, and Texas Tax Code Chapter 41 notice and hearing context.',
  'The article invents no owner, address, account, property ID, notice content, date, time, place, subject matter, delivery record, enclosure, deadline, filing result, value, legal effect, recommendation, representation, hearing, relief, or outcome.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public inventory contains blank document-control fields only, keeps completed records in an authorized system, and stops before private-data disclosure, login, contact, change request, signature, upload, submission, payment, deadline calculation, legal interpretation, tax guidance, appraisal judgment, valuation, representation, or strategy.',
  'Image text is limited to the exact title and keyword and adds no government affiliation, real notice, form, identifier, scheduling claim, tax or appraisal fact, legal position, professional endorsement, recommendation, hearing result, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'current_brazos_cad_texas_comptroller_and_texas_statute_source_priority_pass',
  'notice_fields_not_converted_into_deadline_service_validity_or_legal_effect_conclusions_pass',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'post_filing_retained_written_notice_inventory_only_no_search_routing_evidence_preparation_status_query_deadline_interpretation_contact_submission_private_data_valuation_advice_or_outcome_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_real_notice_form_identifier_date_time_place_value_government_mark_recommendation_legal_appraisal_hearing_or_outcome_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
