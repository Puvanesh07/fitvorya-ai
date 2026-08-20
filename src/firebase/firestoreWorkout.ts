import {
  collection, addDoc, getDoc, getDocs, doc,
  setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { WorkoutSession, PersonalRecord } from '../types/workout'

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
  // No orderBy — fetch all, sort client-side (avoids composite index)
  const snap = await getDocs(ref)
  const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutSession))
  return sessions
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
    .slice(0, 50)
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
  // Fetch all, filter client-side (avoids range query index)
  const snap = await getDocs(ref)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const map = new Map<string, number>()
  snap.docs.forEach(d => {
    const date = (d.data() as WorkoutSession).date
    if (date && date >= cutoffStr) {
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
