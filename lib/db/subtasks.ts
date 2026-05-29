import { db } from './connection'
import { getSingaporeNow } from '../timezone'
import type { Subtask } from './types'

interface SubtaskRow {
  id: number
  todo_id: number
  title: string
  completed: number
  position: number
  created_at: string
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

export const subtaskDB = {
  findByTodoId(todoId: number): Subtask[] {
    const rows = db
      .prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC, id ASC')
      .all(todoId) as SubtaskRow[]
    return rows.map(mapSubtask)
  },

  findById(id: number): Subtask | null {
    const row = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as
      | SubtaskRow
      | undefined
    return row ? mapSubtask(row) : null
  },

  create(todoId: number, title: string, position?: number): Subtask {
    const now = getSingaporeNow().toISOString()
    const pos =
      position ??
      ((
        db
          .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM subtasks WHERE todo_id = ?')
          .get(todoId) as { next: number }
      ).next)
    const info = db
      .prepare(
        'INSERT INTO subtasks (todo_id, title, completed, position, created_at) VALUES (?, ?, 0, ?, ?)',
      )
      .run(todoId, title, pos, now)
    return {
      id: Number(info.lastInsertRowid),
      todo_id: todoId,
      title,
      completed: false,
      position: pos,
      created_at: now,
    }
  },

  update(id: number, fields: { title?: string; completed?: boolean }): Subtask | null {
    const existing = this.findById(id)
    if (!existing) return null
    const title = fields.title ?? existing.title
    const completed = fields.completed ?? existing.completed
    db.prepare('UPDATE subtasks SET title = ?, completed = ? WHERE id = ?').run(
      title,
      completed ? 1 : 0,
      id,
    )
    return { ...existing, title, completed }
  },

  delete(id: number): boolean {
    const info = db.prepare('DELETE FROM subtasks WHERE id = ?').run(id)
    return info.changes > 0
  },

  /** Resolve the owning user id for a subtask (for authorization checks). */
  ownerUserId(subtaskId: number): number | null {
    const row = db
      .prepare(
        `SELECT t.user_id AS user_id
         FROM subtasks s JOIN todos t ON t.id = s.todo_id
         WHERE s.id = ?`,
      )
      .get(subtaskId) as { user_id: number } | undefined
    return row ? row.user_id : null
  },
}
