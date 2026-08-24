#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '114';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-lease-drop-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller Lease Drop Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas Comptroller Lease Drop retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-comptroller-lease-drop-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-comptroller-lease-drop-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas Comptroller',
  'Lease Drop Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas Comptroller',
  'Lease Drop retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium low-eye-level three-quarter Texas mineral-owner research desk with one person only on the far right, neutral laptop, two separate blank product-route cards, controlled lease-reference card, unmarked calendar marker, closed evidence sleeve, and uninterrupted left navy title field. No readable text, values, logos, government seals, official interface screenshot, production figure, tax or payment claim, conclusion, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale one-attempt Lease Drop provenance worksheet with two blank product-route columns, controlled-reference card, period card, timestamp card, retained-evidence sleeve, three neutral status discs, unresolved marker, and uninterrupted lower navy keyword band. No people, hands, laptop, readable text, values, logos, government seals, official interface screenshot, tax rate, production figure, result, payment, conclusion, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
