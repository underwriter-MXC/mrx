import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort(),
  );
});
test('homepage highlights owner questions before technical worksheets', async ({ page }) => {
  await page.goto('/');
  const featured = page.locator('.mrx-section--sand .mrx-intent-card');
  await expect(featured).toHaveCount(3);
  await expect(featured.first()).toHaveAttribute(
    'href',
    '/blog/how-to-know-if-your-mineral-rights-offer-is-fair/',
  );
  await expect(page.getByRole('link', { name: 'Compare two written offers' })).toBeVisible();
});
test('comparison protects unknowns and interest basis without transmitting entries', async ({
  page,
}) => {
  await page.goto('/mineral-rights-offer-comparison/?utm_term=private-test-value');
  await page.locator('#offer-a-total').fill('40000');
  await page.locator('#offer-a-nma').fill('10');
  await expect(page.locator('[data-per-acre="a"]')).not.toContainText('$4,000');
  await page.locator('#offer-a-interest').selectOption('mineral');
  await expect(page.locator('[data-per-acre="a"]')).toHaveText('$4,000.00');
  await page.locator('#offer-a-property').selectOption({ label: 'Unclear' });
  await page.locator('#offer-a-adjustments').fill('PRIVATE DOCUMENT TEST');
  await page.getByRole('button', { name: 'Show questions to resolve' }).click();
  await expect(page.locator('[data-questions="a"]')).toContainText('Which property');
  await page.locator('#offer-a-interest').selectOption('royalty');
  await expect(page.locator('[data-per-acre="a"]')).toContainText('does not apply');
  const events = await page.evaluate(() =>
    (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer.filter((row) =>
      String(row.event || '').startsWith('offer_comparison_'),
    ),
  );
  expect(events.map((event) => event.event)).toEqual([
    'offer_comparison_started',
    'offer_comparison_questions_viewed',
  ]);
  expect(JSON.stringify(events)).not.toMatch(/PRIVATE|private-test-value|40000/);
  for (const event of events)
    expect(Object.keys(event).sort()).toEqual(['event', 'page_path', 'tool_version']);
  await page.getByRole('button', { name: 'Clear worksheet' }).click();
  await expect(page.locator('#offer-a-total')).toHaveValue('');
  await expect(page.locator('[data-per-acre="a"]')).not.toContainText('$');
});
test('mobile worksheet fits viewport and renders guidance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/mineral-rights-offer-comparison/');
  await expect(page.locator('#offer-b-interest')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.locator('#comparison-method').scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'Read MRX’s methodology and role' })).toBeVisible();
});
