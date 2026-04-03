import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "dummy_api_key",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-project.firebaseapp.com",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-project.appspot.com",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:123:web:abc"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadItemPhoto = async (file: File): Promise<string> => {
  if (firebaseConfig.apiKey === "dummy_api_key") {
    // Return a mock placeholder if no real config
    console.warn("Using mock Firebase configuration. Image will not be actually uploaded.");
    return URL.createObjectURL(file);
  }

  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const path = `inventory/items/${timestamp}.${fileExt}`;
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};
