import { test, expect, type Page, type Route } from '@playwright/test';
import { stubAnonymousSession } from './helpers/stub-session';

const authenticatedSession = {
  ok: true,
  conversationId: '00000000-0000-4000-8000-000000000101',
  authenticated: true,
  profile: {
    first_name: 'Daryl',
    last_name: 'Hill',
    email: 'daryl@example.com',
    phone: null,
    timezone: 'America/Chicago',
  },
  messages: [
    {
      id: '00000000-0000-4000-8000-000000000201',
      role: 'user',
      content: 'How do I compare this offer?',
      persona: null,
      created_at: '2026-07-19T14:00:00.000Z',
    },
    {
      id: '00000000-0000-4000-8000-000000000202',
      role: 'assistant',
      content: 'Compare the complete offer, exact rights conveyed, and obligations after closing.',
      persona: 'tommy',
      created_at: '2026-07-19T14:00:01.000Z',
    },
  ],
  ownerFacts: {},
  facts: [],
  interests: [],
  documents: [],
  appointments: [],
  conversations: [],
  permissions: {
    email: false,
    sms: false,
    aiVoice: false,
    marketingSms: false,
    call: false,
  },
  documentUploadsEnabled: true,
  documentProcessingEnabled: false,
};

async function stubAuthenticatedChat(page: Page) {
  await page.route('**/api/chat/session', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authenticatedSession),
    });
  });
  await page.route('**/api/chat/events', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

test.describe('MRX owner account experience', () => {
  test('exposes a direct owner account entry in desktop and mobile navigation', async ({
    page,
  }) => {
    await stubAnonymousSession(page);
    await page.goto('/');

    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Log In', exact: true }),
    ).toHaveAttribute('href', '/account/');
    await expect(page.locator('#mobile-nav a[href="/account/"]')).toHaveText('Log In');
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Submit details', exact: true }),
    ).toHaveAttribute('href', '/owner-intake/');
  });

  test('keeps Ask Tommy available before account setup and offers optional continuity after an answer', async ({
    page,
  }) => {
    await stubAnonymousSession(page);
    await page.route('**/api/chat/message', async (route) => {
      const body = [
        'event: message.delta',
        `data: ${JSON.stringify({
          type: 'message.delta',
          delta: 'Start by comparing the complete offer and the exact rights it would convey.',
          persona: 'tommy',
        })}`,
        '',
        'event: done',
        'data: {"type":"done"}',
        '',
        '',
      ].join('\n');
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await page.goto('/');
    await page.locator('[data-open-home-chat]').first().click();
    const input = page.getByTestId('tommy-composer-input');
    await expect(input).toBeEnabled();
    await expect(input).toHaveAttribute('name', 'mrx-chat-open');
    await expect(page.getByText('What first name should I use?')).toHaveCount(0);

    await input.fill('How do I compare this offer?');
    await page.getByRole('button', { name: 'Send reply' }).click();

    await expect(
      page.getByText('Start by comparing the complete offer and the exact rights it would convey.'),
    ).toBeVisible();
    await expect(page.getByTestId('tommy-account-prompt')).toContainText(
      'Keep this conversation and any mineral-rights documents together',
    );
    await expect(
      page
        .getByTestId('tommy-account-prompt')
        .getByRole('link', { name: 'Log in or create an account' }),
    ).toHaveAttribute('href', '/account/?welcome=conversation');
    await expect(input).toBeEnabled();
  });

  test('does not show the account setup prompt when a verified owner returns', async ({ page }) => {
    await stubAuthenticatedChat(page);
    await page.goto('/');
    await page.locator('[data-open-home-chat]').first().click();

    await expect(page.getByText('How do I compare this offer?')).toBeVisible();
    await expect(page.getByTestId('tommy-account-prompt')).toHaveCount(0);
  });

  test('explains the private account before requesting a passwordless link', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/account/');

    await expect(
      page.getByRole('heading', { name: 'Create your private MRX account' }),
    ).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Phone', exact: true })).toBeVisible();
    await expect(page.getByText(/continue on this device right away/i)).toBeVisible();
    await expect(page.getByText(/Continue immediately on this device/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account and continue' })).toBeVisible();
  });

  test('carries conversation continuity intent into account setup', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/account/?welcome=conversation');

    await expect(
      page.getByRole('heading', { name: 'Save this conversation across devices' }),
    ).toBeVisible();
    await expect(
      page.getByText(/this conversation, future questions, locations, and documents/i),
    ).toBeVisible();
  });

  test('uses the existing owner-identity flow for first-time account setup', async ({ page }) => {
    await stubAnonymousSession(page);
    let identityRequest: Record<string, unknown> | undefined;
    await page.route('**/api/chat/identity', async (route) => {
      identityRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, deviceAccess: true, verificationSent: true }),
      });
    });
    await page.goto('/account/?welcome=conversation');

    await page.getByLabel('Full name').fill('Riley Owner');
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('owner@example.com');
    await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('(432) 555-0101');
    await page.getByRole('button', { name: 'Create account and continue' }).click();

    expect(identityRequest).toMatchObject({
      action: 'email',
      fullName: 'Riley Owner',
      email: 'owner@example.com',
      phone: '(432) 555-0101',
    });
    expect(identityRequest).not.toHaveProperty('permissions');
    expect(identityRequest?.redirectTo).toMatch(/\/account\/\?welcome=angela$/);
    await expect(page.getByRole('dialog')).toContainText('Let’s prepare your underwriter record');
    await expect(page.getByRole('dialog')).toContainText('This takes a couple of minutes');
  });

  test('offers a standalone guided intake link before authentication', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/owner-intake/');

    await expect(
      page.getByRole('heading', { name: 'Start your guided owner intake' }),
    ).toBeVisible();
    await expect(page.getByText(/add as many mineral properties as you need/i)).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
  });
});
