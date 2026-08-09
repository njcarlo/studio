import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { firebaseAdminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_MS } from '@/lib/firebase-auth-server';

// Always server-render — never statically pre-built (requires live Firebase Admin SDK).
export const dynamic = 'force-dynamic';

// Bridges the Firebase client SDK (which only holds tokens in memory/IndexedDB)
// into the httpOnly session cookie the server reads. Mirrors apps/web's route
// so both apps accept the same cookie.

export async function POST(request: Request) {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
    }

    try {
        // Recently-signed-in requirement guards against session fixation via a
        // stolen, stale ID token being exchanged for a long-lived session cookie.
        await firebaseAdminAuth.verifyIdToken(idToken, true);

        const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_COOKIE_MAX_AGE_MS,
        });

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
}
