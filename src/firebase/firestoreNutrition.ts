import {
  collection, addDoc, getDocs, deleteDoc, doc, query,
  where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { MealEntry, WaterEntry } from '../types/nutrition'

// ── Meal entries ──────────────────────────────────────────────────────────────

export async function addMealEntry(
  uid: string,
  entry: Omit<MealEntry, 'id' | 'loggedAt'>,
): Promise<string> {
  // Strip undefined fields from foodItem to avoid Firestore rejection
  const cleanFoodItem: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entry.foodItem)) {
    if (v !== undefined) cleanFoodItem[k] = v
  }

  const ref = collection(db, 'users', uid, 'meals')
  const docRef = await addDoc(ref, {
    foodItem: cleanFoodItem,
    grams: entry.grams,
    meal: entry.meal,
    date: entry.date,
    loggedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getMealEntriesForDate(
  uid: string,
  date: string,
): Promise<MealEntry[]> {
  const ref = collection(db, 'users', uid, 'meals')
  // Single-field equality — no composite index needed
  const q = query(ref, where('date', '==', date))
  const snap = await getDocs(q)
  const results = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      foodItem: data.foodItem,
      grams: data.grams,
      meal: data.meal,
      date: data.date,
      loggedAt: data.loggedAt instanceof Timestamp
        ? data.loggedAt.toDate().toISOString() : '',
    } as MealEntry
  })
  return results.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
}

export async function getMealEntriesForRange(
  uid: string,
  startDate: string,
  endDate: string,
): Promise<MealEntry[]> {
  const ref = collection(db, 'users', uid, 'meals')
  // Use equality-style queries to avoid composite index requirement.
  // Firestore range queries on a field + orderBy that same field needs an index.
  // Client-side filter is safe here — range is ≤90 days so document count is bounded.
  const q = query(ref, where('date', '>=', startDate), where('date', '<=', endDate))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      foodItem: data.foodItem,
      grams: data.grams,
      meal: data.meal,
      date: data.date,
      loggedAt: data.loggedAt instanceof Timestamp
        ? data.loggedAt.toDate().toISOString() : '',
    } as MealEntry
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export async function deleteMealEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'meals', entryId))
}

// ── Water entries ─────────────────────────────────────────────────────────────

export async function addWaterEntry(
  uid: string,
  amount: number,
  date: string,
): Promise<string> {
  const ref = collection(db, 'users', uid, 'water')
  const docRef = await addDoc(ref, { amount, date, loggedAt: serverTimestamp() })
  return docRef.id
}

export async function getWaterEntriesForDate(
  uid: string,
  date: string,
): Promise<WaterEntry[]> {
  const ref = collection(db, 'users', uid, 'water')
  const q = query(ref, where('date', '==', date))
  const snap = await getDocs(q)
  const results = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      amount: data.amount,
      date: data.date,
      loggedAt: data.loggedAt instanceof Timestamp
        ? data.loggedAt.toDate().toISOString() : '',
    } as WaterEntry
  })
  return results.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
}

export async function deleteWaterEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'water', entryId))
}
