import { expect, test } from '@playwright/test';
import { stubAnonymousSession } from './helpers/stub-session';

test.describe('About MRX page', () => {
  test('explains the current guide team and opens Ask Tommy', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/about');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Straight answers, backed by the right team.' }),
    ).toBeVisible();
    await expect(page.locator('.mrx-about-guide')).toHaveCount(6);
    await expect(page.getByText('Fictional MRX AI Guide', { exact: true })).toHaveCount(6);
    await expect(page.getByText('Nationwide education', { exact: true })).toBeVisible();

    const heroChatButton = page.locator('.mrx-about-hero [data-about-chat]');
    await expect(heroChatButton).toHaveCount(1);
    await heroChatButton.click();
    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
    await expect(page.getByText(/Tell me what brought you here:/)).toBeVisible();
  });

  test('stays within a 390-pixel mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/about');

    const dimensions = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
    await expect(page.locator('.mrx-about-router')).toBeVisible();
  });
});
