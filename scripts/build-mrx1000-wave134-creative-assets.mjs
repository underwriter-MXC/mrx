#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '134';
process.env.MRX_ARTICLE_SLUG =
  'texas-secretary-of-state-business-organization-document-order-request-preparation-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas Secretary of State Business Organization Document Order Request Preparation Worksheet';
process.env.MRX_ARTICLE_KEYWORD =
  'Texas Secretary of State business organization document order request preparation';
process.env.MRX_HERO_FILENAME =
  'texas-secretary-of-state-business-organization-document-order-request-preparation-worksheet';
process.env.MRX_INLINE_FILENAME =
  'texas-secretary-of-state-business-organization-document-order-request-preparation';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas Secretary of State',
  'Business Organization',
  'Document Order Request',
  'Preparation Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas Secretary of State',
  'business organization document',
  'order request preparation',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned wide oblique records-office desk with all meaningful blank request-preparation materials on the right, including two closed archival folders, one empty return envelope, a blank cover sheet, a neutral three-divider route tray, and uninterrupted left navy title space. No readable text, real or fictional data, state seal, government logo, official form, person, face, computer, payment card, money, check, price, completed document, signature, watermark, or UI.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free blank request-preparation board with one central four-zone empty worksheet, three separate blank route cards, one blank source card, one blank unresolved card, one closed rust stop folder, and an uninterrupted lower navy keyword band. No oblique desk, stacked folders, envelope, computer, readable text, names, numbers, contacts, prices, payment data, official form, seal, logo, handwriting, signature, UI, watermark, person, or hand.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
