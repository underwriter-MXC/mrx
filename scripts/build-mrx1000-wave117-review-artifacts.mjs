#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '117';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-production-by-operator-of-record-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0301';
process.env.MRX_SELECTION_RANK = '194';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Production by Operator of Record Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Production by Operator of Record retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Production by Operator of Record retrieval';
process.env.MRX_HERO_ALT =
  'A one-hand operator-of-record retrieval desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead provenance-card system appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official research-query directory identifies Production Reports Query (Form PR), labels it nightly, prohibits automated volume retrieval, and supplies the current official entry route.',
      'The directory states that online query data are informational, continually updated, non-authoritative, and without legal force; it does not establish production attribution, property connection, operator status, title, ownership, payment, value, legal effect, or a transaction conclusion.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/PR/publicQueriesMainAction.do',
    [
      'The current official application supplies the distinct Production by Lease, Production by Filing Operator, and Production by Operator of Record (as shown on RRC Form P-4) paths and the visible Operator of Record labels Lease Type, Operator No, District, and Prod Month.',
      'The application says this route returns results only for reports filed after February 11, 2005, notes processing delay, and points to PDQ for production data from January 1993 through the last completed production month.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The official production-data page describes production information as reported to the Commission by Texas operators and lists both PDQ and PR as separate production queries.',
      'The article uses that page for source context only and makes no lease, well, operator, property, owner, title, payment, reserve, forecast, value, or legal conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official query-information page states that each query is one slice of the larger Oil and Gas System and supplies Form P-4 context through adjacent query descriptions.',
      'The article keeps every adjacent system in a separately named retrieval record and makes no completeness claim.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding generic predatory-offer and fair-valuation identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Production by Operator of Record attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique single-hand retrieval-desk hero and people-free strict-overhead circular provenance-card scene are materially distinct in angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC surfaces, route identity, the three separate application paths, the visible Lease Type, Operator No, District, and Prod Month labels, the post-February-11-2005 route note, the PDQ pointer, displayed source state, and source-scope limitations. None establishes production interpretation, property connection, current operator identity or status, title, ownership, payment entitlement, acreage, decimals, taxes, reserves, forecasts, value, offer quality, legal effect, compliance, or a transaction conclusion.',
  'The article publishes no actual lease type, operator number, district, production month, result row, party name, production figure, screenshot, property identifier, owner record, payment, decimal, tax, reserve, forecast, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps Production by Operator of Record separate from Production by Lease, Production by Filing Operator, Production Data Query, P-4 Gatherer/Purchaser, Organization P-5, proration, Wellbore, broad production-record locator, automation, bulk retrieval, and every interpretation or decision task.',
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
  'texas_rrc_production_by_operator_of_record_one_manual_attempt_no_adjacent_route_automation_bulk_interpretation_property_title_current_operator_ownership_payment_acreage_tax_reserve_forecast_value_legal_compliance_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
