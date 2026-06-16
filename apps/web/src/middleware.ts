import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Paths that never require authentication
const PUBLIC_PREFIXES = ['/login', '/signup', '/auth', '/public', '/privacy', '/api'];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'),
  );
}

/**
 * Runs at the Vercel Edge (no cold start).
 *
 * 1. Refreshes the Supabase session cookie so it never expires mid-session.
 * 2. Redirects unauthenticated users to /login before they ever reach a
 *    serverless function — saves 1-2 cold-start round trips per session.
 * 3. Redirects already-authenticated users away from /login and /signup.
 *
 * Uses getSession() (local cookie read) instead of getUser() (network call)
 * so the middleware itself adds no extra latency.
 */
export async function middleware(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getSession() reads the JWT from the cookie locally — no network call.
  // Server Components / Actions still call getUser() / getClaims() for
  // cryptographic verification; this check is only for routing decisions.
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  if (!session && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
