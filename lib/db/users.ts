import { db } from './connection'
import { getSingaporeNow } from '../timezone'
import type { User } from './types'

interface UserRow {
  id: number
  username: string
  created_at: string
}

function mapUser(row: UserRow): User {
  return { id: row.id, username: row.username, created_at: row.created_at }
}

export const userDB = {
  findById(id: number): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
    return row ? mapUser(row) : null
  },

  findByUsername(username: string): User | null {
    const row = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as UserRow | undefined
    return row ? mapUser(row) : null
  },

  create(username: string): User {
    const now = getSingaporeNow().toISOString()
    const info = db
      .prepare('INSERT INTO users (username, created_at) VALUES (?, ?)')
      .run(username, now)
    return { id: Number(info.lastInsertRowid), username, created_at: now }
  },

  /** Number of authenticators registered to a user (0 means registration incomplete). */
  authenticatorCount(userId: number): number {
    const row = db
      .prepare('SELECT COUNT(*) AS count FROM authenticators WHERE user_id = ?')
      .get(userId) as { count: number }
    return row.count
  },
}
