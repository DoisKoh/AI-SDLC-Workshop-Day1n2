import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: Record<string, unknown>
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, init)
}

export function jsonError(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error } satisfies ApiResponse<never>, { status })
}

export function unauthorized(): NextResponse {
  return jsonError('Not authenticated', 401)
}

export function notFound(resource = 'Resource'): NextResponse {
  return jsonError(`${resource} not found`, 404)
}

/**
 * Wrap a route body so thrown ZodErrors become 422s and unexpected errors
 * become 500s without leaking internals to the client.
 */
export async function safeHandler(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join('; ')
      return jsonError(message || 'Validation failed', 422)
    }
    console.error('API route error:', error)
    return jsonError('Internal server error', 500)
  }
}
