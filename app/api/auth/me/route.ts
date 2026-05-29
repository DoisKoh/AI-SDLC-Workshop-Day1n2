import { getSession } from '@/lib/auth'
import { jsonOk, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()
    return jsonOk({ userId: session.userId, username: session.username })
  })
}
