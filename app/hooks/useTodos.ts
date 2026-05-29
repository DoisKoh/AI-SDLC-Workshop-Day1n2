'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  subtasksApi,
  tagsApi,
  templatesApi,
  todosApi,
  type TemplateCreatePayload,
  type TodoCreatePayload,
  type TodoUpdatePayload,
} from '@/lib/api-client'
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filterTodos,
  splitSections,
  type FilterState,
  type TodoSections,
} from '@/lib/filtering'
import { sortTodos } from '@/lib/sort'
import { getSingaporeNow } from '@/lib/timezone'
import type { Tag, Template, Todo } from '@/lib/types'

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)

export interface UseTodos {
  todos: Todo[]
  tags: Tag[]
  templates: Template[]
  loading: boolean
  error: string | null
  now: Date
  filters: FilterState
  filtered: Todo[]
  sections: TodoSections
  activeFilterCount: number
  setFilter: (patch: Partial<FilterState>) => void
  setFilters: (filters: FilterState) => void
  clearFilters: () => void
  reload: () => Promise<void>
  createTodo: (payload: TodoCreatePayload) => Promise<Todo>
  updateTodo: (id: number, payload: TodoUpdatePayload) => Promise<Todo>
  toggleTodo: (todo: Todo) => Promise<void>
  deleteTodo: (id: number) => Promise<void>
  addSubtask: (todoId: number, title: string) => Promise<void>
  toggleSubtask: (todoId: number, subtaskId: number, completed: boolean) => Promise<void>
  deleteSubtask: (todoId: number, subtaskId: number) => Promise<void>
  createTag: (name: string, color: string) => Promise<Tag>
  updateTag: (id: number, fields: { name?: string; color?: string }) => Promise<void>
  deleteTag: (id: number) => Promise<void>
  createTemplate: (payload: TemplateCreatePayload) => Promise<Template>
  updateTemplate: (id: number, payload: TemplateCreatePayload) => Promise<Template>
  deleteTemplate: (id: number) => Promise<void>
  useTemplate: (id: number) => Promise<Todo>
}

export function useTodos(): UseTodos {
  const [todos, setTodos] = useState<Todo[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => getSingaporeNow())
  const [filters, setFiltersState] = useState<FilterState>(EMPTY_FILTERS)

  const todosRef = useRef<Todo[]>([])
  useEffect(() => {
    todosRef.current = todos
  }, [todos])

  const reload = useCallback(async () => {
    try {
      const [t, g, m] = await Promise.all([todosApi.list(), tagsApi.list(), templatesApi.list()])
      setTodos(t)
      setTags([...g].sort(byName))
      setTemplates(m)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // Tick "now" each minute so overdue classification and due labels stay fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(getSingaporeNow()), 60_000)
    return () => clearInterval(id)
  }, [])

  const refreshTodo = useCallback(async (id: number) => {
    const fresh = await todosApi.get(id)
    setTodos((prev) => sortTodos(prev.map((t) => (t.id === id ? fresh : t))))
  }, [])

  const createTodo = useCallback(async (payload: TodoCreatePayload) => {
    const todo = await todosApi.create(payload)
    setTodos((prev) => sortTodos([...prev, todo]))
    return todo
  }, [])

  const updateTodo = useCallback(
    async (id: number, payload: TodoUpdatePayload) => {
      const existing = todosRef.current.find((t) => t.id === id)
      const updated = await todosApi.update(id, payload)
      const spawnedRecurrence =
        payload.completed === true &&
        existing?.is_recurring &&
        !!existing.recurrence_pattern &&
        !!existing.due_date
      if (spawnedRecurrence) {
        // The server created the next occurrence; refetch to pick it up.
        await reload()
      } else {
        setTodos((prev) => sortTodos(prev.map((t) => (t.id === id ? updated : t))))
      }
      return updated
    },
    [reload],
  )

  const toggleTodo = useCallback(
    async (todo: Todo) => {
      await updateTodo(todo.id, { completed: !todo.completed })
    },
    [updateTodo],
  )

  const deleteTodo = useCallback(async (id: number) => {
    await todosApi.remove(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addSubtask = useCallback(
    async (todoId: number, title: string) => {
      await subtasksApi.create(todoId, title)
      await refreshTodo(todoId)
    },
    [refreshTodo],
  )

  const toggleSubtask = useCallback(
    async (todoId: number, subtaskId: number, completed: boolean) => {
      await subtasksApi.update(subtaskId, { completed })
      await refreshTodo(todoId)
    },
    [refreshTodo],
  )

  const deleteSubtask = useCallback(
    async (todoId: number, subtaskId: number) => {
      await subtasksApi.remove(subtaskId)
      await refreshTodo(todoId)
    },
    [refreshTodo],
  )

  const createTag = useCallback(async (name: string, color: string) => {
    const tag = await tagsApi.create(name, color)
    setTags((prev) => [...prev, tag].sort(byName))
    return tag
  }, [])

  const updateTag = useCallback(
    async (id: number, fields: { name?: string; color?: string }) => {
      await tagsApi.update(id, fields)
      // Rename/recolor reflects on every todo using the tag — refetch all.
      await reload()
    },
    [reload],
  )

  const deleteTag = useCallback(
    async (id: number) => {
      await tagsApi.remove(id)
      setFiltersState((prev) => (prev.tagId === id ? { ...prev, tagId: 'all' } : prev))
      await reload()
    },
    [reload],
  )

  const createTemplate = useCallback(async (payload: TemplateCreatePayload) => {
    const template = await templatesApi.create(payload)
    setTemplates((prev) => [template, ...prev])
    return template
  }, [])

  const updateTemplate = useCallback(async (id: number, payload: TemplateCreatePayload) => {
    const template = await templatesApi.update(id, payload)
    setTemplates((prev) => prev.map((t) => (t.id === id ? template : t)))
    return template
  }, [])

  const deleteTemplate = useCallback(async (id: number) => {
    await templatesApi.remove(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const useTemplate = useCallback(async (id: number) => {
    const todo = await templatesApi.use(id)
    setTodos((prev) => sortTodos([...prev, todo]))
    return todo
  }, [])

  const setFilter = useCallback((patch: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
  }, [])

  const setFilters = useCallback((next: FilterState) => setFiltersState(next), [])
  const clearFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), [])

  const filtered = useMemo(() => filterTodos(todos, filters), [todos, filters])
  const sections = useMemo(() => splitSections(filtered, now), [filtered, now])
  const activeCount = useMemo(() => activeFilterCount(filters), [filters])

  return {
    todos,
    tags,
    templates,
    loading,
    error,
    now,
    filters,
    filtered,
    sections,
    activeFilterCount: activeCount,
    setFilter,
    setFilters,
    clearFilters,
    reload,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    createTag,
    updateTag,
    deleteTag,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
  }
}
