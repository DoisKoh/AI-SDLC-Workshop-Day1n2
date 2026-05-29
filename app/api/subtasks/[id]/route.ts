import { type NextRequest } from 'next/server'
import { subtaskDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateSubtaskSchema } from '@/lib/validation'
import { jsonError, jsonOk, notFound, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    const owner = subtaskDB.ownerUserId(numId)
    if (owner !== session.userId) return notFound('Subtask')

    const fields = updateSubtaskSchema.parse(await request.json())
    const updated = subtaskDB.update(numId, fields)
    if (!updated) return notFound('Subtask')
    return jsonOk(updated)
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    const owner = subtaskDB.ownerUserId(numId)
    if (owner !== session.userId) return notFound('Subtask')

    subtaskDB.delete(numId)
    return jsonOk({ id: numId })
  })
}
