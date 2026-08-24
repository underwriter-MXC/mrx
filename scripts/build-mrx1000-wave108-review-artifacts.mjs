#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '108';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-g-10-w-10-well-status-report-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0293';
process.env.MRX_SELECTION_RANK = '188';
process.env.MRX_EXPECTED_SOURCE_COUNT = '7';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC G-10/W-10 Well Status Report Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC G-10/W-10 Well Status Report Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC G-10/W-10 Well Status Report Query retrieval';
process.env.MRX_HERO_ALT =
  'Two source-neutral route gates appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead two-route ledger appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  ['https://www.rrc.texas.gov/resource-center/research/research-queries/', ['The official directory supplies the Well Status Report Query (W-10, G-10) label, launch relationship, nightly update label, and online-query limitations.', 'The article preserves only route provenance and limitations, not a substantive conclusion.']],
  ['https://webapps.rrc.texas.gov/GW10/publicHomeAction.do', ['The official GW10 home supplies the G-10/W-10 application title and the Individual Well Status Reports and Report Summary Status choices.', 'The article records the chosen path and navigation only and does not merge the two result types or interpret status.']],
  ['https://webapps.rrc.texas.gov/GW10/help/gw10PublicQueryHelp.html', ['The official main help page describes the two source-labeled searches and view, print, save, and PDF mechanics.', 'The article uses these as retrieval mechanics only.']],
  ['https://webapps.rrc.texas.gov/GW10/gw10PublicProcessLogSearchAction.do?methodToCall=init', ['The Individual Well Status Reports route supplies source-displayed process-status, report-type, filing-reason, date, district, identifier, field, operator, and tracking criteria.', 'The article records labels and controlled criteria without interpreting any value.']],
  ['https://webapps.rrc.texas.gov/GW10/gw10PublicSearchAction.do?methodToCall=init', ['The Report Summary Status route supplies source-displayed submission-status, report-type, filing-reason, date, district, identifier, field, operator, and tracking criteria.', 'The article records labels and controlled criteria without interpreting any value.']],
  ['https://webapps.rrc.texas.gov/GW10/help/gw10PublicQueryHelpProcessed.html', ['The official Individual Well Status Reports help supplies bounded query, navigation, result, and PDF guidance.', 'The article preserves only mechanics and source wording.']],
  ['https://webapps.rrc.texas.gov/GW10/help/gw10PublicQueryHelpSummary.html', ['The official Report Summary Status help supplies bounded query, navigation, result, and PDF guidance.', 'The article preserves only mechanics and source wording.']],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation explainer with one administrative job: preserve a reproducible provenance trail for one GW10 attempt and its explicitly chosen source-labeled path.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique dark two-gate station and strict-overhead pale two-route ledger are materially distinct in angle, composition, palette, objects, and evidence function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to seven current official RRC routes, exact source labels, query-path separation, source-displayed criteria, help navigation, and PDF mechanics. None establishes substantive status, compliance, condition, production, property, ownership, title, value, legal, offer, or transaction conclusions.',
  'The article publishes no actual report, status, lease or gas-well ID, field, operator, tracking number, result, screenshot, PDF, property identifier, production, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps GW10 separate from H-10, Wellbore, RRC OIL, production, and all other routes; preserves uncertainty and stops before regulatory, legal, title, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no record, identifier, result, signature, seal, logo, status, approval, rejection, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match','seven_distinct_https_sources','current_source_access_review_pass','claim_to_source_scope_present','official_source_priority_pass','unsupported_high_risk_claim_scan_pass']);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify(['complete_file_sha256_match','hero_share_sha256_identity','inline_image_distinct_sha256','exact_text_ocr_pass','filename_text_identity_pass','texas_rrc_g10_w10_retrieval_no_status_report_compliance_condition_production_property_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass','owner_agency_and_possible_buyer_interest_disclosure_preserved','no_unsupported_visual_or_decision_claims']);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
