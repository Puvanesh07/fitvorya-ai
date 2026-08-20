import type { Gender, ActivityLevel, FitnessGoal } from '../types/user'

// ─── Activity multipliers ─────────────────────────────────────────────────────

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

// ─── BMR — Mifflin-St Jeor equation ─────────────────────────────────────────
// Most accurate for the general population (2005 meta-analysis).
//   Male:   10×weight(kg) + 6.25×height(cm) − 5×age + 5
//   Female: 10×weight(kg) + 6.25×height(cm) − 5×age − 161

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const adjustment = gender === 'male' ? 5 : -161
  return Math.round(base + adjustment)
}

// ─── TDEE — Total Daily Energy Expenditure ────────────────────────────────────

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel])
}

// ─── Target calories based on goal ───────────────────────────────────────────
// Deficits / surpluses follow standard evidence-based guidelines:
//   Lose weight    → −500 kcal/day (≈ 0.45 kg/week loss)
//   Gain weight    → +500 kcal/day
//   Build muscle   → +250 kcal/day (lean bulk)
//   Maintain       →  0
//   General fitness→  0

export function calculateTargetCalories(
  tdee: number,
  goal: FitnessGoal,
): number {
  const adjustments: Record<FitnessGoal, number> = {
    lose_weight: -500,
    gain_weight: +500,
    build_muscle: +250,
    maintain_weight: 0,
    general_fitness: 0,
  }
  return Math.max(1200, tdee + adjustments[goal])
}

// ─── Macro targets ────────────────────────────────────────────────────────────
// Protein: 1.6 g/kg body weight (general recommendation for active adults)
// Fat:     25 % of total calories
// Carbs:   remainder

export interface MacroTargets {
  proteinG: number
  fatG: number
  carbsG: number
}

export function calculateMacros(
  targetCalories: number,
  weightKg: number,
): MacroTargets {
  const proteinG = Math.round(1.6 * weightKg)
  const fatG = Math.round((targetCalories * 0.25) / 9)
  const proteinCals = proteinG * 4
  const fatCals = fatG * 9
  const carbCals = Math.max(0, targetCalories - proteinCals - fatCals)
  const carbsG = Math.round(carbCals / 4)
  return { proteinG, fatG, carbsG }
}
