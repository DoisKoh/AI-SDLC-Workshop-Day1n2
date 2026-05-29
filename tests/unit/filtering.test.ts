import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTERS,
  activeFilterCount,
  matchesFilters,
  splitSections,
  type FilterState,
} from '@/lib/filtering'
import { makeSubtask, makeTag, makeTodo } from './factories'

const filters = (patch: Partial<FilterState>): FilterState => ({ ...EMPTY_FILTERS, ...patch })

describe('matchesFilters', () => {
  it('matches by title (case-insensitive, partial)', () => {
    const todo = makeTodo({ title: 'Monthly Report' })
    expect(matchesFilters(todo, filters({ search: 'report' }))).toBe(true)
    expect(matchesFilters(todo, filters({ search: 'invoice' }))).toBe(false)
  })

  it('matches by subtask title', () => {
    const todo = makeTodo({
      title: 'Project Alpha',
      subtasks: [makeSubtask({ title: 'Send report to team' })],
    })
    expect(matchesFilters(todo, filters({ search: 'report' }))).toBe(true)
  })

  it('filters by priority', () => {
    const todo = makeTodo({ priority: 'high' })
    expect(matchesFilters(todo, filters({ priority: 'high' }))).toBe(true)
    expect(matchesFilters(todo, filters({ priority: 'low' }))).toBe(false)
  })

  it('filters by tag', () => {
    const tag = makeTag({ name: 'work' })
    const todo = makeTodo({ tags: [tag] })
    expect(matchesFilters(todo, filters({ tagId: tag.id }))).toBe(true)
    expect(matchesFilters(todo, filters({ tagId: tag.id + 999 }))).toBe(false)
  })

  it('filters by completion status', () => {
    const done = makeTodo({ completed: true })
    const open = makeTodo({ completed: false })
    expect(matchesFilters(done, filters({ completion: 'completed' }))).toBe(true)
    expect(matchesFilters(done, filters({ completion: 'incomplete' }))).toBe(false)
    expect(matchesFilters(open, filters({ completion: 'incomplete' }))).toBe(true)
  })

  it('filters by due-date range (Singapore days, inclusive)', () => {
    // 2025-11-05 14:00 SGT == 2025-11-05T06:00:00Z
    const todo = makeTodo({ due_date: '2025-11-05T06:00:00.000Z' })
    expect(matchesFilters(todo, filters({ dateFrom: '2025-11-01', dateTo: '2025-11-07' }))).toBe(true)
    expect(matchesFilters(todo, filters({ dateFrom: '2025-11-06' }))).toBe(false)
    expect(matchesFilters(todo, filters({ dateTo: '2025-11-04' }))).toBe(false)
    // Todos without a due date never match a date range.
    expect(matchesFilters(makeTodo(), filters({ dateFrom: '2025-11-01' }))).toBe(false)
  })

  it('combines filters with AND logic', () => {
    const tag = makeTag({ name: 'work' })
    const todo = makeTodo({ title: 'Quarterly report', priority: 'high', tags: [tag] })
    expect(
      matchesFilters(todo, filters({ search: 'report', priority: 'high', tagId: tag.id })),
    ).toBe(true)
    expect(
      matchesFilters(todo, filters({ search: 'report', priority: 'low', tagId: tag.id })),
    ).toBe(false)
  })
})

describe('splitSections', () => {
  const now = new Date('2025-06-15T00:00:00Z')

  it('partitions todos into overdue / pending / completed', () => {
    const overdue = makeTodo({ due_date: '2025-06-01T00:00:00Z' })
    const pending = makeTodo({ due_date: '2025-07-01T00:00:00Z' })
    const noDue = makeTodo({ due_date: null })
    const done = makeTodo({ completed: true, due_date: '2025-06-01T00:00:00Z' })

    const sections = splitSections([overdue, pending, noDue, done], now)
    expect(sections.overdue.map((t) => t.id)).toEqual([overdue.id])
    expect(sections.pending.map((t) => t.id).sort()).toEqual([pending.id, noDue.id].sort())
    expect(sections.completed.map((t) => t.id)).toEqual([done.id])
  })
})

describe('activeFilterCount', () => {
  it('counts active filter groups', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
    expect(activeFilterCount(filters({ search: 'x' }))).toBe(1)
    expect(activeFilterCount(filters({ search: 'x', priority: 'high' }))).toBe(2)
    expect(activeFilterCount(filters({ dateFrom: '2025-01-01', dateTo: '2025-02-01' }))).toBe(1)
  })
})
