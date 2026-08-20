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

  // Progress toward target weight
  // For lose/maintain: how much of the gap they've closed from starting weight
  // We use the profile.weight vs targetWeight delta relative to a reasonable starting range.
  // Simple approach: clamp 0–100 based on direction of goal.
  let progressPercent = 0
  const diff = profile.weight - profile.targetWeight
  if (Math.abs(diff) < 0.1) {
    progressPercent = 100
  } else if (profile.goal === 'lose_weight') {
    // Assume started at weight recorded in profile; show % progress if already made some
    // Since we don't store starting weight separately yet, we show based on BMI moving toward normal
    progressPercent = Math.min(100, Math.max(0, Math.round((1 - Math.abs(diff) / (profile.weight + Math.abs(diff))) * 100)))
  } else if (profile.goal === 'gain_weight' || profile.goal === 'build_muscle') {
    progressPercent = Math.min(100, Math.max(0, Math.round((1 - Math.abs(diff) / (profile.targetWeight + Math.abs(diff))) * 100)))
  } else {
    progressPercent = diff === 0 ? 100 : 50
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
