import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

// Singleton-safe App initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Singleton-safe Firestore initialization with connectivity hardening
const getSafeFirestore = () => {
  try {
    // Attempt to initialize with specific settings for proxied/sandboxed environments
    // We use experimentalForceLongPolling to overcome WebSocket restrictions which often cause 'code=unavailable'
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    // If already initialized (e.g. during HMR), use the existing instance
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
