#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '103';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-inactive-well-aging-report-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0287';
process.env.MRX_SELECTION_RANK = '183';
process.env.MRX_EXPECTED_SOURCE_COUNT = '7';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Inactive Well Aging Report Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Inactive Well Aging Report retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Inactive Well Aging Report retrieval';
process.env.MRX_HERO_ALT =
  'Blank age-band cards and archival research tools appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead radial IWAR evidence worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC Research Queries directory supplies the separately named Inactive Well Aging Report Query index label, launch relationship, and global online-query limitation.',
      'The article uses the directory only to preserve the official route, label, source identity, and limitation; it does not treat a result as authoritative, legally effective, complete, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official About Oil & Gas Data Queries page supplies bounded system context for the separately named IWAR, P-5 Renewal Status, and Inactive Well routes.',
      'The article uses that context only to keep the routes separate and does not infer record equivalence, current well status, compliance, renewal, or legal effect.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaMain.do',
    [
      'The official Oil & Gas Data Query menu displays Inactive Well Aging Report Query, P-5 Renewal Status Query, and Inactive Well Query as separate launch routes.',
      'The article records the menu labels and route separation only; a shared criterion or label does not establish that separate query systems describe the same private interest.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/inactiveWellQueryAction.do',
    [
      'The launched official application supplies the visible Inactive Well Aging Report (IWAR) Query body label, current P-5 Renewal Status Query HTML title, inactivity-type options, criteria labels, and official execution route.',
      'The article preserves each label only in its source context and records selected criteria and displayed state without submitting, reproducing, or interpreting a property-specific result.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/IWAR_About.html',
    [
      'The official IWAR About page supplies the source-described query categories, output-field labels, and update statement.',
      'The article treats those items only as source descriptions and does not interpret an inactive period, extension, cost, compliance date, plugged-well field, operator, lease, well, location, or completion date.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/IWAR_HowTo.html',
    [
      'The official IWAR How To page supplies operator-and-inactivity-type and other-criteria search paths, default-inactivity-type context, and operator, lease, and field navigation.',
      'The article records only the path and source-displayed instructions used in one attempt and does not turn a criterion, default, selector, or result into a substantive conclusion.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/IWAR_results_howto.html',
    [
      'The official IWAR results help supplies bounded result-header, column, navigation, sorting, detail-link, and download context.',
      'The article records the displayed result state and retained-reference provenance only and does not interpret a result, extension status, cost, compliance due date, or downstream relationship.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding hidden-worth valuation explainer with one administrative job: preserve a reproducible provenance trail for one official Inactive Well Aging Report query attempt through its exact routes, page labels, selected inactivity type, controlled criteria, navigation, displayed state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The low oblique dark archival counter and people-free strict-overhead pale radial worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, exact source labels, source-displayed IWAR criteria and navigation, result-help labels, update statement, and published limitations. None is used to establish a private-property relationship or an inactive-period, operator, lease, well, extension, compliance, renewal, plugging, production, title, ownership, value, offer, legal, or transaction conclusion.',
  'The article publishes no actual operator, API, lease, well, county, field, location, inactivity type selection, result, extension, cost, compliance date, plugging field, completion date, screenshot, export, property identifier, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps the IWAR, P-5 Renewal Status, general Inactive Well, Organization P-5, Wellbore, H-10, production, and other RRC routes separate; preserves the page-label mismatch and source uncertainty; controls private identifiers; and stops before regulatory, legal, title, engineering, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, criterion, result, signature, seal, logo, owner, inactive period, extension, compliance, renewal, plugging, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'seven_distinct_https_sources',
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
  'texas_rrc_iwar_retrieval_no_inactive_period_extension_compliance_renewal_plugging_operator_lease_well_production_property_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
