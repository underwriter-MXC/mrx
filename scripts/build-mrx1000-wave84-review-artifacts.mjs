#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '84';
process.env.MRX_ARTICLE_SLUG =
  'refrac-workover-event-claim-register-source-preserving-record-template';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0269';
process.env.MRX_SELECTION_RANK = '164';
process.env.MRX_ARTICLE_TITLE =
  'Refrac and Workover Event-Claim Register: A Source-Preserving Record Template';
process.env.MRX_PRIMARY_KEYWORD = 'refrac workover event claim register';
process.env.MRX_INLINE_KEYWORD = 'refrac workover event claim register';
process.env.MRX_HERO_ALT =
  'A source-separated event-claim register appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A blank overhead event-claim worksheet appears above the exact keyword.';
process.env.MRX_SOURCE_SCOPES_JSON = JSON.stringify([
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The Railroad Commission well-records page describes well-file channels, completion or recompletion records, and identifiers useful when locating or requesting a record.',
      'The article uses the page only to preserve a record identity, request path, source date, page or locator, and source-stated event wording; it does not interpret a filing or confirm an intervention.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records-online/',
    [
      'The Railroad Commission online well-records page explains how lease PDFs organize completion packets, drilling permits, plugging reports, transportation authority records, and miscellaneous documents.',
      'The article uses the page only to log the located PDF, profile, well or lease identifier, page, retrieval date, and exact source passage without deciding what the record proves.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/oil-and-gas-forms/',
    [
      'The Railroad Commission forms page lists official form names and revisions, including forms whose titles reference completion or recompletion.',
      'The article uses the page only to preserve the exact form name, revision, filing date if shown, identifier, and locator; it does not classify the operation or interpret the filing.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The Railroad Commission production-data page identifies official Texas production-query channels and describes reported production information.',
      'The article uses a dated result only to log displayed reporting periods and source identifiers as non-causal observations; it does not attribute a change to an event, forecast production, or estimate reserves or value.',
    ],
  ],
  [
    'https://www.sec.gov/search-filings',
    [
      'The SEC filing-search page provides public access to company filings and search tools for filer, form, filing date, and filing records.',
      'The article uses the page only to preserve the filer, form, filing date, accession or stable filing reference, and exact passage locator; it does not treat a company filing as property-specific event confirmation or interpret its economic meaning.',
    ],
  ],
]);
process.env.MRX_EDITORIAL_FINDINGS_JSON = JSON.stringify([
  'The article owns only a specialized pre-analysis register for unverified refrac, workover, or recompletion claims. It preserves exact source wording, identifiers, source and event dates, operator naming, limited connection status, non-causal reported periods, conflicts, unknowns, and follow-up assignments.',
  'Exact-title hero/share OCR passed and distinct in-body keyword OCR passed. The elevated front-facing source-folder hero and people-free strict-overhead blank worksheet use materially different camera angles, structures, objects, and evidence scenes with matching alt metadata.',
]);
process.env.MRX_FACTUAL_FINDINGS_JSON = JSON.stringify([
  'Claims remain bounded to current RRC well-record, online-record, form, and production-query channels plus SEC filing-search logistics. Each source role preserves source identity and agency limits and is not converted into event confirmation, causation, property connection, operational status, reserves, production forecast, or value.',
  'The article invents no event, operator, well, API number, property connection, production figure, decline curve, reserve estimate, valuation input, offer, owner, title, lease, payment, or transaction fact and supplies no universal numerical assumption or result.',
]);
process.env.MRX_COMPLIANCE_FINDINGS_JSON = JSON.stringify([
  'The article labels every event as a claim, separates sources and conflicts, limits connection labels, marks reported periods as non-causal, turns gaps into neutral questions, assigns follow-up without predetermining an answer, discloses possible MRX buyer interest, and preserves qualified-review boundaries.',
  'Image text is limited to the exact article title and approved keyword and adds no operator, well, property, source result, event conclusion, production figure, curve, reserve, value, verification, seal, recommendation, guarantee, or transaction outcome.',
]);
process.env.MRX_COMPLIANCE_CHECKS_JSON = JSON.stringify([
  'complete_file_sha256_match',
  'hero_share_sha256_identity',
  'inline_image_distinct_sha256',
  'exact_text_ocr_pass',
  'filename_text_identity_pass',
  'source_preserving_event_claim_register_no_confirmation_causation_curve_forecast_reserve_valuation_offer_or_property_decision_boundary_pass',
  'owner_agency_and_possible_buyer_interest_disclosure_preserved',
  'no_unsupported_visual_or_decision_claims',
]);

await import('./build-mrx1000-wave82-review-artifacts.mjs');
