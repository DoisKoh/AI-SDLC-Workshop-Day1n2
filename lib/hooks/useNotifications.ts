'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationsApi } from '../api-client'

const POLL_INTERVAL_MS = 30_000

export interface UseNotifications {
  permission: NotificationPermission | 'unsupported'
  enabled: boolean
  supported: boolean
  enable: () => Promise<void>
}

/**
 * Browser notification manager. Requests permission, then polls the server for
 * todos whose reminder time has arrived and fires one notification each. The
 * server marks each reminder sent, so duplicates are prevented across polls.
 */
export function useNotifications(): UseNotifications {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [enabled, setEnabled] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
    if (Notification.permission === 'granted') setEnabled(true)
  }, [])

  const poll = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    try {
      const due = await notificationsApi.check()
      for (const todo of due) {
        new Notification('Todo reminder', {
          body: `"${todo.title}" is due soon`,
          tag: `todo-${todo.id}`,
        })
      }
    } catch {
      // Network hiccups are non-fatal; the next poll will retry.
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void poll()
    timerRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [enabled, poll])

  const enable = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') setEnabled(true)
  }, [])

  return {
    permission,
    enabled,
    supported: permission !== 'unsupported',
    enable,
  }
}
