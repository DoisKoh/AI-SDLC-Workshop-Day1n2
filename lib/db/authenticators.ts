import { db } from './connection'
import { getSingaporeNow } from '../timezone'
import type { Authenticator } from './types'

interface AuthenticatorRow {
  id: number
  user_id: number
  credential_id: string
  credential_public_key: Buffer
  counter: number
  transports: string | null
  created_at: string
}

function mapAuthenticator(row: AuthenticatorRow): Authenticator {
  return {
    id: row.id,
    user_id: row.user_id,
    credential_id: row.credential_id,
    credential_public_key: row.credential_public_key,
    counter: row.counter,
    transports: row.transports ? (JSON.parse(row.transports) as string[]) : null,
    created_at: row.created_at,
  }
}

export const authenticatorDB = {
  findByUserId(userId: number): Authenticator[] {
    const rows = db
      .prepare('SELECT * FROM authenticators WHERE user_id = ?')
      .all(userId) as AuthenticatorRow[]
    return rows.map(mapAuthenticator)
  },

  findByCredentialId(credentialId: string): Authenticator | null {
    const row = db
      .prepare('SELECT * FROM authenticators WHERE credential_id = ?')
      .get(credentialId) as AuthenticatorRow | undefined
    return row ? mapAuthenticator(row) : null
  },

  create(input: {
    userId: number
    credentialId: string
    publicKey: Buffer
    counter: number
    transports: string[] | null
  }): Authenticator {
    const now = getSingaporeNow().toISOString()
    const transports = input.transports ? JSON.stringify(input.transports) : null
    const info = db
      .prepare(
        `INSERT INTO authenticators
          (user_id, credential_id, credential_public_key, counter, transports, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(input.userId, input.credentialId, input.publicKey, input.counter, transports, now)
    return {
      id: Number(info.lastInsertRowid),
      user_id: input.userId,
      credential_id: input.credentialId,
      credential_public_key: input.publicKey,
      counter: input.counter,
      transports: input.transports,
      created_at: now,
    }
  },

  /** Persist the post-authentication signature counter (replay protection). */
  updateCounter(credentialId: string, counter: number): void {
    db.prepare('UPDATE authenticators SET counter = ? WHERE credential_id = ?').run(
      counter,
      credentialId,
    )
  },
}
