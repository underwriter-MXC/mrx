#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '101';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-completions-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0284';
process.env.MRX_SELECTION_RANK = '181';
process.env.MRX_EXPECTED_SOURCE_COUNT = '7';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Completions Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC Completions Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC Completions Query retrieval';
process.env.MRX_HERO_ALT =
  'A blank completion-packet archive appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead Completions Query criteria worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/', ['The official RRC Research Queries directory supplies the separately named Completions Query route, nightly update label, and global online-query disclaimer.', 'The article uses the directory only to preserve the official entry route, source identity, update label, and limitation; it does not treat a result as authoritative, legally effective, complete, connected to private property, or sufficient for a downstream conclusion.']],
  ['https://webapps.rrc.texas.gov/CMPL/publicHomeAction.do', ['The official Oil & Gas Completions home separates Completions Query, Completions Package, Directional Survey Query, and reports, and displays its online-packet coverage statement.', 'The article uses the page only to preserve the route, displayed navigation, source-stated packet coverage, and separate production-data update statement without deciding a well, packet, production, regulatory, or property fact.']],
  ['https://webapps.rrc.texas.gov/CMPL/publicSearchAction.do?formData.headerTabSelected=home&formData.methodHndlr.inputValue=init&formData.pageForwardHndlr.inputValue=home', ['The official Completions Query search displays the all-selected-criteria behavior and current search labels for one retrieval attempt.', 'The article records only criteria actually used, source-displayed instructions, navigation that occurred, and bounded retrieval state. It does not submit or reproduce an actual property-specific result.']],
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/imaged-records-menu/', ['The official Imaged Records menu supplies separate well-record and historical-channel context plus its own completion-packet filing statement.', 'The article preserves that separate route and source wording without reconciling it into a property, well, filing, completion, or legal conclusion.']],
  ['https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/well-records-faqs/', ['The official Well Records FAQs describe the Completion Query route and categories of records that can appear in Oil & Gas Well Records.', 'The article uses the FAQ only to distinguish retrieval channels and preserve source wording; it does not infer that a named record exists, is complete, applies to a property, or proves a downstream fact.']],
  ['https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/', ['The official download page separately lists Completion Information in Data Format and Imaged Completion Files with current source-displayed update labels.', 'The article uses the page only to separate bulk-download provenance from the public query and does not treat a download as equivalent to a query result or as interpreted evidence.']],
  ['https://www.rrc.texas.gov/media/ilapc3ix/website-queries-how-to-stay-in-compliance-powerpoint-slides.pdf', ['The official RRC training slide deck supplies agency-authored website-query navigation context.', 'The article retains the deck only as bounded navigation context and does not use it to establish a current requirement, packet interpretation, compliance conclusion, property connection, or transaction decision.']],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding eligibility explainer with one administrative job: preserve a reproducible provenance trail for a single official RRC Completions Query retrieval attempt through its route, coverage statement, criteria snapshot, visible instructions, result or packet navigation, retained reference, bounded status, and neutral next question.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The oblique dark completion-packet archive and people-free strict-overhead pale criteria worksheet differ materially in camera angle, subject arrangement, composition, palette, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC routes, source-displayed Completions Query coverage, criteria and all-criteria instruction, navigation labels, separate historical or imaged-record channels, separate downloadable completion-data routes, and published limitations. None is used to establish that a well was completed, producing, permitted, active, compliant, commercially viable, connected to private mineral rights, owned by a named person, royalty-bearing, valuable, or suitable for a transaction.',
  'The article publishes no actual query value, API number, tracking number, drilling-permit number, packet, form, operator detail, property identifier, result screenshot, production claim, compliance conclusion, title claim, acreage, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article preserves source identity and uncertainty; uses only located, not located, or unverified; separates the public query, displayed packet, Imaged Records, downloads, production data, and any interpretation; converts source differences into neutral retrieval questions; controls private identifiers; and stops before legal, title, regulatory, engineering, geological, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real RRC record, identifier, packet, result, signature, seal, logo, owner, acreage, production or compliance conclusion, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'seven_distinct_https_sources', 'current_source_access_review_pass', 'claim_to_source_scope_present', 'official_source_priority_pass', 'unsupported_high_risk_claim_scan_pass']);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match', 'hero_share_sha256_identity', 'inline_image_distinct_sha256', 'exact_text_ocr_pass', 'filename_text_identity_pass', 'texas_rrc_completions_query_retrieval_no_completion_production_permitting_status_compliance_commercial_viability_property_connection_title_ownership_acreage_lease_royalty_value_offer_or_transaction_conclusion_boundary_pass', 'owner_agency_and_possible_buyer_interest_disclosure_preserved', 'no_unsupported_visual_or_decision_claims']);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
