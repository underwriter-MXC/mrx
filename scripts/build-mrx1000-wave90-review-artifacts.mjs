#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '90';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-drilling-permit-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0275';
process.env.MRX_SELECTION_RANK = '170';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Drilling-Permit Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC drilling permit query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC drilling permit query retrieval';
process.env.MRX_HERO_ALT =
  'An archival Texas permit-query counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down query-provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies the Drilling Permit (W-1) Query as a separate public research route, displays its update note, and publishes the limitation that online data is continually updated, informational, non-authoritative, and without legal force.',
      'The article records the named entry route, access time, update note, and source limitation without treating a query result as complete, legally controlling, connected to private property, or suitable for a downstream conclusion.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/DPQuery_About.htm',
    [
      'The official query-about page lists search categories and displayed result fields for the drilling-permit query.',
      'The article uses those labels only to build a reproducible criteria and result-field snapshot. It does not interpret a field, reconcile identifiers, or connect a result to a private mineral interest.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/drillingPermitsQueryAction.do',
    [
      'The official public W-1 query entry supplies current source-displayed search controls and the route used for one query attempt.',
      'The article records only criteria actually used, navigation steps that occurred, and bounded retrieval state. It does not submit a filing or reproduce an actual property query.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/DPQuery_results_howto.htm',
    [
      'The official results help describes the result header, criteria display, sorting and navigation behavior, result columns, and links to additional detail pages.',
      'The article keeps result-header state, rows, and detail routes separate and rejects permit, status, operator, lease, survey, unit, property, compliance, drilling, production, and value interpretations.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/applications-and-permits/drilling-permits/',
    [
      'The official drilling-permits page identifies application and online-filing guidance as a separate source role.',
      'The article uses that distinction only to prevent application or filing guidance from being mislabeled as a public query result. It does not teach filing, payment, amendment, approval, or compliance.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/media/qqmhxxex/dpmanual.pdf',
    [
      'The official W-1 user guide displays query-screen examples and states that when more than one search criterion is selected, all selected criteria must be true for a W-1 to appear in the result list.',
      'The article attaches that source instruction to the criteria snapshot so a not-located attempt is not misrepresented as proof that no permit exists. It does not use filing, fee, or application instructions.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding location-and-value explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC drilling-permit query through its entry route, criteria snapshot, navigation steps, result-header state, result-row fields, detail routes, access timestamp, source limits, retained reference, and bounded status.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique warm archival permit-query counter and people-free strict-overhead cool-gray eight-field technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC query routes, source-displayed criteria and result labels, navigation behavior, application-versus-query distinction, multiple-criteria instruction, update context, and published data limitations. None of the sources is used to interpret a permit or establish property connection, title, ownership, acreage, lease effect, entitlement, compliance, drilling, production, value, or a transaction result.',
  'The article publishes no actual query values, completed permit, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, production result, drilling forecast, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, result headers, rows, and detail routes; converts gaps into neutral retrieval questions; controls private identifiers; and stops before interpretation or downstream property, regulatory, operational, analytical, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real permit, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'six_distinct_https_sources',
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
  'texas_rrc_drilling_permit_query_retrieval_no_interpretation_property_connection_title_ownership_acreage_lease_entitlement_compliance_drilling_production_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_privacy_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
