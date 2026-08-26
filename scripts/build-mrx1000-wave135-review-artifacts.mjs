#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '135';
process.env.MRX_ARTICLE_SLUG =
  'texas-secretary-of-state-registered-agent-and-registered-office-evidence-boundary-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0340';
process.env.MRX_SELECTION_RANK = '212';
process.env.MRX_EXPECTED_SOURCE_COUNT = '2';
process.env.MRX_ARTICLE_TITLE =
  'Texas Secretary of State Registered Agent and Registered Office Evidence Boundary Worksheet';
process.env.MRX_PRIMARY_KEYWORD =
  'Texas Secretary of State registered agent and registered office evidence boundary';
process.env.MRX_INLINE_KEYWORD =
  'Texas Secretary of State registered agent and registered office evidence boundary';
process.env.MRX_HERO_ALT =
  'A blank retained-evidence desk appears beside the exact registered-agent and registered-office worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank transcription grid appears above the exact registered-agent evidence-boundary keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.sos.state.tx.us/corp/registeredagents.shtml',
    [
      'The current Texas Secretary of State Registered Agents page describes the registered-agent and registered-office concepts, including service-of-process context and the physical Texas address description.',
      'It supports only agency-described field context and exact transcription boundaries, not identity, authority, consent, entity status, ownership, offer quality, legal effect, or transaction conclusions.',
    ],
  ],
  [
    'https://www.sos.state.tx.us/corp/registeredagentfaqs.shtml',
    [
      'The current Registered Agents FAQs explains that an officer, owner, or employee may serve as registered agent, that an entity cannot serve as its own registered agent, and that a service company may provide registered-agent services.',
      'It supports the warning against inferring a person role from a displayed field and the source-described distinctions only; the article does not search, file, order, compare parties, or provide legal advice.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding generic mistakes-and-fairness identity and owns one distinct deliverable: a blank source-linked transcription record for one already-retained registered-agent and registered-office excerpt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The oblique right-weighted retained-evidence desk and strict-overhead blank transcription grid are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to two current official Texas Secretary of State pages and their agency-described registered-agent and registered-office context.',
  'The article invents no entity, person, address, date, record, property, contact, offer, status, authority, ownership, legal effect, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, uses bracketed labels, requires exact display or a gap status, and sends real retained values to an authorized controlled record.',
  'Image text is limited to the exact title and keyword and adds no identity, authority, status, legitimacy, ownership, fairness, legal, value, fraud, or transaction claim.',
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
  'texas_secretary_of_state_registered_agent_registered_office_blank_retained_excerpt_transcription_no_search_no_retrieval_no_order_no_login_no_submission_no_real_or_fictional_data_no_sender_comparison_no_identity_authority_legitimacy_status_ownership_legal_fairness_value_fraud_or_transaction_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
