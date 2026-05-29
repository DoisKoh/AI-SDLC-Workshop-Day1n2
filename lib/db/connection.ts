import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Resolve the SQLite file location. Prefers an explicit DATABASE_PATH, then a
 * Railway-mounted volume (for persistence across deploys), then the project root.
 */
function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH
  const base = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.cwd()
  return path.join(base, 'todos.db')
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authenticators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key BLOB NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_pattern TEXT,
  reminder_minutes INTEGER,
  last_notification_sent TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TEXT NOT NULL,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  title_template TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_pattern TEXT,
  reminder_minutes INTEGER,
  due_date_offset_days INTEGER,
  subtasks TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
`

export type DbConnection = Database.Database

function createConnection(): DbConnection {
  const dbPath = resolveDbPath()
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath)
    fs.mkdirSync(dir, { recursive: true })
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.exec(SCHEMA)
  return db
}

/**
 * Cache the connection on globalThis so Next.js dev hot-reloads reuse a single
 * handle instead of opening a new one on every module evaluation.
 */
const globalForDb = globalThis as unknown as { __todoDb?: DbConnection }

/**
 * Lazily resolve the connection. Opening the database is deferred until the
 * first query so that merely importing a route module (as Next does during the
 * build's "collect page data" step, across parallel workers) does not open —
 * and lock — the SQLite file.
 */
function getConnection(): DbConnection {
  if (!globalForDb.__todoDb) {
    globalForDb.__todoDb = createConnection()
  }
  return globalForDb.__todoDb
}

/**
 * Proxy that forwards to the real connection, initializing it on first access.
 * Keeps the simple `db.prepare(...)` call sites unchanged.
 */
export const db: DbConnection = new Proxy({} as DbConnection, {
  get(_target, prop, receiver) {
    const conn = getConnection()
    const value = Reflect.get(conn as object, prop, receiver)
    return typeof value === 'function' ? value.bind(conn) : value
  },
})
