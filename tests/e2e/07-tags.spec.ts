import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import { acceptDialogs, createTodo, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
})

test('tags: create, assign, and filter', async ({ page }) => {
  await registerUser(page, uniqueUsername())

  await page.getByTestId(TID.manageTagsButton).click()
  await expect(page.getByTestId(TID.tagModal)).toBeVisible()
  await page.getByTestId(TID.tagNameInput).fill('work')
  await page.getByTestId(TID.tagCreateButton).click()
  await expect(page.locator('[data-testid^="tag-row-"]')).toHaveCount(1)
  await page.getByTestId(TID.tagModalClose).click()

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
