'use client'

import { useEffect, useRef, useState } from 'react'
import type { FilterState } from '@/lib/filtering'
import { useDebounce } from '@/lib/hooks/useDebounce'
import type { FilterPreset } from '@/lib/presets'
import { TID } from '@/lib/testids'
import type { Priority, Tag } from '@/lib/types'
import { btnDanger, btnSuccess, inputCls, labelCls, selectCls } from './styles'

interface SearchFilterBarProps {
  filters: FilterState
  setFilter: (patch: Partial<FilterState>) => void
  clearFilters: () => void
  activeCount: number
  tags: Tag[]
  presets: FilterPreset[]
  onApplyPreset: (filters: FilterState) => void
  onDeletePreset: (name: string) => void
  onSaveFilter: () => void
}

export function SearchFilterBar({
  filters,
  setFilter,
  clearFilters,
  activeCount,
  tags,
  presets,
  onApplyPreset,
  onDeletePreset,
  onSaveFilter,
}: SearchFilterBarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // The text input updates instantly; the actual filter is applied 300ms after
  // the user stops typing. A ref tracks the last value we pushed so external
  // resets (Clear All / applying a preset) sync back without a feedback loop.
  const [localSearch, setLocalSearch] = useState(filters.search)
  const debouncedSearch = useDebounce(localSearch, 300)
  const lastPushed = useRef(filters.search)

  useEffect(() => {
    if (debouncedSearch !== lastPushed.current) {
      lastPushed.current = debouncedSearch
      setFilter({ search: debouncedSearch })
    }
  }, [debouncedSearch, setFilter])

  useEffect(() => {
    if (filters.search !== lastPushed.current) {
      lastPushed.current = filters.search
      setLocalSearch(filters.search)
    }
  }, [filters.search])

  const clearSearch = () => {
    lastPushed.current = ''
    setLocalSearch('')
    setFilter({ search: '' })
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search todos, subtasks, and tags…"
          className={`${inputCls} pl-9 pr-9`}
          data-testid={TID.searchInput}
          aria-label="Search todos"
        />
        {localSearch && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            data-testid={TID.searchClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={filters.priority}
          onChange={(e) => setFilter({ priority: e.target.value as 'all' | Priority })}
          className={`${selectCls} max-w-[12rem]`}
          data-testid={TID.priorityFilter}
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {tags.length > 0 && (
          <select
            value={filters.tagId === 'all' ? 'all' : String(filters.tagId)}
            onChange={(e) =>
              setFilter({ tagId: e.target.value === 'all' ? 'all' : Number(e.target.value) })
            }
            className={`${selectCls} max-w-[12rem]`}
            data-testid={TID.tagFilter}
            aria-label="Filter by tag"
          >
            <option value="all">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            advancedOpen
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          data-testid={TID.advancedToggle}
          aria-expanded={advancedOpen}
        >
          {advancedOpen ? '▼' : '▶'} Advanced
        </button>

        {activeCount > 0 && (
          <>
            <button type="button" onClick={clearFilters} className={btnDanger} data-testid={TID.clearFiltersButton}>
              Clear All
            </button>
            <button type="button" onClick={onSaveFilter} className={btnSuccess} data-testid={TID.saveFilterButton}>
              💾 Save Filter
            </button>
          </>
        )}
      </div>

      {advancedOpen && (
        <div
          className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/40"
          data-testid={TID.advancedPanel}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="completion-filter">
                Completion
              </label>
              <select
                id="completion-filter"
                value={filters.completion}
                onChange={(e) =>
                  setFilter({ completion: e.target.value as FilterState['completion'] })
                }
                className={selectCls}
                data-testid={TID.completionFilter}
              >
                <option value="all">All Todos</option>
                <option value="incomplete">Incomplete Only</option>
                <option value="completed">Completed Only</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="date-from">
                Due From
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter({ dateFrom: e.target.value })}
                className={inputCls}
                data-testid={TID.dateFromInput}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="date-to">
                Due To
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter({ dateTo: e.target.value })}
                className={inputCls}
                data-testid={TID.dateToInput}
              />
            </div>
          </div>

          {presets.length > 0 && (
            <div className="mt-3">
              <p className={labelCls}>Saved Filter Presets</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <span
                    key={preset.name}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                  >
                    <button
                      type="button"
                      onClick={() => onApplyPreset(preset.filters)}
                      data-testid={TID.presetPill(preset.name)}
                      className="font-medium hover:underline"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(preset.name)}
                      data-testid={TID.presetDelete(preset.name)}
                      aria-label={`Delete preset ${preset.name}`}
                      className="text-blue-500 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
