#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '147';
process.env.MRX_ARTICLE_SLUG =
  'irs-form-1099-misc-royalty-box-2-source-scope-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0586';
process.env.MRX_SELECTION_RANK = '219';
process.env.MRX_EXPECTED_SOURCE_COUNT = '2';
process.env.MRX_ARTICLE_TITLE =
  'IRS Form 1099-MISC Royalty Box 2 Source-Scope Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'IRS Form 1099-MISC royalty Box 2';
process.env.MRX_INLINE_KEYWORD = 'IRS Form 1099-MISC royalty Box 2';
process.env.MRX_HERO_ALT =
  'A secure blank provenance case appears beside the exact IRS Form 1099-MISC royalty worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank source-scope matrix appears above the exact IRS Form 1099-MISC Box 2 keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.irs.gov/pub/irs-pdf/f1099msc.pdf',
    [
      'The current official IRS-hosted Form 1099-MISC PDF is Rev. December 2026 and displays the form title, calendar-year and copy labels, payer and recipient blocks, TIN fields, FATCA checkbox, account-number field, Box 2 Royalties, Box 4 Federal income tax withheld, and Boxes 16 through 18 state information. Copy presentation differs, including the display of VOID on Copy A and Copy 1 but not in the same way on recipient copies.',
      'It supports exact source-displayed label capture and copy-specific caution only. It does not authenticate a retained form, identify a payer or recipient, prove an amount, reconcile a payment, determine tax treatment, authorize public values, or support a title, valuation, offer, or transaction conclusion.',
    ],
  ],
  [
    'https://www.irs.gov/instructions/i1099mec',
    [
      'The current official IRS instructions page identifies the December 2026 continuous-use revision, explains that it applies first to calendar year 2026 and later years until superseded, and provides specific context for the calendar-year, account-number, FATCA, Box 2 royalty, Box 4, and state-information fields.',
      'It supports revision-use context and exact field-scope boundaries only. The article does not apply filing rules, calculate or characterize income, decide withholding, basis, depletion, deduction, state treatment, correction, amendment, or any owner-specific legal or tax result.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding broad sale-guide identity and owns one distinct deliverable: a blank source-scope record for one already-retained Form 1099-MISC, exact source-displayed bounded fields, controlled pointers, limitations, and captured, incomplete, or unverified outcomes.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The front-facing secure provenance case and strict-overhead blank source-scope matrix are materially distinct and contain no taxpayer data or tax-form facsimile.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official IRS form and instructions, exact revision and field labels, copy-specific presentation, and source-record outcomes.',
  'The article invents no form, year, payer, recipient, TIN, address, account, amount, checkbox state, authenticity result, payment reconciliation, tax treatment, filing status, title, value, offer, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, covers one already-retained source and one controlled capture event, keeps every identity and value controlled, and stops at authorized-human review before retrieval, payer contact, identity matching, reconciliation, return work, tax interpretation, title, valuation, offer, or transaction activity.',
  'Image text is limited to the exact title and keyword and adds no taxpayer, payment, form, correction, tax, title, valuation, offer, or transaction claim.',
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
  'one_already_retained_irs_form_1099_misc_exact_source_displayed_revision_calendar_year_copy_correction_identity_block_fatca_account_box_2_box_4_and_boxes_16_18_controlled_pointers_only_captured_incomplete_unverified_no_public_values_or_form_facsimile_retrieval_payer_contact_identity_match_authentication_reconciliation_tax_calculation_filing_amendment_depletion_withholding_title_value_offer_transaction_or_legal_tax_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
