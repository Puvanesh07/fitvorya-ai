export type Gender = 'male' | 'female' | 'other'
export type WeightUnit = 'kg' | 'lbs'

export type FitnessGoal =
  | 'lose_weight'
  | 'gain_weight'
  | 'build_muscle'
  | 'maintain_weight'
  | 'general_fitness'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  age: number
  gender: Gender
  /** Height in centimetres */
  height: number
  /** Current weight in kilograms (always stored as kg) */
  weight: number
  /** Target weight in kilograms (always stored as kg) */
  targetWeight: number
  /** Starting weight captured at onboarding — used for real progress calculation */
  startingWeight?: number
  goal: FitnessGoal
  activityLevel: ActivityLevel
  /** Display preference — does not affect stored values */
  weightUnit: WeightUnit
  onboardingComplete: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_weight: 'Lose Weight',
  gain_weight: 'Gain Weight',
  build_muscle: 'Build Muscle',
  maintain_weight: 'Maintain Weight',
  general_fitness: 'General Fitness',
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little or no exercise)',
  light: 'Light (1–3 days/week)',
  moderate: 'Moderate (3–5 days/week)',
  active: 'Active (6–7 days/week)',
  very_active: 'Very Active (hard exercise, physical job)',
}
