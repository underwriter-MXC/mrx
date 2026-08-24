#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '94';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-h-10-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0277';
process.env.MRX_SELECTION_RANK = '174';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC H-10 Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC H-10 query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC H-10 query retrieval';
process.env.MRX_HERO_ALT =
  'A Texas H-10 query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead H-10 query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies the H-10 Annual Disposal/Injection Well Monitoring Report Query as a named route and states an online-query use limitation.',
      'The article records the named route, access time, and published limitation without treating a query result as complete, legally controlling, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-h-10-query/',
    [
      'The official H-10 information page supplies bounded online-filing and historical-context statements.',
      'The article preserves source-stated time and route context without deciding whether a report exists, was required, is complete, or has a property or regulatory effect.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/H10/h10PublicMain.do',
    [
      'The official H10 Public Main menu presents separate Search for H10, injection-volume, fluid-type, filing-cycle, UIC, and violation public-query routes.',
      'The article preserves route identity so information from separate systems is not merged or mislabeled.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/H10/searchH10.do?fromMain=yes',
    [
      'The official Search for H10 entry displays current criteria labels and source-displayed instructions for one query attempt.',
      'The article records only criteria actually used, displayed instructions, navigation steps that occurred, and bounded retrieval state. It does not submit an actual property query or reproduce an actual result.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/H10/help/PQ_Public.html',
    [
      'The official H10 Public Queries Help page supplies bounded public-query and navigation context.',
      'The article uses that context only to keep result links and separate routes distinct; it does not interpret an H-10 report, well, operator, status, volume, or violation.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation-calculation explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Search for H10 attempt through its entry route, criteria snapshot, visible limitations, navigation steps, result-header state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique warm public-record counter and people-free strict-overhead cool-slate technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed Search for H10 criteria and instructions, separate public-query menu identity, limited H-10 context, and published limitations. None of the sources is used to establish property connection, title, ownership, acreage, lease effect, payment responsibility, entitlement, compliance, environmental condition, injection fact, production, value, or a transaction result.',
  'The article publishes no actual query values, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, H-10 conclusion, well conclusion, production result, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, result headers, links, and routes; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, environmental, engineering, geological, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real H-10 record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_h10_query_retrieval_no_property_connection_title_ownership_acreage_lease_payment_entitlement_compliance_environmental_injection_production_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
