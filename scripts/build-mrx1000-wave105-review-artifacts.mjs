#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '105';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-orphan-well-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0289';
process.env.MRX_SELECTION_RANK = '185';
process.env.MRX_EXPECTED_SOURCE_COUNT = '8';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Orphan Well Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Orphan Well Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Orphan Well Query retrieval';
process.env.MRX_HERO_ALT =
  'An archival locator rack and blank reference cards appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead criteria grid appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC Research Queries directory supplies the Orphan Well Query index label, launch relationship, monthly update label, access caution, and global online-query limitation.',
      'The article uses the directory only to preserve the official route, label, update statement, source identity, access caution, and limitation; it does not treat a result as authoritative, legally effective, complete, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official About Oil & Gas Data Queries page supplies bounded system context for separately named EWA routes and explains that each query is one slice of the larger Oil and Gas System.',
      'The article uses that context only to keep routes separate and does not infer record equivalence, orphan-well status, operator status, compliance, plugging responsibility, or legal effect.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaMain.do',
    [
      'The official Oil & Gas Data Query menu displays Orphan Well Query and neighboring EWA systems as separate launch routes.',
      'The article records the menu label and route separation only; a shared well, operator, lease, field, county, district, or API label does not establish that separate query systems describe the same record or private interest.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/orphanWellQueryAction.do',
    [
      'The launched official application supplies the Orphan Well Query HTML title and visible heading, well-type, district, lease-or-well-ID, county, field, operator, and API criteria labels, plus exact execution route.',
      'The article preserves labels and records selected criteria and displayed state without submitting, reproducing, or interpreting a property-specific result.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/ORPHAN_WELL_TOC.html',
    [
      'The official Orphan Well help table of contents supplies the source-defined separation among query, results, download, and contact-help pages.',
      'The article records only help navigation used during one attempt and does not infer a substantive status from opening a help route.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/OrphanWell_HowTo.htm',
    [
      'The official How To page supplies oil, gas, or both; district; lease or gas-well ID; field; operator; and selector search paths, plus submit and return navigation.',
      'The article records only the path and source-displayed instructions used in one attempt and does not turn a criterion, selector, or result into an orphan-well, compliance, plugging, or property conclusion.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/OrphanWell_About.htm',
    [
      'The official About page supplies the source description of the query, source-defined scope, monthly update statement, and names of result information.',
      'The article treats those items only as source descriptions and does not interpret the source definition, months inactive, operator, lease, well, field, county, district, compliance, condition, or plugging significance.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/OrphanWell_results_howto.htm',
    [
      'The official results help supplies bounded result-column, pagination, sorting, detail-link, tab, and download context.',
      'The article records the displayed result state and retained-reference provenance only and does not interpret an orphan-well category, operator, well status, inactive period, plugging information, or downstream relationship.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding spacing, permit, drilling-inventory, and valuation explainer with one administrative job: preserve a reproducible provenance trail for one official Orphan Well Query attempt through its exact routes, labels, controlled criteria, displayed state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The low-oblique dark archival locator rack and people-free strict-overhead pale criteria grid differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, exact source labels, source-displayed Orphan Well criteria and selectors, help navigation, source descriptions, monthly update label, result-field labels, detail navigation, pagination, sorting, and download behavior. None is used to establish a private-property relationship or an orphan-well, operator, compliance, delinquency, plugging, environmental, title, ownership, value, offer, legal, or transaction conclusion.',
  'The article publishes no actual operator, API, lease, well, district, county, field, criterion selection, result, status, inactive period, plugging detail, screenshot, export, property identifier, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps the Orphan Well, IWAR, general Inactive Well, P-5 Renewal Status, Organization P-5, Wellbore, production, and other RRC routes separate; preserves source uncertainty; controls private identifiers; and stops before regulatory, legal, title, engineering, environmental, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, criterion, result, signature, seal, logo, operator, inactive period, compliance, delinquency, plugging, environmental, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'eight_distinct_https_sources',
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
  'texas_rrc_orphan_well_query_retrieval_no_orphan_classification_operator_compliance_plugging_environmental_property_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
