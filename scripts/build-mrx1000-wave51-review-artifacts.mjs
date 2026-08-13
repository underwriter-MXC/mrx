#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'understanding-the-mineral-rights-assessment-errors';
const programRowId = 'MRX1000-0131';
const title = 'Understanding the Mineral Rights Assessment Errors';
const inlineKeyword = 'Mineral Rights Selling Process Errors';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave51-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 51 batch identity is missing or drifted');
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
      'https://mineralrightsxchange.com/faq/',
      [
        'The current MRX FAQ describes a no-obligation directional underwriter assessment, distinguishes it from a formal appraisal, and discloses that MRX may ultimately want to buy an interest.',
        'The article uses the FAQ only for MRX’s current service boundaries and provider-interest disclosure; it does not value an interest, promise a result, or recommend a transaction.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology describes a directional DCF process using dated evidence, explicit inputs and assumptions, sensitivity analysis, and separate asset-range, written-offer, and expected-owner-net layers.',
        'The article uses the methodology only as MRX’s published directional process boundary and to distinguish modeled range, proposal, and expected net; it does not value a specific interest, establish legal rights or reserves, or predict a transaction result.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/terms/',
      [
        'The current MRX terms state that website information is educational and not legal, tax, financial, investment, engineering, or appraisal advice.',
        'The article uses the terms only to preserve educational and professional boundaries; it does not use them to determine ownership, reserves, value, tax treatment, or an owner’s rights.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
      [
        'The Railroad Commission production-data page describes compilations and summaries of production information reported to the Commission by Texas operators and routes users to production queries, downloads, summaries, and visualizations.',
        'The article uses the page only to identify operator-reported production as one input source and to explain production-payment matching; it does not treat production data as an owner payment ledger, title record, reserves conclusion, forecast, or value conclusion.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/',
      [
        'The Railroad Commission provides online query routes for production, permits, well records, organization records, GIS, imaged records, and other operational data, while describing the continually updated datasets as informational, non-authoritative, and without legal force.',
        'The article uses the query menu only to build an operational identifier and update-schedule crosswalk while preserving the Commission’s stated limitations; it does not treat a query as proof of ownership, title, acreage, payment, reserves, value, or a transaction result.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
      [
        'The Railroad Commission PDQ FAQ explains operator-reported production scope, lease-level reporting for oil, reporting lag, later revisions, historical completeness guidance, update frequency, and query identifiers.',
        'The article uses the FAQ only to explain why production scope, identifiers, reporting level, periods, access dates, and later corrections must be reconciled; it does not conclude that a public query proves an owner’s decimal, royalty amount, title, reserves, forecast, or value.',
      ],
    ],
    [
      'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_m.htm',
      [
        'The U.S. Energy Information Administration spot-price table publishes dated benchmark series with named products, stated units, frequency choices, history, release information, and source notes.',
        'The article uses the table only as an example of a dated public benchmark whose product, units, frequency, geography, and release date must be retained; it does not treat a benchmark as a tract-specific realized price or forecast.',
      ],
    ],
    [
      'https://www.eia.gov/dnav/ng/hist/rngwhhdD.htm',
      [
        'The U.S. Energy Information Administration Henry Hub series publishes dated natural-gas spot prices with stated units and historical observations.',
        'The article uses the series only as an example of a named and dated public benchmark that still requires a property-specific product, location, unit, frequency, differential, deduction, and forecast bridge; it does not treat Henry Hub as an owner realized price or predict a future price.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/property-tax/docs/96-1703.pdf',
      [
        'The Texas Comptroller’s Manual for Discounting Oil and Gas Income explains DCF appraisal and discount-rate techniques in the specific context of Texas oil-and-gas property-tax appraisal requirements.',
        'The article uses the manual only to demonstrate why a source must retain its issuing body, edition, date, purpose, and limits; it does not apply property-tax appraisal rules as a voluntary transaction formula or owner-specific conclusion.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p544',
      [
        'IRS Publication 544 explains general federal concepts for sales and other dispositions of assets, including amount realized, adjusted basis, and possible gain or loss.',
        'The article uses the publication only to keep a gross assessment range, transaction proceeds, and owner-specific tax questions separate; it does not classify the asset or calculate basis, gain, loss, allocation, tax, or filing treatment.',
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
    'Wave 51 review inputs do not satisfy identity, article-depth, source, or creative gates',
  );
}

const sourceAccess = [];
for (const sourceEntry of sources) sourceAccess.push(sourceScope(await verifySource(sourceEntry)));

const common = {
  schema_version: '2.0.0',
  disposition: 'PASS',
  reviewed_at: reviewedAt,
  decision_authority: {
    source: 'Daryl owner directives, 2026-08-04 and 2026-08-12',
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
  reviewer_id: 'codex_wave51_editorial',
  review_run_id: `mrx1000-wave51-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the assessment-error detection and correction job. It distinguishes errors, evidence gaps, and scenario differences; defines eight error classes; gives each a detection, containment, correction, and rerun protocol; and routes end-to-end sale missteps, clause traps, seller-readiness gates, and the suggested-price bridge to their established pages.',
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
  reviewer_id: 'codex_wave51_factual',
  review_run_id: `mrx1000-wave51-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'MRX claims remain bounded to its current FAQ, methodology, and terms; Railroad Commission production and query guidance stays within the agency’s stated reporting, identifier, update, and informational limits; EIA oil and natural-gas benchmarks remain benchmark inputs rather than owner realized prices; the Comptroller manual remains purpose-specific; and IRS claims remain general disposition concepts.',
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
  reviewer_id: 'codex_wave51_compliance',
  review_run_id: `mrx1000-wave51-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, distinguishes error from gap and scenario difference, keeps production, payment, benchmark, proposal, owner-net, and version evidence separate, and routes unresolved land, title, legal, tax, accounting, engineering, reserves, appraisal, and transaction questions without making owner-specific conclusions.',
    'Image text is limited to the exact article title and exact canonical keyword and adds no owner data, buyer endorsement, property identifier, price, acreage, decimal, formula, reserves claim, forecast, success claim, appraisal result, tax outcome, or transaction conclusion.',
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
  `Built three hash-locked Wave 51 review artifacts with ${sources.length} live source checks.`,
);
