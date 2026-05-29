import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
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

test('recurring todo spawns the next instance on completion', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Daily standup', { due: tomorrowDue(), recurring: 'daily' })
  await expect(page.getByText('Daily standup')).toHaveCount(1)

  await page.locator('[data-testid^="todo-checkbox-"]').first().click()
  // One completed instance + one freshly created next instance.
  await expect(page.getByText('Daily standup')).toHaveCount(2)
  await expect(page.getByTestId(TID.completedCount)).toHaveText('1')
})

test('edit modal can add recurrence and reminder', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Weekly sync', { due: tomorrowDue() })
  await page.locator('[data-testid^="edit-button-"]').first().click()
  await expect(page.getByTestId(TID.editModal)).toBeVisible()
  await page.getByTestId(TID.editRecurringCheckbox).check()
  await page.getByTestId(TID.editRecurrenceSelect).selectOption('weekly')
  await page.getByTestId(TID.editReminderSelect).selectOption('60')
  await page.getByTestId(TID.editSave).click()
  await expect(page.getByTestId(TID.editModal)).toHaveCount(0)
  await expect(page.locator('[data-testid^="recurrence-badge-"]').first()).toContainText('Weekly')
  await expect(page.locator('[data-testid^="reminder-badge-"]').first()).toContainText('1h')
})
