/**
 * Browser-side WebAuthn flows using @simplewebauthn/browser. Drives the
 * register/login ceremonies against the auth API routes.
 */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

export interface AuthUser {
  userId: number
  username: string
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as
    | { success: boolean; data?: T; error?: string }
    | null
  if (!res.ok || !data || !data.success) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data.data as T
}

export async function registerWithPasskey(username: string): Promise<AuthUser> {
  const options = await postJson<import('@simplewebauthn/server').PublicKeyCredentialCreationOptionsJSON>(
    '/api/auth/register-options',
    { username },
  )
  const attResp = await startRegistration({ optionsJSON: options })
  return postJson<AuthUser>('/api/auth/register-verify', { response: attResp })
}

export async function loginWithPasskey(username: string): Promise<AuthUser> {
  const options = await postJson<import('@simplewebauthn/server').PublicKeyCredentialRequestOptionsJSON>(
    '/api/auth/login-options',
    { username },
  )
  const authResp = await startAuthentication({ optionsJSON: options })
  return postJson<AuthUser>('/api/auth/login-verify', { response: authResp })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
  if (!res.ok) return null
  const data = (await res.json().catch(() => null)) as
    | { success: boolean; data?: AuthUser }
    | null
  return data?.success ? (data.data ?? null) : null
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
}
