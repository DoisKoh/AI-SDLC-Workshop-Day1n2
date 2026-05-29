import type { Subtask, Tag, Todo } from '@/lib/types'

let id = 1
const nextId = () => id++

export function makeTag(partial: Partial<Tag> = {}): Tag {
  return {
    id: nextId(),
    user_id: 1,
    name: 'tag',
    color: '#3B82F6',
    created_at: '2025-01-01T00:00:00.000Z',
    ...partial,
  }
}

export function makeSubtask(partial: Partial<Subtask> = {}): Subtask {
  return {
    id: nextId(),
    todo_id: 1,
    title: 'subtask',
    completed: false,
    position: 0,
    created_at: '2025-01-01T00:00:00.000Z',
    ...partial,
  }
}

export function makeTodo(partial: Partial<Todo> = {}): Todo {
  const subtasks = partial.subtasks ?? []
  const completed = subtasks.filter((s) => s.completed).length
  return {
    id: nextId(),
    user_id: 1,
    title: 'todo',
    completed: false,
    due_date: null,
    priority: 'medium',
    is_recurring: false,
    recurrence_pattern: null,
    reminder_minutes: null,
    last_notification_sent: null,
    completed_at: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    tags: [],
    progress: {
      completed,
      total: subtasks.length,
      percent: subtasks.length === 0 ? 0 : Math.round((completed / subtasks.length) * 100),
    },
    ...partial,
    subtasks,
  }
}
