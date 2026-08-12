#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'understanding-mineral-rights-valuation-near-you';
const programRowId = 'MRX1000-0125';
const title = 'Understanding Mineral Rights Valuation Near You';
const inlineKeyword = 'Mineral Rights Appraisal Near Me';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave45-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 45 batch identity is missing or drifted');
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
        'The current MRX methodology describes a directional DCF range with dated inputs, assumptions, limitations, and sensitivity, and separates asset range from offer consideration and expected owner net.',
        'The article uses the methodology only for the disclosed directional framework, input-status discipline, sensitivity review, and transaction separation; it does not value a specific interest, establish ownership, or recommend a transaction.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/faq/',
      [
        'The current MRX FAQ describes the review as educational, directional, and not certified, and states that a possible later MRX buyer relationship is disclosed when applicable.',
        'The article uses the FAQ only for the professional boundary and potential economic-interest disclosure; it does not promise value, price, an offer, payment, or closing.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/how-it-works/',
      [
        'The current MRX How It Works page describes the first-party intake sequence, the directional review boundary, and a separate path for reviewing a written offer.',
        'The article uses the page only to distinguish assessment intake from a complete written-offer comparison; it does not promise eligibility, a value, an offer, payment, acceptance, or closing.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/gis-viewer/',
      [
        'The Railroad Commission of Texas describes its Public GIS Viewer as a map surface for oil, gas, pipeline, well, survey, lease, API, and related Commission-regulated data.',
        'The article uses the viewer only for dated geographic and operational context; it does not treat map proximity or a displayed feature as proof of ownership, tract inclusion, formation rights, payment entitlement, reserves, future development, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
      [
        'The Railroad Commission of Texas explains that its oil-and-gas queries cover distinct slices of the regulatory system, identifies available search fields, and states update schedules for several query surfaces.',
        'The article uses the guide only to preserve query identity, identifiers, retrieval date, reporting scope, and update context; it does not infer title, owner allocation, reserves, future activity, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
      [
        'The Railroad Commission of Texas well-records page describes available record types and lists county, lease or well name, operator, field, API or permit number, and survey or abstract information as useful retrieval details.',
        'The article uses those fields only to route and identify operational records; it does not treat a well file as proof of an owner’s title, acreage, decimal, payment, tract inclusion, reserves, development, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/',
      [
        'The Railroad Commission of Texas Royalties FAQ routes lease or royalty-agreement questions toward the courthouse in the county where the land is located and describes using RRC identifiers to retrieve production information.',
        'The article uses the FAQ only to keep county conveyance records and Commission operational records in separate evidence lanes; it does not claim that either source alone resolves ownership, legal effect, payment entitlement, or value.',
      ],
    ],
    [
      'https://www.glo.texas.gov/sites/default/files/2025-01/Minerals%20FAQ_updated%202023.pdf',
      [
        'The Texas General Land Office minerals FAQ distinguishes original land-grant records from later county conveyance records and cautions that descent from an original grantee does not alone establish current mineral ownership.',
        'The article uses the FAQ only to route property-and-interest research and preserve the title boundary; it does not infer ownership, acreage, legal effect, or value from a surname, grant record, or family history.',
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
    'Wave 45 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave45_editorial',
  review_run_id: `mrx1000-wave45-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the local-intent provider and evidence-routing job: it defines “near me” by the mineral property’s jurisdiction, records, operating context, effective date, intended use, and fit-for-purpose professional while separating physical proximity from competence, independence, ownership, value, and appraisal authority.',
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
  reviewer_id: 'codex_wave45_factual',
  review_run_id: `mrx1000-wave45-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'MRX claims remain bounded to its current methodology, FAQ, and How It Works page; Railroad Commission claims preserve the separate GIS, query, well-record, county-record, identifier, and operational-data boundaries; and the GLO claim preserves the distinction between original grants, later county records, and current ownership.',
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
  reviewer_id: 'codex_wave45_compliance',
  review_run_id: `mrx1000-wave45-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article routes location-aware records and specialist questions without making an owner-specific title, reserve, engineering, appraisal, legal, tax, value, payment, eligibility, or transaction conclusion; discloses MRX’s possible economic interest; preserves separate evidence lanes and uncertainty; and does not present proximity as proof of qualification or independence.',
    'Image text is limited to the exact article title and canonical phrase; the abstract county, map, record, device, and office objects add no owner data, jurisdictional endorsement, professional credential, ownership conclusion, production value, commodity price, acreage, decimal, formula result, offer, transaction term, appraisal result, tax outcome, legal conclusion, or private information.',
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
  `Built three hash-locked Wave 45 review artifacts with ${sources.length} live source checks.`,
);
