import type { CollectionEntry } from 'astro:content';
import type { ArticlePillar } from './astro/content';

export type PillarDefinition = {
  id: ArticlePillar;
  label: string;
  path: string;
  defaultCta: string;
};

export const ARTICLE_PILLARS: Record<ArticlePillar, PillarDefinition> = {
  'sell-mineral-rights': {
    id: 'sell-mineral-rights',
    label: 'Selling Mineral Rights',
    path: '/sell-mineral-rights/',
    defaultCta: 'Talk Through My Selling Options',
  },
  'mineral-rights-value': {
    id: 'mineral-rights-value',
    label: 'Mineral Rights Value',
    path: '/mineral-rights-value/',
    defaultCta: 'Understand My Value Factors',
  },
  'offer-review': {
    id: 'offer-review',
    label: 'Mineral Rights Offer Review',
    path: '/offer-review/',
    defaultCta: 'Review My Written Offer',
  },
  'inherited-mineral-rights': {
    id: 'inherited-mineral-rights',
    label: 'Inherited Mineral Rights',
    path: '/inherited-mineral-rights/',
    defaultCta: 'Organize My Inherited-Rights Records',
  },
  'oil-and-gas-royalties': {
    id: 'oil-and-gas-royalties',
    label: 'Oil and Gas Royalties',
    path: '/learning-center/oil-and-gas-royalties/',
    defaultCta: 'Review My Royalty Information',
  },
  'mineral-rights-taxes': {
    id: 'mineral-rights-taxes',
    label: 'Mineral Rights Taxes and 1031 Exchanges',
    path: '/learning-center/mineral-rights-taxes/',
    defaultCta: 'Prepare Questions for My Adviser',
  },
  'texas-mineral-rights': {
    id: 'texas-mineral-rights',
    label: 'Texas Mineral Rights',
    path: '/mineral-rights/texas/',
    defaultCta: 'Discuss My Texas Mineral Rights',
  },
  'title-lease-ownership': {
    id: 'title-lease-ownership',
    label: 'Title, Leases, and Ownership',
    path: '/learning-center/title-lease-ownership/',
    defaultCta: 'Organize My Ownership Documents',
  },
  'mrx-methodology': {
    id: 'mrx-methodology',
    label: 'MRX Methodology and Transparency',
    path: '/methodology/',
    defaultCta: 'Talk With the MRX Team',
  },
};

/**
 * MRX1000 / Learning Center content clusters.
 * Source: src/content/config.ts (ContentCluster enum).
 * Re-declared here so the content-graph module stays free of any
 * astro:content / zod import dependency for downstream consumers
 * (tests, scripts, Astro pages) that import by name.
 */
export const CONTENT_CLUSTERS = [
  'sell-mineral-rights-decision-process',
  'valuation-methodology-drivers',
  'offer-review-buyer-comparison-safety',
  'inherited-estate-probate',
  'royalties-owner-operations',
  'tax-1031-legal-education',
  'texas-county-basin-local-intent',
  'title-lease-ownership-documents',
  'mrx-methodology-transparency-underwriter-process',
] as const;

export type ContentCluster = (typeof CONTENT_CLUSTERS)[number];

/**
 * Deterministic content_cluster → pillar mapping. Every MRX1000 cluster
 * resolves to exactly one ArticlePillar; no cluster is left unmapped.
 * Order is preserved (cluster index i → pillar at index i) so the table
 * is the single source of truth for the 1:1 cluster-to-pillar contract.
 */
export const CONTENT_CLUSTER_TO_PILLAR: Record<ContentCluster, ArticlePillar> = {
  'sell-mineral-rights-decision-process': 'sell-mineral-rights',
  'valuation-methodology-drivers': 'mineral-rights-value',
  'offer-review-buyer-comparison-safety': 'offer-review',
  'inherited-estate-probate': 'inherited-mineral-rights',
  'royalties-owner-operations': 'oil-and-gas-royalties',
  'tax-1031-legal-education': 'mineral-rights-taxes',
  'texas-county-basin-local-intent': 'texas-mineral-rights',
  'title-lease-ownership-documents': 'title-lease-ownership',
  'mrx-methodology-transparency-underwriter-process': 'mrx-methodology',
};

/**
 * Public conversion target. Article CTAs normalize to this path so the
 * MRX1000 internal_links triangle stays consistent across all articles.
 */
export const MRX_CONVERSION_PATH = '/book/';

/**
 * Resolved crawlable internal links for an article. Hub is the parent
 * Learning Center pillar; sibling is a same-cluster contextual anchor.
 * Both fall back to safe public surface if the frontmatter omits them.
 */
export type ResolvedInternalLinks = {
  hub: { label: string; href: string };
  sibling: { label: string; href: string };
  conversion: { label: string; href: string; name: 'article-review-cta' };
};

type Post = CollectionEntry<'posts'>;

const ALLOWED_CONTEXT_PATHS = new Set([
  '/learning-center/',
  '/how-it-works/',
  '/methodology/',
  ...Object.values(ARTICLE_PILLARS).map((pillar) => pillar.path),
]);

function normalizeInternalPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  const pathOnly = trimmed.split(/[?#]/, 1)[0];
  if (!pathOnly || pathOnly.includes('\\') || pathOnly.includes('..')) return null;
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`;
}

function postPublicPath(post: Post): string {
  return `/blog/${post.id.replace(/\.mdx?$/, '')}/`;
}

/**
 * Fail-closed publication predicate. A post is published only when ALL
 * three conditions hold:
 *   1. publication_status === 'published'
 *   2. draft !== true
 *   3. noindex !== true
 * Any row that violates one of these gates is excluded from public
 * routes, RSS, sitemap, llms-full.txt, and any consumer that depends
 * on this predicate. The noindex clause closes the escape hatch that
 * previously allowed a `published` + `noindex: true` row to leak.
 */
export function isPublishedPost(post: Post): boolean {
  const status = post.data.publication_status ?? 'draft';
  if (status !== 'published') return false;
  if (post.data.draft === true) return false;
  if (post.data.noindex === true) return false;
  return true;
}

/**
 * Resolve the canonical pillar for a post, in priority order:
 *   1. Explicit `pillar` frontmatter (author override).
 *   2. `content_cluster` mapped deterministically via
 *      CONTENT_CLUSTER_TO_PILLAR (the MRX1000 contract).
 *   3. Legacy content text regex (pre-MRX1000 articles).
 * Legacy fallback is only reached when both explicit pillar and
 * content_cluster are absent, so MRX1000 rows can never silently
 * fall back into the regex path.
 */
export function resolvePillar(post: Post): PillarDefinition {
  if (post.data.pillar) return ARTICLE_PILLARS[post.data.pillar];

  const cluster = post.data.content_cluster;
  if (cluster && cluster in CONTENT_CLUSTER_TO_PILLAR) {
    return ARTICLE_PILLARS[CONTENT_CLUSTER_TO_PILLAR[cluster as ContentCluster]];
  }

  const haystack = [
    post.data.title,
    post.data.description,
    post.data.category,
    ...(post.data.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const rules: Array<[ArticlePillar, RegExp]> = [
    ['inherited-mineral-rights', /\b(inherit|heir|estate|probate|executor|trust)\b/],
    ['mineral-rights-taxes', /\b(1031|tax|taxes|capital gains|severance)\b/],
    ['offer-review', /\b(offer|buyer|lowball|predatory|scam|red flag|competing)\b/],
    [
      'title-lease-ownership',
      /\b(title|deed|conveyance|lease|division order|surface rights|ownership)\b/,
    ],
    ['oil-and-gas-royalties', /\b(royalty|royalties|royalty check|production payment)\b/],
    ['mineral-rights-value', /\b(value|valuation|worth|pricing|assessment|appraisal)\b/],
    ['texas-mineral-rights', /\b(texas|permian|eagle ford|midland|delaware basin|county)\b/],
    ['mrx-methodology', /\b(mrx|mineralrightsxchange|underwriter|methodology|transparency)\b/],
  ];

  return ARTICLE_PILLARS[
    rules.find(([, pattern]) => pattern.test(haystack))?.[0] ?? 'sell-mineral-rights'
  ];
}

/**
 * Resolve the canonical cluster identifier for a post. The MRX1000
 * `content_cluster` field wins over legacy `cluster`, `keyword_cluster`,
 * and `category` so published MRX1000 articles always carry their
 * declared taxonomy.
 */
export function resolveCluster(post: Post): string {
  return (
    post.data.content_cluster ??
    post.data.cluster ??
    post.data.keyword_cluster ??
    post.data.category ??
    ''
  );
}

/**
 * Build the article CTA trio from frontmatter overrides and pillar
 * defaults. Honors `conversion_cta` so authors can override label/href,
 * but the default href stays anchored to the conversion triangle
 * target (/book/) for any post that does not opt in.
 */
export function articleCta(post: Post) {
  const pillar = resolvePillar(post);
  return {
    label: post.data.conversion_cta?.label ?? pillar.defaultCta,
    href: post.data.conversion_cta?.href ?? MRX_CONVERSION_PATH,
    prompt:
      post.data.conversion_cta?.prompt ??
      `I was reading “${post.data.title}” and would like help understanding what it means for my mineral rights.`,
  };
}

/**
 * Resolve the crawlable internal-links triangle. Hub is the pillar
 * path (or the canonical Learning Center fallback). Sibling is the
 * post's own `internal_links.sibling`, else a same-cluster sibling
 * resolved via relatedPosts, else the pillar path. Conversion is
 * always /book/ per the MRX1000 contract.
 *
 * The result exposes label + href so the rendering layer can emit
 * plain <a href> tags that crawlers follow without any JS gating.
 */
export function resolveInternalLinks(post: Post, allPublished: Post[] = []): ResolvedInternalLinks {
  const pillar = resolvePillar(post);
  const triangle = post.data.internal_links;
  const cluster = resolveCluster(post);
  const publishedPosts = allPublished.filter(isPublishedPost);
  const publishedArticlePaths = new Set(publishedPosts.map(postPublicPath));
  const configuredHub = normalizeInternalPath(triangle?.hub);
  const hubHref =
    configuredHub && ALLOWED_CONTEXT_PATHS.has(configuredHub) ? configuredHub : pillar.path;
  const configuredSibling = normalizeInternalPath(triangle?.sibling);
  const configuredSiblingIsSafe = Boolean(
    configuredSibling &&
    configuredSibling !== hubHref &&
    configuredSibling !== pillar.path &&
    (ALLOWED_CONTEXT_PATHS.has(configuredSibling) || publishedArticlePaths.has(configuredSibling)),
  );

  let siblingHref: string;
  let siblingLabel: string;
  if (configuredSiblingIsSafe && configuredSibling) {
    siblingHref = configuredSibling;
    siblingLabel = `Continue exploring ${pillar.label.toLowerCase()}`;
  } else {
    const sameCluster = publishedPosts.find(
      (candidate) => candidate.id !== post.id && resolveCluster(candidate) === cluster,
    );
    if (sameCluster) {
      siblingHref = postPublicPath(sameCluster);
      siblingLabel = `Read another ${pillar.label.toLowerCase()} article`;
    } else {
      siblingHref = pillar.path;
      siblingLabel = `See all ${pillar.label.toLowerCase()} articles`;
    }
  }

  return {
    hub: {
      label:
        hubHref === '/learning-center/' ? 'Back to the Learning Center' : `Back to ${pillar.label}`,
      href: hubHref,
    },
    sibling: {
      label: siblingLabel,
      href: siblingHref,
    },
    conversion: {
      label: pillar.defaultCta,
      href: MRX_CONVERSION_PATH,
      name: 'article-review-cta',
    },
  };
}

export function relatedPosts(current: Post, candidates: Post[], limit = 4): Post[] {
  const explicit = new Set(current.data.related_articles ?? []);
  const currentPillar = resolvePillar(current).id;
  const currentCluster = resolveCluster(current);
  const currentTags = new Set(current.data.tags ?? []);
  const currentTerms = meaningfulTerms(current.data.title);

  return candidates
    .filter((candidate) => candidate.id !== current.id && isPublishedPost(candidate))
    .map((candidate) => {
      const slug = candidate.id.replace(/\.mdx?$/, '');
      let score = explicit.has(slug) ? 100 : 0;
      if (resolveCluster(candidate) === currentCluster && currentCluster !== '') score += 12;
      if (resolvePillar(candidate).id === currentPillar) score += 7;
      if (candidate.data.category === current.data.category) score += 4;
      score += (candidate.data.tags ?? []).filter((tag) => currentTags.has(tag)).length * 3;
      score += [...meaningfulTerms(candidate.data.title)].filter((term) =>
        currentTerms.has(term),
      ).length;
      return { candidate, score, slug };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.candidate.data.published_at).getTime() -
          new Date(a.candidate.data.published_at).getTime() ||
        a.slug.localeCompare(b.slug),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function meaningfulTerms(title: string): Set<string> {
  const stop = new Set([
    'about',
    'after',
    'before',
    'does',
    'explained',
    'from',
    'guide',
    'have',
    'mineral',
    'minerals',
    'rights',
    'that',
    'their',
    'what',
    'when',
    'your',
  ]);
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((term) => term.length > 3 && !stop.has(term)),
  );
}
