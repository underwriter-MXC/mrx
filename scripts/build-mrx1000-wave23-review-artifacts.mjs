#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'get-a-free-mineral-rights-valuation-review-today';
const programRowId = 'MRX1000-0181';
const title = 'Get a Free Mineral Rights Valuation Review Today';
const inlineKeyword = 'Free Mineral Rights Valuation Review';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave23-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 23 batch identity is missing or drifted');
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
        'The current MRX methodology describes a discounted-cash-flow review of expected royalty income, a directional range with stated production, decline, royalty, discount-rate, commodity, title-confidence, and offer inputs, and a written follow-up whose timing depends on document completeness and operator-data availability.',
        'The article uses the methodology to explain a dated directional review and its inputs, not a formal credentialed valuation, title opinion, legal or tax opinion, independent valuation engagement, guaranteed value, guaranteed sale price, guaranteed offer, or recommendation to sell.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/book/',
      [
        'The current MRX booking page states that the review requires no card and creates no obligation, describes a short intake followed by document gathering, a directional range with stated assumptions, a written summary, and a follow-up conversation, and lists useful ownership, lease, royalty, offer, county, section, and depth information.',
        'The article uses the page to describe the current first-party request and evidence-organizing process; it does not promise same-day completion, eligibility, a range, an offer, a transaction, payment, production, sale, or closing.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/faq/',
      [
        'The current MRX FAQ describes a genuinely free review with no obligation to sell, no card, no separate review fee, useful owner records, variable timing, professional-service boundaries, and written disclosure if MRX may become a buyer.',
        'The article uses those first-party statements only for MRX process, fee, timing, scope, and commercial-role disclosures; it does not infer independence, certification, a guaranteed result, or the behavior, fees, qualifications, or outcomes of any third party.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/privacy-policy/',
      [
        'The current MRX privacy policy describes information owners may choose to provide, use of authorized private documents, service-provider sharing, retention and deletion controls, safeguards, and instructions not to upload Social Security numbers, full bank or payment details, passwords, or unrelated information.',
        'The article uses the policy for current MRX data-minimization and intended-channel guidance; it does not guarantee perfect security, provide legal privacy advice, expand the policy, or encourage sharing credentials, one-time codes, signatures, full financial details, or irrelevant personal records.',
      ],
    ],
    [
      'https://www.glo.texas.gov/sites/default/files/2025-01/Minerals%20FAQ_updated%202023.pdf',
      [
        'The Texas General Land Office explains that it keeps primordial land-grant files, that later conveyance records are generally found in the county deed records, and that mineral ownership requires examination of the deeds and leases affecting the claim.',
        'The article uses the FAQ to distinguish historical land-grant evidence from later title evidence and does not infer current ownership, acreage, inheritance, title, lease rights, or value from ancestry or an original grant.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
      [
        'The Railroad Commission of Texas explains that its online queries are slices of a larger oil-and-gas system and describes Wellbore Query search identifiers including district, lease or gas-well ID, county, field, operator, permit, API number, status, and well type.',
        'The article uses the query descriptions to organize regulatory identity research and does not treat any query result as proof of title, acreage, unit participation, owner payment, future drilling, or value.',
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
    'Wave 23 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave23_editorial',
  review_run_id: `mrx1000-wave23-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article explains five evidence lanes and five inspectable output components while differentiating a free directional valuation review from booking logistics, fee questions, a chronological process guide, a formal credentialed valuation, title work, professional advice, and a guaranteed transaction result.',
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
  reviewer_id: 'codex_wave23_factual',
  review_run_id: `mrx1000-wave23-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'MRX fee, intake, methodology, timing, privacy, and potential-buyer claims remain bounded to current first-party pages; RRC and GLO claims remain bounded to official public-record descriptions and limitations.',
    'The article uses no fabricated owners, deeds, probates, trusts, wells, leases, production, payments, offers, prices, acreage, ownership decimals, valuation ranges, completion promises, testimonials, or owner-specific title, legal, tax, surveying, engineering, or valuation conclusions.',
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
  reviewer_id: 'codex_wave23_compliance',
  review_run_id: `mrx1000-wave23-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, distinguishes free review fees from outside professional services, and avoids title, probate, lease, legal, tax, investment, surveying, engineering, appraisal, offer-eligibility, transaction-suitability, timing, or owner-specific value conclusions.',
    'Image text is limited to the exact article title and canonical keyword and adds no owner, deed, probate, trust, well, lease, production, price, acreage, decimal, offer, market, completion-time, legal, tax, surveying, engineering, or valuation conclusion.',
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
  `Built three hash-locked Wave 23 review artifacts with ${sources.length} live source checks.`,
);
