import { type NextRequest } from 'next/server'
import { templateDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { jsonError, jsonOk, notFound, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { id } = await params
    const numId = Number(id)
    if (!Number.isInteger(numId)) return jsonError('Invalid id', 400)

    const todo = templateDB.use(numId, session.userId)
    if (!todo) return notFound('Template')

    return jsonOk(todo, { status: 201 })
  })
}
