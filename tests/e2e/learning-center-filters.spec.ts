import { expect, test } from '@playwright/test';

/**
 * Learning Center combined search + topic + author filters on page 1.
 *
 * The form lives at /learning-center/ and progressively enhances the static
 * archive: with JS off the page renders the full article list; with JS on the
 * three controls (`?q=`, `?topic=`, `?author=`) filter cards immediately and
 * write the same query params via history.replaceState.
 */
test.describe('Learning Center filters', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('renders all three filter controls with proper labels', async ({ page }) => {
    await page.goto('/learning-center/');

    const form = page.locator('[data-learning-filters]');
    await expect(form).toHaveAttribute('action', '/learning-center/');

    const search = page.locator('[data-learning-search]');
    await expect(search).toHaveAttribute('id', 'learning-search-input');
    await expect(search).toHaveAttribute('name', 'q');
    await expect(page.locator('label[for="learning-search-input"]')).toBeVisible();

    const topic = page.locator('[data-learning-topic]');
    await expect(topic).toHaveAttribute('id', 'learning-topic-select');
    await expect(topic).toHaveAttribute('name', 'topic');
    await expect(page.locator('label[for="learning-topic-select"]')).toBeAttached();

    const author = page.locator('[data-learning-author]');
    await expect(author).toHaveAttribute('id', 'learning-author-select');
    await expect(author).toHaveAttribute('name', 'author');
    await expect(page.locator('label[for="learning-author-select"]')).toBeAttached();
  });

  test('combined search + topic + author narrows the cards and announces the count', async ({
    page,
  }) => {
    await page.goto('/learning-center/');

    const cards = page.locator('[data-learning-card]');
    const total = await cards.count();
    expect(total).toBeGreaterThan(2);

    // Pick one real card and combine its own title term, topic, and author so
    // the three-way filter always has a valid positive match in the corpus.
    const sampleCard = cards.first();
    const topicValue = await sampleCard.getAttribute('data-learning-category');
    const authorValue = await sampleCard.getAttribute('data-learning-author-slug');
    expect(topicValue).toBeTruthy();
    expect(authorValue).toBeTruthy();

    // Apply a search term that is known to appear in at least one article.
    const sample = await sampleCard.locator('h2 a').innerText();
    const word = sample.split(/\s+/).find((piece) => piece.length > 4) ?? sample;
    await page.locator('[data-learning-search]').fill(word);

    await page.locator('[data-learning-topic]').selectOption(topicValue!);
    await page.locator('[data-learning-author]').selectOption(authorValue!);

    // Combined filter applied — URL is updated, cards narrowed, summary updated.
    await expect.poll(async () => new URL(page.url()).searchParams.get('q')).toBe(word);
    await expect.poll(async () => new URL(page.url()).searchParams.get('topic')).toBe(topicValue);
    await expect.poll(async () => new URL(page.url()).searchParams.get('author')).toBe(authorValue);

    const summary = page.locator('[data-learning-summary]');
    const summaryText = await summary.innerText();
    expect(summaryText).toMatch(/\d+ matching articles? in the published library/);

    const visible = await cards.evaluateAll((elements) =>
      elements.filter((el) => !el.hasAttribute('hidden')).length,
    );
    expect(visible).toBeLessThan(total);
    expect(visible).toBeGreaterThan(0);

    // Reset via the inline reset button restores everything and clears the URL.
    await page.locator('[data-learning-reset]').click();
    await expect.poll(async () => new URL(page.url()).search).toBe('');
    await expect(page.locator('[data-learning-search]')).toHaveValue('');
    await expect(page.locator('[data-learning-topic]')).toHaveValue('');
    await expect(page.locator('[data-learning-author]')).toHaveValue('');
    await expect(summary).toContainText(/published articles/);
    const visibleAfterReset = await cards.evaluateAll((elements) =>
      elements.filter((el) => !el.hasAttribute('hidden')).length,
    );
    expect(visibleAfterReset).toBe(total);
  });

  test('Esc clears the controls and the URL', async ({ page }) => {
    await page.goto('/learning-center/');

    const topicValue = await page
      .locator('[data-learning-topic] option:not([value=""])')
      .first()
      .getAttribute('value');
    await page.locator('[data-learning-topic]').selectOption(topicValue!);
    await expect.poll(async () => new URL(page.url()).searchParams.get('topic')).toBe(topicValue);

    await page.locator('[data-learning-search]').focus();
    await page.keyboard.press('Escape');

    await expect.poll(async () => new URL(page.url()).search).toBe('');
    await expect(page.locator('[data-learning-topic]')).toHaveValue('');
  });

  test('empty state appears when no article matches and resets via its own button', async ({
    page,
  }) => {
    await page.goto('/learning-center/');

    const empty = page.locator('[data-learning-empty]');
    await expect(empty).toBeHidden();

    // A query that matches nothing in the article corpus.
    await page.locator('[data-learning-search]').fill('zzzz-no-match-zzzz');

    await expect(empty).toBeVisible();
    await expect(page.locator('[data-learning-results]')).toBeHidden();

    await page.locator('[data-learning-empty-reset]').click();
    await expect(page.locator('[data-learning-search]')).toHaveValue('');
    await expect(empty).toBeHidden();
    await expect(page.locator('[data-learning-results]')).toBeVisible();
    await expect.poll(async () => new URL(page.url()).search).toBe('');
  });

  test('hydrates controls from query params on load', async ({ page }) => {
    await page.goto('/learning-center/?q=mineral');

    await expect(page.locator('[data-learning-search]')).toHaveValue('mineral');
    // After hydration the summary is the filtered count form, not the default
    // "Showing X through Y of Z published articles" copy.
    const summary = await page.locator('[data-learning-summary]').innerText();
    expect(summary).toMatch(/\d+ matching articles? in the published library/);
  });

  test('normalizes natural-language questions and can reveal a hidden full-corpus card', async ({
    page,
  }) => {
    await page.goto('/learning-center/');

    const target = page.locator(
      '[data-learning-card] [data-article-source="learning_center"][data-article-slug="why-did-my-royalty-check-go-down"]',
    );
    await expect(target).toBeAttached();
    const targetCard = target.locator('xpath=ancestor::article[@data-learning-card]');
    const startsAsPageCard = (await targetCard.getAttribute('data-learning-page-card')) === 'true';

    if (!startsAsPageCard) {
      await expect(targetCard).toBeHidden();
    }

    await page.locator('[data-learning-search]').fill('Why did my royalty check go down?');

    await expect(targetCard).toBeVisible();
    await expect(target).toContainText('Why Did My Mineral Royalty Check Go Down?');
    await expect(page.locator('[data-learning-summary]')).toContainText(
      /matching articles? in the published library/,
    );

    const sellingTarget = page.locator(
      '[data-learning-card] [data-article-source="learning_center"][data-article-slug="how-to-sell-mineral-rights-in-texas"]',
    );
    await page.locator('[data-learning-search]').fill('How do I sell my mineral rights?');
    await expect(sellingTarget).toBeVisible();

    const sellingResultCounts = await page.locator('[data-learning-card]').evaluateAll((cards) => ({
      total: cards.length,
      visible: cards.filter((card) => !card.hasAttribute('hidden')).length,
    }));
    expect(sellingResultCounts.visible).toBeGreaterThan(0);
    expect(sellingResultCounts.visible).toBeLessThan(sellingResultCounts.total);
  });

  test('keeps the filter controls usable without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/learning-center/');

    await expect(page.locator('[data-learning-search]')).toBeVisible();
    await expect(page.locator('[data-learning-topic]')).toBeVisible();
    await expect(page.locator('[data-learning-author]')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  });
});
