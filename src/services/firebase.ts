import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app using configuration from firebase-applet-config.json
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services with the provisioned firestoreDatabaseId
export const auth = getAuth(app);
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const storage = getStorage(app);

// Aliases for convenience across modules
export const db = firestore;

// Export Firestore methods from the SDK instance module for direct application context consumption
export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

// Export helper to strip undefined values so setDoc/updateDoc never fails on Firestore
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

export { app, firebaseConfig };
export default app;
