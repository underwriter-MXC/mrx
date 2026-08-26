#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '129';
process.env.MRX_ARTICLE_SLUG =
  'mineral-rights-offer-version-control-and-deadline-register';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0334';
process.env.MRX_SELECTION_RANK = '206';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Mineral Rights Offer Version-Control and Deadline Register';
process.env.MRX_PRIMARY_KEYWORD = 'mineral rights offer version control';
process.env.MRX_INLINE_KEYWORD = 'mineral rights offer version control';
process.env.MRX_HERO_ALT =
  'A dark oblique offer-version archive station appears beside the exact version-control register title.';
process.env.MRX_INLINE_ALT =
  'A top-down offer-version register board appears above the exact version-control keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.archives.gov/records-mgmt/bulletins/2015/2015-04-appendix-b.html',
    [
      'The NARA appendix supports descriptive, consistent file naming and placing dates or version numbers in a consistent location.',
      'Its federal records-management guidance is used as an administrative naming principle only, not as a mineral-rights requirement or legal-retention rule.',
    ],
  ],
  [
    'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    [
      'NIST FIPS 180-4 specifies secure hash algorithms that generate message digests for messages or files.',
      'The article limits an optional SHA-256 digest to byte-change detection and does not claim identity, authorship, authenticity, completeness, legal validity, or fraud detection.',
    ],
  ],
  [
    'https://www.texasattorneygeneral.gov/consumer-protection/home-real-estate-and-travel/how-avoid-home-improvement-scams',
    [
      'The Texas Attorney General page supports the general consumer practice of reading written terms and keeping copies.',
      'It is expressly labeled general consumer guidance from a different transaction context, not mineral-rights law, contract interpretation, or a deadline rule.',
    ],
  ],
  [
    'https://www.texasattorneygeneral.gov/consumer-protection/phone-mail-and-fax-scams/how-spot-and-report-phone-scams',
    [
      'The Texas Attorney General page identifies pressure and limited-time tactics as general consumer warning signs.',
      'The article uses that point only to support preserving communications and asking bounded follow-up questions, not to label a mineral-rights offer or party fraudulent or illegitimate.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding common-mistakes identity and owns one distinct administrative job: preserve written offer versions, provenance, stated deadline text, state, and changed-field locations without evaluating the transaction.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The dark oblique archive station and cream strict-overhead three-version register board are materially distinct.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current primary sources, transparent administrative conventions, exact-as-received transcription, and a byte-change digest limitation.',
  'The article publishes no actual offer, owner, buyer, property, price, contract term, signature, account, private filename, private deadline, fairness conclusion, or transaction recommendation.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps version preservation separate from correspondence indexing, buyer comparison, fairness, lowball, red-flag, valuation, negotiation, agreement interpretation, deadline calculation, and transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no party, price, deadline, contract, ownership, legal, fraud, or decision claim.',
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
  'written_offer_version_received_timestamp_stated_deadline_text_source_filename_optional_sha256_change_detection_state_changed_field_and_controlled_reference_no_offer_ranking_fairness_value_contract_interpretation_acceptance_negotiation_ownership_deadline_calculation_authentication_legal_effect_or_fraud_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
