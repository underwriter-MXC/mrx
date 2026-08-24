#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '112';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-production-data-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0297';
process.env.MRX_SELECTION_RANK = '190';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Production Data Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Production Data Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Production Data Query retrieval';
process.env.MRX_HERO_ALT =
  'One mineral owner reviews a blank two-path production-query board beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead two-path production-query worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory supplies the limited-area Production Data Query label, monthly update label, separate Production Reports Query route, restrictions on automated volume retrieval, and online-query limitations.',
      'The article preserves route provenance, manual-use constraints, and limitations only and does not interpret production or connect a result to private property.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaPdqMain.do',
    [
      'The official limited-area PDQ application supplies the Production Data Query, General Production Query, and Specific Lease Query labels, source-displayed coverage and update state, and Query Path or Return navigation warning.',
      'The article records one selected path and displayed state without merging paths or interpreting any criterion or result.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
    [
      'The official FAQ supplies operator-report basis, oil-lease and gas-well reporting context, reporting lag, revisions, historical coverage, Query Path guidance, and monthly-update context.',
      'The article uses those statements only as source limitations and does not establish completeness, attribution, reserves, title, ownership, payment, or value.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The official production-data page lists PDQ and Production Reports Query as separate production-query routes and describes the broader page as compilations and summaries reported by Texas operators.',
      'The article uses the page only to preserve route separation and does not merge or compare outputs.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding evaluation-benefits explainer with one administrative reader job: preserve a reproducible provenance trail for one authorized manual limited-area PDQ attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-eye-level person-at-desk route-board hero and people-free strict-overhead two-path worksheet are materially distinct in angle, composition, palette, subject arrangement, and evidence function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC sources, route identity, General versus Specific path separation, source-displayed coverage and update state, navigation guidance, operator-report context, lag, revision risk, and retrieval mechanics. None establishes production attribution, property connection, title, ownership, acreage, payment, reserves, value, legal effect, offer quality, or a transaction conclusion.',
  'The article publishes no actual lease, well, operator, field, county, district, period, production figure, controlled value, result, screenshot, record, property identifier, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps limited-area PDQ separate from Production Reports Query Form PR, any separately routed statewide PDQ surface, Wellbore, New Lease IDs, proration, the broad production-record locator, and all other routes; preserves uncertainty; prohibits automation or bulk retrieval; and stops before production, property, title, ownership, valuation, legal, offer, or transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no identifier, volume, result, status, seal, logo, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_pdq_manual_retrieval_no_automation_bulk_production_attribution_property_title_ownership_reserves_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
