import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { UserProfile } from '../types/user'
import type { WeightEntry } from '../types/weight'

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
  
  // Check if document exists, create if missing
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    // Create document with updates
    await setDoc(ref, {
      ...stripUndefined(updates),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return
  }
  
  // Strip undefined fields to prevent Firestore error
  const cleanUpdates = stripUndefined(updates)
  await updateDoc(ref, {
    ...cleanUpdates,
    updatedAt: serverTimestamp(),
  })
}

/** Remove undefined fields from an object to prevent Firestore errors */
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: any = {}
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
  const q = query(ref, orderBy('date', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      weight: data.weight,
      date: data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : data.date,
      note: data.note ?? '',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '',
    } as WeightEntry
  })
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
