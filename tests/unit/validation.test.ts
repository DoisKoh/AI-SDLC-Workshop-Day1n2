import { describe, expect, it } from 'vitest'
import {
  createTagSchema,
  createTemplateSchema,
  createTodoSchema,
  importSchema,
} from '@/lib/validation'

const futureIso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString()

describe('createTodoSchema', () => {
  it('accepts a minimal todo with just a title', () => {
    const result = createTodoSchema.parse({ title: '  Buy milk  ' })
    expect(result.title).toBe('Buy milk')
  })

  it('accepts a future due date', () => {
    expect(() =>
      createTodoSchema.parse({ title: 'x', due_date: futureIso(2 * 60 * 1000) }),
    ).not.toThrow()
  })

  it('rejects a past due date', () => {
    expect(() =>
      createTodoSchema.parse({ title: 'x', due_date: futureIso(-60 * 1000) }),
    ).toThrow()
  })

  it('rejects an empty title', () => {
    expect(() => createTodoSchema.parse({ title: '   ' })).toThrow()
  })

  it('requires a recurrence pattern when recurring', () => {
    expect(() =>
      createTodoSchema.parse({ title: 'x', is_recurring: true, due_date: futureIso(86400000) }),
    ).toThrow()
  })

  it('requires a due date when recurring', () => {
    expect(() =>
      createTodoSchema.parse({ title: 'x', is_recurring: true, recurrence_pattern: 'daily' }),
    ).toThrow()
  })

  it('requires a due date when a reminder is set', () => {
    expect(() => createTodoSchema.parse({ title: 'x', reminder_minutes: 60 })).toThrow()
  })

  it('rejects an invalid reminder value', () => {
    expect(() =>
      createTodoSchema.parse({ title: 'x', due_date: futureIso(86400000), reminder_minutes: 45 }),
    ).toThrow()
  })
})

describe('createTagSchema', () => {
  it('accepts a valid hex color', () => {
    expect(() => createTagSchema.parse({ name: 'work', color: '#3B82F6' })).not.toThrow()
  })

  it('rejects a malformed color', () => {
    expect(() => createTagSchema.parse({ name: 'work', color: 'blue' })).toThrow()
  })
})

describe('createTemplateSchema', () => {
  it('accepts a template with subtasks', () => {
    const result = createTemplateSchema.parse({
      name: 'Standup',
      title_template: 'Daily standup',
      priority: 'high',
      subtasks: [{ title: 'Yesterday', position: 0 }],
    })
    expect(result.subtasks).toHaveLength(1)
  })

  it('requires a due-date offset for recurring templates', () => {
    expect(() =>
      createTemplateSchema.parse({
        name: 'Weekly',
        title_template: 'Weekly review',
        is_recurring: true,
        recurrence_pattern: 'weekly',
      }),
    ).toThrow()
  })

  it('accepts a recurring template that has an offset', () => {
    expect(() =>
      createTemplateSchema.parse({
        name: 'Weekly',
        title_template: 'Weekly review',
        is_recurring: true,
        recurrence_pattern: 'weekly',
        due_date_offset_days: 7,
      }),
    ).not.toThrow()
  })
})

describe('importSchema', () => {
  it('accepts a minimal export shape', () => {
    const result = importSchema.parse({ todos: [{ title: 'Imported' }] })
    expect(result.todos).toHaveLength(1)
  })

  it('accepts past due dates on import (historical todos)', () => {
    expect(() =>
      importSchema.parse({ todos: [{ title: 'Old', due_date: '2020-01-01T00:00:00Z' }] }),
    ).not.toThrow()
  })

  it('rejects a payload without a todos array', () => {
    expect(() => importSchema.parse({ tags: [] })).toThrow()
  })
})
