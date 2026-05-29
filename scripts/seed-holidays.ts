/**
 * Manually (re)seed Singapore public holidays. The app also auto-seeds on first
 * startup (see lib/db/connection.ts); this script is for explicit re-seeding.
 * Idempotent (upsert by date). Run with: npm run seed
 */
import { holidayDB } from '../lib/db/holidays'
import { SINGAPORE_HOLIDAYS } from '../lib/holidays-data'

function seed(): void {
  for (const holiday of SINGAPORE_HOLIDAYS) {
    holidayDB.upsert(holiday.date, holiday.name)
  }
  console.info(
    `Seeded ${SINGAPORE_HOLIDAYS.length} Singapore public holidays. Total: ${holidayDB.count()}`,
  )
}

seed()
