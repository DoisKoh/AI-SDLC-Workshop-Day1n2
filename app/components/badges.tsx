'use client'

import { readableTextColor } from '@/lib/color'
import { PRIORITY_LABEL, REMINDER_BADGE_LABEL, RECURRENCE_LABEL } from '@/lib/labels'
import { TID } from '@/lib/testids'
import type { Priority, RecurrencePattern, Tag } from '@/lib/types'

const PRIORITY_CLASSES: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

const baseBadge =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap'

export function PriorityBadge({ priority, todoId }: { priority: Priority; todoId?: number }) {
  return (
    <span
      className={`${baseBadge} ${PRIORITY_CLASSES[priority]}`}
      data-testid={todoId !== undefined ? TID.priorityBadge(todoId) : undefined}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

export function RecurrenceBadge({
  pattern,
  todoId,
}: {
  pattern: RecurrencePattern
  todoId?: number
}) {
  return (
    <span
      className={`${baseBadge} border border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-300`}
      data-testid={todoId !== undefined ? TID.recurrenceBadge(todoId) : undefined}
    >
      🔄 {RECURRENCE_LABEL[pattern] ?? pattern}
    </span>
  )
}

export function ReminderBadge({ minutes, todoId }: { minutes: number; todoId?: number }) {
  return (
    <span
      className={`${baseBadge} bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300`}
      data-testid={todoId !== undefined ? TID.reminderBadge(todoId) : undefined}
    >
      🔔 {REMINDER_BADGE_LABEL[minutes] ?? `${minutes}m`}
    </span>
  )
}

export function TagBadge({
  tag,
  todoId,
  onClick,
}: {
  tag: Tag
  todoId: number
  onClick?: (tagId: number) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(tag.id) : undefined}
      className={baseBadge}
      style={{ backgroundColor: tag.color, color: readableTextColor(tag.color) }}
      data-testid={TID.tagBadge(todoId, tag.id)}
      title={onClick ? `Filter by ${tag.name}` : tag.name}
    >
      {tag.name}
    </button>
  )
}
