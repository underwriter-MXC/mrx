#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '93';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-organization-p-5-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0169';
process.env.MRX_SELECTION_RANK = '173';
process.env.MRX_EXPECTED_SOURCE_COUNT = '5';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Organization (P-5) Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Organization (P-5) query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Organization (P-5) query retrieval';
process.env.MRX_HERO_ALT =
  'A Texas organization-query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead organization P-5 query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies Organization (P-5) Query as a named oil-and-gas route and says online query data is continually updated, informational, non-authoritative, and without legal force.',
      'The article records the named route, access time, and published limitation without treating a query result as complete, legally controlling, connected to private property, or sufficient for a downstream conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official overview describes the Organization (P-5) route, the organization-information context, operator-name or number search, and daily-update context.',
      'The article uses those source-stated categories only to build a criteria snapshot and record displayed labels; it does not interpret an organization or P-5 record.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaMain.do',
    [
      'The official Oil & Gas Data Query menu presents Organization (P-5) Query as a separate route from production, wellbore, severance, proration, P-4, inactive-well, orphan-well, drilling-permit, inspection, and violation routes.',
      'The article preserves that route identity so records from separate systems are not merged or mislabeled.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/organizationQueryAction.do',
    [
      'The official public Organization (P-5) Query entry displays its current operator-selection, organization-status, organization-type, and P-5-related date criteria labels and the route used for one query attempt.',
      'The article records only criteria actually used, navigation steps that occurred, and bounded retrieval state. It does not submit a filing or reproduce an actual property query.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/',
    [
      'The official data-set directory identifies organizations with an Organization Report (Form P-5) as a separate downloadable source context.',
      'The article uses that context only to identify a neutral next retrieval route; it does not treat a name, number, address, or status as a property connection or legal conclusion.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding fair-assessment explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Organization (P-5) Query through its entry route, criteria snapshot, navigation steps, result-header state, result-row labels, access timestamp, source limits, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique warm public-record counter and people-free strict-overhead cool-slate technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed query criteria and labels, organization-information and daily-update context, separate record-access context, and published data limitations. None of the sources is used to establish property connection, title, ownership, acreage, lease effect, payee status, payment responsibility, entitlement, compliance, production, value, or a transaction result.',
  'The article publishes no actual query values, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, organization conclusion, well conclusion, production result, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, result headers, and rows; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, engineering, geological, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real P-5 record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_organization_p5_query_retrieval_no_property_connection_title_ownership_acreage_lease_payment_entitlement_compliance_production_value_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
