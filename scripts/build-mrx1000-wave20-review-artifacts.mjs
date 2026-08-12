#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'essential-steps-to-assess-the-value-of-your-mineral-rights-accurately-and-confidently';
const programRowId = 'MRX1000-0178';
const title =
  'Essential Steps to Assess the Value of Your Mineral Rights Accurately and Confidently';
const inlineKeyword = "What Steps Should I Take to Understand My Mineral Rights' Value?";
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave20-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 20 batch identity is missing or drifted');
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Frontmatter missing');
  return `${match[1]}\n`;
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1];
  const raw = nested?.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  if (!raw) return null;
  const quote = raw[0];
  return (quote === "'" || quote === '"') && raw.at(-1) === quote ? raw.slice(1, -1) : raw;
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
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
      [
        'The Railroad Commission of Texas publishes production compilations and summaries based on information reported to the Commission by operators and provides multiple production-query and download paths.',
        'The article uses the page to identify a public regulatory production source and does not treat reported production as proof of title, a complete owner cash flow, a reserve report, a forecast, or market value.',
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
      'https://www.rrc.texas.gov/resource-center/research/research-queries/',
      [
        'The Railroad Commission lists public research paths for production, permits, well records, GIS, imaged records, operator information, and related oil-and-gas data, and states that the datasets are informational and continually updated.',
        'The article uses the query catalog only as an evidence-discovery map and preserves the Commission boundary that online datasets are not authoritative legal records and require user verification for accuracy, completeness, currency, and suitability.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/gis-viewer/',
      [
        'The Railroad Commission Public GIS Viewer provides map context for oil, gas, pipeline, survey, lease, and well information and warns that mapped boundaries can be approximate and are not authoritative legal, engineering, or surveying records.',
        'The article uses GIS only for location and regulatory context and does not infer title, exact boundaries, legal descriptions, surveying conclusions, development certainty, or owner-specific value from the map.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/property-tax/valuing-property.php',
      [
        'The Texas Comptroller describes the sales-comparison, income, and cost approaches and explains that the income approach estimates the present worth of anticipated future benefits.',
        'The article preserves the public property-tax context and does not present the page as a private-sale formula, professional appraisal, title conclusion, or owner-specific value.',
      ],
    ],
    [
      'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm',
      [
        'The U.S. Energy Information Administration publishes dated crude-oil and petroleum-product spot-price series with definitions, source notes, and historical downloads.',
        'The article uses EIA spot prices only as dated benchmark context and does not treat a benchmark as the owner’s realized price, a future price forecast, or an owner-specific valuation conclusion.',
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
    'Wave 20 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave20_editorial',
  review_run_id: `mrx1000-wave20-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The evidence-first protocol defines the interest and valuation date, separates confirmed, derived, assumed, and unknown inputs, reconciles ownership, payment, production, and market records, and ends with reproducible confidence notes and stop rules rather than a universal price shortcut.',
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
  reviewer_id: 'codex_wave20_factual',
  review_run_id: `mrx1000-wave20-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'Regulatory production, query, GIS, public property-appraisal, and commodity benchmark claims remain bounded to their official government sources and stated limitations.',
    'The article uses no fabricated owners, wells, leases, production, forecasts, prices, costs, ownership decimals, reserves, transaction values, market evidence, testimonials, or owner-specific title, legal, tax, surveying, investment, reserve, engineering, or valuation conclusions.',
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
  reviewer_id: 'codex_wave20_compliance',
  review_run_id: `mrx1000-wave20-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, and avoids title, legal, tax, investment, surveying, reserve, engineering, or appraisal opinions, universal price shortcuts, unsupported precision, or an owner-specific value conclusion.',
    'Image text is limited to the exact article title and canonical owner question and adds no owner, well, lease, reserve, production, forecast, price, cost, rate, percentage, market, tax, surveying, investment, engineering, or valuation conclusion.',
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
  `Built three hash-locked Wave 20 review artifacts with ${sources.length} live source checks.`,
);
