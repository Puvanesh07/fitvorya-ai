import {
  addMeasurement, getMeasurements, updateMeasurement, deleteMeasurement,
} from '../firebase/firestoreMeasurements'
import { fetchWeightHistory } from './weightService'
import { fetchWorkoutHistory } from './workoutService'
import { fetchPersonalRecords } from './workoutService'
import type { Measurement, StreakData } from '../types/progress'
import { computeBadges } from '../types/progress'
import type { Badge } from '../types/progress'
import { todayISO } from '../utils/format'

// ── Measurements ──────────────────────────────────────────────────────────────

export async function saveMeasurement(
  uid: string,
  entry: Omit<Measurement, 'id' | 'createdAt'>,
): Promise<string> {
  return addMeasurement(uid, entry)
}

export async function fetchMeasurements(uid: string): Promise<Measurement[]> {
  return getMeasurements(uid)
}

export async function editMeasurement(
  uid: string, id: string, updates: Partial<Measurement>,
): Promise<void> {
  return updateMeasurement(uid, id, updates)
}

export async function removeMeasurement(uid: string, id: string): Promise<void> {
  return deleteMeasurement(uid, id)
}

// ── Streak calculation ────────────────────────────────────────────────────────
// A "active day" = any day where the user logged weight, a workout, or a meal.

export function calculateStreak(activeDates: string[]): StreakData {
  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActiveDate: '', activeDates: [] }
  }

  const sorted = [...new Set(activeDates)].sort()
  const today = todayISO()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Calculate current streak
  let currentStreak = 0
  const lastDate = sorted[sorted.length - 1]

  // Streak is active only if last activity was today or yesterday
  if (lastDate === today || lastDate === yesterdayStr) {
    let checkDate = new Date(lastDate)
    for (let i = sorted.length - 1; i >= 0; i--) {
      const expectedDate = checkDate.toISOString().split('T')[0]
      if (sorted[i] === expectedDate) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diffDays === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak, 1)

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: sorted.length,
    lastActiveDate: lastDate,
    activeDates: sorted,
  }
}

// ── Full progress summary ─────────────────────────────────────────────────────

export interface ProgressSummary {
  streak: StreakData
  badges: Badge[]
  workoutCount: number
  weightEntryCount: number
  prCount: number
  measurementCount: number
}

export async function fetchProgressSummary(uid: string): Promise<ProgressSummary> {
  const [weights, workouts, prs, measurements] = await Promise.all([
    fetchWeightHistory(uid),
    fetchWorkoutHistory(uid),
    fetchPersonalRecords(uid),
    fetchMeasurements(uid),
  ])

  // Build active dates from all sources
  const activeDateSet = new Set<string>()
  weights.forEach(w => activeDateSet.add(w.date))
  workouts.forEach(w => activeDateSet.add(w.date))

  const streak = calculateStreak(Array.from(activeDateSet))

  const badges = computeBadges({
    workoutCount:     workouts.length,
    weightEntryCount: weights.length,
    mealEntryCount:   weights.length > 0 ? 1 : 0, // simplified — V5 will track properly
    prCount:          prs.length,
    measurementCount: measurements.length,
    streak:           streak.currentStreak,
    longestStreak:    streak.longestStreak,
  })

  return {
    streak,
    badges,
    workoutCount:     workouts.length,
    weightEntryCount: weights.length,
    prCount:          prs.length,
    measurementCount: measurements.length,
  }
}
