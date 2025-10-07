import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

export function getFirebaseApp() {
  if (!getApps().length) {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase no está configurado. Define las variables NEXT_PUBLIC_FIREBASE_*"
      );
    }
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getFirebaseServices() {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
}

export async function ensureAuth(initialToken?: string) {
  if (!isFirebaseConfigured) {
    console.warn("Firebase no configurado; se omite autenticación.");
    return;
  }
  try {
    const { auth } = getFirebaseServices();
    if (initialToken) {
      await signInWithCustomToken(auth, initialToken);
    } else {
      await signInAnonymously(auth);
    }
  } catch (e) {
    console.error("Fallo autenticación Firebase:", e);
  }
}
