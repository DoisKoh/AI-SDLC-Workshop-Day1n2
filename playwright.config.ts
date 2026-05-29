import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`

/**
 * E2E config. The app runs in Singapore timezone, against an isolated test
 * database, with WebAuthn driven by a virtual authenticator (see tests/helpers.ts).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // One local retry absorbs occasional dev-server/WebAuthn timing flakes.
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    timezoneId: 'Asia/Singapore',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // The app auto-seeds holidays on first startup (lib/db/connection.ts).
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_PATH: './test-todos.db',
      JWT_SECRET: 'e2e-test-secret-must-be-long-enough-1234567890',
      RP_ID: 'localhost',
      RP_NAME: 'Todo App (E2E)',
      RP_ORIGIN: BASE_URL,
      NODE_ENV: 'development',
    },
  },
})
