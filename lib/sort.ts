/**
 * Pure todo sort, shared by the server (initial query order) and the client
 * (re-sort after local mutations). Client-safe: no DB/native imports.
 *
 * Order: incomplete first; within incomplete by priority (high→low), then due
 * date (earliest first, no-due-date last), then newest. Completed last, most
 * recently completed first.
 */
import { PRIORITY_RANK, type Todo } from './db/types'

export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (a.completed && b.completed) {
      return (b.completed_at ?? '').localeCompare(a.completed_at ?? '')
    }
    const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (rank !== 0) return rank
    if (a.due_date && b.due_date) {
      const cmp = a.due_date.localeCompare(b.due_date)
      if (cmp !== 0) return cmp
    } else if (a.due_date && !b.due_date) {
      return -1
    } else if (!a.due_date && b.due_date) {
      return 1
    }
    return b.created_at.localeCompare(a.created_at)
  })
}
