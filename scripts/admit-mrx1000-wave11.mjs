#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const slug = 'how-to-know-if-your-mineral-rights-offer-is-fair';
const title = 'How to Know if Your Mineral Rights Offer Is Fair';
const keyword = 'fair mineral rights offer';
const programRowId = 'MRX1000-0309';
const selectionRank = 91;
const articleRelativePath = `src/content/posts/${slug}.mdx`;
const batchRelativePath = 'config/mrx1000-release-10-batch.json';
const retrofitRelativePath = 'config/mrx-article-two-image-retrofit.json';
const decisionRelativePath = 'docs/governance/mrx1000-wave11-selection-decision-2026-08-11.md';
const creativeManifestRelativePath =
  'artifacts/mrx1000-wave11-creative-qa/how-to-know-if-your-mineral-rights-offer-is-fair/creative-manifest.json';

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
  return String(value ?? '').trim().replace(/^(['"])(.*)\1$/, '$2').replace(/''/g, "'");
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
    if (artifact.slug === slug && artifact.capability === capability && artifact.disposition === 'PASS') {
      return;
    }
  }
  const artifact = {
    artifact_type: 'mrx1000_wave11_review_placeholder',
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
const [articleBytes, decisionBytes, creativeBytes, batchBytes, retrofitBytes, ledgerBytes] = await Promise.all([
  readFile(articlePath),
  readFile(decisionPath),
  readFile(creativeManifestPath),
  readFile(batchPath),
  readFile(retrofitPath),
  readFile(ledgerPath),
]);

const source = articleBytes.toString('utf8');
const fm = frontmatter(source);
if (
  scalar(fm, 'title') !== title ||
  scalar(fm, 'publication_status') !== 'published' ||
  scalar(fm, 'draft') !== 'false' ||
  scalar(fm, 'noindex') !== 'false' ||
  scalar(fm, 'primary_keyword') !== keyword
) {
  throw new Error('Article identity or published/indexable state is not ready for admission');
}

const creativeDocument = JSON.parse(creativeBytes.toString('utf8'));
const creative = creativeDocument.article;
if (
  creative.title !== title ||
  creative.keyword !== keyword ||
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
    neutralized_art_text_region_count: 0,
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
    visual_variant: 'wave11-distinct-generated-flatlay',
    width: creative.inline.width,
    height: creative.inline.height,
    mime_type: creative.inline.mime_type,
    sha256: creative.inline.sha256,
    perceptual_hash: creative.inline.perceptual_hash,
    neutralized_art_text_region_count: 0,
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
  throw new Error(`Retrofit summary did not prove a complete corpus: ${JSON.stringify(retrofit.summary)}`);
}
const nextRetrofitText = `${JSON.stringify(retrofit, null, 2)}\n`;
await writeFile(retrofitPath, nextRetrofitText);

const batch = JSON.parse(batchBytes.toString('utf8'));
const articleSha = sha256(articleBytes);
const batchRow = {
  selection_rank: selectionRank,
  program_row_id: programRowId,
  source_shortlist_program_row_id: programRowId,
  slug,
  title,
  source_shortlist_title: title,
  canonical_url: `https://mineralrightsxchange.com/blog/${slug}/`,
  pillar: 'offer-review',
  cluster: 'offer-review-buyer-comparison-safety',
  content_genius_article_uuid: null,
  archive_evidence_sha256: '591fba8ea3111037c962f3d21ab957a8e55c3e825d423dcbfe96e446805ebd10',
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
    'The unsupported predecessor draft was replaced wholesale with an evidence-bounded, primary-source fairness worksheet.',
    'Continuous quality-gated admission under D-2026-0804-16 and MRX1000-W11-SELECT-2026-08-11; no numerical cap or elapsed-time gate applies.',
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
const ledger = JSON.parse(ledgerBytes.toString('utf8'));
batch.identity_authority.canonical_ledger_sha256 = sha256(ledgerBytes);
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
batch.decision_authority.wave11_selection_decision_id = 'MRX1000-W11-SELECT-2026-08-11';
batch.decision_authority.wave11_selection_decision_path = decisionRelativePath;
batch.decision_authority.wave11_selection_decision_sha256 = sha256(decisionBytes);
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
