import { type NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'fb_session';

// Paths that never require authentication
const PUBLIC_PREFIXES = ['/login', '/signup', '/auth', '/public', '/privacy', '/api'];

// Token-shareable worker schedule view — must stay reachable without login
// (anonymous recipients of a shared link), unlike /worker/schedule and
// /worker/schedule/published which are real worker-authenticated pages.
const PUBLIC_TOKEN_ROUTE = /^\/worker\/schedule\/(?!published$)[^/]+$/;

function isPublic(pathname: string) {
  return (
    PUBLIC_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'),
    ) || PUBLIC_TOKEN_ROUTE.test(pathname)
  );
}

/**
 * Runs at the Vercel Edge (no cold start).
 *
 * 1. Redirects unauthenticated users to /login before they ever reach a
 *    serverless function — saves 1-2 cold-start round trips per session.
 * 2. Redirects already-authenticated users away from /login and /signup.
 *
 * Only checks for the session cookie's *presence*, not its validity —
 * firebase-admin's cryptographic session-cookie verification requires the
 * Node runtime and can't run in Edge middleware. Server Components/Actions
 * still call getServerUser() (lib/firebase-auth-server.ts), which does the
 * real `verifySessionCookie()` check; this is only for routing decisions,
 * exactly as the old Supabase getSession() local-decode check was.
 */
export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const { pathname } = request.nextUrl;

  if (!hasSessionCookie && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSessionCookie && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
