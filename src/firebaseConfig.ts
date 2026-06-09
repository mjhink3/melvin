/**
 * Firebase config -- works in both Node (server) and browser (client)
 * Firestore only. Auth lives in firebaseClient.ts (browser only).
 */
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

function getEnv(key: string): string {
  // Node / server context
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Browser / Vite context
  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key] as string;
  }
  return "";
}

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);