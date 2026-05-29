/**
 * Singapore timezone utilities.
 *
 * The whole app operates in Asia/Singapore (UTC+8, no DST — Singapore has been
 * a fixed +8 offset since 1982). All instants are stored as UTC ISO strings in
 * the database; this module is the single place that converts between those
 * instants and Singapore wall-clock time for display and input parsing.
 *
 * Using a fixed offset (rather than Intl for construction) keeps conversions
 * deterministic and round-trippable, which matters for recurrence math and tests.
 */

export const SINGAPORE_TIMEZONE = 'Asia/Singapore'
const SG_OFFSET_MINUTES = 8 * 60
const SG_OFFSET_MS = SG_OFFSET_MINUTES * 60 * 1000

export type DueUrgency = 'overdue' | 'red' | 'orange' | 'yellow' | 'blue'

export interface SingaporeParts {
  year: number
  month: number // 1-12
  day: number // 1-31
  hour: number // 0-23
  minute: number // 0-59
  second: number // 0-59
}

/** Current instant. Centralised so call sites never reach for `new Date()` directly. */
export function getSingaporeNow(): Date {
  return new Date()
}

/** A Date whose UTC fields equal the Singapore wall-clock fields of `date`. */
function shiftToSingapore(date: Date): Date {
  return new Date(date.getTime() + SG_OFFSET_MS)
}

/** Decompose an instant into Singapore wall-clock parts. */
export function getSingaporeParts(date: Date): SingaporeParts {
  const sg = shiftToSingapore(date)
  return {
    year: sg.getUTCFullYear(),
    month: sg.getUTCMonth() + 1,
    day: sg.getUTCDate(),
    hour: sg.getUTCHours(),
    minute: sg.getUTCMinutes(),
    second: sg.getUTCSeconds(),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  // month is 1-12
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Build a UTC instant from Singapore wall-clock components. */
export function singaporePartsToDate(parts: {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
}): Date {
  const utcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  )
  return new Date(utcMs - SG_OFFSET_MS)
}

/**
 * Parse an HTML `datetime-local` value ("YYYY-MM-DDTHH:mm") that the user
 * entered in Singapore wall-clock time into a UTC instant.
 */
export function singaporeInputToDate(localValue: string): Date {
  const match = localValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) {
    throw new Error(`Invalid datetime-local value: "${localValue}"`)
  }
  const [, y, mo, d, h, mi, s] = match
  return singaporePartsToDate({
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: s ? Number(s) : 0,
  })
}

/** Format an instant as a `datetime-local` value in Singapore time (for inputs). */
export function dateToSingaporeInput(date: Date): string {
  const p = getSingaporeParts(date)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}

/** Format an instant as a calendar date key ("YYYY-MM-DD") in Singapore time. */
export function dateToSingaporeDateKey(date: Date): string {
  const p = getSingaporeParts(date)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Human-readable Singapore timestamp, e.g. "10 Nov 2025, 2:00 PM". */
export function formatSingaporeDateTime(date: Date): string {
  const p = getSingaporeParts(date)
  const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12
  const ampm = p.hour < 12 ? 'AM' : 'PM'
  return `${p.day} ${MONTH_NAMES[p.month - 1]} ${p.year}, ${hour12}:${pad(p.minute)} ${ampm}`
}

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly'

/**
 * Compute the next due instant for a recurring todo, advancing in Singapore
 * calendar terms. Month/year arithmetic clamps the day to the target month
 * length (e.g. Jan 31 monthly -> Feb 28/29).
 */
export function addRecurrence(date: Date, pattern: RecurrencePattern): Date {
  const p = getSingaporeParts(date)

  switch (pattern) {
    case 'daily':
      return singaporePartsToDate({ ...p, day: p.day + 1 })
    case 'weekly':
      return singaporePartsToDate({ ...p, day: p.day + 7 })
    case 'monthly': {
      const totalMonths = p.month - 1 + 1 // advance one month (0-based)
      const year = p.year + Math.floor(totalMonths / 12)
      const month = (totalMonths % 12) + 1
      const day = Math.min(p.day, daysInMonth(year, month))
      return singaporePartsToDate({ ...p, year, month, day })
    }
    case 'yearly': {
      const year = p.year + 1
      const day = Math.min(p.day, daysInMonth(year, p.month))
      return singaporePartsToDate({ ...p, year, day })
    }
    default: {
      const exhaustive: never = pattern
      throw new Error(`Unknown recurrence pattern: ${String(exhaustive)}`)
    }
  }
}

export interface DueLabel {
  text: string
  urgency: DueUrgency
  timestamp: string
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

/** Smart, urgency-aware label for a due date relative to `now`. */
export function getDueLabel(due: Date, now: Date = getSingaporeNow()): DueLabel {
  const timestamp = formatSingaporeDateTime(due)
  const diff = due.getTime() - now.getTime()

  if (diff < 0) {
    const overdueBy = -diff
    let amount: string
    if (overdueBy >= DAY_MS) {
      const d = Math.floor(overdueBy / DAY_MS)
      amount = `${d} day${d === 1 ? '' : 's'}`
    } else if (overdueBy >= HOUR_MS) {
      const h = Math.floor(overdueBy / HOUR_MS)
      amount = `${h} hour${h === 1 ? '' : 's'}`
    } else {
      const m = Math.max(1, Math.floor(overdueBy / MINUTE_MS))
      amount = `${m} minute${m === 1 ? '' : 's'}`
    }
    return { text: `${amount} overdue`, urgency: 'overdue', timestamp }
  }

  if (diff < HOUR_MS) {
    const m = Math.max(1, Math.floor(diff / MINUTE_MS))
    return { text: `Due in ${m} minute${m === 1 ? '' : 's'}`, urgency: 'red', timestamp }
  }

  if (diff < DAY_MS) {
    const h = Math.floor(diff / HOUR_MS)
    return { text: `Due in ${h} hour${h === 1 ? '' : 's'}`, urgency: 'orange', timestamp }
  }

  if (diff < WEEK_MS) {
    const d = Math.floor(diff / DAY_MS)
    return { text: `Due in ${d} day${d === 1 ? '' : 's'}`, urgency: 'yellow', timestamp }
  }

  return { text: timestamp, urgency: 'blue', timestamp }
}

/** True when `date` is strictly before `now` (overdue check helper). */
export function isPast(date: Date, now: Date = getSingaporeNow()): boolean {
  return date.getTime() < now.getTime()
}
