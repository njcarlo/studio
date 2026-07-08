import { cache } from 'react';
import { cookies } from 'next/headers';
import { firebaseAdminAuth } from './firebase-admin';

// Firebase equivalent of the old lib/supabase-server.ts. Session state lives
// in an httpOnly cookie holding a Firebase session cookie (not a raw ID
// token — session cookies support revocation checks and a longer lifetime,
// matching how the Supabase SSR cookie flow behaved).
//
// The cookie itself is minted by POST /api/auth/session after client-side
// sign-in (Firebase's web SDK only manages tokens in IndexedDB/memory, it
// has no cookie of its own — unlike @supabase/ssr).
export const SESSION_COOKIE_NAME = 'fb_session';
export const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Resolves the current authenticated user's identity from the request's
 * session cookie. Wrapped in React's `cache()` so every `requirePermission`/
 * action call in a request chain reuses the same result.
 *
 * Returns the same `{ id, email }` shape as the old Supabase-backed
 * `getServerUser()` so `require-permission.ts` / `with-permission.ts` need
 * no changes beyond their import path.
 */
export const getServerUser = cache(async (): Promise<{ id: string; email: string } | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
    if (!decoded.email) return null;
    return { id: decoded.uid, email: decoded.email };
  } catch {
    // Expired/revoked/invalid cookie — treat as signed out.
    return null;
  }
});
