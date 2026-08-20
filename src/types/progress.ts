// ── Body Measurements ─────────────────────────────────────────────────────────

export interface Measurement {
  id: string
  date: string          // YYYY-MM-DD
  /** kg — always stored in kg */
  weight?: number
  /** cm */
  chest?: number
  waist?: number
  hips?: number
  leftArm?: number
  rightArm?: number
  leftThigh?: number
  rightThigh?: number
  neck?: number
  /** Body fat percentage */
  bodyFat?: number
  notes?: string
  createdAt?: string
}

export const MEASUREMENT_FIELDS: {
  key: keyof Omit<Measurement, 'id' | 'date' | 'notes' | 'createdAt'>
  label: string
  unit: string
  icon: string
}[] = [
  { key: 'weight',     label: 'Weight',      unit: 'kg',  icon: '⚖️'  },
  { key: 'chest',      label: 'Chest',       unit: 'cm',  icon: '💪'  },
  { key: 'waist',      label: 'Waist',       unit: 'cm',  icon: '📏'  },
  { key: 'hips',       label: 'Hips',        unit: 'cm',  icon: '📐'  },
  { key: 'leftArm',    label: 'Left Arm',    unit: 'cm',  icon: '💪'  },
  { key: 'rightArm',   label: 'Right Arm',   unit: 'cm',  icon: '💪'  },
  { key: 'leftThigh',  label: 'Left Thigh',  unit: 'cm',  icon: '🦵'  },
  { key: 'rightThigh', label: 'Right Thigh', unit: 'cm',  icon: '🦵'  },
  { key: 'neck',       label: 'Neck',        unit: 'cm',  icon: '📏'  },
  { key: 'bodyFat',    label: 'Body Fat',    unit: '%',   icon: '📊'  },
]

// ── Streaks ───────────────────────────────────────────────────────────────────

export interface StreakData {
  /** Current active streak in days */
  currentStreak: number
  /** Longest ever streak */
  longestStreak: number
  /** Total active days logged */
  totalActiveDays: number
  /** ISO date of last activity */
  lastActiveDate: string
  /** All dates with at least one activity */
  activeDates: string[]
}

// ── Badges / Milestones ───────────────────────────────────────────────────────

export type BadgeId =
  | 'first_workout'
  | 'first_meal'
  | 'first_weight'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'streak_60'
  | 'streak_100'
  | 'workouts_5'
  | 'workouts_10'
  | 'workouts_25'
  | 'workouts_50'
  | 'weight_logged_7'
  | 'nutrition_7'
  | 'pr_first'
  | 'pr_5'
  | 'measurement_first'

export interface Badge {
  id: BadgeId
  name: string
  description: string
  icon: string
  earnedAt?: string
  earned: boolean
}

export const ALL_BADGES: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  // First-time
  { id: 'first_workout',     icon: '🏋️', name: 'First Rep',        description: 'Complete your first workout' },
  { id: 'first_meal',        icon: '🍽️', name: 'First Bite',        description: 'Log your first meal' },
  { id: 'first_weight',      icon: '⚖️', name: 'Step on the Scale',  description: 'Log your first weight entry' },
  { id: 'measurement_first', icon: '📏', name: 'Measured Up',        description: 'Record your first body measurements' },
  { id: 'pr_first',          icon: '🏆', name: 'New Record',          description: 'Set your first personal record' },
  // Streaks
  { id: 'streak_3',  icon: '🔥', name: '3-Day Streak',   description: '3 days active in a row' },
  { id: 'streak_7',  icon: '🔥', name: 'Week Warrior',   description: '7 days active in a row' },
  { id: 'streak_14', icon: '🔥', name: 'Two Weeks',      description: '14 days active in a row' },
  { id: 'streak_30', icon: '🔥', name: 'Monthly Grind',  description: '30 days active in a row' },
  { id: 'streak_60', icon: '⚡', name: 'Two Months',     description: '60 days active in a row' },
  { id: 'streak_100',icon: '👑', name: '100-Day Legend', description: '100 days active in a row' },
  // Workout volume
  { id: 'workouts_5',  icon: '💪', name: 'Getting Started', description: 'Complete 5 workouts' },
  { id: 'workouts_10', icon: '💪', name: 'Committed',        description: 'Complete 10 workouts' },
  { id: 'workouts_25', icon: '🏅', name: 'Consistent',       description: 'Complete 25 workouts' },
  { id: 'workouts_50', icon: '🥇', name: 'Dedicated',        description: 'Complete 50 workouts' },
  // Logging streaks
  { id: 'weight_logged_7',   icon: '📈', name: 'Scale Streak',    description: 'Log weight 7 days in a row' },
  { id: 'nutrition_7',       icon: '🥗', name: 'Food Journal',    description: 'Log meals 7 days in a row' },
  { id: 'pr_5',              icon: '🏆', name: 'Record Breaker',  description: 'Set 5 personal records' },
]

export function computeBadges(data: {
  workoutCount: number
  weightEntryCount: number
  mealEntryCount: number
  prCount: number
  measurementCount: number
  streak: number
  longestStreak: number
}): Badge[] {
  const { workoutCount, weightEntryCount, mealEntryCount, prCount, measurementCount, streak } = data

  return ALL_BADGES.map((b) => {
    let earned = false
    switch (b.id) {
      case 'first_workout':     earned = workoutCount >= 1;     break
      case 'first_meal':        earned = mealEntryCount >= 1;   break
      case 'first_weight':      earned = weightEntryCount >= 1; break
      case 'measurement_first': earned = measurementCount >= 1; break
      case 'pr_first':          earned = prCount >= 1;          break
      case 'pr_5':              earned = prCount >= 5;          break
      case 'streak_3':          earned = streak >= 3;           break
      case 'streak_7':          earned = streak >= 7;           break
      case 'streak_14':         earned = streak >= 14;          break
      case 'streak_30':         earned = streak >= 30;          break
      case 'streak_60':         earned = streak >= 60;          break
      case 'streak_100':        earned = streak >= 100;         break
      case 'workouts_5':        earned = workoutCount >= 5;     break
      case 'workouts_10':       earned = workoutCount >= 10;    break
      case 'workouts_25':       earned = workoutCount >= 25;    break
      case 'workouts_50':       earned = workoutCount >= 50;    break
      case 'weight_logged_7':   earned = weightEntryCount >= 7; break
      case 'nutrition_7':       earned = mealEntryCount >= 7;   break
    }
    return { ...b, earned }
  })
}
