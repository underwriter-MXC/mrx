import { defineConfig, devices } from '@playwright/test';

const testPort = Number(process.env.PLAYWRIGHT_PORT || 4321);
const chatDelay = Number(process.env.PLAYWRIGHT_CHAT_DELAY_MS ?? 2_000);
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The conversational funnel relies on intentional response pacing and a
  // shared Astro dev server. Serial CI execution keeps those timing and
  // route-stub assertions deterministic across desktop and mobile.
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${testPort}`,
    actionTimeout: 30_000,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: skipWebServer
    ? undefined
    : {
        command: `NODE_OPTIONS=--max-old-space-size=6144 MRX_DISABLE_GHL_PROVIDER_WRITES=1 MRX_TEST_MODE=false MRX_TEST_SYNC_GHL=false PUBLIC_SUPABASE_URL=https://supabase.test PUBLIC_SUPABASE_ANON_KEY=test-anon-key PUBLIC_CHAT_MIN_RESPONSE_DELAY_MS=${chatDelay} ./node_modules/.bin/astro dev --host 127.0.0.1 --port ${testPort}`,
        port: testPort,
        timeout: 120_000,
        reuseExistingServer: false,
      },
});
