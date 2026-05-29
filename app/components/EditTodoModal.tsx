'use client'

import { useState } from 'react'
import type { TodoUpdatePayload } from '@/lib/api-client'
import { readableTextColor } from '@/lib/color'
import { REMINDER_SELECT_OPTIONS } from '@/lib/labels'
import { TID } from '@/lib/testids'
import { dateToSingaporeInput, singaporeInputToDate } from '@/lib/timezone'
import type { Priority, RecurrencePattern, Tag, Todo } from '@/lib/types'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary, inputCls, labelCls, selectCls } from './styles'

interface EditTodoModalProps {
  todo: Todo
  tags: Tag[]
  onSave: (id: number, payload: TodoUpdatePayload) => Promise<unknown>
  onClose: () => void
}

export function EditTodoModal({ todo, tags, onSave, onClose }: EditTodoModalProps) {
  const [title, setTitle] = useState(todo.title)
  const [priority, setPriority] = useState<Priority>(todo.priority)
  const [due, setDue] = useState(todo.due_date ? dateToSingaporeInput(new Date(todo.due_date)) : '')
  const [isRecurring, setIsRecurring] = useState(todo.is_recurring)
  const [pattern, setPattern] = useState<RecurrencePattern>(todo.recurrence_pattern ?? 'daily')
  const [reminder, setReminder] = useState(
    todo.reminder_minutes != null ? String(todo.reminder_minutes) : '',
  )
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(todo.tags.map((t) => t.id))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (id: number) =>
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSave = async () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Title is required')
      return
    }
    if (isRecurring && !due) {
      setError('Recurring todos need a due date')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSave(todo.id, {
        title: trimmed,
        priority,
        due_date: due ? singaporeInputToDate(due).toISOString() : null,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? pattern : null,
        reminder_minutes: due && reminder ? Number(reminder) : null,
        tagIds: selectedTagIds,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit Todo" testId={TID.editModal}>
      <div className="space-y-3">
        <div>
          <label className={labelCls} htmlFor="edit-title">
            Title
          </label>
          <input
            id="edit-title"
            type="text"
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid={TID.editTitleInput}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="edit-priority">
              Priority
            </label>
            <select
              id="edit-priority"
              className={selectCls}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              data-testid={TID.editPrioritySelect}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="edit-reminder">
              Reminder
            </label>
            <select
              id="edit-reminder"
              className={selectCls}
              value={reminder}
              disabled={!due}
              onChange={(e) => setReminder(e.target.value)}
              data-testid={TID.editReminderSelect}
            >
              <option value="">None</option>
              {REMINDER_SELECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="edit-due">
            Due date &amp; time (Singapore)
          </label>
          <input
            id="edit-due"
            type="datetime-local"
            className={inputCls}
            value={due}
            onChange={(e) => {
              setDue(e.target.value)
              if (!e.target.value) setReminder('')
            }}
            data-testid={TID.editDueInput}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              data-testid={TID.editRecurringCheckbox}
              className="h-4 w-4"
            />
            Repeat
          </label>
          {isRecurring && (
            <select
              className={`${selectCls} max-w-[10rem]`}
              value={pattern}
              onChange={(e) => setPattern(e.target.value as RecurrencePattern)}
              data-testid={TID.editRecurrenceSelect}
              aria-label="Recurrence pattern"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          )}
        </div>

        {tags.length > 0 && (
          <div>
            <p className={labelCls}>Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    data-testid={TID.editTagToggle(tag.id)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                      selected
                        ? 'border-transparent'
                        : 'border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                    style={
                      selected
                        ? { backgroundColor: tag.color, color: readableTextColor(tag.color) }
                        : undefined
                    }
                  >
                    {selected ? '✓ ' : ''}
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary} data-testid={TID.editCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className={btnPrimary} disabled={submitting} data-testid={TID.editSave}>
            {submitting ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
