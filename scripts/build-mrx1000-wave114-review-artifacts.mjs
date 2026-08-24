#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '114';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-lease-drop-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0298';
process.env.MRX_SELECTION_RANK = '191';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller Lease Drop Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas Comptroller Lease Drop retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas Comptroller Lease Drop retrieval';
process.env.MRX_HERO_ALT =
  'A Texas mineral owner records a public Lease Drop attempt beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead two-path Lease Drop worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://comptroller.texas.gov/taxes/crude-oil/oil-gas-faq.php',
    [
      'The official FAQ supplies the royalty-interest boundary, the no-login public CONG Lease Drop route, Crude Oil and Natural Gas path labels, RRC lease ID or drilling-permit reference categories, and separation from open-records assistance.',
      'The article records one retrieval attempt only and does not decide why royalties were not paid or what a displayed tax record means for a private owner.',
    ],
  ],
  [
    'https://mycpa.cpa.state.tx.us/cong/',
    [
      'The official CONG application supplies the time-bound JavaScript, cookie, public navigation, access, validation, result, and error state presented during an attempt.',
      'The article records a displayed state without bypassing it and excludes every secure or account-specific function.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/crude-oil/',
    [
      'The official crude-oil page supplies product-specific Texas tax-administration context only.',
      'The article does not publish a rate, calculate tax, determine liability, or interpret a royalty-statement line.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/natural-gas/',
    [
      'The official natural-gas page supplies product-specific Texas tax-administration context only.',
      'The article does not publish a rate, calculate tax, determine liability, or interpret a royalty-statement line.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces colliding offer, valuation, and unclaimed-property identities with one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual public Comptroller Lease Drop attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-eye-level person-at-desk two-product-route hero and people-free strict-overhead two-column evidence worksheet are materially distinct in angle, composition, subject arrangement, palette, and evidence function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official Comptroller surfaces, route identity, Crude Oil versus Natural Gas path separation, no-login public access, RRC reference categories, and displayed access or result state. None establishes production attribution, payer liability, property connection, title, ownership, payment entitlement, value, legal effect, offer quality, or a transaction conclusion.',
  'The article publishes no actual lease ID, drilling-permit number, production period, account data, tax record, payer or producer detail, result, screenshot, tax rate, royalty amount, owner decimal, property identifier, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps the public no-login Lease Drop path separate from secure CONG functions, registration, login, account data, open-records submission, RRC route worksheets, the broad production locator, tax advice, payment advice, and all valuation or transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no identifier, production figure, result, status, seal, logo, tax rate, payment, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'four_distinct_https_sources',
  'current_source_access_review_pass',
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
  'texas_comptroller_public_lease_drop_manual_retrieval_no_secure_account_automation_tax_payment_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
