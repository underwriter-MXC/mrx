import { expect, test } from '@playwright/test';

const articlePath = '/blog/how-to-sell-mineral-rights-in-texas/';

test.describe('Universal article closing CTA', () => {
  test('offers both a Tommy conversation and a mineral-rights review', async ({ page }) => {
    await page.goto(articlePath);

    const cta = page.locator('[data-article-closing-cta]');
    await expect(cta).toBeVisible();
    await expect(
      cta.getByRole('heading', { name: 'Put your mineral rights in context.' }),
    ).toBeVisible();
    await expect(cta.locator('a.article-closing-cta__review')).toHaveAttribute(
      'href',
      /^\/book\/?$/,
    );

    await cta.getByRole('button', { name: /Ask Tommy first/ }).click();
    await expect(page.locator('.tommy-panel')).toBeVisible();

    await expect(
      page.getByRole('contentinfo').getByRole('heading', {
        name: 'Get a straight answer before you sign.',
      }),
    ).toBeAttached();

    const transition = await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>('[data-article-closing-cta]');
      const panel = document.querySelector<HTMLElement>('.article-closing-cta__panel');
      const footer = document.querySelector<HTMLElement>('.footer');
      if (!section || !panel || !footer) throw new Error('Article CTA transition is missing.');

      const sectionBounds = section.getBoundingClientRect();
      const footerBounds = footer.getBoundingClientRect();
      const sectionStyle = getComputedStyle(section);
      const panelStyle = getComputedStyle(panel);
      return {
        gap: footerBounds.top - sectionBounds.bottom,
        sectionPaddingBottom: sectionStyle.paddingBottom,
        panelBottomLeftRadius: panelStyle.borderBottomLeftRadius,
        panelBottomRightRadius: panelStyle.borderBottomRightRadius,
      };
    });

    expect(Math.abs(transition.gap)).toBeLessThanOrEqual(1);
    expect(transition.sectionPaddingBottom).toBe('0px');
    expect(transition.panelBottomLeftRadius).toBe('0px');
    expect(transition.panelBottomRightRadius).toBe('0px');
  });

  test('places the compact review card beneath the article author box', async ({ page }) => {
    await page.goto(articlePath);

    const authorBox = page.locator('.article-author-box');
    const sidebarCta = page.locator('.article-sidebar-cta');
    await expect(authorBox).toBeVisible();
    await expect(sidebarCta).toBeVisible();
    await expect(sidebarCta.getByRole('link', { name: /Book My Free Review/ })).toHaveAttribute(
      'href',
      '/book',
    );
    await expect(sidebarCta.getByRole('link', { name: /Get the Free Guide/ })).toHaveAttribute(
      'href',
      '/free-guide',
    );

    const positions = await page.evaluate(() => {
      const author = document.querySelector('.article-author-box')?.getBoundingClientRect();
      const cta = document.querySelector('.article-sidebar-cta')?.getBoundingClientRect();
      return {
        authorBottom: author?.bottom ?? Number.POSITIVE_INFINITY,
        ctaTop: cta?.top ?? Number.NEGATIVE_INFINITY,
        authorLeft: author?.left ?? 0,
        ctaLeft: cta?.left ?? 1,
      };
    });

    expect(positions.ctaTop).toBeGreaterThan(positions.authorBottom);
    expect(Math.abs(positions.ctaLeft - positions.authorLeft)).toBeLessThanOrEqual(1);
  });

  test('fits a narrow mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(articlePath);
    await expect(page.locator('[data-article-closing-cta]')).toBeVisible();

    const widths = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  });
});
