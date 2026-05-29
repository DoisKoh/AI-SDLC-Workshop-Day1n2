import { expect, test } from '@playwright/test'
import { acceptDialogs, createTodo, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

test('priority badge and high-priority creation', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Urgent task', { priority: 'high' })
  await expect(page.getByText('Urgent task')).toBeVisible()
  await expect(page.locator('[data-testid^="priority-badge-"]').first()).toHaveText('High')
})
