// ── Pregnancy Types ───────────────────────────────────────────────────────────

export interface PregnancyProfile {
  startDate: string        // ISO date string — first day of last menstrual period
  dueDate: string          // ISO date string — estimated due date
  dietType: DietType
  restrictions: string[]   // e.g. ['no_fish', 'lactose_intolerant']
  allergies: string[]
  tamilFoodPreference: boolean
  updatedAt?: string
}

export type DietType = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'

// ── Week & Month ──────────────────────────────────────────────────────────────

export interface PregnancyStage {
  week: number         // 1–42
  month: number        // 1–10
  trimester: 1 | 2 | 3
  weeksRemaining: number
  daysUntilDue: number
  isOverdue: boolean
}

// ── Food items ────────────────────────────────────────────────────────────────

export type FoodCategory =
  | 'tamil_traditional'
  | 'millets'
  | 'rice'
  | 'fruits'
  | 'vegetables'
  | 'protein'
  | 'global'
  | 'dairy'
  | 'grains'
  | 'healthy_fats'

export type FoodSafety = 'safe' | 'caution' | 'avoid' | 'moderate'

export interface PregnancyFood {
  id: string
  name: string
  tamilName?: string
  emoji: string
  category: FoodCategory
  benefits: string[]
  nutrients: string[]
  safety: FoodSafety
  safetyNote?: string        // shown when safety is 'caution' or 'avoid'
  servingSuggestion?: string
  trimestersRecommended?: (1 | 2 | 3)[]  // if empty = all trimesters
}

// ── Monthly guide ─────────────────────────────────────────────────────────────

export interface MonthlyGuide {
  month: number
  weeks: string         // e.g. "Weeks 1–4"
  trimester: 1 | 2 | 3
  title: string
  babyDevelopment: string
  motherChanges: string
  nutritionFocus: string[]
  keyNutrients: NutrientFocus[]
  tamilFoods: string[]
  globalFoods: string[]
  fruits: string[]
  vegetables: string[]
  hydration: string
  symptomsToNote: string[]
  cautions: string[]
  doctorNote?: string
}

export interface NutrientFocus {
  name: string
  emoji: string
  reason: string
  sources: string[]
}

// ── Weekly guide ──────────────────────────────────────────────────────────────

export interface WeeklyGuide {
  week: number
  highlights: string
  nutritionTip: string
  wellnessTip: string
  hydrationGoalLiters: number
  mealIdeas: MealIdea[]
}

export interface MealIdea {
  time: 'breakfast' | 'lunch' | 'snack' | 'dinner'
  emoji: string
  name: string
  description: string
  dietTypes: DietType[]   // which diet types this suits
}

// ── Meal plan ─────────────────────────────────────────────────────────────────

export interface MealPlan {
  days: DayPlan[]
  generatedAt: string
  week: number
  dietType: DietType
  preference: 'tamil' | 'global' | 'mixed'
}

export interface DayPlan {
  dayLabel: string    // e.g. "Monday"
  breakfast: MealEntry
  lunch: MealEntry
  snack: MealEntry
  dinner: MealEntry
  waterLiters: number
}

export interface MealEntry {
  name: string
  description: string
  nutrients: string[]
  emoji: string
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AIChatContext {
  week: number
  trimester: 1 | 2 | 3
  dietType: DietType
  restrictions: string[]
  tamilFoodPreference: boolean
}
