#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '106';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-online-inspection-lookup-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Online Inspection Lookup Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Online Inspection Lookup retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-online-inspection-lookup-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-online-inspection-lookup-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Online',
  'Inspection Lookup',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Online Inspection',
  'Lookup retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free low-oblique dark navy and slate inspection-retrieval evidence station. On the right: a blank rugged tablet, cream evidence folder, compass, orange puck, blank tabs, and a transparent reference sleeve. On the left: uninterrupted textured navy title field. No people, hands, wells, rigs, environmental damage, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale blue and white inspection-query state matrix with blank criteria tiles, connected route nodes, three neutral state tokens, a retained-reference sleeve, boundary and next-question tiles, and uninterrupted navy lower keyword band. No oblique angle, dark desk, tablet, folder stack, people, faces, wells, rigs, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
