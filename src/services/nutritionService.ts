import type { FoodItem, MealEntry, MealType, WaterEntry } from '../types/nutrition'
import {
  addMealEntry, getMealEntriesForDate, getMealEntriesForRange,
  deleteMealEntry, addWaterEntry, getWaterEntriesForDate, deleteWaterEntry,
} from '../firebase/firestoreNutrition'

// ── USDA FoodData Central ─────────────────────────────────────────────────────
const USDA_KEY  = import.meta.env.VITE_USDA_API_KEY ?? 'DEMO_KEY'
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'

interface USDAFood {
  fdcId: number
  description: string
  brandOwner?: string
  foodNutrients: Array<{ nutrientId: number; value: number }>
}

function parseUSDA(f: USDAFood): FoodItem {
  const get = (id: number) => f.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0
  return {
    fdcId:    String(f.fdcId),
    name:     f.description,
    brand:    f.brandOwner,
    calories: Math.round(get(1008)),
    protein:  Math.round(get(1003) * 10) / 10,
    carbs:    Math.round(get(1005) * 10) / 10,
    fat:      Math.round(get(1004) * 10) / 10,
    fiber:    Math.round(get(1079) * 10) / 10,
  }
}

export async function searchFood(query: string): Promise<FoodItem[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return FALLBACK_FOODS.slice(0, 10)

  // Local first — includes full Indian food list
  const localMatches = FALLBACK_FOODS.filter(f =>
    f.name.toLowerCase().includes(trimmed.toLowerCase()),
  )

  try {
    // Correct USDA URL — Foundation, SR Legacy, and Branded as separate params
    const params = new URLSearchParams({
      api_key: USDA_KEY,
      query: trimmed,
      pageSize: '15',
    })
    const url = `${USDA_BASE}/foods/search?${params.toString()}&dataType=Foundation&dataType=SR%20Legacy&dataType=Branded`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`USDA ${res.status}`)
    const data = await res.json() as { foods?: USDAFood[] }
    const apiResults = (data.foods ?? []).map(parseUSDA).filter(f => f.calories > 0)

    // Merge local + API, deduplicated by name
    const seen = new Set(localMatches.map(f => f.name.toLowerCase()))
    const merged = [...localMatches]
    for (const f of apiResults) {
      if (!seen.has(f.name.toLowerCase())) {
        merged.push(f)
        seen.add(f.name.toLowerCase())
      }
    }
    return merged.slice(0, 20)
  } catch {
    return localMatches.length > 0 ? localMatches : FALLBACK_FOODS.slice(0, 10)
  }
}

// ── Food database — global + Indian ──────────────────────────────────────────
export const FALLBACK_FOODS: FoodItem[] = [
  // Global staples
  { fdcId: 'f1',  name: 'Chicken Breast (cooked)',   calories: 165, protein: 31,  carbs: 0,    fat: 3.6, fiber: 0   },
  { fdcId: 'f2',  name: 'Brown Rice (cooked)',        calories: 112, protein: 2.6, carbs: 24,   fat: 0.9, fiber: 1.8 },
  { fdcId: 'f3',  name: 'Whole Egg',                  calories: 155, protein: 13,  carbs: 1.1,  fat: 11,  fiber: 0   },
  { fdcId: 'f4',  name: 'Oats (dry)',                 calories: 389, protein: 17,  carbs: 66,   fat: 7,   fiber: 10  },
  { fdcId: 'f5',  name: 'Greek Yogurt (plain)',        calories: 59,  protein: 10,  carbs: 3.6,  fat: 0.4, fiber: 0   },
  { fdcId: 'f6',  name: 'Salmon (cooked)',             calories: 208, protein: 20,  carbs: 0,    fat: 13,  fiber: 0   },
  { fdcId: 'f7',  name: 'Sweet Potato (cooked)',       calories: 90,  protein: 2,   carbs: 21,   fat: 0.1, fiber: 3   },
  { fdcId: 'f8',  name: 'Broccoli (cooked)',           calories: 35,  protein: 2.4, carbs: 7,    fat: 0.4, fiber: 2   },
  { fdcId: 'f9',  name: 'Almonds (30g)',               calories: 174, protein: 6,   carbs: 6,    fat: 15,  fiber: 3   },
  { fdcId: 'f10', name: 'Tuna (canned in water)',      calories: 116, protein: 26,  carbs: 0,    fat: 1,   fiber: 0   },
  { fdcId: 'f11', name: 'Apple',                       calories: 52,  protein: 0.3, carbs: 14,   fat: 0.2, fiber: 2.4 },
  { fdcId: 'f12', name: 'Banana',                      calories: 89,  protein: 1.1, carbs: 23,   fat: 0.3, fiber: 2.6 },
  { fdcId: 'f13', name: 'Whole Milk (1 cup)',          calories: 149, protein: 8,   carbs: 12,   fat: 8,   fiber: 0   },
  { fdcId: 'f14', name: 'Bread (whole wheat)',         calories: 247, protein: 13,  carbs: 41,   fat: 4,   fiber: 7   },
  { fdcId: 'f15', name: 'White Rice cooked (1 cup)',   calories: 206, protein: 4.2, carbs: 44.5, fat: 0.4, fiber: 0.6 },
  // South Indian
  { fdcId: 'ind_idli',          name: 'Idli (1 piece)',               calories: 39,  protein: 2,   carbs: 8,   fat: 0.2, fiber: 0.5 },
  { fdcId: 'ind_dosa',          name: 'Plain Dosa',                   calories: 133, protein: 3.5, carbs: 25,  fat: 2.5, fiber: 1   },
  { fdcId: 'ind_masala_dosa',   name: 'Masala Dosa',                  calories: 230, protein: 5,   carbs: 40,  fat: 6,   fiber: 2   },
  { fdcId: 'ind_sambar',        name: 'Sambar (1 cup)',               calories: 102, protein: 5,   carbs: 16,  fat: 2,   fiber: 4   },
  { fdcId: 'ind_rasam',         name: 'Rasam (1 cup)',                calories: 45,  protein: 2,   carbs: 8,   fat: 0.5, fiber: 1   },
  { fdcId: 'ind_uttapam',       name: 'Uttapam',                      calories: 180, protein: 5,   carbs: 32,  fat: 4,   fiber: 1.5 },
  { fdcId: 'ind_pongal',        name: 'Ven Pongal (1 cup)',           calories: 220, protein: 6,   carbs: 38,  fat: 6,   fiber: 2   },
  { fdcId: 'ind_curd_rice',     name: 'Curd Rice (1 cup)',            calories: 198, protein: 5,   carbs: 35,  fat: 4,   fiber: 0.5 },
  { fdcId: 'ind_lemon_rice',    name: 'Lemon Rice (1 cup)',           calories: 210, protein: 4,   carbs: 40,  fat: 4,   fiber: 1   },
  { fdcId: 'ind_vada',          name: 'Medu Vada (1 piece)',          calories: 97,  protein: 4,   carbs: 12,  fat: 4,   fiber: 1   },
  // Bread / Roti
  { fdcId: 'ind_chapati',       name: 'Chapati / Roti (1 piece)',     calories: 71,  protein: 2.5, carbs: 13,  fat: 1.5, fiber: 1   },
  { fdcId: 'ind_paratha',       name: 'Plain Paratha (1 piece)',      calories: 130, protein: 3,   carbs: 20,  fat: 5,   fiber: 1   },
  { fdcId: 'ind_aloo_paratha',  name: 'Aloo Paratha (1 piece)',       calories: 200, protein: 4,   carbs: 30,  fat: 7,   fiber: 2   },
  { fdcId: 'ind_naan',          name: 'Naan (1 piece)',               calories: 262, protein: 9,   carbs: 45,  fat: 5,   fiber: 2   },
  { fdcId: 'ind_puri',          name: 'Puri (1 piece)',               calories: 80,  protein: 2,   carbs: 10,  fat: 4,   fiber: 0.5 },
  // Dal & Legumes
  { fdcId: 'ind_dal_tadka',     name: 'Dal Tadka (1 cup)',            calories: 180, protein: 10,  carbs: 26,  fat: 5,   fiber: 7   },
  { fdcId: 'ind_chana_masala',  name: 'Chana Masala (1 cup)',         calories: 270, protein: 14,  carbs: 40,  fat: 7,   fiber: 10  },
  { fdcId: 'ind_rajma',         name: 'Rajma (1 cup)',                calories: 260, protein: 14,  carbs: 42,  fat: 4,   fiber: 11  },
  { fdcId: 'ind_moong_dal',     name: 'Moong Dal (1 cup)',            calories: 150, protein: 10,  carbs: 24,  fat: 1,   fiber: 6   },
  // Vegetables & Curry
  { fdcId: 'ind_palak_paneer',  name: 'Palak Paneer (1 cup)',         calories: 280, protein: 14,  carbs: 12,  fat: 20,  fiber: 3   },
  { fdcId: 'ind_paneer_bhurji', name: 'Paneer Bhurji (100g)',         calories: 265, protein: 18,  carbs: 6,   fat: 19,  fiber: 1   },
  { fdcId: 'ind_aloo_gobi',     name: 'Aloo Gobi (1 cup)',            calories: 145, protein: 4,   carbs: 22,  fat: 5,   fiber: 4   },
  // Non-Veg
  { fdcId: 'ind_chicken_curry', name: 'Chicken Curry (1 cup)',        calories: 290, protein: 28,  carbs: 8,   fat: 16,  fiber: 1   },
  { fdcId: 'ind_butter_chicken',name: 'Butter Chicken (1 cup)',       calories: 320, protein: 26,  carbs: 12,  fat: 18,  fiber: 1   },
  { fdcId: 'ind_mutton_curry',  name: 'Mutton Curry (1 cup)',         calories: 340, protein: 28,  carbs: 5,   fat: 22,  fiber: 0.5 },
  { fdcId: 'ind_egg_curry',     name: 'Egg Curry (2 eggs)',           calories: 215, protein: 14,  carbs: 8,   fat: 14,  fiber: 1   },
  { fdcId: 'ind_fish_curry',    name: 'Fish Curry (1 cup)',           calories: 220, protein: 24,  carbs: 6,   fat: 11,  fiber: 1   },
  { fdcId: 'ind_boiled_egg',    name: 'Boiled Egg (1 whole)',         calories: 78,  protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0   },
  // Dairy & Protein
  { fdcId: 'ind_paneer',        name: 'Paneer (100g)',                calories: 265, protein: 18,  carbs: 3,   fat: 20,  fiber: 0   },
  { fdcId: 'ind_curd',          name: 'Curd / Plain Yogurt (100g)',  calories: 61,  protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0   },
  { fdcId: 'ind_lassi',         name: 'Sweet Lassi (1 glass)',        calories: 180, protein: 5,   carbs: 32,  fat: 3.5, fiber: 0   },
  { fdcId: 'ind_chai',          name: 'Masala Chai with Milk',        calories: 80,  protein: 2.5, carbs: 12,  fat: 2,   fiber: 0   },
  { fdcId: 'ind_whey',          name: 'Whey Protein Powder (30g)',    calories: 120, protein: 24,  carbs: 3,   fat: 1.5, fiber: 0   },
  // Millets
  { fdcId: 'ind_kambu',         name: 'Kambu (Pearl Millet) porridge',calories: 115, protein: 3,   carbs: 23,  fat: 1,   fiber: 2.5 },
  { fdcId: 'ind_ragi',          name: 'Ragi Kali (Finger Millet)',    calories: 120, protein: 3,   carbs: 25,  fat: 0.5, fiber: 3   },
  { fdcId: 'ind_varagu',        name: 'Varagu (Kodo Millet)',         calories: 110, protein: 2.9, carbs: 22,  fat: 0.9, fiber: 2   },
  { fdcId: 'ind_kuthiraivali',  name: 'Kuthiraivali (Barnyard Millet)',calories: 105, protein: 3.5, carbs: 20, fat: 0.8, fiber: 3   },
  { fdcId: 'ind_kavuni',        name: 'Kavuni Arisi (Black Rice)',    calories: 130, protein: 3,   carbs: 28,  fat: 0.5, fiber: 2.5 },
  // Fruits & Snacks
  { fdcId: 'ind_mango',         name: 'Mango (1 cup cubed)',          calories: 99,  protein: 1.4, carbs: 24,  fat: 0.6, fiber: 2.6 },
  { fdcId: 'ind_peanuts',       name: 'Roasted Peanuts (30g)',        calories: 170, protein: 7.5, carbs: 5,   fat: 14,  fiber: 2   },
  { fdcId: 'ind_almonds',       name: 'Almonds (10 pieces)',          calories: 70,  protein: 2.6, carbs: 2.5, fat: 6,   fiber: 1.2 },
]

// ── Meal CRUD ─────────────────────────────────────────────────────────────────

export async function logMeal(
  uid: string, foodItem: FoodItem, grams: number, meal: MealType, date: string,
): Promise<string> {
  return addMealEntry(uid, { foodItem, grams, meal, date })
}

export async function fetchMealsForDate(uid: string, date: string): Promise<MealEntry[]> {
  return getMealEntriesForDate(uid, date)
}

export async function fetchMealsForRange(uid: string, start: string, end: string): Promise<MealEntry[]> {
  return getMealEntriesForRange(uid, start, end)
}

export async function removeMeal(uid: string, entryId: string): Promise<void> {
  return deleteMealEntry(uid, entryId)
}

// ── Water CRUD ────────────────────────────────────────────────────────────────

export async function logWater(uid: string, amount: number, date: string): Promise<string> {
  return addWaterEntry(uid, amount, date)
}

export async function fetchWaterForDate(uid: string, date: string): Promise<WaterEntry[]> {
  return getWaterEntriesForDate(uid, date)
}

export async function removeWater(uid: string, entryId: string): Promise<void> {
  return deleteWaterEntry(uid, entryId)
}
