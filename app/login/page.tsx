'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { loginWithPasskey, registerWithPasskey } from '@/lib/auth-client'
import { TID } from '@/lib/testids'
import { btnPrimary, inputCls } from '../components/styles'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('register')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = username.trim()
    if (!name) {
      setError('Please enter a username')
      return
    }
    setError(null)
    setStatus(mode === 'register' ? 'Creating your passkey…' : 'Authenticating…')
    setLoading(true)
    try {
      if (mode === 'register') {
        await registerWithPasskey(name)
      } else {
        await loginWithPasskey(name)
      }
      setStatus('Success! Redirecting…')
      router.push('/')
      router.refresh()
    } catch (err) {
      setStatus(null)
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-sm font-medium transition ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    }`

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h1 className="mb-1 text-center text-2xl font-bold text-gray-900 dark:text-white">✅ Todo App</h1>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Passwordless sign-in with passkeys
        </p>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError(null)
              setStatus(null)
            }}
            className={tabClass(mode === 'register')}
            data-testid={TID.authTabRegister}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
              setStatus(null)
            }}
            className={tabClass(mode === 'login')}
            data-testid={TID.authTabLogin}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username webauthn"
            className={inputCls}
            data-testid={TID.authUsernameInput}
            aria-label="Username"
          />
          <button type="submit" disabled={loading} className={`${btnPrimary} w-full`} data-testid={TID.authSubmit}>
            {loading
              ? 'Please wait…'
              : mode === 'register'
                ? 'Register with passkey'
                : 'Login with passkey'}
          </button>
        </form>

        {status && (
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400" data-testid={TID.authStatus}>
            {status}
          </p>
        )}
        {error && (
          <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400" role="alert" data-testid={TID.authError}>
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Your device will prompt for fingerprint, Face ID, or a security key.
        </p>
      </div>
    </main>
  )
}
