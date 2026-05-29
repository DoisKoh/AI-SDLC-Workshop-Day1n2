import { type NextRequest } from 'next/server'
import { db, subtaskDB, tagDB, todoDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { jsonError, jsonOk, safeHandler, unauthorized } from '@/lib/api-response'
import { importSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const DEFAULT_TAG_COLOR = '#3B82F6'

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return jsonError('Invalid JSON format', 400)
    }

    const payload = importSchema.parse(raw)

    const existing = tagDB.findByUserId(session.userId)
    const byName = new Map(existing.map((t) => [t.name.toLowerCase(), t.id]))
    let tagsCreated = 0
    let imported = 0

    const ensureTag = (name: string, color?: string | null): number => {
      const key = name.toLowerCase()
      const found = byName.get(key)
      if (found !== undefined) return found
      const safeColor = HEX_COLOR.test(color ?? '') ? (color as string) : DEFAULT_TAG_COLOR
      const created = tagDB.create(session.userId, name, safeColor)
      byName.set(key, created.id)
      tagsCreated++
      return created.id
    }

    // Single transaction so a large import is atomic and fast (one fsync, not one per row).
    const runImport = db.transaction(() => {
      for (const t of payload.tags ?? []) {
        ensureTag(t.name, t.color)
      }

      for (const t of payload.todos) {
        const tagIds = (t.tags ?? []).map((name) => ensureTag(name))
        const created = todoDB.create(session.userId, {
          title: t.title,
          due_date: t.due_date ?? null,
          priority: t.priority ?? 'medium',
          is_recurring: t.is_recurring ?? false,
          recurrence_pattern: t.recurrence_pattern ?? null,
          reminder_minutes: t.reminder_minutes ?? null,
          tagIds,
          // Preserve original timestamps and completion state on round-trip.
          completed: t.completed ?? false,
          completed_at: t.completed_at ?? null,
          created_at: t.created_at,
        })

        for (const s of t.subtasks ?? []) {
          const st = subtaskDB.create(created.id, s.title, s.position)
          if (s.completed) {
            subtaskDB.update(st.id, { completed: true })
          }
        }

        imported++
      }
    })

    runImport()

    return jsonOk({ imported, tagsCreated })
  })
}
