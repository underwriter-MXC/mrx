#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '157';
process.env.MRX_ARTICLE_SLUG =
  'form-50-843-electronic-delivery-request-field-inventory-crane-mineral-properties';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0756';
process.env.MRX_SELECTION_RANK = '229';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE =
  'Form 50-843 Electronic Delivery Request Field Inventory for Crane Mineral Properties';
process.env.MRX_PRIMARY_KEYWORD = 'Form 50-843 Crane mineral property';
process.env.MRX_INLINE_KEYWORD = 'Form 50-843 Crane mineral property';
process.env.MRX_HERO_ALT =
  'A blank form-control tray appears beside the exact Form 50-843 field-inventory title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank six-section field grid appears above the exact Form 50-843 Crane mineral property keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.cranecad.org/Forms',
    [
      'The official Crane CAD forms page currently links Request for Electronic Delivery of Communications with a Tax Official, Form 50-843.',
      'It supports local source provenance and current-link verification only. The article does not select a destination, submit a form, contact an office, or claim that the link controls an owner-specific result.',
    ],
  ],
  [
    'https://comptroller.texas.gov/forms/50-843.pdf',
    [
      'The current official linked blank PDF supplies the form title, 50-843 identifier, 3-24/2 revision line, six printed sections, field labels, filing instructions, and important-information headings.',
      'It supports a literal blank-field inventory only. The article does not reproduce a completed form, choose a checkbox, collect private values, complete or sign the request, interpret legal effect, calculate timing, submit anything, or claim delivery or acceptance.',
    ],
  ],
  [
    'https://www.cranecad.org/home',
    [
      'The current official Crane CAD property-search surface supplies local publisher identity and shows mineral and industrial as a searchable property type.',
      'It supports local mineral-property context only. This workflow performs no account search, retrieves no record, and infers no ownership, value, tax status, notice, or communication result.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/crane.php',
    [
      'The Texas Comptroller county directory identifies the official Crane County appraisal-district website and local property-tax offices.',
      'It supports source identity and jurisdictional separation only. The article does not choose an office or recipient, route contact, or state where an owner must file.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/forms/',
    [
      'The Texas Comptroller property-tax forms index supplies current statewide form-source context.',
      'It supports revision awareness and current-source rechecking only. It does not supply owner-specific advice, completion, submission, deadline, or legal-effect conclusions.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/docs/tx/pdf/tx.1.pdf',
    [
      'Texas Tax Code Chapter 1 supplies current official statutory context for electronic communications with tax officials.',
      'It supports governing-source provenance only. The article does not interpret the statute, determine consent or delivery, identify a duty or deadline, or replace qualified legal or tax review.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the generic Crane County valuation identity and owns one distinct deliverable: a blank, source-controlled inventory of the printed sections and field labels in the current official Form 50-843 linked by Crane CAD.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The eye-level archive-tray hero and strict-overhead six-card field grid are materially distinct and contain no person, real form, owner data, property fact, government mark, instruction, recommendation, delivery result, legal conclusion, tax conclusion, or outcome.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official Crane CAD forms link and local identity, current Form 50-843 printed structure and revision line, Texas Comptroller directory and forms context, and Texas Tax Code Chapter 1 provenance.',
  'The article invents no owner, representative, tax official, office choice, account, legal description, email, signature, form value, filing, delivery, acceptance, deadline, legal effect, tax result, valuation, recommendation, or outcome.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public inventory contains only blank document-control fields, keeps any completed record in an authorized controlled system, and stops before selection, private-data entry, completion, signature, contact, upload, submission, timing calculation, legal interpretation, tax guidance, appraisal judgment, valuation, representation, or strategy.',
  'Image text is limited to the exact title and keyword and adds no government affiliation, real form, checkbox selection, owner data, delivery claim, professional endorsement, legal position, tax conclusion, recommendation, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'six_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'current_crane_cad_texas_comptroller_and_texas_statute_source_priority_pass',
  'form_fields_not_converted_into_selection_completion_submission_delivery_or_legal_effect_conclusions_pass',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'blank_form_field_inventory_only_no_selection_private_data_completion_signature_contact_submission_deadline_interpretation_valuation_advice_delivery_claim_or_outcome_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_real_form_owner_data_property_fact_government_mark_recommendation_legal_tax_delivery_or_outcome_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
