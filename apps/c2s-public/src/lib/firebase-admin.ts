import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

// Server-only Firebase Admin SDK singleton.
//
// Lazily initialized so importing this module during Next.js boot / middleware
// graph analysis does not call initializeApp() before Cloud Run ADC is ready.
// Credential resolution: GOOGLE_APPLICATION_CREDENTIALS (service-account JSON)
// when set, otherwise Application Default Credentials (App Hosting / Cloud Run).

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const serviceAccount = JSON.parse(readFileSync(resolve(credentialsPath), 'utf-8'));
    return initializeApp({ credential: cert(serviceAccount) });
  }

  // Prefer an explicit project id when ADC has no project (local / some CI).
  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return projectId ? initializeApp({ projectId }) : initializeApp();
}

let _auth: Auth | undefined;
let _firestore: Firestore | undefined;
let _storage: Storage | undefined;

export const firebaseAdminAuth: Auth = new Proxy({} as Auth, {
  get(_t, prop, receiver) {
    if (!_auth) _auth = getAuth(getAdminApp());
    const value = Reflect.get(_auth as object, prop, receiver);
    return typeof value === 'function' ? (value as Function).bind(_auth) : value;
  },
});

export const firebaseAdminFirestore: Firestore = new Proxy({} as Firestore, {
  get(_t, prop, receiver) {
    if (!_firestore) _firestore = getFirestore(getAdminApp());
    const value = Reflect.get(_firestore as object, prop, receiver);
    return typeof value === 'function' ? (value as Function).bind(_firestore) : value;
  },
});

export const firebaseAdminStorage: Storage = new Proxy({} as Storage, {
  get(_t, prop, receiver) {
    if (!_storage) _storage = getStorage(getAdminApp());
    const value = Reflect.get(_storage as object, prop, receiver);
    return typeof value === 'function' ? (value as Function).bind(_storage) : value;
  },
});
