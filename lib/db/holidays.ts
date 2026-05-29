import { db } from './connection'
import type { Holiday } from './types'

interface HolidayRow {
  id: number
  date: string
  name: string
}

export const holidayDB = {
  findAll(): Holiday[] {
    return db.prepare('SELECT * FROM holidays ORDER BY date ASC').all() as HolidayRow[]
  },

  /** Holidays whose date falls within an inclusive YYYY-MM-DD range. */
  findInRange(startDate: string, endDate: string): Holiday[] {
    return db
      .prepare('SELECT * FROM holidays WHERE date >= ? AND date <= ? ORDER BY date ASC')
      .all(startDate, endDate) as HolidayRow[]
  },

  /** Insert or update a holiday by its unique date. */
  upsert(date: string, name: string): void {
    db.prepare(
      `INSERT INTO holidays (date, name) VALUES (?, ?)
       ON CONFLICT(date) DO UPDATE SET name = excluded.name`,
    ).run(date, name)
  },

  count(): number {
    const row = db.prepare('SELECT COUNT(*) AS count FROM holidays').get() as { count: number }
    return row.count
  },
}
