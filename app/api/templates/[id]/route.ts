import { type NextRequest } from 'next/server'
import { templateDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createTemplateSchema } from '@/lib/validation'
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

    const data = createTemplateSchema.parse(await request.json())
    const updated = templateDB.update(numId, session.userId, data)
    if (!updated) return notFound('Template')

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

    const ok = templateDB.delete(numId, session.userId)
    if (!ok) return notFound('Template')

    return jsonOk({ id: numId })
  })
}
