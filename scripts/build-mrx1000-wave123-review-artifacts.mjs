#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '123';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-form-p-18-skim-oil-condensate-report-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0328';
process.env.MRX_SELECTION_RANK = '200';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Form P-18 Skim Oil/Condensate Report Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Form P-18 report retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Form P-18 report retrieval';
process.env.MRX_HERO_ALT =
  'A researcher reviews blank public-record folders beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead P-18 retrieval evidence board appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory identifies the Oil and Gas Imaged Records Menu and supplies the current official entry route and public-source context.',
      'The article uses the directory only for source identity and routing. It does not establish a completed query, report completeness, a facility or well fact, property relationship, ownership, production, value, offer, legal effect, or transaction conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/',
    [
      'The official Imaged Records page supplies the official imaged-record family route and archive context.',
      'The article uses the page only for route provenance and family separation. It makes no completeness, association, facility, well, property, ownership, production, value, legal, offer, or transaction inference.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/',
    [
      'The official menu identifies Skim Oil/Condensate Reports (Form P-18) profileId 28 and states January 2013-forward coverage.',
      'The article preserves that statement only as dated source-described collection scope and records only one authorized manual attempt. It does not convert the scope note, profile identity, or access response into a document, facility, well, property, ownership, production, value, offer, legal, or transaction fact.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/p-18-skim-oil-condensate-report/',
    [
      'The official download page identifies a separate monthly JSON data route for P-18 reports and describes its source context.',
      'The article uses the page only to distinguish the separate download route from the imaged-record profile attempt. It does not download, parse, automate, reconcile, or interpret JSON data and makes no production, facility, disposal, property, ownership, value, legal, offer, or transaction claim.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/media/uejn4oo3/p-18-instructions.pdf',
    [
      'The official Form P-18 instructions supply the source title and bounded form-purpose terminology.',
      'The article uses the instructions only to distinguish form-purpose context from retrieval evidence. It does not instruct filing, interpret report entries, test compliance, calculate volumes, or infer production, storage, disposal, facility, property, ownership, value, offer, legal, tax, or transaction facts.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding competing-offers identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC Imaged Records Form P-18 profile retrieval attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The wide eye-level one-researcher archive scene and people-free strict-overhead P-18 evidence board are materially distinct in camera angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official RRC surfaces, source and profile identity, profileId 28 routing, January 2013-forward source-described coverage, separate download-route and form-purpose context, adjacent-route separation, and attempt-state rules. None establishes a completed retrieval, report completeness, facility or well identity, production, storage, transportation, disposal, environmental or compliance status, property connection, ownership, title, lease, royalty, value, offer, legal effect, tax effect, or transaction conclusion.',
  'The direct profile request returned HTTP 403, no profile page was captured, and no query completed. The article publishes no actual serial number, facility, well, lease, district, field, operator, location, reporting period, party, result, image, document, property, owner, payment, production, storage, disposal, value, offer, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps Form P-18 profileId 28 separate from other Imaged Records profiles, P-17, T-1, G-10/W-10, production queries, downloadable P-18 JSON, LoneSTAR filing, Energy Depot, paid research, automation, bulk retrieval, interpretation, valuation, offer, and decision tasks.',
  'Image text is limited to the exact title and keyword and adds no identifier, actual report, source result, seal, logo, facility or well fact, production, storage, disposal, ownership, payment, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_form_p18_profile28_one_manual_attempt_http403_unverified_no_adjacent_route_paid_research_automation_bulk_interpretation_facility_well_production_storage_disposal_environmental_compliance_property_ownership_value_offer_legal_tax_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
