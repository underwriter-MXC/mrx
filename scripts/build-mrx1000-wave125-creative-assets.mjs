#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '125';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-groundwater-protection-determination-letter-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Groundwater Protection Determination Letter Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC groundwater determination letter retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-groundwater-protection-determination-letter-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-groundwater-determination-letter-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Groundwater',
  'Protection Determination',
  'Letter Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC groundwater',
  'determination letter retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'People-free public-record microfilm reading room with a blank-screen reader, open empty archive drawer, unlabeled film canister, blank evidence sleeves, and an uninterrupted left navy title field. No readable base text, identifiers, coordinates, wells, operators, dates, results, water-depth diagrams, environmental claims, logos, seals, official interface, money, legal imagery, automation, people, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct no-people 45-degree tabletop composition with three blank archival evidence sleeves, unlabeled film canister, blank timestamp card, blank access token, unused archive glove, and loupe above an uninterrupted lower navy keyword band. No screen, machine, room perspective, readable base text, identifiers, coordinates, wells, operators, dates, results, water-depth diagrams, environmental claims, logos, seals, official interface, money, legal imagery, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
