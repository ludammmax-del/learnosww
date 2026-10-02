import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  type Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  signInAnonymously, 
  onAuthStateChanged as fbOnAuthStateChanged,
  type User,
  type Auth,
  type Unsubscribe
} from 'firebase/auth';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '';
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
const rawAppId = import.meta.env.VITE_FIREBASE_APP_ID || '';

export const isFirebaseConfigured = Boolean(
  rawApiKey && 
  rawApiKey.length > 8 && 
  !rawApiKey.includes('MY_') && 
  rawProjectId && 
  !rawProjectId.includes('MY_')
);

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? rawApiKey : 'AIzaSyDemoDummyApiKeyForOfflineFallback123',
  authDomain: rawAuthDomain || 'demo-project.firebaseapp.com',
  projectId: rawProjectId || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: rawAppId || '1:1234567890:web:abcdef123456',
};

let app: FirebaseApp | null = null;
let realAuth: Auth | null = null;
let realDb: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    realAuth = getAuth(app);
    const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
    realDb = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
  } catch (initErr) {
    console.warn('[Firebase] Initialization error, enabling offline fallback mode:', initErr);
  }
}

// In-memory / localStorage fallback user management
const authSubscribers = new Set<(user: any) => void>();

function getStoredFallbackUser(): any {
  try {
    const raw = localStorage.getItem('learning_os_auth_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

let fallbackCurrentUser: any = getStoredFallbackUser();

function notifyAuthSubscribers(user: any) {
  fallbackCurrentUser = user;
  authSubscribers.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.warn('[Firebase Fallback Auth] Subscriber error:', e);
    }
  });
}

// Fallback Auth shim matching Firebase Auth interface
export const auth: any = realAuth || {
  get currentUser() {
    return fallbackCurrentUser;
  },
  name: 'LearningOS-Fallback-Auth',
};

export const db: any = realDb || ({} as Firestore);
export const googleProvider = new GoogleAuthProvider();

export async function testConnection() {
  if (!isFirebaseConfigured || !realDb) {
    console.log('Firebase running in local demo mode (no cloud config required).');
    return;
  }

  try {
    await getDocFromServer(doc(realDb, 'test', 'connection'));
    console.log('Firebase connection verified.');
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline or restricted in iframe.');
    } else {
      console.log('Firebase initial ping test:', error?.message || error);
    }
  }
}

// Auth helpers
export async function loginWithGoogle(): Promise<any> {
  if (isFirebaseConfigured && realAuth) {
    try {
      const result = await signInWithPopup(realAuth, googleProvider);
      return result.user;
    } catch (err: any) {
      console.warn('Popup login error or restricted in iframe, falling back to local guest user:', err);
    }
  }

  // Graceful fallback for demo or when Google popup is blocked
  const mockUser = {
    uid: 'google-user-' + Math.random().toString(36).substring(2, 10),
    displayName: 'Инженер Learning OS',
    email: 'engineer@learning-os.internal',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  };
  try {
    localStorage.setItem('learning_os_auth_user', JSON.stringify(mockUser));
  } catch {}
  notifyAuthSubscribers(mockUser);
  return mockUser;
}

export async function loginAsGuest(): Promise<any> {
  if (isFirebaseConfigured && realAuth) {
    try {
      const result = await signInAnonymously(realAuth);
      return result.user;
    } catch (err) {
      console.warn('Anonymous sign-in to Firebase failed, using local guest fallback:', err);
    }
  }

  const guestUser = {
    uid: 'guest-' + Math.random().toString(36).substring(2, 10),
    displayName: 'Студент',
    email: 'guest@learning-os.internal',
    photoURL: undefined,
  };
  try {
    localStorage.setItem('learning_os_auth_user', JSON.stringify(guestUser));
  } catch {}
  notifyAuthSubscribers(guestUser);
  return guestUser;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && realAuth) {
    try {
      await fbSignOut(realAuth);
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
  }
  try {
    localStorage.removeItem('learning_os_auth_user');
  } catch {}
  notifyAuthSubscribers(null);
}

export function onAuthStateChanged(
  authInstance: any, 
  nextOrObserver: (user: any) => void, 
  error?: (error: any) => void
): Unsubscribe {
  if (isFirebaseConfigured && realAuth && authInstance === realAuth) {
    try {
      return fbOnAuthStateChanged(realAuth, nextOrObserver, error);
    } catch (err) {
      console.warn('[Firebase Auth] onAuthStateChanged failed, falling back to local subscriber:', err);
    }
  }

  authSubscribers.add(nextOrObserver);
  // Emit current state immediately
  try {
    nextOrObserver(fallbackCurrentUser);
  } catch (e) {
    if (error) error(e);
  }

  return () => {
    authSubscribers.delete(nextOrObserver);
  };
}

export { collection, setDoc, getDoc, getDocs, doc, query, where, onSnapshot };
export type { User };
