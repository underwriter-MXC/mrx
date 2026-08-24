#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '102';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-field-search-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0285';
process.env.MRX_SELECTION_RANK = '182';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Field Search Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Field Search retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Field Search retrieval';
process.env.MRX_HERO_ALT =
  'A blank Field Search terminal and neutral retained-reference desk appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead three-mode Field Search criteria worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC Research Queries directory supplies the Field Rules Query index label, launch relationship, update context, and global online-query disclaimer.',
      'The article uses the directory only to preserve the official index route, exact link label, source identity, and limitation; it does not treat a result as authoritative, legally effective, complete, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/DP/initializeFieldSearchAction.do',
    [
      'The launched official application supplies the distinct Field Search page label, three displayed search modes, and minimum three-character instruction.',
      'The article records only the source-displayed modes, criterion actually used, visible instruction, navigation, displayed state, and bounded retrieval status. It does not submit or reproduce an actual property-specific result or interpret field rules.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/well-records-faqs/',
    [
      'The official Well Records FAQs describe separate well-record contents and search troubleshooting.',
      'The article uses the FAQ only to distinguish the separate well-record channel and preserve uncertainty; it does not infer that a field reference identifies a well, lease, property, owner, or private interest.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/',
    [
      'The official download page separately lists Oil & Gas Field Name & Numbers, Oil & Gas Field Rules, annual report field tables, and statewide field data with source-displayed formats and update labels.',
      'The article uses the page only to separate bulk-data provenance from the public Field Search and does not treat a download as equivalent to a query result or as interpreted evidence.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/media/ilapc3ix/website-queries-how-to-stay-in-compliance-powerpoint-slides.pdf',
    [
      'The official RRC training slide deck supplies agency-authored website-query navigation context.',
      'The article retains the deck only as bounded navigation context and does not use it to establish a current requirement, field-rule interpretation, compliance conclusion, property connection, or transaction decision.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Field Search attempt through its two source-context labels, route, selected mode, exact criterion, minimum-character instruction, displayed state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique dark terminal desk and people-free strict-overhead pale three-mode worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, the exact Field Rules Query and Field Search source labels, source-displayed search modes and minimum-character instruction, separate well-record and downloadable-data channels, and published limitations. None is used to establish a field identity or boundary, rule meaning, well or property connection, ownership, title, acreage, lease effect, production, reserves, compliance, legal effect, value, offer quality, or a transaction result.',
  'The article publishes no actual field name, field number, query value, result screen, property identifier, well record, field rule, map, production claim, compliance conclusion, title claim, acreage, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves both official labels in their separate source contexts and source uncertainty; uses only located, not located, or unverified; separates Field Search, field-rule downloads, well records, production, maps, and interpretation; controls private identifiers; and stops before legal, title, regulatory, engineering, geological, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, result, signature, seal, logo, owner, acreage, production or compliance conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
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
  'texas_rrc_field_search_retrieval_no_field_rule_boundary_property_well_title_ownership_acreage_lease_production_reserves_compliance_legal_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
