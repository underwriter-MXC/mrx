#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '153';
process.env.MRX_ARTICLE_SLUG =
  'brazos-cad-mineral-industrial-account-contact-routing-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Brazos CAD Mineral and Industrial Account Contact-Routing Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Brazos CAD mineral and industrial account contact';
process.env.MRX_HERO_FILENAME =
  'brazos-cad-mineral-and-industrial-account-contact-routing-worksheet';
process.env.MRX_INLINE_FILENAME =
  'brazos-cad-mineral-and-industrial-account-contact';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Brazos CAD',
  'Mineral and',
  'Industrial Account',
  'Contact-Routing',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Brazos CAD mineral and',
  'industrial account contact',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free eye-level public-record wayfinding wall on the right with two blank teal-and-slate destination slots, one blank amber unresolved slot, one neutral question card, restrained physical route lines, a small mineral-core sample, and generic blank account tabs, leaving uninterrupted deep-navy title space on the left. No desk-search scene, laptop, map, person, hand, readable text, contact detail, letter, number, date, owner, account, property, value, tax amount, offer, deed, well, calculator, money, signature, QR code, barcode, logo, seal, emblem, recommendation, or legal, tax, ownership, appraisal, value, response, or transaction claim.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead bright warm-stone triangular routing board with one blank neutral question card feeding three widely separated circular destination wells through three physical path strips, plus one sealed privacy sleeve and a blank timestamp token above an uninterrupted lower navy keyword band. No wall, desk-search scene, laptop, map, filing cabinet, mineral rock, person, hand, readable text, contact detail, letter, number, date, owner, account, property, value, tax amount, offer, deed, well, calculator, money, signature, QR code, barcode, logo, seal, emblem, ranking, recommendation, or legal, tax, ownership, appraisal, value, response, or transaction claim.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
