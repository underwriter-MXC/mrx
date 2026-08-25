#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '121';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-dry-hole-file-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0326';
process.env.MRX_SELECTION_RANK = '198';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Dry Hole File Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC dry hole file retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC dry hole file retrieval';
process.env.MRX_HERO_ALT =
  'A researcher opens a public-record archive drawer beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead dry-hole retrieval evidence board appears above the exact keyword.';
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
      'The official Imaged Records page separately lists Dry Hole Files, Oil and Gas Well Records Potential files, and Oil and Gas Well Logs; it supplies the Dry Hole Files profile route and states the source-described dry-hole content and availability limitation.',
      'The article uses the page only for record-family identity, profile routing, stated coverage, incompleteness notes, route separation, and manual source mechanics. It makes no completeness, association, well, property, ownership, production, value, legal, offer, or transaction inference.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official menu identifies Dry Hole Files profileId 9, states coverage from 2000 forward, and notes that older District 9 files are added as time permits.',
      'The article records only the displayed menu, family, profile route, coverage note, access state, controlled criteria reference, and result-state vocabulary from one authorized manual attempt. It does not substitute a neighboring profile or claim a direct-profile result.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official Oil and Gas Well Records page distinguishes dry-hole and completed-well record routes, provides request-category and historical context, and states limits on RRC authority over private-rights matters.',
      'The article uses the page only for route separation, record-request context, historical coverage notes, and agency-scope boundaries. It makes no permit, plugging, directional-survey, well-status, property, title, payment, production, value, offer, legal, or transaction claim.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/well-records-faqs/',
    [
      'The current official FAQ supplies source-specific well-record availability, film-cycle, image-format, and viewer context.',
      'The article preserves only actually displayed access, document-link, image, or viewer states as source notes. It does not infer age, completeness, identity, status, property connection, ownership, production, value, or legal effect from source mechanics.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding offer-legitimacy identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Imaged Records Dry Hole Files profile retrieval attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The wide eye-level one-researcher archive scene and people-free strict-overhead dry-hole retrieval evidence board are materially distinct in camera angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official RRC surfaces, source and profile identity, profileId 9 routing, stated content and coverage, incompleteness notes, adjacent-route separation, viewer context, agency-scope limitations, and attempt-state rules. None establishes a completed retrieval, record completeness, permit, plugging, directional survey, well fact, property connection, ownership, production, reserves, safety, environmental or compliance status, value, offer quality, legal effect, tax effect, or transaction conclusion.',
  'The direct profile request returned HTTP 403, no profile page was captured, and no query completed. The article publishes no actual API number, district, field, lease, well, operator, location, date range, party, result, dry-hole image, document, property, owner, payment, production, reserve, value, offer, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps Dry Hole Files profileId 9 separate from the Potential and Well Log profiles, Wellbore, Drilling Permit, Completions, P-4, P-17, production, GIS, EDMS, hearing, automation, bulk retrieval, interpretation, valuation, offer, and decision tasks.',
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
  'texas_rrc_dry_hole_file_profile9_one_manual_attempt_http403_unverified_no_adjacent_route_automation_bulk_interpretation_well_property_ownership_production_environmental_compliance_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
