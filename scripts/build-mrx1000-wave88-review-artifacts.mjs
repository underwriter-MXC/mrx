#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '88';
process.env.MRX_ARTICLE_SLUG =
  'how-to-build-a-texas-mineral-production-record-locator-sheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0272';
process.env.MRX_SELECTION_RANK = '168';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'How to Build a Texas Mineral Production Record Locator Sheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas mineral production record locator sheet';
process.env.MRX_INLINE_KEYWORD = 'Texas mineral production record locator sheet';
process.env.MRX_HERO_ALT =
  'A Texas public-record research desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down production-record locator worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies named production, well-record, and related query systems and publishes update-frequency labels.',
      'The article records the exact official route and system name and repeats the RRC boundary that online datasets are informational, continually updated, non-authoritative, and without legal force.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The official RRC production page describes compilations and summaries of production information reported by Texas operators and links the PDQ and Production Reports Query routes.',
      'The article uses the page only to identify a source class and route; it does not analyze production or draw an ownership, payment, property-connection, forecast, or value conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
    [
      'The official PDQ FAQs state the reporting levels for oil and gas, reporting lag, revision and correction behavior, snapshot character, coverage period, query navigation, and monthly update cadence.',
      'The article converts those source-stated limits only into locator fields and status labels; it does not classify a result as complete, current, accurate, applicable, connected to private property, or suitable for review.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official well-records page identifies useful request fields, record classes, coverage periods, online and historical channels, and the Commission private-rights authority boundary.',
      'The article records a locator without interpreting a filing or establishing lease effect, royalty rights, payment entitlement, property connection, operator responsibility, or regulatory compliance.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/',
    [
      'The official download page identifies free dataset names, file formats, and stated update schedules, including a Production Data Query Dump.',
      'The article records only the official dataset label, format, stated update cadence, access date, and result-reference location. It does not download, convert, analyze, select, or recommend a dataset.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding production-history valuation explainer with one administrative job: preserve the exact retrieval trail for a Texas public production-record search using named RRC routes, query systems, record classes, identifiers, periods, access dates, source notes, result locators, and bounded statuses.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The eye-level dark-wood records desk and people-free strict-overhead pale-stone seven-field locator worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC source routes, system and dataset names, reporting-level and coverage context, update notes, locator fields, and published limitations. None of the sources is used to interpret a record or establish ownership, title, entitlement, performance, completeness, accuracy, suitability, value, or a transaction result.',
  'The article publishes no private owner document, signature, address, account data, payment instruction, private amount, legal description, actual property identifier, production result, trend, forecast, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; converts gaps into neutral retrieval questions; protects private identifiers; and stops before property, title, ownership, payment, operational, regulatory, analytical, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real record, identifier, result, signature, seal, logo, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_production_record_locator_no_interpretation_connection_performance_completeness_accuracy_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_privacy_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
