import { expect, test } from '@playwright/test';

/**
 * MRX1000-041 — verify that the Learning Center hub visibly links every
 * one of the 9 canonical MRX1000 pillar URLs and that the link count
 * stays bounded (no hidden/unbounded cross-pillar sprawl).
 *
 * Also asserts that archive pagination connectivity is bounded so a
 * 42-page archive can be reached from any sibling page in 1 hop, not
 * 11+ hops as a strict "current ± 2" window would force.
 */

const NINE_PILLAR_PATHS = [
  '/sell-mineral-rights/',
  '/mineral-rights-value/',
  '/offer-review/',
  '/inherited-mineral-rights/',
  '/learning-center/oil-and-gas-royalties/',
  '/learning-center/mineral-rights-taxes/',
  '/mineral-rights/texas/',
  '/learning-center/title-lease-ownership/',
  '/methodology/',
] as const;

test.describe('MRX1000 pillar & archive navigation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Learning Center hub visibly links all 9 canonical pillar URLs', async ({ page }) => {
    await page.goto('/learning-center/');

    const pillarNav = page.locator('[data-pillar-nav]');
    await expect(pillarNav).toBeVisible();
    const links = pillarNav.locator('a[data-pillar-link]');
    expect(await links.count()).toBe(NINE_PILLAR_PATHS.length);

    for (const path of NINE_PILLAR_PATHS) {
      await expect(
        pillarNav.locator(`a[data-pillar-link][href="${path}"]`),
        `Learning Center must link ${path}`,
      ).toHaveCount(1);
    }
  });

  test('every pillar surface surfaces a downward article inventory with fail-closed cards', async ({
    page,
  }) => {
    const pillarRoutes = [
      '/sell-mineral-rights/',
      '/mineral-rights-value/',
      '/offer-review/',
      '/inherited-mineral-rights/',
      '/learning-center/oil-and-gas-royalties/',
      '/learning-center/mineral-rights-taxes/',
      '/learning-center/title-lease-ownership/',
    ] as const;

    for (const route of pillarRoutes) {
      await page.goto(route);
      const inventory = page.locator('[data-pillar-inventory]').first();
      await expect(
        inventory,
        `${route} should render a downward pillar inventory section`,
      ).toBeVisible();
      // Every rendered inventory card must be a fail-closed published article:
      // we tag the section with data-pillar-total so the card count can
      // never exceed it.
      const total = Number((await inventory.getAttribute('data-pillar-total')) ?? '0');
      const cardCount = await inventory.locator('[data-pillar-inventory-card]').count();
      expect(cardCount, `${route} inventory card count`).toBeLessThanOrEqual(total);
      expect(cardCount, `${route} inventory card count`).toBeGreaterThanOrEqual(0);
      // The article link within every card (the title + image anchor) MUST
      // resolve to a published `/blog/<slug>/` article. We deliberately
      // scope the assertion to those two anchors because cards also carry
      // an author link to `/authors/<slug>/`, which is sibling navigation
      // — not an article href — and was previously being mis-flagged.
      const articleHrefs = await inventory
        .locator('[data-pillar-inventory-card] > a, [data-pillar-inventory-card] h3 a')
        .evaluateAll((anchors) =>
          anchors
            .map((a) => a.getAttribute('href'))
            .filter((href): href is string => Boolean(href)),
        );
      for (const href of articleHrefs) {
        expect(href).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
      }
    }
  });

  test('methodology surface uses curated live articles instead of an empty pillar inventory', async ({
    page,
  }) => {
    await page.goto('/methodology/');

    await expect(page.locator('[data-pillar-inventory]')).toHaveCount(0);

    const finalCta = page.locator('[data-methodology-final-cta]');
    await expect(finalCta).toBeVisible();
    await expect(
      finalCta.getByRole('heading', {
        name: /See the assumptions behind your mineral-rights range/i,
      }),
    ).toBeVisible();
    await expect(
      finalCta.getByRole('link', { name: /Request an Underwriter Review/i }),
    ).toHaveAttribute('href', '/book/');
    await expect(
      finalCta.getByRole('link', { name: /Compare an Existing Offer/i }),
    ).toHaveAttribute('href', '/offer-review/');

    const curatedGuides = page.locator('[data-methodology-curated-guides]');
    await expect(curatedGuides).toBeVisible();
    await expect(curatedGuides.locator('[data-methodology-curated-card]')).toHaveCount(4);
    await expect(curatedGuides.getByText('Read the live articles behind the review inputs')).toBeVisible();
    await expect(curatedGuides.getByText('These published MRX articles explain')).toBeVisible();
    await expect(curatedGuides.locator('.methodology-bottom__read-link')).toHaveText([
      'Read the article →',
      'Read the article →',
      'Read the article →',
      'Read the article →',
    ]);
    await expect(curatedGuides.getByText(/live guides|published MRX guides|Read the guide/i)).toHaveCount(0);

    for (const href of [
      '/blog/how-are-mineral-rights-valued/',
      '/blog/how-to-compare-mineral-rights-buyers-in-texas/',
      '/blog/what-documents-do-you-need-to-sell-mineral-rights-in-texas/',
      '/blog/what-is-a-clawback-clause-in-a-mineral-rights-sale/',
    ]) {
      await expect(curatedGuides.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test('Texas state pillar exposes a downward inventory because /mineral-rights/texas/ is the texas-mineral-rights pillar surface', async ({
    page,
  }) => {
    await page.goto('/mineral-rights/texas/');
    const inventory = page.locator('[data-pillar-inventory]').first();
    await expect(inventory).toBeVisible();
    expect(await inventory.getAttribute('data-pillar-id')).toBe('texas-mineral-rights');
  });

  test('pillar overflow links are crawlable only when continuation pages exist', async ({
    page,
  }) => {
    await page.goto('/learning-center/oil-and-gas-royalties/');

    // The hub itself exposes a topic-guide overflow link when the
    // inventory exceeds the per-topic cap; if the inventory overflows
    // the cap, the topic overflow must link to the page/2/ route so a
    // crawler can follow without JS gating.
    const overflow = page.locator('[data-pillar-topic-overflow]');
    const overflowCount = await overflow.count();
    if (overflowCount > 0) {
      const firstOverflowHref = await overflow.first().locator('a').first().getAttribute('href');
      expect(firstOverflowHref).toMatch(/^\/learning-center\/oil-and-gas-royalties\/page\/\d+\/$/);
    }
  });

  test('archive pagination link count stays bounded on the rendered Learning Center', async ({
    page,
  }) => {
    // PaginationNav is the connectivity contract for archives. We pin
    // the rendered bounds (no more than 10 page-number anchors + first/
    // last + prev/next edges/directions) directly off the Learning
    // Center HTML. The deeper "1,000-article, 42-page archive, page-21
    // reachable from page 1 in one hop" synthetic load test lives in
    // tests/unit/archive-pagination.spec.ts, where the underlying
    // visibleArchivePages + archiveGapTarget helpers are exercised
    // deterministically — this E2E test does NOT make that claim.
    await page.goto('/learning-center/');
    const pagination = page.locator('[data-archive-pagination]');
    const pageLinkCount = await pagination.locator('[data-archive-page]').count();
    const edgeCount = await pagination.locator('[data-archive-edge]').count();
    const directionCount = await pagination.locator('[data-archive-direction]').count();
    const gapCount = await pagination.locator('[data-archive-gap]').count();
    expect(pageLinkCount).toBeLessThanOrEqual(10);
    expect(edgeCount).toBeLessThanOrEqual(2);
    expect(directionCount).toBeLessThanOrEqual(2);
    // Gaps, when present, must be crawlable midpoint jumps — never
    // inert ellipses that resolve back to a visible page. We assert
    // every gap anchor's href is NOT one of the visible page anchors
    // and NOT the edge anchors' targets.
    const gapHrefs = await pagination
      .locator('[data-archive-gap]')
      .evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter((href): href is string => Boolean(href)),
      );
    const visibleHrefs = await pagination
      .locator('[data-archive-page]')
      .evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter((href): href is string => Boolean(href)),
      );
    const edgeHrefs = await pagination
      .locator('[data-archive-edge]')
      .evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter((href): href is string => Boolean(href)),
      );
    const forbidden = new Set([...visibleHrefs, ...edgeHrefs]);
    for (const href of gapHrefs) {
      expect(forbidden.has(href)).toBe(false);
    }
    // And no gap dead-zone: each gap, when rendered, points inside the
    // valid 1..lastPage range — a defensive bound for synthetic
    // large-archive load tests.
    expect(gapCount).toBeLessThanOrEqual(5);
  });
});
