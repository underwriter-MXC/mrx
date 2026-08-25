#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '119';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-imaged-well-log-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0317';
process.env.MRX_SELECTION_RANK = '196';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Imaged Well Log Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC well log retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC well log retrieval';
process.env.MRX_HERO_ALT =
  'A single-hand generic well-log retrieval desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead TIFF evidence-transfer board appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory separately identifies Oil and Gas Imaged Records Menu, supplies its current update label, warns against automated volume retrieval, and supplies the current official entry route.',
      'The article uses the directory only for source identity, routing, update-label, manual-access, and public-query limitation context. It does not establish a completed query, record completeness, well fact, property relationship, ownership, production, value, offer, legal effect, or transaction conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/',
    [
      'The official Imaged Records page identifies Oil and Gas Well Logs as a separate record family, names the Well Log launch profile, states source coverage beginning in July 2004, lists source-displayed search-key categories, and describes TIFF delivery and viewer context.',
      'The article uses those statements as route, mechanics, coverage, and file-format notes only. It does not interpret a log or establish formation, depth, lithology, completion, well status, production, reserves, property connection, ownership, value, compliance, or legal effect.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official Oil and Gas Well Records page separately identifies the Well Log profile, describes stated online coverage and helpful record-request categories, distinguishes nearby record routes, and states limits on RRC authority over private lease, royalty, financing, investment, property-rights, and bankruptcy matters.',
      'The article uses the page only for source identity, coverage, route separation, request-category, and agency-scope boundaries. It makes no private-rights, title, payment, financial, property, well, technical, value, offer, or transaction claim.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/well-records-faqs/',
    [
      'The current official FAQ states that well-log files are stored and delivered in TIFF format and supplies source-specific API search-entry guidance.',
      'The article uses the FAQ only to preserve file-format, viewer, and source-mechanics notes. It publishes no actual API number and makes no record-identity, property, ownership, well, production, value, legal, offer, or transaction inference.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding valuation-versus-predatory-offers identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Imaged Records Well Log profile retrieval attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique single-hand rolled-log desk and people-free strict-overhead circular TIFF evidence-transfer board are materially distinct in camera angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC surfaces, route and profile identity, source-displayed search-key categories, stated coverage, TIFF or viewer context, adjacent-route separation, agency-scope limitations, and attempt-state rules. None establishes formation, depth, lithology, completion, well status, production, reserves, property connection, ownership, title, payment, acreage, value, offer quality, compliance, safety, environmental condition, legal effect, tax, or a transaction conclusion.',
  'The article publishes no actual API, field, lease, well, operator, location, date, party, result, log image, formation, depth, property, owner, payment, production, reserve, value, offer, or transaction data and does not claim a completed direct-profile query.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps the Imaged Records Well Log profile separate from Wellbore Query, Drilling Permit, Completions, potential files, production, GIS interpretation, EDMS, hearings, dry-hole files, historical research, automation, bulk retrieval, and every valuation, offer, or decision task.',
  'Image text is limited to the exact title and keyword and adds no identifier, actual record, source result, seal, logo, well status, formation, property, ownership, payment, production, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_imaged_well_log_one_manual_attempt_access_and_tiff_state_no_adjacent_route_automation_bulk_interpretation_well_property_ownership_production_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
