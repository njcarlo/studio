import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

// Browser Firebase SDK singleton (auth, Firestore, Storage).
// Lazily initialized so `next build` SSG/prerender can import client modules
// without a real API key present in the build environment.

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let emulatorsConnected = false;

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

function connectEmulatorsIfNeeded(auth: Auth, firestore: Firestore, storage: FirebaseStorage) {
  // Local development against the Firebase Emulator Suite. Opt-in via
  // NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true so production builds never touch it.
  if (
    typeof window === 'undefined' ||
    process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR !== 'true' ||
    emulatorsConnected
  ) {
    return;
  }
  emulatorsConnected = true;
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(firestore, host, 8080);
  connectStorageEmulator(storage, host, 9199);
}

let _auth: Auth | undefined;
let _firestore: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

function ensureServices(): { auth: Auth; firestore: Firestore; storage: FirebaseStorage } {
  if (!_auth || !_firestore || !_storage) {
    const app = getFirebaseApp();
    _auth = _auth ?? getAuth(app);
    _firestore = _firestore ?? getFirestore(app);
    _storage = _storage ?? getStorage(app);
    connectEmulatorsIfNeeded(_auth, _firestore, _storage);
  }
  return { auth: _auth, firestore: _firestore, storage: _storage };
}

function lazyService<T extends object>(pick: (s: ReturnType<typeof ensureServices>) => T): T {
  let instance: T | undefined;
  return new Proxy({} as T, {
    get(_target, prop) {
      if (!instance) instance = pick(ensureServices());
      const value = Reflect.get(instance as object, prop);
      return typeof value === 'function' ? (value as Function).bind(instance) : value;
    },
    set(_target, prop, value) {
      if (!instance) instance = pick(ensureServices());
      Reflect.set(instance as object, prop, value);
      return true;
    },
  });
}

export const firebaseAuth: Auth = lazyService((s) => s.auth);
export const firebaseFirestore: Firestore = lazyService((s) => s.firestore);
export const firebaseStorage: FirebaseStorage = lazyService((s) => s.storage);
