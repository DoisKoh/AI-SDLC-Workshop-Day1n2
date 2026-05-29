/**
 * Database entry point — the single source of truth for data access.
 *
 * Implementation is split into focused modules under `lib/db/` for cohesion;
 * this file re-exports the public surface (CRUD objects + shared types) so
 * callers can simply `import { todoDB, Todo } from '@/lib/db'`.
 *
 * All operations are synchronous (better-sqlite3). Never import this from a
 * client component — it is server-only.
 */

export { db } from './db/connection'
export type { DbConnection } from './db/connection'

export * from './db/types'

export { userDB } from './db/users'
export { authenticatorDB } from './db/authenticators'
export { tagDB } from './db/tags'
export { subtaskDB } from './db/subtasks'
export { todoDB } from './db/todos'
export type { CreateTodoInput, UpdateTodoInput } from './db/todos'
export { sortTodos } from './sort'
export { templateDB } from './db/templates'
export type { CreateTemplateInput } from './db/templates'
export { holidayDB } from './db/holidays'
