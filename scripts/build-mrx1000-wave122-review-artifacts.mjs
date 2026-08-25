#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '122';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-district-office-well-records-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0327';
process.env.MRX_SELECTION_RANK = '199';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC District Office Well Records Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC District Office Well Records retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC District Office Well Records retrieval';
process.env.MRX_HERO_ALT =
  'A researcher examines blank archival folders beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead archival evidence board appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory identifies the Oil and Gas Imaged Records Menu and supplies the current official entry route and public-source context.',
      'The article uses the directory only for source identity and routing. It does not establish a completed query, record completeness, a well fact, property relationship, ownership, production, value, offer, legal effect, or transaction conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/',
    [
      'The official Imaged Records page supplies the official imaged-record family route and archive context.',
      'The article uses the page only for route provenance and family separation. It makes no completeness, association, well, property, ownership, production, value, legal, offer, or transaction inference.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official menu identifies District Office Well Records profileId 27 and states that the collection concerns records predating 1980 that lacked a lease number or API number when created.',
      'The article preserves that statement only as dated source-described collection scope and records only one authorized manual attempt. It does not convert the scope note, profile identity, or access response into a document, well, property, ownership, production, value, offer, legal, or transaction fact.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official Oil and Gas Well Records page supplies historical record-format and request context and states limits on RRC authority over private-rights matters.',
      'The article uses the page only for record-route, historical-format, request, and agency-scope boundaries. It makes no well, permit, completion, property, title, ownership, lease, royalty, production, value, offer, legal, or transaction claim.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/news/102924rrc-s-digitally-imaged-oil-and-gas-records-top-83-million/',
    [
      'The official RRC announcement supplies district-office paper and microfilm digitization context and directs researchers to the Imaged Records menu.',
      'The article uses the announcement only for general digitization and official-route context. A broad digitization count does not establish profile completeness, a particular document, source result, well fact, property relationship, ownership, production, value, offer, legal effect, or transaction outcome.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding hidden-fee identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Imaged Records District Office Well Records profile retrieval attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The wide eye-level one-researcher archive scene and people-free strict-overhead archival evidence board are materially distinct in camera angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official RRC surfaces, source and profile identity, profileId 27 routing, source-described historical scope, digitization context, adjacent-route separation, agency-scope limitations, and attempt-state rules. None establishes a completed retrieval, record completeness, well identity or status, permit, completion, property connection, ownership, title, lease, royalty, production, reserves, safety, environmental or compliance status, value, offer, legal effect, tax effect, or transaction conclusion.',
  'The direct profile request returned HTTP 403, no profile page was captured, and no query completed. The article publishes no actual lease number, API number, district, field, well, operator, location, date, party, result, image, document, property, owner, payment, production, reserve, value, offer, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps District Office Well Records profileId 27 separate from Potential, Dry Hole, and Well Log profiles, Wellbore, Drilling Permit, Completions, P-4, P-17, production, GIS, EDMS, hearings, other district-office profiles, Energy Depot, paid research, automation, bulk retrieval, interpretation, valuation, offer, and decision tasks.',
  'Image text is limited to the exact title and keyword and adds no identifier, actual record, source result, seal, logo, well or property fact, ownership, payment, production, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_district_office_well_records_profile27_one_manual_attempt_http403_unverified_no_adjacent_route_paid_research_automation_bulk_interpretation_well_property_ownership_lease_production_environmental_compliance_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
