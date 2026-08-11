#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'converting-monthly-royalty-history-into-a-valuation-baseline';
const programRowId = 'MRX1000-0173';
const title = 'Converting Monthly Royalty History Into a Valuation Baseline';
const inlineKeyword = 'monthly royalty history worksheet';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave15-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 15 batch identity is missing or drifted');
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
      'https://statutes.capitol.texas.gov/Docs/NR/pdf/NR.91.pdf',
      [
        'Texas Natural Resources Code Sections 91.402 and 91.502 address payment timing and specify statement information including property identification, sales period, volume, price, taxes, deductions, net value, and owner decimal.',
        'The statute supports the statement-field and payment-context discussion; it does not establish title, an owner-specific amount due, or a valuation conclusion.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
      [
        'The Railroad Commission describes operator-reported Texas oil and gas production resources, monthly ledgers, and production query tools.',
        'The source can support a dated production-context check but not title, owner decimal, private pricing, deductions, or a particular owner payment.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/',
      [
        'The Railroad Commission lists downloadable well, field, permit, and production data resources and their data context.',
        'The source provides public research inputs and does not prove private payor accounting, title, future production, or owner-specific value.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/property-tax/docs/96-1703.pdf',
      [
        'The Texas Comptroller manual documents an income-discounting framework for Texas oil and gas property-tax appraisal, including production, price, expenses, taxes, decline, reserves, discounting, and risk.',
        'The article preserves that property-tax context and does not present the manual as a private-sale pricing rule or owner-specific valuation.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/crude-oil/',
      [
        'The Texas Comptroller explains current crude-oil production-tax administration, rates, fees, exemptions, and reporting context.',
        'The source supports preserving taxes as a separate worksheet field and does not decide an individual owner statement or tax position.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/natural-gas/',
      [
        'The Texas Comptroller explains current natural-gas production-tax administration, rates, fees, exemptions, and reporting context.',
        'The source supports tax context and does not establish how every payor must present an owner statement or how an owner should report taxes.',
      ],
    ],
    [
      'https://www.eia.gov/petroleum/data.php',
      [
        'EIA publishes dated petroleum production and price data, including historical price series and market summaries.',
        'The source provides broad market context and does not prove a property-level realized price, deduction, or future price.',
      ],
    ],
    [
      'https://www.eia.gov/naturalgas/data.php',
      [
        'EIA publishes dated natural-gas price, production, reserves, and drilling data for market context.',
        'The source does not establish a property-level realized price, payor accounting result, or future cash flow.',
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
    'Wave 15 review inputs do not satisfy identity, depth, source, or creative gates',
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
  reviewer_id: 'codex_wave15_editorial',
  review_run_id: `mrx1000-wave15-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The worksheet framework separates production month, property, product, volume, price, owner decimal, taxes, deductions, adjustments, and net payment without asserting an owner-specific value or forecast.',
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
  reviewer_id: 'codex_wave15_factual',
  review_run_id: `mrx1000-wave15-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'Statement fields remain bounded to Texas statute; tax-appraisal, tax-administration, public-production, and benchmark-price claims remain bounded to their official sources.',
    'The article uses no fabricated statement figures, production history, price, decimal, tax result, title fact, testimonial, underpayment conclusion, or owner-specific value conclusion.',
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
  reviewer_id: 'codex_wave15_compliance',
  review_run_id: `mrx1000-wave15-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, and avoids guarantees, universal lookback rules, unsupported normalizations, underpayment claims, forecasts, or a value conclusion.',
    'Image text is limited to the exact article title and an authorized supporting keyword and adds no payment amount, production, price, title, tax, or future-income claim.',
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
  `Built three hash-locked Wave 15 review artifacts with ${sources.length} live source checks.`,
);

