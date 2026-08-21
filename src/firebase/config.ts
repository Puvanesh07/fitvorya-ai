import { initializeApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// ── Persistent local cache ────────────────────────────────────────────────────
// Enables IndexedDB-backed offline persistence with multi-tab support.
// First visit: reads from Firestore network. Every subsequent visit: cache
// serves data immediately, then Firestore updates in the background.
// This makes repeat loads feel near-instant.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// ── Auth session persistence ──────────────────────────────────────────────────
// Explicitly keep the user signed in across browser restarts via localStorage.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Non-fatal — SDK falls back gracefully if localStorage is unavailable
})

export default app
