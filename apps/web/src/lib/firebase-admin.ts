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

const adminApp = getAdminApp();

export const firebaseAdminAuth = getAuth(adminApp);
export const firebaseAdminFirestore = getFirestore(adminApp);
export const firebaseAdminStorage = getStorage(adminApp);
