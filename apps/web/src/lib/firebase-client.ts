import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Browser Firebase SDK singleton — replaces packages/database's
// supabase-client.ts / SupabaseProvider as of the Phase 1 auth cutover
// (migration plan §11).

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseFirestore = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

// Local development against the Firebase Emulator Suite. Opt-in via
// NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true so production builds never touch it.
// Unlike the Admin SDK (which auto-detects *_EMULATOR_HOST env vars), the web
// SDK must be pointed at the emulators explicitly. Guarded so Fast Refresh
// re-evaluation doesn't throw "emulator already connected".
if (
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true'
) {
  const g = globalThis as unknown as { __fbEmulatorsConnected?: boolean };
  if (!g.__fbEmulatorsConnected) {
    g.__fbEmulatorsConnected = true;
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
    connectAuthEmulator(firebaseAuth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(firebaseFirestore, host, 8080);
    connectStorageEmulator(firebaseStorage, host, 9199);
  }
}
