export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'full_body' | 'cardio'

export type Equipment =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine'
  | 'bodyweight' | 'kettlebell' | 'resistance_band' | 'other'

export type WorkoutCategory =
  | 'strength' | 'hypertrophy' | 'cardio' | 'mobility' | 'hiit'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscles?: MuscleGroup[]
  equipment: Equipment
  category: WorkoutCategory
  instructions: string[]
  tips?: string
}

/** One set logged during a workout */
export interface SetEntry {
  setNumber: number
  /** Weight stored in kg internally */
  weightKg: number
  reps: number
  completed: boolean
  notes?: string
}

/** One exercise block inside a session */
export interface SessionExercise {
  exerciseId: string
  exerciseName: string
  sets: SetEntry[]
  restSeconds: number
}

/** A completed or in-progress workout session */
export interface WorkoutSession {
  id: string
  templateId?: string
  name: string
  /** ISO date YYYY-MM-DD */
  date: string
  /** Epoch ms */
  startedAt: number
  /** Epoch ms, undefined if still in progress */
  finishedAt?: number
  /** Duration in seconds */
  durationSeconds: number
  exercises: SessionExercise[]
  notes?: string
  /** Total volume = sum of (weightKg × reps) across all completed sets */
  totalVolumeKg: number
}

/** A reusable workout template */
export interface WorkoutTemplate {
  id: string
  name: string
  category: WorkoutCategory
  description?: string
  estimatedMinutes: number
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    defaultSets: number
    defaultReps: number
    defaultWeightKg: number
    restSeconds: number
  }>
  isBuiltIn: boolean
}

/** Personal record for one exercise */
export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  /** Best weight × reps combination */
  weightKg: number
  reps: number
  /** Estimated 1 Rep Max via Epley formula */
  oneRepMaxKg: number
  achievedAt: string
  sessionId: string
}

/** Epley 1RM formula: weight × (1 + reps/30) */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

export function totalVolume(exercises: SessionExercise[]): number {
  return exercises.reduce((total, ex) =>
    total + ex.sets
      .filter(s => s.completed)
      .reduce((s, set) => s + set.weightKg * set.reps, 0),
  0)
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  core: 'Core', quads: 'Quads', hamstrings: 'Hamstrings',
  glutes: 'Glutes', calves: 'Calves', full_body: 'Full Body', cardio: 'Cardio',
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell', dumbbell: 'Dumbbell', cable: 'Cable',
  machine: 'Machine', bodyweight: 'Bodyweight', kettlebell: 'Kettlebell',
  resistance_band: 'Band', other: 'Other',
}

export const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  strength: 'Strength', hypertrophy: 'Hypertrophy',
  cardio: 'Cardio', mobility: 'Mobility', hiit: 'HIIT',
}

export const CATEGORY_COLORS: Record<WorkoutCategory, string> = {
  strength:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  hypertrophy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cardio:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  mobility:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  hiit:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  chest: '💪', back: '🔙', shoulders: '🏋️', biceps: '💪',
  triceps: '💪', forearms: '🤛', core: '🎯', quads: '🦵',
  hamstrings: '🦵', glutes: '🍑', calves: '🦵',
  full_body: '🏃', cardio: '❤️',
}
