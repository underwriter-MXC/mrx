#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '131';
process.env.MRX_ARTICLE_SLUG = 'search-unclaimed-mineral-royalty-payments-texas';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0336';
process.env.MRX_SELECTION_RANK = '208';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'How to Search for Unclaimed Mineral Royalty Payments in Texas';
process.env.MRX_PRIMARY_KEYWORD = 'Texas unclaimed mineral royalty payments search';
process.env.MRX_INLINE_KEYWORD = 'Texas unclaimed mineral royalty payments search';
process.env.MRX_HERO_ALT =
  'An archival search desk appears beside the exact unclaimed mineral royalty payments title.';
process.env.MRX_INLINE_ALT =
  'A top-down redacted search-log board appears above the exact Texas unclaimed royalty keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://comptroller.texas.gov/programs/unclaimed/',
    [
      'The official Texas Comptroller program page identifies mineral interests among unclaimed-property examples and directs individuals and businesses to ClaimItTexas.',
      'It supports the official-route and mineral-interest scope only; it does not prove a result, entitlement, ownership, title, heirship, amount, or payment cause.',
    ],
  ],
  [
    'https://www.claimittexas.gov/',
    [
      'The official ClaimItTexas portal is the state search and claim destination linked by the Texas Comptroller.',
      'It supports route identity and one bounded public search attempt only; authenticated claim requirements and individual outcomes remain outside the public worksheet.',
    ],
  ],
  [
    'https://www.claimittexas.gov/app/faq-ucp',
    [
      'The official ClaimItTexas FAQ is the current state instruction route for searching and claiming.',
      'It supports directing users to current official instructions rather than freezing a universal document list; it does not establish any claimant result.',
    ],
  ],
  [
    'https://comptroller.texas.gov/about/media-center/news/20250131-texas-comptroller-glenn-hegar-observes-national-unclaimed-property-day-feb-1-1738168792964',
    [
      'The Texas Comptroller announcement expressly lists mineral royalties among unclaimed-property examples and directs users to ClaimItTexas.',
      'It supports the mineral-royalty use case and state route only; it does not say every missing royalty is reported to the state.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.74.pdf',
    [
      'Texas Property Code Chapter 74 supplies report, delivery, and claims-process context for covered unclaimed property.',
      'It supports statutory context only; the article does not interpret the law or determine ownership, title, heirship, entitlement, claim validity, or legal effect.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding offer-comparison identity and owns one distinct administrative job: document one official Texas unclaimed-property search for a possible mineral royalty payment.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The oblique archival search desk and strict-overhead redacted search-log board are materially distinct.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official Texas sources, the state route, mineral-interest and mineral-royalty examples, one public search attempt, and current official claim instructions.',
  'The article publishes no real name, property identifier, claim number, amount, holder account, title conclusion, entitlement result, payment diagnosis, valuation, offer, legal, tax, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article separates a public state search lead from authenticated claim requirements, entitlement, ownership, title, heirship, operator suspense, payment interruption, valuation, offer review, and transaction advice.',
  'Image text is limited to the exact title and keyword and adds no real personal data, identifier, amount, official mark, result, ownership, entitlement, legal, tax, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
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
  'texas_unclaimed_mineral_royalty_one_official_search_route_variant_holder_property_reference_evidence_checkpoint_bounded_result_no_entitlement_title_heirship_suspense_payment_diagnosis_valuation_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
