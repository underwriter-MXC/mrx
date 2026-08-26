#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '127';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-oil-and-gas-well-records-request-preparation-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Oil and Gas Well Records Request Preparation Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC well records request preparation';
process.env.MRX_HERO_FILENAME = 'texas-rrc-oil-and-gas-well-records-request-preparation-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-well-records-request-preparation';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Oil and Gas',
  'Well Records Request',
  'Preparation Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC well records',
  'request preparation',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Photorealistic people-free oblique request-preparation desk with a blank packet, neutral file jacket, blank locator dividers, blank timestamp card, sealed controlled-reference envelope, empty outgoing tray, and uninterrupted left navy title field. No readable base text, identifiers, agency marks, submission confirmation, records, wells, operators, dates, money, legal imagery, people, hands, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead field-classification board with five separate groups of blank cards for known fields, unknown fields, controlled private reference, limitations, and handoff ownership above an uninterrupted lower navy keyword band. No oblique perspective, file tray, readable base text, identifiers, agency marks, records, wells, operators, dates, money, legal imagery, people, hands, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
