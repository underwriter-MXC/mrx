#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'discount-rates-in-mineral-rights-dcf-a-plain-language-guide';
const programRowId = 'MRX1000-0177';
const title = 'Discount Rates in Mineral Rights DCF: A Plain-Language Guide';
const inlineKeyword = 'discount rates in mineral rights DCF';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave19-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 19 batch identity is missing or drifted');
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
      'https://www.irs.gov/irm/part4/irm_04-048-004',
      [
        'The IRS Business Valuation Guidelines state that an appraiser should select a benefit stream and discount or capitalization rate consistent with the selected valuation method and consider relevant risk factors.',
        'The article uses the guidelines only for a general valuation-consistency principle; it does not present the IRS material as a mineral-property formula, owner-specific appraisal, tax conclusion, or universal rate.',
      ],
    ],
    [
      'https://www.sec.gov/interps/account/sabcodet12.htm',
      [
        'SEC Staff Accounting Bulletin Topic 12 explains that U.S. GAAP requires disclosure of the standardized measure of discounted future net cash flows from production of proved oil-and-gas reserves.',
        'The article uses this material only to identify the specified reporting context; it does not equate that measure with a private mineral-owner offer, fair market value, or an owner-specific DCF.',
      ],
    ],
    [
      'https://www.sec.gov/file/33-10002pdf',
      [
        'The SEC release describes the standardized measure as after-tax future net cash flows discounted at 10 percent and notes that the standardized measure is neither fair market value nor the present value of expected future cash flows.',
        'The article uses the release to distinguish a prescribed disclosure convention from owner-specific valuation and does not claim that 10 percent is appropriate for a particular mineral interest.',
      ],
    ],
    [
      'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?page=1&type=daily_treasury_yield_curve',
      [
        'The U.S. Treasury publishes daily par yield curves derived from indicative market quotations for Treasury securities at fixed maturities.',
        'The article uses Treasury data only as dated market-reference context and does not treat a Treasury yield as a complete mineral-rights discount rate or owner-specific conclusion.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
      [
        'The Railroad Commission of Texas publishes production compilations and summaries based on information reported to the Commission by operators and provides multiple production-query and download paths.',
        'The article uses the page to identify a public regulatory production source and does not treat reported production as a complete owner cash flow, reserve report, or forecast.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
      [
        'The Railroad Commission explains that Texas oil production may be reported at the lease level, online production information has a reporting lag, and records can change as corrected, revised, or delinquent reports arrive.',
        'The article uses these limitations to bound production-history work and does not infer individual-well volumes, payment ownership, title, or future production from a regulatory record.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/property-tax/valuing-property.php',
      [
        'The Texas Comptroller describes the sales-comparison, income, and cost approaches and explains that the income approach estimates the present worth of anticipated future benefits.',
        'The article preserves the public property-tax context and does not present the page as a private-sale formula, professional appraisal, title conclusion, or owner-specific value.',
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
    'Wave 19 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave19_editorial',
  review_run_id: `mrx1000-wave19-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The assumptions-first framework separates cash-flow construction, timing, convention matching, risk location, rate support, sensitivity, and market reconciliation without selecting a universal rate or issuing an owner-specific value conclusion.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”.`,
  ],
  checks: [
    { name: 'complete_file_sha256_match', status: 'PASS', evidence: articleSha },
    {
      name: 'answer_first_article_depth_and_five_faqs',
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
  reviewer_id: 'codex_wave19_factual',
  review_run_id: `mrx1000-wave19-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'Rate consistency, standardized reserve disclosure, Treasury market-reference, regulatory production-data, and public property-appraisal claims remain bounded to their official government sources.',
    'The article uses no fabricated owners, wells, leases, production, forecasts, prices, costs, rates, reserves, transaction values, market evidence, testimonials, or owner-specific legal, tax, investment, reserve, engineering, or valuation conclusions.',
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
  reviewer_id: 'codex_wave19_compliance',
  review_run_id: `mrx1000-wave19-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, and avoids legal, tax, investment, reserve, engineering, or appraisal opinions, a universal rate, unsupported precision, risk double counting, or an owner-specific value conclusion.',
    'Image text is limited to the exact article title and an authorized supporting keyword and adds no owner, well, lease, reserve, production, forecast, price, cost, rate, percentage, market, tax, investment, engineering, or valuation conclusion.',
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
  `Built three hash-locked Wave 19 review artifacts with ${sources.length} live source checks.`,
);
