import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp, query, orderBy, limit,
} from 'firebase/firestore'
import { db } from './config'
import type { Measurement } from '../types/progress'

export async function addMeasurement(
  uid: string,
  entry: Omit<Measurement, 'id' | 'createdAt'>,
): Promise<string> {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entry)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v
  }
  clean.createdAt = serverTimestamp()
  const ref    = collection(db, 'users', uid, 'measurements')
  const docRef = await addDoc(ref, clean)
  return docRef.id
}

export async function getMeasurements(uid: string): Promise<Measurement[]> {
  const ref  = collection(db, 'users', uid, 'measurements')
  // Push sort + cap to Firestore — avoids full collection scan.
  // Single-field index on `date` DESC (auto-created by Firestore).
  const q    = query(ref, orderBy('date', 'desc'), limit(200))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      ...data,
      id:        d.id,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString() : '',
    } as Measurement
  })
  // Already sorted desc by the query — no client-side sort needed
}

export async function updateMeasurement(
  uid: string,
  id: string,
  updates: Partial<Measurement>,
): Promise<void> {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) clean[k] = v
  }
  await updateDoc(doc(db, 'users', uid, 'measurements', id), clean)
}

export async function deleteMeasurement(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'measurements', id))
}
