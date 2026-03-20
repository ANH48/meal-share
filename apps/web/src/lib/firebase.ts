import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

function getApp() {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  try {
    const app = getApp();
    return app ? getMessaging(app) : null;
  } catch {
    return null;
  }
}

export function getFirebaseDatabase(): Database | null {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.databaseURL) return null;
  try {
    const app = getApp();
    return app ? getDatabase(app) : null;
  } catch {
    return null;
  }
}
