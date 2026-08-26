#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '138';
process.env.MRX_ARTICLE_SLUG = 'texas-tdi-title-agent-report-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0343';
process.env.MRX_SELECTION_RANK = '215';
process.env.MRX_EXPECTED_SOURCE_COUNT = '2';
process.env.MRX_ARTICLE_TITLE = 'Texas TDI Title Agent Report Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas TDI title agent report retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas TDI title agent report retrieval';
process.env.MRX_HERO_ALT =
  'An oblique public-report retrieval station appears beside the exact Texas TDI worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank report-attempt worksheet appears above the exact Texas TDI title-agent keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://tdi.texas.gov/title/',
    [
      'The current Texas Department of Insurance Title Insurance page links to Title Agent and Escrow Officer reports, says the reports list licensed title agents and escrow officers, and instructs users to select a report under that source-displayed group.',
      'It supports only accurate route, report-group, and source-display recording for one manual attempt. It does not connect a report row to retained correspondence, interpret licensure or appointment, validate a party, evaluate an offer, or produce a legal or transaction conclusion.',
    ],
  ],
  [
    'https://www.tdi.texas.gov/title/overctitleagnt.html',
    [
      'The current TDI oversight page states that lists of active title agents and escrow officers are available on the TDI reports site and separately describes licensing and county-appointment conditions.',
      'It supports preserving source-stated regulatory context and the official report location only. It does not establish that a displayed party is involved in a mineral transaction or authorize an interpretation of license status, appointment, conduct, authority, legitimacy, safety, or suitability.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects both colliding comparison identities and owns one distinct deliverable: a blank provenance record for one authorized manual TDI Title Agent and Escrow Officer report route and one named-report attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique public-report station and strict-overhead blank report-attempt worksheet are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the two current official TDI pages, their source-displayed report route, report group, licensing context, and attempt-level fields.',
  'The article invents no party, license, appointment, address, county, correspondence, offer, property, report row, result, status, identity match, legitimacy statement, license interpretation, legal effect, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, covers one manual route and one named report attempt, keeps correspondence as a separate controlled reference, places non-verification warnings beside the report and outcome fields, and stops at authorized-human review.',
  'Image text is limited to the exact title and keyword and adds no identity, licensure, appointment, legitimacy, authority, offer-quality, value, legal, complaint, or transaction claim.',
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
  'one_authorized_manual_tdi_title_agent_and_escrow_officer_report_route_and_attempt_source_displayed_fields_only_separate_controlled_correspondence_reference_controlled_outcomes_no_sender_or_property_comparison_no_license_interpretation_legitimacy_offer_quality_legal_valuation_or_transaction_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
