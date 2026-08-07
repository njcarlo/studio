import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Server-only Firebase Admin SDK singleton. Not wired into any auth/data
// flow yet — Phase 0 scaffolding only (migration plan §11). Auth cutover
// happens in Phase 1.
//
// Credential resolution: uses GOOGLE_APPLICATION_CREDENTIALS (service
// account JSON path) when set, otherwise falls back to Application Default
// Credentials (preferred once running on Google Cloud infra — see plan §9).
//
// Lazy-initialized so module import never fails during `next build` static
// analysis — getAdminApp() is only called at request time.

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    // Reading + JSON.parse instead of require() — a dynamic require() path
    // can't be statically resolved by Turbopack/webpack at build time.
    const serviceAccount = JSON.parse(readFileSync(resolve(credentialsPath), 'utf-8'));
    return initializeApp({ credential: cert(serviceAccount) });
  }

  return initializeApp();
}

// Proxy-based lazy accessor: each property read on the exported object delegates
// to the real Firebase Admin service instance, which is only created on first
// access (at request time, never at module-import / next-build time).
// Callers keep the same `firebaseAdminAuth.verifyIdToken(...)` call-site syntax.
function lazyService<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_, key: string | symbol) {
      const svc = factory();
      const val = (svc as Record<string | symbol, unknown>)[key];
      return typeof val === 'function' ? (val as Function).bind(svc) : val;
    },
  });
}

export const firebaseAdminAuth = lazyService(() => getAuth(getAdminApp()));
export const firebaseAdminFirestore = lazyService(() => getFirestore(getAdminApp()));
export const firebaseAdminStorage = lazyService(() => getStorage(getAdminApp()));
