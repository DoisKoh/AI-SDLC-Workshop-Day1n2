import { describe, expect, it } from 'vitest'
import {
  addRecurrence,
  dateToSingaporeDateKey,
  dateToSingaporeInput,
  getDueLabel,
  getSingaporeParts,
  singaporeInputToDate,
} from '@/lib/timezone'

describe('Singapore wall-clock <-> UTC conversions', () => {
  it('parses a datetime-local value as Singapore time (UTC+8)', () => {
    const d = singaporeInputToDate('2025-11-10T14:00')
    expect(d.toISOString()).toBe('2025-11-10T06:00:00.000Z')
  })

  it('round-trips an instant back to a datetime-local value', () => {
    const d = new Date('2025-11-10T06:00:00.000Z')
    expect(dateToSingaporeInput(d)).toBe('2025-11-10T14:00')
  })

  it('derives the Singapore calendar date key, crossing the day boundary', () => {
    expect(dateToSingaporeDateKey(new Date('2025-11-10T06:00:00Z'))).toBe('2025-11-10')
    // 16:30Z is 00:30 the next day in Singapore.
    expect(dateToSingaporeDateKey(new Date('2025-11-10T16:30:00Z'))).toBe('2025-11-11')
  })

  it('throws on a malformed datetime-local value', () => {
    expect(() => singaporeInputToDate('not-a-date')).toThrow()
  })
})

describe('addRecurrence', () => {
  const base = singaporeInputToDate('2025-11-10T14:00') // Mon

  it('advances daily', () => {
    expect(dateToSingaporeInput(addRecurrence(base, 'daily'))).toBe('2025-11-11T14:00')
  })

  it('advances weekly', () => {
    expect(dateToSingaporeInput(addRecurrence(base, 'weekly'))).toBe('2025-11-17T14:00')
  })

  it('advances monthly', () => {
    expect(dateToSingaporeInput(addRecurrence(base, 'monthly'))).toBe('2025-12-10T14:00')
  })

  it('advances yearly', () => {
    expect(dateToSingaporeInput(addRecurrence(base, 'yearly'))).toBe('2026-11-10T14:00')
  })

  it('clamps the day when advancing monthly into a shorter month (Jan 31 -> Feb 28)', () => {
    const jan31 = singaporeInputToDate('2025-01-31T10:00')
    const next = addRecurrence(jan31, 'monthly')
    const p = getSingaporeParts(next)
    expect([p.year, p.month, p.day]).toEqual([2025, 2, 28])
  })

  it('clamps Feb 29 when advancing yearly into a non-leap year', () => {
    const leap = singaporeInputToDate('2024-02-29T10:00')
    const next = addRecurrence(leap, 'yearly')
    const p = getSingaporeParts(next)
    expect([p.year, p.month, p.day]).toEqual([2025, 2, 28])
  })
})

describe('getDueLabel', () => {
  const now = new Date('2025-06-15T00:00:00Z')

  it('labels overdue todos', () => {
    const due = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const label = getDueLabel(due, now)
    expect(label.urgency).toBe('overdue')
    expect(label.text).toBe('2 hours overdue')
  })

  it('labels < 1 hour as red minutes', () => {
    const due = new Date(now.getTime() + 30 * 60 * 1000)
    const label = getDueLabel(due, now)
    expect(label.urgency).toBe('red')
    expect(label.text).toBe('Due in 30 minutes')
  })

  it('labels < 24 hours as orange hours', () => {
    const due = new Date(now.getTime() + 5 * 60 * 60 * 1000)
    const label = getDueLabel(due, now)
    expect(label.urgency).toBe('orange')
    expect(label.text).toBe('Due in 5 hours')
  })

  it('labels < 7 days as yellow days', () => {
    const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const label = getDueLabel(due, now)
    expect(label.urgency).toBe('yellow')
    expect(label.text).toBe('Due in 3 days')
  })

  it('labels 7+ days as blue timestamp', () => {
    const due = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    const label = getDueLabel(due, now)
    expect(label.urgency).toBe('blue')
    expect(label.text).toBe(label.timestamp)
  })
})
