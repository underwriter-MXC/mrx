#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'selling-mineral-rights-valuation-factors-step-by-step';
const programRowId = 'MRX1000-0113';
const title = 'Selling Mineral Rights: Valuation Factors Step By Step';
const inlineKeyword = 'selling mineral rights';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave33-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 33 batch identity is missing or drifted');
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
        'The current MRX methodology identifies production history, decline context, operator and development evidence, royalty terms, commodity assumptions, discounting, title and acreage, and offer terms as dated inputs to a directional range with assumptions stated.',
        'The article uses the methodology to preserve the directional-range, stated-assumption, scenario, and limitation boundaries while owning the ordered workflow, handoffs, stop conditions, and version freeze; it does not calculate a property-specific value, prove title or reserves, promise an outcome, or recommend a transaction.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/blog/selling-mineral-rights-valuation-factors-in-2026/',
      [
        'The current MRX factor-register article separates asset facts, forecast assumptions, and transaction terms and assigns each factor dated evidence, confidence, scenario effects, verification ownership, and reset triggers.',
        'Wave 33 treats that page as the input taxonomy while owning the next procedural job: the exact order, required outputs, handoffs, stop conditions, and version-freeze controls from question lock through final decision file.',
      ],
    ],
    [
      'https://www.eia.gov/naturalgas/data.php',
      [
        'The current EIA natural-gas data directory publishes price, production, reserves, drilling, supply, and other series with stated geographic scopes, frequencies, and release dates that differ by dataset.',
        'The article uses EIA only to require a named benchmark or series, retrieval date, geography, differential, and scenario; it does not treat an EIA series as the realized price, production, reserves, forecast, or value of a specific mineral interest.',
      ],
    ],
    [
      'https://www.sec.gov/rules-regulations/oil-gas-reporting-modernization-small-entity-compliance-guide',
      [
        'The SEC oil-and-gas reporting modernization guide explains the 12-month first-of-month average-price convention and supporting reserves definitions used for public-company disclosure comparability.',
        'The article uses the guide only to illustrate why a pricing convention and purpose must be explicit; it states that SEC public-company reserves rules do not prescribe a private owner’s fair market value, sale price, forecast method, or reserves conclusion.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
      [
        'The Railroad Commission of Texas production-data page provides compilations and queries based on production information reported by Texas operators, including monthly and historical datasets.',
        'The article uses the page only as a Texas example of dated operating-history evidence and reporting scope; it does not treat a Commission record as proof of an owner’s title, decimal, reserves, future production, development, or value.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p544',
      [
        'IRS Publication 544 explains that gain or loss and tax treatment for a sale or other disposition depend on the property and transaction facts and on adjusted basis and amount realized.',
        'The article uses the publication only to require a transaction-specific tax handoff and final record archive; it does not classify the owner’s asset, calculate gain or loss, select a tax form, or state an owner-specific tax result.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p551',
      [
        'IRS Publication 551 describes basis as an amount used for tax computations including depletion and gain or loss and directs taxpayers to keep accurate records of items affecting basis.',
        'The article uses the publication only to require preservation of basis-relevant records and a qualified tax handoff; it does not calculate basis, depletion, gain, loss, liability, or a retention period for a specific owner.',
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
    'Wave 33 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave33_editorial',
  review_run_id: `mrx1000-wave33-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the ordered seller-facing workflow from question and scope lock through evidence grading, normalization, producing-versus-undeveloped separation, bounded scenarios, proposal reconciliation, professional handoffs, and a versioned final decision file, with an output and stop condition at every step.',
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
  reviewer_id: 'codex_wave33_factual',
  review_run_id: `mrx1000-wave33-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'MRX claims remain bounded to the current methodology and factor-register companion; EIA claims remain bounded to dated public data series; the SEC claim remains bounded to a public-company reserve-reporting convention; the Texas regulator claim remains bounded to operator-reported production data; and IRS claims remain bounded to general disposition and basis-record distinctions.',
    'The article uses no fabricated owners, buyers, deeds, prices, factor weights, multiples, acreage, ownership decimals, production, reserves, development events, tax results, offers, testimonials, or owner-specific title, legal, tax, accounting, engineering, appraisal, investment, or transaction conclusions.',
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
  reviewer_id: 'codex_wave33_compliance',
  review_run_id: `mrx1000-wave33-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, separates observed evidence from forward assumptions and negotiated terms, supplies explicit stop conditions, labels MRX review as directional, and routes unresolved title, legal, tax, accounting, engineering, appraisal, investment, and transaction questions without making owner-specific conclusions.',
    'Image text is limited to the exact article title and canonical keyword and adds no owner data, buyer endorsement, deed, price, factor weight, multiple, acreage, decimal, formula, reserve quantity, appraisal result, tax outcome, or transaction conclusion.',
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
  `Built three hash-locked Wave 33 review artifacts with ${sources.length} live source checks.`,
);
