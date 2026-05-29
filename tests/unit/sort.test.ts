import { describe, expect, it } from 'vitest'
import { sortTodos } from '@/lib/sort'
import { makeTodo } from './factories'

describe('sortTodos', () => {
  it('orders incomplete before completed', () => {
    const done = makeTodo({ completed: true, completed_at: '2025-01-02T00:00:00Z' })
    const open = makeTodo({ completed: false })
    const sorted = sortTodos([done, open])
    expect(sorted[0].id).toBe(open.id)
  })

  it('orders by priority high -> medium -> low', () => {
    const low = makeTodo({ priority: 'low' })
    const high = makeTodo({ priority: 'high' })
    const medium = makeTodo({ priority: 'medium' })
    const sorted = sortTodos([low, high, medium])
    expect(sorted.map((t) => t.priority)).toEqual(['high', 'medium', 'low'])
  })

  it('orders same-priority by due date (earliest first, no-due last)', () => {
    const later = makeTodo({ priority: 'high', due_date: '2025-07-01T00:00:00Z' })
    const earlier = makeTodo({ priority: 'high', due_date: '2025-06-01T00:00:00Z' })
    const noDue = makeTodo({ priority: 'high', due_date: null })
    const sorted = sortTodos([later, noDue, earlier])
    expect(sorted.map((t) => t.id)).toEqual([earlier.id, later.id, noDue.id])
  })

  it('orders completed by most recently completed first', () => {
    const oldDone = makeTodo({ completed: true, completed_at: '2025-01-01T00:00:00Z' })
    const newDone = makeTodo({ completed: true, completed_at: '2025-03-01T00:00:00Z' })
    const sorted = sortTodos([oldDone, newDone])
    expect(sorted.map((t) => t.id)).toEqual([newDone.id, oldDone.id])
  })
})
