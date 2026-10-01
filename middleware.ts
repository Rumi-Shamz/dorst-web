import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Age gate applies to the marketing site — partner portal is at /partners
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip age gate for: age-gate pages, partner portal, static assets, API routes, Next.js internals
  if (
    pathname.startsWith('/age-gate') ||
    pathname.startsWith('/partners') ||
    pathname.startsWith('/brand-book') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next()
  }

  const verified = request.cookies.get('dorst-age-verified')
  if (verified?.value === '1') {
    return NextResponse.next()
  }

  // Redirect to age gate, preserving the original URL as a return path
  const gateUrl = new URL('/age-gate', request.url)
  gateUrl.searchParams.set('return', pathname)
  const response = NextResponse.redirect(gateUrl)
  // Prevent Next from caching this redirect for Link prefetch / soft nav
  // (otherwise Yes → router.push reuses a stale redirect after the cookie is set).
  response.headers.set('x-middleware-cache', 'no-cache')
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and _next internals.
     * The pathname checks in the function body handle the remaining exclusions.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
