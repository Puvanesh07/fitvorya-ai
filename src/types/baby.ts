// ── Baby & Toddler Types ──────────────────────────────────────────────────────
// Phase 2 — AI Baby & Toddler Nutrition Coach

export type AgeStageId =
  | 'months_0_6'
  | 'months_6_9'
  | 'months_9_12'
  | 'years_1_2'
  | 'years_2_3'

export interface AgeStage {
  id: AgeStageId
  label: string
  shortLabel: string
  emoji: string
  ageRangeMonths: [number, number]   // inclusive min, exclusive max
  texture: TextureLevel
  primaryFeedingMode: 'milk_only' | 'milk_plus_solids' | 'solids_plus_milk' | 'family_foods'
}

export type TextureLevel =
  | 'milk_only'
  | 'puree'
  | 'mash'
  | 'soft_lumps'
  | 'finger_foods'
  | 'family_foods'

export interface BabyProfile {
  name: string
  dateOfBirth: string      // ISO date string
  dietType: BabyDietType
  allergiesReported: string[]
  tamilFoodPreference: boolean
  updatedAt?: string
}

export type BabyDietType = 'vegetarian' | 'non_vegetarian' | 'vegan'

// ── Food database ─────────────────────────────────────────────────────────────

export type BabyFoodCategory =
  | 'tamil_traditional'
  | 'grains_cereals'
  | 'fruits'
  | 'vegetables'
  | 'protein'
  | 'dairy'
  | 'global'

export type BabyFoodSafety = 'safe' | 'age_restricted' | 'caution' | 'avoid_under_1'

export interface BabyFood {
  id: string
  name: string
  tamilName?: string
  emoji: string
  category: BabyFoodCategory
  minAgeMonths: number          // earliest age to introduce (months)
  textures: TextureLevel[]      // safe textures for this food
  benefits: string[]
  nutrients: string[]
  safety: BabyFoodSafety
  safetyNote?: string
  preparationTips: string[]
  chokingRisk: boolean
  chokingNote?: string
  commonAllergen: boolean
  allergenName?: string
}

// ── Stage guide ───────────────────────────────────────────────────────────────

export interface StageGuide {
  stageId: AgeStageId
  title: string
  overview: string
  feedingOverview: string
  milkFeeding: string | null     // null for stages where milk is supplementary
  solidsFocus: string | null
  textureFocus: TextureLevel
  dailyMeals: number             // how many solid meal attempts per day
  keyNutrients: BabyNutrientFocus[]
  tamilFoods: string[]
  globalFoods: string[]
  fruits: string[]
  vegetables: string[]
  proteinFoods: string[]
  foodsToAvoid: string[]
  chokingSafety: string[]
  developerMilestones: string[]  // feeding readiness signs
  doctorNote: string
}

export interface BabyNutrientFocus {
  name: string
  emoji: string
  reason: string
  sources: string[]
}

// ── Food introduction tracker ─────────────────────────────────────────────────

export type IntroStatus = 'not_introduced' | 'introduced' | 'tolerated' | 'reaction_reported'

export interface FoodIntroRecord {
  foodId: string
  foodName: string
  emoji: string
  category: 'allergen' | 'general'
  status: IntroStatus
  dateIntroduced?: string
  notes?: string
  updatedAt?: string
}

// ── Meal plan ─────────────────────────────────────────────────────────────────

export interface BabyMealPlan {
  stageId: AgeStageId
  days: BabyDayPlan[]
  dietType: BabyDietType
  preference: 'tamil' | 'global' | 'mixed'
  generatedAt: string
}

export interface BabyDayPlan {
  dayLabel: string
  breakfast?: BabyMealEntry
  morningSnack?: BabyMealEntry
  lunch?: BabyMealEntry
  eveningSnack?: BabyMealEntry
  dinner?: BabyMealEntry
  milkFeeds: string
  waterNote?: string
}

export interface BabyMealEntry {
  name: string
  emoji: string
  texture: TextureLevel
  description: string
  nutrients: string[]
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface BabyChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface BabyChatContext {
  stageId: AgeStageId
  ageMonths: number
  ageLabel: string
  dietType: BabyDietType
  tamilFoodPreference: boolean
  introducedFoods: string[]
  reportedAllergens: string[]
}
