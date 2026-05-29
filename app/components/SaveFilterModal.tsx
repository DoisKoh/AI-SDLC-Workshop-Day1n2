'use client'

import { useState } from 'react'
import type { FilterState } from '@/lib/filtering'
import { PRIORITY_LABEL } from '@/lib/labels'
import { TID } from '@/lib/testids'
import type { Tag } from '@/lib/types'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary, inputCls, labelCls } from './styles'

interface SaveFilterModalProps {
  filters: FilterState
  tags: Tag[]
  onSave: (name: string) => void
  onClose: () => void
}

export function SaveFilterModal({ filters, tags, onSave, onClose }: SaveFilterModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const tagName = filters.tagId === 'all' ? null : tags.find((t) => t.id === filters.tagId)?.name

  const summary: string[] = []
  if (filters.search.trim()) summary.push(`Search: "${filters.search.trim()}"`)
  if (filters.priority !== 'all') summary.push(`Priority: ${PRIORITY_LABEL[filters.priority]}`)
  if (tagName) summary.push(`Tag: ${tagName}`)
  if (filters.completion !== 'all') summary.push(`Completion: ${filters.completion}`)
  if (filters.dateFrom || filters.dateTo)
    summary.push(`Due: ${filters.dateFrom || '…'} to ${filters.dateTo || '…'}`)

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Preset name is required')
      return
    }
    onSave(trimmed)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Save Filter Preset" testId={TID.saveFilterModal}>
      <div className="space-y-3">
        <div>
          <p className={labelCls}>Current Filters</p>
          {summary.length > 0 ? (
            <ul className="list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
              {summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No active filters.</p>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor="filter-name">
            Preset name
          </label>
          <input
            id="filter-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                save()
              }
            }}
            className={inputCls}
            data-testid={TID.filterNameInput}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary} data-testid={TID.filterSaveCancel}>
            Cancel
          </button>
          <button type="button" onClick={save} className={btnPrimary} data-testid={TID.filterSaveButton}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
