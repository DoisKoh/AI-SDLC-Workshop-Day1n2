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

test('calendar view shows navigation, todos and holidays', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await page.getByTestId(TID.calendarLink).click()
  await page.waitForURL('**/calendar')
  await expect(page.getByTestId(TID.calendarGrid)).toBeVisible()

  // Navigate to December 2025 where a seeded holiday exists.
  await page.goto('/calendar?month=2025-12')
  await expect(page.getByTestId(TID.calendarTitle)).toHaveText('December 2025')
  await expect(page.getByTestId(TID.calendarHoliday('2025-12-25'))).toBeVisible()

  await page.getByTestId(TID.calendarNext).click()
  await expect(page.getByTestId(TID.calendarTitle)).toHaveText('January 2026')
})

test('calendar day modal lists that day’s todos', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  const due = tomorrowDue() // YYYY-MM-DDT09:00
  const dateKey = due.slice(0, 10)
  const month = due.slice(0, 7)
  await createTodo(page, 'Calendar task', { due })

  await page.goto(`/calendar?month=${month}`)
  await expect(page.getByTestId(TID.calendarGrid)).toBeVisible()
  await page.getByTestId(TID.calendarDay(dateKey)).click()
  await expect(page.getByTestId(TID.dayModal)).toBeVisible()
  await expect(page.getByTestId(TID.dayModal).getByText('Calendar task')).toBeVisible()
})
