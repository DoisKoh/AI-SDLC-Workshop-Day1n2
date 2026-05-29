import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import { acceptDialogs, loginUser, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

test('protected route redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('**/login')
  await expect(page.getByTestId(TID.authUsernameInput)).toBeVisible()
})

test('logout returns to the login page', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await page.getByTestId(TID.logoutButton).click()
  await page.waitForURL('**/login')
  await expect(page.getByTestId(TID.authUsernameInput)).toBeVisible()
})

test('login works after registering and logging out', async ({ page }) => {
  const username = uniqueUsername()
  await registerUser(page, username)
  await page.getByTestId(TID.logoutButton).click()
  await page.waitForURL('**/login')
  await loginUser(page, username)
  await expect(page.getByTestId(TID.todoForm)).toBeVisible()
})
