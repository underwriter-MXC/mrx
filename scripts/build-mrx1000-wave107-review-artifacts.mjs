#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '107';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-new-lease-ids-built-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0292';
process.env.MRX_SELECTION_RANK = '187';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC New Lease IDs Built Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC New Lease IDs Built Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC New Lease IDs Built Query retrieval';
process.env.MRX_HERO_ALT =
  'A low-oblique routing light-table appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead query worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC Research Queries directory supplies the New Lease IDs Built Query label, launch relationship, nightly update label, access caution, and global online-query limitation.',
      'The article uses the directory only to preserve the route, label, update statement, source identity, access caution, and limitation; it does not treat a result as authoritative, legally effective, complete, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/PR/publicQueriesNewLeaseAction.do',
    [
      'The official application supplies the New Lease IDs Built Query title and visible label, date-range, drilling-permit, API, district, county, field, operator, selector-mode, Submit, Reset, Restart Search, and result-area labels.',
      'The article preserves labels, controlled criteria, navigation, and displayed state without submitting, reproducing, or interpreting a property-specific result.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/PR/help/new_lease.html',
    [
      'The official New Lease Query help page supplies the 90-day maximum date-range and MM/DD/YYYY format, selector instructions, control sequence, and statement that results are only for lease IDs built after November 1, 2006.',
      'The article treats those statements only as query mechanics and source limitations; it does not interpret new, built, lease identity, or the meaning of any result.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/PR/publicQueriesMainAction.do',
    [
      'The official Production Report Queries home supplies a separate route and separately labeled production-report query forms.',
      'The article uses the page only to preserve route separation and does not merge New Lease IDs Built Query provenance with production data, a filing, an operator-of-record result, or a production conclusion.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/PR/help/rpt_toc.html',
    [
      'The official Production Reports Help Contents page supplies the separate New Lease Query, PR Queries, operator-search, error-message, and glossary help navigation labels.',
      'The article records only a help route actually opened during the attempt and does not infer a substantive result from help navigation.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/PR/help/prod_gloss.html',
    [
      'The official glossary supplies source terminology context when a displayed label requires exact source wording.',
      'The article may preserve the glossary route and quoted source term in controlled evidence but may not turn a glossary definition into a property-specific lease, well, operator, production, title, valuation, legal, or transaction conclusion.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation-factor explainer with one administrative job: preserve a reproducible provenance trail for one official New Lease IDs Built Query attempt through its exact routes, labels, controlled criteria, displayed state, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The low-oblique dark routing light-table and people-free strict-overhead pale query worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, exact source labels, source-displayed criteria, 90-day and date-format constraints, selector and control mechanics, post-November 1, 2006 help limitation, route separation, help navigation, and source terminology context. None is used to establish a private-property relationship or a substantive lease, operator, permit, API, field, production, status, compliance, title, ownership, value, offer, legal, or transaction conclusion.',
  'The article publishes no actual operator, API, lease, permit, field, district, county, date range, criterion selection, result, screenshot, property identifier, production, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps New Lease IDs Built Query separate from Production Report Queries, Production Data Query, Drilling Permit, Field Search, Wellbore, P-4, proration, and other RRC routes; preserves source uncertainty; controls identifiers; and stops before regulatory, legal, title, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, criterion, result, signature, seal, logo, lease, operator, permit, production, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_new_lease_ids_built_query_retrieval_no_lease_operator_permit_api_field_production_status_compliance_property_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
