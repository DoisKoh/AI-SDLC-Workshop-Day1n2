import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from './lib/session'

/**
 * Route protection. Unauthenticated users hitting protected pages are sent to
 * /login; authenticated users hitting /login are sent home. API routes do their
 * own auth checks and are intentionally not matched here.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySession(token) : null
  const { pathname } = request.nextUrl

  const isLoginPage = pathname === '/login'

  if (!session && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (session && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/calendar', '/login'],
}
