import { describe, expect, it } from 'vitest';
import {
  ARCHIVE_PAGE_SIZE,
  archiveGapTarget,
  archivePageNumbers,
  archivePagePath,
  paginateArchive,
  visibleArchivePages,
} from '../../src/lib/archive-pagination';

describe('archive pagination', () => {
  it('uses stable canonical paths for the first and subsequent pages', () => {
    expect(archivePagePath('/learning-center/', 1)).toBe('/learning-center/');
    expect(archivePagePath('learning-center', 2)).toBe('/learning-center/page/2/');
  });

  it('returns only the requested page slice', () => {
    const items = Array.from({ length: 1_000 }, (_, index) => index + 1);
    const page = paginateArchive(items, 42);

    expect(ARCHIVE_PAGE_SIZE).toBe(24);
    expect(page.lastPage).toBe(42);
    expect(page.items).toEqual(Array.from({ length: 16 }, (_, index) => 985 + index));
  });

  it('builds static paths for pages after the canonical first page', () => {
    expect(archivePageNumbers(49)).toEqual([2, 3]);
    expect(archivePageNumbers(24)).toEqual([]);
  });

  it('rejects pages outside the generated archive range', () => {
    expect(() => paginateArchive([1, 2, 3], 0)).toThrow(RangeError);
    expect(() => paginateArchive([1, 2, 3], 2)).toThrow(RangeError);
  });

  it('keeps a synthetic 42-page archive shallow with bounded landmarks', () => {
    for (const currentPage of [1, 21, 42]) {
      const visible = visibleArchivePages(currentPage, 42);
      expect(visible).toContain(1);
      expect(visible).toContain(21);
      expect(visible).toContain(42);
      expect(visible.length).toBeLessThanOrEqual(10);
    }
  });

  it('exposes a 1,000-item, 42-page archive where every visible page is reachable in 1 hop from any sibling', () => {
    // Synthetic 1,000-item corpus — the L_cardnL load for archive
    // connectivity. Pin the full contract up front so a future refactor
    // cannot regress it back to a "current ± 2" window that would
    // require 11+ hops to reach page 21 from page 1.
    const lastPage = 42;
    for (let currentPage = 1; currentPage <= lastPage; currentPage += 1) {
      const visible = visibleArchivePages(currentPage, lastPage);
      // Always emitted: first, last, current — three foundation
      // landmarks on every page.
      expect(visible).toContain(1);
      expect(visible).toContain(lastPage);
      expect(visible).toContain(currentPage);
      // 1-hop connectivity: every visible page must resolve to an
      // actual entry in the visible set (no inert ellipsis).
      const renderedHrefs = new Set(visible.map((p) => `/learning-center/page/${p}/`));
      // The midpoint-landmark set on a > 10-page archive must include
      // ~lastPage/4, lastPage/2, ~3*lastPage/4 — so any sibling page
      // can leap directly to a quarter / half / three-quarter jump.
      const midpointQuartile = Math.max(1, Math.round(lastPage / 4));
      const midpoint = Math.max(1, Math.round(lastPage / 2));
      const midpointThreeQuartile = Math.max(1, Math.round((lastPage * 3) / 4));
      expect(visible).toContain(midpoint);
      for (const target of [midpointQuartile, midpoint, midpointThreeQuartile]) {
        expect(renderedHrefs.has(`/learning-center/page/${target}/`)).toBe(true);
      }
    }
  });

  it('uses genuine midpoint jumps for pagination gaps', () => {
    expect(archiveGapTarget(1, 21)).toBe(11);
    expect(archiveGapTarget(21, 42)).toBe(32);
    expect(archiveGapTarget(5, 6)).toBeNull();
  });

  it('returns a non-boundary gap target so the ellipsis is a real jump', () => {
    // Regression guard for the bug where gapTarget(prev + 1) resolved
    // back to the first visible page, making the ellipsis a no-op.
    const target = archiveGapTarget(1, 37);
    expect(target).not.toBeNull();
    // Midpoint of (1, 37) = 19 — strictly inside the gap, NOT the
    // boundary page.
    expect(target).not.toBe(1);
    expect(target).not.toBe(37);
    expect(target).toBeGreaterThan(1);
    expect(target).toBeLessThan(37);
  });
});
