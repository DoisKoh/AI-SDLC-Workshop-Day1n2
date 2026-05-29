'use client'

import { useState } from 'react'
import { TID } from '@/lib/testids'
import { getDueLabel, type DueUrgency } from '@/lib/timezone'
import type { Todo } from '@/lib/types'
import { PriorityBadge, RecurrenceBadge, ReminderBadge, TagBadge } from './badges'
import { ProgressBar } from './ProgressBar'
import { SubtaskList } from './SubtaskList'
import { btnGhost, btnGhostDanger } from './styles'

const DUE_CLASSES: Record<DueUrgency, string> = {
  overdue: 'text-red-600 dark:text-red-400 font-medium',
  red: 'text-red-600 dark:text-red-400',
  orange: 'text-orange-600 dark:text-orange-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  blue: 'text-blue-600 dark:text-blue-400',
}

interface TodoItemProps {
  todo: Todo
  now: Date
  onToggle: (todo: Todo) => Promise<void>
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => Promise<void>
  onTagClick: (tagId: number) => void
  onAddSubtask: (todoId: number, title: string) => Promise<void>
  onToggleSubtask: (todoId: number, subtaskId: number, completed: boolean) => Promise<void>
  onDeleteSubtask: (todoId: number, subtaskId: number) => Promise<void>
}

export function TodoItem({
  todo,
  now,
  onToggle,
  onEdit,
  onDelete,
  onTagClick,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoItemProps) {
  const [expanded, setExpanded] = useState(false)
  const due = todo.due_date ? getDueLabel(new Date(todo.due_date), now) : null

  const handleDelete = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this todo? This cannot be undone.')) {
      return
    }
    await onDelete(todo.id)
  }

  return (
    <li
      data-testid={TID.todoItem(todo.id)}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo)}
          data-testid={TID.todoCheckbox(todo.id)}
          aria-label={`Mark "${todo.title}" ${todo.completed ? 'incomplete' : 'complete'}`}
          className="mt-1 h-5 w-5 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              data-testid={TID.todoTitle(todo.id)}
              className={`font-medium ${
                todo.completed
                  ? 'text-gray-400 line-through dark:text-gray-500'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {todo.title}
            </span>
            <PriorityBadge priority={todo.priority} todoId={todo.id} />
            {todo.is_recurring && todo.recurrence_pattern && (
              <RecurrenceBadge pattern={todo.recurrence_pattern} todoId={todo.id} />
            )}
            {todo.reminder_minutes != null && (
              <ReminderBadge minutes={todo.reminder_minutes} todoId={todo.id} />
            )}
            {todo.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} todoId={todo.id} onClick={onTagClick} />
            ))}
          </div>

          {due && (
            <p className={`mt-1 text-sm ${DUE_CLASSES[due.urgency]}`} data-testid={TID.dueLabel(todo.id)}>
              {due.urgency === 'overdue' ? '⚠️ ' : ''}
              {due.text}
              {due.urgency !== 'blue' && due.urgency !== 'overdue' ? ` (${due.timestamp})` : ''}
            </p>
          )}

          <ProgressBar todoId={todo.id} progress={todo.progress} />

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              data-testid={TID.subtasksToggle(todo.id)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              aria-expanded={expanded}
            >
              {expanded ? '▼' : '▶'} Subtasks
              {todo.progress.total > 0 ? ` (${todo.progress.completed}/${todo.progress.total})` : ''}
            </button>
            <button type="button" onClick={() => onEdit(todo)} className={btnGhost} data-testid={TID.editButton(todo.id)}>
              Edit
            </button>
            <button type="button" onClick={handleDelete} className={btnGhostDanger} data-testid={TID.deleteButton(todo.id)}>
              Delete
            </button>
          </div>

          {expanded && (
            <SubtaskList
              todo={todo}
              onAdd={onAddSubtask}
              onToggle={onToggleSubtask}
              onDelete={onDeleteSubtask}
            />
          )}
        </div>
      </div>
    </li>
  )
}
