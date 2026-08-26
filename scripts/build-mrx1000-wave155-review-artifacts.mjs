#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '155';
process.env.MRX_ARTICLE_SLUG = 'brazos-cad-mineral-property-protest-status-verification-log';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0749';
process.env.MRX_SELECTION_RANK = '227';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE = 'Brazos CAD Mineral Property Protest Status Verification Log';
process.env.MRX_PRIMARY_KEYWORD = 'Brazos CAD mineral property protest status';
process.env.MRX_INLINE_KEYWORD = 'Brazos CAD mineral property protest status';
process.env.MRX_HERO_ALT =
  'An abstract status timeline and closed record box appear beside the exact Brazos CAD verification-log title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank observation ledger appears above the exact Brazos CAD mineral property protest status keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://esearch.brazoscad.org/',
    [
      'The current official Brazos CAD Property Search exposes protest-related field labels including Protest Status, Informal Date, Formal Date, Hearing Date, Board Members, and Tax Year, together with research-use and verification limitations.',
      'It supports exact local source identity, displayed-field transcription, observation timing, and source limitations only. The article does not search for an account, establish ownership, infer meaning from a blank or displayed field, determine notice or legal effect, calculate a deadline, or treat an appraisal display as mineral market value.',
    ],
  ],
  [
    'https://mineral.cagi.com/Main?modulenum=242',
    [
      'The current mineral appraisal interface supplies the secure owner-access context associated with mineral-account materials and separates public landing content from credentialed access.',
      'It supports the login, authority, and private-data stop only. The article does not sign in, register, retrieve an owner record, enter an identifier, submit data, disclose private information, or claim a response or result.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/protests/',
    [
      'The Texas Comptroller property-tax protest page supplies current statewide context for post-filing hearing notice, informal conference, ARB hearing, written order, and the Comptroller no-advice boundary for matters under protest.',
      'It supports distinguishing a displayed field from an official notice or order and routing interpretation to qualified review. The article does not interpret a deadline, determine filing validity or notice, choose a legal position, recommend action, or predict a hearing or outcome.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/arb/',
    [
      'The Texas Comptroller appraisal review board page supplies current statewide context for ARB authority, independence, and the hearing process.',
      'It supports keeping a status-observation log separate from the deciding body and outcome. The article does not speak for an ARB, verify an owner-specific proceeding, determine legal effect, recommend representation, or promise acceptance or relief.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/docs/tx/pdf/tx.41.pdf',
    [
      'Texas Tax Code Chapter 41 supplies the current official statutory context for local review and protest procedures.',
      'It supports identifying the governing chapter and preserving current-law provenance only. The article does not interpret the statute, calculate a deadline, identify an owner-specific right or remedy, infer legal effect from a displayed field, or substitute for qualified legal or tax advice.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the generic Brazos value-risk identity and owns one distinct deliverable: a blank post-submission log of time-stamped verbatim official-source status observations. It does not repeat account search, contact routing, pre-filing evidence-packet assembly, valuation, legal interpretation, or next-action work.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The eye-level monitor-and-record-box hero and strict-overhead blank observation ledger are materially distinct compositions and contain no person, real interface, form, identifier, value, date, government mark, recommendation, legal conclusion, appraisal conclusion, hearing result, or outcome.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official Brazos displayed-field and source-limitation context, secure-interface login boundary, Texas Comptroller post-filing and ARB context, and Texas Tax Code Chapter 41 process context.',
  'The article invents no owner, address, account, owner key, property ID, confirmation, notice, hearing record, tax year, deadline, status value, filing result, value, legal effect, recommendation, representation, acceptance, hearing, relief, or outcome.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public log contains blank observation-control fields only, keeps completed records in an authorized system, and stops before private-data disclosure, login, contact, amendment, signature, upload, submission, payment, legal interpretation, tax advice, appraisal judgment, valuation, representation, or strategy.',
  'Image text is limited to the exact title and keyword and adds no government affiliation, real interface, form, identifier, status claim, tax or appraisal fact, legal position, professional endorsement, recommendation, hearing result, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'current_brazos_cad_texas_comptroller_and_texas_statute_source_priority_pass',
  'displayed_field_labels_not_converted_into_legal_or_procedural_conclusions_pass',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'post_submission_verbatim_status_observation_only_no_search_routing_prefiling_packet_filing_interpretation_deadline_valuation_advice_private_data_or_outcome_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_real_interface_form_identifier_value_date_government_mark_recommendation_legal_appraisal_hearing_or_outcome_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
