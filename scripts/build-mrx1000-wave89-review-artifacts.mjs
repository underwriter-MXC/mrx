#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '89';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-pooling-filing-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0286';
process.env.MRX_SELECTION_RANK = '169';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Pooling-Filing Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC pooling filing retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC pooling filing retrieval';
process.env.MRX_HERO_ALT =
  'A Texas public-record filing desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down filing-retrieval provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies named oil-and-gas query systems and publishes the limitation that online data is informational, continually updated, non-authoritative, and without legal force.',
      'The article records the exact official route and repeats the published limitation; it does not convert the route or a result into proof of property connection, ownership, filing effect, completeness, accuracy, compliance, or value.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official RRC page describes displayed search-identifier categories for public oil-and-gas queries, including API, district, lease or gas ID, county, field, operator, and permit fields.',
      'The article uses those categories only as paired locator labels and controlled values; it does not connect identifiers to a private property or interpret their relationship.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/oil-and-gas-forms/',
    [
      'The official current forms library lists P-12 as Certificate of Pooling Authority and supplies the official blank-form route.',
      'The article records only the displayed form label and route. It does not state that a particular filing exists or interpret a completed form.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/media/wzfgzr45/p-12p.pdf',
    [
      'The official blank P-12 displays locator fields including field, lease or ID, district, operator and P-5, well, pooled-unit, API, filing-purpose, county, acreage, and tract-table labels.',
      'The article names displayed field types only to help identify a document and expressly rejects any conclusion about property connection, tract inclusion, acreage, lease effect, pooling authority, entitlement, compliance, or value.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official imaged-records menu describes record classes, coverage periods, and online or historical access routes.',
      'The article preserves the displayed class and coverage description only as retrieval context; it does not infer existence, absence, completeness, filing quality, or legal effect.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/drillingPermitsQueryAction.do',
    [
      'The official W-1 query entry supplies a public permit-search route and displayed search fields.',
      'The article records the route and actual navigation steps only; it does not reproduce or interpret a particular permit, certificate, plat, tract table, attachment, or property relationship.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding pooling-and-valuation explainer with one administrative job: preserve the exact retrieval trail for a single Texas RRC pooling-filing search using official routes, named systems, navigation steps, displayed labels and identifiers, access timestamps, source limitations, controlled references, and bounded statuses.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The eye-level walnut filing desk and people-free strict-overhead pale-limestone eight-field provenance worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC source routes, system and form labels, displayed search-identifier categories, record classes, coverage descriptions, access paths, and published limitations. None of the sources is used to interpret a filing or establish ownership, title, tract inclusion, lease effect, pooling authority, entitlement, compliance, completeness, accuracy, development, production, value, or a transaction result.',
  'The article publishes no completed filing, private owner document, signature, address, legal description, account data, actual property identifier, correspondence, production result, acreage result, drilling forecast, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; converts gaps into neutral retrieval questions; controls private identifiers; and stops before filing interpretation, property, title, ownership, acreage, pooling, entitlement, compliance, privacy, operational, production, analytical, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'six_distinct_https_sources',
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
  'texas_rrc_pooling_filing_retrieval_no_interpretation_property_connection_ownership_acreage_lease_effect_pooling_authority_entitlement_compliance_completeness_accuracy_development_production_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_privacy_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
