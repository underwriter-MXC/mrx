#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '86';
process.env.MRX_ARTICLE_SLUG =
  'how-to-extract-shut-in-clause-conditions-before-a-valuation-review';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0270';
process.env.MRX_SELECTION_RANK = '166';
process.env.MRX_EXPECTED_SOURCE_COUNT = '7';
process.env.MRX_ARTICLE_TITLE =
  'How to Extract Shut-In Clause Conditions Before a Valuation Review';
process.env.MRX_PRIMARY_KEYWORD = 'shut-in clause conditions valuation review';
process.env.MRX_INLINE_KEYWORD = 'shut-in clause conditions valuation review';
process.env.MRX_HERO_ALT =
  'An open lease packet and clause worksheet appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down clause extraction worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.glo.texas.gov/energy/mineral-leasing/lease-maintenance',
    [
      'The official GLO page identifies state-lease maintenance record categories including shut-in payments and affidavits.',
      'The article uses the page only as a bounded public-administration example and expressly rejects importing state-lease requirements or outcomes into a private lease.',
    ],
  ],
  [
    'https://www.glo.texas.gov/energy/mineral-leasing/leasing',
    [
      'The official GLO leasing page supplies the state-leasing context and official form route.',
      'The article uses that route only to identify the source and public-example boundary; it does not substitute GLO materials for an owner controlling document stack.',
    ],
  ],
  [
    'https://www.glo.texas.gov/sites/default/files/2025-02/Form_Relinquishment_Act_Lease.pdf',
    [
      'The official GLO lease form demonstrates that trigger, covered subject, payment, timing, accompanying-record, duration, and cross-reference wording can occupy separate provisions.',
      'The article uses the form only to justify worksheet fields and labels it a state-lease example that supplies no private lease term, deadline, amount, filing duty, or legal result.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory links production, permit, well-record, and other regulatory systems and states that online data is informational and lacks legal force.',
      'The article requires the exact query, field, identifier, access date, and limitation to remain in a regulatory-context row rather than a private-contract conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The official RRC production page routes users to compilations and summaries of production information reported by operators.',
      'The article uses the page only to identify the regulatory source class and does not infer a shut-in cause, private clause trigger, production treatment, or value.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
    [
      'The official PDQ FAQs explain reporting level, reporting lag, revisions, and snapshot limitations.',
      'The article uses those limits to prevent a blank, zero, late, or changed row from becoming proof of a private contract condition or valuation effect.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official well-records page identifies useful file-locator fields and states that the Commission lacks authority over private lease, royalty, and property-right matters.',
      'The article uses a well record only as separately labeled regulatory context and does not establish a property connection, status, lease effect, entitlement, or value.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding shut-in valuation explainer with a single administrative job: extract source-located private clause wording, condition fields, cross-references, version conflicts, and neutral questions before qualified review.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The eye-level lease-review desk and people-free strict-overhead worksheet differ in camera angle, subject arrangement, composition, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official GLO and RRC source roles, form examples, record locators, reporting limits, and no-legal-force or no-private-authority boundaries. Private lease language remains controlling and is not supplied by a public example.',
  'The article publishes no owner document, signature, address, payment instruction, private amount, account detail, well-status finding, lease-effect conclusion, production forecast, valuation input, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article separates controlling contracts, performance records, regulatory context, and later professional conclusions; requires source locators and version control; converts ambiguity into neutral questions; and preserves owner privacy, agency, and possible MRX buyer-interest disclosure.',
  'Image text is limited to the exact article title and approved keyword and adds no real document text, signature, owner identifier, seal, logo, price, payment, status, lease-effect, production, valuation, offer, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'seven_distinct_https_sources',
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
  'shut_in_clause_extraction_no_status_lease_effect_payment_sufficiency_production_valuation_value_offer_or_transaction_boundary_pass',
  'owner_agency_privacy_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
