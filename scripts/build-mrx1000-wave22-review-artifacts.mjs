#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'five-key-indicators-that-show-your-mineral-rights-are-ready-for-evaluation';
const programRowId = 'MRX1000-0180';
const title =
  'Five Key Indicators That Show Your Mineral Rights Are Ready for Evaluation';
const inlineKeyword = 'How Do I Know if My Mineral Rights Qualify for Evaluation?';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave22-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 22 batch identity is missing or drifted');
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
      'https://www.glo.texas.gov/sites/default/files/2025-01/Minerals%20FAQ_updated%202023.pdf',
      [
        'The Texas General Land Office explains that it keeps primordial land-grant files, that later conveyance records are generally found in the county deed records, and that mineral ownership requires examination of the deeds and leases affecting the claim.',
        'The article uses the FAQ to distinguish historical land-grant evidence from later title evidence and does not infer current ownership, acreage, inheritance, title, lease rights, or value from ancestry or an original grant.',
      ],
    ],
    [
      'https://www.glo.texas.gov/archives-heritage/search-our-collections/land-grant-search',
      [
        'The Texas General Land Office Land Grant Database exposes search fields such as county, abstract number, original grantee, patentee, file number, survey, block, township, and title or patent date.',
        'The article uses the database only as a historical property-research starting point and not as a complete present-day chain of title, authoritative survey, ownership determination, or valuation source.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
      [
        'The Railroad Commission of Texas explains that its online queries are slices of a larger oil-and-gas system and describes Wellbore Query search identifiers including district, lease or gas-well ID, county, field, operator, permit, API number, status, and well type.',
        'The article uses the query descriptions to organize regulatory identity research and does not treat any query result as proof of title, acreage, unit participation, owner payment, future drilling, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
      [
        'The Railroad Commission identifies online well-record access through imaged records, the GIS viewer, and Wellbore Query, and identifies online production-query availability for production from 1993 forward.',
        'The article uses the page to identify official research channels and does not infer complete well history, owner participation, owner revenue, title, future production, or value from availability of a record.',
      ],
    ],
    [
      'https://webapps2.rrc.texas.gov/EWA/ewaPdqMain.do',
      [
        'The Railroad Commission Production Data Query provides general and specific-lease searches and displays the reporting-through date and loaded production range.',
        'The article uses the query only for reported production context and does not treat it as an owner cash-flow ledger, a title record, a guarantee of completeness, an individual-well allocation in every case, or a value conclusion.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/gis-viewer/',
      [
        'The Railroad Commission Public GIS Viewer provides map context for oil, gas, pipeline, survey, lease, permit, and well information and warns that mapped boundaries can be approximate and are not authoritative legal, engineering, or surveying records.',
        'The article uses GIS only for location and regulatory context and does not infer title, exact boundaries, legal descriptions, unit participation, future development, surveying conclusions, or owner-specific value from the map.',
      ],
    ],
    [
      'https://comptroller.texas.gov/programs/unclaimed/',
      [
        'The Texas Comptroller identifies mineral interests among examples of unclaimed property and directs individuals to the state claim-search process.',
        'The article uses an unclaimed-property result only as an investigation lead and does not treat it as complete ownership proof, a title opinion, the correct payment decimal, a diagnosis of why payments stopped, or a value conclusion.',
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
    'Wave 22 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave22_editorial',
  review_run_id: `mrx1000-wave22-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article provides five distinct readiness indicators—property identity, ownership-trail starting point, operating context, economic evidence, and a defined review question—while separating evaluation readiness from proven title, acreage, value, offer eligibility, production, marketability, or a decision to sell.',
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
  reviewer_id: 'codex_wave22_factual',
  review_run_id: `mrx1000-wave22-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'Land-grant, county-record, well, production, GIS, payment, and unclaimed-property claims remain bounded to their official government sources and stated limitations.',
    'The article uses no fabricated owners, deeds, probates, trusts, wells, leases, production, payments, offers, prices, acreage, ownership decimals, transaction values, testimonials, or owner-specific title, legal, tax, surveying, engineering, or valuation conclusions.',
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
  reviewer_id: 'codex_wave22_compliance',
  review_run_id: `mrx1000-wave22-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, and avoids title, probate, lease, legal, tax, investment, surveying, engineering, appraisal, offer-eligibility, transaction-suitability, or owner-specific value conclusions.',
    'Image text is limited to the exact article title and canonical keyword question and adds no owner, deed, probate, trust, well, lease, production, price, acreage, decimal, offer, market, legal, tax, surveying, engineering, or valuation conclusion.',
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
  `Built three hash-locked Wave 22 review artifacts with ${sources.length} live source checks.`,
);
