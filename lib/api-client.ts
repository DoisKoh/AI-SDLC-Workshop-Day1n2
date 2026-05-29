/**
 * Typed client for the JSON API. Used by client components. Each function
 * unwraps the `{ success, data, error }` envelope and throws on failure so
 * callers can use try/catch.
 */
import type {
  Holiday,
  Priority,
  RecurrencePattern,
  Subtask,
  Tag,
  Template,
  TemplateSubtask,
  Todo,
} from './types'

export interface TodoCreatePayload {
  title: string
  due_date?: string | null
  priority?: Priority
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern | null
  reminder_minutes?: number | null
  tagIds?: number[]
}

export interface TodoUpdatePayload extends Partial<TodoCreatePayload> {
  completed?: boolean
}

export interface TemplateCreatePayload {
  name: string
  description?: string | null
  category?: string | null
  title_template: string
  priority?: Priority
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern | null
  reminder_minutes?: number | null
  due_date_offset_days?: number | null
  subtasks?: TemplateSubtask[]
}

export interface NotificationDue {
  id: number
  title: string
  due_date: string
  reminder_minutes: number
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const body = (await res.json().catch(() => null)) as
    | { success: boolean; data?: T; error?: string }
    | null
  if (!res.ok || !body || !body.success) {
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return body.data as T
}

export const todosApi = {
  list: () => request<Todo[]>('/api/todos'),
  get: (id: number) => request<Todo>(`/api/todos/${id}`),
  create: (payload: TodoCreatePayload) =>
    request<Todo>('/api/todos', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: TodoUpdatePayload) =>
    request<Todo>(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ id: number }>(`/api/todos/${id}`, { method: 'DELETE' }),
}

export const subtasksApi = {
  create: (todoId: number, title: string) =>
    request<Subtask>(`/api/todos/${todoId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  update: (id: number, fields: { title?: string; completed?: boolean }) =>
    request<Subtask>(`/api/subtasks/${id}`, { method: 'PUT', body: JSON.stringify(fields) }),
  remove: (id: number) => request<{ id: number }>(`/api/subtasks/${id}`, { method: 'DELETE' }),
}

export const tagsApi = {
  list: () => request<Tag[]>('/api/tags'),
  create: (name: string, color: string) =>
    request<Tag>('/api/tags', { method: 'POST', body: JSON.stringify({ name, color }) }),
  update: (id: number, fields: { name?: string; color?: string }) =>
    request<Tag>(`/api/tags/${id}`, { method: 'PUT', body: JSON.stringify(fields) }),
  remove: (id: number) => request<{ id: number }>(`/api/tags/${id}`, { method: 'DELETE' }),
}

export const templatesApi = {
  list: () => request<Template[]>('/api/templates'),
  create: (payload: TemplateCreatePayload) =>
    request<Template>('/api/templates', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: TemplateCreatePayload) =>
    request<Template>(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ id: number }>(`/api/templates/${id}`, { method: 'DELETE' }),
  use: (id: number) => request<Todo>(`/api/templates/${id}/use`, { method: 'POST' }),
}

export const notificationsApi = {
  // POST: this endpoint marks reminders as sent (a state change), not a pure read.
  check: () => request<NotificationDue[]>('/api/notifications/check', { method: 'POST' }),
}

export const holidaysApi = {
  list: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const qs = params.toString()
    return request<Holiday[]>(`/api/holidays${qs ? `?${qs}` : ''}`)
  },
}

export const importApi = {
  importTodos: (payload: unknown) =>
    request<{ imported: number; tagsCreated: number }>('/api/todos/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

/** Trigger a browser download of the export endpoint for the given format. */
export function downloadExport(format: 'json' | 'csv'): void {
  if (typeof window === 'undefined') return
  const link = document.createElement('a')
  link.href = `/api/todos/export?format=${format}`
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
