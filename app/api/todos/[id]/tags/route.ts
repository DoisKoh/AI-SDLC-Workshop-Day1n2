import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { todoDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { jsonError, jsonOk, notFound, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const addTagsSchema = z.object({
  tagIds: z.array(z.number().int().positive()),
})

const removeTagSchema = z.object({
  tagId: z.number().int().positive(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    if (!todoDB.findById(numId, session.userId)) return notFound('Todo')

    const { tagIds } = addTagsSchema.parse(await request.json())
    const updated = todoDB.setTags(numId, session.userId, tagIds)
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

    const todo = todoDB.findById(numId, session.userId)
    if (!todo) return notFound('Todo')

    const { tagId } = removeTagSchema.parse(await request.json())
    const remaining = todo.tags.map((t) => t.id).filter((tid) => tid !== tagId)
    const updated = todoDB.setTags(numId, session.userId, remaining)
    return jsonOk(updated)
  })
}
