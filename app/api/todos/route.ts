import { type NextRequest } from 'next/server'
import { todoDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createTodoSchema } from '@/lib/validation'
import { jsonOk, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    return jsonOk(todoDB.findByUserId(session.userId))
  })
}

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const data = createTodoSchema.parse(await request.json())
    const todo = todoDB.create(session.userId, data)
    return jsonOk(todo, { status: 201 })
  })
}
