'use client'

import Link from 'next/link'
import { useRef } from 'react'
import type { UseNotifications } from '@/lib/hooks/useNotifications'
import { TID } from '@/lib/testids'
import { btnSecondary } from './styles'

interface HeaderProps {
  username: string
  view: 'home' | 'calendar'
  notifications?: UseNotifications
  onExportJson?: () => void
  onExportCsv?: () => void
  onImportFile?: (file: File) => void
  importStatus?: string | null
  onLogout: () => void
}

export function Header({
  username,
  view,
  notifications,
  onExportJson,
  onExportCsv,
  onImportFile,
  importStatus,
  onLogout,
}: HeaderProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  return (
    <header className="mb-6 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">✅ Todo App</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400" data-testid={TID.headerUsername}>
            {username}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {view === 'home' ? (
            <Link href="/calendar" className={btnSecondary} data-testid={TID.calendarLink}>
              📅 Calendar
            </Link>
          ) : (
            <Link href="/" className={btnSecondary} data-testid={TID.homeLink}>
              ← Todos
            </Link>
          )}

          {notifications && notifications.supported && (
            <button
              type="button"
              onClick={() => void notifications.enable()}
              disabled={notifications.enabled}
              data-testid={TID.enableNotificationsButton}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                notifications.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {notifications.enabled ? '🔔 Notifications On' : '🔔 Enable Notifications'}
            </button>
          )}

          {onExportJson && (
            <button type="button" onClick={onExportJson} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700" data-testid={TID.exportJsonButton}>
              Export JSON
            </button>
          )}
          {onExportCsv && (
            <button type="button" onClick={onExportCsv} className="rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white hover:bg-green-900" data-testid={TID.exportCsvButton}>
              Export CSV
            </button>
          )}
          {onImportFile && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                data-testid={TID.importButton}
              >
                Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                data-testid={TID.importInput}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onImportFile(file)
                  e.target.value = ''
                }}
              />
            </>
          )}

          <button type="button" onClick={onLogout} className={btnSecondary} data-testid={TID.logoutButton}>
            Logout
          </button>
        </div>
      </div>
      {importStatus && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300" data-testid={TID.importStatus}>
          {importStatus}
        </p>
      )}
    </header>
  )
}
