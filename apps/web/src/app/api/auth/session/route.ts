import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';
import { firebaseAdminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_MS } from '@/lib/firebase-auth-server';

// Bridges the Firebase client SDK (which only holds tokens in memory/IndexedDB)
// into an httpOnly session cookie the server can read.

/**
 * Looks up Worker/Role claims at session-cookie creation time and attaches
 * `app_*` claim names so anything already reading them client-side needs no
 * changes. Claims only refresh on the next sign-in/session creation — a role
 * change won't take effect until next login.
 */
async function computeCustomClaims(email: string) {
  const worker = await prisma.worker.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { role: true },
  });
  if (!worker) return null;

  return {
    app_role: worker.role?.name ?? '',
    app_is_super_admin: worker.role?.isSuperAdmin ?? false,
    app_flags: worker.flags ?? [],
    app_major_ministry_id: worker.majorMinistryId ?? null,
    app_minor_ministry_id: worker.minorMinistryId ?? null,
    app_sub_ministry_id: worker.subMinistryId ?? null,
  };
}

export async function POST(request: Request) {
  const { idToken } = await request.json();
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
  }

  try {
    // Recently-signed-in requirement guards against session-fixation via a
    // stolen, stale ID token being exchanged for a long-lived session cookie.
    const decoded = await firebaseAdminAuth.verifyIdToken(idToken, true);

    if (decoded.email) {
      const claims = await computeCustomClaims(decoded.email);
      if (claims) {
        await firebaseAdminAuth.setCustomUserClaims(decoded.uid, claims);
      }
    }

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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message ?? 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
