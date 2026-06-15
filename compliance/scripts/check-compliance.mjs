#!/usr/bin/env node
/**
 * MRX §4 build-time compliance grep check.
 *
 * Fails the build if any disallowed phrase appears as a CLAIM (not as
 * a denial). The compliance review explicitly requires the FAQ and
 * methodology pages to say "this is NOT a certified appraisal" — that
 * is a denial, not a claim, and must be allowed.
 *
 * Source of truth: project-pack/04-compliance/MRX Compliance Review.md
 * Lexicon source: compliance/disallowed.json, compliance/named-competitors.json
 *
 * Per `Compliance Aware Implementation Rules.md` §1.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

// --- Inputs -----------------------------------------------------------------

const DISALLOWED_PATH = join(__dirname, '..', 'disallowed.json');
const NAMED_COMPETITORS_PATH = join(__dirname, '..', 'named-competitors.json');

const ROOTS = [
  join(ROOT, 'src', 'content'),
  join(ROOT, 'src', 'components'),
  join(ROOT, 'src', 'structured-data'),
  join(ROOT, 'src', 'pages'),
  join(ROOT, 'src', 'layouts'),
  join(ROOT, 'src', 'lib'),
];

// Files that contain disallowed phrases by design (the disclaimer source,
// the rule itself, the test fixtures, the lexicon JSON).
const ALLOWLIST_FILES = new Set([
  join(ROOT, 'src', 'lib', 'disclaimer.ts'),
  join(ROOT, 'compliance', 'disclaimer.ts'),
  join(ROOT, 'compliance', 'disallowed.json'),
  join(ROOT, 'compliance', 'named-competitors.json'),
  join(ROOT, 'compliance', 'scripts', 'check-compliance.mjs'),
  join(ROOT, 'tests', 'fixtures', 'disallowed.json'),
]);

const ALLOWLIST_DIRS = [join(ROOT, 'tests', 'fixtures')];

const EXTS = new Set(['.mdx', '.astro', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.json']);

// --- §4 supplemental patterns (not in the JSON; hard-coded because they
// are derived from §6.2 and §6.4, not §4 directly) -------------------------

// §6.2 superlative PATTERNS (the phrase; the MRX-attribution check is
// in isMrxSuperlative below).
const SUPERLATIVE_PHRASES = [
  'the only',
  'the most',
  'the best',
  'we are the only',
  'we are the best',
];
const MRX_ATTRIBUTION_TOKENS = [
  'we are',
  'mrx is',
  'us is',
  'of the only',
  'our team is',
  "we're the",
  'our review is',
  'our methodology is',
];

function isMrxSuperlative(text, matchIndex) {
  const windowStart = Math.max(0, matchIndex - 60);
  const afterEnd = Math.min(text.length, matchIndex + 60);
  const beforeWindow = text.slice(windowStart, matchIndex).toLowerCase();
  const afterWindow = text.slice(matchIndex, afterEnd).toLowerCase();
  const combined = beforeWindow + ' ' + afterWindow;
  for (const tok of MRX_ATTRIBUTION_TOKENS) {
    if (combined.includes(tok)) return true;
  }
  // Also flag the pattern if "the only" is followed by "transparent"
  // or "trustworthy" — those are the explicit examples in §6.2.
  if (/transparent|trustworthy|best mineral/.test(combined)) return true;
  return false;
}

const PERSONAL_KNOWLEDGE_PHRASES = [
  'we know you inherited',
  'we know you need cash',
  "we know you're retired",
  'we know you got an offer',
];

// Denial / negation patterns. A claim is disallowed; a denial is required
// by the compliance review (Q-3 "Is this an appraisal?" must say "No, this
// is not a certified appraisal"). The check skips a phrase occurrence if
// the preceding ~30 chars contain a negation token.
const NEGATION_TOKENS = [
  'not ',
  "isn't",
  'isnt',
  'no,',
  'no.',
  'never',
  "aren't",
  'arent',
  'without',
  'rather than',
  'versus the',
  'vs. the',
  'vs the',
  // Negation by enumeration (e.g., "not legal advice, tax advice, or
  // a certified appraisal" is a denial of all three).
  'or a ',
  'or an ',
  'nor a ',
  // We do NOT include "no " (without comma/period) because legitimate
  // claims can also be preceded by it ("no guarantee required" — but
  // that's not a phrase we ban; "no teaser numbers" is OK because
  // "teaser" is not in the banned set).
];

function isDenialContext(text, matchIndex) {
  const windowStart = Math.max(0, matchIndex - 30);
  const window = text.slice(windowStart, matchIndex).toLowerCase();
  for (const neg of NEGATION_TOKENS) {
    if (window.includes(neg)) return true;
  }
  return false;
}

// --- Helpers ---------------------------------------------------------------

async function readJson(path) {
  const text = await readFile(path, 'utf-8');
  return JSON.parse(text);
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'));
      if (EXTS.has(ext)) yield full;
    }
  }
}

function isAllowlisted(full) {
  if (ALLOWLIST_FILES.has(full)) return true;
  for (const dir of ALLOWLIST_DIRS) {
    if (full.startsWith(dir + '/') || full === dir) return true;
  }
  return false;
}

// --- Main ------------------------------------------------------------------

async function main() {
  const disallowed = await readJson(DISALLOWED_PATH);
  const namedCompetitors = await readJson(NAMED_COMPETITORS_PATH);

  const violations = [];

  for (const root of ROOTS) {
    if (!existsSync(root)) continue;
    for await (const full of walk(root)) {
      if (isAllowlisted(full)) continue;
      const text = await readFile(full, 'utf-8');
      const lower = text.toLowerCase();

      // §4 disallowed lexicon — skip denial contexts.
      for (const phrase of disallowed.phrases ?? []) {
        const lowerPhrase = phrase.toLowerCase();
        let from = 0;
        while (true) {
          const idx = lower.indexOf(lowerPhrase, from);
          if (idx === -1) break;
          if (!isDenialContext(lower, idx)) {
            violations.push({
              file: relative(ROOT, full),
              rule: '§4 disallowed_phrase',
              phrase,
            });
          }
          from = idx + lowerPhrase.length;
        }
      }

      // §6.2 superlative patterns — only flag when the phrase is in an
      // MRX-attributing context. "the most informative" about documents
      // is descriptive, not a claim about MRX.
      for (const phrase of SUPERLATIVE_PHRASES) {
        const lowerPhrase = phrase.toLowerCase();
        let from = 0;
        while (true) {
          const idx = lower.indexOf(lowerPhrase, from);
          if (idx === -1) break;
          if (!isDenialContext(lower, idx) && isMrxSuperlative(lower, idx)) {
            violations.push({
              file: relative(ROOT, full),
              rule: '§6.2 no_superlative_about_mrx',
              phrase,
            });
          }
          from = idx + lowerPhrase.length;
        }
      }

      // §6.4 personal-knowledge patterns
      for (const phrase of PERSONAL_KNOWLEDGE_PHRASES) {
        if (lower.includes(phrase)) {
          violations.push({
            file: relative(ROOT, full),
            rule: '§6.4 no_implicit_personal_knowledge',
            phrase,
          });
        }
      }

      // §6.1 named-competitor blocklist
      for (const name of namedCompetitors.competitors ?? []) {
        if (text.includes(name)) {
          violations.push({
            file: relative(ROOT, full),
            rule: '§6.1 named_competitor',
            name,
          });
        }
      }
    }
  }

  if (violations.length) {
    console.error('❌ Compliance check failed:');
    console.table(violations);
    console.error(
      `\n${violations.length} violation${violations.length === 1 ? '' : 's'}. ` +
        `See project-pack/04-compliance/MRX Compliance Review.md for the source of truth.`,
    );
    process.exit(1);
  }

  console.log('✅ Compliance check passed.');
  console.log(
    `   Scanned ${ROOTS.length} roots, ${disallowed.phrases?.length ?? 0} disallowed phrases, ` +
      `${SUPERLATIVE_PHRASES.length} superlative patterns, ` +
      `${PERSONAL_KNOWLEDGE_PHRASES.length} personal-knowledge patterns, ` +
      `${namedCompetitors.competitors?.length ?? 0} named competitors.`,
  );
}

main().catch((err) => {
  console.error('❌ Compliance check errored:', err);
  process.exit(1);
});
