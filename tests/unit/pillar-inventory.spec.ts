import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PILLAR_ARCHIVE_FIRST_PAGE_PATHS,
  PILLAR_ARCHIVE_PAGE_SIZE,
  pillarArchivePageNumbers,
  pillarArchivePath,
  pillarArchiveStaticPaths,
} from '../../src/lib/pillar-inventory-pure';
import { ARTICLE_PILLARS } from '../../src/lib/content-graph';

/**
 * MRX1000-041 pillar-inventory unit tests. The pillar inventory helper
 * is the single source of truth for downward article enumeration across
 * all 9 canonical pillars. These tests pin down the synchronous parts
 * of its contract (page numbering, canonical paths, pillar coverage).
 * The full `getPillarInventoryPage` pipeline (which calls Astro's
 * `getCollection`) is exercised by the E2E build / Playwright spec.
 */
describe('pillar inventory contract', () => {
  it('exports a stable page size used by every pillar surface', () => {
    expect(PILLAR_ARCHIVE_PAGE_SIZE).toBe(12);
  });

  it('exposes every canonical pillar path as a known first-page target', () => {
    for (const pillar of Object.values(ARTICLE_PILLARS)) {
      expect(PILLAR_ARCHIVE_FIRST_PAGE_PATHS.has(pillar.path)).toBe(true);
    }
  });

  it('produces zero additional pages when the inventory fits the canonical first page', () => {
    expect(pillarArchivePageNumbers(0)).toEqual([]);
    expect(pillarArchivePageNumbers(12)).toEqual([]);
    expect(pillarArchivePageNumbers(1)).toEqual([]);
  });

  it('produces a single /page/2/ route when an inventory overflows by any amount', () => {
    expect(pillarArchivePageNumbers(13)).toEqual([2]);
    expect(pillarArchivePageNumbers(24)).toEqual([2]);
    expect(pillarArchivePageNumbers(25)).toEqual([2, 3]);
  });

  it('turns synthetic 13/25-post inventories into exact Astro route contracts', () => {
    expect(pillarArchiveStaticPaths(13)).toEqual([{ params: { page: '2' } }]);
    expect(pillarArchiveStaticPaths(25)).toEqual([
      { params: { page: '2' } },
      { params: { page: '3' } },
    ]);
    expect(pillarArchiveStaticPaths(12)).toEqual([]);
  });

  it('scales the additional-page list linearly with inventory growth', () => {
    expect(pillarArchivePageNumbers(120)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pillarArchivePageNumbers(12 * 42)).toHaveLength(41);
  });

  it('gives every canonical pillar a count-driven continuation route', () => {
    const routes: Record<keyof typeof ARTICLE_PILLARS, string> = {
      'sell-mineral-rights': 'src/pages/sell-mineral-rights/page/[page].astro',
      'mineral-rights-value': 'src/pages/mineral-rights-value/page/[page].astro',
      'offer-review': 'src/pages/offer-review/page/[page].astro',
      'inherited-mineral-rights': 'src/pages/inherited-mineral-rights/page/[page].astro',
      'oil-and-gas-royalties': 'src/pages/learning-center/oil-and-gas-royalties/page/[page].astro',
      'mineral-rights-taxes': 'src/pages/learning-center/mineral-rights-taxes/page/[page].astro',
      'texas-mineral-rights': 'src/pages/mineral-rights/texas/page/[page].astro',
      'title-lease-ownership': 'src/pages/learning-center/title-lease-ownership/page/[page].astro',
      'mrx-methodology': 'src/pages/methodology/page/[page].astro',
    };

    for (const [pillarId, route] of Object.entries(routes)) {
      const absolute = join(process.cwd(), route);
      expect(existsSync(absolute), route).toBe(true);
      const source = readFileSync(absolute, 'utf8');
      expect(source).toContain(`const PILLAR_ID = '${pillarId}' as const`);
      // Astro hoists getStaticPaths into module scope, so keep the argument an
      // explicit literal while pinning it to the same id used by the renderer.
      expect(source).toContain(`getPillarArchiveStaticPaths('${pillarId}')`);
      expect(source).not.toMatch(/pillarArchivePageNumbers\(\s*1\s*\)/);
    }

    // The shared helper must derive the route count from the fail-closed public
    // collection, never from a planned quota or placeholder literal.
    const helper = readFileSync(join(process.cwd(), 'src/lib/pillar-inventory.ts'), 'utf8');
    expect(helper).toContain('const posts = await getPostsForPillar(pillarId)');
    expect(helper).toContain('return pillarArchiveStaticPaths(posts.length)');
  });

  it('lets static pillar inventories use the same automatic pagination contract', () => {
    const staticInventory = readFileSync(
      join(process.cwd(), 'src/components/organisms/StaticPillarInventory.astro'),
      'utf8',
    );
    expect(staticInventory).not.toContain('pagination="off"');
    expect(staticInventory).not.toContain("ctaHref={overflow ? '/learning-center/'");
    const inventory = readFileSync(
      join(process.cwd(), 'src/components/organisms/PillarInventory.astro'),
      'utf8',
    );
    expect(inventory).toMatch(/pagination\?:.*'auto'\s*\|\s*'off'/);
    expect(inventory).toContain('renderPagination');
  });

  it('builds a canonical first-page path and a /page/{n}/ continuation', () => {
    const pillar = ARTICLE_PILLARS['mineral-rights-taxes'];
    expect(pillarArchivePath(pillar)).toBe('/learning-center/mineral-rights-taxes/');
    expect(pillarArchivePath(pillar, 1)).toBe('/learning-center/mineral-rights-taxes/');
    expect(pillarArchivePath(pillar, 4)).toBe('/learning-center/mineral-rights-taxes/page/4/');
  });

  it('builds paginated paths for state-pillar surfaces too', () => {
    const texas = ARTICLE_PILLARS['texas-mineral-rights'];
    expect(pillarArchivePath(texas)).toBe('/mineral-rights/texas/');
  });

  it('covers every canonical pillar id (9 pillars, no orphans)', () => {
    expect(Object.keys(ARTICLE_PILLARS)).toHaveLength(9);
    for (const id of Object.keys(ARTICLE_PILLARS)) {
      expect(ARTICLE_PILLARS[id as keyof typeof ARTICLE_PILLARS].path).toMatch(/^\/.+\/$/);
    }
  });

  it('keeps every canonical pillar path under the canonical-trailing-slash form', () => {
    const slugs = new Set<string>();
    for (const pillar of Object.values(ARTICLE_PILLARS)) {
      expect(pillar.path.endsWith('/')).toBe(true);
      expect(pillar.path.startsWith('//')).toBe(false);
      // No duplicate path slugs across pillars.
      slugs.add(pillar.path);
    }
    expect(slugs.size).toBe(9);
  });

  it('drives fail-closed counts directly from the fail-closed published inventory', () => {
    const postsDir = join(process.cwd(), 'src', 'content', 'posts');
    const files = readdirSync(postsDir).filter((f) => f.endsWith('.mdx'));
    let published = 0;
    for (const file of files) {
      const source = readFileSync(join(postsDir, file), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const pubMatch = /^publication_status:\s*(.+)$/m.exec(frontmatter);
      const pub = pubMatch?.[1]?.trim();
      const noiMatch = /^noindex:\s*(.+)$/m.exec(frontmatter);
      const noi = noiMatch?.[1]?.trim();
      if (pub === 'published' && noi !== 'true') published += 1;
    }
    expect(published).toBeGreaterThan(0);
    // Current corpus invariant: no published+noindex rows should ever
    // escape to the public surface. The pillar-inventory helper uses
    // isPublishedPost (fail closed) so this invariant is structural.
    const publishedWithNoindex = files.filter((file) => {
      const source = readFileSync(join(postsDir, file), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const pub = /^publication_status:\s*published\s*$/m.test(frontmatter);
      const noi = /^noindex:\s*true\s*$/m.test(frontmatter);
      return pub && noi;
    });
    expect(publishedWithNoindex).toEqual([]);
  });
});
