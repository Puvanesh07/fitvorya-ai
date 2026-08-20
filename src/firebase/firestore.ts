import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db, auth } from './config'
import type { UserProfile } from '../types/user'
import type { WeightEntry } from '../types/weight'
import { localTodayISO } from '../utils/format'

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

export async function createUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  const ref = doc(db, 'users', uid)
  // Always include uid so it's present when this call creates the document
  // (setDoc merge:true acts as create when doc doesn't exist yet)
  const email = auth.currentUser?.email ?? (updates as Record<string, unknown>).email ?? ''
  await setDoc(ref, {
    ...stripUndefined(updates as Record<string, unknown>),
    uid,
    ...(email ? { email } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/** Remove undefined fields from an object to prevent Firestore errors */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const clean: Partial<T> = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      clean[key] = obj[key]
    }
  }
  return clean
}

// ─── Weight Entries ───────────────────────────────────────────────────────────

export async function addWeightEntry(
  uid: string,
  entry: Omit<WeightEntry, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = collection(db, 'users', uid, 'weights')
  const docRef = await addDoc(ref, {
    ...entry,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getWeightEntries(uid: string): Promise<WeightEntry[]> {
  const ref = collection(db, 'users', uid, 'weights')
  // No orderBy — avoids index requirement. Sort client-side after fetch.
  // limit(365) removed too since orderBy is gone (limit without orderBy fetches arbitrary docs)
  const snap = await getDocs(ref)
  return snap.docs.map((d) => {
    const data = d.data()
    let dateStr = ''
    if (data.date instanceof Timestamp) {
      const ts = data.date.toDate()
      dateStr = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`
    } else if (typeof data.date === 'string' && data.date.length === 10) {
      dateStr = data.date
    } else {
      dateStr = localTodayISO()
    }
    return {
      id: d.id,
      weight: typeof data.weight === 'number' ? data.weight : 0,
      date: dateStr,
      note: data.note ?? '',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '',
    } as WeightEntry
  })
  // Sort newest first client-side
    .filter(w => w.weight > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 365)
}

export async function updateWeightEntry(
  uid: string,
  entryId: string,
  updates: Partial<Pick<WeightEntry, 'weight' | 'date' | 'note'>>,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'weights', entryId)
  await updateDoc(ref, updates)
}

export async function deleteWeightEntry(
  uid: string,
  entryId: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'weights', entryId)
  await deleteDoc(ref)
}
