#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '158';
process.env.MRX_ARTICLE_SLUG =
  'form-50-172-joint-taxation-instruction-source-map-crane-mineral-interests';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0757';
process.env.MRX_SELECTION_RANK = '230';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Form 50-172 Joint-Taxation Instruction Source Map for Crane Mineral Interests';
process.env.MRX_PRIMARY_KEYWORD = 'Form 50-172 Crane mineral interest';
process.env.MRX_INLINE_KEYWORD = 'Form 50-172 Crane mineral interest';
process.env.MRX_HERO_ALT =
  'A blank source-provenance booklet appears beside the exact Form 50-172 instruction-map title.';
process.env.MRX_INLINE_ALT =
  'An overhead four-source map appears above the exact Form 50-172 Crane mineral interest keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://comptroller.texas.gov/forms/50-172.pdf',
    [
      'The current official two-page blank PDF supplies the displayed title, form number, 04-17/4 revision line, General Instructions, Filing Instructions, five printed step headings, field categories, statutory reference, and printed limitation language.',
      'It supports a literal instruction-source map only. The article does not reproduce a completed form, enter owner values, review proof, decide applicability or qualification, personalize timing, complete or sign the request, interpret law, submit anything, or claim receipt, acceptance, qualification, or a tax result.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/forms/',
    [
      'The Texas Comptroller property-tax forms index supplies current statewide form-source context.',
      'It supports current-source and revision rechecking only. It does not supply owner-specific applicability, timing, completion, filing, proof, acceptance, or legal-effect conclusions.',
    ],
  ],
  [
    'https://www.cranecad.org/Forms',
    [
      'The current official Crane CAD forms surface supplies local forms-publisher context and links to statewide property-tax form resources.',
      'It supports local source context only. It does not establish that Form 50-172 applies to a particular Crane mineral interest, identify an owner, select a destination, or authorize contact or submission.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/crane.php',
    [
      'The Texas Comptroller county directory identifies the official Crane County appraisal-district website and local property-tax offices.',
      'It supports source identity and jurisdictional separation only. The article does not choose a chief appraiser, office, recipient, channel, or filing destination.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/Docs/TX/htm/TX.25.htm',
    [
      'Texas Tax Code Chapter 25 supplies current official provenance for Section 25.12 and the statutory subject referenced by the form.',
      'It supports governing-source provenance only. The article does not interpret the statute, decide applicability or qualification, calculate timing, determine a tax treatment, or replace qualified legal or tax review.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the generic Crane County valuation identity and owns one distinct deliverable: a source-controlled map of the identity, instruction subjects, five-step structure, official-source relationships, retrieval provenance, and limitations of the current official Form 50-172.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The oblique open-book provenance hero and strict-overhead four-tile source map are materially distinct and contain no person, real form, owner data, property fact, government mark, instruction, filing result, legal conclusion, tax conclusion, recommendation, deadline, or outcome.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official Form 50-172 displayed identity, revision, two-page structure, instruction and step subjects, Texas Comptroller form-source context, Crane local-source context, official county-directory context, and Texas Tax Code Section 25.12 provenance.',
  'The article invents no operator, owner, agent, address, phone, property description, interest amount, ownership proof, signature, date, taxable value, applicability decision, qualification, deadline, filing, receipt, acceptance, tax result, valuation, recommendation, or outcome.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public source map contains only blank document-control and source-provenance fields, keeps any owner-specific working record in an authorized controlled system, and stops before private-data entry, proof review, applicability or qualification decisions, completion, signature, contact, upload, submission, timing calculation, legal interpretation, tax guidance, appraisal judgment, valuation, representation, or strategy.',
  'Image text is limited to the exact title and keyword and adds no government affiliation, real form, owner data, filing claim, professional endorsement, legal position, tax conclusion, deadline, recommendation, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'current_texas_comptroller_crane_cad_county_directory_and_texas_statute_source_priority_pass',
  'form_instruction_subjects_not_converted_into_applicability_proof_timing_completion_submission_qualification_tax_or_legal_conclusions_pass',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'source_map_only_no_private_data_proof_review_applicability_destination_deadline_completion_signature_contact_submission_legal_tax_valuation_advice_qualification_acceptance_or_outcome_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_real_form_owner_data_property_fact_government_mark_recommendation_legal_tax_filing_or_outcome_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
