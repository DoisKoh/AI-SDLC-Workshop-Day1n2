import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import { acceptDialogs, createTodo, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

test('search filters todos by text', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Write report')
  await createTodo(page, 'Walk the dog')
  await page.getByTestId(TID.searchInput).fill('report')
  await expect(page.getByText('Write report')).toBeVisible()
  await expect(page.getByText('Walk the dog')).toHaveCount(0)
})

test('search matches tag names', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await page.getByTestId(TID.manageTagsButton).click()
  await page.getByTestId(TID.tagNameInput).fill('finance')
  await page.getByTestId(TID.tagCreateButton).click()
  await page.getByTestId(TID.tagModalClose).click()
  const toggle = page.locator('[data-testid^="form-tag-toggle-"]').first()
  await expect(toggle).toBeVisible()
  const tagId = Number((await toggle.getAttribute('data-testid'))!.replace('form-tag-toggle-', ''))

  await createTodo(page, 'Pay bills', { tagIds: [tagId] })
  await createTodo(page, 'Read a book')
  await page.getByTestId(TID.searchInput).fill('finance')
  await expect(page.getByText('Pay bills')).toBeVisible()
  await expect(page.getByText('Read a book')).toHaveCount(0)
})

test('advanced filters and saved presets', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Report draft')
  await createTodo(page, 'Buy milk')

  await page.getByTestId(TID.searchInput).fill('report')
  await expect(page.getByText('Buy milk')).toHaveCount(0)

  await page.getByTestId(TID.saveFilterButton).click()
  await expect(page.getByTestId(TID.saveFilterModal)).toBeVisible()
  await page.getByTestId(TID.filterNameInput).fill('Reports')
  await page.getByTestId(TID.filterSaveButton).click()

  await page.getByTestId(TID.clearFiltersButton).click()
  await expect(page.getByText('Buy milk')).toBeVisible()
  await page.getByTestId(TID.advancedToggle).click()
  await page.getByTestId(TID.presetPill('Reports')).click()
  await expect(page.getByText('Report draft')).toBeVisible()
  await expect(page.getByText('Buy milk')).toHaveCount(0)

  await page.getByTestId(TID.presetDelete('Reports')).click()
  await expect(page.getByTestId(TID.presetPill('Reports'))).toHaveCount(0)
})

test('completion filter shows only completed todos', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Stays open')
  await createTodo(page, 'Gets done')
  await page
    .locator('[data-testid^="todo-item-"]', { hasText: 'Gets done' })
    .locator('[data-testid^="todo-checkbox-"]')
    .click()
  await page.getByTestId(TID.advancedToggle).click()
  await page.getByTestId(TID.completionFilter).selectOption('completed')
  await expect(page.getByText('Gets done')).toBeVisible()
  await expect(page.getByText('Stays open')).toHaveCount(0)
})
