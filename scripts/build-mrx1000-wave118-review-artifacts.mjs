#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '118';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-edms-injection-disposal-permit-document-retrieval-provenance-worksheet';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0308';
process.env.MRX_SELECTION_RANK = '195';
process.env.MRX_EXPECTED_SOURCE_COUNT = '4';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC EDMS Injection/Disposal Permit Document Retrieval Provenance Worksheet';
process.env.MRX_PRIMARY_KEYWORD =
  'Texas RRC EDMS injection disposal permit document retrieval';
process.env.MRX_INLINE_KEYWORD =
  'Texas RRC EDMS injection disposal permit document retrieval';
process.env.MRX_HERO_ALT =
  'A one-hand EDMS permit-document retrieval desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A people-free overhead permit-document evidence-transfer system appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The official research-query directory separately identifies the Electronic Document Management System, labels it nightly, warns against automated volume retrieval, and supplies the current official entry route.',
      'The directory states that online query data are informational, continually updated, non-authoritative, and without legal force; it does not establish permit effect, well status, compliance, property connection, ownership, title, payment, value, or a transaction conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-edms/',
    [
      'The official About EDMS page describes H-1, H-1A, and W-14 application and correspondence images, applications beginning September 2000, source-displayed application categories, signed-approved-file image timing, older H-5 coverage, and separate adjacent routes.',
      'The article uses those statements as dated source coverage and availability notes only, not as proof of current permit validity, approval effect, compliance, safety, environmental condition, or legal effect.',
    ],
  ],
  [
    'https://webapps.rrc.texas.gov/eds/eds_searchUic.xhtml',
    [
      'The current official application is labeled Search Injection/Disposal Permit Application Documents and visibly exposes Tracking Number, Group Results By, Permit Number, Document Type, Field, Operator, Lease, District, County, and RRC Stamp Date criteria plus result and document-list fields.',
      'The application states that all entered criteria must be present for an application to display and supplies specific criteria-count instructions; the article distinguishes its initial default zero-result screen from a valid completed empty search.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
    [
      'The official query-information page identifies the separately routed Injection-Storage Permit Query and supplies general oil-and-gas query scope context.',
      'The article uses that page only to enforce route separation and makes no completeness, permit, well, property, ownership, production, value, compliance, or legal claim.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article fully rejects the colliding unfair-offer identity and owns one distinct administrative reader job: preserve a reproducible provenance trail for one authorized manual Texas RRC EDMS injection/disposal permit application-document search attempt.',
  'Exact-title hero/share OCR and in-body keyword OCR passed. The low-oblique single-hand records desk and people-free strict-overhead circular evidence-transfer scene are materially distinct in camera angle, composition, subject arrangement, evidence scene, and function.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to four current official RRC surfaces, route identity, visible search and result labels, source-displayed search mechanics, dated coverage and availability statements, adjacent-route separation, and source-scope limitations. None establishes well status, permit validity, approval effect, compliance, safety, environmental condition, property connection, ownership, title, payment, acreage, production, reserves, value, offer quality, legal effect, or a transaction conclusion.',
  'The article publishes no actual tracking, permit, operator, field, lease, API, well, district, county, date, party, result, status, document, property, owner, payment, production, reserve, value, offer, or transaction data.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article keeps EDMS application-document search separate from Injection-Storage Permit Query, Injection and Disposal Query, Oil and Gas Imaged Records, H-9, H-10, completions, drilling permits, production, hearings, wellbore, automation, bulk retrieval, and every offer-evaluation or inference task.',
  'Image text is limited to the exact title and keyword and adds no identifier, permit status, result, seal, logo, property, ownership, payment, production, value, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'four_distinct_https_sources',
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
  'texas_rrc_edms_one_manual_application_document_search_default_state_separation_no_adjacent_route_automation_bulk_permit_well_compliance_safety_environment_property_title_ownership_payment_acreage_production_reserve_value_offer_legal_or_transaction_conclusion_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
