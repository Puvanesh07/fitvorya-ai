// ── Unified Food Types ────────────────────────────────────────────────────────
// Single food type used across FitTracker, Pregnancy, Baby, and Family.
// All macro values are per 100g.

export interface UnifiedFood {
  fdcId: string
  name: string
  brand?: string
  /** Per 100g */
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium?: number
  sugar?: number
  calcium?: number
  iron?: number
  /** Typical serving size in grams (e.g. 45 for one idli) */
  servingSize?: number
  /** Human label for the serving (e.g. "1 piece", "1 cup", "1 medium") */
  servingUnit?: string
  /** Additional serving options for unit picker */
  servingOptions?: ServingOption[]
  /** Food category for filtering */
  category?: FoodCategory
  /** Thumbnail image URL from Open Food Facts or USDA */
  imageUrl?: string
  /** Data source provenance */
  source: 'usda' | 'openfoodfacts' | 'local'
}

export interface ServingOption {
  label: string   // e.g. "1 cup", "1 tablespoon"
  grams: number   // equivalent weight in grams
}

export type FoodCategory =
  | 'grains'
  | 'protein'
  | 'dairy'
  | 'fruits'
  | 'vegetables'
  | 'legumes'
  | 'nuts_seeds'
  | 'beverages'
  | 'sweets'
  | 'condiments'
  | 'oils'
  | 'prepared'
  | 'other'

// ── Meal plan food entry ──────────────────────────────────────────────────────

/** A food item selected for a meal plan slot (with portion info) */
export interface MealPlanFood {
  food: UnifiedFood
  grams: number
  /** Optional display note, e.g. "steamed", "with coconut chutney" */
  note?: string
}

// ── Meal plan structures ──────────────────────────────────────────────────────

export type MealSlot = 'breakfast' | 'morningSnack' | 'lunch' | 'eveningSnack' | 'dinner'

export interface MealSlotPlan {
  slot: MealSlot
  label: string
  emoji: string
  /** Primary named meal (display name like "Idli + Sambar") */
  name: string
  description: string
  /** Individual food items from the database that make up this meal */
  foods: MealPlanFood[]
  /** Nutrient highlights for display */
  nutrients: string[]
  /** Total calculated from foods[] */
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
}

export interface UnifiedDayPlan {
  dayLabel: string
  dayIndex: number   // 0 = Monday
  breakfast: MealSlotPlan
  morningSnack?: MealSlotPlan
  lunch: MealSlotPlan
  eveningSnack?: MealSlotPlan
  dinner: MealSlotPlan
  totalCalories: number
  waterLiters: number
}

// ── Search state ──────────────────────────────────────────────────────────────

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface FoodSearchState {
  query: string
  results: UnifiedFood[]
  status: SearchStatus
  errorMessage?: string
  fromCache: boolean
}
