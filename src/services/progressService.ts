import {
  addMeasurement, getMeasurements, updateMeasurement, deleteMeasurement,
} from '../firebase/firestoreMeasurements'
import { fetchWeightHistory } from './weightService'
import { fetchWorkoutHistory } from './workoutService'
import { fetchPersonalRecords } from './workoutService'
import { fetchMealsForRange } from './nutritionService'
import type { Measurement, StreakData } from '../types/progress'
import { computeBadges } from '../types/progress'
import type { Badge } from '../types/progress'
import { localTodayISO, dateToISO } from '../utils/format'

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
// An "active day" = any day where the user logged weight, a workout, or a meal.

export function calculateStreak(activeDates: string[]): StreakData {
  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActiveDate: '', activeDates: [] }
  }

  const sorted = [...new Set(activeDates)].sort()
  // Use local timezone — toISOString() returns UTC and breaks streaks for users west of UTC
  const today = localTodayISO()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = dateToISO(yesterdayDate) // local-timezone safe

  // Calculate current streak — walk backwards from the most recent active date
  let currentStreak = 0
  const lastDate = sorted[sorted.length - 1]

  if (lastDate === today || lastDate === yesterdayStr) {
    // Build a cursor date from lastDate at local midnight (append T00:00:00 to
    // force local-time parsing, not UTC)
    let cursorDate = new Date(lastDate + 'T00:00:00')
    for (let i = sorted.length - 1; i >= 0; i--) {
      const expected = dateToISO(cursorDate) // local-timezone safe
      if (sorted[i] === expected) {
        currentStreak++
        cursorDate.setDate(cursorDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 1
  for (let i = 1; i < sorted.length; i++) {
    // Parse with T00:00:00 to force local time so daylight-saving transitions
    // don't create ghost 25-hour days that diff to 2 days
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const curr = new Date(sorted[i] + 'T00:00:00')
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
  // Fetch meals for the past 90 days to count real meal-logging days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)
  const cutoffStr = dateToISO(cutoffDate)
  const today = localTodayISO()

  const [weights, workouts, prs, measurements, recentMeals] = await Promise.all([
    fetchWeightHistory(uid),
    fetchWorkoutHistory(uid),
    fetchPersonalRecords(uid),
    fetchMeasurements(uid),
    fetchMealsForRange(uid, cutoffStr, today),
  ])

  // Count distinct meal-logging days (real count, not a stub)
  const mealDateSet = new Set<string>()
  recentMeals.forEach(m => mealDateSet.add(m.date))
  const mealEntryCount = mealDateSet.size

  // Build active dates from all sources for streak
  const activeDateSet = new Set<string>()
  weights.forEach(w => activeDateSet.add(w.date))
  workouts.forEach(w => activeDateSet.add(w.date))
  mealDateSet.forEach(d => activeDateSet.add(d))

  const streak = calculateStreak(Array.from(activeDateSet))

  const badges = computeBadges({
    workoutCount:     workouts.length,
    weightEntryCount: weights.length,
    mealEntryCount,   // real count now
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
