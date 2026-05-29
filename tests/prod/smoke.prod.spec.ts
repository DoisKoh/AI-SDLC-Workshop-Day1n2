import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import {
  acceptDialogs,
  createTodo,
  loginUser,
  registerUser,
  setupAuthenticator,
  uniqueUsername,
} from '../e2e/helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

/**
 * Full functional smoke against the live production deployment: passkey
 * registration, todo creation, persistence across a reload, and persistence
 * across a logout + fresh login (proves the WebAuthn flow + DB + volume work
 * end-to-end in production).
 */
test('production: register, create todo, persist across reload and re-login', async ({ page }) => {
  const username = uniqueUsername('prodsmoke')
  const title = `Prod smoke ${Date.now()}`

  await registerUser(page, username)
  await createTodo(page, title)
  await expect(page.getByText(title)).toBeVisible()

  // Persists across a page reload (data is in the SQLite volume, not memory).
  await page.reload()
  await expect(page.getByText(title)).toBeVisible()

  // Persists across logout + a fresh passkey login.
  await page.getByTestId(TID.logoutButton).click()
  await page.waitForURL('**/login')
  await loginUser(page, username)
  await expect(page.getByText(title)).toBeVisible()
})

test('production: calendar shows seeded Singapore holidays', async ({ page }) => {
  await registerUser(page, uniqueUsername('prodcal'))
  await page.goto('/calendar?month=2025-12')
  await expect(page.getByTestId(TID.calendarGrid)).toBeVisible()
  await expect(page.getByTestId(TID.calendarHoliday('2025-12-25'))).toBeVisible()
})
