import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import {
  acceptDialogs,
  createTodo,
  loginUser,
  registerUser,
  setupAuthenticator,
  tomorrowDue,
  uniqueUsername,
} from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

test('protected route redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('**/login')
  await expect(page.getByTestId(TID.authUsernameInput)).toBeVisible()
})

test('register, then create a title-only todo', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Buy groceries')
  await expect(page.getByText('Buy groceries')).toBeVisible()
  await expect(page.getByTestId(TID.pendingSection)).toBeVisible()
})

test('priority badge and high-priority creation', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Urgent task', { priority: 'high' })
  await expect(page.getByText('Urgent task')).toBeVisible()
  await expect(page.locator('[data-testid^="priority-badge-"]').first()).toHaveText('High')
})

test('toggle completion moves a todo to the Completed section', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Finish me')
  const item = page.getByText('Finish me')
  await expect(item).toBeVisible()
  // The checkbox is the only one in this fresh list. Use click() rather than
  // check() because completion state updates after an async round-trip.
  await page.locator('[data-testid^="todo-checkbox-"]').first().click()
  await expect(page.getByTestId(TID.completedSection)).toBeVisible()
  await expect(page.getByTestId(TID.completedCount)).toHaveText('1')
})

test('edit a todo title', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Original title')
  await page.locator('[data-testid^="edit-button-"]').first().click()
  await expect(page.getByTestId(TID.editModal)).toBeVisible()
  await page.getByTestId(TID.editTitleInput).fill('Edited title')
  await page.getByTestId(TID.editSave).click()
  await expect(page.getByText('Edited title')).toBeVisible()
  await expect(page.getByText('Original title')).toHaveCount(0)
})

test('delete a todo (with confirmation)', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Delete me')
  await expect(page.getByText('Delete me')).toBeVisible()
  await page.locator('[data-testid^="delete-button-"]').first().click()
  await expect(page.getByText('Delete me')).toHaveCount(0)
})

test('past due date is rejected', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await page.getByTestId(TID.todoTitleInput).fill('Time traveller')
  await page.getByTestId(TID.todoDueInput).fill('2020-01-01T09:00')
  await page.getByTestId(TID.todoAddButton).click()
  // Server rejects; an inline error appears and the todo is not created.
  await expect(page.getByText('Time traveller')).toHaveCount(0)
})

test('subtasks with progress tracking', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Prepare presentation')
  await page.locator('[data-testid^="subtasks-toggle-"]').first().click()
  const todoId = Number(
    (await page.locator('[data-testid^="todo-item-"]').first().getAttribute('data-testid'))!.replace(
      'todo-item-',
      '',
    ),
  )
  await page.getByTestId(TID.subtaskInput(todoId)).fill('Create slides')
  await page.getByTestId(TID.subtaskAdd(todoId)).click()
  await expect(page.getByText('Create slides')).toBeVisible()
  await page.getByTestId(TID.subtaskInput(todoId)).fill('Rehearse')
  await page.getByTestId(TID.subtaskAdd(todoId)).click()
  await expect(page.getByText('Rehearse')).toBeVisible()

  // Complete the first subtask -> progress should read 1/2.
  await page.locator('[data-testid^="subtask-checkbox-"]').first().click()
  await expect(page.getByTestId(TID.progressText(todoId))).toHaveText('1/2 subtasks')
})

test('tags: create, assign, and filter', async ({ page }) => {
  await registerUser(page, uniqueUsername())

  await page.getByTestId(TID.manageTagsButton).click()
  await expect(page.getByTestId(TID.tagModal)).toBeVisible()
  await page.getByTestId(TID.tagNameInput).fill('work')
  await page.getByTestId(TID.tagCreateButton).click()
  await expect(page.locator('[data-testid^="tag-row-"]')).toHaveCount(1)
  await page.getByTestId(TID.tagModalClose).click()

  // Discover the created tag id from its form toggle.
  const toggle = page.locator('[data-testid^="form-tag-toggle-"]').first()
  await expect(toggle).toBeVisible()
  const tagId = Number((await toggle.getAttribute('data-testid'))!.replace('form-tag-toggle-', ''))

  await createTodo(page, 'Tagged task', { tagIds: [tagId] })
  await expect(page.getByText('Tagged task')).toBeVisible()
  await createTodo(page, 'Untagged task')
  await expect(page.getByText('Untagged task')).toBeVisible()

  await page.getByTestId(TID.tagFilter).selectOption(String(tagId))
  await expect(page.getByText('Tagged task')).toBeVisible()
  await expect(page.getByText('Untagged task')).toHaveCount(0)
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

test('search filters todos by text', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Write report')
  await createTodo(page, 'Walk the dog')
  await page.getByTestId(TID.searchInput).fill('report')
  await expect(page.getByText('Write report')).toBeVisible()
  await expect(page.getByText('Walk the dog')).toHaveCount(0)
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

test('calendar view shows navigation, todos and holidays', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await page.getByTestId(TID.calendarLink).click()
  await page.waitForURL('**/calendar')
  await expect(page.getByTestId(TID.calendarGrid)).toBeVisible()

  // Navigate to December 2025 where a seeded holiday exists.
  await page.goto('/calendar?month=2025-12')
  await expect(page.getByTestId(TID.calendarTitle)).toHaveText('December 2025')
  await expect(page.getByTestId(TID.calendarHoliday('2025-12-25'))).toBeVisible()

  // Month navigation.
  await page.getByTestId(TID.calendarNext).click()
  await expect(page.getByTestId(TID.calendarTitle)).toHaveText('January 2026')
})
