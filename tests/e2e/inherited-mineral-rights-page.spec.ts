import { expect, test } from '@playwright/test';

test.describe('Inherited mineral rights page', () => {
  test('keeps the main actions and Tommy checklist visible near the top', async ({ page }) => {
    await page.goto('/inherited-mineral-rights/');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Start with the records. Then talk about value.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ask Tommy what to do first' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See the starting documents' })).toBeVisible();
    await expect(page.locator('.tommy-checklist')).toBeVisible();
    await expect(page.getByText('Why these records matter', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Send me the comprehensive checklist' }).click();
    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
    await expect(
      page.getByText(
        'Please send me the comprehensive inherited mineral rights checklist and help me understand what I should gather first.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('fits a 390-pixel viewport and retains the checklist action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/inherited-mineral-rights/');

    const dimensions = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));

    expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
    await expect(page.locator('.tommy-checklist')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Send me the comprehensive checklist' }),
    ).toBeVisible();
  });
});
