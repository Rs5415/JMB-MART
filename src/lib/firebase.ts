import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import localConfig from '@/firebase-applet-config.json';

// Robustly merge configuration with strict truthiness checks
const getEnvVar = (key: string) => {
  const value = import.meta.env[key];
  return (value && value !== 'undefined' && value !== 'null' && value !== '') ? value : null;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || localConfig.apiKey,
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || localConfig.authDomain,
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || localConfig.projectId,
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || localConfig.storageBucket,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || localConfig.messagingSenderId,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || localConfig.appId,
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID') || localConfig.measurementId,
  firestoreDatabaseId: getEnvVar('VITE_FIREBASE_DATABASE_ID') || localConfig.firestoreDatabaseId
};

// Fail fast if API key is clearly missing
if (!firebaseConfig.apiKey) {
  console.error("CRITICAL: Firebase API Key is missing! Check firebase-applet-config.json or Secrets.");
}

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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed:', JSON.stringify(errInfo));
  
  // Create a user friendly message based on common errors
  let userMessage = "Action failed. Please check your connection.";
  if (errInfo.error.includes("insufficient permissions")) {
    userMessage = "Access Denied: You don't have permission to perform this action.";
  } else if (errInfo.error.includes("offline")) {
    userMessage = "Network Error: You appear to be offline.";
  }
  
  alert(userMessage);
  throw new Error(JSON.stringify(errInfo));
}
