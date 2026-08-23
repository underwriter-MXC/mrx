#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '83';
process.env.MRX_ARTICLE_SLUG = 'inventory-mixed-status-mineral-interests-before-valuation-review';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0268';
process.env.MRX_SELECTION_RANK = '163';
process.env.MRX_ARTICLE_TITLE =
  'How to Inventory Mixed-Status Mineral Interests Before a Valuation Review';
process.env.MRX_PRIMARY_KEYWORD = 'mixed-status mineral interest inventory';
process.env.MRX_INLINE_KEYWORD = 'mixed-status mineral interest inventory';
process.env.MRX_HERO_ALT =
  'A mixed-status mineral portfolio folder appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A blank overhead evidence inventory worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The Railroad Commission production-data page identifies official Texas production-query channels and describes the data as production information reported by operators.',
      'The article uses the page only to log a query date, located lease or well reference, reported period, and evidence location; it does not infer private ownership, payment entitlement, current operating status, or value.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/gis-viewer/',
    [
      'The Railroad Commission GIS page describes survey, lease, API, well, and mapping search features and warns that viewer information has no legal force or effect.',
      'The article uses the page only to locate and preserve record identifiers and the query date; it does not treat a map result as authoritative location, title, status, entitlement, or value evidence.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The Railroad Commission well-records page describes available well-file channels and the identifiers useful when requesting records.',
      'The article uses the page only to log a request, request date, identifiers supplied, and response location; it does not interpret the contents of a well file.',
    ],
  ],
  [
    'https://www.glo.texas.gov/energy',
    [
      'The Texas General Land Office energy page identifies state-land, lease, scanned-record, and mapping resources.',
      'The article uses the page only to locate a state-land or state-lease record reference when applicable; it does not construe a state record or decide ownership or lease rights.',
    ],
  ],
  [
    'https://www.claimittexas.gov/',
    [
      'Texas Unclaimed Property provides the official state search and claim-status channel.',
      'The article uses the site only to log the searched name, date, result or claim reference, holder name, and follow-up owner; it does not treat a result as proof of mineral ownership, suspense, entitlement, or payable funds.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article owns only a blank administrative line-item inventory for tract or interest identifier, claimed status, as-of date, evidence document, payer or operator, last payment or production month, unknown field, and follow-up owner. It stops before interpreting records or deciding ownership, operational or payment status, entitlement, economics, valuation, or an offer.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The elevated front-facing portfolio-folder hero and people-free strict-overhead blank paper worksheet use materially different camera angles, structures, subjects, and evidence scenes with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to official Texas record-location, query, mapping, well-file, state-land, and unclaimed-property logistics. Each source role preserves the agency limits and is not converted into ownership, status, payment, entitlement, or value proof.',
  'The article invents no owner, tract, acreage, decimal, lease, well, production, payment, suspense, shut-in, title, economic, valuation, or offer fact and supplies no universal numerical assumption or result.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article repeatedly labels status as claimed, keeps conflicting evidence separate, turns gaps into neutral questions, assigns follow-up without predetermining a conclusion, discloses possible MRX buyer interest, and preserves qualified-review boundaries.',
  'Image text is limited to the exact article title and approved keyword and adds no owner name, property fact, document result, status conclusion, numerical assumption, seal, verification claim, appraisal claim, guarantee, or transaction outcome.',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'administrative_inventory_only_no_status_interpretation_ownership_entitlement_valuation_or_offer_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
