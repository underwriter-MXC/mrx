#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '85';
process.env.MRX_ARTICLE_SLUG = 'andrews-county-mineral-rights-public-record-locator';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0741';
process.env.MRX_SELECTION_RANK = '165';
process.env.MRX_EXPECTED_SOURCE_COUNT = '8';
process.env.MRX_ARTICLE_TITLE =
  'How to Build an Andrews County Mineral Rights Public-Record Locator';
process.env.MRX_PRIMARY_KEYWORD = 'Andrews County mineral rights public-record locator';
process.env.MRX_INLINE_KEYWORD = 'Andrews County mineral rights public-record locator';
process.env.MRX_HERO_ALT = 'An Andrews County records desk appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A top-down four-source locator worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.co.andrews.tx.us/322/Online-Official-Public-Records-Search',
    [
      'The official Andrews County page identifies the County Clerk as recorder and custodian of official public records, links the county-selected online search portal, states a normal two-to-three-business-day posting interval from filing, and lists explicit limits on title, validity, ownership, and legal-opinion work.',
      'The article uses the page only to preserve the official starting page, linked portal, field entered, displayed index identifier, search date, normal posting note, and county-stated limitation; it does not conduct or imply a title search.',
    ],
  ],
  [
    'https://www.co.andrews.tx.us/181/County-Clerk',
    [
      'The official County Clerk page identifies land and real-property records among the office records and notes that some records may be closed by law.',
      'The article uses the page only to identify the responsible office and route a record-access question; it does not assume every record is online, open, complete, or sufficient.',
    ],
  ],
  [
    'https://andrewscad.org/',
    [
      'The official Andrews County Appraisal District site identifies the district appraisal role and links its property-search system.',
      'The article uses the site only to preserve the official route into the appraisal search and the system role; it does not convert an appraisal record or value into title, ownership, mineral-sale value, or transaction evidence.',
    ],
  ],
  [
    'https://esearch.andrewscad.org/',
    [
      'The Andrews CAD search interface exposes fields including owner, address, abstract, property ID, owner ID, Geographic ID, tax year, property type, and subdivision and displays research-use limitations for legal descriptions and acreage.',
      'The article uses the interface only to record the exact field and displayed identifier used for a reproducible administrative lead; it does not publish a real owner search or treat appraisal data as legal or valuation proof.',
    ],
  ],
  [
    'https://www.glo.texas.gov/archives-heritage/search-our-collections/land-grant-search',
    [
      'The Texas General Land Office land-grant search provides historical fields such as county, abstract, original grantee, patentee, file number, certificate, patent data, survey, block, and township.',
      'The article uses the system only to preserve a historical archive locator and its displayed identifier; it does not bridge that result to current ownership, acreage, title, or a private tract.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The Railroad Commission research directory links official regulatory query systems and describes online data as informational and continually updated rather than authoritative legal records.',
      'The article uses the directory only to choose and log the exact regulatory system and query field; it does not treat a result as ownership, title, lease, payment, development, or value evidence.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/resource-center/research/gis-viewer/',
    [
      'The Railroad Commission GIS page describes map and popup use and states that displayed datasets are informational, may be approximate, and have no legal force.',
      'The article uses a GIS result only as a separately labeled map locator with the system limitation preserved; it does not establish a boundary, survey, tract match, well-to-interest connection, or value conclusion.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The Railroad Commission well-records page describes well-file access and useful request identifiers including county, operator, field, lease or well name and number, Commission identifiers, survey, abstract, section, and block.',
      'The article uses the page only to preserve a regulatory record request or locator row; it does not establish a private property connection, operating conclusion, production entitlement, ownership, or value.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article owns an Andrews-specific administrative source map: county starting page and Tyler route, normal posting note, county office limits, Andrews CAD entry point and search fields, historical GLO fields, and separate RRC query, GIS, and well-record roles. It does not repeat general county valuation or family-decision guidance.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The eye-level courthouse records desk and people-free strict-overhead four-source worksheet differ in camera angle, object arrangement, composition, and evidence function with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current official county, appraisal-district, GLO, and RRC access routes, displayed fields, identifiers, posting or update limitations, and source roles. No record system is converted into title, ownership, acreage, legal effect, tract connection, production, development, value, offer, or transaction proof.',
  'The article publishes no real owner name, property identifier, instrument result, tax account, API number, tract match, acreage, appraisal amount, mineral value, offer, royalty decimal, production number, or transaction fact and supplies no universal numerical conclusion.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article separates the four source roles, requires exact field and identifier capture, preserves access date and source limitation, labels conflicts and empty results without inference, routes restricted or interpretive work to the appropriate office or qualified professional, discloses possible MRX buyer interest, and preserves owner agency.',
  'Image text is limited to the exact article title and approved keyword and adds no owner, property, record result, seal, logo, title conclusion, ownership claim, acreage, price, value, offer, well, production, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_FACTUAL_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'eight_distinct_https_sources',
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
  'andrews_county_source_map_no_title_ownership_acreage_legal_effect_property_connection_production_value_offer_or_transaction_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
