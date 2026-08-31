import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARCHIVE_PAGE_SIZE } from '../../src/lib/archive-pagination';

/**
 * Compute the fail-closed public corpus size used by every Learning
 * Center / category / author archive assertion below. Mirrors the
 * `isPublishedPost` rule from src/lib/content-graph.ts: a row counts
 * when `publication_status === 'published'` AND `draft !== true` AND
 * `noindex !== true`. This means the same file system that ships the
 * 25-stage noindex pilot URLs (which intentionally fail closed) drives
 * the expected card count here — drafts and noindex rows never leak
 * into the page-size cap.
 */
function countFailClosedPublished(): number {
  const postsDir = join(process.cwd(), 'src', 'content', 'posts');
  const files = readdirSync(postsDir).filter((name) => name.endsWith('.mdx'));
  let count = 0;
  for (const file of files) {
    const frontmatter =
      readFileSync(join(postsDir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const publication = /^publication_status:\s*(\S+)/m.exec(frontmatter)?.[1];
    const draft = /^draft:\s*true/m.test(frontmatter);
    const noindex = /^noindex:\s*true/m.test(frontmatter);
    if (publication === 'published' && !draft && !noindex) count += 1;
  }
  return count;
}

/** Cap a per-page card count to the bounded archive page size. */
function pageCardCount(total: number): number {
  return Math.min(total, ARCHIVE_PAGE_SIZE);
}

test.describe('Learning Center layout', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('shows the first three article images in one visible desktop row', async ({ page }) => {
    await page.goto('/learning-center/');

    const cards = page.locator('.learning-card[data-learning-page-card="true"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    await expect(cards.nth(0)).toBeVisible();
    await expect(cards.nth(1)).toBeVisible();
    await expect(cards.nth(2)).toBeVisible();

    const layout = await cards.evaluateAll((elements) =>
      elements.slice(0, 3).map((element) => {
        const card = element.getBoundingClientRect();
        const imageElement = element.querySelector<HTMLImageElement>('.learning-card__image img');
        const image = imageElement?.getBoundingClientRect();
        return {
          top: card.top,
          imageBottom: image?.bottom ?? Number.POSITIVE_INFINITY,
          imageSrc: imageElement?.getAttribute('src') ?? '',
          imageWidth: imageElement?.naturalWidth ?? 0,
          imageHeight: imageElement?.naturalHeight ?? 0,
          declaredWidth: imageElement?.getAttribute('width') ?? '',
          declaredHeight: imageElement?.getAttribute('height') ?? '',
          objectFit: imageElement ? getComputedStyle(imageElement).objectFit : '',
          renderedRatio: image ? image.width / image.height : 0,
          viewportHeight: window.innerHeight,
        };
      }),
    );

    expect(new Set(layout.map(({ top }) => Math.round(top))).size).toBe(1);
    expect(new Set(layout.map(({ imageSrc }) => imageSrc)).size).toBe(3);
    for (const item of layout) {
      expect(item.imageBottom).toBeLessThan(item.viewportHeight);
      expect(item.imageSrc).toMatch(/^\/assets\/articles\/.+\.webp$/);
      expect(item.imageWidth).toBeGreaterThan(0);
      expect(item.imageHeight).toBeGreaterThan(0);
      expect(item.declaredWidth).toBe('1200');
      expect(item.declaredHeight).toBe('630');
      expect(item.objectFit).toBe('contain');
      expect(item.renderedRatio).toBeCloseTo(1200 / 630, 2);
    }

    const firstPreviewSrc = layout[0].imageSrc;
    await cards.nth(0).locator('.learning-card__image').click();
    await expect(page.locator('[data-article-layout]')).toBeVisible();
    await expect(page.locator('.article-hero-image img')).toHaveAttribute('src', firstPreviewSrc);
  });

  test('serves a bounded static page derived from the fail-closed published inventory', async ({
    page,
  }) => {
    await page.goto('/learning-center/');

    const cards = page.locator('.learning-card[data-learning-page-card="true"]');
    const resultSummary = page
      .locator('.learning-results-head')
      .getByText(/Showing /)
      .first();
    const summaryText = await resultSummary.innerText();
    const totalItems = Number(summaryText.match(/of\s+(\d+)\s+published articles/)?.[1] ?? '0');
    const firstPageCount = pageCardCount(totalItems);
    await expect(cards).toHaveCount(firstPageCount);
    await expect(page.locator('[data-static-archive]')).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'Browse Learning Center topics' })
        .getByRole('link', { name: 'Valuation', exact: true }),
    ).toHaveAttribute('href', '/blog/category/valuation/');
    await expect(
      page.getByText(
        new RegExp(
          `Showing ${totalItems === 0 ? 0 : 1} through ${firstPageCount} of ${totalItems} published articles`,
        ),
      ),
    ).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://mineralrightsxchange.com/learning-center/',
    );
    await expect(page.locator('link[rel="prev"]')).toHaveCount(0);
    if (totalItems > ARCHIVE_PAGE_SIZE) {
      await expect(page.locator('link[rel="next"]')).toHaveAttribute(
        'href',
        'https://mineralrightsxchange.com/learning-center/page/2/',
      );
      const firstPageSlugs = await cards
        .locator('[data-article-source="learning_center"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('data-article-slug')));
      await page.getByRole('link', { name: 'Next →', exact: true }).click();
      await expect(page).toHaveURL('/learning-center/page/2/');
      await expect(cards).toHaveCount(pageCardCount(totalItems - ARCHIVE_PAGE_SIZE));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://mineralrightsxchange.com/learning-center/page/2/',
      );
      await expect(page.locator('link[rel="prev"]')).toHaveAttribute(
        'href',
        'https://mineralrightsxchange.com/learning-center/',
      );
      const secondPageSlugs = await cards
        .locator('[data-article-source="learning_center"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('data-article-slug')));
      expect(secondPageSlugs.filter((slug) => firstPageSlugs.includes(slug))).toEqual([]);
    } else {
      await expect(page.locator('link[rel="next"]')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Next →', exact: true })).toHaveCount(0);
    }
  });

  test('filters visible Learning Center cards by search, topic, and author immediately', async ({
    page,
  }) => {
    await page.goto('/learning-center/');

    const search = page.getByLabel('Search questions and articles');
    const topic = page.locator('select[data-learning-topic]');
    const author = page.locator('select[data-learning-author]');
    const cards = page.locator('[data-learning-card]');
    const pageCards = page.locator('[data-learning-page-card="true"]');
    const visibleCards = page.locator('[data-learning-card]:visible');
    const firstCard = cards.first();
    const firstTitle = (await firstCard.locator('h2 a').innerText()).trim();
    const firstWord = firstTitle.split(/\s+/).find((word) => word.length > 5) ?? firstTitle;
    const firstTopic = await firstCard.getAttribute('data-learning-category');
    const firstAuthor = await firstCard.getAttribute('data-learning-author-slug');

    await expect(search).toBeVisible();
    await expect(topic).toBeVisible();
    await expect(author).toBeVisible();
    await expect(page.locator('[data-learning-summary]')).toContainText('Showing');

    await search.fill(firstWord);
    await topic.selectOption(firstTopic ?? '');
    await author.selectOption(firstAuthor ?? '');

    await expect(visibleCards.first()).toContainText(firstTitle);
    await expect(page.locator('[data-learning-summary]')).toContainText(
      /matching articles? in the published library/,
    );
    const visibleCount = await visibleCards.count();
    expect(visibleCount).toBeGreaterThanOrEqual(1);
    const mismatches = await cards.evaluateAll(
      (elements, expected) =>
        elements.filter(
          (element) =>
            !(element as HTMLElement).hidden &&
            (element.getAttribute('data-learning-category') !== expected.topic ||
              element.getAttribute('data-learning-author-slug') !== expected.author),
        ).length,
      { topic: firstTopic, author: firstAuthor },
    );
    expect(mismatches).toBe(0);

    await search.fill('zzzz-no-mrx-learning-result');
    await expect(
      page.getByRole('heading', { level: 2, name: 'No matching articles' }),
    ).toBeVisible();
    await expect(page.locator('[data-learning-summary]')).toContainText('0 matching articles');

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(visibleCards).toHaveCount(await pageCards.count());
    await expect(page.locator('[data-learning-summary]')).toContainText('Showing');
  });

  test('paginates category and author archives with canonical page URLs', async ({ page }) => {
    await page.goto('/blog/category/mineral-rights/');
    const categorySummary = await page.getByText(/published articles? · Page 1 of/).innerText();
    const categoryTotal = Number(categorySummary.match(/^(\d+)\s+published/)?.[1] ?? '0');
    await expect(page.locator('.post-card')).toHaveCount(pageCardCount(categoryTotal));
    if (categoryTotal > ARCHIVE_PAGE_SIZE) {
      await page.getByRole('link', { name: 'Next →', exact: true }).click();
      await expect(page).toHaveURL('/blog/category/mineral-rights/page/2/');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://mineralrightsxchange.com/blog/category/mineral-rights/page/2/',
      );
    } else {
      await expect(page.getByRole('link', { name: 'Next →', exact: true })).toHaveCount(0);
    }

    await page.goto('/authors/ariana/');
    const authorSummary = await page
      .getByRole('heading', { level: 2, name: /articles? by Ariana/ })
      .innerText();
    const authorTotal = Number(authorSummary.match(/^(\d+)\s+/)?.[1] ?? '0');
    await expect(page.locator('.author-articles__grid article')).toHaveCount(
      pageCardCount(authorTotal),
    );
    if (authorTotal > ARCHIVE_PAGE_SIZE) {
      await page.getByRole('link', { name: 'Next →', exact: true }).click();
      await expect(page).toHaveURL('/authors/ariana/page/2/');
      await expect(page.locator('link[rel="prev"]')).toHaveAttribute(
        'href',
        'https://mineralrightsxchange.com/authors/ariana/',
      );
    } else {
      await expect(page.getByRole('link', { name: 'Next →', exact: true })).toHaveCount(0);
    }
  });

  test('each article identifies its real author and relevant MRX topic guide', async ({ page }) => {
    const articles = [
      ['how-are-mineral-rights-valued', 'dale', 'Dale', 'MRX Production and Royalty Guide'],
      [
        'how-to-compare-mineral-rights-buyers-in-texas',
        'tommy',
        'Tommy',
        'MRX Offer and Value Guide',
      ],
      ['how-to-sell-mineral-rights-in-texas', 'tommy', 'Tommy', 'MRX Offer and Value Guide'],
      [
        'texas-severance-tax-what-mineral-rights-owners-need-to-know',
        'monty',
        'Monty',
        'MRX Decision-Context Guide',
      ],
      [
        'what-documents-do-you-need-to-sell-mineral-rights-in-texas',
        'ariana',
        'Ariana',
        'MRX Owner-Options Guide',
      ],
      [
        'what-is-a-clawback-clause-in-a-mineral-rights-sale',
        'rebecca',
        'Rebecca',
        'MRX Terms and Professional-Routing Guide',
      ],
    ] as const;

    for (const [slug, guide, name, position] of articles) {
      await page.goto(`/blog/${slug}/`);

      const box = page.locator('.article-author-box');
      await expect(box).toBeVisible();
      await expect(box.getByRole('heading', { level: 3, name, exact: true })).toBeVisible();
      await expect(box.getByText(position, { exact: true })).toBeVisible();
      await expect(box.locator('img')).toHaveAttribute('src', `/assets/team/${guide}-256.webp`);
      await expect(
        box.getByRole('link', { name: `More from ${name}`, exact: true }),
      ).toHaveAttribute('href', `/authors/${guide}/`);
      await expect(box.locator(`a[href="/team/${guide}/"]`)).toBeVisible();
      await expect(box.getByText('Fictional MRX AI Guide.', { exact: false })).toBeVisible();
    }
  });

  test('keeps the article team box inside a 390-pixel viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/blog/how-are-mineral-rights-valued/');

    await expect(page.locator('.article-author-box')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  });

  test('keeps wide article tables scroll-contained on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/blog/why-doesnt-my-texas-mineral-tax-value-match-a-sale-estimate/');

    const table = page.locator('.prose table').first();
    await expect(table).toBeVisible();
    const layout = await table.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        right: rect.right,
        overflowX: style.overflowX,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    });

    expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.overflowX).toBe('auto');
    expect(layout.scrollWidth).toBeGreaterThanOrEqual(layout.clientWidth);
  });

  test('uses article terminology for Learning Center post-type labels', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Read the article/i }).first()).toBeVisible();
    await expect(page.getByText('reviewed MRX articles')).toBeVisible();
    await expect(page.locator('p').filter({ hasText: 'public-resource articles' })).toBeVisible();

    await page.goto('/learning-center/oil-and-gas-royalties/');
    await expect(page.getByRole('link', { name: /Browse \d+ reviewed articles/i })).toBeVisible();
    await expect(page.getByText(/currently published articles/i)).toBeVisible();
    await expect(page.getByText(/\d+ articles/i).first()).toBeVisible();
    await expect(page.getByText('Topic articles').first()).toBeVisible();
    await expect(page.getByText(/published guides/i)).toHaveCount(0);

    await page.goto('/blog/how-are-mineral-rights-valued/');
    await expect(page.getByRole('heading', { name: 'Related articles' })).toBeVisible();
    await expect(page.locator('[data-article-link="sibling"]')).toContainText(/article|exploring/i);
  });

  test('uses article terminology on owner entry pages', async ({ page }) => {
    await page.goto('/sell-mineral-rights/');
    await expect(
      page.getByRole('link', { name: /Read the Texas step-by-step selling article/i }),
    ).toBeVisible();

    await page.goto('/mineral-rights/texas/');
    await expect(page).toHaveTitle(/Texas Mineral Rights Owner Article/);
    await expect(page).not.toHaveTitle(/Owner Guide/);
  });
});
