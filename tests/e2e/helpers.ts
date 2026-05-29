import { expect, type BrowserContext, type Page } from '@playwright/test'
import { TID } from '../../lib/testids'

/**
 * Install a virtual WebAuthn authenticator on the context via CDP. Must be
 * called before any registration/login ceremony. Returns the CDP session.
 */
export async function setupAuthenticator(context: BrowserContext, page: Page) {
  const client = await context.newCDPSession(page)
  await client.send('WebAuthn.enable')
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })
  return client
}

/** Auto-accept native confirm() dialogs (used by delete actions). */
export function acceptDialogs(page: Page) {
  page.on('dialog', (dialog) => {
    void dialog.accept()
  })
}

export function uniqueUsername(prefix = 'user'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export async function registerUser(page: Page, username: string) {
  await page.goto('/login')
  await page.getByTestId(TID.authTabRegister).click()
  await page.getByTestId(TID.authUsernameInput).fill(username)
  await page.getByTestId(TID.authSubmit).click()
  await page.waitForURL('**/')
  await expect(page.getByTestId(TID.todoForm)).toBeVisible()
}

export async function loginUser(page: Page, username: string) {
  await page.goto('/login')
  await page.getByTestId(TID.authTabLogin).click()
  await page.getByTestId(TID.authUsernameInput).fill(username)
  await page.getByTestId(TID.authSubmit).click()
  await page.waitForURL('**/')
  await expect(page.getByTestId(TID.todoForm)).toBeVisible()
}

interface CreateTodoOptions {
  priority?: 'high' | 'medium' | 'low'
  due?: string // datetime-local value, Singapore wall clock
  recurring?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  reminder?: string // minutes value as string, e.g. '60'
  tagIds?: number[]
}

export async function createTodo(page: Page, title: string, opts: CreateTodoOptions = {}) {
  await page.getByTestId(TID.todoTitleInput).fill(title)
  if (opts.priority) await page.getByTestId(TID.todoPrioritySelect).selectOption(opts.priority)
  if (opts.due) await page.getByTestId(TID.todoDueInput).fill(opts.due)
  if (opts.recurring) {
    await page.getByTestId(TID.todoRecurringCheckbox).check()
    await page.getByTestId(TID.todoRecurrenceSelect).selectOption(opts.recurring)
  }
  if (opts.reminder) await page.getByTestId(TID.todoReminderSelect).selectOption(opts.reminder)
  for (const tagId of opts.tagIds ?? []) {
    await page.getByTestId(TID.formTagToggle(tagId)).click()
  }
  await page.getByTestId(TID.todoAddButton).click()
  // Wait for the create to land before returning. Otherwise the form's
  // post-create reset can race a subsequent createTodo() and blank its title.
  await expect(page.getByText(title).first()).toBeVisible()
}

/** Tomorrow at 09:00 Singapore time as a datetime-local value. */
export function tomorrowDue(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  // Convert to Singapore wall clock (UTC+8) for the datetime-local input.
  const sg = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${sg.getUTCFullYear()}-${pad(sg.getUTCMonth() + 1)}-${pad(sg.getUTCDate())}T09:00`
}
