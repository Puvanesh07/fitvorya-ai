export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
}

export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎',
}

/** A food item from the USDA API or manually entered */
export interface FoodItem {
  fdcId: string
  name: string
  brand?: string
  /** Per 100g */
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

/** A single logged food entry in a meal */
export interface MealEntry {
  id: string
  foodItem: FoodItem
  /** Grams consumed */
  grams: number
  meal: MealType
  /** ISO date string YYYY-MM-DD */
  date: string
  loggedAt: string
}

/** Computed totals for a day */
export interface DailyNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

/** Water log entry */
export interface WaterEntry {
  id: string
  /** ml */
  amount: number
  date: string
  loggedAt: string
}

/** Computed macros scaled to grams consumed */
export function scaleMacros(food: FoodItem, grams: number): DailyNutrition {
  const factor = grams / 100
  return {
    calories: Math.round(food.calories * factor),
    protein:  Math.round(food.protein  * factor * 10) / 10,
    carbs:    Math.round(food.carbs    * factor * 10) / 10,
    fat:      Math.round(food.fat      * factor * 10) / 10,
    fiber:    Math.round((food.fiber ?? 0) * factor * 10) / 10,
  }
}

export function sumNutrition(entries: MealEntry[]): DailyNutrition {
  return entries.reduce<DailyNutrition>((acc, e) => {
    const m = scaleMacros(e.foodItem, e.grams)
    return {
      calories: acc.calories + m.calories,
      protein:  acc.protein  + m.protein,
      carbs:    acc.carbs    + m.carbs,
      fat:      acc.fat      + m.fat,
      fiber:    acc.fiber    + m.fiber,
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}

export function sumWater(entries: WaterEntry[]): number {
  return entries.reduce((s, e) => s + e.amount, 0)
}
