import { expect, test } from '@playwright/test'
import { TID } from '../../lib/testids'
import { acceptDialogs, createTodo, registerUser, setupAuthenticator, uniqueUsername } from './helpers'

test.beforeEach(async ({ context, page }) => {
  await setupAuthenticator(context, page)
  acceptDialogs(page)
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
