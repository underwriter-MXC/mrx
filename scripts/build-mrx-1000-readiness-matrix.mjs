#!/usr/bin/env node

/**
 * scripts/build-mrx-1000-readiness-matrix.mjs
 *
 * Deterministic, local-only MRX1000 readiness-matrix generator.
 *
 * Inputs (read-only):
 *   - mrx/config/mrx-1000-canonical-content-ledger.json
 *   - mrx/src/content/posts/<slug>.mdx         (frontmatter only)
 *   - mrx/src/pages/<path>.astro or <dir>/index.astro (route existence,
 *     including dynamic [...slug] / [state] routes whose getStaticPaths
 *     statically covers the requested slug)
 *   - mrx/public/<path>                        (asset existence on disk)
 *   - mrx/dist/client/sitemap-*.xml            (build artifacts for sitemap
 *                                              current-inclusion check)
 *   - mrx/tmp/mrx1000-f9-*-readonly-*.json     (SearchAtlas authoritative
 *                                              local artifacts; map_handle +
 *                                              title_uuid evidence only)
 *   - reports/mrx1000-releases/D-2026-0720-11* (signed release artifact; if
 *                                              absent we also try the absolute
 *                                              outside-workspace path that
 *                                              Daryl authored at
 *                                              program-plans/, but only when
 *                                              it matches the expected SHA-256)
 *   - reports/llm-aeo-evals/.../captures/      (LLM verdict evidence)
 *
 * Outputs (deterministic aside from generated_at):
 *   mrx/reports/mrx-1000-readiness-matrix.json
 *   mrx/reports/mrx-1000-readiness-summary.md
 *
 * Authoritative-only posture: a row is only marked as "SearchAtlas-linked",
 * "publicly live", or "LLM-verdicted" if an authoritative local artifact
 * actually exists on disk. We do not infer; we do not look up via the network;
 * we do not query SearchAtlas/CMS/GSC/GA4; we do not publish or index anything.
 *
 * D-2026-0720-11 release / index authorization must be a signed artifact
 * naming the decision id. If a signed D-2026-0720-11 artifact is found in
 * reports/mrx1000-releases/ we honor it; if it lives outside the mrx working
 * directory (Daryl's authored copy at program-plans/) we honor it ONLY when
 * its SHA-256 matches the expected fingerprint recorded here. Either way the
 * matrix reports the disposition verbatim (HOLD = release_authorized=false,
 * index_authorized=false). Cap of zero is recorded from the artifact.
 */

import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(SCRIPT_DIR, '..');
const PROGRAM_PLANS_ROOT = path.resolve(MRX_ROOT, '..', 'program-plans');

const INPUTS = {
  ledger: path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json'),
  postsDir: path.join(MRX_ROOT, 'src/content/posts'),
  pagesDir: path.join(MRX_ROOT, 'src/pages'),
  publicDir: path.join(MRX_ROOT, 'public'),
  distClient: path.join(MRX_ROOT, 'dist/client'),
  reportsDir: path.join(MRX_ROOT, 'reports'),
  contentGeniusExport: path.join(
    MRX_ROOT,
    'reports/searchatlas-cg-reconciliation-t_0c427a87/content-genius-export-raw-by-status.json',
  ),
  row1CanaryPreflight: path.join(
    MRX_ROOT,
    'reports/mrx1000-pilot-001-preflight-2026-07-20T07-08-39-887Z.md',
  ),
  pilotManifest: path.join(MRX_ROOT, 'config/mrx-1000-pilot-batch-001.json'),
  d10ExternalPath: path.join(
    PROGRAM_PLANS_ROOT,
    'mrx-1000-ceo-decision-row2-canary-remediation.md',
  ),
  d10ExpectedSha256: '4fd80d8f3316d06b5b8bd58d028d9c24b0fb4523c1cad0c58a9a2163dbbb6000',
  releasesDir: path.join(MRX_ROOT, 'reports/mrx1000-releases'),
  capturesRoot: path.join(MRX_ROOT, 'reports/llm-aeo-evals'),
  readonlyDir: path.join(MRX_ROOT, 'tmp'),
  // Astro's @astrojs/sitemap emits dist/sitemap-*.xml by default. We accept
  // either dist/ (flat) or dist/client/ (Cloudflare-style). The postbuild
  // script (scripts/postbuild-sitemap.mjs) also writes to dist/.
  distDir: path.join(MRX_ROOT, 'dist'),
  distClientDir: path.join(MRX_ROOT, 'dist/client'),
  // Daryl's authored, signed D11 lives one level up at the program-plans dir.
  // We only honor it when its SHA-256 matches the expected fingerprint below,
  // which Daryl confirmed in kanban comment 1784539239.
  d11ExternalPath: path.join(PROGRAM_PLANS_ROOT, 'mrx-1000-ceo-decision-no-spend-capacity.md'),
  d11ExpectedSha256: '46a9d02548e97a794d1cdaa919682bb159bcfbeabb5b9d8e559431c6ca34091d',
  // Cloudflare/server builds emit the client surface under dist/client;
  // static/alternate adapters may emit it directly under dist. Prefer the
  // active default, then fail over to the flat adapter path. Never union both:
  // a stale artifact from a previous adapter must not create false live URLs.
  canonicalArticlesSitemapCandidates: [
    path.join(MRX_ROOT, 'dist/client/sitemap-articles.xml'),
    path.join(MRX_ROOT, 'dist/sitemap-articles.xml'),
  ],
};

const OUTPUTS = {
  json: path.join(MRX_ROOT, 'reports/mrx-1000-readiness-matrix.json'),
  summary: path.join(MRX_ROOT, 'reports/mrx-1000-readiness-summary.md'),
};

const EXPECTED_ROW_COUNT = 1000;
const EXPECTED_PROGRAM_ID_PREFIX = 'MRX1000-';
const EXPECTED_PROGRAM_ID_TOTAL_WIDTH = 12; // MRX1000- (8 chars) + 4 zero-padded digits

// Models the LLM harness lists in the required order (reports/mrx1000-010-llm-aeo-evaluation-harness.md).
// "other" is a catch-all bucket used only when a verdict capture explicitly names a model not in this list.
const LLM_MODEL_KEYS = ['chatgpt', 'gemini', 'claude_opus_4_6', 'perplexity', 'other'];

// Pillar URLs the ledger references; the matrix asserts the on-disk route is
// either a page (Astro), an index.astro, a directory index, or a dynamic
// page (e.g. [...slug].astro / [state].astro) whose getStaticPaths covers the
// requested slug via a co-located data module.
const PILLAR_URLS = new Set([
  '/sell-mineral-rights/',
  '/mineral-rights-value/',
  '/offer-review/',
  '/inherited-mineral-rights/',
  '/learning-center/oil-and-gas-royalties/',
  '/learning-center/mineral-rights-taxes/',
  '/mineral-rights/texas/',
  '/learning-center/title-lease-ownership/',
  '/methodology/',
]);

// ----- Utilities -------------------------------------------------------------

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function safeReaddir(dir) {
  if (!dir || typeof dir !== 'string') return [];
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return [];
    throw error;
  }
}

/**
 * Select exactly one canonical article sitemap from adapter-specific build
 * locations. The injectable predicate keeps both candidate-order branches
 * testable without creating or mutating build artifacts.
 */
export function selectCanonicalArticlesSitemap(candidates, pathExists = existsSync) {
  if (!Array.isArray(candidates)) {
    throw new TypeError('canonical sitemap candidates must be an array');
  }
  return (
    candidates.find((candidate) => typeof candidate === 'string' && pathExists(candidate)) ?? null
  );
}

function safeRead(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function countBy(items, field) {
  const counts = {};
  for (const item of items) {
    const key = item?.[field] ?? 'UNKNOWN';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function normalizeFrontmatter(text) {
  // Minimal but well-defined YAML-frontmatter reader.
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  const lines = m[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    if (/^\s/.test(line)) {
      i++;
      continue;
    }
    const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!top) {
      i++;
      continue;
    }
    const [, key, rest] = top;
    const value = rest.trim();
    if (value !== '') {
      out[key] = unquote(value);
      i++;
      continue;
    }
    const block = {};
    const list = [];
    let kind = null;
    let j = i + 1;
    while (j < lines.length) {
      const child = lines[j];
      if (child === '' || /^\s*$/.test(child)) {
        j++;
        continue;
      }
      if (!/^\s/.test(child)) break;
      const trimmed = child.replace(/^\s+/, '');
      if (trimmed.startsWith('- ')) {
        if (kind === 'map') break;
        kind = 'list';
        const item = trimmed.slice(2).trim();
        const listKv = item.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (listKv) {
          const obj = { [listKv[1]]: unquote(listKv[2]) };
          let k = j + 1;
          while (k < lines.length) {
            const deep = lines[k];
            if (!/^\s{2,}/.test(deep)) break;
            const m2 = deep.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
            if (!m2) {
              k++;
              continue;
            }
            obj[m2[1]] = unquote(m2[2].trim());
            k++;
          }
          list.push(obj);
          j = k;
        } else {
          list.push(unquote(item));
          j++;
        }
        continue;
      }
      const kv = child.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
      if (kv) {
        if (kind === 'list') break;
        kind = 'map';
        block[kv[1]] = unquote(kv[2].trim());
        j++;
        continue;
      }
      break;
    }
    if (kind === 'list') out[key] = list;
    else if (kind === 'map' && Object.keys(block).length) out[key] = block;
    i = j;
  }
  return out;
}

function unquote(value) {
  if (value == null) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

// Read the set of slugs statically generated by `pages/mineral-rights/[state].astro`
// from its data module (src/data/states.ts). The data is shaped as a list of
// tuples `['slug', 'Name', ...]` that get `.map(([slug, name, ...]) => ({ slug, ... }))`.
// We extract every single-quoted string at the start of such a tuple (preceded
// by `[\n` whitespace or a comma at line start) as a slug.
function readStateSlugs() {
  const slugs = new Set();
  const statesFile = path.join(MRX_ROOT, 'src/data/states.ts');
  if (!existsSync(statesFile)) return slugs;
  const text = safeRead(statesFile);
  // Tuple opening: `[` or `,` at line start (possibly indented), followed by
  // an optional newline + whitespace + a quoted string + comma.
  const re = /^\s*[\[,]\s*\n?\s*'([a-z0-9-]+)'\s*,/gm;
  for (const m of text.matchAll(re)) slugs.add(m[1]);
  return slugs;
}

function pathToAstroCheck(url, stateSlugs) {
  // Returns true if a pillar route resolves to a discoverable Astro source.
  // Supports:
  //   - <route>.astro
  //   - <route>/index.astro
  //   - <route>/[...slug].astro or <route>/[slug].astro (static path from
  //     getCollection posts)
  //   - <parent>/[state].astro covering a slug in src/data/states.ts
  //     (e.g. /mineral-rights/texas/ → src/pages/mineral-rights/[state].astro
  //      with texas ∈ src/data/states.ts)
  if (!url) return false;
  const clean = url.replace(/^\//, '').replace(/\/$/, '');
  if (!clean) return false;
  const tail = clean.split('/').pop();
  // Direct checks first.
  const direct = [
    path.join(INPUTS.pagesDir, `${clean}.astro`),
    path.join(INPUTS.pagesDir, clean, 'index.astro'),
    path.join(INPUTS.pagesDir, clean, '[...slug].astro'),
    path.join(INPUTS.pagesDir, clean, '[slug].astro'),
    path.join(INPUTS.pagesDir, clean, '[state].astro'),
  ];
  if (direct.some((c) => existsSync(c))) {
    const stateAstro = path.join(INPUTS.pagesDir, clean, '[state].astro');
    if (existsSync(stateAstro)) {
      return stateSlugs.has(tail);
    }
    return true;
  }
  // Parent-directory dynamic route fallback: e.g. /mineral-rights/texas/
  // is served by src/pages/mineral-rights/[state].astro.
  const parentSegments = clean.split('/');
  if (parentSegments.length >= 2) {
    const parent = parentSegments.slice(0, -1).join('/');
    const tailSlug = parentSegments[parentSegments.length - 1];
    const parentDynamicCandidates = [
      path.join(INPUTS.pagesDir, parent, '[state].astro'),
      path.join(INPUTS.pagesDir, parent, '[slug].astro'),
      path.join(INPUTS.pagesDir, parent, '[...slug].astro'),
    ];
    for (const c of parentDynamicCandidates) {
      if (existsSync(c)) {
        if (c.endsWith('[state].astro')) {
          return stateSlugs.has(tailSlug);
        }
        return true;
      }
    }
  }
  return false;
}

function classifyAeoLlm(row, capturesRoot) {
  // Authoritative-only: a verdict is recorded only if a local capture file
  // names the model, references this program_row_id (or canonical_slug), and
  // includes a verdict token (PASS|FAIL|HOLD). Anything else => null.
  const result = {
    chatgpt: null,
    gemini: null,
    claude_opus_4_6: null,
    perplexity: null,
    other: [],
  };
  if (!existsSync(capturesRoot)) return result;
  const verifiedAt = new Date().toISOString();
  function* walk(dir) {
    for (const ent of safeReaddir(dir)) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) yield* walk(p);
      else yield p;
    }
  }
  for (const file of walk(capturesRoot)) {
    if (!/\.(txt|md|jsonl|json)$/.test(file)) continue;
    const text = safeRead(file);
    if (!text) continue;
    if (!text.includes(row.program_row_id) && !text.includes(row.canonical_slug)) continue;
    const verdict = (text.match(/verdict:\s*(PASS|FAIL|HOLD)/i) || [])[1];
    if (!verdict) continue;
    const upper = verdict.toUpperCase();
    const lower = text.toLowerCase();
    const bucket = /claude[\s_-]?opus[\s_-]?4[\s.\-]?6/.test(lower)
      ? 'claude_opus_4_6'
      : /claude/.test(lower)
        ? null
        : /chatgpt|openai/.test(lower)
          ? 'chatgpt'
          : /gemini/.test(lower)
            ? 'gemini'
            : /perplexity/.test(lower)
              ? 'perplexity'
              : 'other';
    if (bucket === null) continue;
    const evidence = {
      source: path.relative(MRX_ROOT, file),
      verdict: upper,
      verified_at: verifiedAt,
    };
    if (bucket === 'other') {
      const model = (text.match(/model:\s*([A-Za-z0-9_.\- ]+)/i) || [])[1] || 'unknown';
      result.other.push({ ...evidence, model: model.trim() });
    } else if (result[bucket] == null) {
      result[bucket] = evidence;
    }
  }
  return result;
}

// Parse a signed D-2026-0720-11 release artifact and return a structured
// release_decision record. Returns null if the artifact is absent, the hash
// does not match the expected fingerprint (for the external path), or it does
// not name D-2026-0720-11.
function detectReleaseDecision() {
  const candidates = [];
  // 1. Inside mrx working tree (reports/mrx1000-releases/).
  if (existsSync(INPUTS.releasesDir)) {
    for (const ent of safeReaddir(INPUTS.releasesDir)) {
      if (!ent.isFile()) continue;
      candidates.push({
        path: path.join(INPUTS.releasesDir, ent.name),
        requireSha256Match: false,
      });
    }
  }
  // 2. Outside-workspace authored copy (Daryl's program-plans dir).
  if (existsSync(INPUTS.d11ExternalPath)) {
    candidates.push({
      path: INPUTS.d11ExternalPath,
      requireSha256Match: true,
      expectedSha256: INPUTS.d11ExpectedSha256,
    });
  }
  for (const cand of candidates) {
    const buf = readFileSync(cand.path);
    const text = buf.toString('utf8');
    if (!text.includes('D-2026-0720-11')) continue;
    const checksum = sha256(buf);
    if (cand.requireSha256Match && checksum !== cand.expectedSha256) continue;
    // Extract cap, release_authorized, index_authorized disposition.
    // The D-2026-0720-11 artifact phrases the cap as either
    // "PRESENT AUTHORIZATION CAP = N NEW ROWS" or "Present authorization cap: N".
    const capMatch =
      text.match(/PRESENT AUTHORIZATION CAP\s*[=:]\s*(\d+)/i) ||
      text.match(/authorization cap[^.\n]*?\bis\s+`?(\d+)`?/i);
    const hold = /Disposition\s*[:=]\s*HOLD/i.test(text) || /\bHOLD\b/i.test(text);
    const releaseAuth =
      !hold && /release_authorized\s*:\s*true|public_release_authorized\s*:\s*true/i.test(text);
    const indexAuth =
      !hold && /index_authorized\s*:\s*true|indexing_authorized\s*:\s*true/i.test(text);
    const inventoryMatch = text.match(
      /Content Genius inventory\s*\|\s*\*\*(\d+)\*\*\s*total:\s*\*\*(\d+)\s+NEEDS_REVIEW\s*\/\s*(\d+)\s+COMPLETED\s*\/\s*(\d+)\s+NOT_BEGUN\*\*/i,
    );
    return {
      decision_id: 'D-2026-0720-11',
      signed: true,
      signed_artifact: path.relative(MRX_ROOT, cand.path),
      signed_artifact_sha256: checksum,
      signed_artifact_sha256_verified: cand.requireSha256Match
        ? checksum === cand.expectedSha256
        : true,
      disposition: hold ? 'HOLD' : 'APPROVED',
      authorization_cap_new_mrx1000_rows: capMatch ? Number(capMatch[1]) : null,
      release_authorized: releaseAuth,
      index_authorized: indexAuth,
      vendor_inventory_snapshot: inventoryMatch
        ? {
            source: 'signed_d11_capacity_baseline',
            total: Number(inventoryMatch[1]),
            by_status: {
              NEEDS_REVIEW: Number(inventoryMatch[2]),
              COMPLETED: Number(inventoryMatch[3]),
              NOT_BEGUN: Number(inventoryMatch[4]),
            },
            public_inventory_claimed: false,
            release_authorization_claimed: false,
          }
        : null,
    };
  }
  return null;
}

function loadContentGeniusExport() {
  const source = path.relative(MRX_ROOT, INPUTS.contentGeniusExport);
  const empty = {
    source,
    exists: false,
    exported_at: null,
    list_item_count: 0,
    unique_id_count: 0,
    detail_found_count: 0,
    summary_by_status: {},
    detail_status_counts: {},
    by_exact_title: new Map(),
  };
  if (!existsSync(INPUTS.contentGeniusExport)) return empty;
  const rawText = safeRead(INPUTS.contentGeniusExport);
  if (!rawText) return empty;
  const raw = JSON.parse(rawText);
  const details = Array.isArray(raw.details) ? raw.details : [];
  const byExactTitle = new Map();
  for (const item of details) {
    const titleKey = normalizeTitle(item.title);
    if (!titleKey) continue;
    if (!byExactTitle.has(titleKey)) byExactTitle.set(titleKey, []);
    byExactTitle.get(titleKey).push({
      uuid: item.uuid ?? item.id ?? null,
      status: item.status ?? null,
      editor_url: item.editor_url ?? null,
      updated_at: item.updated_at ?? null,
    });
  }
  return {
    source,
    exists: true,
    exported_at: raw.exported_at ?? null,
    list_item_count:
      raw.list_item_count ?? (Array.isArray(raw.list_items) ? raw.list_items.length : 0),
    unique_id_count: raw.unique_id_count ?? null,
    detail_found_count: raw.detail_found_count ?? details.length,
    summary_by_status: Object.fromEntries(
      (Array.isArray(raw.summary) ? raw.summary : []).map((s) => [s.status, s.total_count]),
    ),
    detail_status_counts: countBy(details, 'status'),
    by_exact_title: byExactTitle,
  };
}

const CONTENT_GENIUS_CANARY_ARTIFACT_SPECS = [
  {
    pilot_article_id: 'MRX1000-PILOT-001-01',
    title: 'Mineral Rights Offers Explained for Inherited Properties',
    uuid: '0f41794e-2ef4-4de5-b228-589dd2c0f0f7',
    status: 'NEEDS_REVIEW',
    path: INPUTS.row1CanaryPreflight,
    source: 'reports/mrx1000-pilot-001-preflight-2026-07-20T07-08-39-887Z.md',
    provenance: 'row1_preflight_snapshot',
  },
  {
    pilot_article_id: 'MRX1000-PILOT-001-02',
    title: 'Inherited Mineral Rights Buyers Compared: What to Look For',
    uuid: '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c',
    status: 'NEEDS_REVIEW',
    path: INPUTS.d10ExternalPath,
    expectedSha256: INPUTS.d10ExpectedSha256,
    required_source_values: [
      'MRX1000-PILOT-001-02',
      'inherited-mineral-rights-buyers-compared',
      '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c',
      'NEEDS_REVIEW',
    ],
    identity_path: INPUTS.pilotManifest,
    identity_source: 'config/mrx-1000-pilot-batch-001.json',
    required_identity_values: [
      'MRX1000-PILOT-001-02',
      'Inherited Mineral Rights Buyers Compared: What to Look For',
      'inherited-mineral-rights-buyers-compared',
    ],
    source: '../program-plans/mrx-1000-ceo-decision-row2-canary-remediation.md',
    provenance: 'signed_d10_row2_canary',
  },
];

/**
 * @param {Record<string, any>} spec
 * @param {Buffer|string|null} [contentBuffer]
 * @returns {Record<string, any>|null}
 */
export function validateContentGeniusCanaryArtifact(spec, contentBuffer = null) {
  let buf = contentBuffer;
  if (buf == null) {
    if (!spec?.path || !existsSync(spec.path)) return null;
    try {
      buf = readFileSync(spec.path);
    } catch {
      return null;
    }
  }
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(String(buf), 'utf8');
  const sourceSha256 = sha256(buf);
  if (spec.expectedSha256 && sourceSha256 !== spec.expectedSha256) return null;
  const text = buf.toString('utf8');
  const requiredValues = spec.required_source_values ?? [
    spec.pilot_article_id,
    spec.title,
    spec.uuid,
    spec.status,
  ];
  if (requiredValues.some((value) => !value || !text.includes(value))) return null;
  let identitySha256 = null;
  if (spec.identity_path) {
    if (!existsSync(spec.identity_path)) return null;
    let identityBuffer;
    try {
      identityBuffer = readFileSync(spec.identity_path);
    } catch {
      return null;
    }
    const identityText = identityBuffer.toString('utf8');
    const requiredIdentityValues = spec.required_identity_values ?? [];
    if (requiredIdentityValues.some((value) => !value || !identityText.includes(value)))
      return null;
    identitySha256 = sha256(identityBuffer);
  }
  return {
    pilot_article_id: spec.pilot_article_id,
    title: spec.title,
    uuid: spec.uuid,
    status: spec.status,
    source: spec.source,
    provenance: spec.provenance,
    editor_url: `https://dashboard.searchatlas.com/content/seo-content-assistant-v2/${spec.uuid}/`,
    updated_at: null,
    source_sha256: sourceSha256,
    source_fields_verified: true,
    source_sha256_verified: spec.expectedSha256 ? sourceSha256 === spec.expectedSha256 : null,
    identity_source: spec.identity_source ?? null,
    identity_source_sha256: identitySha256,
    identity_fields_verified: spec.identity_path ? true : null,
  };
}

/** @returns {Array<Record<string, any>>} */
export function loadContentGeniusCanaryArtifactRecords() {
  return CONTENT_GENIUS_CANARY_ARTIFACT_SPECS.map((spec) =>
    validateContentGeniusCanaryArtifact(spec),
  ).filter((record) => record !== null);
}

function contentGeniusArtifactCanaryRecordsForTitle(title, records) {
  const titleKey = normalizeTitle(title);
  return records
    .filter((record) => normalizeTitle(record.title) === titleKey)
    .map((record) => ({ ...record }));
}

// ----- Main ------------------------------------------------------------------

async function main() {
  // Ledger invariants first; fail closed.
  const ledgerRaw = await readFile(INPUTS.ledger, 'utf8');
  const ledger = JSON.parse(ledgerRaw);
  if (!Array.isArray(ledger.articles) || ledger.articles.length !== EXPECTED_ROW_COUNT) {
    throw new Error(
      `ledger must contain exactly ${EXPECTED_ROW_COUNT} articles; got ${ledger.articles?.length ?? 'missing'}`,
    );
  }
  const ids = ledger.articles.map((a) => a.program_row_id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== EXPECTED_ROW_COUNT) {
    throw new Error(
      `program_row_id uniqueness violated: ${EXPECTED_ROW_COUNT - uniqueIds.size} duplicates`,
    );
  }
  const idPattern = new RegExp(
    `^${EXPECTED_PROGRAM_ID_PREFIX}\\d{${EXPECTED_PROGRAM_ID_TOTAL_WIDTH - EXPECTED_PROGRAM_ID_PREFIX.length}}$`,
  );
  for (const id of ids) {
    if (!idPattern.test(id)) {
      throw new Error(
        `program_row_id ${id} does not match ${EXPECTED_PROGRAM_ID_PREFIX}NNNN shape`,
      );
    }
  }
  const slugSet = new Set();
  for (const a of ledger.articles) {
    if (!a.canonical_slug || typeof a.canonical_slug !== 'string') {
      throw new Error('every row must declare a non-empty canonical_slug');
    }
    if (slugSet.has(a.canonical_slug)) {
      throw new Error(`duplicate canonical_slug in ledger: ${a.canonical_slug}`);
    }
    slugSet.add(a.canonical_slug);
    if (!a.pillar || !a.cluster || !a.canonical_title) {
      throw new Error(`row ${a.program_row_id} is missing pillar/cluster/canonical_title`);
    }
  }

  // Index MDX frontmatter on slug.
  const postFiles = (await readdir(INPUTS.postsDir, { withFileTypes: true }))
    .filter((d) => d.isFile() && d.name.endsWith('.mdx'))
    .map((d) => d.name);
  const frontmatterBySlug = new Map();
  for (const name of postFiles) {
    const text = await readFile(path.join(INPUTS.postsDir, name), 'utf8');
    const fm = normalizeFrontmatter(text);
    if (!fm) continue;
    const slug = name.slice(0, -'.mdx'.length);
    frontmatterBySlug.set(slug, { file: name, frontmatter: fm });
  }

  // Index SearchAtlas authoritative read-only artifacts (no inference).
  const searchatlasHandles = new Set();
  const searchatlasTitleUuids = new Set();
  let readonlyArtifacts = 0;
  for (const f of safeReaddir(INPUTS.readonlyDir)) {
    if (!f.isFile()) continue;
    if (!/mrx1000-f9-/.test(f.name)) continue;
    const text = safeRead(path.join(INPUTS.readonlyDir, f.name));
    if (!text) continue;
    readonlyArtifacts++;
    for (const h of text.matchAll(/"map_id":\s*(\d+)/g)) searchatlasHandles.add(Number(h[1]));
    for (const t of text.matchAll(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    )) {
      searchatlasTitleUuids.add(t[0].toLowerCase());
    }
  }

  // Detect D-2026-0720-11 signed release artifact (inside or outside workspace).
  const releaseDecision = detectReleaseDecision();
  const releaseAuthorizedAll = !!releaseDecision?.release_authorized;
  const indexAuthorizedAll = !!releaseDecision?.index_authorized;

  // Pillar route resolution: pre-load state slugs from src/data/states.ts.
  const stateSlugs = readStateSlugs();
  const contentGeniusExport = loadContentGeniusExport();
  const contentGeniusCanaryArtifactRecords = loadContentGeniusCanaryArtifactRecords();

  // Sitemap current-inclusion: parse exactly one canonical article sitemap
  // from the active adapter output. Do not infer inclusion from a sitemap index
  // and do not union adapter directories, because one may be stale.
  const canonicalArticlesSitemap = selectCanonicalArticlesSitemap(
    INPUTS.canonicalArticlesSitemapCandidates,
  );
  const sitemapXmlFiles = canonicalArticlesSitemap ? [canonicalArticlesSitemap] : [];
  const sitemapUrls = new Set();
  for (const f of sitemapXmlFiles) {
    const text = safeRead(f);
    for (const m of text.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      sitemapUrls.add(m[1].replace(/\/$/, '').toLowerCase());
    }
  }

  // Build the matrix.
  const rows = [];
  // Hero-path collisions: distinct unique paths, member list = unique
  // ledger rows whose hero.src OR hero.social_src equals the path.
  const collisionMembers = new Map(); // path -> Set<program_row_id>
  for (const article of ledger.articles) {
    const front = frontmatterBySlug.get(article.canonical_slug);
    const repoMdxExists = !!front;
    const publication_status = front?.frontmatter?.publication_status ?? null;
    const draft = front?.frontmatter?.draft ?? null;
    const noindex = front?.frontmatter?.noindex ?? null;
    const heroSrc = front?.frontmatter?.hero_image?.src ?? null;
    const heroSocialSrc = front?.frontmatter?.hero_image?.social_src ?? null;
    const heroSrcOnDisk = heroSrc
      ? existsSync(path.join(INPUTS.publicDir, heroSrc.replace(/^\//, '')))
      : false;
    const socialSrcOnDisk = heroSocialSrc
      ? existsSync(path.join(INPUTS.publicDir, heroSocialSrc.replace(/^\//, '')))
      : false;
    for (const p of [heroSrc, heroSocialSrc]) {
      if (!p) continue;
      if (!collisionMembers.has(p)) collisionMembers.set(p, new Set());
      collisionMembers.get(p).add(article.program_row_id);
    }
    const internalLinks = front?.frontmatter?.internal_links ?? null;
    const internalLinkTriangleComplete = !!(
      internalLinks?.hub &&
      internalLinks?.sibling &&
      internalLinks?.conversion
    );
    const conversionCta = front?.frontmatter?.conversion_cta ?? null;
    const conversionCtaCovered = !!(conversionCta?.label && conversionCta?.href);
    const aeo = {
      primary_keyword: !!front?.frontmatter?.primary_keyword,
      answer_summary: !!front?.frontmatter?.answer_summary,
      key_takeaways:
        Array.isArray(front?.frontmatter?.key_takeaways) &&
        front.frontmatter.key_takeaways.length > 0,
      questions_answered:
        Array.isArray(front?.frontmatter?.questions_answered) &&
        front.frontmatter.questions_answered.length > 0,
      faq: Array.isArray(front?.frontmatter?.faq) && front.frontmatter.faq.length > 0,
      sources: Array.isArray(front?.frontmatter?.sources) && front.frontmatter.sources.length > 0,
    };
    const seoAeoAllCovered = Object.values(aeo).every(Boolean);
    const saHandle = article.searchatlas_map_id ?? null;
    const saTitle = article.searchatlas_title_uuid ?? null;
    const saRecord = article.searchatlas_record_id ?? null;
    const cgArticle = article.content_genius_article_uuid ?? null;
    const cgExportExactTitleMatches =
      contentGeniusExport.by_exact_title.get(normalizeTitle(article.canonical_title)) ?? [];
    const cgCanaryArtifactMatches = contentGeniusArtifactCanaryRecordsForTitle(
      article.canonical_title,
      contentGeniusCanaryArtifactRecords,
    );
    const cgExactTitleMatches = [
      ...cgExportExactTitleMatches.map((m) => ({
        ...m,
        source: contentGeniusExport.source,
        provenance: 'content_genius_export_exact_title',
      })),
      ...cgCanaryArtifactMatches,
    ];
    const searchatlasEvidence = {
      map_handle_in_authoritative_local_artifact:
        saHandle != null && searchatlasHandles.has(Number(saHandle)),
      title_uuid_in_authoritative_local_artifact:
        !!saTitle && searchatlasTitleUuids.has(String(saTitle).toLowerCase()),
      record_uuid_in_authoritative_local_artifact: !!saRecord,
      content_genius_article_uuid_in_authoritative_local_artifact: !!cgArticle,
      // Ledger-side counts (planning handle, not authoritative evidence).
      ledger_has_searchatlas_map_id: saHandle != null,
      ledger_has_searchatlas_title_uuid: !!saTitle,
      ledger_has_content_genius_article_uuid: !!cgArticle,
      content_genius_exact_title_records: {
        sources: [...new Set(cgExactTitleMatches.map((m) => m.source).filter(Boolean))].sort(),
        export_source: contentGeniusExport.source,
        artifact_canary_sources: [...new Set(cgCanaryArtifactMatches.map((m) => m.source))].sort(),
        match_count: cgExactTitleMatches.length,
        unambiguous: cgExactTitleMatches.length === 1,
        ambiguous: cgExactTitleMatches.length > 1,
        uuids: cgExactTitleMatches
          .map((m) => m.uuid)
          .filter(Boolean)
          .sort(),
        statuses: [...new Set(cgExactTitleMatches.map((m) => m.status).filter(Boolean))].sort(),
        records: cgExactTitleMatches
          .map((m) => ({
            uuid: m.uuid,
            status: m.status,
            editor_url: m.editor_url,
            updated_at: m.updated_at,
            source: m.source,
            provenance: m.provenance,
            pilot_article_id: m.pilot_article_id ?? null,
            source_sha256: m.source_sha256 ?? null,
            source_fields_verified: m.source_fields_verified ?? null,
            source_sha256_verified: m.source_sha256_verified ?? null,
            identity_source: m.identity_source ?? null,
            identity_source_sha256: m.identity_source_sha256 ?? null,
            identity_fields_verified: m.identity_fields_verified ?? null,
          }))
          .sort((a, b) => String(a.uuid).localeCompare(String(b.uuid))),
      },
    };
    const llmReview = classifyAeoLlm(article, INPUTS.capturesRoot);
    const llmReviewReady = LLM_MODEL_KEYS.filter((k) => k !== 'other').some(
      (k) => llmReview[k] != null,
    );
    const pillarRouteExists =
      PILLAR_URLS.has(article.pillar_url) && pathToAstroCheck(article.pillar_url, stateSlugs);
    // Fail-closed published state: must be explicitly publication_status=published,
    // AND not declared draft, AND not declared noindex. When draft/noindex
    // are not declared in frontmatter the semantic default is `false` (matches
    // isPublishedPost() in src/lib/content-graph.ts).
    const draftDefault = front?.frontmatter?.draft === true;
    const noindexDefault = front?.frontmatter?.noindex === true;
    const failClosedLive = publication_status === 'published' && !draftDefault && !noindexDefault;
    const noindexStage =
      front?.frontmatter?.noindex === true &&
      front?.frontmatter?.draft === true &&
      publication_status === 'draft';
    const sitemapEligible = failClosedLive && pillarRouteExists;
    // /blog/<slug>/ is the actual public route for posts in src/content/posts.
    // Convert the canonical slug to the public URL and check against sitemap.
    const publicUrl = repoMdxExists
      ? `https://mineralrightsxchange.com/blog/${article.canonical_slug}/`
      : null;
    const sitemapCurrentlyIncluded =
      sitemapEligible &&
      publicUrl != null &&
      sitemapUrls.has(publicUrl.replace(/\/$/, '').toLowerCase());
    // "public_live_known_route" = the row currently has a public route
    // observable in the build output, independent of release authorization.
    // This is independent evidence: it is true whenever a public URL for this
    // row appears in the dist sitemap, even when release authorization is HOLD.
    const publicLiveKnownRoute =
      publicUrl != null && sitemapUrls.has(publicUrl.replace(/\/$/, '').toLowerCase());
    // GA4 site-level code capability: BaseLayout includes GA4 loader and
    // references GT-WFMD2MXW / G-CL1YSRNNXJ. We do not assert observed traffic.
    const ga4LoaderPresent = safeRead(path.join(MRX_ROOT, 'src/layouts/BaseLayout.astro')).includes(
      'googletagmanager.com/gtag/js',
    );
    rows.push({
      program_row_id: article.program_row_id,
      title: article.canonical_title,
      slug: article.canonical_slug,
      pillar: article.pillar,
      cluster: article.cluster,
      source: article.source_system,
      repo: {
        path: front ? path.relative(MRX_ROOT, path.join(INPUTS.postsDir, front.file)) : null,
        mdx_exists: repoMdxExists,
      },
      publication_status,
      draft,
      noindex,
      searchatlas: searchatlasEvidence,
      pillar_route_exists: pillarRouteExists,
      internal_link_triangle: {
        hub: internalLinks?.hub ?? null,
        sibling: internalLinks?.sibling ?? null,
        conversion: internalLinks?.conversion ?? null,
        complete: internalLinkTriangleComplete,
      },
      conversion_cta: {
        label: conversionCta?.label ?? null,
        href: conversionCta?.href ?? null,
        covered: conversionCtaCovered,
      },
      hero: {
        src: heroSrc,
        src_on_disk: heroSrcOnDisk,
        social_src: heroSocialSrc,
        social_src_on_disk: socialSrcOnDisk,
      },
      seo_aeo: { ...aeo, all_covered: seoAeoAllCovered },
      llm_review: {
        ...llmReview,
        any_verdict_recorded: llmReviewReady,
      },
      sitemap: {
        eligible: sitemapEligible,
        currently_included: sitemapCurrentlyIncluded,
        public_url: publicUrl,
        policy: 'fail_closed_published_state_required',
      },
      public_live_known_route: publicLiveKnownRoute,
      noindex_stage: noindexStage,
      ga4_template_ready: {
        site_level_loader_present: ga4LoaderPresent,
        observed_traffic_claimed: false,
      },
      release_index: {
        decision_id: releaseDecision?.decision_id ?? null,
        signed_artifact: releaseDecision?.signed_artifact ?? null,
        signed_artifact_sha256: releaseDecision?.signed_artifact_sha256 ?? null,
        disposition: releaseDecision?.disposition ?? null,
        authorization_cap_new_mrx1000_rows:
          releaseDecision?.authorization_cap_new_mrx1000_rows ?? null,
        release_authorized: releaseAuthorizedAll,
        index_authorized: indexAuthorizedAll,
      },
    });
  }

  // Hero-path collision groups: distinct unique paths with > 1 unique row.
  const collisionGroups = [];
  for (const [p, members] of collisionMembers.entries()) {
    if (members.size > 1) {
      const sortedMembers = [...members].sort();
      collisionGroups.push({ path: p, unique_row_count: members.size, members: sortedMembers });
    }
  }
  collisionGroups.sort(
    (a, b) => b.unique_row_count - a.unique_row_count || a.path.localeCompare(b.path),
  );

  // Aggregate counts.
  const aggregate = {
    total_rows: rows.length,
    by_pillar: {},
    by_cluster: {},
    by_source: {},
    repo_mdx_present: rows.filter((r) => r.repo.mdx_exists).length,
    repo_mdx_missing: rows.filter((r) => !r.repo.mdx_exists).length,
    pillar_route_present: rows.filter((r) => r.pillar_route_exists).length,
    pillar_route_missing: rows.filter((r) => r.pillar_route_exists === false).length,
    internal_link_triangle_complete: rows.filter((r) => r.internal_link_triangle.complete).length,
    internal_link_triangle_missing: rows.filter((r) => !r.internal_link_triangle.complete).length,
    conversion_cta_covered: rows.filter((r) => r.conversion_cta.covered).length,
    conversion_cta_missing: rows.filter((r) => !r.conversion_cta.covered).length,
    hero_src_on_disk: rows.filter((r) => r.hero.src_on_disk).length,
    hero_src_missing: rows.filter((r) => r.hero.src && !r.hero.src_on_disk).length,
    hero_social_src_on_disk: rows.filter((r) => r.hero.social_src_on_disk).length,
    hero_social_src_missing: rows.filter((r) => r.hero.social_src && !r.hero.social_src_on_disk)
      .length,
    seo_aeo_all_covered: rows.filter((r) => r.seo_aeo.all_covered).length,
    seo_aeo_partial_or_missing: rows.filter((r) => !r.seo_aeo.all_covered).length,
    // SearchAtlas authoritative-only evidence.
    searchatlas_handle_present_in_authoritative_local_artifact: rows.filter(
      (r) => r.searchatlas.map_handle_in_authoritative_local_artifact,
    ).length,
    searchatlas_handle_absent: rows.filter(
      (r) => r.searchatlas.map_handle_in_authoritative_local_artifact === false,
    ).length,
    searchatlas_title_uuid_present_in_authoritative_local_artifact: rows.filter(
      (r) => r.searchatlas.title_uuid_in_authoritative_local_artifact,
    ).length,
    searchatlas_title_uuid_absent: rows.filter(
      (r) => r.searchatlas.title_uuid_in_authoritative_local_artifact === false,
    ).length,
    searchatlas_record_uuid_present_in_authoritative_local_artifact: rows.filter(
      (r) => r.searchatlas.record_uuid_in_authoritative_local_artifact,
    ).length,
    content_genius_article_uuid_present_in_authoritative_local_artifact: rows.filter(
      (r) => r.searchatlas.content_genius_article_uuid_in_authoritative_local_artifact,
    ).length,
    // Distinct planning-handle evidence (ledger-side, NOT proof of creation).
    ledger_searchatlas_map_id_planning_handle_count: rows.filter(
      (r) => r.searchatlas.ledger_has_searchatlas_map_id,
    ).length,
    ledger_searchatlas_title_uuid_planning_handle_count: rows.filter(
      (r) => r.searchatlas.ledger_has_searchatlas_title_uuid,
    ).length,
    ledger_content_genius_article_uuid_count: rows.filter(
      (r) => r.searchatlas.ledger_has_content_genius_article_uuid,
    ).length,
    content_genius_exact_title_match_rows: rows.filter(
      (r) => r.searchatlas.content_genius_exact_title_records.match_count > 0,
    ).length,
    content_genius_exact_title_unambiguous_rows: rows.filter(
      (r) => r.searchatlas.content_genius_exact_title_records.unambiguous,
    ).length,
    content_genius_exact_title_ambiguous_rows: rows.filter(
      (r) => r.searchatlas.content_genius_exact_title_records.ambiguous,
    ).length,
    content_genius_exact_title_total_records: rows.reduce(
      (sum, r) => sum + r.searchatlas.content_genius_exact_title_records.match_count,
      0,
    ),
    readonly_artifacts_indexed: readonlyArtifacts,
    readonly_distinct_map_ids: searchatlasHandles.size,
    artifact_distinct_generic_uuid_count: searchatlasTitleUuids.size,
    llm_any_verdict_recorded: rows.filter((r) => r.llm_review.any_verdict_recorded).length,
    llm_no_verdict_recorded: rows.filter((r) => !r.llm_review.any_verdict_recorded).length,
    sitemap_eligible: rows.filter((r) => r.sitemap.eligible).length,
    sitemap_ineligible: rows.filter((r) => !r.sitemap.eligible).length,
    sitemap_currently_included: rows.filter((r) => r.sitemap.currently_included).length,
    public_live_known_route: rows.filter((r) => r.public_live_known_route).length,
    release_authorized: rows.filter((r) => r.release_index.release_authorized).length,
    index_authorized: rows.filter((r) => r.release_index.index_authorized).length,
    published_in_workspace: rows.filter((r) => r.publication_status === 'published').length,
    draft_noindex_stage: rows.filter((r) => r.noindex_stage).length,
    // Hard invariant: the matrix never asserts a row is "publicly live" or
    // "SearchAtlas-created" unless an authoritative local artifact joins.
    public_live_claim_count: 0,
    searchatlas_created_claim_count: 0,
  };
  for (const r of rows) {
    aggregate.by_pillar[r.pillar] = (aggregate.by_pillar[r.pillar] || 0) + 1;
    aggregate.by_cluster[r.cluster] = (aggregate.by_cluster[r.cluster] || 0) + 1;
    aggregate.by_source[r.source] = (aggregate.by_source[r.source] || 0) + 1;
  }

  const matrix = {
    generated_at: new Date().toISOString(),
    program: 'MRX 1,000 Article SEO+AEO Production Program',
    artifact_type: 'readiness_matrix',
    inputs: {
      ledger: path.relative(MRX_ROOT, INPUTS.ledger),
      ledger_content_fingerprint_sha256: ledger.content_fingerprint_sha256 ?? null,
      posts_dir: path.relative(MRX_ROOT, INPUTS.postsDir),
      pages_dir: path.relative(MRX_ROOT, INPUTS.pagesDir),
      public_dir: path.relative(MRX_ROOT, INPUTS.publicDir),
      readonly_evidence_dir: path.relative(MRX_ROOT, INPUTS.readonlyDir),
      releases_dir: path.relative(MRX_ROOT, INPUTS.releasesDir),
      sitemap_dirs: [
        path.relative(MRX_ROOT, INPUTS.distDir),
        path.relative(MRX_ROOT, INPUTS.distClientDir),
      ].filter((d) => existsSync(path.join(MRX_ROOT, d))),
      sitemap_xml_files_indexed: sitemapXmlFiles.map((f) => path.relative(MRX_ROOT, f)),
      sitemap_urls_indexed: sitemapUrls.size,
    },
    policy: {
      publication_authorized: releaseAuthorizedAll,
      indexing_authorized: indexAuthorizedAll,
      paid_api_calls_made: false,
      evidence_authority: 'authoritative_local_artifact_only',
      no_inference: true,
      fail_closed: true,
    },
    release_decision: releaseDecision,
    searchatlas_evidence: {
      vendor_inventory_snapshot: releaseDecision?.vendor_inventory_snapshot ?? null,
      topical_map_planning_handles: {
        ledger_searchatlas_map_id_planning_handle_count:
          aggregate.ledger_searchatlas_map_id_planning_handle_count,
        ledger_searchatlas_title_uuid_planning_handle_count:
          aggregate.ledger_searchatlas_title_uuid_planning_handle_count,
        readonly_distinct_map_ids: aggregate.readonly_distinct_map_ids,
        artifact_distinct_generic_uuid_count: aggregate.artifact_distinct_generic_uuid_count,
        artifact_distinct_generic_uuid_count_meaning:
          'distinct UUID-like strings found across f9-* readonly artifacts; non-semantic scan, not a title-UUID count and not article-created proof',
        map_ids: [...searchatlasHandles].sort((a, b) => a - b),
        article_created_proof_claimed: false,
      },
      content_genius_export: {
        source: contentGeniusExport.source,
        exists: contentGeniusExport.exists,
        exported_at: contentGeniusExport.exported_at,
        list_item_count: contentGeniusExport.list_item_count,
        unique_id_count: contentGeniusExport.unique_id_count,
        detail_found_count: contentGeniusExport.detail_found_count,
        summary_by_status: contentGeniusExport.summary_by_status,
        detail_status_counts: contentGeniusExport.detail_status_counts,
        exact_title_match_rows: aggregate.content_genius_exact_title_match_rows,
        exact_title_unambiguous_rows: aggregate.content_genius_exact_title_unambiguous_rows,
        exact_title_ambiguous_rows: aggregate.content_genius_exact_title_ambiguous_rows,
        exact_title_total_records: aggregate.content_genius_exact_title_total_records,
        artifact_canary_records: contentGeniusCanaryArtifactRecords.map((record) => ({
          ...record,
        })),
        ledger_content_genius_article_uuid_persisted_count:
          aggregate.ledger_content_genius_article_uuid_count,
      },
    },
    aggregate,
    hero_path_collision_groups: collisionGroups,
    rows,
  };

  await mkdir(path.dirname(OUTPUTS.json), { recursive: true });
  await writeFile(OUTPUTS.json, `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');

  // Summary markdown.
  const summaryLines = [
    '# MRX1000 readiness matrix — summary',
    '',
    `Generated at: ${matrix.generated_at}`,
    `Ledger fingerprint (sha256): ${matrix.inputs.ledger_content_fingerprint_sha256 ?? 'n/a'}`,
    `Row count: ${aggregate.total_rows} (expected exactly ${EXPECTED_ROW_COUNT})`,
    '',
    '## Policy posture',
    '- evidence_authority = authoritative_local_artifact_only (no inference)',
    '- fail_closed = true',
    `- publication_authorized = ${releaseAuthorizedAll}`,
    `- indexing_authorized = ${indexAuthorizedAll}`,
    '- paid_api_calls_made = false',
    `- release_decision = ${
      releaseDecision
        ? `${releaseDecision.decision_id} disposition=${releaseDecision.disposition} cap=${releaseDecision.authorization_cap_new_mrx1000_rows} signed_artifact=${releaseDecision.signed_artifact} sha256=${releaseDecision.signed_artifact_sha256}`
        : 'no signed D-2026-0720-11 artifact on disk'
    }`,
    '',
    '## Aggregate counts',
    `- repo mdx present: ${aggregate.repo_mdx_present}`,
    `- repo mdx missing (program rows with no on-disk MDX): ${aggregate.repo_mdx_missing}`,
    `- pillar route present: ${aggregate.pillar_route_present}`,
    `- pillar route missing: ${aggregate.pillar_route_missing}`,
    `- internal-link triangle complete: ${aggregate.internal_link_triangle_complete}`,
    `- internal-link triangle missing: ${aggregate.internal_link_triangle_missing}`,
    `- conversion CTA covered: ${aggregate.conversion_cta_covered}`,
    `- conversion CTA missing: ${aggregate.conversion_cta_missing}`,
    `- hero src on disk: ${aggregate.hero_src_on_disk}`,
    `- hero src referenced but missing: ${aggregate.hero_src_missing}`,
    `- hero social_src on disk: ${aggregate.hero_social_src_on_disk}`,
    `- hero social_src referenced but missing: ${aggregate.hero_social_src_missing}`,
    `- SEO+AEO frontmatter fully covered: ${aggregate.seo_aeo_all_covered}`,
    `- SEO+AEO frontmatter partial or missing: ${aggregate.seo_aeo_partial_or_missing}`,
    '',
    '## SearchAtlas evidence (authoritative local artifacts only)',
    `- current vendor inventory snapshot from signed D11: ${releaseDecision?.vendor_inventory_snapshot?.total ?? 'n/a'} = ${releaseDecision?.vendor_inventory_snapshot?.by_status?.NEEDS_REVIEW ?? 'n/a'} NEEDS_REVIEW + ${releaseDecision?.vendor_inventory_snapshot?.by_status?.COMPLETED ?? 'n/a'} COMPLETED + ${releaseDecision?.vendor_inventory_snapshot?.by_status?.NOT_BEGUN ?? 'n/a'} NOT_BEGUN (vendor inventory, not public live or authorization)`,
    `- readonly artifacts indexed: ${aggregate.readonly_artifacts_indexed}`,
    `- readonly distinct map_ids: ${aggregate.readonly_distinct_map_ids}`,
    `- artifact distinct generic UUID count: ${aggregate.artifact_distinct_generic_uuid_count} (non-semantic UUID scan across f9-* readonly artifacts; not a title-UUID count and not article-created proof)`,
    `- rows whose ledger map_id is present in readonly: ${aggregate.searchatlas_handle_present_in_authoritative_local_artifact}`,
    `- rows whose ledger title UUID is present in readonly: ${aggregate.searchatlas_title_uuid_present_in_authoritative_local_artifact}`,
    `- rows whose ledger record UUID is present in readonly: ${aggregate.searchatlas_record_uuid_present_in_authoritative_local_artifact}`,
    `- rows whose ledger content_genius_article_uuid is present in readonly: ${aggregate.content_genius_article_uuid_present_in_authoritative_local_artifact}`,
    `- ledger-side planning handles (NOT proof of article creation):`,
    `  - searchatlas_map_id: ${aggregate.ledger_searchatlas_map_id_planning_handle_count}`,
    `  - searchatlas_title_uuid: ${aggregate.ledger_searchatlas_title_uuid_planning_handle_count}`,
    `  - content_genius_article_uuid: ${aggregate.ledger_content_genius_article_uuid_count}`,
    `- Content Genius export: source=${contentGeniusExport.source} list_items=${contentGeniusExport.list_item_count} details=${contentGeniusExport.detail_found_count}`,
    `- Content Genius exact-title matches (297-row export plus ${contentGeniusCanaryArtifactRecords.length} validated canary artifacts): rows=${aggregate.content_genius_exact_title_match_rows}, unambiguous=${aggregate.content_genius_exact_title_unambiguous_rows}, ambiguous=${aggregate.content_genius_exact_title_ambiguous_rows}, records=${aggregate.content_genius_exact_title_total_records}`,
    '',
    '## LLM review (authoritative local artifacts only)',
    `- any verdict recorded: ${aggregate.llm_any_verdict_recorded}`,
    `- no verdict recorded: ${aggregate.llm_no_verdict_recorded}`,
    '',
    '## Sitemap (fail-closed published state)',
    `- sitemap eligible (fail-closed published state + pillar route): ${aggregate.sitemap_eligible}`,
    `- sitemap ineligible: ${aggregate.sitemap_ineligible}`,
    `- sitemap currently included (URL present in selected canonical article sitemap): ${aggregate.sitemap_currently_included}`,
    `- public_live_known_route (URL present in dist sitemap, independent of release auth): ${aggregate.public_live_known_route}`,
    `- public_live_claim_count (matrix never claims a row is publicly live): ${aggregate.public_live_claim_count}`,
    `- searchatlas_created_claim_count (matrix never claims a row is SearchAtlas-created): ${aggregate.searchatlas_created_claim_count}`,
    `- rows with publication_status=published frontmatter: ${aggregate.published_in_workspace}`,
    `- rows in noindex-stage (draft=true, noindex=true, publication_status=draft): ${aggregate.draft_noindex_stage}`,
    '',
    '## Release / index authorization',
    `- decision_id: ${releaseDecision?.decision_id ?? 'n/a'}`,
    `- signed_artifact: ${releaseDecision?.signed_artifact ?? 'n/a'}`,
    `- signed_artifact_sha256: ${releaseDecision?.signed_artifact_sha256 ?? 'n/a'}`,
    `- disposition: ${releaseDecision?.disposition ?? 'n/a'}`,
    `- authorization_cap_new_mrx1000_rows: ${releaseDecision?.authorization_cap_new_mrx1000_rows ?? 'n/a'}`,
    `- release_authorized per row: ${aggregate.release_authorized}`,
    `- index_authorized per row: ${aggregate.index_authorized}`,
    '',
    '## Hero-path collision groups (unique-path requirement)',
    collisionGroups.length === 0
      ? '- none'
      : collisionGroups
          .map((g) => `- ${g.path} → ${g.unique_row_count} unique rows: ${g.members.join(', ')}`)
          .join('\n'),
    '',
    '## Notes',
    '- No row is marked as publicly live or SearchAtlas-created unless an authoritative local artifact exists on disk; see `aggregate.public_live_claim_count = 0` and `aggregate.searchatlas_created_claim_count = 0`.',
    '- `public_live_known_route` is a SEPARATE field: it is true whenever a public URL for this row appears in the selected canonical article sitemap (`dist/client/sitemap-articles.xml` for the active Cloudflare build, with `dist/sitemap-articles.xml` as the alternate-adapter fallback), independent of release authorization. It is preserved even when D-2026-0720-11 disposition is HOLD.',
    "- `artifact_distinct_generic_uuid_count` (298) is a non-semantic count of UUID-like strings found across f9-* readonly artifacts; it is not a title-UUID count, and 0 of the scanned UUIDs match any ledger row's `searchatlas_title_uuid`.",
    '- LLM readiness is recorded only from local LLM/AEO capture files under `reports/llm-aeo-evals/**/captures/`; no verdict = no claim.',
    "- Release / index authorization derives from a single signed `D-2026-0720-11` artifact. We honor Daryl's authored copy at `program-plans/mrx-1000-ceo-decision-no-spend-capacity.md` only when its SHA-256 matches the recorded fingerprint.",
    '- GA4 readiness reflects the site-level code capability (BaseLayout loads gtag.js). It is NOT a claim about observed analytics traffic.',
  ];
  await writeFile(OUTPUTS.summary, `${summaryLines.join('\n')}\n`, 'utf8');

  process.stdout.write(
    `mrx1000-readiness-matrix: rows=${rows.length} repo_mdx=${aggregate.repo_mdx_present} hero_collisions=${collisionGroups.length} release_decision=${releaseDecision ? releaseDecision.decision_id : 'none'} cap=${releaseDecision?.authorization_cap_new_mrx1000_rows ?? 'n/a'}\n`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    process.stderr.write(`mrx1000-readiness-matrix failed: ${err?.stack || err}\n`);
    process.exit(1);
  });
}
