#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '136';
process.env.MRX_ARTICLE_SLUG = 'mineral-rights-retained-evidence-source-scope-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0341';
process.env.MRX_SELECTION_RANK = '213';
process.env.MRX_EXPECTED_SOURCE_COUNT = '2';
process.env.MRX_ARTICLE_TITLE = 'Mineral Rights Retained Evidence Source-Scope Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'mineral rights retained evidence source scope';
process.env.MRX_INLINE_KEYWORD = 'mineral rights retained evidence source scope';
process.env.MRX_HERO_ALT =
  'A blank retained artifact rests on a circular evidence tray beside the exact source-scope worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank four-quadrant worksheet appears above the exact retained-evidence source-scope keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.archives.gov/records-mgmt/scheduling/basics',
    [
      'The current National Archives Records Basics page distinguishes source records, working files, information-system inputs, system content, outputs, and related record categories in the federal-records context.',
      'It supports only a descriptive organizational analogy for labeling a retained artifact and its stated scope. It creates no private retention duty, disposition schedule, authenticity result, mineral-rights rule, or transaction conclusion.',
    ],
  ],
  [
    'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    [
      'NIST FIPS 180-4 specifies secure hash algorithms that generate message digests used to detect whether messages changed after the digests were generated.',
      'It supports only the byte-change boundary for an already-available integrity reference. A digest does not prove provenance, authorship, authenticity, identity, accuracy, completeness, legal effect, relevance, authority, or ownership.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding predatory-tactics identity and owns one distinct deliverable: a blank source-scope and source-limitation worksheet for one already-retained artifact and one capture event.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique circular-tray single-artifact hero and strict-overhead four-quadrant blank worksheet are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to the current official NARA federal-records categories and the current NIST Secure Hash Standard description of message-digest change detection.',
  'The article invents no entity, person, address, instrument, file, source value, digest, property, offer, transaction, legal effect, identity, authority, ownership, or conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, covers one already-retained artifact and one capture event, uses bounded bracketed labels, and sends real values and integrity references to an authorized controlled record.',
  'Image text is limited to the exact title and keyword and adds no source result, identity, authority, authenticity, completeness, ownership, legal, value, fairness, scam, offer-quality, or transaction claim.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'two_distinct_https_sources',
  'current_primary_source_http_review_pass',
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
  'one_already_retained_artifact_blank_source_scope_source_limitation_record_no_search_retrieval_download_comparison_real_or_fictional_data_digest_disclosure_authenticity_identity_authority_completeness_relevance_ownership_value_fairness_legal_effect_or_transaction_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
