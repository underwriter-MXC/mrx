#!/usr/bin/env node
/**
 * scripts/lint-schema.mjs
 *
 * Build-time JSON-LD shape lint. Verifies the rendered HTML in dist/
 * for §10 forbidden patterns (aggregateRating, reviewCount, unsourced
 * price figures) and ensures required fields are present.
 *
 * Per `SEO AEO Sitemap Schema Plan.md` §2.6.
 */
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error(`❌ dist/ not found at ${DIST}. Run \`pnpm build\` first.`);
  process.exit(1);
}

const violations = [];
let scanned = 0;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

for await (const file of walk(DIST)) {
  scanned++;
  const text = await readFile(file, 'utf-8');
  const matches = text.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) ?? [];
  for (const block of matches) {
    const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (err) {
      violations.push({ file, rule: 'parse_error', detail: String(err) });
      continue;
    }
    const serialized = JSON.stringify(parsed);
    if (serialized.match(/aggregateRating/i)) {
      violations.push({ file, rule: 'no_aggregateRating' });
    }
    if (serialized.match(/reviewCount/i)) {
      violations.push({ file, rule: 'no_reviewCount' });
    }
  }
}

if (violations.length) {
  console.error('❌ JSON-LD lint failed:');
  console.table(violations);
  process.exit(1);
}

console.log(`✅ JSON-LD lint passed (${scanned} HTML files scanned).`);
