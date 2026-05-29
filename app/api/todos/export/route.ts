import { type NextRequest, NextResponse } from 'next/server'
import { tagDB, todoDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { safeHandler, unauthorized } from '@/lib/api-response'
import { dateToSingaporeDateKey, getSingaporeNow } from '@/lib/timezone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CSV_HEADER = 'ID,Title,Completed,Due Date,Priority,Recurring,Pattern,Reminder'

/**
 * Escape a single CSV field: wrap in double quotes and double any internal
 * quotes when the value contains a comma, quote, or newline.
 */
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(request: NextRequest) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const format = request.nextUrl.searchParams.get('format') === 'csv' ? 'csv' : 'json'

    const todos = todoDB.findByUserId(session.userId)
    const tags = tagDB.findByUserId(session.userId)
    const dateKey = dateToSingaporeDateKey(getSingaporeNow())

    if (format === 'csv') {
      const rows = todos.map((t) =>
        [
          String(t.id),
          csvEscape(t.title),
          String(t.completed),
          csvEscape(t.due_date ?? ''),
          csvEscape(t.priority),
          String(t.is_recurring),
          csvEscape(t.recurrence_pattern ?? ''),
          t.reminder_minutes != null ? String(t.reminder_minutes) : '',
        ].join(','),
      )
      const csv = [CSV_HEADER, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="todos-${dateKey}.csv"`,
        },
      })
    }

    const payload = {
      version: 1,
      exported_at: getSingaporeNow().toISOString(),
      tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      todos: todos.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        due_date: t.due_date,
        priority: t.priority,
        is_recurring: t.is_recurring,
        recurrence_pattern: t.recurrence_pattern,
        reminder_minutes: t.reminder_minutes,
        completed_at: t.completed_at,
        created_at: t.created_at,
        subtasks: t.subtasks.map((s) => ({
          title: s.title,
          completed: s.completed,
          position: s.position,
        })),
        tags: t.tags.map((tag) => tag.name),
      })),
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="todos-${dateKey}.json"`,
      },
    })
  })
}
