import { db } from './connection'
import { getSingaporeNow } from '../timezone'
import type { Tag } from './types'

interface TagRow {
  id: number
  user_id: number
  name: string
  color: string
  created_at: string
}

function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    color: row.color,
    created_at: row.created_at,
  }
}

export const tagDB = {
  findByUserId(userId: number): Tag[] {
    const rows = db
      .prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC')
      .all(userId) as TagRow[]
    return rows.map(mapTag)
  },

  findById(id: number, userId: number): Tag | null {
    const row = db
      .prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .get(id, userId) as TagRow | undefined
    return row ? mapTag(row) : null
  },

  findByName(userId: number, name: string): Tag | null {
    const row = db
      .prepare('SELECT * FROM tags WHERE user_id = ? AND name = ? COLLATE NOCASE')
      .get(userId, name) as TagRow | undefined
    return row ? mapTag(row) : null
  },

  create(userId: number, name: string, color: string): Tag {
    const now = getSingaporeNow().toISOString()
    const info = db
      .prepare('INSERT INTO tags (user_id, name, color, created_at) VALUES (?, ?, ?, ?)')
      .run(userId, name, color, now)
    return { id: Number(info.lastInsertRowid), user_id: userId, name, color, created_at: now }
  },

  update(id: number, userId: number, fields: { name?: string; color?: string }): Tag | null {
    const existing = this.findById(id, userId)
    if (!existing) return null
    const name = fields.name ?? existing.name
    const color = fields.color ?? existing.color
    db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ? AND user_id = ?').run(
      name,
      color,
      id,
      userId,
    )
    return { ...existing, name, color }
  },

  delete(id: number, userId: number): boolean {
    const info = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(id, userId)
    return info.changes > 0
  },
}
