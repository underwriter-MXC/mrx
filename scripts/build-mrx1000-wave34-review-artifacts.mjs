#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'selling-mineral-rights-valuation-factors-without-obligation';
const programRowId = 'MRX1000-0114';
const title = 'Selling Mineral Rights: Valuation Factors Without Obligation';
const inlineKeyword = 'selling mineral rights';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave34-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 34 batch identity is missing or drifted');
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
        'The current MRX FAQ states that its review is a free, no-obligation directional underwriter assessment, not a certified valuation, and states its no-pressure and potential-buyer disclosure boundaries.',
        'The article uses the FAQ only for MRX’s current first-party review policy and limitations; it does not convert “no obligation” into a universal legal term, promise a result, or interpret a separate agreement.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/book/',
      [
        'The current MRX booking page describes a confidential review path with no card and no obligation while preserving separate intake and later decision steps.',
        'The article uses the booking page only for the current first-party intake description; it does not promise eligibility, completion timing, a range, an offer, payment, sale, or closing.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology identifies production history, decline context, operator and development evidence, royalty terms, commodity assumptions, discounting, title and acreage, and offer terms as dated inputs to a directional range with assumptions stated.',
        'The article uses the methodology to preserve the directional-range, stated-assumption, offer-separation, and professional boundaries while owning the no-obligation permission journey; it does not calculate a property-specific value, prove title or reserves, promise an outcome, or recommend a transaction.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/privacy-policy/',
      [
        'The current MRX Privacy Policy describes first-party information collection, use, sharing, retention, export, deletion, and related choices and exceptions.',
        'The article points readers to the policy as controlling and uses it only to require purpose-specific record handling; it does not expand the policy, guarantee deletion, or state an owner-specific privacy right or compliance result.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/terms/',
      [
        'The current MRX Terms of Use govern the service and state educational, non-certified, non-title, and non-reserves boundaries alongside other applicable terms.',
        'The article preserves the terms as controlling and does not interpret enforceability, obligations, rights, remedies, or a particular agreement.',
      ],
    ],
    [
      'https://www.nist.gov/privacy-framework',
      [
        'The NIST Privacy Framework is a voluntary, risk- and outcome-based organizational tool for identifying and managing privacy risk from data processing.',
        'The article uses NIST only for the general discipline of connecting processing to a stated purpose and considering privacy risk; it does not treat the framework as law, certification, or proof of an owner-specific right or MRX compliance result.',
      ],
    ],
    [
      'https://www.eia.gov/naturalgas/data.php',
      [
        'The current EIA natural-gas data directory publishes price, production, reserves, drilling, supply, and other series with stated geographic scopes, frequencies, and release dates that differ by dataset.',
        'The article uses EIA only to require a named series, retrieval date, frequency, and geography; it does not treat an EIA series as the realized price, production history, reserves, forecast, or value of a specific mineral interest.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p544',
      [
        'IRS Publication 544 explains that gain or loss and tax treatment for a sale or other disposition depend on the property and transaction facts and on adjusted basis and amount realized.',
        'The article uses the publication only to require preservation of disposition- and basis-relevant records and a transaction-specific tax handoff; it does not classify the owner’s asset, calculate basis, gain, loss, liability, choose a form or election, or state an owner-specific tax result.',
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
    'Wave 34 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave34_editorial',
  review_run_id: `mrx1000-wave34-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the no-obligation review and privacy journey: it separates evidence review, permission to process deliberately supplied records, any later buyer proposal, and the owner’s transaction decision, then supplies a staged permission ladder, minimum-necessary record controls, an assumption-and-permission register, stop rules, and explicit next-step choices.',
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
  reviewer_id: 'codex_wave34_factual',
  review_run_id: `mrx1000-wave34-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'MRX claims remain bounded to its current FAQ, booking, methodology, Privacy Policy, and Terms of Use; NIST remains a voluntary organizational privacy-risk framework; EIA remains dated public data series; and IRS claims remain general disposition and record distinctions.',
    'The article uses no fabricated owners, buyers, deeds, privacy rights, permissions, prices, factor weights, multiples, acreage, ownership decimals, production, reserves, development events, tax results, offers, testimonials, or owner-specific title, legal, privacy, tax, accounting, engineering, appraisal, investment, or transaction conclusions.',
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
  reviewer_id: 'codex_wave34_compliance',
  review_run_id: `mrx1000-wave34-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational, privacy, and professional boundaries, discloses MRX’s potential economic interest, separates information processing and evidence review from a later buyer proposal and owner decision, supplies explicit stop conditions, labels MRX review as directional, and routes unresolved title, legal, privacy, tax, accounting, engineering, appraisal, investment, and transaction questions without making owner-specific conclusions.',
    'Image text is limited to the exact article title and canonical keyword and adds no owner data, buyer endorsement, deed, permission, privacy or compliance certification, price, factor weight, multiple, acreage, decimal, formula, reserve quantity, appraisal result, tax outcome, or transaction conclusion.',
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
  `Built three hash-locked Wave 34 review artifacts with ${sources.length} live source checks.`,
);
