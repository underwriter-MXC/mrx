#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '89';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-pooling-filing-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Pooling-Filing Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC pooling filing retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-pooling-filing-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-pooling-filing-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Pooling-Filing',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC pooling',
  'filing retrieval',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic eye-level Texas public-record filing-research desk scene on the right with a blank government filing folder, abstract document cards, neutral computer blocks, date-stamp tool, magnifier, and an unlabeled Texas map cutout beside an uninterrupted navy title field on the left; no people, hands, money, offers, prices, charts, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead public-record provenance worksheet on pale limestone with eight blank field blocks, a route card, form tab, identifier slip, access-date stamp, result-reference card, neutral status tokens, pencil, binder clip, and small folded abstract tract map above an uninterrupted lower navy keyword band; no monitor, wooden desk, standing folder stack, people, hands, money, offers, prices, charts, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
