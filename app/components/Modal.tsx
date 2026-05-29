'use client'

import { useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  testId?: string
  closeTestId?: string
  children: React.ReactNode
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal shell: overlay/Escape close, plus focus management — moves
 * focus into the dialog on open, traps Tab within it, and restores focus to the
 * trigger on close (WCAG 2.4.3).
 */
export function Modal({ open, onClose, title, testId, closeTestId, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  // Read onClose through a ref so a changing onClose identity (consumers pass
  // fresh inline arrows, and the parent re-renders e.g. on the 60s clock tick)
  // does not re-run the focus-management effect and steal focus mid-edit.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = () =>
      dialogRef.current ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)) : []

    // Move focus into the dialog (first control, or the dialog itself).
    const items = focusables()
    ;(items[0] ?? dialogRef.current)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (list.length === 0) {
        e.preventDefault()
        return
      }
      const idx = list.indexOf(document.activeElement as HTMLElement)
      // idx === -1 means focus is currently outside the dialog — pull it back in.
      if (e.shiftKey && idx <= 0) {
        e.preventDefault()
        list[list.length - 1].focus()
      } else if (!e.shiftKey && (idx === -1 || idx === list.length - 1)) {
        e.preventDefault()
        list[0].focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="my-8 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl outline-none dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid={closeTestId}
            className="rounded p-1 text-xl leading-none text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
