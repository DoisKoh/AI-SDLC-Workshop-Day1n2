'use client'

import { useMemo, useState } from 'react'
import { TID } from '@/lib/testids'
import { dateToSingaporeDateKey, getSingaporeNow } from '@/lib/timezone'
import type { Holiday, Priority, Todo } from '@/lib/types'
import { Modal } from './Modal'
import { PriorityBadge } from './badges'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

interface CalendarViewProps {
  year: number
  month: number // 1-12
  todos: Todo[]
  holidays: Holiday[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarView({ year, month, todos, holidays, onPrev, onNext, onToday }: CalendarViewProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const todayKey = dateToSingaporeDateKey(getSingaporeNow())

  const todosByDate = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const todo of todos) {
      if (!todo.due_date) continue
      const key = dateToSingaporeDateKey(new Date(todo.due_date))
      const list = map.get(key) ?? []
      list.push(todo)
      map.set(key, list)
    }
    return map
  }, [todos])

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, string>()
    for (const h of holidays) map.set(h.date, h.name)
    return map
  }, [holidays])

  const cells = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
    const total = daysInMonth(year, month)
    const out: (string | null)[] = []
    for (let i = 0; i < firstWeekday; i++) out.push(null)
    for (let day = 1; day <= total; day++) {
      out.push(`${year}-${pad(month)}-${pad(day)}`)
    }
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [year, month])

  const selectedTodos = selected ? (todosByDate.get(selected) ?? []) : []

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid={TID.calendarTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrev} className="rounded-lg bg-gray-100 px-3 py-1 dark:bg-gray-700" data-testid={TID.calendarPrev} aria-label="Previous month">
            ◀
          </button>
          <button type="button" onClick={onToday} className="rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700" data-testid={TID.calendarToday}>
            Today
          </button>
          <button type="button" onClick={onNext} className="rounded-lg bg-gray-100 px-3 py-1 dark:bg-gray-700" data-testid={TID.calendarNext} aria-label="Next month">
            ▶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1" data-testid={TID.calendarGrid}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
            {d}
          </div>
        ))}
        {cells.map((key, i) => {
          if (!key) return <div key={`blank-${i}`} className="min-h-[5rem] rounded-lg" />
          const dayNum = Number(key.slice(8))
          const weekday = i % 7
          const isWeekend = weekday === 0 || weekday === 6
          const isToday = key === todayKey
          const dayTodos = todosByDate.get(key) ?? []
          const holiday = holidaysByDate.get(key)
          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelected(key)}
              data-testid={TID.calendarDay(key)}
              aria-label={`${key}${holiday ? `, ${holiday}` : ''}${
                dayTodos.length ? `, ${dayTodos.length} todo${dayTodos.length === 1 ? '' : 's'}` : ''
              }`}
              className={`min-h-[5rem] rounded-lg border p-1 text-left align-top transition hover:border-blue-400 ${
                isToday
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-gray-200 dark:border-gray-700'
              } ${isWeekend ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-gray-800'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {dayNum}
                </span>
                {dayTodos.length > 0 && (
                  <span
                    className="rounded-full bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    data-testid={TID.calendarDayCount(key)}
                  >
                    {dayTodos.length}
                  </span>
                )}
              </div>
              {holiday && (
                <p className="truncate text-[10px] text-rose-600 dark:text-rose-400" data-testid={TID.calendarHoliday(key)} title={holiday}>
                  {holiday}
                </p>
              )}
              <div className="mt-1 space-y-0.5">
                {dayTodos.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center gap-1 truncate text-[10px] text-gray-600 dark:text-gray-300">
                    <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {dayTodos.length > 3 && (
                  <p className="text-[10px] text-gray-600 dark:text-gray-300">
                    +{dayTodos.length - 3} more
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected} testId={TID.dayModal} closeTestId={TID.dayModalClose}>
          {holidaysByDate.get(selected) && (
            <p className="mb-2 text-sm font-medium text-rose-600 dark:text-rose-400">
              🎉 {holidaysByDate.get(selected)}
            </p>
          )}
          {selectedTodos.length > 0 ? (
            <ul className="space-y-2">
              {selectedTodos.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-700">
                  <PriorityBadge priority={t.priority} />
                  <span className={t.completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}>
                    {t.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No todos due on this day.</p>
          )}
        </Modal>
      )}
    </div>
  )
}
