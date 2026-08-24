#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '104';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-p-5-renewal-status-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0288';
process.env.MRX_SELECTION_RANK = '184';
process.env.MRX_EXPECTED_SOURCE_COUNT = '8';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC P-5 Renewal Status Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC P-5 Renewal Status Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC P-5 Renewal Status Query retrieval';
process.env.MRX_HERO_ALT =
  'An archival route desk and blank criterion tabs appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead query-state board appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC Research Queries directory supplies the P-5 Renewal Status Query index label, launch relationship, and global online-query limitation.',
      'The article uses the directory only to preserve the official route, label, source identity, and limitation; it does not treat a result as authoritative, legally effective, complete, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official About Oil & Gas Data Queries page supplies bounded system context for the separately named P-5 Renewal Status, IWAR, Inactive Well, and Organization P-5 routes.',
      'The article uses that context only to keep the routes separate and does not infer record equivalence, operator status, inactive-well status, compliance, renewal, or legal effect.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaMain.do',
    [
      'The official Oil & Gas Data Query menu displays P-5 Renewal Status Query, Inactive Well Aging Report Query, Inactive Well Query, and Organization P-5 Query as separate launch routes.',
      'The article records the menu labels and route separation only; a shared criterion or P-5 label does not establish that separate query systems describe the same record or private interest.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/inactiveWellStatusQueryAction.do',
    [
      'The launched official application supplies the P-5 Renewal Status Query HTML title and visible heading, criteria labels, filter labels, navigation controls, and exact execution route.',
      'The article preserves labels and records selected criteria and displayed state without submitting, reproducing, or interpreting a property-specific result.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/P5Query_TOC.htm',
    [
      'The official P-5 Renewal help table of contents supplies the source-defined separation among query, results, download, and contact-help pages.',
      'The article records only the help navigation used during one attempt and does not infer a substantive status from opening a help route.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/P5RenewalQuery_HowTo.htm',
    [
      'The official How To page supplies operator and other-criteria search paths, operator and lease selector behavior, source-displayed filter labels, and submit, reset, and return navigation.',
      'The article records only the path and source-displayed instructions used in one attempt and does not turn a criterion, filter, selector, or result into a compliance or renewal conclusion.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/P5RenewalQuery_About.htm',
    [
      'The official About page supplies the source description of the query and the names of result-header and result-table fields.',
      'The article treats those items only as source descriptions and does not interpret a renewal reminder, operator status, cost field, inactive period, form, compliance field, lease, well, or county.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/P5RenewalQuery_results_howto.htm',
    [
      'The official results help supplies bounded result-column, navigation, sorting, detail-link, tab, and download context.',
      'The article records the displayed result state and retained-reference provenance only and does not interpret a form status, extension, violation, shut-in date, cost calculation, or downstream relationship.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding generic value-discovery explainer with one administrative job: preserve a reproducible provenance trail for one official P-5 Renewal Status Query attempt through its exact routes, labels, controlled criteria, displayed state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The low oblique dark archival route desk and people-free strict-overhead pale query-state board differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, exact source labels, source-displayed P-5 Renewal Status criteria and filters, help navigation, result-field labels, detail navigation, and download behavior. None is used to establish a private-property relationship or a filing, renewal, operator, inactive-well, compliance, violation, extension, plugging, production, title, ownership, value, offer, legal, or transaction conclusion.',
  'The article publishes no actual operator, API, lease, well, district, county, field, filter selection, result, status, violation, extension, form detail, cost, shut-in date, screenshot, export, property identifier, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps the P-5 Renewal Status, IWAR, general Inactive Well, Organization P-5, Wellbore, production, and other RRC routes separate; preserves source uncertainty; controls private identifiers; and stops before regulatory, legal, title, engineering, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, criterion, result, signature, seal, logo, operator, form, inactive period, violation, extension, compliance, renewal, plugging, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_p5_renewal_status_retrieval_no_form_renewal_operator_inactive_well_compliance_violation_extension_plugging_production_property_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
