import { defineConfig, devices } from '@playwright/test'

/**
 * Production smoke config — runs against the LIVE Railway deployment with a
 * virtual WebAuthn authenticator. No webServer (already deployed). Run with:
 *   npx playwright test --config=playwright.prod.config.ts
 */
const BASE_URL = process.env.PROD_URL || 'https://ai-sdlc-workshop-ste-team3.up.railway.app'

export default defineConfig({
  testDir: './tests/prod',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Singapore',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
