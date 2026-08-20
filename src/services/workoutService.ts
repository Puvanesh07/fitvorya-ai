import type { WorkoutSession, PersonalRecord, SessionExercise } from '../types/workout'
import { epley1RM } from '../types/workout'
import {
  saveWorkoutSession, getWorkoutSessions, getWorkoutSession,
  deleteWorkoutSession, getSessionsForHeatmap,
  getPersonalRecord, savePersonalRecord, getPersonalRecords,
} from '../firebase/firestoreWorkout'
import { todayISO as _todayISO } from '../utils/format'

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function finishWorkout(
  uid: string,
  session: Omit<WorkoutSession, 'id'>,
): Promise<{ sessionId: string; newPRs: PersonalRecord[] }> {
  // Save session
  const sessionId = await saveWorkoutSession(uid, session)

  // Detect PRs
  const newPRs: PersonalRecord[] = []
  for (const ex of session.exercises) {
    const completedSets = ex.sets.filter(s => s.completed && s.weightKg > 0 && s.reps > 0)
    if (completedSets.length === 0) continue

    // Find best 1RM equivalent in this session
    const best = completedSets.reduce((prev, cur) => {
      const cur1RM  = epley1RM(cur.weightKg, cur.reps)
      const prev1RM = epley1RM(prev.weightKg, prev.reps)
      return cur1RM > prev1RM ? cur : prev
    })

    const new1RM = epley1RM(best.weightKg, best.reps)
    const existing = await getPersonalRecord(uid, ex.exerciseId)

    if (!existing || new1RM > existing.oneRepMaxKg) {
      const pr: PersonalRecord = {
        exerciseId:   ex.exerciseId,
        exerciseName: ex.exerciseName,
        weightKg:     best.weightKg,
        reps:         best.reps,
        oneRepMaxKg:  new1RM,
        achievedAt:   new Date().toISOString(),
        sessionId,
      }
      await savePersonalRecord(uid, pr)
      newPRs.push(pr)
    }
  }

  return { sessionId, newPRs }
}

export async function fetchWorkoutHistory(uid: string): Promise<WorkoutSession[]> {
  return getWorkoutSessions(uid)
}

export async function fetchWorkoutSession(uid: string, id: string): Promise<WorkoutSession | null> {
  return getWorkoutSession(uid, id)
}

export async function removeWorkout(uid: string, id: string): Promise<void> {
  return deleteWorkoutSession(uid, id)
}

export async function fetchHeatmap(uid: string) {
  return getSessionsForHeatmap(uid)
}

// ── Personal Records ──────────────────────────────────────────────────────────

export async function fetchPersonalRecords(uid: string): Promise<PersonalRecord[]> {
  return getPersonalRecords(uid)
}

// ── Volume helpers ────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function sessionVolume(exercises: SessionExercise[]): number {
  return Math.round(
    exercises.reduce((total, ex) =>
      total + ex.sets
        .filter(s => s.completed)
        .reduce((s, set) => s + set.weightKg * set.reps, 0),
    0)
  )
}
