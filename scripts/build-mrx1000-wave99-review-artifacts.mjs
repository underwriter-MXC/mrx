#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '99';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-severance-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0282';
process.env.MRX_SELECTION_RANK = '179';
process.env.MRX_EXPECTED_SOURCE_COUNT = '7';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Severance Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC severance query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC severance query retrieval';
process.env.MRX_HERO_ALT =
  'A public-record archive counter appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead severance-query provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/', ['The official RRC Research Queries directory supplies the agency public-query context and entry route.', 'The article records the route, access time, and bounded query-system context without treating a result as complete, legally controlling, connected to private property, or sufficient for a downstream conclusion.']],
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/', ['The official Oil and Gas Data Queries page identifies Severance Query as a separate public query slice and describes its bounded purpose and criteria context.', 'The article uses the page only to identify the official query environment and preserves uncertainty about individual records and relationships.']],
  ['https://webapps2.rrc.texas.gov/EWA/ewaMain.do', ['The official Oil & Gas Data Query main page identifies Severance Query as a named route among separate query types.', 'The article uses the menu label only to preserve an entry path and does not collapse record classes or draw a conclusion from a displayed result.']],
  ['https://webapps2.rrc.texas.gov/EWA/severanceQueryAction.do', ['The official Severance Query entry displays the separately named route and current source labels for one retrieval attempt.', 'The article records only criteria actually used, source-displayed instructions, navigation that occurred, and bounded retrieval state. It does not submit or reproduce an actual property-specific query result.']],
  ['https://webapps2.rrc.texas.gov/EWA/help/Severance_TOC.html', ['The official Severance Query help table of contents preserves the source navigation and help context.', 'The article uses the help route only to document the source path and does not infer the meaning or legal effect of a query result.']],
  ['https://webapps2.rrc.texas.gov/EWA/help/Severance_HowTo.html', ['The official Severance Query How To page provides bounded search, result-column, navigation, and displayed result-limit context.', 'The article preserves those source-stated labels and limitations without deciding severance status, compliance, production, property connection, or another downstream fact.']],
  ['https://www.rrc.texas.gov/oil-and-gas/compliance-enforcement/severance-reconnect-process/', ['The official Severance/Reconnect Process page is a separate explanatory route about the agency process.', 'The article keeps that explanatory page separate from query retrieval and does not use a query result to decide compliance, reconnection eligibility, or legal effect.']],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Severance Query retrieval attempt through its route, criteria snapshot, visible instructions, result/help navigation, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The eye-level dark archive counter and people-free strict-overhead pale worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed Severance Query criteria and instructions, separate route identity, help context, result-column labels, displayed record-limit context, and published limitations. None is used to establish severance status, legal effect, compliance, reconnection eligibility, production, property connection, title, ownership, acreage, lease effect, value, offer quality, or a transaction result.',
  'The article publishes no actual query value, owner document, address, property identifier, result screenshot, operator allegation, compliance conclusion, production conclusion, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates query criteria, result/help navigation, and the agency explanatory route; converts gaps into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, result, signature, seal, logo, acreage, compliance conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'seven_distinct_https_sources', 'current_source_access_review_pass', 'claim_to_source_scope_present', 'official_source_priority_pass', 'unsupported_high_risk_claim_scan_pass']);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'hero_share_sha256_identity', 'inline_image_distinct_sha256', 'exact_text_ocr_pass', 'filename_text_identity_pass', 'texas_rrc_severance_query_retrieval_no_severance_status_legal_effect_compliance_reconnect_eligibility_production_property_connection_title_ownership_acreage_lease_value_offer_or_transaction_conclusion_boundary_pass', 'owner_agency_and_possible_buyer_interest_disclosure_preserved', 'no_unsupported_visual_or_decision_claims']);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
