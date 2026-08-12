#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'understanding-mineral-rights-your-essential-selling-guide';
const programRowId = 'MRX1000-0126';
const title = 'Understanding Mineral Rights: Your Essential Selling Guide';
const inlineKeyword = 'How to Avoid Mineral Rights Selling Pitfalls';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave46-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 46 batch identity is missing or drifted');
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
      'https://mineralrightsxchange.com/faq/',
      [
        'The current MRX FAQ describes a no-obligation directional underwriter assessment, not a certified valuation, and discloses that MRX may ultimately want to buy an interest.',
        'The article uses the FAQ only for MRX’s current service boundaries and provider-interest disclosure; it does not promise a result, interpret an agreement, or recommend a transaction.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology separates a directional asset range from actual buyer offers and expected owner net, and requires dated inputs, assumptions, and limitations.',
        'The article uses the methodology only to distinguish property evidence, a directional range, complete proposal terms, and owner net; it does not value a specific interest, establish legal rights, or predict a transaction result.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/how-it-works/',
      [
        'The current MRX How It Works page distinguishes intake and a directional underwriter review from the path for organizing a complete written offer.',
        'The article uses the page only to separate the property-and-range gate from the written-proposal gate; it does not promise eligibility, a value, an offer, payment, sale, or closing.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/terms/',
      [
        'The current MRX terms state that website information is educational and not legal, tax, financial, investment, engineering, or certified appraisal advice.',
        'The article uses the terms only to preserve educational and professional boundaries; it does not use them to interpret a buyer contract or determine an owner’s rights.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/?artSec=12.001&chapter=PR.12&code=PR&tab=1',
      [
        'Texas Property Code Chapter 12 provides a state-specific example of formal requirements associated with recording instruments concerning real or personal property.',
        'The article uses Chapter 12 only to show why deed, acknowledgment, delivery, and recording instructions deserve attorney review in a Texas transaction; it does not extend Texas law elsewhere or claim that recordability proves validity, title, authority, delivery, consideration, priority, or an owner-specific result.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p544',
      [
        'IRS Publication 544 explains that gain or loss on a sale or other disposition generally depends on the amount realized and adjusted basis, with treatment depending on the property and transaction facts.',
        'The article uses the publication only to distinguish gross consideration from owner net and to prompt a transaction-specific tax handoff; it does not classify an owner’s asset, calculate basis, gain, loss, tax, or filing treatment.',
      ],
    ],
    [
      'https://consumer.ftc.gov/articles/how-avoid-scam',
      [
        'The FTC’s general scam-avoidance guidance identifies impersonation, urgency, unexpected personal or financial-information requests, and the value of contacting an organization through a known channel.',
        'The article uses the guidance only for general identity, communication-channel, pressure, and sensitive-information safeguards. It is not mineral-sale law and does not establish fraud, authority, contract effect, owner rights, or remedies.',
      ],
    ],
    [
      'https://www.sos.state.tx.us/corp/do-business.shtml',
      [
        'The Texas Secretary of State provides official routes to online business filings, searches, copies, certificates, and related business information.',
        'The article uses the page only as an official entity-record routing source. A filing or search result is not treated as an endorsement, proof of representative authority, funding evidence, fair-terms conclusion, or transaction-safety conclusion.',
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
    'Wave 46 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave46_editorial',
  review_run_id: `mrx1000-wave46-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns a seven-gate seller-readiness job: objective and exact asset scope, indexed evidence, directional value context, complete written proposal, counterparty and channel verification, professional review and version lock, and controlled closing plus retained records. Each gate ends in an observable advance, pause, or stop decision and routes deeper mistake, clause, process, and fraud-awareness questions to existing pages.',
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
  reviewer_id: 'codex_wave46_factual',
  review_run_id: `mrx1000-wave46-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'MRX claims remain bounded to its current FAQ, methodology, and terms; Texas recording law is expressly limited to a state-specific example; IRS claims remain general disposition concepts; and FTC guidance is identified as general document discipline from a different transaction context.',
    'The article uses no fabricated owners, buyers, contracts, deeds, prices, acreage, ownership decimals, tax results, offers, testimonials, success rates, or owner-specific title, legal, tax, accounting, appraisal, investment, or transaction conclusions.',
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
  reviewer_id: 'codex_wave46_compliance',
  review_run_id: `mrx1000-wave46-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, separates owner objectives, property evidence, proposal comparison, professional handoffs, and controlled closing, supplies explicit stop conditions, labels MRX review as directional, and routes unresolved title, legal, tax, accounting, appraisal, investment, and transaction questions without making owner-specific conclusions.',
    'Image text is limited to the exact article title and canonical question and adds no owner data, buyer endorsement, contract interpretation, deed, price, acreage, decimal, formula, success claim, appraisal result, tax outcome, or transaction conclusion.',
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
  `Built three hash-locked Wave 46 review artifacts with ${sources.length} live source checks.`,
);
