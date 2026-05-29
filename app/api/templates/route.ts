import { type NextRequest } from 'next/server'
import { templateDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createTemplateSchema } from '@/lib/validation'
import { jsonOk, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    return jsonOk(templateDB.findByUserId(session.userId))
  })
}

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const data = createTemplateSchema.parse(await request.json())
    const template = templateDB.create(session.userId, data)

    return jsonOk(template, { status: 201 })
  })
}
