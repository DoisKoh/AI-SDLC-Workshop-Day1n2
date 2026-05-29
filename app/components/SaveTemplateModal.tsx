'use client'

import { useState } from 'react'
import type { TemplateCreatePayload } from '@/lib/api-client'
import { TID } from '@/lib/testids'
import { Modal } from './Modal'
import type { TemplateDraft } from './TodoForm'
import { btnPrimary, btnSecondary, inputCls, labelCls } from './styles'

interface SaveTemplateModalProps {
  draft: TemplateDraft
  onSave: (payload: TemplateCreatePayload) => Promise<unknown>
  onClose: () => void
}

export function SaveTemplateModal({ draft, onSave, onClose }: SaveTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [offsetDays, setOffsetDays] = useState(
    draft.due_date_offset_days != null ? String(draft.due_date_offset_days) : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Template name is required')
      return
    }
    if (draft.is_recurring && offsetDays.trim() === '') {
      setError('Recurring templates need a "due in N days" value')
      return
    }
    setSubmitting(true)
    try {
      await onSave({
        name: trimmed,
        description: description.trim() || null,
        category: category.trim() || null,
        title_template: draft.title_template,
        priority: draft.priority,
        is_recurring: draft.is_recurring,
        recurrence_pattern: draft.recurrence_pattern,
        reminder_minutes: draft.reminder_minutes,
        due_date_offset_days: offsetDays.trim() !== '' ? Number(offsetDays) : null,
        subtasks: [],
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Save as Template" testId={TID.saveTemplateModal}>
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Saving “{draft.title_template}” with its priority, recurrence and reminder settings.
        </p>
        <div>
          <label className={labelCls} htmlFor="template-name">
            Name
          </label>
          <input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            data-testid={TID.templateNameInput}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="template-desc">
            Description (optional)
          </label>
          <input
            id="template-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            data-testid={TID.templateDescInput}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="template-category">
            Category (optional)
          </label>
          <input
            id="template-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
            data-testid={TID.templateCategoryInput}
            placeholder="e.g. Work"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="template-offset">
            Due in (days from creation){draft.is_recurring ? ' — required for recurring' : ' — optional'}
          </label>
          <input
            id="template-offset"
            type="number"
            min={0}
            value={offsetDays}
            onChange={(e) => setOffsetDays(e.target.value)}
            className={inputCls}
            data-testid={TID.templateOffsetInput}
            placeholder="e.g. 7"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary} data-testid={TID.templateSaveCancel}>
            Cancel
          </button>
          <button type="button" onClick={save} disabled={submitting} className={btnPrimary} data-testid={TID.templateSaveButton}>
            {submitting ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
