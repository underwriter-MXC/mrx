#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '92';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-p-4-gatherer-purchaser-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0290';
process.env.MRX_SELECTION_RANK = '172';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC P-4 Gatherer/Purchaser Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC P-4 gatherer/purchaser query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC P-4 gatherer/purchaser query retrieval';
process.env.MRX_HERO_ALT =
  'A Texas P-4 query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead P-4 query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies the P-4 Gatherer/Purchaser Query as a named oil-and-gas route and says online query data is continually updated, informational, non-authoritative, and without legal force.',
      'The article records the named route, access time, and published limitation without treating a query result as complete, legally controlling, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official overview describes the P-4 route, its gatherer and purchaser designations, its search categories, and daily update context.',
      'The article uses those source-stated categories only to build a criteria snapshot and record displayed labels; it does not interpret a designation or record.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaMain.do',
    [
      'The official Oil & Gas Data Query menu presents the P-4 Gatherer/Purchaser Query as a separate route from production, wellbore, severance, proration, organization, inactive-well, orphan-well, drilling-permit, inspection, and violation routes.',
      'The article preserves that route identity so records from separate systems are not merged or mislabeled.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/gathererPurchaserQueryAction.do',
    [
      'The official public P-4 Gatherer/Purchaser Query entry displays its current criteria labels and the route used for one query attempt.',
      'The article records only criteria actually used, navigation steps that occurred, and bounded retrieval state. It does not submit a filing or reproduce an actual property query.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official well-records page identifies P-4 material in separate Commission record channels and explains that the RRC has limited authority over lease, royalty, financing, investment, and property-rights matters.',
      'The article uses that context only to turn a query gap into a neutral next retrieval question, not to claim that an online result establishes title, payment, legal effect, or a complete agency record.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding value-assessment explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC P-4 Gatherer/Purchaser Query through its entry route, criteria snapshot, navigation steps, result-header state, result-row labels, access timestamp, source limits, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique warm public-record counter and people-free strict-overhead cool-gray technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed criteria and query labels, daily update context, record-access context, and published data limitations. None of the sources is used to establish property connection, title, ownership, acreage, lease effect, payee status, payment responsibility, entitlement, compliance, production, value, or a transaction result.',
  'The article publishes no actual query values, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, gatherer or purchaser conclusion, well conclusion, production result, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, result headers, and rows; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, engineering, geological, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real P-4 record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_p4_gatherer_purchaser_query_retrieval_no_property_connection_title_ownership_acreage_lease_payment_entitlement_production_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_privacy_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
