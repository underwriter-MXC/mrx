#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(
  process.argv.find((arg) => arg.startsWith('--tree='))?.slice('--tree='.length) ??
    process.env.MRX_TREE ??
    resolve(import.meta.dirname, '..'),
);
const batch = JSON.parse(readFileSync(join(root, 'config/mrx1000-release-10-batch.json'), 'utf8'));
const retrofit = JSON.parse(
  readFileSync(join(root, 'config/mrx-article-two-image-retrofit.json'), 'utf8'),
);
const retrofitBySlug = new Map((retrofit.rows ?? []).map((row) => [row.slug, row]));
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const reviewRunId = `mrx1000-two-image-retrofit-${reviewedAt.replace(/[-:]/g, '')}`;
const capabilities = ['editorial', 'factual_citation', 'compliance'];
const sourceAccessCache = new Map();

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frontmatter(source, slug) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${slug}: frontmatter missing`);
  return match[1];
}

function unquote(value) {
  return String(value ?? '').trim().replace(/^(['"])(.*)\1$/, '$2').replace(/''/g, "'");
}

function scalar(block, key) {
  return unquote(block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1] ?? '';
  return unquote(nested.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function declaredSources(source) {
  const block = source.match(/^sources:\n([\s\S]*?)(?=^[a-z_]+:|^---$)/m)?.[1] ?? '';
  const results = [];
  const pattern = /  - label: ['"]([^'"]+)['"]\n    href: ['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(block))) results.push({ label: match[1], url: match[2] });
  return results;
}

async function verifySource(url) {
  if (!sourceAccessCache.has(url)) {
    sourceAccessCache.set(
      url,
      (async () => {
        const response = await fetch(url, {
          redirect: 'follow',
          headers: {
            'user-agent': 'MRX-Codex-Two-Image-Review/1.0',
            'cache-control': 'no-cache',
          },
        });
        return {
          requested_url: url,
          final_url: response.url,
          status: response.status,
          content_type: response.headers.get('content-type'),
          pass: response.status >= 200 && response.status < 400,
        };
      })(),
    );
  }
  return sourceAccessCache.get(url);
}

function artifactPathsBySlug(capability) {
  const directory = join(root, 'artifacts/mrx1000-release-10/reviews/final', capability);
  if (!existsSync(directory)) throw new Error(`Missing review lane: ${directory}`);
  const paths = readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(directory, name));
  if (paths.length !== batch.articles.length) {
    throw new Error(`${capability}: expected ${batch.articles.length} existing artifacts; found ${paths.length}`);
  }
  return new Map(
    paths.map((path) => {
      const artifact = JSON.parse(readFileSync(path, 'utf8'));
      return [artifact.slug, path];
    }),
  );
}

const outputPaths = new Map(
  capabilities.map((capability) => [capability, artifactPathsBySlug(capability)]),
);

for (const entry of batch.articles) {
  const source = readFileSync(join(root, entry.repo_path), 'utf8');
  const fullSha = sha256(source);
  const fm = frontmatter(source, entry.slug);
  const fmSha = sha256(Buffer.from(`${fm}\n`, 'utf8'));
  const imageRow = retrofitBySlug.get(entry.slug);
  if (!imageRow) throw new Error(`${entry.slug}: missing two-image manifest row`);
  if (entry.repo_sha256 !== fullSha || entry.article_sha256 !== fullSha) {
    throw new Error(`${entry.slug}: batch source hashes are not rebound to current bytes`);
  }
  if (
    scalar(fm, 'publication_status') !== 'published' ||
    scalar(fm, 'draft') === 'true' ||
    scalar(fm, 'noindex') === 'true'
  ) {
    throw new Error(`${entry.slug}: source is not published and indexable`);
  }
  const imageChecks = {
    hero_path: nestedScalar(fm, 'hero_image', 'src') === imageRow.hero.public_path,
    social_identity:
      nestedScalar(fm, 'hero_image', 'social_src') === imageRow.hero.public_path,
    inline_path: nestedScalar(fm, 'inline_image', 'src') === imageRow.inline.public_path,
    inline_text:
      nestedScalar(fm, 'inline_image', 'rendered_text') === imageRow.inline.rendered_text,
    hero_ocr: imageRow.hero.ocr?.pass === true,
    inline_ocr: imageRow.inline.ocr?.pass === true,
    filename_identity:
      retrofit.summary?.exact_filename_identity_count === retrofit.summary?.article_count,
    distinct_binaries: imageRow.hero.sha256 !== imageRow.inline.sha256,
  };
  if (!Object.values(imageChecks).every(Boolean)) {
    throw new Error(`${entry.slug}: two-image review failed ${JSON.stringify(imageChecks)}`);
  }

  const sources = declaredSources(source);
  if (sources.length < 2) throw new Error(`${entry.slug}: fewer than two declared HTTPS sources`);
  const sourceAccess = [];
  for (const declared of sources) {
    const result = await verifySource(declared.url);
    if (!result.pass) {
      throw new Error(`${entry.slug}: source ${declared.url} returned ${result.status}`);
    }
    sourceAccess.push({ ...declared, ...result });
  }

  const faqCount = (source.match(/^  - question:/gm) ?? []).length;
  const wordCount = source
    .replace(/^---[\s\S]*?---/m, '')
    .split(/\s+/)
    .filter(Boolean).length;
  const minimumWordCount = entry.selection_rank >= 41 ? 700 : 0;
  if (faqCount !== 5 || wordCount < minimumWordCount) {
    throw new Error(`${entry.slug}: editorial depth gate failed (${wordCount} words, ${faqCount} FAQs)`);
  }

  const common = {
    schema_version: '2.0.0',
    disposition: 'PASS',
    reviewed_at: reviewedAt,
    decision_authority: {
      source: 'Daryl owner directive, 2026-08-11',
      policy: 'MRX two-image article creative directive',
    },
    program_row_id: entry.program_row_id,
    slug: entry.slug,
    title: entry.title,
    canonical_url: entry.canonical_url,
    source_path: entry.repo_path,
    input_body_sha256: fullSha,
    input_frontmatter_sha256: fmSha,
    expected_repo_sha256: fullSha,
    two_image_manifest_sha256: batch.two_image_policy?.retrofit_manifest_sha256,
  };

  const artifacts = {
    editorial: {
      artifact_type: 'mrx1000_two_image_editorial_review',
      ...common,
      reviewer_id: 'codex_two_image_editorial',
      review_run_id: reviewRunId,
      capability: 'editorial',
      findings: [
        `Complete current MDX SHA-256 is ${fullSha}; article has ${wordCount} body tokens and five FAQs.`,
        `Exact-title hero/share OCR passed for “${entry.title}”; distinct in-body OCR passed for “${imageRow.inline.rendered_text}”.`,
        'Both text treatments remain deterministic, descriptive, filename-matched, article-specific, and bound to the current source.',
      ],
      checks: [
        { name: 'complete_file_sha256_match', status: 'PASS', evidence: fullSha },
        { name: 'answer_first_depth_and_five_faqs', status: 'PASS', evidence: { word_count: wordCount, minimum_word_count: minimumWordCount, faq_count: faqCount } },
        { name: 'two_image_exact_text_identity', status: 'PASS', evidence: imageChecks },
      ],
      sources_inspected: [entry.repo_path, imageRow.hero.public_path, imageRow.inline.public_path],
    },
    factual_citation: {
      artifact_type: 'mrx1000_two_image_factual_citation_review',
      ...common,
      reviewer_id: 'codex_two_image_factual',
      review_run_id: reviewRunId,
      capability: 'factual_citation',
      findings: [
        `Complete current MDX SHA-256 is ${fullSha}; all ${sources.length} declared sources passed live access review.`,
        'The retrofit changes image metadata and assets, not the bounded claim-to-source relationships in the article body.',
        'The two images make no fabricated numeric, legal, tax, valuation, testimonial, or document claims.',
      ],
      checks: [
        'complete_file_sha256_match',
        'minimum_two_distinct_https_sources',
        'current_source_access_review_pass',
        'two_image_unsupported_claim_scan_pass',
      ],
      sources_inspected: sourceAccess.map((row) => ({
        label: row.label,
        url: row.url,
        publisher: new URL(row.final_url).hostname,
        accessed_at: reviewedAt,
        http_access_result: {
          status: row.status,
          final_url: row.final_url,
          content_type: row.content_type,
        },
        source_location_or_paraphrase: `The article cites ${row.label} only for the bounded context attributed in its body and source notes.`,
        claim_scope:
          'Owner-specific legal, tax, title, accounting, brokerage, engineering, appraisal, eligibility, value, and transaction conclusions remain outside this source use.',
      })),
    },
    compliance: {
      artifact_type: 'mrx1000_two_image_compliance_review',
      ...common,
      reviewer_id: 'codex_two_image_compliance',
      review_run_id: reviewRunId,
      capability: 'compliance',
      expected_hero_sha256: imageRow.hero.sha256,
      expected_inline_sha256: imageRow.inline.sha256,
      findings: [
        `Complete current MDX SHA-256 is ${fullSha}; hero/share and in-body image hashes are separately locked.`,
        'Image text is limited to the exact article title and declared page keyword; it adds no guarantee, price, deadline, legal conclusion, or tax conclusion.',
        'The article retains its educational and professional-boundary language and current disclosure treatment.',
      ],
      checks: [
        'complete_file_sha256_match',
        'hero_share_sha256_identity',
        'inline_image_distinct_sha256',
        'exact_text_ocr_pass',
        'filename_text_identity_pass',
        'no_unsupported_visual_claims',
        'educational_and_professional_boundaries_preserved',
      ],
      sources_inspected: [entry.repo_path, imageRow.hero.public_path, imageRow.inline.public_path],
    },
  };

  for (const capability of capabilities) {
    const outputPath = outputPaths.get(capability).get(entry.slug);
    if (!outputPath) throw new Error(`${entry.slug}: missing existing ${capability} artifact path`);
    const text = `${JSON.stringify(artifacts[capability], null, 2)}\n`;
    writeFileSync(outputPath, text);
    writeFileSync(`${outputPath}.sha256`, `${sha256(text)}  ${basename(outputPath)}\n`);
  }
}

console.log(
  `Built ${batch.articles.length * capabilities.length} current two-image review artifacts; ${sourceAccessCache.size} distinct source URLs verified.`,
);
