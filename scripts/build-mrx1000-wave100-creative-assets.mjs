#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '100';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-flare-vent-exception-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Flare/Vent Exception Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Flare/Vent Exception query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-flare-vent-exception-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-flare-vent-exception-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Flare/Vent Exception',
  'Query Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Flare/Vent',
  'Exception query retrieval',
]);
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free oblique evidence desk. On the right: a blank generic public-query route card, a blank Flare/Vent exception provenance worksheet, a character-free timestamp stamp, neutral status chips, and an abstract unlabeled Texas outline; on the left: an uninterrupted textured navy title field. No hands, money, offers, prices, charts, flames, smoke, environmental damage, wells, rigs, interpretable results, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale limestone desk with a large blank multi-panel SWR 32 query-criteria checklist, transparent ruler, blank status row, retained-reference envelope, blue pencil, binder clip, and three neutral status tokens above an uninterrupted lower navy keyword band. No oblique angle, archive counter, standing card, Texas map, people, hands, money, offers, prices, charts, flames, smoke, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
