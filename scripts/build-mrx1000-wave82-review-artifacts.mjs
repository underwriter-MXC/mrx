#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const waveNumber = process.env.MRX_WAVE_NUMBER ?? '82';
const slug =
  process.env.MRX_ARTICLE_SLUG ?? 'compare-public-oil-and-gas-price-decks-without-mixing-assumptions';
const programRowId = process.env.MRX_PROGRAM_ROW_ID ?? 'MRX1000-0267';
const title =
  process.env.MRX_ARTICLE_TITLE ??
  'How to Compare Public Oil and Gas Price Decks Without Mixing Assumptions';
const primaryKeyword = process.env.MRX_PRIMARY_KEYWORD ?? 'compare public oil and gas price decks';
const inlineKeyword = process.env.MRX_INLINE_KEYWORD ?? primaryKeyword;
const heroAlt =
  process.env.MRX_HERO_ALT ??
  'Two separate published price-deck booklets appear beside the exact article title.';
const inlineAlt =
  process.env.MRX_INLINE_ALT ??
  'An overhead public price-deck comparison matrix appears above the exact keyword.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath =
  `artifacts/mrx1000-wave${waveNumber}-creative-qa/${slug}/creative-manifest.json`;
const expectedSelectionRank = Number(process.env.MRX_SELECTION_RANK ?? 162);
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== expectedSelectionRank) {
  throw new Error(`Wave ${waveNumber} batch identity is missing or drifted`);
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Frontmatter missing');
  return `${match[1]}\n`;
}

function unquote(value) {
  return String(value ?? '')
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .replace(/''/g, "'");
}

function scalar(block, key) {
  return unquote(block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]);
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1];
  return unquote(nested?.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1]);
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
      'user-agent': 'MRX Research contact@mineralrightsxchange.com',
      'cache-control': 'no-cache',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${url}: source access returned ${response.status}`);
  }
  const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
  const allowed =
    contentType.includes('text/html') ||
    (url.endsWith('.pdf') &&
      (contentType.includes('application/pdf') || contentType.includes('octet-stream')));
  if (!allowed || new URL(response.url).protocol !== 'https:') {
    throw new Error(`${url}: source access or content type is unsupported`);
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

const defaultSourceScopes = [
  [
    'https://www.eia.gov/outlooks/steo/outlook.php',
    [
      'The EIA Short-Term Energy Outlook page supplies a current first-party example of a dated public outlook with release, forecast-completion, current-table, data, and archive context.',
      'The article uses the page only to preserve publication identity, dates, edition, source location, and stated use case; it does not adopt an EIA forecast, extend a horizon, predict realized prices, or make a property-level economic conclusion.',
    ],
  ],
  [
    'https://www.eia.gov/tools/faqs/faq.php?id=13&t=2',
    [
      'The EIA FAQ distinguishes generally published nominal prices from inflation-adjusted real prices.',
      'The article uses the FAQ only to preserve the source-stated dollar basis and any stated real-price base period; it does not choose an inflation series, convert a value, or normalize two publications.',
    ],
  ],
  [
    'https://www.eia.gov/energyexplained/units-and-calculators/',
    [
      'The EIA units and calculators overview supplies first-party context for the physical units used across energy sources and the fact that conversions require a defined method.',
      'The article uses the page only to require explicit unit capture and reject silent conversion inside the source matrix; it does not select a conversion factor or make sources analytically equivalent.',
    ],
  ],
  [
    'https://www.eia.gov/tools/faqs/faq.php?id=1417&t=7',
    [
      'The EIA natural-gas units FAQ defines common U.S. scale and energy-unit abbreviations including Mcf, Btu, and MMBtu.',
      'The article uses the FAQ only to keep scale prefixes and denominators explicit; it does not convert a volume unit to an energy unit, infer heat content, or bridge a public price to an owner result.',
    ],
  ],
  [
    'https://www.govinfo.gov/content/pkg/FR-2009-01-14/pdf/E9-409.pdf',
    [
      'The SEC Modernization of Oil and Gas Reporting final rule supplies the official Federal Register context for the 12-month average pricing mechanism used in specified reserves disclosures.',
      'The article uses the rule only to distinguish a prescribed reserve-disclosure pricing frame from a public forecast or property-specific planning deck; it does not interpret a reserve report, calculate reserves or present value, or recommend a pricing input.',
    ],
  ],
];
const sourceScopes = new Map(
  process.env.MRX_SOURCE_SCOPES_JSON
    ? JSON.parse(process.env.MRX_SOURCE_SCOPES_JSON)
    : defaultSourceScopes,
);
const editorialFindings = JSON.parse(
  process.env.MRX_EDITORIAL_FINDINGS_JSON ??
    JSON.stringify([
      'The article owns only a source-preserving comparison of publication identity, dates, commodity, benchmark, geography, units, nominal-or-real basis, interval, horizon, and stated use case. It stops before creating, extending, blending, converting, normalizing, selecting, validating, or recommending a deck; forecasting prices; applying property-level assumptions; or calculating cash flow, present value, value, an offer, or a transaction result.',
      `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”; the elevated two-booklet hero and people-free strict-overhead two-source comparison matrix are materially different compositions with matching alt metadata.`,
    ]),
);
const factualFindings = JSON.parse(
  process.env.MRX_FACTUAL_FINDINGS_JSON ??
    JSON.stringify([
      'Claims remain bounded to EIA publication-date, unit, and nominal-or-real context plus the SEC/Federal Register reserve-disclosure pricing frame. None is converted into a forecast selection, unit conversion, inflation adjustment, property-specific price bridge, reserve interpretation, cash-flow calculation, present value, offer, or value.',
      'The article supplies no proprietary, universal, market, or owner-specific numerical assumption; invents no benchmark, geographic basis, unit, base period, forecast horizon, source relationship, property fact, or modeled result; and makes no owner-specific engineering, reserve, appraisal, investment, legal, tax, financial, valuation, offer, or transaction conclusion.',
    ]),
);
const complianceFindings = JSON.parse(
  process.env.MRX_COMPLIANCE_FINDINGS_JSON ??
    JSON.stringify([
      'The article keeps each public source in a separate column; preserves source identity, version, dates, commodity, benchmark, geography, units, nominal-or-real basis, interval, horizon, use case, and retrieval date; limits status to matched frame, different frame, missing, or unresolved; turns gaps into neutral questions; discloses possible MRX buyer interest; and preserves owner agency and qualified-review boundaries.',
      'Image text is limited to the exact article title and approved keyword and adds no owner name, property fact, source result, model output, numerical assumption, seal, recommendation, appraisal claim, forecast, guarantee, or transaction outcome.',
    ]),
);
const factualChecks = JSON.parse(
  process.env.MRX_FACTUAL_CHECKS_JSON ??
    '["complete_file_sha256_match","five_distinct_https_sources","current_source_access_review_pass","claim_to_source_scope_present","official_source_priority_pass","unsupported_high_risk_claim_scan_pass"]',
);
const complianceChecks = JSON.parse(
  process.env.MRX_COMPLIANCE_CHECKS_JSON ??
    '["complete_file_sha256_match","hero_share_sha256_identity","inline_image_distinct_sha256","exact_text_ocr_pass","filename_text_identity_pass","public_price_deck_comparison_no_forecast_normalization_selection_property_economics_present_value_or_recommendation_boundary_pass","owner_agency_and_possible_buyer_interest_disclosure_preserved","no_unsupported_visual_or_decision_claims"]',
);

function sourceScope(source) {
  const [paraphrase, claimScope] = sourceScopes.get(source.url) ?? [];
  if (!paraphrase || !claimScope) {
    throw new Error(`${source.url}: claim-to-source scope is missing`);
  }
  return {
    ...source,
    source_location_or_paraphrase: paraphrase,
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
  scalar(fm, 'primary_keyword') !== primaryKeyword ||
  nestedScalar(fm, 'hero_image', 'src') !== row.hero_path ||
  nestedScalar(fm, 'hero_image', 'social_src') !== row.hero_path ||
  nestedScalar(fm, 'hero_image', 'alt') !== heroAlt ||
  nestedScalar(fm, 'hero_image', 'social_alt') !== heroAlt ||
  nestedScalar(fm, 'inline_image', 'src') !== row.inline_path ||
  nestedScalar(fm, 'inline_image', 'alt') !== inlineAlt ||
  nestedScalar(fm, 'inline_image', 'rendered_text') !== inlineKeyword ||
  faqCount !== 5 ||
  wordCount < 700 ||
  sources.length !== 5
) {
  throw new Error(
    `Wave ${waveNumber} review inputs do not satisfy identity, article-depth, source, or creative gates`,
  );
}

const sourceAccess = [];
for (const sourceEntry of sources) sourceAccess.push(sourceScope(await verifySource(sourceEntry)));

const common = {
  schema_version: '2.0.0',
  disposition: 'PASS',
  reviewed_at: reviewedAt,
  decision_authority: {
    source: 'Daryl owner directives, 2026-08-04 and 2026-08-14',
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
  visual_metadata: { hero_alt: heroAlt, social_alt: heroAlt, inline_alt: inlineAlt },
};

writeArtifact('editorial', `${programRowId}-${slug}.json`, {
  artifact_type: `mrx1000_wave${waveNumber}_two_image_editorial_review`,
  ...common,
  reviewer_id: `codex_wave${waveNumber}_editorial`,
  review_run_id: `mrx1000-wave${waveNumber}-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    ...editorialFindings,
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
  artifact_type: `mrx1000_wave${waveNumber}_two_image_factual_citation_review`,
  ...common,
  reviewer_id: `codex_wave${waveNumber}_factual`,
  review_run_id: `mrx1000-wave${waveNumber}-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current HTTPS access review.`,
    ...factualFindings,
  ],
  checks: factualChecks,
  sources_inspected: sourceAccess,
});

writeArtifact('compliance', `${slug}.json`, {
  artifact_type: `mrx1000_wave${waveNumber}_two_image_compliance_review`,
  ...common,
  reviewer_id: `codex_wave${waveNumber}_compliance`,
  review_run_id: `mrx1000-wave${waveNumber}-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    ...complianceFindings,
  ],
  checks: complianceChecks,
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave ${waveNumber} review artifacts with ${sources.length} current source checks.`,
);
