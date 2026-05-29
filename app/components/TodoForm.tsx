'use client'

import { useState } from 'react'
import type { TodoCreatePayload } from '@/lib/api-client'
import { readableTextColor } from '@/lib/color'
import { REMINDER_SELECT_OPTIONS } from '@/lib/labels'
import { TID } from '@/lib/testids'
import { dateToSingaporeInput, getSingaporeNow, singaporeInputToDate } from '@/lib/timezone'
import type { Priority, RecurrencePattern, Tag, Template } from '@/lib/types'
import { btnGhost, btnPrimary, btnSecondary, inputCls, labelCls, selectCls } from './styles'

export interface TemplateDraft {
  title_template: string
  priority: Priority
  is_recurring: boolean
  recurrence_pattern: RecurrencePattern | null
  reminder_minutes: number | null
  due_date_offset_days: number | null
}

interface TodoFormProps {
  tags: Tag[]
  templates: Template[]
  onCreate: (payload: TodoCreatePayload) => Promise<unknown>
  onUseTemplate: (id: number) => Promise<unknown>
  onSaveAsTemplate: (draft: TemplateDraft) => void
  onManageTags: () => void
  onOpenTemplates: () => void
}

export function TodoForm({
  tags,
  templates,
  onCreate,
  onUseTemplate,
  onSaveAsTemplate,
  onManageTags,
  onOpenTemplates,
}: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [due, setDue] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [pattern, setPattern] = useState<RecurrencePattern>('daily')
  const [reminder, setReminder] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minDue = dateToSingaporeInput(getSingaporeNow())

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const reset = () => {
    setTitle('')
    setPriority('medium')
    setDue('')
    setIsRecurring(false)
    setPattern('daily')
    setReminder('')
    setSelectedTagIds([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const payload: TodoCreatePayload = {
        title: trimmed,
        priority,
        due_date: due ? singaporeInputToDate(due).toISOString() : null,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? pattern : null,
        reminder_minutes: due && reminder ? Number(reminder) : null,
        tagIds: selectedTagIds,
      }
      await onCreate(payload)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUseTemplate = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    e.target.value = ''
    if (!value) return
    try {
      await onUseTemplate(Number(value))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use template')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid={TID.todoForm}
      className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onManageTags} className={btnSecondary} data-testid={TID.manageTagsButton}>
          + Manage Tags
        </button>
        <button type="button" onClick={onOpenTemplates} className={btnSecondary} data-testid={TID.templatesButton}>
          📋 Templates
        </button>
        {templates.length > 0 && (
          <select
            className={`${selectCls} max-w-xs`}
            defaultValue=""
            onChange={handleUseTemplate}
            data-testid={TID.useTemplateSelect}
            aria-label="Use template"
          >
            <option value="">Use Template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.category ? ` (${t.category})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={labelCls} htmlFor="todo-title">
            Title
          </label>
          <input
            id="todo-title"
            type="text"
            className={inputCls}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid={TID.todoTitleInput}
          />
        </div>
        <div className="sm:w-32">
          <label className={labelCls} htmlFor="todo-priority">
            Priority
          </label>
          <select
            id="todo-priority"
            className={selectCls}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            data-testid={TID.todoPrioritySelect}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={labelCls} htmlFor="todo-due">
            Due date &amp; time (Singapore)
          </label>
          <input
            id="todo-due"
            type="datetime-local"
            className={inputCls}
            value={due}
            min={minDue}
            onChange={(e) => {
              setDue(e.target.value)
              if (!e.target.value) setReminder('')
            }}
            data-testid={TID.todoDueInput}
          />
        </div>
        <div className="sm:w-48">
          <label className={labelCls} htmlFor="todo-reminder">
            Reminder
          </label>
          <select
            id="todo-reminder"
            className={selectCls}
            value={reminder}
            disabled={!due}
            onChange={(e) => setReminder(e.target.value)}
            data-testid={TID.todoReminderSelect}
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            data-testid={TID.todoRecurringCheckbox}
            className="h-4 w-4"
          />
          Repeat
        </label>
        {isRecurring && (
          <select
            className={`${selectCls} max-w-[10rem]`}
            value={pattern}
            onChange={(e) => setPattern(e.target.value as RecurrencePattern)}
            data-testid={TID.todoRecurrenceSelect}
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
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id)
            return (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                data-testid={TID.formTagToggle(tag.id)}
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
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className={btnPrimary} disabled={submitting} data-testid={TID.todoAddButton}>
          {submitting ? 'Adding…' : 'Add'}
        </button>
        {title.trim() && (
          <button
            type="button"
            className={btnGhost}
            data-testid={TID.saveTemplateButton}
            onClick={() =>
              onSaveAsTemplate({
                title_template: title.trim(),
                priority,
                is_recurring: isRecurring,
                recurrence_pattern: isRecurring ? pattern : null,
                reminder_minutes: due && reminder ? Number(reminder) : null,
                // Default the template's due-date offset from the current due date, if any.
                due_date_offset_days: due
                  ? Math.max(
                      0,
                      Math.round((singaporeInputToDate(due).getTime() - Date.now()) / 86400000),
                    )
                  : null,
              })
            }
          >
            💾 Save as Template
          </button>
        )}
      </div>
    </form>
  )
}
