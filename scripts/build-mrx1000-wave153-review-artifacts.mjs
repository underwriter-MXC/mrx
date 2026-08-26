#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '153';
process.env.MRX_ARTICLE_SLUG =
  'brazos-cad-mineral-industrial-account-contact-routing-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0747';
process.env.MRX_SELECTION_RANK = '225';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Brazos CAD Mineral and Industrial Account Contact-Routing Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Brazos CAD mineral and industrial account contact';
process.env.MRX_INLINE_KEYWORD = 'Brazos CAD mineral and industrial account contact';
process.env.MRX_HERO_ALT =
  'A three-destination records wayfinding wall appears beside the exact Brazos CAD contact-routing title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank three-route board appears above the exact Brazos CAD mineral and industrial account contact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://mineral.cagi.com/Main?modulenum=242',
    [
      'The current Capitol Appraisal Group mineral interface displays a Mineral Oil and Gas owner-relations route for value or ownership questions, concerns, and updates, and separately displays a corporate route for clients, appraisal, and software services.',
      'It supports exact source-displayed route-label capture and the login stop only. The article does not sign in, register, submit data, disclose a notice or identifier, treat either label as legal authority, or predict a response or result.',
    ],
  ],
  [
    'https://cagi.com/clients-_-appraisers',
    [
      'The current Capitol Appraisal Group assignment table identifies a Brazos row and separates industrial appraiser, mineral appraiser value, and mineral analyst ownership columns.',
      'It supports a current role-label distinction only. The article does not publish a named employee, endorse a professional, determine who must handle an owner-specific issue, or infer identity, ownership, title, appraisal correctness, or legal effect.',
    ],
  ],
  [
    'https://www.cagi.com/client-base',
    [
      'The current Capitol Appraisal Group client page lists Brazos County Appraisal District among its appraisal clients.',
      'It supports the bounded current-source relationship context only. The article does not define a contract scope, duration, authority, independence, qualification, service level, or outcome.',
    ],
  ],
  [
    'https://esearch.brazoscad.org/',
    [
      'The current official Brazos CAD Property Search identifies the local district destination and states that displayed 2026 values are preliminary, the information is for research, and legal descriptions and acreage should be verified before legal use.',
      'It supports district identity and source limitations only. This article does not perform a search, retrieve or interpret an account, infer title or ownership, validate acreage or a legal description, or use a displayed appraisal amount as mineral market value.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/',
    [
      'The Texas Comptroller local-property directory states that most local appraisal questions belong with the county appraisal district, while tax-payment questions belong with the applicable tax assessor-collector.',
      'It supports institutional routing context only. The article does not repeat the statewide directory worksheet, decide an owner-specific jurisdiction, interpret property-tax law, determine tax liability, or provide legal or tax advice.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the generic Brazos value-guide identity and owns one distinct deliverable: a blank pre-contact routing record for one already-existing administrative question. It neither searches the Brazos CAD interface nor performs the resulting outreach.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The eye-level three-destination wayfinding wall and bright strict-overhead triangular routing board are materially distinct compositions and contain no person, real contact detail, account identifier, value, tax amount, property, legal document, map, logo, seal, recommendation, or outcome.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current source-displayed contractor route labels, the current Brazos assignment and client rows, the official Brazos CAD search identity and limitations, and the Texas Comptroller local-office boundary.',
  'The article invents no person, contact detail, owner, account, owner key, property ID, geographic ID, notice, legal description, acreage, interest, appraisal result, tax amount, value, lease, well, operator, payor, offer, response, or professional conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet contains blank administrative fields only, keeps the completed record in an authorized system, and stops before private-data disclosure, contact, submission, upload, login, payment, access bypass, interpretation, appraisal review, tax review, valuation, or transaction work.',
  'Image text is limited to the exact title and keyword and adds no agency affiliation, real contact detail, identifier, tax or appraisal fact, title evidence, value result, offer result, professional endorsement, recommendation, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'current_cagi_brazos_cad_and_texas_comptroller_source_priority_pass',
  'source_displayed_role_labels_and_brazos_client_context_verified',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'one_existing_administrative_question_pre_contact_source_displayed_destination_routing_controlled_reference_neutral_question_limitations_and_routed_unresolved_authorized_human_stop_only_no_private_disclosure_contact_identity_ownership_title_acreage_appraisal_tax_value_property_well_production_offer_professional_legal_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_contact_detail_identifier_value_tax_amount_property_legal_document_map_logo_seal_recommendation_or_outcome_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
