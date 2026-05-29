/**
 * Saved filter presets, persisted in localStorage (per browser/device).
 */
import { EMPTY_FILTERS, type FilterState } from './filtering'

const STORAGE_KEY = 'todo_filter_presets'

export interface FilterPreset {
  name: string
  filters: FilterState
}

export function loadPresets(): FilterPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((p) => typeof p?.name === 'string' && p?.filters)
      .map((p) => ({ name: p.name, filters: { ...EMPTY_FILTERS, ...p.filters } }))
  } catch {
    return []
  }
}

function persist(presets: FilterPreset[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function savePreset(name: string, filters: FilterState): FilterPreset[] {
  const presets = loadPresets().filter((p) => p.name !== name)
  const next = [...presets, { name, filters }]
  persist(next)
  return next
}

export function deletePreset(name: string): FilterPreset[] {
  const next = loadPresets().filter((p) => p.name !== name)
  persist(next)
  return next
}
