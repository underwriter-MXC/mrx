#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '106';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-online-inspection-lookup-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0291';
process.env.MRX_SELECTION_RANK = '186';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Online Inspection Lookup Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Online Inspection Lookup retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Online Inspection Lookup retrieval';
process.env.MRX_HERO_ALT =
  'A modern inspection-retrieval evidence station appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead retrieval-state matrix appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC Research Queries directory supplies the RRC Online Inspection Lookup label, launch relationship, and global online-query limitation.',
      'The article uses the directory only to preserve the official route, label, source identity, and limitation; it does not treat a displayed state as authoritative, legally effective, complete, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-rrc-online-inspection-lookup/',
    [
      'The official About RRC Online Inspection Lookup page supplies the source scope, completed-inspection display boundary, August 2015 coverage statement, nightly update statement, Excel-download context, and informational-use limitation.',
      'The article preserves those source statements and does not infer an inspection status, violation, compliance, operator, condition, complaint, enforcement, liability, regulatory, environmental, property, legal, valuation, offer, or transaction conclusion.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/PDA/ice/pdaIceHome.xhtml',
    [
      'The official RRC OIL application supplies the current Inspections and Violations tabs, source-displayed search labels, search and reset controls, result-grid labels, pagination, and Excel control.',
      'The article records only exact labels, selected-criteria provenance, navigation, and displayed state without publishing or interpreting a property-specific query result.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/PDA/resources/docs/RRC_OIL_User_Guide.pdf',
    [
      'The official 18-page RRC OIL User Guide supplies bounded descriptions of the application, criteria, result navigation, filtering, Excel export, full-data-set downloads, coverage, and source limitations.',
      'The article uses guide mechanics only for reproducible retrieval documentation and does not convert a criterion, empty field, placeholder, row, column, detail, export, or full data set into a substantive finding.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/inspections-and-violations/',
    [
      'The official Inspections and Violations page supplies agency-level context and links for the RRC inspection and violation information ecosystem.',
      'The article uses that page only to preserve source context and route identity; it does not infer a particular inspection, violation, compliance, enforcement, condition, or responsibility.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/locations/',
    [
      'The official Locations page supplies neutral district-office routing context when a source question requires agency contact.',
      'The article records only the contact route selected and does not treat contact, nonresponse, or referral as confirmation of any record or conclusion.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding mineral-value-factor explainer with one administrative job: preserve a reproducible provenance trail for one official RRC Online Inspection Lookup attempt through its exact routes, labels, controlled criteria, displayed state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The low-oblique dark evidence station and people-free strict-overhead pale retrieval-state matrix differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, exact source labels, source-displayed criteria, completed-inspection display boundary, August 2015 coverage statement, nightly update statement, result navigation, filtering, export mechanics, source limitations, and district-contact routing. None is used to establish a private-property relationship or a substantive inspection, violation, compliance, operator, condition, complaint, enforcement, liability, regulatory, environmental, title, ownership, value, offer, legal, or transaction conclusion.',
  'The article publishes no actual operator, API, lease, well, facility, permit, complaint, district, county, criterion selection, result, violation, compliance value, inspection date, enforcement action, screenshot, export, property identifier, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps RRC OIL separate from Orphan Well, Inactive Well, IWAR, P-5 Renewal Status, Wellbore, production, and other RRC routes; preserves source uncertainty; controls private identifiers; and stops before regulatory, legal, title, engineering, environmental, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, criterion, result, signature, seal, logo, operator, inspection, violation, compliance, condition, enforcement, environmental, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'six_distinct_https_sources',
  'current_source_access_review_pass',
  'official_pdf_full_document_and_visual_review_pass',
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
  'texas_rrc_online_inspection_lookup_retrieval_no_inspection_violation_compliance_operator_condition_complaint_enforcement_liability_regulatory_environmental_property_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
