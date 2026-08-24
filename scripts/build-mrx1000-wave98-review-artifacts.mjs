#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '98';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-injection-storage-permit-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0281';
process.env.MRX_SELECTION_RANK = '178';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Injection-Storage Permit Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC injection-storage permit query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC injection-storage permit query retrieval';
process.env.MRX_HERO_ALT =
  'An injection-storage permit query research counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead injection-storage permit query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/', ['The official RRC directory identifies public research-query context and provides the entry point to the agency query environment.', 'The article records the named route, access time, and bounded query-system context without treating a query result as complete, legally controlling, connected to private property, or sufficient for a downstream conclusion.']],
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/', ['The official Oil and Gas Data Queries page describes the Underground Injection Control query as a separate public query slice and lists its bounded searchable criteria.', 'The article uses this page only to identify the UIC query environment and preserves uncertainty about individual results, records, and relationships.']],
  ['https://www.rrc.texas.gov/oil-and-gas/applications-and-permits/injection-storage-permits/resources/', ['The official Injection-Storage Resources page identifies the Injection-Storage Permit Query among separate agency resources and query channels.', 'The article uses the page only to preserve the official route family and does not infer a permit, well, property, compliance, operational, or transaction fact.']],
  ['https://webapps2.rrc.texas.gov/EWA/ewaMain.do', ['The official Oil & Gas Data Query main page identifies Injection-Storage Permit Query as a named route among separate query types.', 'The article uses the menu label only to preserve an entry path; it does not collapse record classes or draw any conclusion from a displayed result.']],
  ['https://webapps2.rrc.texas.gov/EWA/uicQueryAction.do', ['The official Injection-Storage Query entry displays the separately named route and current criteria labels for one query attempt.', 'The article records only criteria actually used, source-displayed instructions, navigation steps that occurred, and bounded retrieval state. It does not submit an actual property query or reproduce an actual result.']],
  ['https://webapps2.rrc.texas.gov/EWA/help/UICGeneralHowTo.html', ['The official UIC Query help supplies bounded search, navigation, result-limit, and result-detail context.', 'The article preserves separate retrieval steps and does not interpret a selected well type, district, identifier, county, field, operator, UIC number, date, status, or result.']],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC UIC / Injection-Storage Permit Query attempt through its entry route, criteria snapshot, visible instructions, navigation steps, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique limestone-and-steel public-record counter and people-free strict-overhead slate technical worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed UIC / Injection-Storage Permit Query criteria and instructions, separate route identity, query-help context, and published limitations. None of the sources is used to establish property connection, title, ownership, acreage, lease effect, permit compliance, operating condition, injection activity, production, economics, value, or a transaction result.',
  'The article publishes no actual query values, owner document, signature, address, legal description, property identifier, result screenshot, operator allegation, operational conclusion, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, query-screen labels, links, and routes; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, operational, engineering, geological, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, result, signature, seal, logo, acreage, legal conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'six_distinct_https_sources', 'current_source_access_review_pass', 'claim_to_source_scope_present', 'official_source_priority_pass', 'unsupported_high_risk_claim_scan_pass']);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'hero_share_sha256_identity', 'inline_image_distinct_sha256', 'exact_text_ocr_pass', 'filename_text_identity_pass', 'texas_rrc_injection_storage_permit_query_retrieval_no_property_connection_title_ownership_acreage_lease_permit_compliance_operating_condition_injection_activity_production_economics_value_offer_or_transaction_conclusion_boundary_pass', 'owner_agency_and_possible_buyer_interest_disclosure_preserved', 'no_unsupported_visual_or_decision_claims']);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
