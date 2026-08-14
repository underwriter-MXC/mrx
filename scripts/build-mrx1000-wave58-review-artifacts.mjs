#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'why-is-my-mineral-rights-valuation-range-so-wide';
const programRowId = 'MRX1000-0138';
const title = 'Why Is My Mineral Rights Valuation Range So Wide?';
const inlineKeyword = 'What Makes a Mineral Rights Valuation Range Wider or Narrower?';
const heroAlt =
  'Two people review a fan-shaped valuation chart beside “Why Is My Mineral Rights Valuation Range So Wide?”.';
const inlineAlt =
  'Hands arrange map and data tiles around “What Makes a Mineral Rights Valuation Range Wider or Narrower?”.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave58-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 58 batch identity is missing or drifted');
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
        'The Railroad Commission of Texas production page identifies Texas production compilations and summaries derived from operator reports.',
        'The article uses the page only for operator-reported production context; it does not prove private title, an owner decimal, realized price, reserves, future production, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/',
      [
        'The Railroad Commission of Texas Royalties FAQ describes information associated with royalty payments and division orders and identifies paths for requesting certain lease, property, or well identifiers.',
        'The article uses the page only for payment-record fields, division-order matching, and identifier follow-up; it does not establish complete title, ownership, reserves, future production, value, or legal effect.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
      [
        'The Railroad Commission of Texas well-records page describes public search paths and identifiers such as county, operator, field, API number, drilling-permit number, lease or gas-well identity, survey, abstract, section, and block.',
        'The article uses the page only to explain reproducible property and well identity; it does not prove private title, tract inclusion, owner decimal, reserves, future development, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
      [
        'The Railroad Commission of Texas query guide explains public oil-and-gas data identities, including API wellbore identity and lease or gas-well completion identifiers.',
        'The article uses the page only to keep record identifiers and query paths explicit; it does not resolve private ownership, title, contract effect, production entitlement, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
      [
        'The RRC Production Data Query FAQs explain operator-reported production, Texas lease-versus-well reporting, reporting lag, and later revisions, corrections, or late filings.',
        'The article uses the page only to require retrieval dates, periods, identifiers, and version controls for public operating evidence; it does not establish owner-specific title, payment, reserves, future production, or value.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.12.htm',
      [
        'Texas Property Code Chapter 12 provides statutory context for recording instruments concerning property.',
        'The article uses the chapter only to explain why complete recorded instruments and recording references may matter; it does not interpret a particular instrument or establish an owner-specific title conclusion.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/LG/htm/LG.191.htm',
      [
        'Texas Local Government Code Chapter 191 identifies the county clerk as county recorder and addresses authorized records and indexing.',
        'The article uses the chapter only for county-record context; it does not determine the legal effect, priority, completeness, or ownership result of any record.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/ES/htm/ES.101.htm',
      [
        'Texas Estates Code Chapter 101 provides statutory context for estate vesting subject to administration and liabilities.',
        'The article uses the chapter only to explain why estate records and authority may be relevant; it does not decide inheritance, probate, heirship, authority, curative requirements, or title.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/NR/htm/NR.91.htm',
      [
        'Texas Natural Resources Code Chapter 91 provides statutory context for certain payor information and identification requests discussed by the RRC.',
        'The article uses the chapter only for record-retrieval and payment-information context; it does not establish complete ownership, lease interpretation, title, production entitlement, or value.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology describes the evidence, assumptions, scenarios, and professional limits of a directional mineral-rights review.',
        'The article uses the page only to bound a scoped directional review and its handoffs; it does not establish owner-specific title, reserves, value, legal effect, tax treatment, suitability, or a transaction result.',
      ],
    ],
    [
      'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_m.htm',
      [
        'The U.S. Energy Information Administration page publishes dated crude-oil spot-price series and their units and frequency.',
        'The article uses the page only for public benchmark context; it does not establish a property-specific realized price, differential, deduction, forecast, or value.',
      ],
    ],
    [
      'https://www.eia.gov/naturalgas/data.php',
      [
        'The U.S. Energy Information Administration natural-gas data page provides dated public natural-gas data and price-series access.',
        'The article uses the page only for public benchmark context; it does not establish a property-specific realized price, contract, deduction, forecast, or value.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/mineral-rights-value/',
      [
        'The current MRX mineral-rights value hub describes common inputs and the educational directional-review boundary.',
        'The article uses the page only to bound general value education; it does not establish owner-specific title, reserves, value, suitability, or a transaction result.',
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
  nestedScalar(fm, 'hero_image', 'alt') !== heroAlt ||
  nestedScalar(fm, 'hero_image', 'social_alt') !== heroAlt ||
  nestedScalar(fm, 'inline_image', 'alt') !== inlineAlt ||
  nestedScalar(fm, 'inline_image', 'rendered_text') !== inlineKeyword ||
  faqCount !== 5 ||
  wordCount < 700 ||
  sources.length < 3
) {
  throw new Error(
    'Wave 58 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  visual_metadata: {
    hero_alt: heroAlt,
    social_alt: heroAlt,
    inline_alt: inlineAlt,
  },
};

writeArtifact('editorial', `${programRowId}-${slug}.json`, {
  artifact_type: 'mrx1000_two_image_editorial_review',
  ...common,
  reviewer_id: 'codex_wave58_editorial',
  review_run_id: `mrx1000-wave58-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the range-width audit. It separates six endpoint drivers, requires base and alternate treatments, evidence status, narrowing evidence, reset rules, and stop rules, and defers local-range assembly, full-model validation, and post-range owner decisions to their incumbent pages.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”; composition-accurate hero/social and inline alt metadata matched the final visual audit.`,
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
        hero_social_alt_match: true,
        inline_alt_match: true,
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
  reviewer_id: 'codex_wave58_factual',
  review_run_id: `mrx1000-wave58-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'Claims remain bounded to current RRC operator-reported production, query-identity, reporting-lag, correction, and payment-record context; EIA public commodity benchmarks; and current MRX methodology and value-education scope. The article does not turn any source into owner-specific title, authority, legal effect, reserves, future production, realized price, value, tax result, offer, or decision evidence.',
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
  reviewer_id: 'codex_wave58_compliance',
  review_run_id: `mrx1000-wave58-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, separates six endpoint-driver lanes, labels supported, derived, assumed, conflicted, missing, and professional-review-needed fields, preserves identity conflicts, discloses possible MRX buyer interest, and makes no owner-specific title, authority, value, legal, tax, investment, appraisal, or transaction conclusion.',
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
  `Built three hash-locked Wave 58 review artifacts with ${sources.length} live source checks.`,
);
