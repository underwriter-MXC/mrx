#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '154';
process.env.MRX_ARTICLE_SLUG =
  'brazos-county-texas-mineral-rights-property-tax-protest-evidence-packet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0748';
process.env.MRX_SELECTION_RANK = '226';
process.env.MRX_EXPECTED_SOURCE_COUNT = '7';
process.env.MRX_ARTICLE_TITLE =
  'Brazos County, Texas Mineral Rights Property Tax Protest Evidence Packet';
process.env.MRX_PRIMARY_KEYWORD = 'Brazos County mineral rights property tax protest';
process.env.MRX_INLINE_KEYWORD = 'Brazos County mineral rights property tax protest';
process.env.MRX_HERO_ALT =
  'A blank evidence folder and archival box appear beside the exact Brazos County property-tax protest packet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank four-card evidence matrix appears above the exact Brazos County mineral rights property tax protest keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://esearch.brazoscad.org/',
    [
      'The current official Brazos CAD Property Search supplies local account and protest-status context and cautions that displayed information is for research and that legal descriptions and acreage require verification before legal use.',
      'It supports local source identity, field provenance, and source limitations only. This article begins after an account or notice is already identified and does not search, establish ownership, validate acreage or a legal description, decide a protest issue, or treat a displayed appraisal amount as mineral market value.',
    ],
  ],
  [
    'https://mineral.cagi.com/Main?modulenum=242',
    [
      'The current mineral appraisal interface supplies the secure owner-access context associated with mineral-account materials and visibly separates public landing content from credentialed access.',
      'It supports the login and private-data stop only. The article does not sign in, register, retrieve an owner record, submit data, disclose an identifier, infer authority, or claim a response or result.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/protests/',
    [
      'The Texas Comptroller property-tax protest page supplies current statewide context for protests, evidence, and appraisal review board proceedings.',
      'It supports a source-controlled evidence-packet workflow and the instruction to verify current official procedures only. The article does not interpret a deadline, choose an argument, decide evidentiary sufficiency, advise whether or how to protest, or predict an outcome.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/forms/',
    [
      'The Texas Comptroller property-tax forms index supplies the current official statewide location for property-tax forms and instructions.',
      'It supports recording the exact current form identity, revision, source URL, and access time if used. The article does not select or complete a form, determine applicability, obtain a signature, submit a filing, or replace current local instructions.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/arb/',
    [
      'The Texas Comptroller appraisal review board page supplies current statewide context for ARB independence, duties, and the hearing process.',
      'It supports keeping packet assembly separate from the deciding body and outcome. The article does not speak for an ARB, determine admissibility or sufficiency, recommend a representative, or promise acceptance or relief.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/',
    [
      'The Texas Comptroller local-property directory distinguishes appraisal-district matters from tax assessor-collector functions.',
      'It supports the institutional boundary only. The article does not repeat a contact-routing workflow, choose an owner-specific jurisdiction, determine tax liability, or provide legal or tax advice.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/docs/tx/pdf/tx.41.pdf',
    [
      'Texas Tax Code Chapter 41 supplies the current official statutory context for local review and protest procedures.',
      'It supports identifying the governing chapter and preserving current-law provenance only. The article does not interpret the statute, calculate a deadline, identify a legal right or remedy for an owner, select a ground, or substitute for qualified legal or tax advice.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the generic Brazos value-market-update identity and owns one distinct deliverable: a blank source-controlled evidence packet that begins with an already-identified appraisal account or retained notice. It does not repeat account search, contact routing, valuation, protest strategy, submission, or owner decision work.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The eye-level folder-and-archive hero and strict-overhead four-card evidence matrix are materially distinct compositions and contain no person, real form, contact detail, account identifier, value, tax amount, map, calculator, logo, seal, recommendation, legal conclusion, or outcome.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official Brazos account-source context, secure-interface login boundary, Texas Comptroller protest, form, ARB, and local-office context, and Texas Tax Code Chapter 41 process context.',
  'The article invents no person, owner, address, account, owner key, property ID, notice, legal description, acreage, interest, appraisal result, exemption, tax amount, value, production record, lease, offer, deadline, argument, submission, acceptance, or outcome.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet contains blank evidence-control fields only, keeps completed records in an authorized system, and stops before private-data disclosure, login, contact, form completion, signature, upload, submission, payment, legal interpretation, tax advice, appraisal judgment, valuation, representative selection, or strategy.',
  'Image text is limited to the exact title and keyword and adds no government affiliation, real form, identifier, tax or appraisal fact, ownership evidence, value result, legal position, professional endorsement, recommendation, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'seven_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'current_brazos_cad_texas_comptroller_and_texas_statute_source_priority_pass',
  'browser_reviewed_local_brazos_procedures_excluded_from_automation_ledger_when_node_fetch_blocked',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'already_identified_account_or_notice_source_ledger_document_inventory_issue_matrix_discrepancy_log_privacy_boundary_and_submission_readiness_stop_only_no_search_routing_valuation_advice_submission_sufficiency_or_outcome_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_real_form_contact_detail_identifier_value_tax_amount_map_calculator_logo_seal_recommendation_legal_conclusion_or_outcome_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
