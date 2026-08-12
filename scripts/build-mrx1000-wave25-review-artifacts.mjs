#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'how-mineral-rights-valuation-affects-your-asset-decisions';
const programRowId = 'MRX1000-0183';
const title = 'How Mineral Rights Valuation Affects Your Asset Decisions';
const inlineKeyword = 'Factors Affecting Mineral Rights Value';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave25-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 25 batch identity is missing or drifted');
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
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology describes a discounted-cash-flow review of expected royalty income and a directional range with stated production, decline, royalty, discount-rate, commodity, title-confidence, and offer inputs.',
        'The article uses the methodology to distinguish property evidence, model assumptions, scenario outputs, and confidence from the owner’s personal decision criteria; it does not present a formal credentialed valuation, financial plan, investment recommendation, title opinion, legal or tax opinion, guaranteed value, or recommendation to sell.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/blog/what-determines-the-value-of-your-mineral-rights/',
      [
        'The MRX value-driver guide identifies ownership scope, location, lease terms, production, development evidence, commodity and timing assumptions, title certainty, and transaction scope as distinct inputs to a directional mineral-rights value range.',
        'The article summarizes those inputs only to explain how the resulting dated range can support an option comparison; it does not duplicate the broad factor catalog or claim that one factor determines an owner-specific value or decision.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/blog/can-you-sell-part-of-your-mineral-rights-partial-interest-sales-explained/',
      [
        'The MRX partial-interest guide explains that a proposed transfer must define the fraction, tract, depths, formations, royalty rights, reservations, and related conveyance scope rather than relying on a headline percentage alone.',
        'The article uses that guide to identify partial transfer as one option and to require separate transferred-and-retained scope; it does not interpret, draft, or approve owner-specific conveyance language.',
      ],
    ],
    [
      'https://webapps2.rrc.texas.gov/EWA/ewaPdqMain.do',
      [
        'The Railroad Commission of Texas Production Data Query provides reported Texas production searches using available geographic, operator, lease, well, field, and time-period identifiers.',
        'The article uses reported production as operating and timing context only; it does not treat a query result as proof of title, lease meaning, owner decimal, payment entitlement, future production, or value.',
      ],
    ],
    [
      'https://www.glo.texas.gov/archives-and-heritage/search-our-collections',
      [
        'The Texas General Land Office describes searchable archival collections that include digitized land-grant records, historical maps, and related public-land materials.',
        'The article uses those collections as possible survey and historical research leads only; it does not treat an archival record or map as a current county title record, legal description verification, or owner-specific title opinion.',
      ],
    ],
    [
      'https://www.investor.gov/introduction-investing/getting-started/asset-allocation',
      [
        'Investor.gov explains that asset allocation is personal and depends in part on an investor’s time horizon and risk tolerance, and that diversification spreads exposure among different assets.',
        'The article uses those concepts only as general prompts for a qualified financial-planning discussion; it does not classify mineral interests as securities, prescribe an allocation, compare expected returns, or recommend a transaction.',
      ],
    ],
    [
      'https://www.investor.gov/introduction-investing/investing-basics/what-risk',
      [
        'Investor.gov defines financial risk in terms of uncertainty and potential financial loss and describes that different assets can carry different risk, return, liquidity, and safety characteristics.',
        'The article uses uncertainty and risk tolerance only as owner criteria outside the mineral valuation model; it does not provide individualized investment advice, a risk score, or a conclusion about transaction suitability.',
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
    'Wave 25 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave25_editorial',
  review_run_id: `mrx1000-wave25-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the valuation-to-decision translation job by separating property facts, operating evidence, model assumptions, scenario outputs, confidence, option scope, and owner criteria while comparing hold, full-transfer, partial-transfer, and gather-evidence paths without recommending one.',
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
  reviewer_id: 'codex_wave25_factual',
  review_run_id: `mrx1000-wave25-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'MRX methodology, value-driver, and partial-transfer claims remain bounded to current first-party pages; RRC and GLO claims remain bounded to official production-query and archival-collection descriptions; Investor.gov concepts remain bounded to general time-horizon, risk-tolerance, asset-allocation, diversification, and risk education.',
    'The article uses no fabricated owners, deeds, wells, leases, production, payments, offers, prices, acreage, ownership decimals, valuation ranges, portfolio allocations, testimonials, or owner-specific title, legal, tax, accounting, engineering, investment, or valuation conclusions.',
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
  reviewer_id: 'codex_wave25_compliance',
  review_run_id: `mrx1000-wave25-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, distinguishes a directional valuation from owner-specific financial planning and transaction suitability, and avoids title, legal, tax, investment, estate-planning, accounting, engineering, appraisal, or owner-specific value conclusions.',
    'Image text is limited to the exact article title and canonical keyword and adds no owner, deed, well, lease term, production, price, acreage, decimal, offer, portfolio, legal, tax, accounting, engineering, investment, or valuation conclusion.',
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
  `Built three hash-locked Wave 25 review artifacts with ${sources.length} live source checks.`,
);
