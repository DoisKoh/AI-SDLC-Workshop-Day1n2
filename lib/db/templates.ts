import { db } from './connection'
import { getSingaporeNow } from '../timezone'
import { todoDB } from './todos'
import { subtaskDB } from './subtasks'
import type { Priority, RecurrencePattern, Template, TemplateSubtask, Todo } from './types'

interface TemplateRow {
  id: number
  user_id: number
  name: string
  description: string | null
  category: string | null
  title_template: string
  priority: string
  is_recurring: number
  recurrence_pattern: string | null
  reminder_minutes: number | null
  due_date_offset_days: number | null
  subtasks: string | null
  created_at: string
}

function parseSubtasks(json: string | null): TemplateSubtask[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s): s is TemplateSubtask => typeof s?.title === 'string')
      .map((s, i) => ({ title: s.title, position: typeof s.position === 'number' ? s.position : i }))
  } catch {
    return []
  }
}

function mapTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    category: row.category,
    title_template: row.title_template,
    priority: row.priority as Priority,
    is_recurring: row.is_recurring === 1,
    recurrence_pattern: (row.recurrence_pattern as RecurrencePattern | null) ?? null,
    reminder_minutes: row.reminder_minutes ?? null,
    due_date_offset_days: row.due_date_offset_days ?? null,
    subtasks: parseSubtasks(row.subtasks),
    created_at: row.created_at,
  }
}

export interface CreateTemplateInput {
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

export const templateDB = {
  findByUserId(userId: number): Template[] {
    const rows = db
      .prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as TemplateRow[]
    return rows.map(mapTemplate)
  },

  findById(id: number, userId: number): Template | null {
    const row = db
      .prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?')
      .get(id, userId) as TemplateRow | undefined
    return row ? mapTemplate(row) : null
  },

  create(userId: number, input: CreateTemplateInput): Template {
    const now = getSingaporeNow().toISOString()
    const subtasksJson = JSON.stringify(input.subtasks ?? [])
    const info = db
      .prepare(
        `INSERT INTO templates
          (user_id, name, description, category, title_template, priority, is_recurring,
           recurrence_pattern, reminder_minutes, due_date_offset_days, subtasks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        userId,
        input.name,
        input.description ?? null,
        input.category ?? null,
        input.title_template,
        input.priority ?? 'medium',
        input.is_recurring ? 1 : 0,
        input.recurrence_pattern ?? null,
        input.reminder_minutes ?? null,
        input.due_date_offset_days ?? null,
        subtasksJson,
        now,
      )
    return this.findById(Number(info.lastInsertRowid), userId) as Template
  },

  update(id: number, userId: number, input: CreateTemplateInput): Template | null {
    const existing = this.findById(id, userId)
    if (!existing) return null
    const merged: Template = {
      ...existing,
      name: input.name ?? existing.name,
      description: input.description === undefined ? existing.description : input.description,
      category: input.category === undefined ? existing.category : input.category,
      title_template: input.title_template ?? existing.title_template,
      priority: input.priority ?? existing.priority,
      is_recurring: input.is_recurring ?? existing.is_recurring,
      recurrence_pattern:
        input.recurrence_pattern === undefined
          ? existing.recurrence_pattern
          : input.recurrence_pattern,
      reminder_minutes:
        input.reminder_minutes === undefined ? existing.reminder_minutes : input.reminder_minutes,
      due_date_offset_days:
        input.due_date_offset_days === undefined
          ? existing.due_date_offset_days
          : input.due_date_offset_days,
      subtasks: input.subtasks ?? existing.subtasks,
    }
    db.prepare(
      `UPDATE templates SET
        name = ?, description = ?, category = ?, title_template = ?, priority = ?,
        is_recurring = ?, recurrence_pattern = ?, reminder_minutes = ?,
        due_date_offset_days = ?, subtasks = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      merged.name,
      merged.description,
      merged.category,
      merged.title_template,
      merged.priority,
      merged.is_recurring ? 1 : 0,
      merged.is_recurring ? merged.recurrence_pattern : null,
      merged.reminder_minutes,
      merged.due_date_offset_days,
      JSON.stringify(merged.subtasks),
      id,
      userId,
    )
    return this.findById(id, userId)
  },

  delete(id: number, userId: number): boolean {
    const info = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?').run(id, userId)
    return info.changes > 0
  },

  /** Instantiate a todo (and its subtasks) from a template. */
  use(id: number, userId: number): Todo | null {
    const template = this.findById(id, userId)
    if (!template) return null

    let dueDate: string | null = null
    if (template.due_date_offset_days !== null) {
      const due = new Date(getSingaporeNow().getTime() + template.due_date_offset_days * 86400000)
      dueDate = due.toISOString()
    }

    // Recurrence needs a due date to advance from; never create a recurring todo
    // without one (a safety net for legacy templates missing an offset).
    const willRecur = template.is_recurring && dueDate !== null

    const todo = todoDB.create(userId, {
      title: template.title_template,
      due_date: dueDate,
      priority: template.priority,
      is_recurring: willRecur,
      recurrence_pattern: willRecur ? template.recurrence_pattern : null,
      // Reminders require a due date; drop them if the template has no offset.
      reminder_minutes: dueDate ? template.reminder_minutes : null,
    })

    for (const sub of template.subtasks) {
      subtaskDB.create(todo.id, sub.title, sub.position)
    }

    return todoDB.findById(todo.id, userId)
  },
}
