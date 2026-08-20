// ── Family Nutrition Coach — Types ────────────────────────────────────────────

export type MemberRole =
  | 'adult_male' | 'adult_female'
  | 'pregnant' | 'baby' | 'toddler'
  | 'senior_male' | 'senior_female' | 'child'

export type DietPref = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type CuisinePreference = 'tamil' | 'global' | 'mixed'

export interface FamilyMember {
  id: string
  name: string
  role: MemberRole
  dateOfBirth?: string      // used to calculate age
  ageYears?: number         // for adults/seniors if DOB not provided
  ageMonths?: number        // for baby/toddler
  gender?: 'male' | 'female' | 'other'
  heightCm?: number
  weightKg?: number
  activityLevel?: ActivityLevel
  dietPref: DietPref
  allergies: string[]
  dislikes: string[]
  preferences: string[]
  goal?: string
  pregnancyWeek?: number    // for pregnant member
  tamilFoodPreference: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FamilyProfile {
  id: string                // uid
  familyName: string
  cuisinePreference: CuisinePreference
  members: FamilyMember[]
  updatedAt?: string
}

// ── Meal types ────────────────────────────────────────────────────────────────

export interface FamilyMeal {
  baseName: string
  baseEmoji: string
  baseDescription: string
  adaptations: MemberAdaptation[]
  nutrients: string[]
  mealTime: 'breakfast' | 'lunch' | 'snack' | 'dinner'
}

export interface MemberAdaptation {
  memberId: string
  memberName: string
  memberEmoji: string
  description: string
  portion: string
  texture?: string
  notes?: string
}

export interface FamilyDayPlan {
  dayLabel: string
  breakfast: FamilyMeal
  lunch: FamilyMeal
  snack: FamilyMeal
  dinner: FamilyMeal
}

export interface FamilyWeekPlan {
  days: FamilyDayPlan[]
  cuisinePreference: CuisinePreference
  generatedAt: string
}

// ── Shopping list ─────────────────────────────────────────────────────────────

export type ShoppingCategory =
  | 'vegetables' | 'fruits' | 'grains'
  | 'protein' | 'dairy' | 'nuts_seeds'
  | 'pulses' | 'spices' | 'other'

export interface ShoppingItem {
  id: string
  name: string
  emoji: string
  category: ShoppingCategory
  quantity: string
  checked: boolean
}

export interface ShoppingList {
  items: ShoppingItem[]
  generatedAt: string
  weekPlanRef?: string
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface FamilyChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
