import { expect, test } from '@playwright/test'
import {
  acceptDialogs,
  createTodo,
  registerUser,
  setupAuthenticator,
  tomorrowDue,
  uniqueUsername,
} from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

test('reminder badge shows on a todo with a due date and reminder', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Call dentist', { due: tomorrowDue(), reminder: '60' })
  await expect(page.getByText('Call dentist')).toBeVisible()
  await expect(page.locator('[data-testid^="reminder-badge-"]').first()).toContainText('1h')
})
