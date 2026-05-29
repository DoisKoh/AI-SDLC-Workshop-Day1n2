import { todoDB } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { jsonOk, safeHandler, unauthorized } from '@/lib/api-response'
import { getSingaporeNow } from '@/lib/timezone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST (not GET) because this marks reminders as sent — a state change. Keeping
// it non-GET ensures SameSite=Lax cookies aren't sent on cross-site navigations.
export async function POST() {
  return safeHandler(async () => {
    const session = await getSession()
    if (!session) return unauthorized()

    const candidates = todoDB.findReminderCandidates(session.userId)
    const now = getSingaporeNow().getTime()
    const due = candidates.filter(
      (c) => Date.parse(c.due_date) - c.reminder_minutes * 60000 <= now,
    )

    const sentAt = getSingaporeNow().toISOString()
    for (const c of due) {
      todoDB.markNotificationSent(c.id, sentAt)
    }

    return jsonOk(
      due.map((c) => ({
        id: c.id,
        title: c.title,
        due_date: c.due_date,
        reminder_minutes: c.reminder_minutes,
      })),
    )
  })
}
