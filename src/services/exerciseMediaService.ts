/**
 * exerciseMediaService — resolves the real wger.de demo media (matched at
 * build time by scripts/buildExerciseCatalog.mjs) for a FitTracker exercise,
 * by exercise id first and by name (normalized + light containment) second.
 */

import { EXERCISE_MEDIA } from '../data/exerciseMedia'
import type { ExerciseMedia } from '../data/exerciseMedia'

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).join(' ')

/** Indexed by wger match name so name-only callers can resolve media too. */
const BY_NAME = new Map<string, ExerciseMedia>(
  Object.values(EXERCISE_MEDIA).map(m => [norm(m.match), m]),
)

export function lookupExerciseMedia(exerciseId?: string, exerciseName?: string): ExerciseMedia | null {
  if (exerciseId && EXERCISE_MEDIA[exerciseId]) return EXERCISE_MEDIA[exerciseId]
  if (exerciseName) {
    const n = norm(exerciseName)
    if (BY_NAME.has(n)) return BY_NAME.get(n)!
    // light containment fallback: "Barbell Bench Press!" → "bench press"
    for (const [key, m] of BY_NAME) {
      if (n.includes(key) || key.includes(n)) return m
    }
  }
  return null
}
