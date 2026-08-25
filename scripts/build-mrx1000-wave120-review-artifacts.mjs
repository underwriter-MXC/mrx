#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '120';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-imaged-potential-file-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0321';
process.env.MRX_SELECTION_RANK = '197';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Imaged Potential File Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC potential file retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC potential file retrieval';
process.env.MRX_HERO_ALT =
  'A researcher opens a generic archive drawer beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead potential-file evidence board appears above the exact keyword.';
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
      'The official Imaged Records page separately lists Oil and Gas Well Records Potential files, Dry Hole Files, and Oil and Gas Well Logs and supplies the Oil and Gas Well Records launch route.',
      'The article uses the page only for record-family identity, route separation, stated source coverage, and manual source mechanics. It makes no completeness, association, well, property, ownership, production, value, legal, offer, or transaction inference.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official menu is the source-controlled entry surface for the imaged-record families referenced by the article.',
      'The article records only the displayed menu, family, profile, access, criteria-reference, and result-state facts from one authorized manual attempt. It does not substitute a neighboring profile or claim a direct-profile result.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official Oil and Gas Well Records page separately identifies the Oil and Gas Potential and Well Log profiles, describes the Potential profile record categories and stated coverage, distinguishes later electronic routes, and states limits on RRC authority over private-rights matters.',
      'The article uses the page only for profile identity, coverage notes, route separation, request-category context, and agency-scope boundaries. It makes no permit, completion, plugging, property, title, payment, production, value, offer, legal, or transaction claim.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/well-records-faqs/',
    [
      'The current official FAQ explains that a displayed FILM YR notation beneath a Potential link indicates an image taken from microfilm and supplies source-specific film-cycle and viewer context.',
      'The article preserves any actually displayed FILM YR or viewer state as a source note only. It does not infer age, completeness, identity, status, property connection, ownership, production, value, or legal effect from that notation.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding multiple-offers identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Imaged Records Oil and Gas Potential profile retrieval attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The wide eye-level one-researcher archive scene and people-free strict-overhead potential-file evidence board are materially distinct in camera angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official RRC surfaces, route and profile identity, stated record categories and coverage, later electronic-route separation, FILM YR and viewer context, agency-scope limitations, and attempt-state rules. None establishes a completed retrieval, record completeness, well fact, property connection, ownership, title, production, value, offer quality, legal effect, tax effect, or transaction conclusion.',
  'The article publishes no actual API number, district, field, lease, well, operator, location, date range, party, result, Potential image, document, property, owner, payment, production, reserve, value, offer, or transaction data and does not claim a completed direct-profile query.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps the Imaged Records Oil and Gas Potential profile separate from the Well Log profile, Wellbore, Drilling Permit, Completions, P-4, P-17, Dry Hole, production, GIS, EDMS, hearing, automation, bulk retrieval, interpretation, valuation, offer, and decision tasks.',
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
  'texas_rrc_imaged_potential_file_one_manual_attempt_access_link_film_year_viewer_state_no_adjacent_route_automation_bulk_interpretation_well_property_ownership_production_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
