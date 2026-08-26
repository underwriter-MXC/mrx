#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '150';
process.env.MRX_ARTICLE_SLUG = 'cash-for-mineral-rights-irs-tax-transcripts-cpa-handoff';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0651';
process.env.MRX_SELECTION_RANK = '222';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE =
  'Cash for Mineral Rights: How to Retrieve IRS Tax Transcripts for a CPA Handoff';
process.env.MRX_PRIMARY_KEYWORD = 'cash for mineral rights tax transcripts';
process.env.MRX_INLINE_KEYWORD = 'cash for mineral rights tax transcripts';
process.env.MRX_HERO_ALT =
  'A dark secure record-retrieval handoff station appears beside the exact IRS tax-transcript article title.';
process.env.MRX_INLINE_ALT =
  'An overhead blank transcript source-scope matrix appears above the exact cash-for-mineral-rights tax-transcripts keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.irs.gov/individuals/get-transcript',
    [
      'The current IRS Get your tax records and transcripts page supplies official online-account, mail, and automated-phone retrieval routes, the five-to-ten-calendar-day mail estimate, address-of-record boundary, masking notice, and link to Form 4506-T.',
      'It supports retrieval-channel and handoff documentation only. It does not select a transcript, prove mineral ownership or basis, establish completeness, characterize income, calculate tax, validate an offer, or recommend a transaction.',
    ],
  ],
  [
    'https://www.irs.gov/individuals/transcript-types-for-individuals-and-ways-to-order-them',
    [
      'The current IRS transcript-types page defines the limited contents and stated availability of return, account, record-of-account, wage-and-income, and verification-of-non-filing records and identifies the routes through which they may be requested.',
      'It supports a source-scope matrix and neutral availability notes only. The article does not decide which transcript an owner needs, interpret an entry, treat missing data as negative proof, or convert a tax record into title, basis, offer, or transaction evidence.',
    ],
  ],
  [
    'https://www.irs.gov/individuals/about-tax-transcripts',
    [
      'The current IRS About tax transcripts page supplies the masking, fully visible financial-entry, customer-file-number, no-IRS-fax, and no-third-party-mailing boundaries.',
      'It supports privacy cautions, unaltered-copy handling, and secure professional handoff only. It does not establish that a transmission method is universally secure or authorize public exposure of taxpayer information.',
    ],
  ],
  [
    'https://www.irs.gov/forms-pubs/about-form-4506-t',
    [
      'The current IRS About Form 4506-T page identifies the form as the official paper request route for listed transcript types and links to the current revision.',
      'It supports a current-source pointer only. The article does not complete the form, choose a request, supply an address, authorize a signer, or provide owner-specific filing instructions.',
    ],
  ],
  [
    'https://www.irs.gov/pub/irs-pdf/f4506t.pdf',
    [
      'The official Form 4506-T PDF is revision April 2025 and supplies IRS-stated transcript descriptions, availability notes, processing statements, signature timing, and the instruction to consult the official landing page for developments.',
      'It supports a revision-control and professional-review boundary only. The article does not reproduce the form, fill a field, select a transcript or year, decide authority to sign, state a mailing destination, or promise processing time.',
    ],
  ],
  [
    'https://www.irs.gov/taxtopics/tc156',
    [
      'IRS Topic 156 distinguishes a transcript from a complete return copy, identifies Form 4506-T as a mail route for transcript types, and identifies Form 4506 as the separate route for a complete return copy.',
      'It supports the transcript-versus-copy boundary only. The article does not recommend ordering a paid copy, state a current copy fee, or decide which record an owner or CPA requires.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects two saturated 1031 identities and the broad factory tax-question identity, then owns one distinct deliverable: a source-linked IRS transcript retrieval, scope, unaltered-copy, limitation, and CPA-handoff record before a cash-offer decision.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The dark low-oblique secure handoff station and bright strict-overhead transcript source-scope matrix are materially distinct and contain no taxpayer data, IRS mark, simulated form, date, amount, tax result, offer conclusion, or recommendation.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current IRS retrieval routes, transcript-type descriptions, availability limits, privacy safeguards, April 2025 Form 4506-T revision, and the transcript-versus-return-copy distinction.',
  'The article invents no taxpayer, tax year, return, transcript entry, mineral interest, property, payer, offer, basis, income character, calculation, form selection, filing, retention period, or professional conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public record contains controlled pointers only, keeps taxpayer information and transcript copies inside an authorized system, and stops at the CPA or attorney before transcript selection, interpretation, completeness, basis, gain, character, filing, retention, title, offer, valuation, or transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no IRS affiliation, taxpayer fact, tax conclusion, title evidence, valuation result, offer result, recommendation, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'six_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'official_irs_source_priority_pass',
  'form_4506_t_april_2025_revision_verified',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'irs_tax_transcript_retrieval_source_scope_unaltered_copy_limitation_and_cpa_handoff_only_no_transcript_selection_interpretation_completeness_title_basis_gain_character_tax_calculation_offer_validation_valuation_transaction_recommendation_form_completion_filing_retention_or_owner_specific_advice_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_taxpayer_data_irs_affiliation_or_unsupported_visual_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
