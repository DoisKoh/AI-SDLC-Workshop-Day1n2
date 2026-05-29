import { type NextRequest } from 'next/server'
import { holidayDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { jsonOk, safeHandler, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const from = request.nextUrl.searchParams.get('from')
    const to = request.nextUrl.searchParams.get('to')

    const holidays = from && to ? holidayDB.findInRange(from, to) : holidayDB.findAll()

    return jsonOk(holidays)
  })
}
