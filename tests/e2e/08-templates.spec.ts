import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import { acceptDialogs, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
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
