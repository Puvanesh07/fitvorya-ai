import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { Measurement } from '../types/progress'

export async function addMeasurement(
  uid: string,
  entry: Omit<Measurement, 'id' | 'createdAt'>,
): Promise<string> {
  // Strip undefined fields — Firestore rejects them
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entry)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v
  }
  clean.createdAt = serverTimestamp()
  const ref = collection(db, 'users', uid, 'measurements')
  const docRef = await addDoc(ref, clean)
  return docRef.id
}

export async function getMeasurements(uid: string): Promise<Measurement[]> {
  const ref = collection(db, 'users', uid, 'measurements')
  const snap = await getDocs(ref)
  const results = snap.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString() : '',
    } as Measurement
  })
  return results.sort((a, b) => b.date.localeCompare(a.date))
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
