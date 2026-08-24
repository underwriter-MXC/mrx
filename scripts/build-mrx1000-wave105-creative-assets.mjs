#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '105';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-orphan-well-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Orphan Well Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Orphan Well Query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-orphan-well-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-orphan-well-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Orphan',
  'Well Query Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify(['Texas RRC Orphan Well', 'Query retrieval']);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free low-oblique archival locator workstation. On the right: a compact card-catalog locator rack with open blank drawers, blank county, district, and field divider tabs, a brass magnifying glass, an unbranded evidence folder, a neutral timestamp dial, and an unlabeled Texas-shaped paperweight. On the left: uninterrupted textured navy title field. No people, hands, wells, rigs, environmental damage, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale limestone query-state grid with separate blank criterion tiles, three neutral state tokens, a retained-reference sleeve, a horizontal route line, a pencil, and uninterrupted lower keyword band. No oblique angle, dark desk, drawers, card catalog, stacked trays, people, hands, wells, rigs, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
