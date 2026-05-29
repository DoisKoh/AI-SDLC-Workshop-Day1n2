'use client'

import { useState } from 'react'
import { TID } from '@/lib/testids'
import type { Todo } from '@/lib/types'
import { inputCls } from './styles'

interface SubtaskListProps {
  todo: Todo
  onAdd: (todoId: number, title: string) => Promise<void>
  onToggle: (todoId: number, subtaskId: number, completed: boolean) => Promise<void>
  onDelete: (todoId: number, subtaskId: number) => Promise<void>
}

export function SubtaskList({ todo, onAdd, onToggle, onDelete }: SubtaskListProps) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      await onAdd(todo.id, trimmed)
      setTitle('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/40" data-testid={TID.subtaskList(todo.id)}>
      <ul className="space-y-1">
        {todo.subtasks.map((subtask) => (
          <li
            key={subtask.id}
            className="flex items-center gap-2"
            data-testid={TID.subtaskItem(subtask.id)}
          >
            <input
              type="checkbox"
              checked={subtask.completed}
              onChange={() => onToggle(todo.id, subtask.id, !subtask.completed)}
              data-testid={TID.subtaskCheckbox(subtask.id)}
              className="h-4 w-4"
              aria-label={`Mark "${subtask.title}" ${subtask.completed ? 'incomplete' : 'complete'}`}
            />
            <span
              className={`flex-1 text-sm ${
                subtask.completed
                  ? 'text-gray-400 line-through dark:text-gray-500'
                  : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {subtask.title}
            </span>
            <button
              type="button"
              onClick={() => onDelete(todo.id, subtask.id)}
              data-testid={TID.subtaskDelete(subtask.id)}
              aria-label={`Delete subtask "${subtask.title}"`}
              className="px-1 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void add()
            }
          }}
          placeholder="Add a subtask…"
          className={inputCls}
          data-testid={TID.subtaskInput(todo.id)}
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy || !title.trim()}
          data-testid={TID.subtaskAdd(todo.id)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}
