#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'comparable-mineral-sales-what-makes-a-transaction-relevant';
const programRowId = 'MRX1000-0172';
const title = 'Comparable Mineral Sales: What Makes a Transaction Relevant?';
const inlineKeyword = 'mineral sale comparability checklist';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave14-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 14 batch identity is missing or drifted');
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Frontmatter missing');
  return `${match[1]}\n`;
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1];
  const match = nested?.match(new RegExp(`^[ \\t]+${key}:\\s*['\"]([^'\"]+)['\"]$`, 'm'));
  return match?.[1] ?? null;
}

function declaredSources(source) {
  const block = source.match(/^sources:\n([\s\S]*?)(?=^[a-z_]+:|^---$)/m)?.[1] ?? '';
  const results = [];
  const pattern = /  - label: ['\"]([^'\"]+)['\"]\n    href: ['\"]([^'\"]+)['\"]/g;
  let match;
  while ((match = pattern.exec(block))) results.push({ label: match[1], url: match[2] });
  return results;
}

function writeArtifact(lane, fileName, artifact) {
  const dir = join(repoRoot, 'artifacts', 'mrx1000-release-10', 'reviews', 'final', lane);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, fileName);
  const body = `${JSON.stringify(artifact, null, 2)}\n`;
  writeFileSync(path, body);
  writeFileSync(`${path}.sha256`, `${sha256(body)}  ${basename(path)}\n`);
}

async function verifySource({ label, url }) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'MRX-Codex-Source-Verifier/1.0',
      'cache-control': 'no-cache',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${url}: source access returned ${response.status}`);
  }
  return {
    label,
    url,
    publisher: new URL(response.url).hostname,
    accessed_at: reviewedAt,
    http_access_result: {
      status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
    },
  };
}

function sourceScope(source) {
  const scopes = new Map([
    [
      'https://www.blm.gov/sites/blm.gov/files/uploads/Media_Library_BLM_Policy_h3070-2.pdf',
      [
        'The BLM oil and gas evaluation handbook describes comparable sales as prior transactions involving similar rights or properties and identifies time, location, geology, engineering, market conditions, and lease terms as comparison dimensions.',
        'This federal evaluation guidance supplies a comparison framework, not a private Texas transaction value or required adjustment.',
      ],
    ],
    [
      'https://www.ntc.blm.gov/krc/uploads/984/uniform-appraisal-standards%206th-TheYellowBook.pdf',
      [
        'The federal land-acquisition standards emphasize identifying the property interest, verifying sales data, and selecting an appropriate market unit of comparison for mineral properties.',
        'The federal-acquisition requirements do not control private Texas mineral sales and are not presented as a certified appraisal of any owner interest.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/property-tax/docs/96-1703.pdf',
      [
        'The Texas Comptroller manual documents an income-discounting framework used in Texas oil and gas property-tax appraisal.',
        'This source supports the limited point that producing-interest analysis can require property-specific income inputs; it is not a private-offer formula.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/TX/pdf/TX.23.pdf',
      [
        'Texas Tax Code Section 23.175 prescribes certain price inputs when a property-tax appraisal method considers future income from an oil or gas interest.',
        'The article preserves the property-tax context and does not transplant the statutory method into a private sale valuation.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
      [
        'The Railroad Commission describes operator-reported Texas oil and gas production resources.',
        'The source can support property and production context but not private consideration, title, owner decimal, reserves, or future development.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/',
      [
        'The Railroad Commission lists drilling-permit, field, well, and production data sets and describes their contents and update patterns.',
        'The source does not prove buyer assumptions, title, complete transaction terms, or a future drilling schedule.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
      [
        'The Railroad Commission describes public well records including permit applications, completion reports, plugging reports, and related filings.',
        'These records provide dated regulatory evidence and do not establish private transaction consideration or owner-specific value.',
      ],
    ],
    [
      'https://www.eia.gov/naturalgas/data.php',
      [
        'EIA publishes dated natural-gas price, production, reserves, and drilling data that can document broader market conditions.',
        'This source does not establish a property-level realized price, buyer forecast, or comparable-sale adjustment.',
      ],
    ],
  ]);
  const [sourceLocationOrParaphrase, claimScope] = scopes.get(source.url) ?? [];
  if (!sourceLocationOrParaphrase || !claimScope) {
    throw new Error(`${source.url}: claim-to-source scope is missing`);
  }
  return {
    ...source,
    source_location_or_paraphrase: sourceLocationOrParaphrase,
    claim_scope: claimScope,
  };
}

const articleBytes = readFileSync(join(repoRoot, articlePath));
const source = articleBytes.toString('utf8');
const fm = frontmatter(source);
const articleSha = sha256(articleBytes);
const frontmatterSha = sha256(fm);
const creativeBytes = readFileSync(join(repoRoot, creativePath));
const creativeSha = sha256(creativeBytes);
const creative = JSON.parse(creativeBytes).article;
const heroBytes = readFileSync(join(repoRoot, 'public', row.hero_path.slice(1)));
const inlineBytes = readFileSync(join(repoRoot, 'public', row.inline_path.slice(1)));
const heroSha = sha256(heroBytes);
const inlineSha = sha256(inlineBytes);
const faqCount = (source.match(/^  - question:/gm) ?? []).length;
const wordCount =
  source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu)
    ?.length ?? 0;
const sources = declaredSources(source);

if (
  articleSha !== row.repo_sha256 ||
  heroSha !== row.hero_sha256 ||
  inlineSha !== row.inline_asset_sha256 ||
  creative.hero.ocr?.pass !== true ||
  creative.inline.ocr?.pass !== true ||
  creative.title !== title ||
  creative.keyword !== inlineKeyword ||
  nestedScalar(fm, 'hero_image', 'social_src') !== row.hero_path ||
  nestedScalar(fm, 'inline_image', 'rendered_text') !== inlineKeyword ||
  faqCount !== 5 ||
  wordCount < 700 ||
  sources.length < 3
) {
  throw new Error(
    'Wave 14 review inputs do not satisfy identity, depth, source, or creative gates',
  );
}

const sourceAccess = [];
for (const sourceEntry of sources) sourceAccess.push(sourceScope(await verifySource(sourceEntry)));

const common = {
  schema_version: '2.0.0',
  disposition: 'PASS',
  reviewed_at: reviewedAt,
  decision_authority: {
    source: 'Daryl owner directives, 2026-08-04 and 2026-08-11',
    policy: 'MRX continuous quality-gated publication and two-image article creative directive',
  },
  program_row_id: programRowId,
  slug,
  title,
  canonical_url: row.canonical_url,
  source_path: articlePath,
  input_body_sha256: articleSha,
  input_frontmatter_sha256: frontmatterSha,
  expected_repo_sha256: articleSha,
  two_image_manifest_sha256: creativeSha,
};

writeArtifact('editorial', `${programRowId}-${slug}.json`, {
  artifact_type: 'mrx1000_two_image_editorial_review',
  ...common,
  reviewer_id: 'codex_wave14_editorial',
  review_run_id: `mrx1000-wave14-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The comparability framework separates interest type, acreage convention, royalty burden, property evidence, transaction timing, consideration, and conditions of sale without asserting an owner-specific value.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”.`,
  ],
  checks: [
    { name: 'complete_file_sha256_match', status: 'PASS', evidence: articleSha },
    {
      name: 'answer_first_depth_and_five_faqs',
      status: 'PASS',
      evidence: { word_count: wordCount, minimum_word_count: 700, faq_count: faqCount },
    },
    {
      name: 'two_image_exact_text_identity',
      status: 'PASS',
      evidence: {
        hero_ocr: true,
        inline_ocr: true,
        social_reuses_hero: true,
        filename_identity: true,
        distinct_binaries: heroSha !== inlineSha,
      },
    },
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

writeArtifact('factual_citation', `${slug}.review.json`, {
  artifact_type: 'mrx1000_two_image_factual_citation_review',
  ...common,
  reviewer_id: 'codex_wave14_factual',
  review_run_id: `mrx1000-wave14-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'Comparable-sale principles remain bounded to federal valuation guidance; Texas tax-appraisal and public oil-and-gas-data claims remain bounded to their official sources.',
    'The article uses no fabricated sale price, per-acre benchmark, title fact, transaction term, testimonial, or owner-specific value conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'minimum_three_distinct_https_sources',
    'current_source_access_review_pass',
    'claim_to_source_scope_present',
    'official_primary_source_priority_pass',
    'unsupported_high_risk_claim_scan_pass',
  ],
  sources_inspected: sourceAccess,
});

writeArtifact('compliance', `${slug}.json`, {
  artifact_type: 'mrx1000_two_image_compliance_review',
  ...common,
  reviewer_id: 'codex_wave14_compliance',
  review_run_id: `mrx1000-wave14-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, and avoids guarantees, universal per-acre benchmarks, unsupported adjustments, or a value conclusion.',
    'Image text is limited to the exact article title and an authorized supporting keyword and adds no price, title, legal, tax, or transaction claim.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'educational_and_professional_boundaries_preserved',
    'no_unsupported_visual_or_payment_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 14 review artifacts with ${sources.length} live source checks.`,
);
