/** Human-facing labels for enums. Client-safe (no runtime deps). */
import { REMINDER_OPTIONS, type Priority } from './db/types'

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** Compact reminder labels used on badges. */
export const REMINDER_BADGE_LABEL: Record<number, string> = {
  15: '15m',
  30: '30m',
  60: '1h',
  120: '2h',
  1440: '1d',
  2880: '2d',
  10080: '1w',
}

/** Verbose reminder labels used in dropdowns. */
export const REMINDER_SELECT_LABEL: Record<number, string> = {
  15: '15 minutes before',
  30: '30 minutes before',
  60: '1 hour before',
  120: '2 hours before',
  1440: '1 day before',
  2880: '2 days before',
  10080: '1 week before',
}

export const REMINDER_SELECT_OPTIONS = REMINDER_OPTIONS.map((value) => ({
  value,
  label: REMINDER_SELECT_LABEL[value],
}))

export const RECURRENCE_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}
