#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '84';
process.env.MRX_ARTICLE_SLUG =
  'refrac-workover-event-claim-register-source-preserving-record-template';
process.env.MRX_ARTICLE_TITLE =
  'Refrac and Workover Event-Claim Register: A Source-Preserving Record Template';
process.env.MRX_ARTICLE_KEYWORD = 'refrac workover event claim register';
process.env.MRX_HERO_FILENAME =
  'refrac-and-workover-event-claim-register-a-source-preserving-record-template';
process.env.MRX_INLINE_FILENAME = 'refrac-workover-event-claim-register';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Refrac and Workover',
  'Event-Claim Register:',
  'A Source-Preserving',
  'Record Template',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'refrac workover',
  'event claim register',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic elevated front-facing source-separated event-claim register scene on the right with a clean navy title field on the left; no people, readable text, figures, event conclusions, charts, curves, money, value, verification, or engineering claims.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict overhead blank event-claim worksheet with identifier, source, dates, connection status, non-causal reporting periods, unknowns, and follow-up fields above a lower navy band; no binder, front-facing view, readable text, figures, charts, curves, money, value, verification, or engineering claims.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
