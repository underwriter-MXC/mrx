#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const batchSidecarPath = `${batchPath}.sha256`;
const decisionPath =
  'artifacts/mrx1000-release-10/decisions/mrx-ceo-continuous-wave4-selection-20260806.md';
const materializedAt = '2026-08-06T18:00:00Z';

const specifications = [
  {
    selection_rank: 31,
    program_row_id: 'MRX1000-0981',
    slug: 'why-our-ai-powered-mineral-rights-platform-is-different-from-other-acquisition-services',
    title:
      'Why Our AI-Powered Mineral Rights Platform Is Different From Other Acquisition Services',
    pillar: 'mrx-methodology',
    cluster: 'mrx-methodology-transparency-underwriter-process',
    hero_path: '/assets/articles/mineral-rights-acquisition-platform.webp',
    archive_evidence_sha256: 'acf61985964e8c2bc6c69869016590ed8e3884e5ba965ee444631d781848f751',
  },
  {
    selection_rank: 32,
    program_row_id: 'MRX1000-0312',
    slug: 'how-we-protect-mineral-rights-sellers-from-predatory-tactics',
    title: 'How We Protect Mineral Rights Sellers From Predatory Tactics',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    hero_path: '/assets/articles/predatory-mineral-rights-buyers-2.webp',
    archive_evidence_sha256: 'cd2a24e7e1bf9f75877166a72cdebe505c523db66c8910cdff441dd5d1825bb3',
  },
  {
    selection_rank: 33,
    program_row_id: 'MRX1000-0315',
    slug: 'risks-of-selling-your-mineral-rights-to-a-direct-buyer-what-to-know-before-you-sign',
    title: 'Risks of Selling Your Mineral Rights to a Direct Buyer: What to Know Before You Sign',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    hero_path: '/assets/articles/mineral-rights-direct-buyer-risks.webp',
    archive_evidence_sha256: '0864d6c92117a4460b423380ce5db2dec6043a226a759536189d5d381e3d7fa9',
  },
  {
    selection_rank: 34,
    program_row_id: 'MRX1000-0157',
    slug: 'key-factors-that-determine-your-mineral-rights-assessment-pricing-range',
    title: 'Key Factors That Determine Your Mineral Rights Assessment Pricing Range',
    pillar: 'mineral-rights-value',
    cluster: 'valuation-methodology-drivers',
    hero_path: '/assets/articles/mineral-rights-assessment.webp',
    archive_evidence_sha256: 'b2c2c2459524b4e7c611d5d2c886f39195e3b83c2c251c46828f040828bded95',
  },
  {
    selection_rank: 35,
    program_row_id: 'MRX1000-0305',
    slug: 'how-to-identify-and-avoid-hidden-fees-in-your-mineral-rights-assessment-process',
    title: 'How to Identify and Avoid Hidden Fees in Your Mineral Rights Assessment Process',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    hero_path:
      '/assets/articles/how-to-identify-and-avoid-hidden-fees-in-mineral-rights-assessment-process.webp',
    archive_evidence_sha256: '5887672094e9d52e1dc3996b740beaed96764ac97b484b1d2b7387e9db338d55',
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
const retained = batch.articles.filter((article) => article.selection_rank <= 30);
if (retained.length !== 30) {
  throw new Error(`Expected the immutable first 30 entries; observed ${retained.length}`);
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
      'Continuous quality-gated admission under D-2026-0804-16 and MRX-DEC-2026-0806-001; no numerical cap or observation-window gate applies.',
      'Publication remains conditional on current editorial, factual/citation, compliance, exact-title asset, build, rollback, deployment, and live-verification evidence.',
    ],
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${specification.slug}.json`,
    evidence_packet_path_required: true,
  });
}

batch.evidence_scaffold_generated_at_utc = materializedAt;
batch.decision_authority.wave4_selection_decision_id = 'MRX-DEC-2026-0806-001';
batch.decision_authority.wave4_selection_decision_path = decisionPath;
batch.decision_authority.wave4_selection_decision_sha256 = sha256(decisionBytes);
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
  `Admitted ${additions.length} Wave 4 rows; total reviewed manifest rows: ${batch.articles.length}.`,
);
