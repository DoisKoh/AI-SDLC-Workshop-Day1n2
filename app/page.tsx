'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { downloadExport, importApi } from '@/lib/api-client'
import { getCurrentUser, logout } from '@/lib/auth-client'
import type { TemplateCreatePayload } from '@/lib/api-client'
import type { FilterState } from '@/lib/filtering'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { deletePreset, loadPresets, savePreset, type FilterPreset } from '@/lib/presets'
import type { Todo } from '@/lib/types'
import { EditTodoModal } from './components/EditTodoModal'
import { Header } from './components/Header'
import { SaveFilterModal } from './components/SaveFilterModal'
import { SaveTemplateModal } from './components/SaveTemplateModal'
import { SearchFilterBar } from './components/SearchFilterBar'
import { TagManagerModal } from './components/TagManagerModal'
import { TemplateModal } from './components/TemplateModal'
import { TodoForm, type TemplateDraft } from './components/TodoForm'
import { TodoSectionsView, type TodoItemHandlers } from './components/TodoSections'
import { useTodos } from './hooks/useTodos'

export default function HomePage() {
  const router = useRouter()
  const todos = useTodos()
  const notifications = useNotifications()

  const [username, setUsername] = useState('')
  const [editing, setEditing] = useState<Todo | null>(null)
  const [showTags, setShowTags] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null)
  const [showSaveFilter, setShowSaveFilter] = useState(false)
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    void getCurrentUser().then((u) => {
      if (u) setUsername(u.username)
    })
  }, [])

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  const guard = (fn: () => Promise<unknown>) => async () => {
    try {
      setActionError(null)
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  const handlers: TodoItemHandlers = {
    onToggle: (todo) => guard(() => todos.toggleTodo(todo))(),
    onEdit: (todo) => setEditing(todo),
    onDelete: (id) => guard(() => todos.deleteTodo(id))(),
    onTagClick: (tagId) => todos.setFilter({ tagId }),
    onAddSubtask: (todoId, title) => guard(() => todos.addSubtask(todoId, title))(),
    onToggleSubtask: (todoId, subtaskId, completed) =>
      guard(() => todos.toggleSubtask(todoId, subtaskId, completed))(),
    onDeleteSubtask: (todoId, subtaskId) =>
      guard(() => todos.deleteSubtask(todoId, subtaskId))(),
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  const handleImport = async (file: File) => {
    setImportStatus(null)
    try {
      const text = await file.text()
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        setImportStatus('Invalid JSON format')
        return
      }
      const result = await importApi.importTodos(json)
      await todos.reload()
      setImportStatus(`Successfully imported ${result.imported} todos`)
    } catch (e) {
      setImportStatus(
        e instanceof Error ? e.message : 'Failed to import todos. Please check the file format.',
      )
    }
  }

  const handleSaveTemplate = async (payload: TemplateCreatePayload) => {
    await todos.createTemplate(payload)
  }

  const handleSavePreset = (name: string) => {
    setPresets(savePreset(name, todos.filters))
  }

  const handleApplyPreset = (filters: FilterState) => {
    todos.setFilters(filters)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Header
        username={username}
        view="home"
        notifications={notifications}
        onExportJson={() => downloadExport('json')}
        onExportCsv={() => downloadExport('csv')}
        onImportFile={handleImport}
        importStatus={importStatus}
        onLogout={handleLogout}
      />

      <div className="space-y-4">
        <TodoForm
          tags={todos.tags}
          templates={todos.templates}
          onCreate={(payload) => todos.createTodo(payload)}
          onUseTemplate={(id) => todos.useTemplate(id)}
          onSaveAsTemplate={(draft) => setTemplateDraft(draft)}
          onManageTags={() => setShowTags(true)}
          onOpenTemplates={() => setShowTemplates(true)}
        />

        <SearchFilterBar
          filters={todos.filters}
          setFilter={todos.setFilter}
          clearFilters={todos.clearFilters}
          activeCount={todos.activeFilterCount}
          tags={todos.tags}
          presets={presets}
          onApplyPreset={handleApplyPreset}
          onDeletePreset={(name) => setPresets(deletePreset(name))}
          onSaveFilter={() => setShowSaveFilter(true)}
        />

        {actionError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
            {actionError}
          </p>
        )}

        {todos.loading ? (
          <p className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
            Loading…
          </p>
        ) : todos.error ? (
          <p className="rounded-xl bg-white p-8 text-center text-red-600 shadow-sm dark:bg-gray-800 dark:text-red-400">
            {todos.error}
          </p>
        ) : (
          <TodoSectionsView sections={todos.sections} now={todos.now} handlers={handlers} />
        )}
      </div>

      {editing && (
        <EditTodoModal
          key={editing.id}
          todo={editing}
          tags={todos.tags}
          onSave={(id, payload) => todos.updateTodo(id, payload)}
          onClose={() => setEditing(null)}
        />
      )}

      {showTags && (
        <TagManagerModal
          tags={todos.tags}
          onCreate={(name, color) => todos.createTag(name, color)}
          onUpdate={(id, fields) => todos.updateTag(id, fields)}
          onDelete={(id) => todos.deleteTag(id)}
          onClose={() => setShowTags(false)}
        />
      )}

      {showTemplates && (
        <TemplateModal
          templates={todos.templates}
          onUse={(id) => todos.useTemplate(id)}
          onDelete={(id) => todos.deleteTemplate(id)}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {templateDraft && (
        <SaveTemplateModal
          draft={templateDraft}
          onSave={handleSaveTemplate}
          onClose={() => setTemplateDraft(null)}
        />
      )}

      {showSaveFilter && (
        <SaveFilterModal
          filters={todos.filters}
          tags={todos.tags}
          onSave={handleSavePreset}
          onClose={() => setShowSaveFilter(false)}
        />
      )}
    </main>
  )
}
