#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '87';
process.env.MRX_ARTICLE_SLUG =
  'how-to-build-a-mineral-rights-valuation-evidence-cutoff-log';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0271';
process.env.MRX_SELECTION_RANK = '167';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE =
  'How to Build a Mineral Rights Valuation Evidence-Cutoff Log';
process.env.MRX_PRIMARY_KEYWORD = 'mineral rights valuation evidence cutoff log';
process.env.MRX_INLINE_KEYWORD = 'mineral rights valuation evidence cutoff log';
process.env.MRX_HERO_ALT =
  'A dated evidence-control worksheet and source files appear beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down six-column evidence-cutoff worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official RRC directory identifies production, permit, well-record, and other research systems together with update-frequency labels.',
      'The article preserves the exact system and query path and repeats the RRC boundary that online datasets are informational, non-authoritative, continually updated, and without legal force.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The official RRC production page describes compilations and summaries of production information reported by Texas operators.',
      'The article uses the page only to define the regulatory source class, locator, reporting period, access date, and source limitation; it draws no ownership, payment, property-connection, production-forecast, or value conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
    [
      'The official PDQ FAQs explain Texas oil reporting level, reporting lag, revisions, corrections, delinquent-report changes, snapshot status, monthly updates, and the displayed coverage period.',
      'The article uses those stated limits only to justify distinct metadata fields and rejects treating a query result as proof of completeness, property connection, or suitability.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The official well-records page identifies useful file-locator fields and record-period context.',
      'The article preserves the Commission boundary that it lacks authority over private leases, royalties, payments, and property-right matters and therefore draws no private-rights conclusion from a well-record locator.',
    ],
  ],
  [
    'https://www.archives.gov/records-mgmt/scheduling/basics',
    [
      'The official National Archives page distinguishes source records, working files, information-system inputs and content, and outputs in the federal records-management context.',
      'The article uses that distinction only as an organizational analogy and expressly states that it creates no private mineral-owner retention rule, legal duty, or disposition schedule.',
    ],
  ],
  [
    'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_m.htm',
    [
      'The official EIA page supplies a bounded example of public-series metadata including product, geography, unit, period, history route, release date, and source notes.',
      'The article records metadata only and adopts no displayed price as an owner realized price, forecast, contract price, valuation input, or private value conclusion.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article replaces a colliding valuation-assessment explainer with one administrative job: inventory the exact source objects present at a stated cutoff using stable file identity, distinct date roles, inclusion statuses, retained locators, source limitations, and unresolved gaps.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The eye-level evidence-control desk and people-free strict-overhead six-column worksheet differ materially in camera angle, subject arrangement, composition, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official RRC data roles and limitations, a federal records-management analogy, and EIA public-series metadata. None of the sources is used to validate a private file, assessment, valuation method, input, calculation, or conclusion.',
  'The article publishes no private owner document, signature, address, account data, payment instruction, property identifier, private amount, ownership or lease conclusion, production forecast, valuation input, price, value, offer, or transaction claim.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article separates source objects, working notes, later outputs, and later-received evidence; preserves version history and privacy; converts gaps into neutral requests; and stops before valuation, legal, operational, offer, or transaction decisions.',
  'Image text is limited to the exact article title and approved keyword and adds no real document text, owner identifier, signature, logo, seal, price, valuation output, recommendation, guarantee, or transaction outcome.',
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
  'evidence_cutoff_log_no_value_method_input_accuracy_review_reset_offer_or_transaction_conclusion_boundary_pass',
  'owner_agency_privacy_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
