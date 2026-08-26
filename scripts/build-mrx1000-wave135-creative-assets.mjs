#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '135';
process.env.MRX_ARTICLE_SLUG =
  'texas-secretary-of-state-registered-agent-and-registered-office-evidence-boundary-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas Secretary of State Registered Agent and Registered Office Evidence Boundary Worksheet';
process.env.MRX_ARTICLE_KEYWORD =
  'Texas Secretary of State registered agent and registered office evidence boundary';
process.env.MRX_HERO_FILENAME =
  'texas-secretary-of-state-registered-agent-and-registered-office-evidence-boundary-worksheet';
process.env.MRX_INLINE_FILENAME =
  'texas-secretary-of-state-registered-agent-and-registered-office-evidence-boundary';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas Secretary of State',
  'Registered Agent and',
  'Registered Office',
  'Evidence Boundary',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas Secretary of State',
  'registered agent and registered office',
  'evidence boundary',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned wide oblique people-free retained-evidence desk with a blank business-organization folder, blank source-excerpt page, blank address-card sleeve, closed archival clip, and uninterrupted left navy title space. No readable text, real or fictional data, state seal, government logo, official form, person, face, hand, computer, search interface, order, payment, status mark, signature, watermark, conclusion, or UI.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free blank transcription grid with separate empty zones, one navy archival sleeve, one blank timestamp card, one capped pen, and an uninterrupted lower navy keyword band. No oblique desk, stacked perspective folders, readable text, names, numbers, addresses, entity data, checkmarks, official form, seal, logo, handwriting, signature, search, order, payment, status claim, UI, watermark, person, or hand.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
