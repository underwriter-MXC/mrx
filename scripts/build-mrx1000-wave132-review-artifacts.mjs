#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '132';
process.env.MRX_ARTICLE_SLUG = 'reeves-county-mineral-records-search-log';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0337';
process.env.MRX_SELECTION_RANK = '209';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Reeves County Mineral Records: A Source-by-Source Search Log';
process.env.MRX_PRIMARY_KEYWORD = 'Reeves County mineral records search';
process.env.MRX_INLINE_KEYWORD = 'Reeves County mineral records search';
process.env.MRX_HERO_ALT =
  'Four separated records stations appear beside the exact Reeves County search-log title.';
process.env.MRX_INLINE_ALT =
  'Four separate overhead source-log zones appear above the exact Reeves County search keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://reeves.tx.ds.search.govos.com/',
    [
      'The current Reeves County Clerk-branded portal identifies the official property-record search route and exposes index-search context including party, subdivision, document-type, document-number, and recorded-date controls.',
      'It supports route identity and recorded-instrument index leads only; it does not prove ownership, title, property connection, instrument effect, identity, acreage, value, or completeness.',
    ],
  ],
  [
    'https://www.reevescountytax.org/search',
    [
      'The current Reeves County appraisal or tax search exposes account, owner-name, owner-address, and property-location search choices.',
      'It supports a separately documented appraisal or tax observation only; it does not establish deed identity, mineral title, acreage, lease status, amount owed, market value, or property connection.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/property-tax/county-directory/reeves.php',
    [
      'The Texas Comptroller county directory identifies the current Reeves County appraisal-district contact and website.',
      'It supports current route provenance only; it does not validate an individual account, value, tax status, ownership, title, or private-record relationship.',
    ],
  ],
  [
    'https://www.glo.texas.gov/sites/default/files/2025-01/Minerals%20FAQ_updated%202023.pdf',
    [
      'The Texas GLO FAQ describes its original land-grant record role and distinguishes later county deed records maintained by county clerks.',
      'It supports original land-grant context and the source-role boundary only; it does not establish present mineral ownership, title, property connection, acreage, value, or legal effect.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/gis-viewer/',
    [
      'The Railroad Commission page identifies the current Public GIS Viewer route for regulator-hosted oil, gas, and pipeline data and links current guidance.',
      'It supports regulator-data route identity and displayed feature observations only; it does not prove a private owner, title, lease interest, royalty decimal, acreage, payment right, value, or property connection.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects both the colliding valuation-offer identity and the already-owned page-and-exhibit job, then owns one distinct deliverable: a four-row Reeves County source-separated search log.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The oblique four-station archive scene and strict-overhead four-zone evidence log are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to five current official sources, their route identities, displayed search-field context, separate source roles, and four non-conclusive result labels.',
  'The article invents no result, record reference, interface relationship, person, tract, amount, ownership, title, acreage, value, tax, lease, well, property-connection, legal-effect, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps County Clerk index leads, CAD observations, GLO land-grant context, and RRC regulator data in separate rows and prohibits cross-system identity or property inference.',
  'Image text is limited to the exact title and keyword and adds no real personal data, identifier, account, instrument, value, map, ownership, title, tax, lease, legal, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'five_distinct_https_sources',
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
  'reeves_county_four_source_separation_clerk_index_cad_observation_glo_land_grant_rrc_regulator_data_no_ownership_title_acreage_value_tax_lease_well_property_connection_legal_effect_cross_system_identity_paid_purchase_or_private_data_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
