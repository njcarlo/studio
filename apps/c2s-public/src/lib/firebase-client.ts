import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';

// Browser Firebase Auth singleton. C2S only needs auth — Firestore/Storage stay
// in apps/web. Lazily initialized so `next build` can import client modules
// without a real API key present in the build environment.

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _auth: Auth | undefined;
let emulatorConnected = false;

export function firebaseAuth(): Auth {
    if (!_auth) {
        const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        _auth = getAuth(app);
        if (
            typeof window !== 'undefined' &&
            process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true' &&
            !emulatorConnected
        ) {
            emulatorConnected = true;
            const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
            connectAuthEmulator(_auth, `http://${host}:9099`, { disableWarnings: true });
        }
    }
    return _auth;
}
