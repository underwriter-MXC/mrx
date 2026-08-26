#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '148';
process.env.MRX_ARTICLE_SLUG =
  'irs-form-8824-source-document-map-for-a-mineral-rights-exchange';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0647';
process.env.MRX_SELECTION_RANK = '220';
process.env.MRX_EXPECTED_SOURCE_COUNT = '2';
process.env.MRX_ARTICLE_TITLE =
  'IRS Form 8824 Source-Document Map for a Mineral Rights Exchange';
process.env.MRX_PRIMARY_KEYWORD = 'IRS Form 8824 source documents';
process.env.MRX_INLINE_KEYWORD = 'IRS Form 8824 source documents';
process.env.MRX_HERO_ALT =
  'A blank archival source station appears beside the exact IRS Form 8824 source-document map title.';
process.env.MRX_INLINE_ALT =
  'An overhead blank source matrix appears above the exact IRS Form 8824 source documents keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.irs.gov/pub/irs-pdf/f8824.pdf',
    [
      'The current official IRS-hosted Form 8824 PDF is the 2025 form. It displays taxpayer identity fields; Part I property-description, acquisition, transfer, written-identification, receipt-date, and related-party requests; Part II related-party identity, disposition, and exception requests; and Part III consideration, property, liability, basis, gain, and recapture calculation requests.',
      'It supports exact request-category names for a blank controlled-source map only. It does not establish that a mineral interest or exchange qualifies, select an answer, validate a date or amount, determine deadline compliance, calculate a field, authorize form completion, or support an owner-specific tax, legal, title, valuation, or transaction conclusion.',
    ],
  ],
  [
    'https://www.irs.gov/instructions/i8824',
    [
      'The current official IRS instructions page is labeled Instructions for Form 8824 (2025). It explains the form purpose, Parts I through III, current request context, and professional tax calculations and reporting associated with the form.',
      'It supports current source-preparation context and the professional-handoff boundary only. The article does not apply qualification rules, deadline rules, related-party rules, calculations, line instructions, attachment rules, filing routes, amendments, or any owner-specific legal or tax result.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding broad 1031 decision identity and owns one distinct deliverable: a blank current-Form-8824 request-category-to-controlled-source map for an already-structured exchange, plus mapped, incomplete, or professional-review-required outcomes.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The front-facing archival source station and strict-overhead blank provenance matrix are materially distinct and contain no personal data, tax-form facsimile, selected answer, amount, or conclusion.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official 2025 IRS form and instructions, exact form parts and request categories, controlled source locations, and professional handoff.',
  'The article invents no taxpayer, TIN, address, account, property identifier, date, amount, answer, eligibility result, deadline result, calculation, filing route, title, value, offer, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public map is blank, covers one already-structured exchange file and one controlled preparation event, keeps every owner-specific fact in controlled records, and stops at an authorized tax professional, attorney, or qualified intermediary before interpretation, selection, calculation, deadline, filing, amendment, structuring, or eligibility work.',
  'Image text is limited to the exact title and keyword and adds no taxpayer, form, exchange, tax, title, valuation, offer, or transaction claim.',
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
  'one_already_structured_exchange_current_irs_form_8824_request_category_to_controlled_source_location_map_only_mapped_incomplete_professional_review_required_no_personal_values_form_facsimile_eligibility_interpretation_selection_calculation_deadline_analysis_line_attachment_choice_form_completion_transaction_design_filing_amendment_qi_recommendation_or_owner_specific_legal_tax_title_value_conclusion_authorized_professional_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
