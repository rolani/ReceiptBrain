import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '3000';
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Build first to avoid env-validation noise (Phase 9 dev TODO: dev server option).
        command: 'SKIP_ENV_VALIDATION=true pnpm exec next start --port ' + PORT,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
