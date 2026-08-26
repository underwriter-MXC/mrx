#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '149';
process.env.MRX_ARTICLE_SLUG =
  '1031-exchange-evidence-provenance-log-mineral-interest-owners';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0648';
process.env.MRX_SELECTION_RANK = '221';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  '1031 Exchange Evidence Provenance Log for Mineral Interest Owners';
process.env.MRX_PRIMARY_KEYWORD = '1031 exchange recordkeeping for mineral interests';
process.env.MRX_INLINE_KEYWORD = '1031 exchange recordkeeping for mineral interests';
process.env.MRX_HERO_ALT =
  'A dark evidence-provenance relay appears beside the exact 1031 exchange provenance-log title.';
process.env.MRX_INLINE_ALT =
  'An overhead blank custody matrix appears above the exact 1031 exchange recordkeeping keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section1031&num=0&edition=prelim',
    [
      'The Office of the Law Revision Counsel current/preliminary Section 1031 text supplies the federal statutory context for exchanges of real property held for productive use or investment.',
      'It supports a strict professional-review boundary only. It does not establish that a mineral-related interest is real property or like kind, determine holding purpose, apply a period, validate a transfer, or resolve an owner-specific transaction, tax, legal, title, valuation, or filing result.',
    ],
  ],
  [
    'https://www.govinfo.gov/content/pkg/CFR-2025-title26-vol13/pdf/CFR-2025-title26-vol13-sec1-1031k-1.pdf',
    [
      'The official 2025 annual-edition text of 26 C.F.R. section 1.1031(k)-1 supplies bounded deferred-exchange context, including written agreements, assignment notices, qualified-intermediary arrangements, restrictions, and property-transfer mechanics.',
      'It supports source-class and provenance labels only. It does not validate an agreement, notice, intermediary, restriction, transfer, safe harbor, eligibility result, deadline, form position, tax treatment, or owner-specific transaction.',
    ],
  ],
  [
    'https://www.irs.gov/publications/p544',
    [
      'The current IRS Publication 544 page is labeled for the 2025 publication and supplies general federal sales, exchanges, basis, gain-or-loss, and reporting context.',
      'It supports the need for controlled professional review of source records only. The article does not apply its tax rules, calculate gain or basis, classify property, select a form, or advise an owner-specific position.',
    ],
  ],
  [
    'https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records',
    [
      'The current IRS record-retention page states that retention depends on the action, expense, or event recorded and specifically discusses records on old and new property after a nontaxable exchange.',
      'It supports a retention-policy pointer and professional handoff only. The article does not calculate a limitations period, set a destruction date, determine whether an exchange is nontaxable, or override contract, title, lender, insurance, litigation-hold, privacy, or state-law requirements.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding comparison identity and owns one distinct deliverable: a blank provenance log for source origin, custody, retrieval, controlled storage, limitations, and professional handoff for records that already exist in one controlled exchange file.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The dark low-oblique provenance relay and pale strict-overhead custody matrix are materially distinct and contain no personal data, simulated form, date, amount, deadline, tax result, or conclusion.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official statutory, regulatory, IRS publication, and IRS retention context, plus administrative source provenance and controlled professional handoff.',
  'The article invents no taxpayer, property, transaction, agreement, notice, intermediary, transfer, date, amount, source copy, requirement, retention period, eligibility result, deadline result, calculation, filing position, or legal effect.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public log is blank, covers one controlled exchange file and one bounded record-organizing event, keeps all owner-specific facts and source copies in an authorized system, and stops at the qualified intermediary, CPA, and attorney before requirements, interpretation, characterization, retention, eligibility, deadlines, calculations, forms, filings, transaction design, or advice.',
  'Image text is limited to the exact title and keyword and adds no exchange, tax, title, valuation, offer, deadline, eligibility, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'four_distinct_https_sources',
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
  'one_controlled_exchange_file_existing_record_source_origin_custody_retrieval_controlled_location_limitation_and_professional_handoff_log_only_retrievable_gap_open_or_professional_review_required_no_personal_values_source_copies_requirements_comparison_benefits_eligibility_property_classification_holding_purpose_like_kind_intermediary_validation_assignment_notice_transfer_safe_harbor_deadline_calculation_form_filing_retention_period_transaction_design_cure_or_owner_specific_legal_tax_title_value_conclusion_authorized_professional_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
