import { type NextRequest } from 'next/server'
import { subtaskDB, todoDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createSubtaskSchema } from '@/lib/validation'
import { jsonError, jsonOk, notFound, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    if (!todoDB.findById(numId, session.userId)) return notFound('Todo')

    const { title } = createSubtaskSchema.parse(await request.json())
    const subtask = subtaskDB.create(numId, title)
    return jsonOk(subtask, { status: 201 })
  })
}
