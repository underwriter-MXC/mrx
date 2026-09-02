import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import {
  ARTICLE_PILLARS,
  isPublishedPost,
  resolvePillar,
  type PillarDefinition,
} from './content-graph';
import type { ArticlePillar } from './astro/content';
import { canonicalStaffSlug } from './staff-identity';

/**
 * Pillar inventory: fail-closed article enumeration for any of the 9
 * canonical MRX1000 pillar surfaces. Centralised so every pillar route
 * (data-driven hub, static marketing pillar, or state pillar) renders
 * the same curated list from the same source of truth.
 *
 * Pure helpers (page size constant, canonical paths, page numbering)
 * live in `./pillar-inventory-pure` so unit tests do not have to mock
 * the Astro content runtime. This module owns the Astro-bound
 * `getPostsForPillar` and `getPillarInventoryPage` because they need
 * the `astro:content` collection driver.
 *
 * Three concerns:
 *   1. fail-closed publication (publication_status=published, draft!=true,
 *      noindex!=true); see `isPublishedPost`;
 *   2. deterministic pillar resolution; see `resolvePillar`;
 *   3. bounded pagination; `PILLAR_ARCHIVE_PAGE_SIZE` caps the per-page
 *      card count so a quota-scale pillar (e.g. 75 articles under
 *      mineral-rights-value) does not render every card on one route.
 */
export {
  PILLAR_ARCHIVE_FIRST_PAGE_PATHS,
  PILLAR_ARCHIVE_PAGE_SIZE,
  pillarArchivePageNumbers,
  pillarArchivePath,
  pillarArchiveStaticPaths,
} from './pillar-inventory-pure';

export type PillarInventoryPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  author: string;
  authorSlug: string;
  publishedAt: string;
  readingMinutes: number;
  heroImage: string;
  heroAlt: string;
  featured: boolean;
};

export type PillarInventoryPage = {
  pillar: PillarDefinition;
  posts: PillarInventoryPost[];
  totalPosts: number;
  totalFeatured: number;
  currentPage: number;
  lastPage: number;
  pageSize: number;
};

import {
  PILLAR_ARCHIVE_PAGE_SIZE,
  pillarArchiveStaticPaths,
  type PillarArchiveStaticPath,
} from './pillar-inventory-pure';

export async function getPostsForPillar(
  pillarId: ArticlePillar,
): Promise<CollectionEntry<'posts'>[]> {
  const all = await getCollection('posts', isPublishedPost);
  return all
    .filter((post) => resolvePillar(post).id === pillarId)
    .sort(
      (a, b) =>
        Number(Boolean(b.data.featured)) - Number(Boolean(a.data.featured)) ||
        new Date(b.data.published_at).getTime() - new Date(a.data.published_at).getTime() ||
        a.id.localeCompare(b.id),
    );
}

/**
 * Build count-driven continuation paths for one canonical pillar. This must
 * always read the fail-closed public collection; callers must never pass a
 * planned quota or a literal placeholder count that could create empty routes.
 */
export async function getPillarArchiveStaticPaths(
  pillarId: ArticlePillar,
): Promise<PillarArchiveStaticPath[]> {
  const posts = await getPostsForPillar(pillarId);
  return pillarArchiveStaticPaths(posts.length);
}

export async function getPillarInventoryPage(
  pillarId: ArticlePillar,
  currentPage = 1,
  pageSize: number = PILLAR_ARCHIVE_PAGE_SIZE,
): Promise<PillarInventoryPage> {
  const pillar = ARTICLE_PILLARS[pillarId];
  const allPosts = await getPostsForPillar(pillarId);
  const totalPosts = allPosts.length;
  const totalFeatured = allPosts.filter((post) => Boolean(post.data.featured)).length;
  const lastPage = Math.max(1, Math.ceil(totalPosts / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), lastPage);
  const start = (safePage - 1) * pageSize;
  const slice = allPosts.slice(start, start + pageSize);

  const posts: PillarInventoryPost[] = slice.map((post) => ({
    slug: post.id.replace(/\.mdx?$/, ''),
    title: post.data.title,
    description: post.data.description,
    excerpt: post.data.excerpt,
    category: post.data.category,
    categoryLabel: post.data.category.replaceAll('-', ' '),
    author: canonicalStaffSlug(post.data.author.id.replace(/\.mdx?$/, '')),
    authorSlug: canonicalStaffSlug(post.data.author.id.replace(/\.mdx?$/, '')),
    publishedAt: post.data.published_at,
    readingMinutes: Math.max(
      1,
      Math.round((post.body ?? '').split(/\s+/).filter(Boolean).length / 220),
    ),
    heroImage: post.data.hero_image.src,
    heroAlt: post.data.hero_image.alt,
    featured: Boolean(post.data.featured),
  }));

  return {
    pillar,
    posts,
    totalPosts,
    totalFeatured,
    currentPage: safePage,
    lastPage,
    pageSize,
  };
}
