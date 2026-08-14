#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const slug = 'what-should-i-do-if-a-texas-mineral-rights-sale-goes-wrong';
const title = 'What Should I Do If a Texas Mineral Rights Sale Goes Wrong?';
const primaryKeyword = 'Texas Mineral Rights Sale Problem Triage';
const keyword = primaryKeyword;
const heroAlt =
  'A hand holds an envelope beside a tabbed file and “What Should I Do If a Texas Mineral Rights Sale Goes Wrong?”.';
const inlineAlt =
  'Hands hold envelopes and a file folder around a parcel map, an abacus, and “Texas Mineral Rights Sale Problem Triage”.';
const heroSha256 = 'a5beaa391c46eac8418097f25fc2e44ba44327d7fd4c74ca660f7f3eb25c5e01';
const inlineSha256 = '8ff0247b0dd8cdaa74aa01c4d2f363483bcda6841ffaf7e6a33fb48270a1cef0';
const programRowId = 'MRX1000-0139';
const selectionRank = 139;
const articleRelativePath = `src/content/posts/${slug}.mdx`;
const batchRelativePath = 'config/mrx1000-release-10-batch.json';
const retrofitRelativePath = 'config/mrx-article-two-image-retrofit.json';
const decisionRelativePath = 'docs/governance/mrx1000-wave59-selection-decision-2026-08-14.md';
const creativeManifestRelativePath = `artifacts/mrx1000-wave59-creative-qa/${slug}/creative-manifest.json`;

const batchPath = join(root, batchRelativePath);
const retrofitPath = join(root, retrofitRelativePath);
const articlePath = join(root, articleRelativePath);
const decisionPath = join(root, decisionRelativePath);
const creativeManifestPath = join(root, creativeManifestRelativePath);
const ledgerPath = join(root, 'config/mrx-1000-canonical-content-ledger.json');
const productionVerificationPath = join(
  root,
  'artifacts/mrx1000-release-10/release/post-publication-verification.json',
);
function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Article frontmatter missing');
  return match[1];
}

function unquote(value) {
  return String(value ?? '')
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .replace(/''/g, "'");
}

function scalar(block, key) {
  return unquote(block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]);
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1] ?? '';
  return unquote(nested.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1]);
}

function wordCount(source) {
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  return body.match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu)?.length ?? 0;
}

function textSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function retrofitSummary(rows) {
  return {
    article_count: rows.length,
    asset_count: rows.length * 2,
    unique_source_art_count: new Set(rows.map((row) => row.source_public_path)).size,
    unique_hero_sha256_count: new Set(rows.map((row) => row.hero.sha256)).size,
    unique_inline_sha256_count: new Set(rows.map((row) => row.inline.sha256)).size,
    distinct_article_pair_count: rows.filter((row) => row.hero.sha256 !== row.inline.sha256).length,
    hero_ocr_pass_count: rows.filter((row) => row.hero.ocr?.pass === true).length,
    inline_ocr_pass_count: rows.filter((row) => row.inline.ocr?.pass === true).length,
    exact_filename_identity_count: rows.filter(
      (row) =>
        basename(row.hero.public_path, '.webp') === textSlug(row.title) &&
        basename(row.inline.public_path, '.webp') === textSlug(row.keyword),
    ).length,
  };
}

async function writeReviewPlaceholder(relativePath, capability, now) {
  const path = join(root, relativePath);
  await mkdir(dirname(path), { recursive: true });
  const existing = await readFile(path, 'utf8').catch(() => null);
  if (existing) {
    const artifact = JSON.parse(existing);
    if (
      artifact.slug === slug &&
      artifact.capability === capability &&
      artifact.disposition === 'PASS'
    ) {
      return;
    }
  }
  const artifact = {
    artifact_type: 'mrx1000_wave59_review_placeholder',
    schema_version: '1.0.0',
    disposition: 'PENDING_REBUILD',
    capability,
    program_row_id: programRowId,
    slug,
    title,
    created_at: now,
  };
  const text = `${JSON.stringify(artifact, null, 2)}\n`;
  await writeFile(path, text);
  await writeFile(`${path}.sha256`, `${sha256(text)}  ${basename(path)}\n`);
}

const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const [articleBytes, decisionBytes] = await Promise.all([
  readFile(articlePath),
  readFile(decisionPath),
]);

const source = articleBytes.toString('utf8');
const fm = frontmatter(source);
const decisionSource = decisionBytes.toString('utf8');
const requiredDecisionId = 'MRX1000-W59-SELECT-2026-08-14';
if (
  !decisionSource.includes('Decision ID: `' + requiredDecisionId + '`') ||
  !decisionSource.includes('Disposition: `APPROVED_FOR_CONTINUOUS_QUALITY_GATED_PUBLICATION`')
) {
  throw new Error('Wave 59 selection decision remains draft-only and is not publication authority');
}
if (
  scalar(fm, 'title') !== title ||
  scalar(fm, 'publication_status') !== 'published' ||
  scalar(fm, 'draft') !== 'false' ||
  scalar(fm, 'noindex') !== 'false' ||
  scalar(fm, 'primary_keyword') !== primaryKeyword ||
  scalar(fm, 'reviewed_by') !== 'mrx_compliance-continuous-wave59' ||
  nestedScalar(fm, 'hero_image', 'alt') !== heroAlt ||
  nestedScalar(fm, 'hero_image', 'social_alt') !== heroAlt ||
  nestedScalar(fm, 'inline_image', 'alt') !== inlineAlt ||
  nestedScalar(fm, 'inline_image', 'rendered_text') !== keyword
) {
  throw new Error('Article identity or published/indexable state is not ready for admission');
}

for (const parent of ['hero_image', 'inline_image']) {
  const key = 'sha256';
  const value = nestedScalar(fm, parent, key);
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(
      `${parent}.${key} remains unresolved; final accepted image evidence is required`,
    );
  }
  const perceptualHash = nestedScalar(fm, parent, 'perceptual_hash');
  if (!/^[01]{256}$/.test(perceptualHash)) {
    throw new Error(
      `${parent}.perceptual_hash remains unresolved; final visual evidence is required`,
    );
  }
}

const [creativeBytes, batchBytes, retrofitBytes, ledgerBytes] = await Promise.all([
  readFile(creativeManifestPath),
  readFile(batchPath),
  readFile(retrofitPath),
  readFile(ledgerPath),
]);

const creativeDocument = JSON.parse(creativeBytes.toString('utf8'));
const creative = creativeDocument.article;
if (
  creative.title !== title ||
  creative.keyword !== keyword ||
  creative.hero.rendered_text !== title ||
  creative.inline.rendered_text !== keyword ||
  creative.hero.sha256 !== heroSha256 ||
  creative.inline.sha256 !== inlineSha256 ||
  creative.hero.ocr?.pass !== true ||
  creative.inline.ocr?.pass !== true ||
  creative.hero.sha256 === creative.inline.sha256
) {
  throw new Error('Creative manifest does not prove exact-text, distinct two-image assets');
}

for (const image of [creative.hero, creative.inline]) {
  const bytes = await readFile(join(root, 'public', image.public_path.slice(1)));
  if (sha256(bytes) !== image.sha256) throw new Error(`${image.public_path}: creative hash drift`);
}

const retrofit = JSON.parse(retrofitBytes.toString('utf8'));
const existingRetrofitIndex = retrofit.rows.findIndex((row) => row.slug === slug);
const generatedAt =
  retrofit.rows[existingRetrofitIndex]?.generated_at_utc ??
  creativeDocument.generated_at_utc ??
  now;
const retrofitRow = {
  slug,
  title,
  keyword,
  file_path: articleRelativePath,
  source_public_path: creative.hero.public_path,
  source_artifact_paths: [creative.hero.source_path, creative.inline.source_path],
  generated_at_utc: generatedAt,
  hero: {
    public_path: creative.hero.public_path,
    alt: nestedScalar(fm, 'hero_image', 'alt'),
    width: creative.hero.width,
    height: creative.hero.height,
    mime_type: creative.hero.mime_type,
    sha256: creative.hero.sha256,
    perceptual_hash: creative.hero.perceptual_hash,
    neutralized_art_text_region_count: creative.hero.neutralized_art_text_region_count,
    ocr: {
      expected: title,
      actual: creative.hero.ocr.actual,
      normalized_expected: creative.hero.ocr.normalized,
      normalized_actual: creative.hero.ocr.normalized,
      uppercase_i_confusable_accepted: false,
      pass: true,
    },
  },
  inline: {
    public_path: creative.inline.public_path,
    alt: nestedScalar(fm, 'inline_image', 'alt'),
    rendered_text: keyword,
    visual_variant: 'wave59-distinct-generated-incident-triage-routing',
    width: creative.inline.width,
    height: creative.inline.height,
    mime_type: creative.inline.mime_type,
    sha256: creative.inline.sha256,
    perceptual_hash: creative.inline.perceptual_hash,
    neutralized_art_text_region_count: creative.inline.neutralized_art_text_region_count,
    ocr: {
      expected: keyword,
      actual: creative.inline.ocr.actual,
      normalized_expected: creative.inline.ocr.normalized,
      normalized_actual: creative.inline.ocr.normalized,
      uppercase_i_confusable_accepted: false,
      pass: true,
    },
  },
};

if (existingRetrofitIndex >= 0) retrofit.rows[existingRetrofitIndex] = retrofitRow;
else retrofit.rows.push(retrofitRow);
retrofit.rows.sort((left, right) => left.slug.localeCompare(right.slug));
if (existingRetrofitIndex < 0) retrofit.generated_at_utc = now;
retrofit.summary = retrofitSummary(retrofit.rows);
const summaryValues = Object.entries(retrofit.summary).filter(([key]) => key !== 'asset_count');
if (
  retrofit.summary.asset_count !== retrofit.rows.length * 2 ||
  summaryValues.some(([, value]) => value !== retrofit.rows.length)
) {
  throw new Error(
    `Retrofit summary did not prove a complete corpus: ${JSON.stringify(retrofit.summary)}`,
  );
}
const nextRetrofitText = `${JSON.stringify(retrofit, null, 2)}\n`;
await writeFile(retrofitPath, nextRetrofitText);

const batch = JSON.parse(batchBytes.toString('utf8'));
const ledger = JSON.parse(ledgerBytes.toString('utf8'));
const sourceRow = ledger.articles.find((row) => row.program_row_id === programRowId);
if (!sourceRow || sourceRow.canonical_slug !== slug || sourceRow.canonical_title !== title) {
  throw new Error('Canonical planning-row identity is missing or drifted');
}
if (
  ledger.articles.length !== 1000 ||
  new Set(ledger.articles.map((row) => row.canonical_slug)).size !== 1000 ||
  ledger.articles.some(
    (row) => row.canonical_slug === 'what-are-the-biggest-pitfalls-in-selling-mineral-rights',
  )
) {
  throw new Error('Wave 59 canonical ledger re-key or 1,000-row uniqueness proof failed');
}
const sourceIdentitySha =
  batch.articles.find((row) => row.slug === slug)?.archive_evidence_sha256 ??
  sha256(
    JSON.stringify(
      sortDeep({
        source_system: sourceRow.source_system,
        source_record_id: sourceRow.source_record_id,
        source_handle: sourceRow.source_handle,
        canonical_title: sourceRow.canonical_title,
        canonical_slug: sourceRow.canonical_slug,
        action_reason: sourceRow.action_reason,
      }),
    ),
  );
const articleSha = sha256(articleBytes);
ledger.identity_registry ??= {};
const wave59Rekey = ledger.identity_registry.wave59_rekey ?? {
  program_row_id: programRowId,
  prior_canonical_slug: 'what-are-the-biggest-pitfalls-in-selling-mineral-rights',
  prior_searchatlas_handle:
    'searchatlas-topical-map:256286:title:583b6b3e-46f4-481d-860f-e39261ab35ab',
  selection_decision: decisionRelativePath,
  draft_selection_decision_sha256: sha256(decisionBytes),
  draft_article_sha256: articleSha,
};
if (wave59Rekey.program_row_id !== programRowId) {
  throw new Error('Wave 59 canonical re-key provenance is missing or drifted');
}
ledger.identity_registry.wave59_rekey = wave59Rekey;
wave59Rekey.draft_selection_decision_sha256 ??= wave59Rekey.selection_decision_sha256;
wave59Rekey.selection_decision_sha256 = sha256(decisionBytes);
wave59Rekey.release_candidate_article_sha256 = articleSha;
wave59Rekey.promoted_at_utc ??= now;
const nextLedgerText = `${JSON.stringify(ledger, null, 2)}\n`;
await writeFile(ledgerPath, nextLedgerText);
const batchRow = {
  selection_rank: selectionRank,
  program_row_id: programRowId,
  source_shortlist_program_row_id: programRowId,
  slug,
  title,
  source_shortlist_title: title,
  canonical_url: `https://mineralrightsxchange.com/blog/${slug}/`,
  pillar: 'sell-mineral-rights',
  cluster: 'sell-mineral-rights-decision-process',
  content_genius_article_uuid: null,
  archive_evidence_sha256: sourceIdentitySha,
  repo_path: articleRelativePath,
  repo_sha256: articleSha,
  article_sha256: articleSha,
  hero_path: creative.hero.public_path,
  hero_sha256: creative.hero.sha256,
  hero_asset_sha256: creative.hero.sha256,
  admission_status: 'admitted_quality_gated',
  finalization_state: 'draft_noindex_admitted',
  searchatlas_content_score: null,
  searchatlas_word_count: wordCount(source),
  risk_citation_remediation: [
    'The broad planned pitfalls identity was rejected because an existing prevention guide owns end-to-end seller mistakes and an existing hidden-traps guide owns clause and contract triggers. The admitted article owns stage-based incident triage after a concrete Texas mineral-rights sale mismatch: freeze and index evidence, establish the last verified state, separate an ordinary discrepancy from a suspected security incident, identify the next reversible procedural control, and route the precise unresolved issue.',
    'Continuous quality-gated admission under D-2026-0804-16 and MRX1000-W59-SELECT-2026-08-14; no numerical cap or elapsed-time gate applies.',
    'Publication remains conditional on current editorial, factual-citation, compliance, two-image, metadata, build, rollback, deployment, and live-verification evidence.',
  ],
  evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${slug}.json`,
  evidence_packet_path_required: true,
  inline_path: creative.inline.public_path,
  inline_asset_sha256: creative.inline.sha256,
  inline_rendered_text: keyword,
};

const existingBatchIndex = batch.articles.findIndex((row) => row.slug === slug);
if (existingBatchIndex >= 0) batch.articles[existingBatchIndex] = batchRow;
else batch.articles.push(batchRow);
batch.articles.sort((left, right) => left.selection_rank - right.selection_rank);
if (
  batch.articles.length !== selectionRank ||
  batch.articles.some((row, index) => row.selection_rank !== index + 1) ||
  new Set(batch.articles.map((row) => row.slug)).size !== batch.articles.length ||
  new Set(batch.articles.map((row) => row.program_row_id)).size !== batch.articles.length
) {
  throw new Error('Continuous batch identity or selection-rank audit failed');
}

batch.evidence_scaffold_generated_at_utc = now;
batch.identity_authority.canonical_ledger_sha256 = sha256(Buffer.from(nextLedgerText));
batch.identity_authority.canonical_ledger_generated_at = ledger.generated_at;
const productionVerificationBytes = await readFile(productionVerificationPath).catch(() => null);
if (productionVerificationBytes) {
  const productionVerification = JSON.parse(productionVerificationBytes.toString('utf8'));
  const productionSummary = productionVerification.summary ?? {};
  const deploymentId = productionVerification.deployment?.deployment_id;
  if (
    productionSummary.overall_disposition === 'PASS' &&
    productionSummary.expected_articles === batch.articles.length &&
    Number.isInteger(productionSummary.expected_live_blog_count) &&
    deploymentId
  ) {
    batch.identity_authority.reconciled_at_utc = productionVerification.generated_at_utc ?? now;
    batch.identity_authority.note =
      'The controlling shortlist authorizes these exact canonical slugs. Historical row IDs remain ' +
      `provenance; current IDs are reconciled to the deterministic post-publication ledger after deployment ${deploymentId}, ` +
      `with ${productionSummary.expected_live_blog_count} public article routes and ` +
      `${productionSummary.expected_articles} live-verified MRX1000 articles.`;
  }
}
batch.decision_authority.wave59_selection_decision_id = 'MRX1000-W59-SELECT-2026-08-14';
batch.decision_authority.wave59_selection_decision_path = decisionRelativePath;
batch.decision_authority.wave59_selection_decision_sha256 = sha256(decisionBytes);
batch.policy.prior_verified_article_count = selectionRank - 1;
batch.policy.exact_admitted_count = batch.articles.length;
batch.policy.exact_admitted_slate_sha256 = sha256(JSON.stringify(sortDeep(batch.articles)));
batch.two_image_policy.retrofit_manifest_sha256 = sha256(Buffer.from(nextRetrofitText));
batch.two_image_policy.public_article_count = retrofit.rows.length;
batch.two_image_policy.batch_article_count = batch.articles.length;
batch.admission_audit = {
  admitted_article_count: batch.articles.length,
  selection_ranks: batch.articles.map((row) => row.selection_rank),
  duplicate_program_row_ids: [],
  duplicate_slugs: [],
  quality_gated_continuous_release: true,
};

const nextBatchText = `${JSON.stringify(batch, null, 2)}\n`;
await writeFile(batchPath, nextBatchText);
await writeFile(
  `${batchPath}.sha256`,
  `${sha256(Buffer.from(nextBatchText))}  ${batchRelativePath}\n`,
);

await Promise.all([
  writeReviewPlaceholder(
    `artifacts/mrx1000-release-10/reviews/final/editorial/${programRowId}-${slug}.json`,
    'editorial',
    now,
  ),
  writeReviewPlaceholder(
    `artifacts/mrx1000-release-10/reviews/final/factual_citation/${slug}.review.json`,
    'factual_citation',
    now,
  ),
  writeReviewPlaceholder(
    `artifacts/mrx1000-release-10/reviews/final/compliance/${slug}.json`,
    'compliance',
    now,
  ),
]);

console.log(
  JSON.stringify(
    {
      admitted: slug,
      selection_rank: selectionRank,
      batch_article_count: batch.articles.length,
      public_article_count: retrofit.rows.length,
      article_sha256: articleSha,
      hero_sha256: creative.hero.sha256,
      inline_sha256: creative.inline.sha256,
      decision_sha256: sha256(decisionBytes),
    },
    null,
    2,
  ),
);
