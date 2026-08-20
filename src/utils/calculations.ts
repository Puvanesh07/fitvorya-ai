import type { UserProfile } from '../types/user'
import { calculateBMI, getBMICategory, getBMICategoryColor } from './bmi'
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  type MacroTargets,
} from './calories'

export interface FitnessMetrics {
  bmi: number
  bmiCategory: string
  bmiCategoryColor: string
  bmr: number
  tdee: number
  targetCalories: number
  macros: MacroTargets
  /** Steps goal based on goal type */
  stepsGoal: number
  /** Progress % toward target weight (0–100) */
  progressPercent: number
}

const STEPS_BY_GOAL: Record<UserProfile['goal'], number> = {
  lose_weight: 10000,
  gain_weight: 7500,
  build_muscle: 8000,
  maintain_weight: 8000,
  general_fitness: 9000,
}

export function computeMetrics(profile: UserProfile): FitnessMetrics {
  const bmi = calculateBMI(profile.weight, profile.height)
  const bmiCategory = getBMICategory(bmi)
  const bmiCategoryColor = getBMICategoryColor(bmi)
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender)
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  const targetCalories = calculateTargetCalories(tdee, profile.goal)
  const macros = calculateMacros(targetCalories, profile.weight)
  const stepsGoal = STEPS_BY_GOAL[profile.goal]

  // Real progress toward target weight using startingWeight stored at onboarding
  let progressPercent = 0
  const current = profile.weight
  const target  = profile.targetWeight
  const start   = profile.startingWeight ?? current // fall back to current if not stored

  const diff = current - target

  if (Math.abs(diff) < 0.1) {
    // Already at goal
    progressPercent = 100
  } else if (profile.goal === 'lose_weight') {
    // Progress = how much of (start→target gap) has been closed
    const totalGap = start - target
    if (totalGap > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round(((start - current) / totalGap) * 100)))
    }
  } else if (profile.goal === 'gain_weight' || profile.goal === 'build_muscle') {
    const totalGap = target - start
    if (totalGap > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round(((current - start) / totalGap) * 100)))
    }
  } else {
    // maintain / general_fitness — show 100 if within 2kg of target, else 50
    progressPercent = Math.abs(diff) <= 2 ? 100 : 50
  }

  return {
    bmi,
    bmiCategory,
    bmiCategoryColor,
    bmr,
    tdee,
    targetCalories,
    macros,
    stepsGoal,
    progressPercent,
  }
}

export { calculateBMI, getBMICategory, calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros }
