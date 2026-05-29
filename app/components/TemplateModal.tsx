'use client'

import { useMemo, useState } from 'react'
import { RECURRENCE_LABEL, REMINDER_BADGE_LABEL } from '@/lib/labels'
import { TID } from '@/lib/testids'
import type { Template } from '@/lib/types'
import { PriorityBadge } from './badges'
import { Modal } from './Modal'
import { btnPrimary, selectCls } from './styles'

interface TemplateModalProps {
  templates: Template[]
  onUse: (id: number) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
  onClose: () => void
}

export function TemplateModal({ templates, onUse, onDelete, onClose }: TemplateModalProps) {
  const [category, setCategory] = useState('all')
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category).filter((c): c is string => !!c))),
    [templates],
  )

  const visible = category === 'all' ? templates : templates.filter((t) => t.category === category)

  const use = async (id: number) => {
    try {
      await onUse(id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use template')
    }
  }

  const remove = async (id: number) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this template?')) return
    try {
      await onDelete(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  return (
    <Modal open onClose={onClose} title="Templates" testId={TID.templateModal} closeTestId={TID.templateModalClose}>
      <div className="space-y-3">
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${selectCls} max-w-xs`}
            data-testid={TID.templateCategoryFilter}
            aria-label="Filter templates by category"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <ul className="space-y-2">
          {visible.map((template) => (
            <li
              key={template.id}
              data-testid={TID.templateRow(template.id)}
              className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                  {template.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {template.category && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {template.category}
                      </span>
                    )}
                    <PriorityBadge priority={template.priority} />
                    {template.is_recurring && template.recurrence_pattern && (
                      <span className="rounded-full border border-purple-300 bg-purple-100 px-2 py-0.5 text-purple-700 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        🔄 {RECURRENCE_LABEL[template.recurrence_pattern]}
                      </span>
                    )}
                    {template.reminder_minutes != null && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        🔔 {REMINDER_BADGE_LABEL[template.reminder_minutes] ?? template.reminder_minutes}
                      </span>
                    )}
                    {template.subtasks.length > 0 && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {template.subtasks.length} subtask{template.subtasks.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => use(template.id)}
                    className={btnPrimary}
                    data-testid={TID.templateUseButton(template.id)}
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(template.id)}
                    className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                    data-testid={TID.templateDeleteButton(template.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              No templates yet. Fill the form and click “Save as Template”.
            </li>
          )}
        </ul>
      </div>
    </Modal>
  )
}
