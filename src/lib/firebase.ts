import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import localConfig from '@/firebase-applet-config.json';

// Prioritize environment variables for Netlify/Production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || localConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId
};

// Singleton-safe App initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Singleton-safe Firestore initialization with connectivity hardening
const getSafeFirestore = () => {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, databaseId);
  } catch (e) {
    return getFirestore(app, databaseId);
  }
};

// Singleton-safe Auth initialization
// Using getAuth(app) is safer and less prone to auth/argument-error than initializeAuth
// and it still maintains singleton behavior correctly in modular SDK
const getSafeAuth = () => {
  try {
    return getAuth(app);
  } catch (e) {
    console.error("Firebase Auth initialization failed:", e);
    throw e;
  }
};

export const auth = getSafeAuth();
export const db = getSafeFirestore();
export const googleProvider = new GoogleAuthProvider();
