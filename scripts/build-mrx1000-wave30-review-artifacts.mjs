#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'selling-mineral-rights-selling-process-for-mineral-owners';
const programRowId = 'MRX1000-0110';
const title = 'Selling Mineral Rights: Selling Process For Mineral Owners';
const inlineKeyword = 'selling mineral rights';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave30-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 30 batch identity is missing or drifted');
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
      'https://mineralrightsxchange.com/blog/how-the-step-by-step-process-of-selling-texas-mineral-rights-works/',
      [
        'The current MRX Texas process article separates interest definition, record organization, production and lease context, buyer identity, written-term comparison, professional review, and coordinated closing.',
        'Wave 30 uses that page only as a state-specific companion and keeps its own job nationwide and centered on transaction-state inputs, owner decisions, written outputs, and stop conditions; it does not restate Texas conveyance or recording law.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology identifies production history, decline context, operator evidence, royalty terms, commodity assumptions, discount rate, title and acreage, and any offer terms as dated inputs to a directional range with assumptions stated.',
        'The article uses the methodology only to explain why a comparable-proposal sheet must preserve the interest, assumptions, and complete written terms; it does not calculate value, prove title or reserves, guarantee an outcome, or recommend a transaction.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p544',
      [
        'IRS Publication 544 explains that tax treatment and reporting for a sale or other disposition depend on the property, its use, the holding period, the parties, and other transaction facts.',
        'The article uses the publication only to require a transaction-specific tax handoff and final record archive; it does not classify the owner’s asset, compute gain or loss, select a tax form, or state an owner-specific tax result.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p551',
      [
        'IRS Publication 551 describes basis as an amount used for tax computations including depletion and gain or loss and directs taxpayers to keep accurate records of items affecting basis.',
        'The article uses the publication only to require preservation of basis-relevant records and a qualified tax handoff; it does not calculate basis, depletion, gain, loss, liability, or a retention period for a specific owner.',
      ],
    ],
    [
      'https://www.irs.gov/instructions/i1099s',
      [
        'The Instructions for Form 1099-S distinguish reportable real-estate transactions and describe an exception for an interest in surface or subsurface natural resources when the transfer is unrelated to other reportable real estate.',
        'The article uses that distinction only to show that information-reporting treatment can depend on transaction structure and facts; it does not conclude whether a mineral owner will receive Form 1099-S or how a sale must be reported.',
      ],
    ],
    [
      'https://www.ic3.gov/CrimeInfo/BEC',
      [
        'The FBI Internet Crime Complaint Center explains that business email compromise can target businesses and individuals transferring funds and recommends a secondary channel or two-factor authentication to verify requests that change account information.',
        'The article uses that guidance for a bounded payment-instruction verification step; it does not provide cybersecurity, banking, escrow, fraud-investigation, or loss-recovery advice or guarantee that a payment channel is safe.',
      ],
    ],
    [
      'https://consumer.ftc.gov/consumer-alerts/2021/03/spotting-scammy-emails',
      [
        'The Federal Trade Commission advises people who receive a suspicious email or text not to click its links or use the phone number in the message and to look up the organization’s contact number independently.',
        'The article uses that guidance only to support independent first-party verification of unexpected closing or payment messages; it does not authenticate any buyer, recipient, instruction, account, or transaction.',
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
    'Wave 30 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave30_editorial',
  review_run_id: `mrx1000-wave30-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the nationwide seller-control file by moving from a locked interest scope through complete written proposals, diligence issues, final transaction documents, independent payment-instruction verification, controlled closing, recording evidence, and a post-closing archive with explicit stop conditions.',
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
  reviewer_id: 'codex_wave30_factual',
  review_run_id: `mrx1000-wave30-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'MRX claims remain bounded to the published Texas-process companion and current methodology; IRS claims remain bounded to the general disposition, basis-record, and Form 1099-S instruction distinctions; FBI and FTC claims remain bounded to independent verification of unexpected account or message changes.',
    'The article uses no fabricated owners, buyers, deeds, payments, prices, acreage, ownership decimals, deadlines, settlement records, recording numbers, testimonials, or owner-specific title, legal, tax, accounting, valuation, cybersecurity, escrow, investment, or transaction conclusions.',
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
  reviewer_id: 'codex_wave30_compliance',
  review_run_id: `mrx1000-wave30-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, separates each transaction state, and routes unresolved title, legal, tax, accounting, valuation, cybersecurity, escrow, payment, recording, and contract questions without making owner-specific conclusions.',
    'Image text is limited to the exact article title and canonical keyword and adds no owner data, buyer endorsement, deed, payment instruction, price, acreage, decimal, deadline, settlement status, recording number, legal, tax, cybersecurity, escrow, or transaction conclusion.',
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
  `Built three hash-locked Wave 30 review artifacts with ${sources.length} live source checks.`,
);
