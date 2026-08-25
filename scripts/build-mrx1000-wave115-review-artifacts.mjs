#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '115';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-production-by-lease-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0299';
process.env.MRX_SELECTION_RANK = '192';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Production by Lease Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Production by Lease retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Production by Lease retrieval';
process.env.MRX_HERO_ALT =
  'A researcher records a Production by Lease attempt beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'An overhead one-attempt provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official research-query directory identifies Production Reports Query (Form PR) and supplies the current official entry route.',
      'The directory does not establish production attribution, private-property connection, title, ownership, payment, value, legal effect, or a transaction conclusion.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/PR/publicQueriesMainAction.do',
    [
      'The current official application supplies the distinct Production by Lease, Production by Filing Operator, and Production by Operator of Record paths and the visible Production by Lease criteria labels.',
      'The article records one manual Production by Lease attempt and does not interpret any displayed result or join it to an adjacent route.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The official production-data page supplies agency data-resource context only.',
      'The article does not use it to establish lease, well, operator, property, owner, title, payment, acreage, reserve, forecast, value, or legal conclusions.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official query-information page supplies current-system scope and historical-data limitations only.',
      'The article keeps other query systems in separately named retrieval records and makes no completeness claim.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding generic assessment and valuation identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Production by Lease attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The straight-on one-researcher workstation hero and strict-overhead single-hand worksheet are materially distinct in angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC surfaces, route identity, the three separate application choices, visible Production by Lease criteria labels, displayed source state, and source-scope limitations. None establishes production interpretation, lease-to-property connection, title, ownership, payment entitlement, acreage, decimals, taxes, reserves, forecasts, value, offer quality, legal effect, compliance, or a transaction conclusion.',
  'The article publishes no actual lease type, district, RRC identifier, month range, result row, party name, production figure, screenshot, property identifier, owner record, payment, decimal, tax, reserve, forecast, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps Production by Lease separate from Filing Operator, Operator of Record, Production Data Query, New Lease IDs, proration, Wellbore, broad production-record locator, automation, bulk retrieval, and every interpretation or decision task.',
  'Image text is limited to the exact title and keyword and adds no identifier, production figure, status, result, seal, logo, property, ownership, payment, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_production_by_lease_one_manual_attempt_no_adjacent_route_automation_bulk_interpretation_property_title_ownership_payment_acreage_tax_reserve_forecast_value_legal_compliance_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
