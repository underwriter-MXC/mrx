#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '130';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-public-gis-viewer-layer-state-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0335';
process.env.MRX_SELECTION_RANK = '207';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Public GIS Viewer Layer-State Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Public GIS Viewer layer-state retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Public GIS Viewer layer-state retrieval';
process.env.MRX_HERO_ALT =
  'A dark oblique GIS session archive appears beside the exact Public GIS Viewer worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down layer-state evidence board appears above the exact Public GIS Viewer retrieval keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/gis-viewer/',
    [
      'The official landing page identifies the Public GIS Viewer, current technical notices, nightly update description, layer visibility, basemaps, print formats, measurement, coordinate, identify, and consolidated search features.',
      'It supports route and interface-state claims only, not geographic accuracy, a survey, private-rights coverage, ownership, title, value, or a transaction result.',
    ],
  ],
  [
    'https://gis.rrc.texas.gov/',
    [
      'The live official viewer exposes a displayed version and release date plus the current layer, search, and map controls available during a session.',
      'The article records the live-displayed state for one session and does not freeze a reviewed version or release date as a permanent fact.',
    ],
  ],
  [
    'https://gis.rrc.texas.gov/gisviewer/GISViewer/docs/userguide.pdf',
    [
      'The official guide describes visibility, legend, county navigation, print, basemap, measure, identify, coordinates, search, radius, and download-wells tools.',
      'It supports field selection and provenance design only; it does not establish a result for any owner, property, lease, well, coordinate, boundary, or private right.',
    ],
  ],
  [
    'https://gis.rrc.texas.gov/gisviewer/GISViewer/docs/WebHelp/Download_Wells.htm',
    [
      'The official help page states that Public GIS Viewer data are informational, are not authoritative public records, have no legal force or effect, and require users to verify accuracy, completeness, currency, and suitability.',
      'The article applies those limitations to every session record and does not convert displayed data or an exported artifact into ownership, boundary, coverage, legal, valuation, or transaction evidence.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding comparative-valuation identity and owns one distinct administrative job: preserve the visible layer state and provenance of one manual Texas RRC Public GIS Viewer session.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The dark oblique GIS-session archive and cream strict-overhead layer-state evidence board are materially distinct.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC sources, current interface controls, live-displayed viewer state, source limitations, transparent provenance fields, and one-attempt outcomes.',
  'The article publishes no actual selector, label, capture, owner, property, lease, well, pipeline, coordinate, identifier, boundary, coverage, ownership, title, value, offer, legal, tax, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps one manual Public GIS Viewer session separate from automated or bulk retrieval, source-specific RRC query records, survey or title work, private-rights inference, valuation, offer review, legal interpretation, and transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no identifier, official mark, result, coordinate, property, ownership, boundary, valuation, legal, tax, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'four_distinct_https_sources',
  'current_primary_source_http_review_pass',
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
  'texas_rrc_public_gis_viewer_one_manual_session_visible_layer_basemap_selector_scale_label_capture_and_bounded_outcome_no_automation_authoritative_coordinate_boundary_ownership_title_coverage_value_offer_legal_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
