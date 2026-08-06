#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const sidecarPath = `${batchPath}.sha256`;
const decisionPath = 'docs/governance/mrx1000-wave10-selection-decision-2026-08-06.md';
const materializedAt = '2026-08-06T13:30:00Z';

const specifications = [
  [
    81,
    'MRX1000-0627',
    '1031-exchange-for-mineral-rights-in-texas-explained',
    '1031 Exchange for Mineral Rights in Texas Explained',
    'mineral-rights-taxes',
    'tax-1031-legal-education',
    '/assets/articles/texas-mineral-1031-exchange-wave10.webp',
    '77a26b9c9c5c6d2b0e6e32f149cea5cacf9d84bc0d05a881014ae6a625ab3be0',
  ],
  [
    82,
    'MRX1000-0635',
    'maximize-gains-with-1031-exchange-for-texas-mineral-rights',
    'Maximize Gains With 1031 Exchange for Texas Mineral Rights',
    'mineral-rights-taxes',
    'tax-1031-legal-education',
    '/assets/articles/texas-mineral-1031-gain-planning-wave10.webp',
    '5e4312e3d28b1625ddd965b09bad115852ee15d4d759c54e9729c667da28d8ac',
  ],
  [
    83,
    'MRX1000-0437',
    'what-happens-to-mineral-rights-in-probate',
    'What Happens to Mineral Rights in Probate?',
    'inherited-mineral-rights',
    'inherited-estate-probate',
    '/assets/articles/mineral-rights-probate-outcomes-wave10.webp',
    'bb378a4fdbe9f4411b082ba01fb876bad12217ee9a81d3862e1e20603e129272',
  ],
  [
    84,
    'MRX1000-0433',
    'understanding-estate-planning-for-inherited-mineral-rights',
    'Understanding Estate Planning for Inherited Mineral Rights',
    'inherited-mineral-rights',
    'inherited-estate-probate',
    '/assets/articles/inherited-mineral-estate-plan-wave10.webp',
    '0ccd4bb645f6bf681b57d7bf36487c9234b87213ba0e6ea0b2cda86d3c067c56',
  ],
  [
    85,
    'MRX1000-0529',
    'understanding-your-mineral-royalty-checks-value',
    'Understanding Your Mineral Royalty Checks Value',
    'oil-and-gas-royalties',
    'royalties-owner-operations',
    '/assets/articles/royalty-check-value-signals-wave10.webp',
    '9f2b113f3b61ef3673b062f6022312faeeae516fe5cc515fe43b1d9ab0279ee5',
  ],
  [
    86,
    'MRX1000-0730',
    'how-to-determine-the-value-of-texas-mineral-rights',
    'How to Determine the Value of Texas Mineral Rights',
    'texas-mineral-rights',
    'texas-county-basin-local-intent',
    '/assets/articles/texas-mineral-value-workflow-wave10.webp',
    '14a1ac51c702607e55b7da99b15fa156dd7bc2fea6f4b3d1e7764e504bdd2d6d',
  ],
  [
    87,
    'MRX1000-0735',
    'unlocking-value-assessing-your-texas-mineral-rights',
    'Unlocking Value: Assessing Your Texas Mineral Rights',
    'texas-mineral-rights',
    'texas-county-basin-local-intent',
    '/assets/articles/texas-mineral-value-levers-wave10.webp',
    '8c7877f489854e6857c44aec8da0903107c9847fee7434dbe296bfb0a2591364',
  ],
  [
    88,
    'MRX1000-0311',
    'how-to-spot-predatory-mineral-rights-offers',
    'How to Spot Predatory Mineral Rights Offers',
    'offer-review',
    'offer-review-buyer-comparison-safety',
    '/assets/articles/mineral-offer-red-flags-wave10.webp',
    'cebce7069996622aeda687cdb3922ed9782c3154ec388650dd5e9c945197b9db',
  ],
  [
    89,
    'MRX1000-0320',
    'what-to-do-when-you-have-competing-offers-on-your-mineral-rights-a-guide',
    'What to Do When You Have Competing Offers on Your Mineral Rights: A Guide',
    'offer-review',
    'offer-review-buyer-comparison-safety',
    '/assets/articles/competing-mineral-offers-action-plan-wave10.webp',
    '6abbf049608c85a6de2d8742f6aee09f86d9b29e989ce262ffb6ac3083a2d0d4',
  ],
  [
    90,
    'MRX1000-0161',
    'understanding-the-value-of-your-mineral-rights',
    'Understanding the Value of Your Mineral Rights',
    'mineral-rights-value',
    'valuation-methodology-drivers',
    '/assets/articles/mineral-rights-value-primer-wave10.webp',
    '5b363102c39a1488f0882f8f64dc99ff79a073cbca50345b186709620fc969cd',
  ],
].map(
  ([
    selection_rank,
    program_row_id,
    slug,
    title,
    pillar,
    cluster,
    hero_path,
    archive_evidence_sha256,
  ]) => ({
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

function buildReviewedDraftSnapshot(source, slug) {
  const match = source.match(/^---(\r?\n)([\s\S]*?)\1---/);
  if (!match) throw new Error(`${slug} frontmatter not detected`);

  let reviewedFrontmatter = match[2];
  const publicationMatches = [
    ...reviewedFrontmatter.matchAll(/^publication_status:[\t ]*published[\t ]*$/gm),
  ];
  const noindexMatches = [...reviewedFrontmatter.matchAll(/^noindex:[\t ]*false[\t ]*$/gm)];
  if (publicationMatches.length !== 1 || noindexMatches.length !== 1) {
    throw new Error(
      `${slug} must contain exactly one published publication_status and one false noindex scalar`,
    );
  }

  reviewedFrontmatter = reviewedFrontmatter
    .replace(/^publication_status:([\t ]*)published([\t ]*)$/m, 'publication_status:$1draft$2')
    .replace(/^noindex:([\t ]*)false([\t ]*)$/m, 'noindex:$1true$2');
  if (!/^draft:[\t ]*false[\t ]*$/m.test(reviewedFrontmatter)) {
    throw new Error(`${slug} draft must remain false during the controlled publication transition`);
  }

  return source.replace(
    /^---(\r?\n)([\s\S]*?)\1---/,
    (_whole, newline) => `---${newline}${reviewedFrontmatter}${newline}---`,
  );
}

const batch = JSON.parse(await readFile(batchPath, 'utf8'));
const decisionBytes = await readFile(join(root, decisionPath));
const retained = batch.articles.filter((article) => article.selection_rank <= 80);
if (retained.length !== 80)
  throw new Error(`Expected 80 retained entries; observed ${retained.length}`);

const additions = [];
for (const specification of specifications) {
  const repoPath = `src/content/posts/${specification.slug}.mdx`;
  const bodyBytes = await readFile(join(root, repoPath));
  const body = bodyBytes.toString('utf8');
  if (!/^publication_status:\s*published$/m.test(body) || !/^noindex:\s*false$/m.test(body)) {
    throw new Error(`${specification.slug} must be in quality-gated published/indexable state`);
  }
  const reviewedBody = buildReviewedDraftSnapshot(body, specification.slug);
  const title = body.match(/^title:\s*['"](.+)['"]$/m)?.[1];
  const heroAlt = body.match(/^  alt:\s*['"](.+)['"]$/m)?.[1];
  const socialAlt = body.match(/^  social_alt:\s*['"](.+)['"]$/m)?.[1];
  if (
    title !== specification.title ||
    heroAlt !== specification.title ||
    socialAlt !== specification.title
  ) {
    throw new Error(`${specification.slug} title or exact-title hero/social alt mismatch`);
  }

  const heroBytes = await readFile(join(root, 'public', specification.hero_path.slice(1)));
  const reviewedBodyBytes = Buffer.from(reviewedBody, 'utf8');
  const articleSha = sha256(reviewedBodyBytes);
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
    searchatlas_word_count: wordCount(reviewedBody),
    risk_citation_remediation: [
      'Continuous quality-gated admission under D-2026-0804-16 and MRX1000-W10-SELECT-2026-08-06; no numerical cap or observation-window gate applies.',
      'Publication remains conditional on current editorial, factual/citation, compliance, exact-title asset, build, rollback, deployment, and live-verification evidence.',
    ],
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${specification.slug}.json`,
    evidence_packet_path_required: true,
  });
}

batch.evidence_scaffold_generated_at_utc = materializedAt;
batch.decision_authority.wave10_selection_decision_id = 'MRX1000-W10-SELECT-2026-08-06';
batch.decision_authority.wave10_selection_decision_path = decisionPath;
batch.decision_authority.wave10_selection_decision_sha256 = sha256(decisionBytes);
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
  `Admitted ${additions.length} Wave 10 rows; total reviewed manifest rows: ${batch.articles.length}.`,
);
