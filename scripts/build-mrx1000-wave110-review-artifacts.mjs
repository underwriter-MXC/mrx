#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '110';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-h-9-query-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0295';
process.env.MRX_SELECTION_RANK = '189';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC H-9 Query Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'Texas RRC H-9 Query retrieval';
process.env.MRX_INLINE_KEYWORD = 'Texas RRC H-9 Query retrieval';
process.env.MRX_HERO_ALT =
  'An upright source-neutral H-9 route card appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead H-9 provenance worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official directory supplies the H-9 Certificate of Compliance Statewide Rule 36 query label, nightly update label, and online-query limitations.',
      'The article preserves route provenance and limitations only and does not interpret a filing, certificate, rule, status, or compliance condition.',
    ],
  ],
  [
    'https://webapps.rrc.state.tx.us/H9/publicquery.xhtml',
    [
      'The official H-9 application supplies current query labels, controlled choices, result labels, and the separately named Mainframe or Legacy Certification Lookup.',
      'The article records one chosen route and its displayed state without merging channels or interpreting any value.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/announcements/092419-rrc-launches-h-9-certificate-of-compliance-statewide-rule-36-query/',
    [
      'The official launch notice supplies the H-9 query-option labels and directs requests for records before July 15, 2019 to Imaged Records.',
      'The article uses the notice only for source-route and legacy-channel provenance.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/oil-and-gas-forms/',
    [
      'The official forms directory supplies bounded H-9 form and instruction context.',
      'The article does not explain how to complete, file, approve, contest, or rely on a form.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/publications-and-notices/publications/swr36-index/',
    [
      'The official Statewide Rule 36 index supplies the publication and manual context associated with H-9.',
      'The article does not interpret the rule, decide applicability, or make a compliance conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/imaged-records/',
    [
      'The official Imaged Records page supplies bounded retrieval context for older records.',
      'The article records a separate legacy channel only and does not claim equivalence, completeness, authenticity, or legal effect.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation explainer with one administrative reader job: preserve a reproducible provenance trail for one official H-9 query attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The dark low-oblique upright route-card station and pale strict-overhead blank worksheet are materially distinct in angle, composition, palette, objects, and evidence function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to six current official RRC sources, route identity, exact query labels, current-versus-legacy channel separation, source-displayed criteria and state labels, and retrieval mechanics. None establishes substantive status, compliance, regulatory condition, production, property, ownership, title, value, legal effect, offer, or transaction conclusions.',
  'The article publishes no actual certificate, filing, controlled value, result, screenshot, record, property identifier, production statement, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps H-9 separate from H-10, G-10/W-10, P-5 renewal, Organization P-5, Field Search, Drilling Permit, and all other routes; preserves uncertainty; and stops before regulatory, legal, title, operational, production, valuation, offer, or transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no certificate, filing, identifier, result, signature, seal, logo, status, approval, value, recommendation, guarantee, or transaction outcome.',
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
  'texas_rrc_h9_retrieval_no_certificate_filing_status_rule_compliance_production_property_title_ownership_value_legal_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
