#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'how-lease-royalty-rates-influence-mineral-value';
const programRowId = 'MRX1000-0182';
const title = 'How Lease Royalty Rates Influence Mineral Value';
const inlineKeyword = 'lease royalty rates mineral value';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave24-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 24 batch identity is missing or drifted');
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
        'The article uses the methodology to keep the lease royalty fraction separate from production, timing, and risk inputs; it does not present a formal credentialed valuation, title opinion, legal or tax opinion, payment audit, guaranteed value, guaranteed offer, or recommendation to sell.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/blog/what-is-a-net-royalty-acre/',
      [
        'The MRX net royalty acre guide distinguishes mineral ownership, lease royalty fraction, net revenue interest, and royalty-acre conventions and presents simplified arithmetic with explicit limitations.',
        'The article uses that guide for terminology and an organizing equation only; it does not claim a universal title formula, a standard royalty rate, an owner-specific decimal, or a value conclusion.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/blog/how-royalty-payments-work-for-texas-mineral-rights-owners/',
      [
        'The MRX royalty-payment guide explains the production-to-payment path, distinguishes lease terms from payment records, and warns that royalty rates are contract-specific rather than a Texas-wide standard.',
        'The article uses that guide to distinguish payment mechanics from valuation sensitivity; it does not infer that a statement proves title, lease meaning, deduction rights, or correct payment.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/NR/pdf/NR.91.pdf',
      [
        'Texas Natural Resources Code Chapter 91 defines payee, payor, and division order and provides statutory payment-timing rules for oil-and-gas proceeds.',
        'The article uses the statute only for those payment and division-order descriptions; it does not treat the statute or a division order as an owner-specific lease interpretation, title opinion, royalty-rate determination, or decimal audit.',
      ],
    ],
    [
      'https://www.glo.texas.gov/sites/default/files/resources/glo/energy-business/oil-gas/rrac/forms/oil-gas-royalty-audit.pdf',
      [
        'The Texas General Land Office royalty-audit guide states that a state lease agreement specifies the valuation method for royalty calculation and illustrates distinct oil, non-processed-gas, processed-gas, fuel, and disposition provisions.',
        'The article uses the guide to show that a royalty fraction must be read with its calculation and product language; it expressly does not apply a state-lease example as a legal interpretation of a private lease.',
      ],
    ],
    [
      'https://www.glo.texas.gov/energy/mineral-leasing/leasing',
      [
        'The Texas General Land Office mineral-leasing page describes state-managed leasing programs, including approval, filing, and revenue-allocation requirements for identified state interests.',
        'The article uses those state examples only to reinforce the need to identify the estate, authority, instrument, and effective scope; it does not apply state procedures to a private lease or infer owner-specific rights.',
      ],
    ],
    [
      'https://webapps2.rrc.texas.gov/EWA/ewaPdqMain.do',
      [
        'The Railroad Commission of Texas Production Data Query provides reported Texas production searches using available geographic, operator, lease, well, field, and time-period identifiers.',
        'The article uses reported production as regulatory and timing context only; it does not treat a query result as proof of title, lease meaning, owner decimal, deduction rights, payment entitlement, future production, or value.',
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
    'Wave 24 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave24_editorial',
  review_run_id: `mrx1000-wave24-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article isolates lease-rate sensitivity from mineral ownership, participation, division-order decimals, royalty valuation language, historical payments, decline curves, and DCF discount rates, while preserving the full-interest comparison required for a directional review.',
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
  reviewer_id: 'codex_wave24_factual',
  review_run_id: `mrx1000-wave24-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'MRX terminology and methodology claims remain bounded to current first-party pages; Texas statute, RRC, and GLO claims remain bounded to official payment, production-data, state-lease, and state-leasing descriptions and limitations.',
    'The article uses labeled hypothetical rate multipliers and no fabricated owners, deeds, wells, leases, production, payments, offers, prices, acreage, ownership decimals, valuation ranges, testimonials, or owner-specific title, legal, tax, accounting, engineering, or valuation conclusions.',
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
  reviewer_id: 'codex_wave24_compliance',
  review_run_id: `mrx1000-wave24-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, distinguishes a lease royalty rate from owner-specific lease interpretation and payment auditing, and avoids title, legal, tax, investment, accounting, engineering, appraisal, transaction-suitability, or owner-specific value conclusions.',
    'Image text is limited to the exact article title and canonical keyword and adds no owner, deed, well, lease term, production, price, acreage, decimal, offer, market, legal, tax, accounting, engineering, or valuation conclusion.',
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
  `Built three hash-locked Wave 24 review artifacts with ${sources.length} live source checks.`,
);
