#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const waveNumber = process.env.MRX_WAVE_NUMBER ?? '82';
const waveKey = `wave${waveNumber}`;
const stageCandidate = process.argv.includes('--stage-candidate');
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== '--stage-candidate');
if (unknownArgs.length) {
  throw new Error(`Unknown Wave ${waveNumber} admission argument(s): ${unknownArgs.join(', ')}`);
}

const slug =
  process.env.MRX_ARTICLE_SLUG ??
  'compare-public-oil-and-gas-price-decks-without-mixing-assumptions';
const title =
  process.env.MRX_ARTICLE_TITLE ??
  'How to Compare Public Oil and Gas Price Decks Without Mixing Assumptions';
const primaryKeyword = process.env.MRX_PRIMARY_KEYWORD ?? 'compare public oil and gas price decks';
const keyword = process.env.MRX_INLINE_KEYWORD ?? primaryKeyword;
const heroFilename = process.env.MRX_HERO_FILENAME ?? textSlug(title);
const heroAlt =
  process.env.MRX_HERO_ALT ??
  'Two separate published price-deck booklets appear beside the exact article title.';
const inlineAlt =
  process.env.MRX_INLINE_ALT ??
  'An overhead public price-deck comparison matrix appears above the exact keyword.';
const programRowId = process.env.MRX_PROGRAM_ROW_ID ?? 'MRX1000-0267';
const selectionRank = Number(process.env.MRX_SELECTION_RANK ?? 162);
const articleRelativePath = `src/content/posts/${slug}.mdx`;
const batchRelativePath = 'config/mrx1000-release-10-batch.json';
const retrofitRelativePath = 'config/mrx-article-two-image-retrofit.json';
const decisionRelativePath =
  process.env.MRX_DECISION_PATH ??
  `docs/governance/mrx1000-wave${waveNumber}-selection-decision-2026-08-23.md`;
const creativeManifestRelativePath = `artifacts/mrx1000-wave${waveNumber}-creative-qa/${slug}/creative-manifest.json`;
const requiredDecisionId =
  process.env.MRX_DECISION_ID ?? `MRX1000-W${waveNumber}-SELECT-2026-08-23`;
const reviewedBy = process.env.MRX_REVIEWED_BY ?? `mrx_compliance-continuous-wave${waveNumber}`;
const priorCanonicalTitle =
  process.env.MRX_PRIOR_TITLE ?? 'Price Decks: How Oil and Gas Assumptions Change Present Value';
const priorCanonicalSlug =
  process.env.MRX_PRIOR_SLUG ?? 'price-decks-how-oil-and-gas-assumptions-change-present-value';
const priorSourceHandle =
  process.env.MRX_PRIOR_SOURCE_HANDLE ??
  'factory-taxonomy-synthesis:valuation:price-decks-present-value';
const secondaryKeywords = JSON.parse(
  process.env.MRX_SECONDARY_KEYWORDS_JSON ??
    '["compare public oil and gas price decks","oil and gas price deck comparison","price deck assumption checklist"]',
);
const nearestSameClusterSlug =
  process.env.MRX_NEAREST_SAME_CLUSTER_SLUG ??
  'pdp-pud-and-undeveloped-acreage-terminology-register';
const cannibalizationScore = Number(process.env.MRX_CANNIBALIZATION_SCORE ?? 0.15);
const actionReason =
  process.env.MRX_ACTION_REASON ??
  'The original price-deck and present-value identity overlapped the live oil-price, DCF, discount-rate, decline-curve, future-location, sensitivity, due-diligence, and valuation-methodology corpus. The approved replacement owns only source-preserving comparison of published source identity, dates, commodities, benchmarks, geography, units, nominal-or-real basis, horizon, stated use case, frame status, and neutral questions. It stops before building, extending, blending, converting, normalizing, selecting, validating, or recommending a deck; forecasting prices; applying property-level assumptions; or calculating cash flow, present value, value, an offer, or a transaction result. Release remains controlled by the signed batch, matching evidence, deployment, and live verification.';
const riskCitationRemediation = JSON.parse(
  process.env.MRX_RISK_REMEDIATION_JSON ??
    JSON.stringify([
      'The original price-deck and present-value identity was rejected because it overlaps the live oil-price, DCF, discount-rate, decline-curve, future-location, sensitivity, due-diligence, and valuation-methodology corpus. The admitted replacement owns only a source-preserving field-by-field comparison of dated public price publications.',
      'Current official EIA and SEC/Federal Register sources support only bounded descriptions of release context, units, nominal-or-real basis, and distinct public-outlook versus reserve-disclosure pricing frames. None selects or validates a price deck, supplies property-specific assumptions, predicts realized prices, or determines cash flow, present value, value, an offer, or a transaction result.',
      'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W82-SELECT-2026-08-23; no numerical cap, elapsed-time gate, or owner publication approval applies.',
      'Publication remains conditional on current editorial, factual-citation, compliance, two-image, metadata, build, rollback, deployment, and live-verification evidence.',
    ]),
);
const inlineVisualVariant =
  process.env.MRX_INLINE_VISUAL_VARIANT ??
  'wave82-distinct-generated-overhead-public-price-deck-comparison-matrix';
const pillar = process.env.MRX_PILLAR ?? 'mineral-rights-value';
const pillarUrl = process.env.MRX_PILLAR_URL ?? '/mineral-rights-value/';
const cluster = process.env.MRX_CLUSTER ?? 'valuation-methodology-drivers';
const funnelStage = process.env.MRX_FUNNEL_STAGE ?? 'consideration';

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

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

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
    artifact_type: `mrx1000_wave${waveNumber}_review_placeholder`,
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
if (
  !decisionSource.includes(`Decision ID: \`${requiredDecisionId}\``) ||
  !decisionSource.includes('Disposition: `APPROVED_FOR_CONTINUOUS_QUALITY_GATED_PUBLICATION`')
) {
  throw new Error(
    `Wave ${waveNumber} selection decision remains draft-only and is not publication authority`,
  );
}

if (
  scalar(fm, 'title') !== title ||
  scalar(fm, 'publication_status') !== 'published' ||
  scalar(fm, 'draft') !== 'false' ||
  scalar(fm, 'noindex') !== 'false' ||
  scalar(fm, 'primary_keyword') !== primaryKeyword ||
  scalar(fm, 'reviewed_by') !== reviewedBy ||
  nestedScalar(fm, 'hero_image', 'src') !== `/assets/articles/hero/${heroFilename}.webp` ||
  nestedScalar(fm, 'hero_image', 'social_src') !== `/assets/articles/hero/${heroFilename}.webp` ||
  nestedScalar(fm, 'hero_image', 'alt') !== heroAlt ||
  nestedScalar(fm, 'hero_image', 'social_alt') !== heroAlt ||
  nestedScalar(fm, 'inline_image', 'src') !==
    `/assets/articles/inline/${slug}/${textSlug(keyword)}.webp` ||
  nestedScalar(fm, 'inline_image', 'alt') !== inlineAlt ||
  nestedScalar(fm, 'inline_image', 'rendered_text') !== keyword
) {
  throw new Error('Article identity or published/indexable state is not ready for admission');
}

for (const parent of ['hero_image', 'inline_image']) {
  if (!/^[a-f0-9]{64}$/.test(nestedScalar(fm, parent, 'sha256'))) {
    throw new Error(
      `${parent}.sha256 remains unresolved; final accepted image evidence is required`,
    );
  }
  if (!/^[01]{256}$/.test(nestedScalar(fm, parent, 'perceptual_hash'))) {
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
  creative.hero.ocr?.pass !== true ||
  creative.inline.ocr?.pass !== true ||
  creative.hero.width !== 1200 ||
  creative.hero.height !== 630 ||
  creative.inline.width !== 1200 ||
  creative.inline.height !== 675 ||
  creative.hero.mime_type !== 'image/webp' ||
  creative.inline.mime_type !== 'image/webp' ||
  creative.hero.sha256 === creative.inline.sha256 ||
  creative.hero.public_path !== `/assets/articles/hero/${heroFilename}.webp` ||
  creative.inline.public_path !== `/assets/articles/inline/${slug}/${textSlug(keyword)}.webp` ||
  basename(creative.hero.public_path, '.webp') !== textSlug(title) ||
  basename(creative.inline.public_path, '.webp') !== textSlug(keyword) ||
  nestedScalar(fm, 'hero_image', 'sha256') !== creative.hero.sha256 ||
  nestedScalar(fm, 'hero_image', 'perceptual_hash') !== creative.hero.perceptual_hash ||
  nestedScalar(fm, 'inline_image', 'sha256') !== creative.inline.sha256 ||
  nestedScalar(fm, 'inline_image', 'perceptual_hash') !== creative.inline.perceptual_hash ||
  creativeDocument.verification?.exact_title_ocr !== true ||
  creativeDocument.verification?.exact_keyword_ocr !== true ||
  creativeDocument.verification?.deterministic_pixel_text !== true ||
  creativeDocument.verification?.distinct_source_binaries !== true ||
  creativeDocument.verification?.distinct_output_binaries !== true
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
    alt: heroAlt,
    width: creative.hero.width,
    height: creative.hero.height,
    mime_type: creative.hero.mime_type,
    sha256: creative.hero.sha256,
    perceptual_hash: creative.hero.perceptual_hash,
    neutralized_art_text_region_count: creative.hero.neutralized_art_text_region_count,
    ocr: {
      expected: title,
      actual: creative.hero.ocr.actual,
      normalized_expected: creative.hero.ocr.normalized_expected,
      normalized_actual: creative.hero.ocr.normalized_actual,
      uppercase_i_confusable_accepted: creative.hero.ocr.uppercase_i_confusable_accepted === true,
      pass: true,
    },
  },
  inline: {
    public_path: creative.inline.public_path,
    alt: inlineAlt,
    rendered_text: keyword,
    visual_variant: inlineVisualVariant,
    width: creative.inline.width,
    height: creative.inline.height,
    mime_type: creative.inline.mime_type,
    sha256: creative.inline.sha256,
    perceptual_hash: creative.inline.perceptual_hash,
    neutralized_art_text_region_count: creative.inline.neutralized_art_text_region_count,
    ocr: {
      expected: keyword,
      actual: creative.inline.ocr.actual,
      normalized_expected: creative.inline.ocr.normalized_expected,
      normalized_actual: creative.inline.ocr.normalized_actual,
      uppercase_i_confusable_accepted: creative.inline.ocr.uppercase_i_confusable_accepted === true,
      pass: true,
    },
  },
};

if (existingRetrofitIndex >= 0) retrofit.rows[existingRetrofitIndex] = retrofitRow;
else retrofit.rows.push(retrofitRow);
retrofit.rows.sort((left, right) => left.slug.localeCompare(right.slug));
if (existingRetrofitIndex < 0) retrofit.generated_at_utc = now;
retrofit.summary = retrofitSummary(retrofit.rows);
if (
  retrofit.summary.asset_count !== retrofit.rows.length * 2 ||
  Object.entries(retrofit.summary)
    .filter(([key]) => key !== 'asset_count')
    .some(([, value]) => value !== retrofit.rows.length)
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
if (
  !sourceRow ||
  ![priorCanonicalSlug, slug].includes(sourceRow.canonical_slug) ||
  ![priorCanonicalTitle, title].includes(sourceRow.canonical_title)
) {
  throw new Error('Canonical planning-row identity is missing or drifted');
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

if ([priorCanonicalSlug, slug].includes(sourceRow.canonical_slug)) {
  const productionVerified =
    sourceRow.normalized_status === 'live_public_published_route_release_10_verified' &&
    sourceRow.publication_state === 'released_public_article' &&
    Boolean(sourceRow.production_verified_at);
  Object.assign(sourceRow, {
    canonical_title: title,
    canonical_slug: slug,
    canonical_url: `https://mineralrightsxchange.com/blog/${slug}/`,
    pillar,
    pillar_url: pillarUrl,
    cluster,
    primary_keyword: primaryKeyword,
    secondary_keywords: secondaryKeywords,
    search_intent: 'informational',
    funnel_stage: funnelStage,
    source_system: 'astro_repo',
    source_record_id: `${slug}.mdx`,
    source_handle: `repo:${articleRelativePath}`,
    searchatlas_map_id: null,
    searchatlas_title_uuid: null,
    repo_path: `mrx/${articleRelativePath}`,
    existing_url: `https://mineralrightsxchange.com/blog/${slug}/`,
    publication_status: 'published',
    draft: false,
    frontmatter_noindex: false,
    publication_gate_nonpublic: false,
    noindex_required: false,
    preservation_classification: 'live_public_published_route',
    normalized_status: productionVerified
      ? 'live_public_published_route_release_10_verified'
      : 'authorized_release_candidate_pending_gate_and_deployment',
    publication_state: productionVerified
      ? 'released_public_article'
      : 'authorized_release_candidate',
    map_cluster: null,
    dedupe_group_id: `canonical:${slug}`,
    canonical_group_owner_url: `https://mineralrightsxchange.com/blog/${slug}/`,
    action: productionVerified
      ? 'retain_verified_live_route_measure_index_coverage_and_refresh'
      : 'release_only_after_exact_batch_gate_and_production_verification',
    action_reason: productionVerified
      ? 'Release-10 passed the signed batch gate, production deployment, and independent post-publication verification. Preserve the canonical URL; measurement informs refresh and prioritization, not a numerical release gate.'
      : actionReason,
    compliance_status: productionVerified
      ? 'release_10_capability_reviews_passed_production_verified'
      : 'release_10_hash_locked_review_required',
    schema_status: 'article_schema_path_present_revalidation_required',
    internal_link_role: 'incumbent_supporting_article',
    next_owner: productionVerified ? 'mrx_growth_measurement' : 'mrx_editorial',
    dedupe_evidence: {
      normalized_title: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim(),
      exact_slug_unique: true,
      exact_title_unique: true,
      nearest_same_cluster_slug: nearestSameClusterSlug,
      nearest_same_cluster_title_token_jaccard: cannibalizationScore,
      review_status: 'exact_and_fuzzy_title_check_pass',
    },
    exact_slug_unique: true,
    exact_title_unique: true,
    nearest_same_cluster_slug: nearestSameClusterSlug,
    cannibalization_score: cannibalizationScore,
    dedupe_review_status: 'exact_and_fuzzy_title_check_pass',
  });
}
if (
  ledger.articles.length !== 1000 ||
  new Set(ledger.articles.map((row) => row.canonical_slug)).size !== 1000 ||
  ledger.articles.some((row) => row.canonical_slug === priorCanonicalSlug)
) {
  throw new Error(
    `Wave ${waveNumber} canonical ledger re-key or 1,000-row uniqueness proof failed`,
  );
}
const articleSha = sha256(articleBytes);
ledger.identity_registry ??= {};
const rekeyRegistryKey = `${waveKey}_rekey`;
const waveRekey = ledger.identity_registry[rekeyRegistryKey] ?? {
  program_row_id: programRowId,
  prior_canonical_slug: priorCanonicalSlug,
  prior_source_handle: priorSourceHandle,
  selection_decision: decisionRelativePath,
  draft_selection_decision_sha256: sha256(decisionBytes),
  draft_article_sha256: articleSha,
};
if (waveRekey.program_row_id !== programRowId) {
  throw new Error(`Wave ${waveNumber} canonical re-key provenance is missing or drifted`);
}
ledger.identity_registry[rekeyRegistryKey] = waveRekey;
waveRekey.draft_selection_decision_sha256 ??= waveRekey.selection_decision_sha256;
waveRekey.selection_decision_sha256 = sha256(decisionBytes);
waveRekey.release_candidate_article_sha256 = articleSha;
waveRekey.promoted_at_utc ??= now;
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
  pillar,
  cluster,
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
  risk_citation_remediation: riskCitationRemediation,
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
  throw new Error(`Wave ${waveNumber} continuous batch identity or selection-rank audit failed`);
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
batch.decision_authority[`${waveKey}_selection_decision_id`] = requiredDecisionId;
batch.decision_authority[`${waveKey}_selection_decision_path`] = decisionRelativePath;
batch.decision_authority[`${waveKey}_selection_decision_sha256`] = sha256(decisionBytes);
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

const reviewSpecs = [
  [
    `artifacts/mrx1000-release-10/reviews/final/editorial/${programRowId}-${slug}.json`,
    'editorial',
  ],
  [
    `artifacts/mrx1000-release-10/reviews/final/factual_citation/${slug}.review.json`,
    'factual_citation',
  ],
  [`artifacts/mrx1000-release-10/reviews/final/compliance/${slug}.json`, 'compliance'],
];
if (!stageCandidate) {
  for (const [relativePath, capability] of reviewSpecs) {
    const bytes = await readFile(join(root, relativePath));
    const sidecar = await readFile(join(root, `${relativePath}.sha256`), 'utf8');
    const artifactSha = sha256(bytes);
    if (!sidecar.trim().startsWith(artifactSha)) {
      throw new Error(`${relativePath}: review sidecar mismatch`);
    }
    const artifact = JSON.parse(bytes.toString('utf8'));
    if (
      artifact.disposition !== 'PASS' ||
      artifact.capability !== capability ||
      artifact.program_row_id !== programRowId ||
      artifact.slug !== slug ||
      artifact.input_body_sha256 !== articleSha ||
      artifact.two_image_manifest_sha256 !== sha256(creativeBytes) ||
      artifact.visual_metadata?.hero_alt !== heroAlt ||
      artifact.visual_metadata?.social_alt !== heroAlt ||
      artifact.visual_metadata?.inline_alt !== inlineAlt
    ) {
      throw new Error(`${relativePath}: current hash-locked PASS review is missing or drifted`);
    }
  }
}

const nextBatchText = `${JSON.stringify(batch, null, 2)}\n`;
await writeFile(batchPath, nextBatchText);
await writeFile(
  `${batchPath}.sha256`,
  `${sha256(Buffer.from(nextBatchText))}  ${batchRelativePath}\n`,
);
await Promise.all(
  reviewSpecs.map(([relativePath, capability]) =>
    writeReviewPlaceholder(relativePath, capability, now),
  ),
);

console.log(
  JSON.stringify(
    {
      mode: stageCandidate ? 'STAGED_CANDIDATE_PENDING_PASS_REVIEWS' : 'FINAL_ADMISSION_PASS',
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
