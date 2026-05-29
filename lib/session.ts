/**
 * Edge-safe session primitives (JWT sign/verify, config) with no `next/headers`
 * dependency, so this module can be imported from middleware (edge runtime).
 * Cookie-bound helpers live in `lib/auth.ts`.
 */
import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'todo_session'
export const CHALLENGE_COOKIE = 'todo_webauthn_challenge'

const DEV_SECRET = 'local-dev-insecure-secret-please-change-in-production-1234567890'

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  // HS256 keys should be at least 256 bits (~32 chars) of entropy.
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable must be set (min 32 chars) in production')
    }
    return DEV_SECRET
  }
  return secret
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret())
}

export const rpConfig = {
  rpID: process.env.RP_ID || 'localhost',
  rpName: process.env.RP_NAME || 'Todo App',
  origin: process.env.RP_ORIGIN || 'http://localhost:3000',
}

export interface SessionData {
  userId: number
  username: string
}

export async function signSession(data: SessionData): Promise<string> {
  return new SignJWT({ userId: data.userId, username: data.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey())
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (typeof payload.userId !== 'number' || typeof payload.username !== 'string') return null
    return { userId: payload.userId, username: payload.username }
  } catch {
    return null
  }
}

export type ChallengeType = 'register' | 'login'

export interface ChallengePayload {
  challenge: string
  userId: number
  username: string
  type: ChallengeType
}

export async function signChallenge(payload: ChallengePayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretKey())
}

export async function verifyChallenge(token: string): Promise<ChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (
      typeof payload.challenge !== 'string' ||
      typeof payload.userId !== 'number' ||
      typeof payload.username !== 'string' ||
      (payload.type !== 'register' && payload.type !== 'login')
    ) {
      return null
    }
    return {
      challenge: payload.challenge,
      userId: payload.userId,
      username: payload.username,
      type: payload.type,
    }
  } catch {
    return null
  }
}
