import type { Page } from '@playwright/test';

const emptySession = {
  ok: true,
  conversationId: '00000000-0000-4000-8000-000000000001',
  authenticated: false,
  profile: null,
  messages: [],
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
  documentUploadsEnabled: false,
  documentProcessingEnabled: false,
};

/**
 * UI-only browser tests should not depend on a shared remote Supabase session.
 * Persistence and identity are covered by the API and integration suites.
 */
export async function stubAnonymousSession(page: Page) {
  await page.route('**/api/chat/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(emptySession),
    });
  });

  await page.route('**/api/chat/events', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}
