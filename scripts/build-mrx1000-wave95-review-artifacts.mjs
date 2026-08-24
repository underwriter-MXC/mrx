#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '95';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-inactive-well-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0278';
process.env.MRX_SELECTION_RANK = '175';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Inactive Well Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Inactive Well query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Inactive Well query retrieval';
process.env.MRX_HERO_ALT =
  'A Texas inactive-well query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead inactive-well query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies the Inactive Well Query as a named route and states online-query use and information limitations.',
      'The article records the named route, access time, and published limitation without treating a query result as complete, legally controlling, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official Oil & Gas Data Queries page supplies bounded context for the RRC query system.',
      'The article uses that context only to identify the public query environment and preserves uncertainty about individual results, records, and relationships.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/inactiveWellAllQueryAction.do',
    [
      'The official Inactive Well Query entry displays the separately named route and current criteria labels for one query attempt.',
      'The article records only criteria actually used, source-displayed instructions, navigation steps that occurred, and bounded retrieval state. It does not submit an actual property query or reproduce an actual result.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/InactiveWellQuery_HowTo.htm',
    [
      'The official help page supplies bounded operator, criterion, lease-search, field-search, and navigation instructions.',
      'The article preserves the separate retrieval steps and does not interpret a selected operator, lease, field, well, or result.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/InactiveWellQuery_results_howto.htm',
    [
      'The official results help page supplies bounded result-screen navigation context.',
      'The article uses that context only to keep result headers, links, and later routes distinct; it does not interpret a result, well status, property connection, title, lease, compliance, production, value, or transaction effect.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation-method explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Inactive Well Query attempt through its entry route, criteria snapshot, visible limitations, navigation steps, result-header state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique warm public-record counter and people-free strict-overhead cool-slate technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed Inactive Well Query criteria and instructions, separate route identity, limited result-screen navigation context, and published limitations. None of the sources is used to establish property connection, title, ownership, acreage, lease effect, payment responsibility, entitlement, compliance, environmental condition, operating status, production, value, or a transaction result.',
  'The article publishes no actual query values, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, well-status conclusion, production result, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, result headers, links, and routes; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, environmental, engineering, geological, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_inactive_well_query_retrieval_no_property_connection_title_ownership_acreage_lease_payment_entitlement_compliance_environmental_operating_status_production_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
