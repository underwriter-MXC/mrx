#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const sidecarPath = `${batchPath}.sha256`;
const decisionPath = 'docs/governance/mrx1000-wave8-selection-decision-2026-08-06.md';
const materializedAt = '2026-08-06T11:30:00Z';

const specifications = [
  [61, 'MRX1000-0426', 'can-you-put-mineral-rights-in-a-trust-texas-estate-planning-explained', 'Can You Put Mineral Rights in a Trust? Texas Estate Planning Explained', 'inherited-mineral-rights', 'inherited-estate-probate', '/assets/articles/mineral-rights-trust-estate-plan-wave8.webp', 'aaa4254bf91516258057d8fdaa681526251f2b14aff235e2fefeaa3068b895e4'],
  [62, 'MRX1000-0428', 'how-selling-mineral-rights-affects-your-estate-plan-in-texas', 'How Selling Mineral Rights Affects Your Estate Plan in Texas', 'inherited-mineral-rights', 'inherited-estate-probate', '/assets/articles/selling-minerals-estate-plan-wave8.webp', 'e6d5bf568745bc9630bc03076f03845aadf76a1bce82530be7223664e40bca3e'],
  [63, 'MRX1000-0436', 'understanding-the-probate-process-for-mineral-interests', 'Understanding the Probate Process for Mineral Interests', 'inherited-mineral-rights', 'inherited-estate-probate', '/assets/articles/probate-mineral-interest-process-wave8.webp', '0be0ac6b3fd8262359730213d0d0e599c4234896abee1b079c2ba0202cbf640b'],
  [64, 'MRX1000-0527', 'how-to-interpret-your-mineral-rights-royalty-checks', 'How to Interpret Your Mineral Rights Royalty Checks', 'oil-and-gas-royalties', 'royalties-owner-operations', '/assets/articles/royalty-check-interpretation-wave8.webp', 'eb786ca505bb9b52a907d9b534a19ffb4e3c706ffc0a3b623ba462786ae7030f'],
  [65, 'MRX1000-0626', '1031-exchange-for-mineral-rights-does-it-qualify-and-how-does-it-work', '1031 Exchange for Mineral Rights: Does It Qualify and How Does It Work?', 'mineral-rights-taxes', 'tax-1031-legal-education', '/assets/articles/mineral-rights-1031-qualification-wave8.webp', '98758b1873858b079346684f70a3bae6ac99f067e6ab256a4b7c74d799208d55'],
  [66, 'MRX1000-0628', '1031-exchange-vs-traditional-sales-for-mineral-rights', '1031 Exchange vs. Traditional Sales for Mineral Rights', 'mineral-rights-taxes', 'tax-1031-legal-education', '/assets/articles/1031-vs-taxable-sale-wave8.webp', '75728221ccf91bd86f5dec9ee23cdcf9c8140ea8f6f22e02171283f1c498a7d9'],
  [67, 'MRX1000-0634', 'how-to-report-a-mineral-rights-sale-on-your-federal-tax-return', 'How to Report a Mineral Rights Sale on Your Federal Tax Return', 'mineral-rights-taxes', 'tax-1031-legal-education', '/assets/articles/federal-tax-reporting-mineral-sale-wave8.webp', '914399756bc12c432dc62018fad716b47ba160b72489c2e6da15efef4d854ff1'],
  [68, 'MRX1000-0953', 'can-you-discuss-assessment-outcomes-with-your-underwriter-after-their-review', 'Can You Discuss Assessment Outcomes With Your Underwriter After Their Review?', 'mrx-methodology', 'mrx-methodology-transparency-underwriter-process', '/assets/articles/post-review-outcomes-wave8.webp', '3546d280c5363681f1588ebb9e43761e1d970a54cf6f7bf54e83bb5214094f4a'],
  [69, 'MRX1000-0957', 'discover-which-types-of-texas-mineral-rights-qualify-for-a-free-underwriter-assessment', 'Discover Which Types of Texas Mineral Rights Qualify for a Free Underwriter Assessment', 'mrx-methodology', 'mrx-methodology-transparency-underwriter-process', '/assets/articles/eligible-texas-interest-types-wave8.webp', '3732ae74decb40ad23b8831d0cb1da6a569045ed9bbea324dd7466b496cb5c7f'],
  [70, 'MRX1000-0965', 'how-to-get-a-free-underwriter-review-of-mineral-rights', 'How to Get a Free Underwriter Review of Mineral Rights', 'mrx-methodology', 'mrx-methodology-transparency-underwriter-process', '/assets/articles/start-free-underwriter-review-wave8.webp', '6d054449bf097acce7d68d464400b7147cf1408868311e081fee89852c1ba769'],
].map(
  ([selection_rank, program_row_id, slug, title, pillar, cluster, hero_path, archive_evidence_sha256]) => ({
    selection_rank,
    program_row_id,
    slug,
    title,
    pillar,
    cluster,
    hero_path,
    archive_evidence_sha256,
  }),
);

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
const retained = batch.articles.filter((article) => article.selection_rank <= 60);
if (retained.length !== 60) throw new Error(`Expected 60 retained entries; observed ${retained.length}`);

const additions = [];
for (const specification of specifications) {
  const repoPath = `src/content/posts/${specification.slug}.mdx`;
  const bodyBytes = await readFile(join(root, repoPath));
  const body = bodyBytes.toString('utf8');
  if (!/^publication_status:\s*draft$/m.test(body) || !/^noindex:\s*true$/m.test(body)) {
    throw new Error(`${specification.slug} must be in reviewed draft/noindex state`);
  }
  const title = body.match(/^title:\s*['"](.+)['"]$/m)?.[1];
  const heroAlt = body.match(/^  alt:\s*['"](.+)['"]$/m)?.[1];
  const socialAlt = body.match(/^  social_alt:\s*['"](.+)['"]$/m)?.[1];
  if (title !== specification.title || heroAlt !== specification.title || socialAlt !== specification.title) {
    throw new Error(`${specification.slug} title or exact-title hero/social alt mismatch`);
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
      'Continuous quality-gated admission under D-2026-0804-16 and MRX1000-W8-SELECT-2026-08-06; no numerical cap or observation-window gate applies.',
      'Publication remains conditional on current editorial, factual/citation, compliance, exact-title asset, build, rollback, deployment, and live-verification evidence.',
    ],
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${specification.slug}.json`,
    evidence_packet_path_required: true,
  });
}

batch.evidence_scaffold_generated_at_utc = materializedAt;
batch.decision_authority.wave8_selection_decision_id = 'MRX1000-W8-SELECT-2026-08-06';
batch.decision_authority.wave8_selection_decision_path = decisionPath;
batch.decision_authority.wave8_selection_decision_sha256 = sha256(decisionBytes);
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
  sidecarPath,
  `${sha256(Buffer.from(output))}  config/mrx1000-release-10-batch.json\n`,
);
console.log(
  `Admitted ${additions.length} Wave 8 rows; total reviewed manifest rows: ${batch.articles.length}.`,
);
