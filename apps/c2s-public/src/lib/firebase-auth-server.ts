import { cache } from 'react';
import { cookies } from 'next/headers';
import { firebaseAdminAuth } from './firebase-admin';

// Same `fb_session` httpOnly cookie apps/web mints. Both apps sit under
// *.cogdasma.app, so a worker signed in to Studio is signed in here too.
export const SESSION_COOKIE_NAME = 'fb_session';
export const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/** Current user from the session cookie, or null when signed out. */
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
