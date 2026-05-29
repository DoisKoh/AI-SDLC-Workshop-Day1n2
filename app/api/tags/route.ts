import { type NextRequest } from 'next/server'
import { tagDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createTagSchema } from '@/lib/validation'
import { jsonError, jsonOk, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_TAG_COLOR = '#3B82F6'

export async function GET() {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    return jsonOk(tagDB.findByUserId(session.userId))
  })
}

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const { name, color } = createTagSchema.parse(await request.json())

    if (tagDB.findByName(session.userId, name)) {
      return jsonError('A tag with that name already exists', 409)
    }

    const tag = tagDB.create(session.userId, name, color ?? DEFAULT_TAG_COLOR)
    return jsonOk(tag, { status: 201 })
  })
}
