import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import { acceptDialogs, createTodo, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

test('register, then create a title-only todo', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Buy groceries')
  await expect(page.getByText('Buy groceries')).toBeVisible()
  await expect(page.getByTestId(TID.pendingSection)).toBeVisible()
})

test('toggle completion moves a todo to the Completed section', async ({ page }) => {
  await registerUser(page, uniqueUsername())
  await createTodo(page, 'Finish me')
  await expect(page.getByText('Finish me')).toBeVisible()
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
  await expect(page.getByText('Time traveller')).toHaveCount(0)
})
