#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(SCRIPT_DIR, '..');
const WORKSPACE_ROOT = path.resolve(MRX_ROOT, '..');
const LEDGER_OUTPUT_DIR = process.env.MRX1000_LEDGER_OUTPUT_DIR
  ? path.resolve(process.env.MRX1000_LEDGER_OUTPUT_DIR)
  : path.join(MRX_ROOT, 'config');

function portableWorkspacePath(filePath) {
  const absolute = path.resolve(filePath);
  const repoRelative = path.relative(MRX_ROOT, absolute);
  if (
    repoRelative &&
    repoRelative !== '..' &&
    !repoRelative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(repoRelative)
  ) {
    return `mrx/${repoRelative.split(path.sep).join('/')}`;
  }
  return (path.relative(WORKSPACE_ROOT, absolute) || '.').split(path.sep).join('/');
}

const INPUTS = {
  quotaPlan: path.join(
    WORKSPACE_ROOT,
    'program-plans/mrx-1000-article-seo-aeo-program-first-pass.json',
  ),
  postsDir: path.join(MRX_ROOT, 'src/content/posts'),
  pilot: path.join(MRX_ROOT, 'config/mrx-1000-pilot-batch-001.json'),
  release10PostPublicationVerification: path.join(
    MRX_ROOT,
    'artifacts/mrx1000-release-10/release/post-publication-verification.json',
  ),
  release10Batch: path.join(MRX_ROOT, 'config/mrx1000-release-10-batch.json'),
  mapRegistry: path.join(MRX_ROOT, 'config/searchatlas-topical-map-registry.json'),
  legacySearchAtlasMaps:
    process.env.MRX_SEARCHATLAS_MAP_EXPORT ??
    '/Users/darylhill/.hermes/kanban/boards/mrx-growth/searchatlas_competitor_keyword_gap_20260614/searchatlas_topical_maps_for_pillars.json',
  factoryQueue:
    process.env.MRX_FACTORY_QUEUE ??
    '/Users/darylhill/.hermes/kanban/boards/mrx-growth/content_queue_10000/mrx_10000_seo_aeo_article_queue.csv',
};

const OUTPUTS = {
  json: path.join(LEDGER_OUTPUT_DIR, 'mrx-1000-canonical-content-ledger.json'),
  csv: path.join(LEDGER_OUTPUT_DIR, 'mrx-1000-canonical-content-ledger.csv'),
  report: process.env.MRX1000_LEDGER_REPORT_PATH
    ? path.resolve(process.env.MRX1000_LEDGER_REPORT_PATH)
    : path.join(WORKSPACE_ROOT, 'program-plans/mrx-1000-canonical-content-ledger-report.md'),
};
const PRIOR_LEDGER_PATH = process.env.MRX1000_LEDGER_PRIOR_PATH
  ? path.resolve(process.env.MRX1000_LEDGER_PRIOR_PATH)
  : OUTPUTS.json;

const PROGRAM_ROW_ID_RE = /^MRX1000-(\d+)$/;
const SUPERSEDED_CANONICAL_SLUGS = new Set([
  'what-every-mineral-rights-owner-needs-to-know',
  'what-factors-determine-your-mineral-rights-value',
  'what-influences-the-suggested-price-for-your-mineral-rights-assessment',
  'what-sellers-get-wrong-about-mineral-rights',
  'what-to-avoid-in-the-mineral-rights-selling-process',
  'what-to-expect-during-your-no-obligation-mineral-rights-assessment-process',
  'what-to-know-about-the-mineral-rights-selling-process',
  'what-you-must-know-before-evaluating-mineral-rights',
  'what-determines-the-value-of-your-texas-mineral-rights',
  'what-are-the-biggest-pitfalls-in-selling-mineral-rights',
  'unlocking-the-true-worth-of-your-mineral-rights-a-comprehensive-evaluation-guide',
  'ensuring-transparency-how-we-avoid-predatory-tactics-in-mineral-rights-assessments',
  'transparency-in-mineral-rights-how-we-compare-to-other-services',
  'why-mineralrightsxchange-is-your-most-reliable-choice-for-transparent-mineral-rights-acquisition',
  'why-mineralrightsxchange-offers-unique-advantages-over-competing-mineral-rights-acquisition-services',
  'why-you-should-avoid-these-seller-pitfalls',
  'your-guide-to-fine-tuning-mineral-rights-valuation',
  '7-effective-strategies-to-keep-your-personal-information-confidential-in-mineral-rights-transactions',
  'enhancing-your-mineral-rights-sale-how-ai-streamlines-the-comparison-process',
  'mineral-valuation-sensitivity-analysis-which-assumptions-matter',
  'net-revenue-interest-as-a-mineral-valuation-input',
  'offset-activity-as-evidence-of-development-potential',
  'operator-track-record-and-mineral-development-risk',
  'pdp-pud-and-undeveloped-acreage-in-mineral-valuation',
]);
const SUCCESSOR_CANONICAL_SLUGS = new Map([
  ['what-every-mineral-rights-owner-needs-to-know', 'should-i-sell-my-mineral-rights'],
  ['what-factors-determine-your-mineral-rights-value', 'calculate-price-per-net-mineral-acre'],
  [
    'what-influences-the-suggested-price-for-your-mineral-rights-assessment',
    'what-a-mineral-rights-assessment-does-and-does-not-tell-you',
  ],
  ['what-sellers-get-wrong-about-mineral-rights', 'mineral-rights-sale-decision-log'],
  [
    'what-to-avoid-in-the-mineral-rights-selling-process',
    'how-to-build-a-mineral-rights-sale-document-package-index',
  ],
  [
    'what-to-expect-during-your-no-obligation-mineral-rights-assessment-process',
    'how-to-talk-to-your-family-before-you-decide-to-sell-mineral-rights',
  ],
  [
    'what-to-know-about-the-mineral-rights-selling-process',
    'how-to-choose-a-family-point-person-for-mineral-rights-inquiries',
  ],
  [
    'what-you-must-know-before-evaluating-mineral-rights',
    'property-scope-crosswalk-mineral-rights-offers',
  ],
  ['why-you-should-avoid-these-seller-pitfalls', 'mineral-rights-offer-correspondence-index'],
  [
    'your-guide-to-fine-tuning-mineral-rights-valuation',
    'mineral-rights-valuation-input-correction-packet',
  ],
  [
    'what-determines-the-value-of-your-texas-mineral-rights',
    'why-doesnt-my-texas-mineral-tax-value-match-a-sale-estimate',
  ],
  [
    'what-are-the-biggest-pitfalls-in-selling-mineral-rights',
    'what-should-i-do-if-a-texas-mineral-rights-sale-goes-wrong',
  ],
  [
    'unlocking-the-true-worth-of-your-mineral-rights-a-comprehensive-evaluation-guide',
    'why-is-my-mineral-rights-valuation-range-so-wide',
  ],
  [
    'ensuring-transparency-how-we-avoid-predatory-tactics-in-mineral-rights-assessments',
    'transparent-mineral-rights-reviews-questions-that-help-owners-avoid-pressure',
  ],
  [
    'transparency-in-mineral-rights-how-we-compare-to-other-services',
    'how-to-compare-mineral-rights-review-services-transparently',
  ],
  [
    'why-mineralrightsxchange-is-your-most-reliable-choice-for-transparent-mineral-rights-acquisition',
    'why-mineralrightsxchange-focuses-on-transparent-mineral-rights-acquisition',
  ],
  [
    'why-mineralrightsxchange-offers-unique-advantages-over-competing-mineral-rights-acquisition-services',
    'how-mineralrightsxchange-approaches-mineral-rights-acquisition',
  ],
  [
    '7-effective-strategies-to-keep-your-personal-information-confidential-in-mineral-rights-transactions',
    'mineral-rights-document-redaction-checklist-before-sharing-records',
  ],
  [
    'enhancing-your-mineral-rights-sale-how-ai-streamlines-the-comparison-process',
    'mineral-rights-ai-source-trace',
  ],
  [
    'mineral-valuation-sensitivity-analysis-which-assumptions-matter',
    'mineral-valuation-sensitivity-analysis-one-variable-scenario-worksheet',
  ],
  [
    'net-revenue-interest-as-a-mineral-valuation-input',
    'mineral-rights-worksheet-question-locator',
  ],
  [
    'offset-activity-as-evidence-of-development-potential',
    'offset-activity-property-connection-cross-check',
  ],
  ['operator-track-record-and-mineral-development-risk', 'mineral-rights-operator-name-change-log'],
  [
    'pdp-pud-and-undeveloped-acreage-in-mineral-valuation',
    'pdp-pud-and-undeveloped-acreage-terminology-register',
  ],
]);
const APPROVED_REKEY_SEARCH_INTENT_BY_SLUG = new Map([
  ['should-i-sell-my-mineral-rights', 'transactional'],
  ['calculate-price-per-net-mineral-acre', 'informational'],
  ['what-a-mineral-rights-assessment-does-and-does-not-tell-you', 'informational'],
  ['mineral-rights-sale-decision-log', 'informational'],
  ['how-to-build-a-mineral-rights-sale-document-package-index', 'informational'],
  ['how-to-talk-to-your-family-before-you-decide-to-sell-mineral-rights', 'informational'],
  ['how-to-choose-a-family-point-person-for-mineral-rights-inquiries', 'informational'],
  ['property-scope-crosswalk-mineral-rights-offers', 'informational'],
  ['why-doesnt-my-texas-mineral-tax-value-match-a-sale-estimate', 'informational'],
  ['mineral-rights-document-redaction-checklist-before-sharing-records', 'informational'],
  ['mineral-rights-ai-source-trace', 'informational'],
  ['mineral-valuation-sensitivity-analysis-one-variable-scenario-worksheet', 'informational'],
  ['mineral-rights-worksheet-question-locator', 'informational'],
  ['offset-activity-property-connection-cross-check', 'informational'],
  ['mineral-rights-operator-name-change-log', 'informational'],
  ['pdp-pud-and-undeveloped-acreage-terminology-register', 'informational'],
]);

async function loadPriorProgramRowIds() {
  let prior;
  try {
    prior = JSON.parse(await readFile(PRIOR_LEDGER_PATH, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        bySlug: new Map(),
        sourceSystemBySlug: new Map(),
        incumbentRepoCount: 0,
        maxSequenceEver: 0,
        wave58Rekey: null,
        wave59Rekey: null,
        wave60Rekey: null,
        wave61Rekey: null,
        wave62Rekey: null,
        wave63Rekey: null,
        wave64Rekey: null,
        wave65Rekey: null,
        wave66Rekey: null,
        wave67Rekey: null,
        wave68Rekey: null,
        wave69Rekey: null,
        wave70Rekey: null,
        wave71Refresh: null,
        wave72Rekey: null,
        wave73Rekey: null,
        wave74Rekey: null,
        wave75Rekey: null,
        wave76Rekey: null,
        wave77Rekey: null,
        wave78Rekey: null,
        wave79Rekey: null,
        wave80Rekey: null,
      };
    }
    throw error;
  }

  const bySlug = new Map();
  const sourceSystemBySlug = new Map();
  const seenIds = new Set();
  let maxSequenceEver = Number(prior.identity_registry?.max_sequence_ever ?? 0);
  for (const row of prior.articles ?? []) {
    const slug = String(row.canonical_slug ?? '');
    const id = String(row.program_row_id ?? '');
    const match = id.match(PROGRAM_ROW_ID_RE);
    if (!slug || !match) continue;
    if (bySlug.has(slug)) throw new Error(`Prior ledger repeats canonical slug: ${slug}`);
    if (seenIds.has(id)) throw new Error(`Prior ledger repeats program_row_id: ${id}`);
    bySlug.set(slug, id);
    sourceSystemBySlug.set(slug, String(row.source_system ?? ''));
    const successorSlug = SUCCESSOR_CANONICAL_SLUGS.get(slug);
    // Preserve a materialized successor's own incumbent identity. Only seed the
    // successor from its retired planning row when it is not already present.
    if (successorSlug && !bySlug.has(successorSlug)) {
      bySlug.set(successorSlug, id);
      sourceSystemBySlug.set(successorSlug, String(row.source_system ?? ''));
    }
    seenIds.add(id);
    maxSequenceEver = Math.max(maxSequenceEver, Number(match[1]));
  }
  return {
    bySlug,
    sourceSystemBySlug,
    incumbentRepoCount: (prior.articles ?? []).filter(
      (row) => String(row.source_system ?? '') === 'astro_repo',
    ).length,
    maxSequenceEver,
    wave58Rekey: prior.identity_registry?.wave58_rekey ?? null,
    wave59Rekey: prior.identity_registry?.wave59_rekey ?? null,
    wave60Rekey: prior.identity_registry?.wave60_rekey ?? null,
    wave61Rekey: prior.identity_registry?.wave61_rekey ?? null,
    wave62Rekey: prior.identity_registry?.wave62_rekey ?? null,
    wave63Rekey: prior.identity_registry?.wave63_rekey ?? null,
    wave64Rekey: prior.identity_registry?.wave64_rekey ?? null,
    wave65Rekey: prior.identity_registry?.wave65_rekey ?? null,
    wave66Rekey: prior.identity_registry?.wave66_rekey ?? null,
    wave67Rekey: prior.identity_registry?.wave67_rekey ?? null,
    wave68Rekey: prior.identity_registry?.wave68_rekey ?? null,
    wave69Rekey: prior.identity_registry?.wave69_rekey ?? null,
    wave70Rekey: prior.identity_registry?.wave70_rekey ?? null,
    wave71Refresh: prior.identity_registry?.wave71_refresh ?? null,
    wave72Rekey: prior.identity_registry?.wave72_rekey ?? null,
    wave73Rekey: prior.identity_registry?.wave73_rekey ?? null,
    wave74Rekey: prior.identity_registry?.wave74_rekey ?? null,
    wave75Rekey: prior.identity_registry?.wave75_rekey ?? null,
    wave76Rekey: prior.identity_registry?.wave76_rekey ?? null,
    wave77Rekey: prior.identity_registry?.wave77_rekey ?? null,
    wave78Rekey: prior.identity_registry?.wave78_rekey ?? null,
    wave79Rekey: prior.identity_registry?.wave79_rekey ?? null,
    wave80Rekey: prior.identity_registry?.wave80_rekey ?? null,
  };
}

const CLUSTER_ORDER = [
  'sell-mineral-rights-decision-process',
  'valuation-methodology-drivers',
  'offer-review-buyer-comparison-safety',
  'inherited-estate-probate',
  'royalties-owner-operations',
  'tax-1031-legal-education',
  'texas-county-basin-local-intent',
  'title-lease-ownership-documents',
  'mrx-methodology-transparency-underwriter-process',
];

const CLUSTERS = {
  'sell-mineral-rights-decision-process': {
    pillar: 'sell-mineral-rights',
    pillarUrl: '/sell-mineral-rights/',
    funnelStage: 'decision',
  },
  'valuation-methodology-drivers': {
    pillar: 'mineral-rights-value',
    pillarUrl: '/mineral-rights-value/',
    funnelStage: 'consideration',
  },
  'offer-review-buyer-comparison-safety': {
    pillar: 'offer-review',
    pillarUrl: '/offer-review/',
    funnelStage: 'decision',
  },
  'inherited-estate-probate': {
    pillar: 'inherited-mineral-rights',
    pillarUrl: '/inherited-mineral-rights/',
    funnelStage: 'education',
  },
  'royalties-owner-operations': {
    pillar: 'oil-and-gas-royalties',
    pillarUrl: '/learning-center/oil-and-gas-royalties/',
    funnelStage: 'education',
  },
  'tax-1031-legal-education': {
    pillar: 'mineral-rights-taxes',
    pillarUrl: '/learning-center/mineral-rights-taxes/',
    funnelStage: 'education',
  },
  'texas-county-basin-local-intent': {
    pillar: 'texas-mineral-rights',
    pillarUrl: '/mineral-rights/texas/',
    funnelStage: 'consideration',
  },
  'title-lease-ownership-documents': {
    pillar: 'title-lease-ownership',
    pillarUrl: '/learning-center/title-lease-ownership/',
    funnelStage: 'education',
  },
  'mrx-methodology-transparency-underwriter-process': {
    pillar: 'mrx-methodology',
    pillarUrl: '/methodology/',
    funnelStage: 'consideration',
  },
};

const LEGACY_CLUSTER_MAP = {
  'sell-mineral-rights': 'sell-mineral-rights-decision-process',
  valuation: 'valuation-methodology-drivers',
  'offer-review': 'offer-review-buyer-comparison-safety',
  inherited: 'inherited-estate-probate',
  royalties: 'royalties-owner-operations',
  'tax-1031': 'tax-1031-legal-education',
  'state-county': 'texas-county-basin-local-intent',
};

const CLASSIFICATION_RULES = [
  [
    'mrx-methodology-transparency-underwriter-process',
    /(mineralrightsxchange|underwriter|\bour\b|transparen|platform|guarantee|no-obligation|free assessment|free review)/,
  ],
  ['inherited-estate-probate', /(inherit|\bheir|estate|probate|executor|\btrust|divorce)/],
  [
    'tax-1031-legal-education',
    /(1031|\btax\b|taxes|capital gains|severance|federal tax|clawback|purchase agreement)/,
  ],
  [
    'offer-review-buyer-comparison-safety',
    /(\boffer|\bbuyer|lowball|predatory|\bscam|red flag|competing|hidden fee|multiple offers|negotiate|unfair)/,
  ],
  [
    'title-lease-ownership-documents',
    /(\btitle|\bdeed|conveyance|\blease|division order|surface rights|ownership|net mineral acres|royalty acres|documents|types of mineral rights|own mineral)/,
  ],
  [
    'royalties-owner-operations',
    /(\broyalty|royalties|royalty check|production payment|operator statement)/,
  ],
  [
    'sell-mineral-rights-decision-process',
    /(\bsell|\bselling|\bsale\b|closing|partial interest|what happens after)/,
  ],
  [
    'texas-county-basin-local-intent',
    /(\btexas|permian|eagle ford|midland|delaware basin|\bcounty|railroad commission|haynesville)/,
  ],
  [
    'valuation-methodology-drivers',
    /(\bvalue|valuation|\bworth|pricing|assessment|appraisal|oil price|production type|drilling)/,
  ],
];

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'before',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'guide',
  'explained',
  'mineral',
  'minerals',
  'my',
  'of',
  'on',
  'or',
  'owner',
  'owners',
  'our',
  'right',
  'rights',
  'texas',
  'the',
  'their',
  'they',
  'to',
  'vs',
  'what',
  'when',
  'why',
  'with',
  'understanding',
  'you',
  'your',
]);

function parseCsv(source) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...values] = rows;
  return values.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])),
  );
}

function toCsv(rows, columns) {
  const quote = (value) => {
    const text = value == null ? '' : Array.isArray(value) ? value.join('; ') : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => quote(row[column])).join(',')),
  ].join('\n');
}

function frontmatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const scalar = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!scalar) continue;
    const [, key, raw] = scalar;
    let value = raw.trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === "'") value = value.replaceAll("''", "'");
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }
    data[key] = value;
  }
  return data;
}

function normalizeTitle(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(value) {
  return normalizeTitle(value).replaceAll(' ', '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function titleTokens(value) {
  return new Set(
    normalizeTitle(value)
      .split(' ')
      .filter((token) => token && !STOP_WORDS.has(token)),
  );
}

function jaccard(left, right) {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (!a.size && !b.size) return 1;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

function classify(haystack, fallback = 'sell-mineral-rights-decision-process') {
  const normalized = normalizeTitle(haystack);
  return CLASSIFICATION_RULES.find(([, pattern]) => pattern.test(normalized))?.[0] ?? fallback;
}

function inferIntent(cluster, provided = '') {
  if (provided) return provided;
  if (cluster === 'offer-review-buyer-comparison-safety') return 'commercial-investigation';
  if (cluster === 'sell-mineral-rights-decision-process') return 'transactional';
  if (cluster === 'mrx-methodology-transparency-underwriter-process')
    return 'commercial-investigation';
  if (cluster === 'texas-county-basin-local-intent') return 'local-informational';
  return 'informational';
}

// UUID v4 / v5 shape match. Pilot / planning rows MUST NOT carry anything in
// `searchatlas_record_id` or `content_genius_article_uuid` that does not match
// this shape; local manifest IDs like `MRX1000-PILOT-001-NN` are explicitly
// excluded and live under `pilot_article_id` only.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function baseRow(candidate) {
  const cluster = candidate.cluster;
  const clusterConfig = CLUSTERS[cluster];
  const title = String(candidate.title).trim();
  const slug = slugify(candidate.slug || title);
  // `searchatlas_record_id` is reserved for an authoritative Content Genius /
  // SearchAtlas article record UUID. Local manifest IDs (MRX1000-PILOT-001-NN,
  // topical-map title UUIDs, queue IDs, etc.) are NEVER allowed here — they
  // belong in `pilot_article_id` / `source_record_id` / `searchatlas_title_uuid`.
  const searchatlasRecordId = candidate.searchatlasRecordId ?? null;
  const searchatlasRecordIdIsUuid =
    searchatlasRecordId != null && UUID_RE.test(searchatlasRecordId);
  return {
    canonical_title: title,
    canonical_slug: slug,
    canonical_url: `https://mineralrightsxchange.com/blog/${slug}/`,
    pillar: clusterConfig.pillar,
    pillar_url: clusterConfig.pillarUrl,
    cluster,
    primary_keyword: candidate.primaryKeyword || normalizeTitle(title),
    secondary_keywords: candidate.secondaryKeywords ?? [],
    search_intent: inferIntent(cluster, candidate.searchIntent),
    funnel_stage: clusterConfig.funnelStage,
    owner_persona: candidate.ownerPersona || 'Texas mineral rights owner',
    source_system: candidate.sourceSystem,
    source_record_id: candidate.sourceRecordId,
    source_handle: candidate.sourceHandle,
    searchatlas_map_id: candidate.searchatlasMapId ?? null,
    searchatlas_title_uuid: candidate.searchatlasTitleUuid ?? null,
    // Authoritative SearchAtlas / Content Genius record UUID. Any non-null
    // value MUST be a UUID; non-UUID values are dropped and surfaced through
    // `searchatlas_record_id_dropped` so the audit trail is complete.
    searchatlas_record_id: searchatlasRecordIdIsUuid ? searchatlasRecordId : null,
    searchatlas_record_id_dropped:
      searchatlasRecordId != null && !searchatlasRecordIdIsUuid ? searchatlasRecordId : null,
    content_genius_article_uuid: candidate.contentGeniusArticleUuid ?? null,
    content_genius_editor_url: candidate.contentGeniusEditorUrl ?? null,
    repo_path: candidate.repoPath ?? null,
    existing_url: candidate.existingUrl ?? null,
    publication_status: candidate.publicationStatus ?? null,
    draft: candidate.draft ?? null,
    // `frontmatter_noindex` is the literal `noindex` field on the MDX
    // frontmatter (or `false` if absent and the row is not a pilot noindex-
    // stage shell). It is independent of the publication gate.
    frontmatter_noindex: candidate.frontmatterNoindex ?? false,
    // `publication_gate_nonpublic` is true when the row is held back from
    // release/staging regardless of whether `noindex` was declared. It is
    // derived from the row's publication status and `draft` fact, NOT from
    // `frontmatter_noindex`. The two fields are tracked separately so the
    // ledger cannot imply a nonpublic row is index-ready just because
    // `noindex` is absent from frontmatter.
    publication_gate_nonpublic: candidate.publicationGateNonpublic ?? true,
    // `noindex_required` is retained as a derived, single-source field used
    // by downstream pipelines; it is the disjunction of the two above.
    noindex_required: candidate.noindexRequired ?? false,
    // Preservation classification for the row — one of:
    //   `live_public_published_route`         (verified sitemap-published rows)
    //   `incumbent_draft_nonpublic_held`      (nonpublic MDX rows)
    //   `pilot_draft_noindex_stage`           (the 25 MRX1000-PILOT-001 shells)
    //   `planning_only_inventory`             (remaining searchatlas/factory/
    //                                          editorial-gap planning rows)
    preservation_classification: candidate.preservationClassification ?? 'planning_only_inventory',
    normalized_status: candidate.normalizedStatus,
    publication_state: candidate.publicationState,
    is_pilot_001: candidate.isPilot001 ?? false,
    map_cluster: candidate.mapCluster ?? null,
    pilot_article_id: candidate.pilotArticleId ?? null,
    pilot_batch_id: candidate.pilotBatchId ?? null,
    pilot_mdx_path: candidate.pilotMdxPath ?? null,
    pilot_manifest_path: candidate.pilotManifestPath ?? null,
    pilot_map_cluster: candidate.pilotMapCluster ?? null,
    pilot_content_batch: candidate.pilotContentBatch ?? null,
    pilot_content_program: candidate.pilotContentProgram ?? null,
    pilot_content_cluster: candidate.pilotContentCluster ?? null,
    pilot_content_intent: candidate.pilotContentIntent ?? null,
    pilot_draft: candidate.pilotDraft ?? null,
    pilot_mdx_mtime_ms: candidate.pilotMdxMtimeMs ?? null,
    pilot_externally_published: candidate.pilotExternallyPublished ?? false,
    // Pilot-manifest SearchAtlas `searchatlas_record_status` is planned /
    // staging workflow metadata, NOT an authoritative Content Genius readback.
    // It is stored under a workflow-status field and explicitly labelled
    // `searchatlas_workflow_status_evidence_is_non_creation` on pilot rows so
    // downstream consumers cannot misread it as evidence of a created article.
    pilot_searchatlas_workflow_status: candidate.searchatlasRecordStatus ?? null,
    pilot_searchatlas_workflow_status_evidence_is_non_creation: Boolean(
      candidate.searchatlasRecordStatus,
    ),
    // Back-compat alias preserved for callers that still reference the old
    // field name. New code should read `pilot_searchatlas_workflow_status`.
    pilot_searchatlas_record_status: candidate.searchatlasRecordStatus ?? null,
    pilot_dedupe_disposition: candidate.dedupeDisposition ?? null,
    pilot_compliance_gate: candidate.complianceGate ?? null,
    pilot_compliance_disposition: candidate.complianceDisposition ?? null,
    pilot_compliance_publication_approval: candidate.compliancePublicationApproval ?? null,
    pilot_compliance_legal_tax_sensitive: candidate.complianceLegalTaxSensitive ?? false,
    pilot_compliance_human_escalation_required:
      candidate.complianceHumanEscalationRequired ?? false,
    pilot_compliance_human_escalation_specialist:
      candidate.complianceHumanEscalationSpecialist ?? null,
    dedupe_group_id: `canonical:${slug}`,
    canonical_group_owner_url: `https://mineralrightsxchange.com/blog/${slug}/`,
    action: candidate.action,
    action_reason: candidate.actionReason,
    compliance_status: candidate.complianceStatus,
    schema_status: candidate.schemaStatus,
    internal_link_role: candidate.internalLinkRole,
    next_owner: candidate.nextOwner,
    source_body_imported: candidate.sourceBodyImported ?? false,
    deployment_id: candidate.deploymentId ?? null,
    deployment_url: candidate.deploymentUrl ?? null,
    production_verification_path: candidate.productionVerificationPath ?? null,
    production_verification_sha256: candidate.productionVerificationSha256 ?? null,
    production_verified_at: candidate.productionVerifiedAt ?? null,
    index_status: candidate.indexStatus ?? null,
    performance_status: candidate.performanceStatus ?? null,
    refresh_due_date: candidate.refreshDueDate ?? null,
  };
}

function parseBoolean(value, fallback = false) {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return fallback;
}

async function loadPilotSlugs() {
  const pilot = JSON.parse(await readFile(INPUTS.pilot, 'utf8'));
  return {
    pilot,
    slugSet: new Set(pilot.articles.map((article) => article.slug)),
    bySlug: new Map(pilot.articles.map((article) => [article.slug, article])),
  };
}

async function loadRelease10ProductionVerification() {
  const batchBytes = await readFile(INPUTS.release10Batch);
  const batch = JSON.parse(batchBytes.toString('utf8'));
  const expectedArticleCount = batch.articles?.length;
  if (!Number.isInteger(expectedArticleCount) || expectedArticleCount <= 0) {
    throw new Error('Release-10 batch must contain at least one admitted article.');
  }
  const batchSlugs = new Set(batch.articles.map((article) => article.slug));
  try {
    const bytes = await readFile(INPUTS.release10PostPublicationVerification);
    const sidecar = await readFile(`${INPUTS.release10PostPublicationVerification}.sha256`, 'utf8');
    const expectedSha = sidecar
      .trim()
      .match(/^([a-f0-9]{64})(?:\s|$)/i)?.[1]
      ?.toLowerCase();
    const actualSha = createHash('sha256').update(bytes).digest('hex');
    if (expectedSha !== actualSha) {
      throw new Error(
        `Release-10 post-publication verification sidecar mismatch: expected ${expectedSha ?? '(missing)'}, got ${actualSha}.`,
      );
    }
    const report = JSON.parse(bytes.toString('utf8'));
    const verifiedArticleCount = report.summary?.expected_articles;
    if (
      !Number.isInteger(expectedArticleCount) ||
      expectedArticleCount <= 0 ||
      !Number.isInteger(verifiedArticleCount) ||
      verifiedArticleCount <= 0 ||
      verifiedArticleCount > expectedArticleCount ||
      report.summary?.overall_disposition !== 'PASS' ||
      report.summary?.passing_articles !== verifiedArticleCount ||
      report.summary?.failing_articles !== 0 ||
      report.interface_results?.disposition !== 'PASS'
    ) {
      throw new Error(
        `Release-10 post-publication verification is not a valid passing prefix of the current ${expectedArticleCount ?? '(invalid batch)'}-row continuous batch.`,
      );
    }
    const rows = report.article_results ?? [];
    const resultSlugs = new Set(rows.map((row) => row.slug));
    if (
      rows.length !== verifiedArticleCount ||
      rows.some((row) => row.disposition !== 'PASS') ||
      resultSlugs.size !== verifiedArticleCount ||
      [...resultSlugs].some((slug) => !batchSlugs.has(slug))
    ) {
      throw new Error(
        `Release-10 post-publication article results are not a complete passing subset of the current ${expectedArticleCount}-row admitted batch.`,
      );
    }
    const verifiedAt = report.generated_at_utc;
    const refreshDue = new Date(Date.parse(verifiedAt) + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return {
      artifactSha256: actualSha,
      batchSlugs,
      bySlug: new Map(
        rows.map((row) => [
          row.slug,
          {
            deploymentId: report.deployment?.deployment_id ?? null,
            deploymentUrl: report.deployment?.deployment_url ?? null,
            productionVerificationPath: portableWorkspacePath(
              INPUTS.release10PostPublicationVerification,
            ),
            productionVerificationSha256: actualSha,
            productionVerifiedAt: verifiedAt,
            indexStatus: 'published_indexable_pending_search_engine_index_confirmation',
            performanceStatus: 'measurement_window_open',
            refreshDueDate: refreshDue,
          },
        ]),
      ),
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { artifactSha256: null, batchSlugs, bySlug: new Map() };
    }
    throw error;
  }
}

async function loadRepoCandidates({
  pilotSlugSet,
  release10AdmittedSlugs = new Set(),
  release10ProductionBySlug = new Map(),
} = {}) {
  const files = (await readdir(INPUTS.postsDir)).filter((name) => name.endsWith('.mdx')).sort();
  const rows = [];
  for (const filename of files) {
    const fullPath = path.join(INPUTS.postsDir, filename);
    const data = frontmatter(await readFile(fullPath, 'utf8'));
    const title = data.title;
    const fallbackSlug = filename.replace(/\.mdx$/, '');
    const slug = data.slug || fallbackSlug;
    // Pilot shells exist on disk as MDX QA shells; their canonical row comes
    // from loadPilotCandidates so the row carries pilot manifest metadata.
    // Skip them here to avoid exact-slug collisions inside selectLedger.
    if (pilotSlugSet?.has(slug)) continue;
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const haystack = [title, data.category, ...tags, fallbackSlug].filter(Boolean).join(' ');
    const cluster = CLUSTER_ORDER.includes(data.content_cluster)
      ? data.content_cluster
      : classify(haystack);
    const isDraft = parseBoolean(data.draft, false);
    const frontmatterNoindex = parseBoolean(data.noindex, false);
    const publicationStatus = data.publication_status ?? (isDraft ? 'draft' : 'published');
    // `publication_gate_nonpublic` is true unless the row carries the explicit
    // fail-closed published state: `publication_status=published`, `draft` not
    // true, and `noindex` not declared. We do not look at `frontmatter_noindex`
    // here — that is tracked in its own field so the two cannot be conflated.
    const isPublished = publicationStatus === 'published' && !isDraft;
    // Release-10 rows are publication candidates admitted by a separate
    // signed gate, not pre-program legacy routes. The canonical ledger records
    // current workspace/build publication state; deployment evidence remains
    // a separate field and is populated only from the checksummed production
    // verifier.
    const release10Production = release10ProductionBySlug.get(slug) ?? null;
    const isAuthorizedReleaseCandidate = isPublished && release10AdmittedSlugs.has(slug);
    const isRelease10ProductionVerified =
      isAuthorizedReleaseCandidate && release10Production != null;
    const isLegacyPublished = isPublished && !isAuthorizedReleaseCandidate;
    // Release-10 sources are deliberately shaped exactly as they will be
    // published so review hashes cover the final bytes. They nevertheless
    // remain nonpublic at the portfolio gate until the signed decision,
    // evidence packets, and deployment gate all pass.
    const publicationGateNonpublic = !isPublished;
    // Aggregate `noindex_required` is retained as a derived downstream field
    // (frontmatter noindex OR publication gate nonpublic).
    const noindexRequired = frontmatterNoindex || publicationGateNonpublic;
    rows.push(
      baseRow({
        title,
        slug,
        cluster,
        primaryKeyword: data.primary_keyword || normalizeTitle(title),
        secondaryKeywords: tags,
        searchIntent: APPROVED_REKEY_SEARCH_INTENT_BY_SLUG.get(slug),
        sourceSystem: 'astro_repo',
        sourceRecordId: filename,
        sourceHandle: `repo:src/content/posts/${filename}`,
        repoPath: portableWorkspacePath(fullPath),
        existingUrl: `https://mineralrightsxchange.com/blog/${slugify(slug)}/`,
        // Fail-closed wording: only the explicitly-published live routes get
        // live/public wording; every remaining incumbent nonpublic MDX row is
        // explicitly fail-closed (held) and labelled accordingly.
        normalizedStatus: isRelease10ProductionVerified
          ? 'live_public_published_route_release_10_verified'
          : isAuthorizedReleaseCandidate
            ? 'authorized_release_candidate_pending_gate_and_deployment'
            : isLegacyPublished
              ? 'live_public_published_route_existing_route_verified'
              : 'incumbent_draft_nonpublic_publication_held',
        publicationState: isRelease10ProductionVerified
          ? 'released_public_article'
          : isAuthorizedReleaseCandidate
            ? 'authorized_release_candidate'
            : isLegacyPublished
              ? 'incumbent_workspace_article'
              : 'draft_workspace_article',
        frontmatterNoindex: frontmatterNoindex,
        publicationGateNonpublic: publicationGateNonpublic,
        noindexRequired,
        preservationClassification: isPublished
          ? 'live_public_published_route'
          : 'incumbent_draft_nonpublic_held',
        action: isRelease10ProductionVerified
          ? 'retain_verified_live_route_measure_index_coverage_and_refresh'
          : isAuthorizedReleaseCandidate
            ? 'release_only_after_exact_batch_gate_and_production_verification'
            : isLegacyPublished
              ? 'retain_existing_live_canonical_url_no_new_release_action_authorized'
              : 'retain_path_hold_publication_until_gate_passes',
        actionReason: isRelease10ProductionVerified
          ? 'Release-10 passed the signed batch gate, production deployment, and independent post-publication verification. Preserve the canonical URL; measurement informs refresh and prioritization, not a numerical release gate.'
          : isAuthorizedReleaseCandidate
            ? 'The source is prepared for the exact release-10 build, but publication remains controlled by the signed batch, matching evidence, production deployment, and independent verification.'
            : isLegacyPublished
              ? 'Existing Astro URL is already public and remains the incumbent owner. This ledger authorizes no additional publication or indexing action.'
              : 'Existing Astro MDX is fail-closed (nonpublic publication_status). Publication is held until program gates pass.',
        complianceStatus: isRelease10ProductionVerified
          ? 'release_10_capability_reviews_passed_production_verified'
          : isAuthorizedReleaseCandidate
            ? 'release_10_hash_locked_review_required'
            : isLegacyPublished
              ? 'existing_review_metadata_present_revalidation_required'
              : 'draft_pending_review_metadata_present_revalidation_required',
        schemaStatus: 'article_schema_path_present_revalidation_required',
        internalLinkRole: 'incumbent_supporting_article',
        nextOwner: isRelease10ProductionVerified ? 'mrx_growth_measurement' : 'mrx_editorial',
        sourceBodyImported: false,
        publicationStatus,
        draft: isDraft,
        ...(release10Production ?? {}),
      }),
    );
  }
  return rows;
}

async function loadPilotCandidates({ pilotBySlug } = {}) {
  if (!pilotBySlug) {
    const loaded = await loadPilotSlugs();
    pilotBySlug = loaded.bySlug;
  }
  const pilot = JSON.parse(await readFile(INPUTS.pilot, 'utf8'));
  return Promise.all(
    pilot.articles.map(async (article, index) => {
      // Pilot rows are guaranteed to have a corresponding MDX QA shell; pull
      // the live frontmatter so fail-closed publication/noindex facts reflect
      // the actual repo state on every rebuild.
      const mdxFilename = `${article.slug}.mdx`;
      const fullPath = path.join(INPUTS.postsDir, mdxFilename);
      let mdxMtimeMs = null;
      let publicationStatus = article.publication_state ?? 'noindex_stage';
      let isDraft = true;
      let frontmatterNoindex = true;
      let contentBatch = null;
      let contentProgram = null;
      let contentCluster = null;
      let contentIntent = null;
      try {
        const data = frontmatter(await readFile(fullPath, 'utf8'));
        isDraft = parseBoolean(data.draft, true);
        frontmatterNoindex = parseBoolean(data.noindex, true);
        publicationStatus = data.publication_status ?? publicationStatus;
        contentBatch = data.content_batch ?? null;
        contentProgram = data.content_program ?? null;
        contentCluster = data.content_cluster ?? null;
        contentIntent = data.content_intent ?? null;
        mdxMtimeMs = (await stat(fullPath)).mtimeMs;
      } catch {
        // No MDX shell found: still emit the row so it remains authoritative in
        // the ledger, but flag the missing shell so downstream consumers can
        // backfill before publication.
        publicationStatus = article.publication_state ?? 'noindex_stage';
      }
      // The local manifest `article_id` (e.g. `MRX1000-PILOT-001-12`) is
      // explicitly NOT a SearchAtlas / Content Genius UUID and MUST NOT be
      // emitted into `searchatlas_record_id`. That field is reserved for an
      // authoritative Content Genius readback. The local ID lives in
      // `pilot_article_id` (and `source_record_id`) only.
      return baseRow({
        title: article.title,
        slug: article.slug,
        cluster: article.cluster_id,
        primaryKeyword: article.primary_keyword,
        sourceSystem: 'searchatlas_topical_map_pilot',
        sourceRecordId: `${pilot.batch_id}:${String(index + 1).padStart(2, '0')}`,
        sourceHandle: `searchatlas-topical-map:${article.map_id}:${article.map_cluster}:${article.primary_keyword}`,
        searchatlasMapId: article.map_id,
        contentGeniusArticleUuid: null,
        repoPath: `mrx/src/content/posts/${mdxFilename}`,
        existingUrl:
          article.canonical_url ?? `https://mineralrightsxchange.com/blog/${article.slug}/`,
        normalizedStatus: 'pilot_draft_noindex_stage_planned_workflow',
        publicationState: 'pilot_draft_noindex_stage',
        frontmatterNoindex: frontmatterNoindex,
        publicationGateNonpublic: true,
        noindexRequired: true,
        preservationClassification: 'pilot_draft_noindex_stage',
        isPilot001: true,
        mapCluster: article.map_cluster,
        dedupeDisposition: article.dedupe_disposition ?? 'keep-asis',
        searchatlasRecordStatus: article.searchatlas_record_status ?? 'needs_review',
        pilotArticleId: article.article_id,
        pilotMdxPath: article.mdx_path ?? `src/content/posts/${mdxFilename}`,
        pilotManifestPath: 'mrx/config/mrx-1000-pilot-batch-001.json',
        pilotBatchId: pilot.batch_id,
        pilotExternallyPublished: parseBoolean(article.externally_published, false),
        pilotMapCluster: article.map_cluster,
        pilotContentBatch: contentBatch,
        pilotContentProgram: contentProgram,
        pilotContentCluster: contentCluster,
        pilotContentIntent: contentIntent,
        pilotDraft: isDraft,
        pilotMdxMtimeMs: mdxMtimeMs,
        complianceGate: article.compliance?.gate ?? null,
        complianceDisposition: article.compliance?.disposition ?? null,
        compliancePublicationApproval: article.compliance?.publication_approval ?? null,
        complianceLegalTaxSensitive: parseBoolean(article.compliance?.legal_tax_sensitive, false),
        complianceHumanEscalationRequired: parseBoolean(
          article.compliance?.human_escalation_required_on_advice_like_language,
          false,
        ),
        complianceHumanEscalationSpecialist:
          article.compliance?.human_escalation_specialist ?? null,
        action: 'generate_draft_only_after_executive_gate',
        actionReason:
          'Explicit member of MRX1000-PILOT-001; zero-spend and no-publication controls apply.',
        complianceStatus: 'pending_human_and_compliance_review',
        schemaStatus: 'planned_article_faq_breadcrumb_speakable',
        internalLinkRole: 'planned_supporting_article',
        nextOwner: 'mrx_searchatlas_content',
        sourceBodyImported: false,
        publicationStatus,
        draft: isDraft,
      });
    }),
  );
}

async function loadSearchAtlasCandidates() {
  const raw = JSON.parse(await readFile(INPUTS.legacySearchAtlasMaps, 'utf8'));
  const candidates = [];
  for (const [mapId, wrapper] of Object.entries(raw)) {
    const map = wrapper.data ?? wrapper;
    for (const cluster of map.clusters ?? []) {
      for (const keyword of cluster.keywords ?? []) {
        for (const titleRecord of keyword.titles ?? []) {
          const title = titleRecord.title;
          const taxonomyHaystack = [map.topic, cluster.name, keyword.name, title].join(' ');
          const assignedCluster = classify(taxonomyHaystack);
          candidates.push(
            baseRow({
              title,
              cluster: assignedCluster,
              primaryKeyword: keyword.name,
              sourceSystem: 'searchatlas_topical_map_export',
              sourceRecordId: titleRecord.title_uuid,
              sourceHandle: `searchatlas-topical-map:${mapId}:title:${titleRecord.title_uuid}`,
              searchatlasMapId: Number(mapId),
              searchatlasTitleUuid: titleRecord.title_uuid,
              mapCluster: cluster.name,
              normalizedStatus: 'planning_only_topical_map_title_planning_handle',
              publicationState: 'planning_only_inventory',
              // Topical-map title UUID is a planning handle, not a `noindex`
              // frontmatter directive on any real MDX. The row is held in
              // inventory and is fail-closed nonpublic regardless.
              frontmatterNoindex: false,
              publicationGateNonpublic: true,
              noindexRequired: true,
              preservationClassification: 'planning_only_inventory',
              action: 'refresh_keyword_then_brief_and_generate_after_gate',
              actionReason:
                'SearchAtlas title suggestion is useful planning input but is not a finished or approved article.',
              complianceStatus: 'not_started',
              schemaStatus: 'planned_article_faq_breadcrumb_speakable',
              internalLinkRole: 'planned_supporting_article',
              nextOwner: 'mrx_searchatlas_keywords',
            }),
          );
        }
      }
    }
  }
  return candidates;
}

async function loadFactoryCandidates() {
  const rows = parseCsv(await readFile(INPUTS.factoryQueue, 'utf8'));
  return rows.map((row) => {
    const fallbackCluster = LEGACY_CLUSTER_MAP[row.cluster_id];
    if (!fallbackCluster) throw new Error(`Unknown factory cluster: ${row.cluster_id}`);
    const cluster = classify(
      [row.title, row.primary_keyword, row.cluster].join(' '),
      fallbackCluster,
    );
    return baseRow({
      title: row.title,
      slug: row.slug,
      cluster,
      primaryKeyword: row.primary_keyword,
      secondaryKeywords: row.secondary_keywords
        .split(';')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      searchIntent: row.search_intent,
      ownerPersona: row.audience,
      sourceSystem: 'factory_queue_title_metadata',
      sourceRecordId: row.queue_id,
      sourceHandle: `factory-queue:${row.queue_id}`,
      normalizedStatus: 'planning_only_factory_queue_title_metadata',
      publicationState: 'planning_only_inventory',
      frontmatterNoindex: false,
      publicationGateNonpublic: true,
      noindexRequired: true,
      preservationClassification: 'planning_only_inventory',
      action: 'validate_keyword_rewrite_brief_then_generate_after_gate',
      actionReason:
        'Only queue title and keyword metadata were used. Repetitive local factory bodies are explicitly excluded.',
      complianceStatus: 'not_started',
      schemaStatus: 'planned_article_faq_breadcrumb_speakable',
      internalLinkRole: 'planned_supporting_article',
      nextOwner: 'mrx_searchatlas_content',
    });
  });
}

function loadEditorialGapCandidates() {
  const topics = [
    [
      'Discount Rates in Mineral Rights DCF: A Plain-Language Guide',
      'discount rates in mineral rights DCF',
    ],
    ['Decline Curves and Future Royalty Cash Flow', 'decline curves and future royalty cash flow'],
    [
      'PDP, PUD, and Undeveloped Acreage in Mineral Valuation',
      'PDP PUD undeveloped acreage valuation',
    ],
    [
      'Price Decks: How Oil and Gas Assumptions Change Present Value',
      'oil and gas price decks present value',
    ],
    ['Net Revenue Interest as a Mineral Valuation Input', 'net revenue interest mineral valuation'],
    [
      'Operator Track Record and Mineral Development Risk',
      'operator quality mineral development risk',
    ],
    [
      'Well Spacing, Permits, and Drilling Inventory in Mineral Valuation',
      'well spacing drilling inventory valuation',
    ],
    [
      'Post-Production Costs and Their Effect on Royalty Cash Flow',
      'post-production costs royalty cash flow',
    ],
    [
      'Comparable Mineral Sales: What Makes a Transaction Relevant?',
      'comparable mineral rights sales',
    ],
    [
      'Producing vs. Non-Producing Minerals: Which Inputs Change?',
      'producing vs non-producing mineral valuation',
    ],
    ['How Lease Royalty Rates Influence Mineral Value', 'lease royalty rates mineral value'],
    [
      'Depth Severances and Formation Rights in Mineral Valuation',
      'depth severance formation rights valuation',
    ],
    ['Existing Wells vs. Future Locations in a DCF Model', 'existing wells future locations DCF'],
    [
      'How Production Mix Affects Mineral Cash Flow Forecasts',
      'production mix mineral cash flow forecast',
    ],
    [
      'Basis Differentials and Mineral Rights Cash Flow',
      'basis differentials mineral rights cash flow',
    ],
    ['Curative Title Risk as a Valuation Adjustment', 'curative title risk valuation adjustment'],
    [
      'Acreage Contiguity and Its Role in Development Potential',
      'acreage contiguity development potential',
    ],
    [
      'Unitization and Pooling as Mineral Valuation Inputs',
      'unitization pooling mineral valuation',
    ],
    ['Shut-In Wells: What They Mean for a Valuation Review', 'shut-in wells valuation review'],
    [
      'Refracs and Workovers: How Upside Is Treated in Valuation',
      'refracs workovers mineral valuation',
    ],
    [
      'Offset Activity as Evidence of Development Potential',
      'offset activity development potential',
    ],
    [
      'Mineral Valuation Sensitivity Analysis: Which Assumptions Matter?',
      'mineral valuation sensitivity analysis',
    ],
    [
      'How Royalty Decimal Errors Can Distort a Value Estimate',
      'royalty decimal errors value estimate',
    ],
    ['Time Horizon Choices in Mineral Rights DCF Models', 'time horizon mineral rights DCF'],
    [
      'Converting Monthly Royalty History Into a Valuation Baseline',
      'monthly royalty history valuation baseline',
    ],
  ];
  return topics.map(([title, primaryKeyword], index) =>
    baseRow({
      title,
      cluster: 'valuation-methodology-drivers',
      primaryKeyword,
      sourceSystem: 'editorial_gap_synthesis_from_factory_taxonomy',
      sourceRecordId: `valuation-gap-v1-${String(index + 1).padStart(3, '0')}`,
      sourceHandle: `factory-taxonomy-synthesis:valuation:${slugify(primaryKeyword)}`,
      normalizedStatus: 'planning_only_editorial_gap_synthesis',
      publicationState: 'planning_only_inventory',
      frontmatterNoindex: false,
      publicationGateNonpublic: true,
      noindexRequired: true,
      preservationClassification: 'planning_only_inventory',
      action: 'validate_keyword_then_brief_and_generate_after_gate',
      actionReason:
        'Editorially differentiated title derived from valuation concepts in the factory taxonomy; no factory body text was used.',
      complianceStatus: 'not_started',
      schemaStatus: 'planned_article_faq_breadcrumb_speakable',
      internalLinkRole: 'planned_supporting_article',
      nextOwner: 'mrx_searchatlas_keywords',
    }),
  );
}

function assertNoExactDuplicate(rows, stage) {
  const slugCounts = new Map();
  const titleCounts = new Map();
  for (const row of rows) {
    slugCounts.set(row.canonical_slug, (slugCounts.get(row.canonical_slug) ?? 0) + 1);
    const title = normalizeTitle(row.canonical_title);
    titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
  }
  const duplicateSlugs = [...slugCounts].filter(([, count]) => count > 1);
  const duplicateTitles = [...titleCounts].filter(([, count]) => count > 1);
  if (duplicateSlugs.length || duplicateTitles.length) {
    throw new Error(
      `${stage}: exact duplicates found (slugs=${duplicateSlugs.length}, titles=${duplicateTitles.length})`,
    );
  }
}

function selectLedger(quotas, sources) {
  const selected = [];
  const selectedSlugs = new Set();
  const selectedTitles = new Set();
  const counts = Object.fromEntries(CLUSTER_ORDER.map((cluster) => [cluster, 0]));
  const rejected = { exact_slug: 0, exact_title: 0, quota_full: 0, fuzzy_similarity: 0 };

  const tryAdd = (row, required = false) => {
    const quota = quotas[row.cluster];
    if (quota == null) throw new Error(`Candidate has unknown canonical cluster: ${row.cluster}`);
    if (counts[row.cluster] >= quota) {
      if (required)
        throw new Error(`Required row exceeds quota for ${row.cluster}: ${row.canonical_title}`);
      rejected.quota_full += 1;
      return false;
    }
    if (selectedSlugs.has(row.canonical_slug)) {
      if (required) throw new Error(`Required row duplicates slug: ${row.canonical_slug}`);
      rejected.exact_slug += 1;
      return false;
    }
    const normalizedTitle = normalizeTitle(row.canonical_title);
    if (selectedTitles.has(normalizedTitle)) {
      if (required) throw new Error(`Required row duplicates title: ${row.canonical_title}`);
      rejected.exact_title += 1;
      return false;
    }

    // Incumbent and explicitly approved pilot rows are always retained. Other
    // candidates must avoid very-high title-token overlap in the same cluster.
    if (!required) {
      const selectionThreshold = 0.75;
      const tooSimilar = selected.some(
        (existing) =>
          existing.cluster === row.cluster &&
          jaccard(existing.canonical_title, row.canonical_title) >= selectionThreshold,
      );
      if (tooSimilar) {
        rejected.fuzzy_similarity += 1;
        return false;
      }
    }

    selected.push(row);
    selectedSlugs.add(row.canonical_slug);
    selectedTitles.add(normalizedTitle);
    counts[row.cluster] += 1;
    return true;
  };

  for (const row of sources.repo) tryAdd(row, true);
  for (const row of sources.pilot) tryAdd(row, true);
  for (const row of sources.searchatlas) tryAdd(row);
  for (const row of sources.editorialGap) tryAdd(row);
  for (const row of sources.factory) tryAdd(row);

  const deficits = Object.fromEntries(
    CLUSTER_ORDER.map((cluster) => [cluster, quotas[cluster] - counts[cluster]]).filter(
      ([, deficit]) => deficit,
    ),
  );
  if (Object.keys(deficits).length)
    throw new Error(`Unable to fill quotas: ${JSON.stringify(deficits)}`);

  assertNoExactDuplicate(selected, 'selected ledger');
  return { selected, counts, rejected };
}

function annotateDedupe(rows) {
  const byCluster = new Map();
  for (const row of rows) {
    if (!byCluster.has(row.cluster)) byCluster.set(row.cluster, []);
    byCluster.get(row.cluster).push(row);
  }

  const highSimilarityPairs = [];
  for (const clusterRows of byCluster.values()) {
    for (let leftIndex = 0; leftIndex < clusterRows.length; leftIndex += 1) {
      const left = clusterRows[leftIndex];
      let nearest = null;
      for (let rightIndex = 0; rightIndex < clusterRows.length; rightIndex += 1) {
        if (leftIndex === rightIndex) continue;
        const right = clusterRows[rightIndex];
        const score = jaccard(left.canonical_title, right.canonical_title);
        if (!nearest || score > nearest.score) nearest = { row: right, score };
        if (rightIndex > leftIndex && score >= 0.75) {
          highSimilarityPairs.push({
            cluster: left.cluster,
            left_slug: left.canonical_slug,
            right_slug: right.canonical_slug,
            token_jaccard: Number(score.toFixed(4)),
            includes_incumbent_or_pilot:
              left.source_system === 'astro_repo' ||
              right.source_system === 'astro_repo' ||
              left.is_pilot_001 ||
              right.is_pilot_001,
          });
        }
      }
      left.dedupe_evidence = {
        normalized_title: normalizeTitle(left.canonical_title),
        exact_slug_unique: true,
        exact_title_unique: true,
        nearest_same_cluster_slug: nearest?.row.canonical_slug ?? null,
        nearest_same_cluster_title_token_jaccard: nearest ? Number(nearest.score.toFixed(4)) : 0,
        review_status:
          nearest && nearest.score >= 0.75
            ? 'manual_cannibalization_review_required'
            : 'exact_and_fuzzy_title_check_pass',
      };
      left.exact_slug_unique = true;
      left.exact_title_unique = true;
      left.nearest_same_cluster_slug = nearest?.row.canonical_slug ?? null;
      left.cannibalization_score = nearest ? Number(nearest.score.toFixed(4)) : 0;
      left.dedupe_review_status = left.dedupe_evidence.review_status;
    }
  }
  return highSimilarityPairs.sort(
    (left, right) =>
      right.token_jaccard - left.token_jaccard || left.left_slug.localeCompare(right.left_slug),
  );
}

function sourceCounts(rows) {
  const counts = {};
  for (const row of rows) counts[row.source_system] = (counts[row.source_system] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function hashRows(rows) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        rows.map((row) => ({
          slug: row.canonical_slug,
          title: row.canonical_title,
          cluster: row.cluster,
          keyword: row.primary_keyword,
          source: row.source_handle,
        })),
      ),
    )
    .digest('hex');
}

function sha256File(path) {
  return createHash('sha256').update(path).digest('hex').slice(0, 12);
}

async function deterministicGeneratedAt(paths) {
  // Resolve a stable timestamp from the inputs by hashing a sorted list of
  // (path, mtime-ms) pairs. Same inputs => same hash => same ISO date.
  const entries = await Promise.all(
    paths.map(async (filePath) => {
      try {
        const info = await stat(filePath);
        return [filePath, info.mtimeMs];
      } catch {
        return [filePath, 0];
      }
    }),
  );
  entries.sort(([a], [b]) => a.localeCompare(b));
  const hashed = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  // Map the hash onto the same calendar day (2026-07-20 UTC) so the
  // emitted `generated_at` always looks like a real wall-clock-ish stamp
  // for that day instead of drifting forward by up to ~50 days. The
  // total determinism guarantee is unaffected: same inputs => same
  // hashed value => same `generated_at` and same JSON/CSV bytes.
  const stamp = parseInt(hashed.slice(0, 8), 16);
  const offsetMs = stamp % (24 * 60 * 60 * 1000); // clamp to a 24h window
  const epoch = Date.UTC(2026, 6, 20, 0, 0, 0); // 2026-07-20T00:00:00Z anchor
  return new Date(epoch + offsetMs).toISOString();
}

function renderReport({ ledger, quotas, counts, sourceSummary, highSimilarityPairs, rejected }) {
  const quotaRows = CLUSTER_ORDER.map(
    (cluster) =>
      `| \`${cluster}\` | ${quotas[cluster]} | ${counts[cluster]} | ${counts[cluster] === quotas[cluster] ? 'PASS' : 'FAIL'} |`,
  ).join('\n');
  const sourceRows = Object.entries(sourceSummary)
    .map(([source, count]) => `| \`${source}\` | ${count} |`)
    .join('\n');
  const reviewPairs = highSimilarityPairs
    .slice(0, 30)
    .map(
      (pair) =>
        `| \`${pair.cluster}\` | \`${pair.left_slug}\` | \`${pair.right_slug}\` | ${pair.token_jaccard.toFixed(4)} |`,
    );
  const v = ledger.verification;
  const preservationCounts = v.preservation_classification_counts;
  const preservationEquation = [
    preservationCounts.live_public_published_route,
    preservationCounts.incumbent_draft_nonpublic_held,
    preservationCounts.pilot_draft_noindex_stage,
    preservationCounts.planning_only_inventory,
  ].join(' + ');
  const generatedAt = ledger.generated_at;
  const policy = ledger.policy ?? {};
  const deterministicNote = policy.deterministic_generated_at_from_input_state
    ? 'yes (derived from sorted (path, mtime-ms) of every input via SHA-256, mapped mod 86400000 then offset from 2026-07-20T00:00:00Z; identical across consecutive runs with unchanged inputs, and stays within the 2026-07-20 calendar day)'
    : 'no (wall-clock)';

  return (
    `# MRX canonical 1,000-article content ledger\n\n` +
    `Generated by \`mrx/scripts/build-mrx-1000-content-ledger.mjs\`. This is a planning and governance artifact only. It does not publish, index, draft, or invoke a paid API.\n\n` +
    `## Verification\n\n` +
    `- Generated at: \`${generatedAt}\` (deterministic from input state: ${deterministicNote})\n` +
    `- Rows: **${ledger.articles.length}**\n` +
    `- Unique canonical slugs: **${ledger.verification.unique_slug_count}**\n` +
    `- Unique normalized titles: **${ledger.verification.unique_normalized_title_count}**\n` +
    `- Included incumbent Astro posts: **${ledger.verification.incumbent_repo_count}** (split below into live-public vs nonpublic-draft)\n` +
    `- Included MRX1000-PILOT-001 rows: **${ledger.verification.pilot_001_count}** (all 25 carry pilot manifest metadata + repo \`MDX\` shell path)\n` +
    `- Pilot manifest \`MRX1000-PILOT-001\` article count: **${v.pilot_manifest_article_count}**\n` +
    `- Pilot rows with corresponding repo \`MDX\` shell on disk: **${v.pilot_manifest_articles_with_mdx_shell}**\n` +
    `- Pilot-aware: **${policy.pilot_aware ? 'yes' : 'no'}** (pilot shell slugs are skipped from the incumbent \`astro_repo\` scan so they cannot collide on dedupe; canonical pilot metadata comes from \`config/mrx-1000-pilot-batch-001.json\`)\n` +
    `- Idempotent: yes — two consecutive runs with unchanged inputs produce byte-identical JSON/CSV/report files and the same \`content_fingerprint_sha256\`.\n` +
    `- Exact duplicate titles/slugs: **0 / 0**\n` +
    `- Same-cluster title pairs at Jaccard >= 0.75: **${highSimilarityPairs.length}** (flagged for manual cannibalization review, not silently treated as approved)\n` +
    `- High-similarity pairs involving an incumbent or pilot row: **${highSimilarityPairs.filter((pair) => pair.includes_incumbent_or_pilot).length}**\n` +
    `- Deterministic row fingerprint: \`${ledger.content_fingerprint_sha256}\`\n\n` +
    `## Preservation classification — ${preservationEquation} = 1,000\n\n` +
    `| Class | Count | Description |\n|---|---:|---|\n` +
    `| \`live_public_published_route\` | **${v.preservation_classification_counts?.live_public_published_route ?? 0}** | Existing public routes with \`publication_status=published\`, no \`noindex\`, and no \`draft\`. This ledger authorizes no additional publication or indexing action. |\n` +
    `| \`incumbent_draft_nonpublic_held\` | **${v.preservation_classification_counts?.incumbent_draft_nonpublic_held ?? 0}** | Workspace MDX with \`publication_status=draft\` (no declared \`noindex\`). Fail-closed; cannot be represented as index-ready just because frontmatter \`noindex\` is absent. |\n` +
    `| \`pilot_draft_noindex_stage\` | **${v.preservation_classification_counts?.pilot_draft_noindex_stage ?? 0}** | MRX1000-PILOT-001 QA shells with \`noindex=true\`/\`draft=true\`/\`publication_status=draft\`. |\n` +
    `| \`planning_only_inventory\` | **${v.preservation_classification_counts?.planning_only_inventory ?? 0}** | Remaining SearchAtlas, factory-queue, and editorial-gap inventory with no admitted MDX body. |\n` +
    `| **Total** | **${ledger.articles.length}** | |\n\n` +
    `Aggregate invariant: **${preservationEquation} === 1,000** is enforced at generation time and again by \`tests/unit/mrx1000-ledger-idempotency.spec.ts\`.\n\n` +
    `## Evidence taxonomy\n\n` +
    `Local manifest IDs (e.g. \`MRX1000-PILOT-001-12\`) are NEVER written into \`searchatlas_record_id\`; they live only under \`pilot_article_id\`. Topical-map title UUIDs are planning handles, separate from any Content Genius article UUID.\n\n` +
    `| Field | Non-null count |\n|---|---:|\n` +
    `| \`searchatlas_record_id\` (authoritative Content Genius UUID or null) | **${v.evidence_taxonomy?.searchatlas_record_id_non_null_uuid_count ?? 0}** |\n` +
    `| \`content_genius_article_uuid\` (authoritative CG article UUID or null) | **${v.evidence_taxonomy?.content_genius_article_uuid_non_null_count ?? 0}** |\n` +
    `| \`searchatlas_title_uuid\` (planning handles, current topical-map export) | **${v.evidence_taxonomy?.searchatlas_title_uuid_non_null_count ?? 0}** |\n` +
    `| \`pilot_article_id\` (local manifest ID, NOT a SearchAtlas UUID) | **${v.evidence_taxonomy?.pilot_article_id_non_null_count ?? 0}** |\n` +
    `| \`searchatlas_record_id_dropped\` (non-UUID values captured here for audit) | **${v.evidence_taxonomy?.searchatlas_record_id_dropped_count ?? 0}** |\n` +
    `| \`pilot_searchatlas_workflow_status_evidence_is_non_creation\` label | **${v.evidence_taxonomy?.pilot_searchatlas_workflow_status_pilot_rows_with_non_creation_label ?? 0}** (true on every pilot row; the manifest's \`searchatlas_record_status\` is workflow metadata, NOT a created-article readback) |\n\n` +
    `Authoritative expected counts today: \`searchatlas_record_id=0\`, \`content_genius_article_uuid=0\`, \`searchatlas_title_uuid=269\`, \`pilot_article_id=25\`, \`searchatlas_record_id_dropped=0\`. Every non-null \`searchatlas_record_id\`/\`content_genius_article_uuid\` MUST match a UUID v4/v5 shape; the generator hard-fails otherwise.\n\n` +
    `**SearchAtlas map evidence ≠ a created article**: no pilot row is marked \`searchatlas_created=true\`, no Content Genius \`article_uuid\` is asserted, and no body text has been generated. The pilot manifest \`searchatlas_record_status\` (e.g. \`needs_review\`) lives under \`pilot_searchatlas_workflow_status\` as a workflow artifact; it is explicitly labelled \`pilot_searchatlas_workflow_status_evidence_is_non_creation=true\` and must not be interpreted as evidence of an authored article.\n\n` +
    `## Quota proof\n\n| Canonical cluster | Required | Actual | Result |\n|---|---:|---:|---|\n${quotaRows}\n\n` +
    `## Source mix\n\n| Source | Selected rows |\n|---|---:|\n${sourceRows}\n\n` +
    `The local factory was used only for title, keyword, intent, and source-handle metadata. **No factory body text was read into or copied into this ledger.** All non-repo rows remain noindex/inventory-stage until the program gates pass.\n\n` +
    `## Candidate rejection evidence\n\n` +
    `- Exact slug collisions rejected: ${rejected.exact_slug}\n` +
    `- Exact normalized-title collisions rejected: ${rejected.exact_title}\n` +
    `- Candidates rejected at same-cluster title-token Jaccard >= 0.75: ${rejected.fuzzy_similarity}\n` +
    `- Candidates skipped after their quota filled: ${rejected.quota_full}\n\n` +
    `## Highest-similarity review queue\n\n` +
    (reviewPairs.length
      ? `| Cluster | Left canonical slug | Right canonical slug | Jaccard |\n|---|---|---|---:|\n${reviewPairs.join('\n')}\n`
      : 'No pairs met the manual-review threshold.\n') +
    `\nThe JSON ledger contains nearest-neighbor dedupe evidence on every row. The full set of flagged pairs is stored in \`dedupe_review_pairs\`.\n`
  );
}

async function main() {
  // Load pilot slug set BEFORE repo so loadRepoCandidates can skip the 25
  // pilot shells (they live on disk as MDX QA shells; their canonical row
  // comes from loadPilotCandidates so it carries pilot manifest metadata).
  const { pilot, slugSet: pilotSlugSet, bySlug: pilotBySlug } = await loadPilotSlugs();
  const release10Production = await loadRelease10ProductionVerification();
  const [quotaPlan, mapRegistry, repo, pilotRows, searchatlas, factory] = await Promise.all([
    readFile(INPUTS.quotaPlan, 'utf8').then(JSON.parse),
    readFile(INPUTS.mapRegistry, 'utf8').then(JSON.parse),
    loadRepoCandidates({
      pilotSlugSet,
      release10AdmittedSlugs: release10Production.batchSlugs,
      release10ProductionBySlug: release10Production.bySlug,
    }),
    loadPilotCandidates({ pilotBySlug }),
    loadSearchAtlasCandidates(),
    loadFactoryCandidates(),
  ]);
  const editorialGap = loadEditorialGapCandidates();
  const priorIdentity = await loadPriorProgramRowIds();
  const withoutSupersededIdentities = (rows) =>
    rows.filter((row) => !SUPERSEDED_CANONICAL_SLUGS.has(row.canonical_slug));
  const quotas = Object.fromEntries(
    quotaPlan.cluster_quotas.map((item) => [item.cluster_id, item.quota]),
  );
  if (JSON.stringify(Object.keys(quotas)) !== JSON.stringify(CLUSTER_ORDER)) {
    throw new Error(
      'Quota plan cluster order or membership changed; review the generator taxonomy before rebuilding.',
    );
  }
  if (Object.values(quotas).reduce((sum, value) => sum + value, 0) !== 1000) {
    throw new Error('Canonical quota total must equal 1,000.');
  }
  const successorSlugs = new Set(SUCCESSOR_CANONICAL_SLUGS.values());
  const newlyMaterializedRepoSlugs = new Set([
    ...[...release10Production.batchSlugs].filter(
      (slug) => priorIdentity.sourceSystemBySlug.get(slug) !== 'astro_repo',
    ),
    ...repo
      .map((row) => row.canonical_slug)
      .filter(
        (slug) =>
          successorSlugs.has(slug) && priorIdentity.sourceSystemBySlug.get(slug) !== 'astro_repo',
      ),
  ]);
  const expectedRepoCount = priorIdentity.incumbentRepoCount + newlyMaterializedRepoSlugs.size;
  if (priorIdentity.incumbentRepoCount <= 0 || repo.length !== expectedRepoCount)
    throw new Error(
      `Expected ${expectedRepoCount} non-pilot incumbent repo posts from prior-ledger state plus ${newlyMaterializedRepoSlugs.size} newly materialized admitted or approved successor rows, found ${repo.length}.`,
    );
  if (pilotRows.length !== 25)
    throw new Error(`Expected 25 pilot rows, found ${pilotRows.length}.`);
  const successfulMapIds = new Set(
    mapRegistry.maps.filter((map) => map.status === 'SUCCESS').map((map) => Number(map.map_id)),
  );
  const missingPilotMap = pilotRows.find(
    (row) => !successfulMapIds.has(Number(row.searchatlas_map_id)),
  );
  if (missingPilotMap)
    throw new Error(`Pilot uses a map not marked SUCCESS: ${missingPilotMap.searchatlas_map_id}`);

  assertNoExactDuplicate(repo, 'incumbent repo');
  assertNoExactDuplicate(pilotRows, 'pilot manifest');
  const { selected, counts, rejected } = selectLedger(quotas, {
    repo,
    pilot: pilotRows,
    searchatlas: withoutSupersededIdentities(searchatlas),
    editorialGap: withoutSupersededIdentities(editorialGap),
    factory: withoutSupersededIdentities(factory),
  });
  const clusterIndex = Object.fromEntries(CLUSTER_ORDER.map((cluster, index) => [cluster, index]));
  selected.sort(
    (left, right) =>
      clusterIndex[left.cluster] - clusterIndex[right.cluster] ||
      (left.source_system === 'astro_repo' ? -1 : 0) -
        (right.source_system === 'astro_repo' ? -1 : 0) ||
      (left.is_pilot_001 ? -1 : 0) - (right.is_pilot_001 ? -1 : 0) ||
      left.canonical_slug.localeCompare(right.canonical_slug),
  );
  // Program-row IDs are durable identities, not row numbers. Preserve the
  // ID already assigned to a canonical slug and allocate new IDs above the
  // historical high-water mark. Re-sorting or replacing inventory must not
  // silently move an existing article onto a different MRX1000 ID.
  const usedProgramRowIds = new Set();
  let nextProgramRowSequence = priorIdentity.maxSequenceEver + 1;
  let preservedProgramRowIdCount = 0;
  for (const row of selected) {
    const priorId = priorIdentity.bySlug.get(row.canonical_slug);
    if (priorId && !usedProgramRowIds.has(priorId)) {
      row.program_row_id = priorId;
      usedProgramRowIds.add(priorId);
      preservedProgramRowIdCount += 1;
      continue;
    }
    let candidate;
    do {
      candidate = `MRX1000-${String(nextProgramRowSequence).padStart(4, '0')}`;
      nextProgramRowSequence += 1;
    } while (usedProgramRowIds.has(candidate));
    row.program_row_id = candidate;
    usedProgramRowIds.add(candidate);
  }
  const maxProgramRowSequenceEver = Math.max(
    priorIdentity.maxSequenceEver,
    nextProgramRowSequence - 1,
  );
  const highSimilarityPairs = annotateDedupe(selected);
  const sourceSummary = sourceCounts(selected);
  // Deterministic timestamp: derived from the (sorted, mtime-stamped) set of
  // inputs so two consecutive runs with unchanged inputs produce identical
  // `generated_at`, `last_verified_at`, and therefore identical JSON/CSV bytes
  // and identical content_fingerprint_sha256.
  const generatedAt = await deterministicGeneratedAt([
    INPUTS.quotaPlan,
    INPUTS.pilot,
    INPUTS.mapRegistry,
    INPUTS.legacySearchAtlasMaps,
    INPUTS.factoryQueue,
    INPUTS.postsDir,
    INPUTS.release10PostPublicationVerification,
  ]);
  for (const row of selected) row.last_verified_at = generatedAt;
  const ledger = {
    program: 'MRX 1,000 Article SEO+AEO Production Program',
    artifact_type: 'canonical_content_ledger',
    generated_at: generatedAt,
    generator: 'mrx/scripts/build-mrx-1000-content-ledger.mjs',
    identity_registry: {
      strategy: 'preserve_program_row_id_by_canonical_slug',
      max_sequence_ever: maxProgramRowSequenceEver,
      preserved_existing_id_count: preservedProgramRowIdCount,
      newly_allocated_id_count: selected.length - preservedProgramRowIdCount,
      ...(priorIdentity.wave58Rekey ? { wave58_rekey: priorIdentity.wave58Rekey } : {}),
      ...(priorIdentity.wave59Rekey ? { wave59_rekey: priorIdentity.wave59Rekey } : {}),
      ...(priorIdentity.wave60Rekey ? { wave60_rekey: priorIdentity.wave60Rekey } : {}),
      ...(priorIdentity.wave61Rekey ? { wave61_rekey: priorIdentity.wave61Rekey } : {}),
      ...(priorIdentity.wave62Rekey ? { wave62_rekey: priorIdentity.wave62Rekey } : {}),
      ...(priorIdentity.wave63Rekey ? { wave63_rekey: priorIdentity.wave63Rekey } : {}),
      ...(priorIdentity.wave64Rekey ? { wave64_rekey: priorIdentity.wave64Rekey } : {}),
      ...(priorIdentity.wave65Rekey ? { wave65_rekey: priorIdentity.wave65Rekey } : {}),
      ...(priorIdentity.wave66Rekey ? { wave66_rekey: priorIdentity.wave66Rekey } : {}),
      ...(priorIdentity.wave67Rekey ? { wave67_rekey: priorIdentity.wave67Rekey } : {}),
      ...(priorIdentity.wave68Rekey ? { wave68_rekey: priorIdentity.wave68Rekey } : {}),
      ...(priorIdentity.wave69Rekey ? { wave69_rekey: priorIdentity.wave69Rekey } : {}),
      ...(priorIdentity.wave70Rekey ? { wave70_rekey: priorIdentity.wave70Rekey } : {}),
      ...(priorIdentity.wave71Refresh ? { wave71_refresh: priorIdentity.wave71Refresh } : {}),
      ...(priorIdentity.wave72Rekey ? { wave72_rekey: priorIdentity.wave72Rekey } : {}),
      ...(priorIdentity.wave73Rekey ? { wave73_rekey: priorIdentity.wave73Rekey } : {}),
      ...(priorIdentity.wave74Rekey ? { wave74_rekey: priorIdentity.wave74Rekey } : {}),
      ...(priorIdentity.wave75Rekey ? { wave75_rekey: priorIdentity.wave75Rekey } : {}),
      ...(priorIdentity.wave76Rekey ? { wave76_rekey: priorIdentity.wave76Rekey } : {}),
      ...(priorIdentity.wave77Rekey ? { wave77_rekey: priorIdentity.wave77Rekey } : {}),
      ...(priorIdentity.wave78Rekey ? { wave78_rekey: priorIdentity.wave78Rekey } : {}),
      ...(priorIdentity.wave79Rekey ? { wave79_rekey: priorIdentity.wave79Rekey } : {}),
      ...(priorIdentity.wave80Rekey ? { wave80_rekey: priorIdentity.wave80Rekey } : {}),
    },
    content_fingerprint_sha256: hashRows(selected),
    policy: {
      publication_authorized: false,
      indexing_authorized: false,
      paid_api_calls_made: false,
      factory_body_text_imported: false,
      incumbent_urls_are_canonical_until_editorial_merge_or_redirect_decision: true,
      non_repo_rows_require_searchatlas_keyword_serp_validation: true,
      high_similarity_threshold_for_manual_review: 0.75,
      high_similarity_threshold_rejected_during_candidate_selection: 0.75,
      pilot_aware: true,
      pilot_slug_set_intersection_with_repo_handled_in_loadRepoCandidates: true,
      release_10_post_publication_verification_sha256: release10Production.artifactSha256,
      release_10_post_publication_verified_count: release10Production.bySlug.size,
      deterministic_generated_at_from_input_state: true,
      generated_at_method:
        'sha256 over sorted (absolute path, mtime-ms) of every input; mapped mod 86400000 then offset from 2026-07-20T00:00:00Z',
      // MRX1000-036 evidence-taxonomy corrections. Each is enforced by the
      // generator at write time (UUID shape) and again by the unit spec:
      evidence_taxonomy: {
        searchatlas_record_id_is_authoritative_content_genius_uuid_only: true,
        content_genius_article_uuid_is_authoritative_cg_record_only: true,
        pilot_article_id_stores_local_manifest_id_not_searchatlas_uuid: true,
        searchatlas_record_id_dropped_captures_any_non_uuid_value_for_audit: true,
        pilot_searchatlas_workflow_status_is_workflow_metadata_not_creation_evidence: true,
        nonpublic_incumbents_tracked_via_publication_gate_nonpublic_field: true,
        nonpublic_incumbents_never_represented_as_index_ready_by_noindex_required: true,
      },
      preservation_classification_taxonomy: {
        live_public_published_route:
          'existing sitemap-published route; no additional publication or indexing action authorized',
        incumbent_draft_nonpublic_held: 'workspace MDX with publication_status=draft; fail-closed',
        pilot_draft_noindex_stage:
          'MRX1000-PILOT-001 QA shells; noindex/draft; workflow metadata only',
        planning_only_inventory: 'searchatlas/factory/editorial; no MDX, no body',
      },
    },
    inputs: Object.fromEntries(
      Object.entries(INPUTS).map(([key, inputPath]) => [key, portableWorkspacePath(inputPath)]),
    ),
    quota_summary: CLUSTER_ORDER.map((cluster) => ({
      cluster,
      required: quotas[cluster],
      actual: counts[cluster],
      pass: quotas[cluster] === counts[cluster],
    })),
    source_summary: sourceSummary,
    verification: {
      row_count: selected.length,
      unique_slug_count: new Set(selected.map((row) => row.canonical_slug)).size,
      unique_normalized_title_count: new Set(
        selected.map((row) => normalizeTitle(row.canonical_title)),
      ).size,
      incumbent_repo_count: selected.filter((row) => row.source_system === 'astro_repo').length,
      pilot_001_count: selected.filter((row) => row.is_pilot_001).length,
      pilot_001_count_with_repo_mdx: selected.filter((row) => row.is_pilot_001 && row.repo_path)
        .length,
      exact_slug_duplicate_count: 0,
      exact_title_duplicate_count: 0,
      quota_total: Object.values(counts).reduce((sum, value) => sum + value, 0),
      all_quota_checks_pass: CLUSTER_ORDER.every((cluster) => counts[cluster] === quotas[cluster]),
      high_similarity_pair_count: highSimilarityPairs.length,
      high_similarity_pairs_involving_incumbent_or_pilot: highSimilarityPairs.filter(
        (pair) => pair.includes_incumbent_or_pilot,
      ).length,
      candidate_rejections: rejected,
      pilot_manifest_article_count: pilot.articles.length,
      pilot_manifest_articles_with_mdx_shell: selected.filter(
        (row) =>
          row.is_pilot_001 && row.repo_path && row.repo_path.startsWith('mrx/src/content/posts/'),
      ).length,
      // Preservation classification counts. These split the 1,000 rows into
      // the four canonical buckets. A verified production release moves rows
      // from the held incumbent bucket to the live-public bucket without
      // changing the 1,000-row program total:
      //   pilot_draft_noindex_stage          = 25  (MRX1000-PILOT-001)
      //   planning_only_inventory            = remaining searchatlas/factory/editorial rows
      preservation_classification_counts: {
        live_public_published_route: selected.filter(
          (row) => row.preservation_classification === 'live_public_published_route',
        ).length,
        incumbent_draft_nonpublic_held: selected.filter(
          (row) => row.preservation_classification === 'incumbent_draft_nonpublic_held',
        ).length,
        pilot_draft_noindex_stage: selected.filter(
          (row) => row.preservation_classification === 'pilot_draft_noindex_stage',
        ).length,
        planning_only_inventory: selected.filter(
          (row) => row.preservation_classification === 'planning_only_inventory',
        ).length,
      },
      release_10_post_publication_verified_count: selected.filter(
        (row) => row.normalized_status === 'live_public_published_route_release_10_verified',
      ).length,
      aggregate_eq_1000:
        selected.filter((row) => row.preservation_classification === 'live_public_published_route')
          .length +
          selected.filter(
            (row) => row.preservation_classification === 'incumbent_draft_nonpublic_held',
          ).length +
          selected.filter((row) => row.preservation_classification === 'pilot_draft_noindex_stage')
            .length +
          selected.filter((row) => row.preservation_classification === 'planning_only_inventory')
            .length ===
        1000,
      // Evidence-taxonomy counts. Current authoritative expected counts:
      //   searchatlas_record_id_non_null_uuid_count        = 0
      //   content_genius_article_uuid_non_null_count       = 0
      //   pilot_article_id_count                           = 25 (local
      //     manifest ID preserved; searchatlas_record_id_dropped captures any
      //     non-UUID value the loader ever sees)
      evidence_taxonomy: {
        searchatlas_record_id_non_null_uuid_count: selected.filter(
          (row) => row.searchatlas_record_id,
        ).length,
        content_genius_article_uuid_non_null_count: selected.filter(
          (row) => row.content_genius_article_uuid,
        ).length,
        searchatlas_title_uuid_non_null_count: selected.filter((row) => row.searchatlas_title_uuid)
          .length,
        searchatlas_record_id_dropped_count: selected.filter(
          (row) => row.searchatlas_record_id_dropped,
        ).length,
        pilot_article_id_non_null_count: selected.filter((row) => row.pilot_article_id).length,
        pilot_searchatlas_workflow_status_pilot_rows_with_non_creation_label: selected.filter(
          (row) =>
            row.is_pilot_001 && row.pilot_searchatlas_workflow_status_evidence_is_non_creation,
        ).length,
      },
    },
    dedupe_review_pairs: highSimilarityPairs,
    articles: selected,
  };

  if (
    ledger.verification.row_count !== 1000 ||
    ledger.verification.unique_slug_count !== 1000 ||
    ledger.verification.unique_normalized_title_count !== 1000 ||
    ledger.verification.incumbent_repo_count !== repo.length ||
    ledger.verification.pilot_001_count !== 25 ||
    ledger.verification.pilot_001_count_with_repo_mdx !== 25 ||
    !ledger.verification.all_quota_checks_pass
  ) {
    throw new Error(`Ledger verification failed: ${JSON.stringify(ledger.verification)}`);
  }

  // Evidence-taxonomy guard: every non-null `searchatlas_record_id` /
  // `content_genius_article_uuid` MUST be a real UUID. Local manifest IDs
  // like `MRX1000-PILOT-001-12` belong in `pilot_article_id` only. Zero
  // such values is the current authoritative expected count.
  const UUID_RE_CK = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const nonUuidSearchAtlasRecordIds = [];
  const nonUuidContentGeniusUuids = [];
  for (const row of selected) {
    if (row.searchatlas_record_id && !UUID_RE_CK.test(row.searchatlas_record_id)) {
      nonUuidSearchAtlasRecordIds.push(row.canonical_slug);
    }
    if (row.content_genius_article_uuid && !UUID_RE_CK.test(row.content_genius_article_uuid)) {
      nonUuidContentGeniusUuids.push(row.canonical_slug);
    }
  }
  if (nonUuidSearchAtlasRecordIds.length || nonUuidContentGeniusUuids.length) {
    throw new Error(
      `Evidence-taxonomy failure: non-UUID in authoritative UUID fields. ` +
        `searchatlas_record_id=${nonUuidSearchAtlasRecordIds.join(',')}; ` +
        `content_genius_article_uuid=${nonUuidContentGeniusUuids.join(',')}.`,
    );
  }

  const columns = [
    'program_row_id',
    'canonical_title',
    'canonical_slug',
    'canonical_url',
    'pillar',
    'pillar_url',
    'cluster',
    'primary_keyword',
    'secondary_keywords',
    'search_intent',
    'funnel_stage',
    'owner_persona',
    'source_system',
    'source_record_id',
    'source_handle',
    'searchatlas_map_id',
    'searchatlas_title_uuid',
    'searchatlas_record_id',
    'searchatlas_record_id_dropped',
    'content_genius_article_uuid',
    'content_genius_editor_url',
    'repo_path',
    'existing_url',
    'publication_status',
    'draft',
    'frontmatter_noindex',
    'publication_gate_nonpublic',
    'noindex_required',
    'preservation_classification',
    'normalized_status',
    'publication_state',
    'is_pilot_001',
    'pilot_article_id',
    'pilot_batch_id',
    'pilot_mdx_path',
    'pilot_searchatlas_workflow_status',
    'pilot_searchatlas_workflow_status_evidence_is_non_creation',
    'pilot_searchatlas_record_status',
    'pilot_dedupe_disposition',
    'pilot_compliance_gate',
    'pilot_compliance_disposition',
    'pilot_compliance_publication_approval',
    'pilot_compliance_legal_tax_sensitive',
    'pilot_compliance_human_escalation_required',
    'pilot_compliance_human_escalation_specialist',
    'map_cluster',
    'dedupe_group_id',
    'canonical_group_owner_url',
    'exact_slug_unique',
    'exact_title_unique',
    'nearest_same_cluster_slug',
    'cannibalization_score',
    'dedupe_review_status',
    'action',
    'action_reason',
    'compliance_status',
    'schema_status',
    'internal_link_role',
    'next_owner',
    'source_body_imported',
    'deployment_id',
    'deployment_url',
    'production_verification_path',
    'production_verification_sha256',
    'production_verified_at',
    'index_status',
    'performance_status',
    'refresh_due_date',
    'last_verified_at',
  ];
  await Promise.all([
    writeFile(OUTPUTS.json, `${JSON.stringify(ledger, null, 2)}\n`),
    writeFile(OUTPUTS.csv, `${toCsv(selected, columns)}\n`),
    writeFile(
      OUTPUTS.report,
      renderReport({ ledger, quotas, counts, sourceSummary, highSimilarityPairs, rejected }),
    ),
  ]);

  console.log(
    JSON.stringify(
      {
        outputs: Object.fromEntries(
          Object.entries(OUTPUTS).map(([key, outputPath]) => [
            key,
            portableWorkspacePath(outputPath),
          ]),
        ),
        verification: ledger.verification,
        quotas: ledger.quota_summary,
        sources: sourceSummary,
        content_fingerprint_sha256: ledger.content_fingerprint_sha256,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
