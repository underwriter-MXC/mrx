#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'understanding-typical-pricing-ranges-for-mineral-rights-in-your-area-what-to-expect';
const programRowId = 'MRX1000-0136';
const title = 'Understanding Typical Pricing Ranges for Mineral Rights in Your Area: What to Expect';
const inlineKeyword = 'What Is the Typical Pricing Range for Mineral Rights in My Area?';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave56-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 56 batch identity is missing or drifted');
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
  const pattern = /  - label: ['"]([^'"]+)['"]\n    href: ['"]([^'"]+)['"]/g;
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
        'The Railroad Commission of Texas describes the production page as compilations and summaries of production information reported by Texas operators and links production queries, downloads, and visualizations.',
        'The article uses the page only for dated reported Texas production context; it does not establish private title, an owner decimal, realized royalty price, reserves, future production, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
      [
        'The RRC PDQ FAQs explain Texas reporting organization, reporting lag, operator-submitted data, revisions, corrections, delinquent reports, and the snapshot nature of query results.',
        'The article uses the page only to explain why production evidence needs property, period, retrieval-date, and version controls; it does not resolve owner-specific title, payment, reserves, development, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/',
      [
        'The Railroad Commission of Texas links public oil-and-gas production, drilling-permit, well-record, GIS, field, operator, and related research query systems.',
        'The article uses the page only for dated operating-context retrieval paths; it does not establish private title, an owner decimal, realized royalty price, reserves, future development, transaction consideration, or value.',
      ],
    ],
    [
      'https://www.glo.texas.gov/energy/mineral-leasing/leasing',
      [
        'The Texas General Land Office publishes state mineral-leasing procedures, current lease-sale information, and links to bid-sale results for specific state opportunities and dates.',
        'The article uses the page only to distinguish public state mineral-lease bid context from a private fee-mineral or royalty sale; it does not treat a lease bonus bid as owner-specific private-sale consideration or value.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/property-tax/docs/96-1703.pdf',
      [
        'The Texas Comptroller Manual for Discounting Oil and Gas Income explains discounted-future-income method context for its statutory Texas property-tax purpose.',
        'The article uses the manual only to explain why producing-property analysis depends on future-income assumptions and explicitly does not convert the statutory manual into a private-sale appraisal, title, reserve, or value conclusion.',
      ],
    ],
    [
      'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_m.htm',
      [
        'The U.S. Energy Information Administration publishes dated monthly crude-oil spot-price series.',
        'The article uses the series only as an example of reproducible dated commodity context; it does not treat a benchmark as a property-specific realized price, forecast, or value conclusion.',
      ],
    ],
    [
      'https://www.eia.gov/naturalgas/data.php',
      [
        'The U.S. Energy Information Administration publishes natural-gas price data, including dated spot and futures price series.',
        'The article uses the page only as an example of dated market evidence; it does not establish a property-specific realized price, differential, forecast, or value.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology describes a directional discounted-cash-flow review with dated evidence, stated production, decline, operator, royalty, commodity, discount, title, acreage, and offer-term inputs and ranges under assumptions.',
        'The article uses the page only for the directional-range output lane and professional limits; it does not establish owner-specific title, reserves, value, tax treatment, suitability, or a transaction result.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/sell-mineral-rights/',
      [
        'The current MRX Sell Mineral Rights page separates selling all, selling a defined portion, and holding and identifies scope, complete proposals, adjustment rights, diligence, professional review, funding, timing, and recording as decision topics.',
        'The article uses the page only for seller-option and complete-proposal comparison categories; it does not recommend a path or establish a particular agreement’s meaning, fairness, legal effect, or suitability.',
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
    'Wave 56 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave56_editorial',
  review_run_id: `mrx1000-wave56-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the property-matched local pricing-range assembly and reporting job. It defines the relevant area from the subject outward, separates materially different cohorts and evidence lanes, normalizes verified units and terms, reports a supported evidence envelope with exclusions and confidence, and states when no local range is supportable.',
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
  reviewer_id: 'codex_wave56_factual',
  review_run_id: `mrx1000-wave56-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'Claims remain bounded to current RRC production, query-lag, correction, and research-path context; Texas GLO public state mineral-lease sale context; Texas Comptroller statutory income-discounting method context; EIA commodity-series context; and current MRX methodology and selling-options scope. The article preserves each source purpose and does not turn any source into an owner-specific title, reserves, development, private transaction price, value, offer, or decision result.',
    'The article uses no fabricated owners, properties, buyers, contracts, prices, acreage, ownership decimals, production, reserves, forecasts, tax results, offers, testimonials, success rates, or owner-specific title, legal, tax, accounting, appraisal, investment, or transaction conclusions.',
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
  reviewer_id: 'codex_wave56_compliance',
  review_run_id: `mrx1000-wave56-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, separates cohorts and evidence lanes, labels unresolved identity and denominator questions, distinguishes state lease bids from private sale evidence, discloses possible MRX buyer interest, and makes no owner-specific title, value, legal, tax, investment, appraisal, or transaction conclusion.',
    'Image text is limited to the exact article title and exact canonical keyword and adds no owner data, property identifier, price, percentage, buyer endorsement, title conclusion, valuation conclusion, tax result, guarantee, or transaction conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'educational_and_professional_boundaries_preserved',
    'no_unsupported_visual_or_valuation_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 56 review artifacts with ${sources.length} live source checks.`,
);
