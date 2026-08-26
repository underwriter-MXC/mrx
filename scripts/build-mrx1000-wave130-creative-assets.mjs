#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '130';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-public-gis-viewer-layer-state-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Public GIS Viewer Layer-State Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Public GIS Viewer layer-state retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-public-gis-viewer-layer-state-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-public-gis-viewer-layer-state-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Public GIS Viewer',
  'Layer-State Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Public GIS Viewer',
  'layer-state retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free oblique dark GIS-session archive station on the right with one blank map-screen frame, layered translucent acetate tabs, neutral compass dial, blank version card, timestamp device, and copper capture clip beside an uninterrupted left navy title field. No readable base text, Texas outline, agency seal, logo, well, pipeline, property boundary, coordinate, identifier, result, legal symbol, money, person, hand, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead cream layer-state evidence board with a blank square map tile, separate abstract layer toggle chips, basemap swatches, scale bar pieces, selector card, timestamp card, capture-reference sleeve, and an uninterrupted lower navy keyword band. No oblique room, screen frame, archive station, compass dial, readable base text, Texas outline, agency seal, logo, well, pipeline, property boundary, coordinate, identifier, result, legal symbol, money, person, hand, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
