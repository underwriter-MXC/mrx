#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '152';
process.env.MRX_ARTICLE_SLUG =
  'brazos-cad-mineral-account-search-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0746';
process.env.MRX_SELECTION_RANK = '224';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Brazos CAD Mineral Account Search Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Brazos CAD mineral account search';
process.env.MRX_INLINE_KEYWORD = 'Brazos CAD mineral account search';
process.env.MRX_HERO_ALT =
  'A source-scoped property-search desk appears beside the exact Brazos CAD worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank five-step attempt log appears above the exact Brazos CAD mineral account search keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://esearch.brazoscad.org/',
    [
      'The current official Brazos CAD Property Search supplies owner-name, abstract, property-ID, property-type, owner-ID, geographic-ID, tax-year, and other source-displayed search modes; its current property-type list includes Mineral.',
      'Its current disclaimer labels displayed 2026 values preliminary and the information research-only, and warns that legal descriptions and acreage should be verified before legal use. The article preserves these limits and does not infer identity, ownership, title, acreage, appraisal correctness, tax, value, or legal effect.',
    ],
  ],
  [
    'https://esearch.brazoscad.org/Search/Help',
    [
      'The current official Brazos CAD help page says online records are not official and can change, describes current name, address, advanced-search, narrowing, Property ID, and result-saving behavior, and states that mineral properties are not shown on its map because of missing map data.',
      'It supports interface and negative-result limitations only. The article does not use the map as negative proof, download or email a result, contact the district, submit a request, challenge an appraisal, or retrieve a valuation.',
    ],
  ],
  [
    'https://www.brazoscountytx.gov/140/Property-Taxes',
    [
      'The current Brazos County page states that the tax assessor-collector provides consolidated assessment and collection services and routes specific property-tax account information to the Brazos County Tax Office.',
      'It supports the distinction between an appraisal-district search and county tax-account service only. The article does not retrieve a tax bill, state a tax amount, interpret liability, or contact the tax office.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/',
    [
      'The Texas Comptroller county directory supplies the official statewide route to local appraisal districts and tax assessor-collectors and states the local-information boundary.',
      'It supports jurisdiction and routing context only. This article does not repeat the statewide directory worksheet or claim that a local result is complete, current, accurate, or legally sufficient.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/Docs/TX/htm/TX.25.htm',
    [
      'Texas Tax Code Chapter 25 supplies statutory context for appraisal records and appraisal-roll contents.',
      'It does not make the website result a title record, prove current ownership or acreage, validate a legal description, certify an appraisal, establish tax liability or mineral value, connect a property to a well or payment, or support an offer or transaction conclusion.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the broad county-value and family-decision factory identity and owns one distinct deliverable: a blank provenance record for one no-login attempt in one official Brazos CAD destination search.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The low-three-quarter laptop-and-folder hero and bright strict-overhead five-card attempt log are materially distinct and contain no person, county outline, identifier, tax amount, appraisal value, deed, well, offer, result, or conclusion.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official Brazos CAD interface, disclaimer, and help page; the official Brazos County tax-office page; the Comptroller local-office directory; and Texas Tax Code Chapter 25.',
  'The article invents no owner, account, property, identifier, abstract, legal description, tax year, value, amount, interest, acreage, appraisal, tax, operator, lease, well, payment, offer, or professional conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public record contains blank administrative fields only, keeps completed evidence inside an authorized system, and stops before contact, submission, purchase, access bypass, interpretation, appraisal review, tax review, valuation, or transaction work.',
  'Image text is limited to the exact title and keyword and adds no agency affiliation, seal, county outline, identifier, tax or appraisal fact, title evidence, value result, offer result, recommendation, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'official_brazos_cad_brazos_county_comptroller_and_texas_statute_source_priority_pass',
  'property_type_mineral_option_and_current_source_disclaimer_verified',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'one_no_login_brazos_cad_destination_search_attempt_one_source_displayed_mode_one_known_criterion_exact_displayed_state_controlled_reference_limitations_and_located_not_located_unverified_only_no_identity_ownership_title_acreage_appraisal_tax_value_legal_description_property_well_production_offer_buyer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_county_outline_identifier_tax_amount_appraisal_value_deed_well_offer_result_or_unsupported_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
