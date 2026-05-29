import { deleteSession } from '@/lib/auth'
import { jsonOk, safeHandler } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return safeHandler(async () => {
    await deleteSession()
    return jsonOk({ ok: true })
  })
}
