import { expect, test, type Page } from '@playwright/test';

const emptySession = {
  ok: true,
  conversationId: 'timing-test',
  authenticated: false,
  messages: [],
  interests: [],
  facts: [],
  documents: [],
  appointments: [],
  conversations: [],
  documentUploadsEnabled: false,
};

async function mockEmptySession(page: Page) {
  await page.route('**/api/chat/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(emptySession),
    });
  });
}

test('shows typing immediately and holds a guide answer for at least two seconds', async ({
  page,
}) => {
  await mockEmptySession(page);
  await page.route('**/api/chat/message', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        'event: message.delta',
        'data: {"type":"message.delta","delta":"Here is — the short answer --- now.","persona":"travis"}',
        '',
        'event: done',
        'data: {"type":"done"}',
        '',
        '',
      ].join('\n'),
    });
  });

  await page.goto('/');
  await page.locator('[data-open-home-chat]').first().click();
  await expect(page.getByText('How may I help you?', { exact: true })).toBeVisible();
  const ownerQuestion = 'Owner — text --- about mineral-rights';
  await page.getByTestId('travis-composer-input').fill(ownerQuestion);
  const submittedAt = Date.now();
  await page.getByLabel('Send reply').click();
  await expect(page.getByText(ownerQuestion, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Travis is typing')).toBeVisible({ timeout: 500 });
  await page.waitForTimeout(1_000);
  await expect(page.getByText('Here is, the short answer now.')).toBeHidden();
  await expect(page.getByText('Here is, the short answer now.')).toBeVisible({ timeout: 4_000 });
  await expect(page.getByText('Here is — the short answer --- now.')).toHaveCount(0);
  expect(Date.now() - submittedAt).toBeGreaterThanOrEqual(1_900);

  await expect(page.getByText('What first name should I use?')).toHaveCount(0);
  await expect(page.getByTestId('travis-composer-input')).toHaveAttribute('name', 'mrx-chat-open');
});

test('does not add another two-second delay when answer processing is already slow', async ({
  page,
}) => {
  await mockEmptySession(page);
  await page.route('**/api/chat/message', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_200));
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        'event: message.delta',
        'data: {"type":"message.delta","delta":"The slow answer is ready.","persona":"travis"}',
        '',
        'event: done',
        'data: {"type":"done"}',
        '',
        '',
      ].join('\n'),
    });
  });

  await page.goto('/');
  await page.locator('[data-open-home-chat]').first().click();
  await expect(page.getByText('How may I help you?', { exact: true })).toBeVisible();
  await page.getByTestId('travis-composer-input').fill('What affects value?');
  const submittedAt = Date.now();
  await page.getByLabel('Send reply').click();
  await expect(page.getByLabel('Travis is typing')).toBeVisible({ timeout: 500 });
  await expect(page.getByText('The slow answer is ready.')).toBeVisible({ timeout: 4_000 });
  const elapsed = Date.now() - submittedAt;
  expect(elapsed).toBeGreaterThanOrEqual(2_100);
  expect(elapsed).toBeLessThan(3_500);
});

test('holds a local fallback answer to the same minimum', async ({ page }) => {
  await mockEmptySession(page);
  await page.route('**/api/chat/message', async (route) => {
    await route.fulfill({ status: 503, body: 'temporary connection failure' });
  });

  await page.goto('/');
  await page.locator('[data-open-home-chat]').first().click();
  await expect(page.getByText('How may I help you?', { exact: true })).toBeVisible();
  await page.getByTestId('travis-composer-input').fill('What affects value?');
  const submittedAt = Date.now();
  await page.getByLabel('Send reply').click();
  await expect(page.getByLabel('Travis is typing')).toBeVisible({ timeout: 500 });
  await page.waitForTimeout(1_000);
  const fallbackAnswer = page.getByText(/Mineral value usually depends on exact location/);
  await expect(fallbackAnswer).toBeHidden();
  await expect(fallbackAnswer).toBeVisible({ timeout: 4_000 });
  expect(Date.now() - submittedAt).toBeGreaterThanOrEqual(1_900);
});

test('keeps validation feedback immediate while scripted scheduling remains delayed', async ({
  page,
}) => {
  await mockEmptySession(page);
  await page.route('**/api/appointments/availability**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'booking_not_configured' }),
    });
  });
  await page.goto('/?book=1');
  // The query-string booking request is consumed by the hydrated React app.
  // Start the sub-second UI assertion only after that app has announced it is
  // ready, so parallel-worker startup time is not counted as product latency.
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __mrxChatReady?: boolean }).__mrxChatReady,
    ),
  );
  await expect(page.getByLabel('Elena is typing')).toBeVisible({ timeout: 500 });
  await page.waitForTimeout(1_000);
  await expect(page.getByText(/I have your time zone as/)).toBeHidden();
  await expect(page.getByText(/I have your time zone as/)).toBeVisible({ timeout: 4_000 });

  await page.getByTestId('travis-composer-input').fill('Mars time');
  const submittedAt = Date.now();
  await page.getByLabel('Send reply').click();
  await expect(page.getByText(/You can say Eastern, Central, Mountain/)).toBeVisible({
    timeout: 1_000,
  });
  expect(Date.now() - submittedAt).toBeLessThan(1_000);

  const schedulingStartedAt = Date.now();
  await page.locator('[data-reply="timezone-confirm"]').click();
  await expect(page.getByLabel('Elena is typing')).toBeVisible({ timeout: 500 });
  await page.waitForTimeout(1_000);
  await expect(page.getByText(/tomorrow afternoon, tomorrow evening/)).toBeHidden();
  await expect(page.getByText(/tomorrow afternoon, tomorrow evening/)).toBeVisible({
    timeout: 4_000,
  });
  expect(Date.now() - schedulingStartedAt).toBeGreaterThanOrEqual(1_900);

  const infrastructureStartedAt = Date.now();
  await page.locator('[data-reply="tomorrow-afternoon"]').click();
  await expect(page.getByText(/can’t reach MRX’s live appointment calendar/)).toBeVisible({
    timeout: 1_000,
  });
  expect(Date.now() - infrastructureStartedAt).toBeLessThan(1_000);
});
