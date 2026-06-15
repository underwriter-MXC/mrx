import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Verify the [category].astro loader produces a description that
 * fits the canonical 160-char SEO budget for every category, even
 * when the JSON description + the suffix would exceed 160 chars.
 *
 * Mirrors the slice logic in src/pages/blog/category/[category].astro.
 */
const SUFFIX = ` Read step-by-step guides and a free, no-pressure underwriter review from MRX.`;
const TRIM = (desc: string): string => {
  const composed = `${desc}${SUFFIX}`;
  if (composed.length <= 160) return composed;
  return `${desc.slice(0, 160 - SUFFIX.length - 2).replace(/[\s,.;:]+$/, '')}. ${SUFFIX}`;
};

describe('blog/category description length budget', () => {
  const CATEGORIES_DIR = join(process.cwd(), 'src/content/categories');

  for (const slug of [
    'tax-legal',
    'valuation',
    'understanding-mineral-rights',
    'selling-process',
    'competing-offers',
    'texas-oil-gas',
    'mineral-rights',
  ]) {
    it(`category "${slug}" composes a description <= 160 chars`, () => {
      const raw = JSON.parse(
        readFileSync(join(CATEGORIES_DIR, `${slug}.json`), 'utf-8'),
      ) as { description: string };
      const composed = TRIM(raw.description);
      expect(composed.length, `category "${slug}" description length: ${composed.length}`).toBeLessThanOrEqual(160);
      // Sanity: the description must always end with the canonical suffix.
      expect(composed).toContain(SUFFIX);
    });
  }
});
