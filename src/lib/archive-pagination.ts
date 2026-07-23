export const ARCHIVE_PAGE_SIZE = 24;

export interface ArchivePage<T> {
  items: T[];
  currentPage: number;
  lastPage: number;
  totalItems: number;
  pageSize: number;
}

export function archivePagePath(basePath: string, page: number): string {
  const normalized = `/${basePath.split('/').filter(Boolean).join('/')}/`;
  return page <= 1 ? normalized : `${normalized}page/${page}/`;
}

export function archivePageNumbers(totalItems: number, pageSize = ARCHIVE_PAGE_SIZE): number[] {
  const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
  return Array.from({ length: Math.max(0, lastPage - 1) }, (_, index) => index + 2);
}

/**
 * Return a bounded set of crawlable archive landmarks.
 *
 * First/last, the current-page neighborhood, and quarter/midpoint landmarks
 * keep a 42-page archive shallow without rendering every page number.
 */
export function visibleArchivePages(currentPage: number, lastPage: number): number[] {
  if (lastPage <= 1) return [];
  const pages = new Set<number>([1, lastPage, currentPage]);
  for (let offset = 1; offset <= 2; offset += 1) {
    if (currentPage - offset >= 1) pages.add(currentPage - offset);
    if (currentPage + offset <= lastPage) pages.add(currentPage + offset);
  }
  if (lastPage > 10) {
    pages.add(Math.max(1, Math.round(lastPage / 4)));
    pages.add(Math.max(1, Math.round(lastPage / 2)));
    pages.add(Math.max(1, Math.round((lastPage * 3) / 4)));
  }
  return [...pages].sort((a, b) => a - b);
}

export function archiveGapTarget(previousPage: number, nextPage: number): number | null {
  if (nextPage - previousPage <= 1) return null;
  return Math.round((previousPage + nextPage) / 2);
}

export function paginateArchive<T>(
  allItems: readonly T[],
  currentPage: number,
  pageSize = ARCHIVE_PAGE_SIZE,
): ArchivePage<T> {
  const totalItems = allItems.length;
  const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));

  if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > lastPage) {
    throw new RangeError(`Archive page ${currentPage} is outside the valid range 1-${lastPage}.`);
  }

  const start = (currentPage - 1) * pageSize;
  return {
    items: allItems.slice(start, start + pageSize),
    currentPage,
    lastPage,
    totalItems,
    pageSize,
  };
}
