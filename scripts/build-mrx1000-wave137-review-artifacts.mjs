#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '137';
process.env.MRX_ARTICLE_SLUG =
  'sec-edgar-mineral-rights-offeror-filing-search-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0342';
process.env.MRX_SELECTION_RANK = '214';
process.env.MRX_EXPECTED_SOURCE_COUNT = '2';
process.env.MRX_ARTICLE_TITLE =
  'SEC EDGAR Mineral Rights Offeror Filing Search Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD = 'SEC EDGAR mineral rights offeror filing search';
process.env.MRX_INLINE_KEYWORD = 'SEC EDGAR mineral rights offeror filing search';
process.env.MRX_HERO_ALT =
  'An oblique public-filings research station appears beside the exact SEC EDGAR offeror worksheet title.';
process.env.MRX_INLINE_ALT =
  'A top-down blank search-attempt worksheet appears above the exact SEC EDGAR offeror filing-search keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.sec.gov/search-filings',
    [
      'The current SEC Search Filings page describes free public EDGAR access, a company search that accepts a name, ticker symbol, or CIK, match options, and access to registration statements, periodic reports, and other forms.',
      'It supports only accurate description and attempt-level recording of the current official company-search route and its source-displayed fields. It does not verify an offer sender, reconcile names, establish legitimacy or authorization, prove financial capacity, connect a filer to property, validate an offer, or supply a legal or transaction conclusion.',
    ],
  ],
  [
    'https://www.sec.gov/edgar/search/',
    [
      'The current SEC EDGAR Full Text Search page displays keyword, ticker, company-name, CIK, filing-type, entity, location, and related filters plus result columns including form, filed date, reporting-for field, filing entity or person, and CIK.',
      'It supports only source-preserving transcription for one manual search attempt and one route. It does not establish identity, filing relevance, contractual meaning, legitimacy, authorization, solvency, funding, offer quality, fair value, or a due-diligence result.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the colliding cash-offer evaluation identity and owns one distinct deliverable: a blank provenance record for one authorized manual SEC EDGAR route and one offeror-specific search attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique public-filings station and strict-overhead blank attempt worksheet are materially distinct compositions.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current source-displayed inputs, match or filter controls, filing categories, and result columns on the two official SEC routes.',
  'The article invents no filer, entity, person, CIK, ticker, filing, offer, correspondence, address, property, result, identity match, capacity statement, legal effect, or transaction conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public worksheet is blank, covers one manual route and one attempt, separates retained correspondence from SEC evidence, places non-verification warnings beside result and outcome fields, and stops at authorized-human review.',
  'Image text is limited to the exact title and keyword and adds no identity, legitimacy, authorization, capacity, affiliation, offer-quality, value, legal, filing-relevance, or transaction claim.',
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
  'one_authorized_manual_sec_edgar_route_and_attempt_source_displayed_fields_only_separate_correspondence_and_filing_evidence_controlled_outcomes_no_identity_legitimacy_capacity_offer_quality_legal_valuation_or_transaction_conclusion_authorized_human_stop_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
