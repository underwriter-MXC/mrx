#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '97';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-gas-proration-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0280';
process.env.MRX_SELECTION_RANK = '177';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Gas Proration Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Gas Proration query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Gas Proration query retrieval';
process.env.MRX_HERO_ALT =
  'A Texas gas-proration query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead gas-proration query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/', ['The official RRC directory identifies the Gas Proration Schedule Query as a named public route and supplies bounded query-system context.', 'The article records the named route, access time, and published context without treating a query result as complete, legally controlling, connected to private property, or sufficient for a downstream conclusion.']],
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/', ['The official Oil and Gas Data Queries page supplies bounded context for the RRC query environment.', 'The article uses that context only to identify the public query environment and preserves uncertainty about individual results, records, and relationships.']],
  ['https://webapps2.rrc.texas.gov/EWA/gasProQueryAction.do', ['The official Gas Proration Schedule Query entry displays the separately named route and current criteria labels for one query attempt.', 'The article records only criteria actually used, source-displayed instructions, navigation steps that occurred, and bounded retrieval state. It does not submit an actual property query or reproduce an actual result.']],
  ['https://webapps2.rrc.texas.gov/EWA/help/Gas_Proration_TOC.html', ['The official Gas Proration contents page identifies the query-specific help path and its named sections.', 'The article uses that path only as a retained source reference and does not treat it as evidence of an individual field, operator, well, lease, or production conclusion.']],
  ['https://webapps2.rrc.texas.gov/EWA/help/Gas_Proration_HowTo.html', ['The official help page supplies bounded district, identifier, field, operator, and navigation instructions.', 'The article preserves separate retrieval steps and does not interpret a selected district, identifier, field, operator, or result.']],
  ['https://webapps2.rrc.texas.gov/EWA/help/GasProration_About.html', ['The official about page supplies bounded Gas Proration query context.', 'The article uses that context only to distinguish source labels and retained references from any conclusion about records, operations, production, value, or transactions.']],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Gas Proration Schedule Query attempt through its entry route, criteria snapshot, visible instructions, navigation steps, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique warm public-record counter and people-free strict-overhead cool-slate technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed Gas Proration Schedule Query criteria and instructions, separate route identity, query-help context, and published limitations. None of the sources is used to establish property connection, title, ownership, acreage, lease effect, payment responsibility, entitlement, compliance, environmental condition, operating status, production, value, or a transaction result.',
  'The article publishes no actual query values, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, production conclusion, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, query-screen labels, links, and routes; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, environmental, engineering, geological, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'six_distinct_https_sources', 'current_source_access_review_pass', 'claim_to_source_scope_present', 'official_source_priority_pass', 'unsupported_high_risk_claim_scan_pass']);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'hero_share_sha256_identity', 'inline_image_distinct_sha256', 'exact_text_ocr_pass', 'filename_text_identity_pass', 'texas_rrc_gas_proration_query_retrieval_no_property_connection_title_ownership_acreage_lease_payment_entitlement_compliance_environmental_operating_status_production_value_offer_or_transaction_conclusion_boundary_pass', 'owner_agency_and_possible_buyer_interest_disclosure_preserved', 'no_unsupported_visual_or_decision_claims']);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
