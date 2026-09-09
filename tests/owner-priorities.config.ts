import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: 'owner-priorities.spec.ts',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4387', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'python3 -m http.server 4387 --bind 127.0.0.1 --directory ../dist/client',
    url: 'http://127.0.0.1:4387',
    reuseExistingServer: false,
  },
});
