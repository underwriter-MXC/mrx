#!/usr/bin/env node
/**
 * scripts/check-secrets.mjs
 *
 * CI helper. Ensures no credentials are committed to the repo. The
 * build's only environment-variable access is through Astro's
 * import.meta.env (or the Cloudflare runtime env binding in the 2
 * Cloudflare Functions). Any literal secret-looking string in the
 * source tree is a finding.
 */
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PATTERNS = [
  // GHL API keys
  /pit-[A-Za-z0-9_-]{20,}/g,
  // Google OAuth tokens
  /ya29\.[A-Za-z0-9_-]{20,}/g,
  // Generic "Bearer eyJ..." JWT-shaped strings
  /Bearer\s+eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
  // SearchAtlas API keys (per MRX growth-stack-ops skill)
  /^[a-f0-9]{32,}$/gm, // only flagged if prefixed with "SEARCHATLAS_API_KEY=" or similar
];

const ALLOWLIST = new Set([
  // Files that may contain example secrets for tests:
  // (none in the MVP; this is a guard for future PRs)
]);

const violations = [];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && /\.(ts|js|mjs|json|astro|mdx|env|yaml|yml|toml)$/i.test(entry.name)) {
      yield full;
    }
  }
}

for await (const file of walk(ROOT)) {
  if (ALLOWLIST.has(relative(ROOT, file))) continue;
  const text = await readFile(file, 'utf-8');
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      // Skip placeholder env-file lines like YOUR_API_KEY=...
      const lineStart = text.lastIndexOf('\n', m.index) + 1;
      const lineEnd = text.indexOf('\n', m.index);
      const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
      if (/YOUR_API_KEY|YOUR_|PLACEHOLDER|EXAMPLE/.test(line)) continue;
      if (/MRX_GHL_|MRX_PDF_|MRX_CONTACT_/.test(line) && /="?$/i.test(line.trim())) continue;
      violations.push({ file: relative(ROOT, file), rule: 'secret_like_string', match: m[0].slice(0, 40) + '...' });
    }
  }
}

if (violations.length) {
  console.error('❌ Secret scan failed:');
  console.table(violations);
  process.exit(1);
}

console.log('✅ Secret scan passed.');
