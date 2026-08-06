#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const batchSidecarPath = `${batchPath}.sha256`;
const decisionPath = 'docs/governance/mrx1000-wave5-selection-decision-2026-08-06.md';
const materializedAt = '2026-08-06T19:30:00Z';

const specifications = [
  {
    selection_rank: 36,
    program_row_id: 'MRX1000-0002',
    slug: 'how-long-does-it-take-to-sell-mineral-rights-in-texas',
    title: 'How Long Does It Take to Sell Mineral Rights in Texas?',
    pillar: 'sell-mineral-rights',
    cluster: 'sell-mineral-rights-decision-process',
    hero_path: '/assets/articles/sell-mineral-rights-timeline-texas-wave5.webp',
    archive_evidence_sha256: '50a1e620635fe98bdec4a7e39f1b1ab006d7ea36e90904ec899e119340f0a1f5',
  },
  {
    selection_rank: 37,
    program_row_id: 'MRX1000-0003',
    slug: 'how-the-step-by-step-process-of-selling-texas-mineral-rights-works',
    title: 'How the Step-by-Step Process of Selling Texas Mineral Rights Works',
    pillar: 'sell-mineral-rights',
    cluster: 'sell-mineral-rights-decision-process',
    hero_path: '/assets/articles/selling-texas-mineral-rights-process-wave5.webp',
    archive_evidence_sha256: '37e1568d71c36f2c1cafcdbdceed95be971b4759233d7edbb1b060b0255f996f',
  },
  {
    selection_rank: 38,
    program_row_id: 'MRX1000-0004',
    slug: 'what-happens-after-you-sell-your-mineral-rights-in-texas',
    title: 'What Happens After You Sell Your Mineral Rights in Texas?',
    pillar: 'sell-mineral-rights',
    cluster: 'sell-mineral-rights-decision-process',
    hero_path: '/assets/articles/after-selling-mineral-rights-texas-wave5.webp',
    archive_evidence_sha256: '603d77676521fd788839e6137bc1ee9f5abd219c015d7e45c2c3e0362858a18f',
  },
  {
    selection_rank: 39,
    program_row_id: 'MRX1000-0310',
    slug: 'how-to-negotiate-a-mineral-rights-sale-what-sellers-need-to-know',
    title: 'How to Negotiate a Mineral Rights Sale: What Sellers Need to Know',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    hero_path: '/assets/articles/negotiate-mineral-rights-sale-wave5.webp',
    archive_evidence_sha256: '1edacb56e9d2096eba3858531b4ac535ee40481bc80b3b1eb7a2573be5176256',
  },
  {
    selection_rank: 40,
    program_row_id: 'MRX1000-0319',
    slug: 'understanding-the-key-factors-influencing-your-mineral-rights-offer-range',
    title: 'Understanding the Key Factors Influencing Your Mineral Rights Offer Range',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    hero_path: '/assets/articles/mineral-rights-offer-range-factors-wave5.webp',
    archive_evidence_sha256: '1a08ae484c3032d80bc274bce33b1de87cab42696436f78c34e709a61209c3e2',
  },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

function wordCount(source) {
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  return body.match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu)?.length ?? 0;
}

const batch = JSON.parse(await readFile(batchPath, 'utf8'));
const decisionBytes = await readFile(join(root, decisionPath));
const retained = batch.articles.filter((article) => article.selection_rank <= 35);
if (retained.length !== 35) {
  throw new Error(`Expected the immutable first 35 entries; observed ${retained.length}`);
}

const additions = [];
for (const specification of specifications) {
  const repoPath = `src/content/posts/${specification.slug}.mdx`;
  const bodyBytes = await readFile(join(root, repoPath));
  const body = bodyBytes.toString('utf8');
  if (!/^publication_status:\s*draft$/m.test(body) || !/^noindex:\s*true$/m.test(body)) {
    throw new Error(`${specification.slug} must be in reviewed draft/noindex state`);
  }
  const heroBytes = await readFile(join(root, 'public', specification.hero_path.slice(1)));
  const articleSha = sha256(bodyBytes);
  const heroSha = sha256(heroBytes);
  additions.push({
    selection_rank: specification.selection_rank,
    program_row_id: specification.program_row_id,
    source_shortlist_program_row_id: specification.program_row_id,
    slug: specification.slug,
    title: specification.title,
    source_shortlist_title: specification.title,
    canonical_url: `https://mineralrightsxchange.com/blog/${specification.slug}/`,
    pillar: specification.pillar,
    cluster: specification.cluster,
    content_genius_article_uuid: null,
    archive_evidence_sha256: specification.archive_evidence_sha256,
    repo_path: repoPath,
    repo_sha256: articleSha,
    article_sha256: articleSha,
    hero_path: specification.hero_path,
    hero_sha256: heroSha,
    hero_asset_sha256: heroSha,
    admission_status: 'admitted_quality_gated',
    finalization_state: 'draft_noindex_admitted',
    searchatlas_content_score: null,
    searchatlas_word_count: wordCount(body),
    risk_citation_remediation: [
      'Continuous quality-gated admission under D-2026-0804-16 and MRX-DEC-2026-0806-002; no numerical cap or observation-window gate applies.',
      'Publication remains conditional on current editorial, factual/citation, compliance, exact-title asset, build, rollback, deployment, and live-verification evidence.',
    ],
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${specification.slug}.json`,
    evidence_packet_path_required: true,
  });
}

batch.evidence_scaffold_generated_at_utc = materializedAt;
batch.decision_authority.wave5_selection_decision_id = 'MRX-DEC-2026-0806-002';
batch.decision_authority.wave5_selection_decision_path = decisionPath;
batch.decision_authority.wave5_selection_decision_sha256 = sha256(decisionBytes);
batch.articles = [...retained, ...additions];
batch.policy.prior_verified_article_count = retained.length;
batch.policy.exact_admitted_count = batch.articles.length;
batch.policy.exact_admitted_slate_sha256 = sha256(JSON.stringify(sortDeep(batch.articles)));
batch.admission_audit = {
  admitted_article_count: batch.articles.length,
  selection_ranks: batch.articles.map((article) => article.selection_rank),
  duplicate_program_row_ids: [],
  duplicate_slugs: [],
  quality_gated_continuous_release: true,
};

const output = `${JSON.stringify(batch, null, 2)}\n`;
await writeFile(batchPath, output);
await writeFile(
  batchSidecarPath,
  `${sha256(Buffer.from(output))}  config/mrx1000-release-10-batch.json\n`,
);
console.log(
  `Admitted ${additions.length} Wave 5 rows; total reviewed manifest rows: ${batch.articles.length}.`,
);
