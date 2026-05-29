import { type NextRequest } from 'next/server'
import { todoDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateTodoSchema } from '@/lib/validation'
import { jsonError, jsonOk, notFound, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    const todo = todoDB.findById(numId, session.userId)
    if (!todo) return notFound('Todo')
    return jsonOk(todo)
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    const data = updateTodoSchema.parse(await request.json())

    const existing = todoDB.findById(numId, session.userId)
    if (!existing) return notFound('Todo')

    // A recurring todo must always have a due date (so its recurrence can advance).
    const finalRecurring = data.is_recurring ?? existing.is_recurring
    const finalDue = data.due_date !== undefined ? data.due_date : existing.due_date
    if (finalRecurring && !finalDue) {
      return jsonError('Recurring todos require a due date', 422)
    }

    const completingRecurring =
      data.completed === true &&
      !existing.completed &&
      existing.is_recurring &&
      !!existing.recurrence_pattern &&
      !!existing.due_date

    const updated = todoDB.update(numId, session.userId, data)
    if (!updated) return notFound('Todo')

    if (completingRecurring) {
      todoDB.createNextInstance(existing)
    }

    return jsonOk(updated)
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    const ok = todoDB.delete(numId, session.userId)
    if (!ok) return notFound('Todo')
    return jsonOk({ id: numId })
  })
}
