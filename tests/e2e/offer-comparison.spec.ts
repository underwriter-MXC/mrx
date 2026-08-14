import { expect, test } from '@playwright/test';

test.describe('private mineral-rights offer comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mineral-rights-offer-comparison/');
  });

  test('delivers a useful comparison before profile or booking CTAs', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Compare two offers beyond the headline price.' }),
    ).toBeVisible();
    await expect(page.locator('[data-cited-answer="true"]')).toBeVisible();
    await expect(page.locator('[data-offer-result]')).toBeHidden();

    await page.locator('[name="a-headline"]').fill('100000');
    await page.locator('[name="a-fees"]').fill('5000');
    await page.locator('[name="a-days"]').fill('45');
    await page.locator('[name="a-rights"]').selectOption('all');
    await page.locator('[name="a-adjustment"]').selectOption('reduce');
    await page.locator('[name="a-document"]').selectOption('loi');

    await page.locator('[name="b-headline"]').fill('98000');
    await page.locator('[name="b-fees"]').fill('0');
    await page.locator('[name="b-days"]').fill('30');
    await page.locator('[name="b-rights"]').selectOption('partial');
    await page.locator('[name="b-adjustment"]').selectOption('none');
    await page.locator('[name="b-document"]').selectOption('final');

    await page.getByRole('button', { name: 'Show my comparison' }).click();

    const result = page.locator('[data-offer-result]');
    await expect(result).toBeVisible();
    await expect(result.locator('[data-net-a]')).toHaveText('$95,000');
    await expect(result.locator('[data-net-b]')).toHaveText('$98,000');
    await expect(result).toContainText('Offer B has the higher provisional net');
    await expect(result).toContainText('the buyer may reduce the amount');
    await expect(result).toContainText('Create my free profile');
    await expect(result).toContainText('Request a free underwriter review');

    const comparisonEvents = (await page.evaluate(() => {
      const dataLayer = (window.dataLayer || []) as Array<Record<string, unknown>>;
      return dataLayer.filter((item) => String(item.event || '').startsWith('offer_comparison_'));
    })) as Array<Record<string, unknown>>;
    expect(comparisonEvents.map((item) => item.event)).toEqual([
      'offer_comparison_started',
      'offer_comparison_completed',
    ]);
    expect(JSON.stringify(comparisonEvents)).not.toContain('100000');
    expect(JSON.stringify(comparisonEvents)).not.toContain('98000');

    await page.getByRole('button', { name: 'Ask Tommy about these flags' }).click();
    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
  });

  test('stays usable at a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    await expect(
      page.getByRole('heading', { name: 'Compare what each offer actually says' }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-offer-card="a"]')).toBeVisible();
    await expect(page.locator('[data-offer-card="b"]')).toBeVisible();
  });
});
