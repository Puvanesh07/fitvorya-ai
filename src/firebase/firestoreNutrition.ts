import {
  collection, addDoc, getDocs, deleteDoc, doc, query,
  where, orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { MealEntry, WaterEntry } from '../types/nutrition'

// ── Meal entries ──────────────────────────────────────────────────────────────

export async function addMealEntry(
  uid: string,
  entry: Omit<MealEntry, 'id' | 'loggedAt'>,
): Promise<string> {
  const cleanFoodItem: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entry.foodItem)) {
    if (v !== undefined) cleanFoodItem[k] = v
  }
  const ref    = collection(db, 'users', uid, 'meals')
  const docRef = await addDoc(ref, {
    foodItem: cleanFoodItem,
    grams:    entry.grams,
    meal:     entry.meal,
    date:     entry.date,
    loggedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getMealEntriesForDate(
  uid: string,
  date: string,
): Promise<MealEntry[]> {
  const ref = collection(db, 'users', uid, 'meals')

  // Try the composite index query first (date + loggedAt).
  // If the index is still building, fall back to a simple equality filter
  // and sort client-side — so the app always works.
  const tryIndexed = async (): Promise<MealEntry[]> => {
    const q    = query(ref, where('date', '==', date), orderBy('loggedAt', 'asc'), limit(200))
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return {
        id:       d.id,
        foodItem: data.foodItem,
        grams:    data.grams,
        meal:     data.meal,
        date:     data.date,
        loggedAt: data.loggedAt instanceof Timestamp ? data.loggedAt.toDate().toISOString() : '',
      } as MealEntry
    })
  }

  const fallback = async (): Promise<MealEntry[]> => {
    const q    = query(ref, where('date', '==', date), limit(200))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => {
        const data = d.data()
        return {
          id:       d.id,
          foodItem: data.foodItem,
          grams:    data.grams,
          meal:     data.meal,
          date:     data.date,
          loggedAt: data.loggedAt instanceof Timestamp ? data.loggedAt.toDate().toISOString() : '',
        } as MealEntry
      })
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
  }

  try {
    return await tryIndexed()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    // Index building or missing — use fallback query + client-side sort
    if (msg.includes('index') || msg.includes('FAILED_PRECONDITION')) {
      return fallback()
    }
    throw err
  }
}

export async function getMealEntriesForRange(
  uid: string,
  startDate: string,
  endDate: string,
): Promise<MealEntry[]> {
  const ref = collection(db, 'users', uid, 'meals')
  // Range on `date` + orderBy same field — handled by single-field auto-index.
  // Cap at 500 to bound read cost.
  const q    = query(
    ref,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
    limit(500),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id:       d.id,
      foodItem: data.foodItem,
      grams:    data.grams,
      meal:     data.meal,
      date:     data.date,
      loggedAt: data.loggedAt instanceof Timestamp ? data.loggedAt.toDate().toISOString() : '',
    } as MealEntry
  })
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
  const ref    = collection(db, 'users', uid, 'water')
  const docRef = await addDoc(ref, { amount, date, loggedAt: serverTimestamp() })
  return docRef.id
}

export async function getWaterEntriesForDate(
  uid: string,
  date: string,
): Promise<WaterEntry[]> {
  const ref = collection(db, 'users', uid, 'water')

  const tryIndexed = async (): Promise<WaterEntry[]> => {
    const q    = query(ref, where('date', '==', date), orderBy('loggedAt', 'asc'), limit(100))
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return {
        id:       d.id,
        amount:   data.amount,
        date:     data.date,
        loggedAt: data.loggedAt instanceof Timestamp ? data.loggedAt.toDate().toISOString() : '',
      } as WaterEntry
    })
  }

  const fallback = async (): Promise<WaterEntry[]> => {
    const q    = query(ref, where('date', '==', date), limit(100))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => {
        const data = d.data()
        return {
          id:       d.id,
          amount:   data.amount,
          date:     data.date,
          loggedAt: data.loggedAt instanceof Timestamp ? data.loggedAt.toDate().toISOString() : '',
        } as WaterEntry
      })
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
  }

  try {
    return await tryIndexed()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('index') || msg.includes('FAILED_PRECONDITION')) {
      return fallback()
    }
    throw err
  }
}

export async function deleteWaterEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'water', entryId))
}
