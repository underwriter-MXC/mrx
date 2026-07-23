import { ARTICLE_PILLARS, type PillarDefinition } from './content-graph';
import type { ArticlePillar } from './astro/content';

/**
 * Pillar inventory: pure (Astro-free) helpers for downward article
 * enumeration across any of the 9 canonical MRX1000 pillar surfaces.
 *
 * This module deliberately avoids `astro:content` so it can be unit
 * tested in a plain Vitest context. The Astro-bound `getCollection`
 * lookup lives in `pillar-inventory.ts` and is exercised by the
 * Playwright E2E spec at build time.
 *
 * Concerns owned here:
 *   1. canonical trailing-slash paths for every pillar;
 *   2. deterministic paginated path generation (`page/2/` … `page/N/`);
 *   3. the constant `PILLAR_ARCHIVE_PAGE_SIZE` used by every surface.
 */
export const PILLAR_ARCHIVE_PAGE_SIZE = 12;

export const PILLAR_ARCHIVE_FIRST_PAGE_PATHS = new Set<string>(
  Object.values(ARTICLE_PILLARS).map((pillar) => pillar.path),
);

export function pillarArchivePath(pillar: PillarDefinition, page = 1): string {
  return page <= 1 ? pillar.path : `${pillar.path}page/${page}/`;
}

/**
 * Static-paths entries for a paginated pillar archive. Returns an
 * empty array when the inventory fits on the canonical first page so
 * callers can emit a single canonical route and avoid empty
 * `/page/2/` archives that no crawler should follow.
 */
export function pillarArchivePageNumbers(
  totalPosts: number,
  pageSize = PILLAR_ARCHIVE_PAGE_SIZE,
): number[] {
  const lastPage = Math.max(1, Math.ceil(totalPosts / pageSize));
  return Array.from({ length: Math.max(0, lastPage - 1) }, (_, index) => index + 2);
}

export type PillarArchiveStaticPath = {
  params: { page: string };
};

/**
 * Convert an inventory count into Astro getStaticPaths entries. Keeping this
 * transformation pure makes the overflow-route contract testable without an
 * Astro content runtime: 12 or fewer public posts emit no continuation route,
 * while every larger inventory emits only the required page/2+ routes.
 */
export function pillarArchiveStaticPaths(
  totalPosts: number,
  pageSize = PILLAR_ARCHIVE_PAGE_SIZE,
): PillarArchiveStaticPath[] {
  return pillarArchivePageNumbers(totalPosts, pageSize).map((page) => ({
    params: { page: String(page) },
  }));
}

export type { ArticlePillar, PillarDefinition };
