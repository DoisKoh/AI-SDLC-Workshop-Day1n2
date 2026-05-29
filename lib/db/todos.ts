import { db } from './connection'
import { getSingaporeNow, addRecurrence } from '../timezone'
import { sortTodos } from '../sort'
import {
  type Priority,
  type Progress,
  type RecurrencePattern,
  type Subtask,
  type Tag,
  type Todo,
} from './types'

interface TodoRow {
  id: number
  user_id: number
  title: string
  completed: number
  due_date: string | null
  priority: string
  is_recurring: number
  recurrence_pattern: string | null
  reminder_minutes: number | null
  last_notification_sent: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface SubtaskRow {
  id: number
  todo_id: number
  title: string
  completed: number
  position: number
  created_at: string
}

interface TagJoinRow {
  todo_id: number
  id: number
  user_id: number
  name: string
  color: string
  created_at: string
}

function computeProgress(subtasks: Subtask[]): Progress {
  const total = subtasks.length
  const completed = subtasks.filter((s) => s.completed).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { completed, total, percent }
}

function mapTodo(row: TodoRow, subtasks: Subtask[], tags: Tag[]): Todo {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    completed: row.completed === 1,
    due_date: row.due_date,
    priority: row.priority as Priority,
    is_recurring: row.is_recurring === 1,
    recurrence_pattern: (row.recurrence_pattern as RecurrencePattern | null) ?? null,
    reminder_minutes: row.reminder_minutes ?? null,
    last_notification_sent: row.last_notification_sent ?? null,
    completed_at: row.completed_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    subtasks,
    tags,
    progress: computeProgress(subtasks),
  }
}

function mapSubtask(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    todo_id: row.todo_id,
    title: row.title,
    completed: row.completed === 1,
    position: row.position,
    created_at: row.created_at,
  }
}

function loadRelations(todoIds: number[]): {
  subtasksByTodo: Map<number, Subtask[]>
  tagsByTodo: Map<number, Tag[]>
} {
  const subtasksByTodo = new Map<number, Subtask[]>()
  const tagsByTodo = new Map<number, Tag[]>()
  if (todoIds.length === 0) return { subtasksByTodo, tagsByTodo }

  const placeholders = todoIds.map(() => '?').join(',')

  const subtaskRows = db
    .prepare(
      `SELECT * FROM subtasks WHERE todo_id IN (${placeholders}) ORDER BY position ASC, id ASC`,
    )
    .all(...todoIds) as SubtaskRow[]
  for (const row of subtaskRows) {
    const list = subtasksByTodo.get(row.todo_id) ?? []
    list.push(mapSubtask(row))
    subtasksByTodo.set(row.todo_id, list)
  }

  const tagRows = db
    .prepare(
      `SELECT tt.todo_id AS todo_id, tg.id, tg.user_id, tg.name, tg.color, tg.created_at
       FROM todo_tags tt JOIN tags tg ON tg.id = tt.tag_id
       WHERE tt.todo_id IN (${placeholders})
       ORDER BY tg.name COLLATE NOCASE ASC`,
    )
    .all(...todoIds) as TagJoinRow[]
  for (const row of tagRows) {
    const list = tagsByTodo.get(row.todo_id) ?? []
    list.push({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      color: row.color,
      created_at: row.created_at,
    })
    tagsByTodo.set(row.todo_id, list)
  }

  return { subtasksByTodo, tagsByTodo }
}

export interface CreateTodoInput {
  title: string
  due_date?: string | null
  priority?: Priority
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern | null
  reminder_minutes?: number | null
  tagIds?: number[]
  // Optional explicit state, used when importing existing todos so timestamps
  // and completion status round-trip instead of being stamped "now".
  completed?: boolean
  completed_at?: string | null
  created_at?: string
}

export interface UpdateTodoInput {
  title?: string
  due_date?: string | null
  priority?: Priority
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern | null
  reminder_minutes?: number | null
  completed?: boolean
  tagIds?: number[]
}

type SetTodoTags = (todoId: number, tagIds: number[], userId: number) => void
let _setTodoTags: SetTodoTags | null = null

/** Lazily build the tag-replacement transaction (defers DB access to first use). */
function setTodoTags(todoId: number, tagIds: number[], userId: number): void {
  if (!_setTodoTags) {
    _setTodoTags = db.transaction((tId: number, ids: number[], uId: number) => {
      db.prepare('DELETE FROM todo_tags WHERE todo_id = ?').run(tId)
      const insert = db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)')
      const ownsTag = db.prepare('SELECT 1 FROM tags WHERE id = ? AND user_id = ?')
      for (const tagId of ids) {
        // Only attach tags the user actually owns.
        if (ownsTag.get(tagId, uId)) insert.run(tId, tagId)
      }
    })
  }
  _setTodoTags(todoId, tagIds, userId)
}

export const todoDB = {
  findByUserId(userId: number): Todo[] {
    const rows = db
      .prepare('SELECT * FROM todos WHERE user_id = ?')
      .all(userId) as TodoRow[]
    const { subtasksByTodo, tagsByTodo } = loadRelations(rows.map((r) => r.id))
    const todos = rows.map((r) =>
      mapTodo(r, subtasksByTodo.get(r.id) ?? [], tagsByTodo.get(r.id) ?? []),
    )
    return sortTodos(todos)
  },

  findById(id: number, userId: number): Todo | null {
    const row = db
      .prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?')
      .get(id, userId) as TodoRow | undefined
    if (!row) return null
    const { subtasksByTodo, tagsByTodo } = loadRelations([row.id])
    return mapTodo(row, subtasksByTodo.get(row.id) ?? [], tagsByTodo.get(row.id) ?? [])
  },

  create(userId: number, input: CreateTodoInput): Todo {
    const now = getSingaporeNow().toISOString()
    const createdAt = input.created_at ?? now
    const completed = input.completed ?? false
    const completedAt = completed ? (input.completed_at ?? now) : null
    const info = db
      .prepare(
        `INSERT INTO todos
          (user_id, title, completed, due_date, priority, is_recurring, recurrence_pattern,
           reminder_minutes, last_notification_sent, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      )
      .run(
        userId,
        input.title,
        completed ? 1 : 0,
        input.due_date ?? null,
        input.priority ?? 'medium',
        input.is_recurring ? 1 : 0,
        input.recurrence_pattern ?? null,
        input.reminder_minutes ?? null,
        completedAt,
        createdAt,
        now,
      )
    const id = Number(info.lastInsertRowid)
    if (input.tagIds && input.tagIds.length > 0) {
      setTodoTags(id, input.tagIds, userId)
    }
    return this.findById(id, userId) as Todo
  },

  update(id: number, userId: number, input: UpdateTodoInput): Todo | null {
    const existing = this.findById(id, userId)
    if (!existing) return null

    const completed = input.completed ?? existing.completed
    const completedChanged = input.completed !== undefined && input.completed !== existing.completed
    const completed_at = completedChanged
      ? completed
        ? getSingaporeNow().toISOString()
        : null
      : existing.completed_at

    const next = {
      title: input.title ?? existing.title,
      due_date: input.due_date === undefined ? existing.due_date : input.due_date,
      priority: input.priority ?? existing.priority,
      is_recurring: input.is_recurring ?? existing.is_recurring,
      recurrence_pattern:
        input.recurrence_pattern === undefined
          ? existing.recurrence_pattern
          : input.recurrence_pattern,
      reminder_minutes:
        input.reminder_minutes === undefined ? existing.reminder_minutes : input.reminder_minutes,
    }

    // Re-arm the reminder when the schedule changes, so a rescheduled todo can
    // notify again (findReminderCandidates gates on last_notification_sent IS NULL).
    // Compare due dates by instant, not raw string, so equivalent timestamps
    // (e.g. differing sub-second precision) don't count as a change.
    const dueChanged =
      input.due_date !== undefined &&
      ((input.due_date === null) !== (existing.due_date === null) ||
        (input.due_date !== null &&
          existing.due_date !== null &&
          Date.parse(input.due_date) !== Date.parse(existing.due_date)))
    const reminderChanged =
      input.reminder_minutes !== undefined && input.reminder_minutes !== existing.reminder_minutes
    const lastNotificationSent =
      dueChanged || reminderChanged ? null : existing.last_notification_sent

    db.prepare(
      `UPDATE todos SET
        title = ?, completed = ?, due_date = ?, priority = ?, is_recurring = ?,
        recurrence_pattern = ?, reminder_minutes = ?, completed_at = ?,
        last_notification_sent = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      next.title,
      completed ? 1 : 0,
      next.due_date,
      next.priority,
      next.is_recurring ? 1 : 0,
      next.is_recurring ? next.recurrence_pattern : null,
      next.reminder_minutes,
      completed_at,
      lastNotificationSent,
      getSingaporeNow().toISOString(),
      id,
      userId,
    )

    if (input.tagIds !== undefined) {
      setTodoTags(id, input.tagIds, userId)
    }

    return this.findById(id, userId)
  },

  setTags(id: number, userId: number, tagIds: number[]): Todo | null {
    const existing = this.findById(id, userId)
    if (!existing) return null
    setTodoTags(id, tagIds, userId)
    return this.findById(id, userId)
  },

  delete(id: number, userId: number): boolean {
    const info = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, userId)
    return info.changes > 0
  },

  markNotificationSent(id: number, at: string): void {
    db.prepare('UPDATE todos SET last_notification_sent = ? WHERE id = ?').run(at, id)
  },

  /**
   * Todos that have a due date + reminder, are not completed, and have not yet
   * had a notification sent. The reminder-time-reached check is applied by the
   * caller (so it can use a single "now").
   */
  findReminderCandidates(
    userId: number,
  ): { id: number; title: string; due_date: string; reminder_minutes: number }[] {
    return db
      .prepare(
        `SELECT id, title, due_date, reminder_minutes FROM todos
         WHERE user_id = ?
           AND completed = 0
           AND due_date IS NOT NULL
           AND reminder_minutes IS NOT NULL
           AND last_notification_sent IS NULL`,
      )
      .all(userId) as { id: number; title: string; due_date: string; reminder_minutes: number }[]
  },

  /**
   * Create the next instance of a recurring todo, inheriting priority, tags,
   * reminder offset and recurrence pattern, with the due date advanced by pattern.
   */
  createNextInstance(todo: Todo): Todo | null {
    if (!todo.is_recurring || !todo.recurrence_pattern || !todo.due_date) return null
    // Advance by the pattern until the next occurrence is in the future, so a
    // todo completed late doesn't immediately spawn an already-overdue instance.
    const nowMs = getSingaporeNow().getTime()
    let nextDue = addRecurrence(new Date(todo.due_date), todo.recurrence_pattern)
    let guard = 0
    while (nextDue.getTime() <= nowMs && guard < 1000) {
      nextDue = addRecurrence(nextDue, todo.recurrence_pattern)
      guard++
    }
    return this.create(todo.user_id, {
      title: todo.title,
      due_date: nextDue.toISOString(),
      priority: todo.priority,
      is_recurring: true,
      recurrence_pattern: todo.recurrence_pattern,
      reminder_minutes: todo.reminder_minutes,
      tagIds: todo.tags.map((t) => t.id),
    })
  },
}
