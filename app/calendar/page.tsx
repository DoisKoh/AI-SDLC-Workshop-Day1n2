'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { holidaysApi, todosApi } from '@/lib/api-client'
import { getCurrentUser, logout } from '@/lib/auth-client'
import { getSingaporeNow, getSingaporeParts } from '@/lib/timezone'
import type { Holiday, Todo } from '@/lib/types'
import { CalendarView } from '../components/CalendarView'
import { Header } from '../components/Header'

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

function CalendarPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [todos, setTodos] = useState<Todo[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  const { year, month } = useMemo(() => {
    const param = searchParams.get('month')
    const match = param?.match(/^(\d{4})-(\d{2})$/)
    if (match) {
      const y = Number(match[1])
      const m = Number(match[2])
      if (m >= 1 && m <= 12) return { year: y, month: m }
    }
    const now = getSingaporeParts(getSingaporeNow())
    return { year: now.year, month: now.month }
  }, [searchParams])

  useEffect(() => {
    void Promise.all([todosApi.list(), holidaysApi.list()])
      .then(([t, h]) => {
        setTodos(t)
        setHolidays(h)
      })
      .catch(() => {
        // Non-fatal; calendar simply renders empty.
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void getCurrentUser().then((u) => {
      if (u) setUsername(u.username)
    })
  }, [])

  const goto = (y: number, m: number) =>
    router.push(`/calendar?month=${y}-${String(m).padStart(2, '0')}`)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Header username={username} view="calendar" onLogout={handleLogout} />
      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
          Loading calendar…
        </p>
      ) : (
        <CalendarView
          year={year}
          month={month}
          todos={todos}
          holidays={holidays}
          onPrev={() => {
            const p = shiftMonth(year, month, -1)
            goto(p.year, p.month)
          }}
          onNext={() => {
            const n = shiftMonth(year, month, 1)
            goto(n.year, n.month)
          }}
          onToday={() => {
            const now = getSingaporeParts(getSingaporeNow())
            goto(now.year, now.month)
          }}
        />
      )}
    </main>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<main className="p-6 text-center text-gray-500">Loading…</main>}>
      <CalendarPageInner />
    </Suspense>
  )
}
