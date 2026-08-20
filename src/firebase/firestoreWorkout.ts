import {
  collection, addDoc, getDoc, getDocs, doc,
  setDoc, deleteDoc, serverTimestamp, query, orderBy, limit, where,
} from 'firebase/firestore'
import { db } from './config'
import type { WorkoutSession, PersonalRecord } from '../types/workout'
import { localTodayISO, dateToISO } from '../utils/format'

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function saveWorkoutSession(
  uid: string,
  session: Omit<WorkoutSession, 'id'>,
): Promise<string> {
  const ref = collection(db, 'users', uid, 'workouts')
  // Strip undefined — Firestore rejects undefined field values
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(session)) {
    if (v !== undefined) clean[k] = v
  }
  clean.savedAt = serverTimestamp()
  const docRef = await addDoc(ref, clean)
  return docRef.id
}

export async function getWorkoutSessions(uid: string): Promise<WorkoutSession[]> {
  const ref = collection(db, 'users', uid, 'workouts')
  // Order by startedAt desc, cap at 50 — avoids full collection scan
  const q = query(ref, orderBy('startedAt', 'desc'), limit(50))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    const dateStr = typeof data.date === 'string' ? data.date : localTodayISO()
    return { id: d.id, ...data, date: dateStr } as WorkoutSession
  })
}

export async function getWorkoutSession(uid: string, sessionId: string): Promise<WorkoutSession | null> {
  const ref = doc(db, 'users', uid, 'workouts', sessionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as WorkoutSession
}

export async function deleteWorkoutSession(uid: string, sessionId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'workouts', sessionId))
}

export async function getSessionsForHeatmap(uid: string): Promise<{ date: string; count: number }[]> {
  const ref = collection(db, 'users', uid, 'workouts')
  // Use local timezone for cutoff, and push filtering into the query
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)
  const cutoffStr = dateToISO(cutoff) // local-timezone safe
  const q = query(ref, where('date', '>=', cutoffStr))
  const snap = await getDocs(q)
  const map = new Map<string, number>()
  snap.docs.forEach(d => {
    const date = (d.data() as WorkoutSession).date
    if (typeof date === 'string' && date >= cutoffStr) {
      map.set(date, (map.get(date) ?? 0) + 1)
    }
  })
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
}

// ── Personal Records ──────────────────────────────────────────────────────────

export async function getPersonalRecords(uid: string): Promise<PersonalRecord[]> {
  const ref = collection(db, 'users', uid, 'personalRecords')
  const snap = await getDocs(ref)
  return snap.docs.map(d => d.data() as PersonalRecord)
}

export async function getPersonalRecord(uid: string, exerciseId: string): Promise<PersonalRecord | null> {
  const ref = doc(db, 'users', uid, 'personalRecords', exerciseId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as PersonalRecord
}

export async function savePersonalRecord(uid: string, pr: PersonalRecord): Promise<void> {
  const ref = doc(db, 'users', uid, 'personalRecords', pr.exerciseId)
  await setDoc(ref, pr)
}
