import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDV_fIoV4Bj3TsuURGmTJMFzTSKYru3AgQ",
  authDomain: "alphabet-royale-3d-ec26a.firebaseapp.com",
  projectId: "alphabet-royale-3d-ec26a",
  storageBucket: "alphabet-royale-3d-ec26a.firebasestorage.app",
  messagingSenderId: "840283095393",
  appId: "1:840283095393:web:f5f18f344b11f8e7554520",
  measurementId: "G-LQKTRT1B2B"
};

// Initialize Firebase safely (prevents duplicate app initialization on hot-reloading)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const analytics: Analytics | null =
  typeof window !== 'undefined' ? getAnalytics(app) : null;

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signInAnonymously, onAuthStateChanged, signOut };
export type { User };

export interface UserProfileData {
  coins: number;
  level: number;
  equippedDeck: string;
  selectedDeckId?: string;
  xp?: number;
  selectedTableId?: string;
  selectedAvatarId?: string;
  playerName?: string;
  email?: string | null;
  isAnonymous?: boolean;
  lastLoginAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Sync user profile to Firestore `users/{uid}`.
 */
export async function syncUserProfileToFirestore(
  uid: string,
  profile: Partial<UserProfileData>
): Promise<void> {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const dataToSave: Record<string, unknown> = {
      ...profile,
      updatedAt: serverTimestamp(),
    };
    if (profile.equippedDeck && !profile.selectedDeckId) {
      dataToSave.selectedDeckId = profile.equippedDeck;
    } else if (profile.selectedDeckId && !profile.equippedDeck) {
      dataToSave.equippedDeck = profile.selectedDeckId;
    }
    await setDoc(userRef, dataToSave, { merge: true });
  } catch (err) {
    console.warn('Firestore sync error:', err);
  }
}

/**
 * Fetch user profile from Firestore `users/{uid}`.
 */
export async function fetchUserProfileFromFirestore(
  uid: string
): Promise<UserProfileData | null> {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfileData;
      // Normalise equippedDeck <-> selectedDeckId
      if (data.equippedDeck && !data.selectedDeckId) {
        data.selectedDeckId = data.equippedDeck;
      } else if (data.selectedDeckId && !data.equippedDeck) {
        data.equippedDeck = data.selectedDeckId;
      }
      return data;
    }
  } catch (err) {
    console.warn('Firestore fetch error:', err);
  }
  return null;
}
