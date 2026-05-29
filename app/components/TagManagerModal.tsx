'use client'

import { useState } from 'react'
import { TID } from '@/lib/testids'
import type { Tag } from '@/lib/types'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary, inputCls } from './styles'

interface TagManagerModalProps {
  tags: Tag[]
  onCreate: (name: string, color: string) => Promise<unknown>
  onUpdate: (id: number, fields: { name?: string; color?: string }) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
  onClose: () => void
}

const DEFAULT_COLOR = '#3B82F6'

export function TagManagerModal({ tags, onCreate, onUpdate, onDelete, onClose }: TagManagerModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_COLOR)

  const create = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Tag name is required')
      return
    }
    try {
      await onCreate(trimmed, color)
      setName('')
      setColor(DEFAULT_COLOR)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
    setError(null)
  }

  const saveEdit = async (id: number) => {
    const trimmed = editName.trim()
    if (!trimmed) {
      setError('Tag name is required')
      return
    }
    try {
      await onUpdate(id, { name: trimmed, color: editColor })
      setEditingId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag')
    }
  }

  const remove = async (id: number) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this tag? It will be removed from all todos.')) {
      return
    }
    try {
      await onDelete(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag')
    }
  }

  return (
    <Modal open onClose={onClose} title="Manage Tags" testId={TID.tagModal} closeTestId={TID.tagModalClose}>
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="tag-name">
              Name
            </label>
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void create()
                }
              }}
              className={inputCls}
              data-testid={TID.tagNameInput}
              placeholder="e.g. work"
            />
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            data-testid={TID.tagColorInput}
            aria-label="Tag color"
            className="h-10 w-12 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
          />
          <button type="button" onClick={create} className={btnPrimary} data-testid={TID.tagCreateButton}>
            Create Tag
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert" data-testid={TID.tagModalError}>
            {error}
          </p>
        )}

        <ul className="space-y-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              data-testid={TID.tagRow(tag.id)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700"
            >
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={inputCls}
                    aria-label="Tag name"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    aria-label="Tag color"
                    className="h-9 w-10 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(tag.id)}
                    className={btnPrimary}
                    data-testid={TID.tagUpdateButton(tag.id)}
                  >
                    Update
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className={btnSecondary}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="inline-block h-5 w-5 rounded-full"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-100">{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    data-testid={TID.tagEditButton(tag.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(tag.id)}
                    className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                    data-testid={TID.tagDeleteButton(tag.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
          {tags.length === 0 && (
            <li className="text-sm text-gray-500 dark:text-gray-400">No tags yet. Create one above.</li>
          )}
        </ul>
      </div>
    </Modal>
  )
}
