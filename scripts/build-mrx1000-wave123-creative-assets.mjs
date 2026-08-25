#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '123';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-form-p-18-skim-oil-condensate-report-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Form P-18 Skim Oil/Condensate Report Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Form P-18 report retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-form-p-18-skim-oil-condensate-report-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-form-p-18-report-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Form P-18',
  'Skim Oil/Condensate Report',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify(['Texas RRC Form P-18', 'report retrieval']);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Wide eye-level public-record archive scene with one careful researcher at right, blank archival folders and report covers, a neutral microfilm reel, filing shelves, and an uninterrupted left navy title field. Every paper, folder, shelf label, and object is blank. No readable base text, identifiers, facility, well, operator, date, result, values, logos, seals, official interface screenshot, document interpretation, production, storage, disposal, money, ownership, value, offer, legal conclusion, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead Form P-18 retrieval provenance board with blank criteria cards, blank report folder, blank timestamp card, microfilm reel, loupe, blank evidence envelope, and three blank outcome tokens above an uninterrupted lower navy keyword band. No people, hands, archive-room perspective, readable base text, identifiers, facility, well, operator, date, result, values, logos, seals, official interface screenshot, document interpretation, production, storage, disposal, money, ownership, value, offer, legal conclusion, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
