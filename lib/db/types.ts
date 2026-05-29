/**
 * Shared domain types. Imported by both API routes (server) and client
 * components, so this file must stay free of any runtime DB imports.
 */

export type Priority = 'high' | 'medium' | 'low'
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Allowed reminder offsets, in minutes before the due date. */
export const REMINDER_OPTIONS = [15, 30, 60, 120, 1440, 2880, 10080] as const
export type ReminderMinutes = (typeof REMINDER_OPTIONS)[number]

export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low']
export const RECURRENCE_PATTERNS: readonly RecurrencePattern[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
]

export interface User {
  id: number
  username: string
  created_at: string
}

export interface Authenticator {
  id: number
  user_id: number
  credential_id: string // base64url
  credential_public_key: Buffer
  counter: number
  transports: string[] | null
  created_at: string
}

export interface Subtask {
  id: number
  todo_id: number
  title: string
  completed: boolean
  position: number
  created_at: string
}

export interface Tag {
  id: number
  user_id: number
  name: string
  color: string
  created_at: string
}

export interface Progress {
  completed: number
  total: number
  percent: number
}

export interface Todo {
  id: number
  user_id: number
  title: string
  completed: boolean
  due_date: string | null // UTC ISO 8601
  priority: Priority
  is_recurring: boolean
  recurrence_pattern: RecurrencePattern | null
  reminder_minutes: number | null
  last_notification_sent: string | null // UTC ISO 8601
  completed_at: string | null // UTC ISO 8601
  created_at: string
  updated_at: string
  subtasks: Subtask[]
  tags: Tag[]
  progress: Progress
}

export interface TemplateSubtask {
  title: string
  position: number
}

export interface Template {
  id: number
  user_id: number
  name: string
  description: string | null
  category: string | null
  title_template: string
  priority: Priority
  is_recurring: boolean
  recurrence_pattern: RecurrencePattern | null
  reminder_minutes: number | null
  due_date_offset_days: number | null
  subtasks: TemplateSubtask[]
  created_at: string
}

export interface Holiday {
  id: number
  date: string // YYYY-MM-DD (Singapore)
  name: string
}

/** Priority ordering used for sorting (lower = higher priority). */
export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}
