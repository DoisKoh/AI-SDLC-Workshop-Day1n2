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

test('reminder badge shows on a todo with a due date and reminder', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Call dentist', { due: tomorrowDue(), reminder: '60' })
  await expect(page.getByText('Call dentist')).toBeVisible()
  await expect(page.locator('[data-testid^="reminder-badge-"]').first()).toContainText('1h')
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

test('templates: save from form, use, and delete', async ({ page }) => {
  await registerUser(page, uniqueUsername())

  await page.getByTestId(TID.todoTitleInput).fill('Sprint planning')
  await page.getByTestId(TID.todoPrioritySelect).selectOption('high')
  await page.getByTestId(TID.saveTemplateButton).click()
  await expect(page.getByTestId(TID.saveTemplateModal)).toBeVisible()
  await page.getByTestId(TID.templateNameInput).fill('Sprint')
  await page.getByTestId(TID.templateCategoryInput).fill('Work')
  await page.getByTestId(TID.templateSaveButton).click()
  await expect(page.getByTestId(TID.saveTemplateModal)).toHaveCount(0)

  // Use the template via the dropdown.
  await page.getByTestId(TID.useTemplateSelect).selectOption({ label: 'Sprint (Work)' })
  await expect(page.getByText('Sprint planning')).toBeVisible()

  // Manage + delete the template.
  await page.getByTestId(TID.templatesButton).click()
  await expect(page.getByTestId(TID.templateModal)).toBeVisible()
  await expect(page.locator('[data-testid^="template-row-"]')).toHaveCount(1)
  await page.locator('[data-testid^="template-delete-button-"]').first().click()
  await expect(page.locator('[data-testid^="template-row-"]')).toHaveCount(0)
})

test('export downloads a JSON file containing the todos', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Exportable')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId(TID.exportJsonButton).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/todos-\d{4}-\d{2}-\d{2}\.json/)
  const path = await download.path()
  const fs = await import('node:fs')
  const content = JSON.parse(fs.readFileSync(path, 'utf8'))
  expect(content.todos.some((t: { title: string }) => t.title === 'Exportable')).toBe(true)
})

test('import creates todos from a JSON payload', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  const payload = {
    version: 1,
    tags: [{ name: 'imported-tag', color: '#10B981' }],
    todos: [
      { title: 'Imported A', priority: 'low', tags: ['imported-tag'] },
      { title: 'Imported B', completed: true },
    ],
  }
  await page.getByTestId(TID.importInput).setInputFiles({
    name: 'todos.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  })
  await expect(page.getByTestId(TID.importStatus)).toContainText('Successfully imported 2')
  await expect(page.getByText('Imported A')).toBeVisible()
  await expect(page.getByTestId(TID.completedSection)).toBeVisible()
})

test('import rejects invalid JSON with a clear message', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await page.getByTestId(TID.importInput).setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ not valid json'),
  })
  await expect(page.getByTestId(TID.importStatus)).toContainText('Invalid JSON format')
})

test('advanced filters and saved presets', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Report draft')
  await createTodo(page, 'Buy milk')

  await page.getByTestId(TID.searchInput).fill('report')
  await expect(page.getByText('Buy milk')).toHaveCount(0)

  // Save the active filter as a preset.
  await page.getByTestId(TID.saveFilterButton).click()
  await expect(page.getByTestId(TID.saveFilterModal)).toBeVisible()
  await page.getByTestId(TID.filterNameInput).fill('Reports')
  await page.getByTestId(TID.filterSaveButton).click()

  // Clear, then re-apply via the preset.
  await page.getByTestId(TID.clearFiltersButton).click()
  await expect(page.getByText('Buy milk')).toBeVisible()
  await page.getByTestId(TID.advancedToggle).click()
  await page.getByTestId(TID.presetPill('Reports')).click()
  await expect(page.getByText('Report draft')).toBeVisible()
  await expect(page.getByText('Buy milk')).toHaveCount(0)

  // Delete the preset (advanced panel is still open from applying it).
  await page.getByTestId(TID.presetDelete('Reports')).click()
  await expect(page.getByTestId(TID.presetPill('Reports'))).toHaveCount(0)
})

test('completion filter shows only completed todos', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Stays open')
  await createTodo(page, 'Gets done')
  // Complete the "Gets done" todo (it is first in the list, newest medium).
  await page
    .locator('[data-testid^="todo-item-"]', { hasText: 'Gets done' })
    .locator('[data-testid^="todo-checkbox-"]')
    .click()
  await page.getByTestId(TID.advancedToggle).click()
  await page.getByTestId(TID.completionFilter).selectOption('completed')
  await expect(page.getByText('Gets done')).toBeVisible()
  await expect(page.getByText('Stays open')).toHaveCount(0)
})

test('tag edit and delete', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await page.getByTestId(TID.manageTagsButton).click()
  await page.getByTestId(TID.tagNameInput).fill('work')
  await page.getByTestId(TID.tagCreateButton).click()
  const row = page.locator('[data-testid^="tag-row-"]').first()
  await expect(row).toBeVisible()
  const tagId = Number((await row.getAttribute('data-testid'))!.replace('tag-row-', ''))

  await page.getByTestId(TID.tagEditButton(tagId)).click()
  await row.locator('input[type="text"]').fill('office')
  await page.getByTestId(TID.tagUpdateButton(tagId)).click()
  await expect(page.getByTestId(TID.tagRow(tagId))).toContainText('office')

  await page.getByTestId(TID.tagDeleteButton(tagId)).click()
  await expect(page.locator('[data-testid^="tag-row-"]')).toHaveCount(0)
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
