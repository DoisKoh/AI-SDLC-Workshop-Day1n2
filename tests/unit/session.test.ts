import { describe, expect, it } from 'vitest'
import {
  getJwtSecret,
  rpConfig,
  signChallenge,
  signSession,
  verifyChallenge,
  verifySession,
} from '@/lib/session'

describe('session JWT', () => {
  it('uses the configured secret (>= 32 chars)', () => {
    expect(getJwtSecret().length).toBeGreaterThanOrEqual(32)
  })

  it('round-trips a session token', async () => {
    const token = await signSession({ userId: 42, username: 'alice' })
    expect(await verifySession(token)).toEqual({ userId: 42, username: 'alice' })
  })

  it('rejects a tampered/garbage session token', async () => {
    expect(await verifySession('not-a-jwt')).toBeNull()
  })

  it('round-trips a challenge token', async () => {
    const token = await signChallenge({
      challenge: 'abc123',
      userId: 7,
      username: 'bob',
      type: 'register',
    })
    const payload = await verifyChallenge(token)
    expect(payload).toMatchObject({ challenge: 'abc123', userId: 7, username: 'bob', type: 'register' })
  })

  it('rejects a garbage challenge token', async () => {
    expect(await verifyChallenge('nope')).toBeNull()
  })

  it('defaults the relying-party id to localhost when RP_ID is unset', () => {
    expect(rpConfig.rpID).toBe('localhost')
  })
})
