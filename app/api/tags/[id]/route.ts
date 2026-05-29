import { type NextRequest } from 'next/server'
import { tagDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateTagSchema } from '@/lib/validation'
import { jsonError, jsonOk, notFound, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    const fields = updateTagSchema.parse(await request.json())

    if (fields.name) {
      const dup = tagDB.findByName(session.userId, fields.name)
      if (dup && dup.id !== numId) {
        return jsonError('A tag with that name already exists', 409)
      }
    }

    const updated = tagDB.update(numId, session.userId, fields)
    if (!updated) return notFound('Tag')

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

    const ok = tagDB.delete(numId, session.userId)
    if (!ok) return notFound('Tag')

    return jsonOk({ id: numId })
  })
}
