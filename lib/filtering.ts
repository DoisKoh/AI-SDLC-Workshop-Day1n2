/**
 * Pure, client-safe filtering + sectioning logic for todos. Kept free of React
 * and DB imports so it is trivially unit-testable and reusable on the calendar.
 */
import { getSingaporeNow, isPast, singaporePartsToDate } from './timezone'
import type { Priority, Todo } from './types'

export interface FilterState {
  search: string
  priority: 'all' | Priority
  tagId: 'all' | number
  completion: 'all' | 'incomplete' | 'completed'
  dateFrom: string // YYYY-MM-DD or ''
  dateTo: string // YYYY-MM-DD or ''
}

export const EMPTY_FILTERS: FilterState = {
  search: '',
  priority: 'all',
  tagId: 'all',
  completion: 'all',
  dateFrom: '',
  dateTo: '',
}

/** Count active (non-default) filter groups. 0 means no filters applied. */
export function activeFilterCount(f: FilterState): number {
  let count = 0
  if (f.search.trim() !== '') count++
  if (f.priority !== 'all') count++
  if (f.tagId !== 'all') count++
  if (f.completion !== 'all') count++
  if (f.dateFrom !== '' || f.dateTo !== '') count++
  return count
}

function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

/** Start-of-day in Singapore time for a YYYY-MM-DD key, as a UTC instant (ms). */
function dayStartMs(key: string): number | null {
  const p = parseDateKey(key)
  if (!p) return null
  return singaporePartsToDate({ ...p, hour: 0, minute: 0, second: 0 }).getTime()
}

/** End-of-day in Singapore time for a YYYY-MM-DD key, as a UTC instant (ms). */
function dayEndMs(key: string): number | null {
  const p = parseDateKey(key)
  if (!p) return null
  return singaporePartsToDate({ ...p, hour: 23, minute: 59, second: 59 }).getTime()
}

export function matchesFilters(todo: Todo, filters: FilterState): boolean {
  // Search: title OR any subtask title (case-insensitive, partial).
  const query = filters.search.trim().toLowerCase()
  if (query) {
    const inTitle = todo.title.toLowerCase().includes(query)
    const inSubtasks = todo.subtasks.some((s) => s.title.toLowerCase().includes(query))
    if (!inTitle && !inSubtasks) return false
  }

  if (filters.priority !== 'all' && todo.priority !== filters.priority) return false

  if (filters.tagId !== 'all' && !todo.tags.some((t) => t.id === filters.tagId)) return false

  if (filters.completion === 'incomplete' && todo.completed) return false
  if (filters.completion === 'completed' && !todo.completed) return false

  if (filters.dateFrom || filters.dateTo) {
    if (!todo.due_date) return false
    const due = Date.parse(todo.due_date)
    if (filters.dateFrom) {
      const from = dayStartMs(filters.dateFrom)
      if (from !== null && due < from) return false
    }
    if (filters.dateTo) {
      const to = dayEndMs(filters.dateTo)
      if (to !== null && due > to) return false
    }
  }

  return true
}

export function filterTodos(todos: Todo[], filters: FilterState): Todo[] {
  return todos.filter((t) => matchesFilters(t, filters))
}

export interface TodoSections {
  overdue: Todo[]
  pending: Todo[]
  completed: Todo[]
}

/**
 * Split todos into Overdue / Pending / Completed. Input order is preserved
 * (callers pass an already-sorted list), so section order stays correct.
 */
export function splitSections(todos: Todo[], now: Date = getSingaporeNow()): TodoSections {
  const overdue: Todo[] = []
  const pending: Todo[] = []
  const completed: Todo[] = []

  for (const todo of todos) {
    if (todo.completed) {
      completed.push(todo)
    } else if (todo.due_date && isPast(new Date(todo.due_date), now)) {
      overdue.push(todo)
    } else {
      pending.push(todo)
    }
  }

  return { overdue, pending, completed }
}
