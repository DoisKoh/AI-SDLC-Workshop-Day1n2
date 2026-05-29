import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'

/**
 * Cross-browser smoke for the non-authenticated UI shell. Runs on Chromium,
 * Firefox and WebKit. The WebAuthn flows themselves require a virtual
 * authenticator (Chromium-only via CDP) and are covered by the feature specs;
 * here we verify the login surface renders and route protection works across
 * browser engines.
 */
test('unauthenticated visit redirects to the login page', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('**/login')
  await expect(page.getByTestId(TID.authUsernameInput)).toBeVisible()
})

test('login page renders register/login controls and toggles tabs', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByTestId(TID.authTabRegister)).toBeVisible()
  await expect(page.getByTestId(TID.authTabLogin)).toBeVisible()
  await expect(page.getByTestId(TID.authSubmit)).toBeVisible()

  await page.getByTestId(TID.authTabLogin).click()
  await expect(page.getByTestId(TID.authSubmit)).toContainText(/login/i)
})
