import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import { acceptDialogs, createTodo, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
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
