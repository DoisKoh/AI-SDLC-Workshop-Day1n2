/**
 * Cookie-bound session + WebAuthn challenge helpers. Server-only (uses
 * `next/headers`). Import from API route handlers, never from middleware.
 */
import { cookies } from 'next/headers'
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  signChallenge,
  signSession,
  verifyChallenge,
  verifySession,
  type ChallengePayload,
  type SessionData,
} from './session'

const isProd = process.env.NODE_ENV === 'production'

export async function createSession(data: SessionData): Promise<void> {
  const token = await signSession(data)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

export async function deleteSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function setChallenge(payload: ChallengePayload): Promise<void> {
  const token = await signChallenge(payload)
  const store = await cookies()
  store.set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  })
}

export async function getChallenge(): Promise<ChallengePayload | null> {
  const store = await cookies()
  const token = store.get(CHALLENGE_COOKIE)?.value
  if (!token) return null
  return verifyChallenge(token)
}

export async function clearChallenge(): Promise<void> {
  const store = await cookies()
  store.delete(CHALLENGE_COOKIE)
}
