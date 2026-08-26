#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '151';
process.env.MRX_ARTICLE_SLUG =
  'how-to-retrieve-recorded-mineral-deed-copy-for-cpa-handoff';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0652';
process.env.MRX_SELECTION_RANK = '223';
process.env.MRX_EXPECTED_SOURCE_COUNT = '6';
process.env.MRX_ARTICLE_TITLE =
  'How to Retrieve a Recorded Mineral Deed Copy for a CPA Handoff';
process.env.MRX_PRIMARY_KEYWORD = 'recorded mineral deed copy';
process.env.MRX_INLINE_KEYWORD = 'recorded mineral deed copy';
process.env.MRX_HERO_ALT =
  'A county archive retrieval counter appears beside the exact recorded-mineral-deed-copy article title.';
process.env.MRX_INLINE_ALT =
  'An overhead blank county-record retrieval log appears above the exact recorded mineral deed copy keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.11.pdf',
    [
      'Texas Property Code Chapter 11, including §11.001, supplies the county-of-recording context for an eligible real-property instrument.',
      'It supports office-identification context only. It does not identify the correct instrument for an owner, determine current ownership or title, interpret a deed, establish completeness, or support a tax, valuation, offer, or transaction conclusion.',
    ],
  ],
  [
    'https://statutes.capitol.texas.gov/Docs/LG/pdf/LG.191.pdf',
    [
      'Texas Local Government Code §§191.004 and 191.0041 supply the attested-copy obligation, fee context, and elements required for a certified copy made from an original document on file with a county clerk.',
      'They support plain-versus-certified source context only. The article does not choose a copy type, claim certification proves ownership or legal effect, or decide whether a copy is sufficient for a professional purpose.',
    ],
  ],
  [
    'https://www.tarrantcountytx.gov/en/county-clerk/real-estate-records/copies-of-official-public-records--real-property-.html',
    [
      'The current Tarrant County Clerk page supplies four copy routes, free unofficial watermarked-copy context, online certified-copy routing, current in-person and mail copy-fee examples, and the no-title-search or restriction-determination boundary.',
      'It supports a dated county example only. The article does not generalize Tarrant methods or fees statewide, purchase a copy, promise availability, conduct a title search, or determine restrictions.',
    ],
  ],
  [
    'https://www.tarrantcountytx.gov/en/county-clerk/real-estate-records/central-library-faqs--frequently-asked-questions-.html',
    [
      'The current Tarrant County Central Library FAQ confirms that deeds and related real-estate records can be printed or certified, that the public may use the designated official-records search, and that staff do not provide legal advice or perform the user\'s search.',
      'It supports current navigation and professional-boundary context only. It does not establish which deed is operative, prove title, or authorize legal interpretation.',
    ],
  ],
  [
    'https://www.cclerk.hctx.net/applications/websearch/RP.aspx/Registration/Home.aspx',
    [
      'The current Harris County Clerk portal supplies supported real-property search fields, stated online image coverage, posting-delay context, the warning that the online database is not the official repository, and plain or certified copy ordering routes.',
      'It supports a second current county example and negative-result limitations only. The article does not treat its fields, range, delay, copy options, or certification format as universal.',
    ],
  ],
  [
    'https://www.cclerk.hctx.net/applications/websearch/PublicRecords.aspx',
    [
      'The current Harris County Clerk public-records page supplies free watermarked viewing, paper and electronic copy routes, current plain and certified fee examples, a search-fee condition, and the owner-name and legal-description deed-request context.',
      'It supports a dated county example only. The article does not quote Harris fees as statewide, infer owner identity or a legal description, recommend purchasing a format, or claim the resulting copy resolves title or tax questions.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article rejects the broad cash-offer tax-question factory identity and owns one distinct deliverable: a source-linked county-clerk retrieval, provenance, unaltered-copy, receipt, limitation, and CPA-handoff record.',
  'Exact-title hero/share OCR and exact-keyword in-body OCR passed. The low-oblique archive-counter hero and bright strict-overhead retrieval-log image are materially distinct and contain no person, county, identifier, deed text, seal, amount, tax result, title conclusion, offer conclusion, or recommendation.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current Texas recording and copy statutes plus current Tarrant and Harris County Clerk search, access, certification, fee, and limitation examples.',
  'The article invents no county, person, entity, instrument, document number, recording date, volume or page, legal description, property, ownership fact, deed meaning, tax fact, amount, offer, calculation, or professional conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The reusable public record contains blank administrative pointers only, keeps source copies and transaction details inside an authorized system, and stops at the CPA, attorney, or title professional before interpretation, completeness, ownership, title, validity, priority, basis, character, filing, retention, offer, valuation, or transaction decisions.',
  'Image text is limited to the exact title and keyword and adds no county affiliation, seal, deed facsimile, legal conclusion, title evidence, tax result, valuation result, offer result, recommendation, or promised outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'six_distinct_https_sources',
  'current_primary_source_http_review_pass',
  'claim_to_source_scope_present',
  'official_texas_statute_and_county_clerk_source_priority_pass',
  'tarrant_and_harris_county_variability_boundary_verified',
  'unsupported_high_risk_claim_scan_pass',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'county_record_copy_retrieval_provenance_unaltered_source_receipt_limitation_and_cpa_handoff_only_no_ownership_title_deed_validity_legal_effect_reservation_record_priority_completeness_sufficiency_basis_gain_character_tax_offer_valuation_transaction_or_owner_specific_advice_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_person_county_identifier_deed_facsimile_seal_property_tax_amount_offer_or_unsupported_visual_claim',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
