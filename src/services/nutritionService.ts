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
// ALL values are per 100g. For serving-based items, servingSize (grams) and
// servingUnit let the UI show "1 piece = ~45g" alongside the gram input.
export const FALLBACK_FOODS: FoodItem[] = [
  // ── Global staples (already per 100g) ────────────────────────────────────
  { fdcId: 'f1',  name: 'Chicken Breast (cooked)',  calories: 165, protein: 31,   carbs: 0,    fat: 3.6,  fiber: 0   },
  { fdcId: 'f2',  name: 'Brown Rice (cooked)',       calories: 112, protein: 2.6,  carbs: 24,   fat: 0.9,  fiber: 1.8 },
  { fdcId: 'f3',  name: 'Whole Egg',                 calories: 155, protein: 13,   carbs: 1.1,  fat: 11,   fiber: 0,   servingSize: 50,  servingUnit: '1 large egg' },
  { fdcId: 'f4',  name: 'Oats (dry)',                calories: 389, protein: 17,   carbs: 66,   fat: 7,    fiber: 10  },
  { fdcId: 'f5',  name: 'Greek Yogurt (plain)',       calories: 59,  protein: 10,   carbs: 3.6,  fat: 0.4,  fiber: 0   },
  { fdcId: 'f6',  name: 'Salmon (cooked)',            calories: 208, protein: 20,   carbs: 0,    fat: 13,   fiber: 0   },
  { fdcId: 'f7',  name: 'Sweet Potato (cooked)',      calories: 90,  protein: 2,    carbs: 21,   fat: 0.1,  fiber: 3   },
  { fdcId: 'f8',  name: 'Broccoli (cooked)',          calories: 35,  protein: 2.4,  carbs: 7,    fat: 0.4,  fiber: 2   },
  { fdcId: 'f9',  name: 'Almonds',                   calories: 579, protein: 21,   carbs: 22,   fat: 50,   fiber: 12,  servingSize: 30, servingUnit: '30g (~23 almonds)' },
  { fdcId: 'f10', name: 'Tuna (canned in water)',     calories: 116, protein: 26,   carbs: 0,    fat: 1,    fiber: 0   },
  { fdcId: 'f11', name: 'Apple',                      calories: 52,  protein: 0.3,  carbs: 14,   fat: 0.2,  fiber: 2.4 },
  { fdcId: 'f12', name: 'Banana',                     calories: 89,  protein: 1.1,  carbs: 23,   fat: 0.3,  fiber: 2.6, servingSize: 120, servingUnit: '1 medium' },
  { fdcId: 'f13', name: 'Whole Milk',                 calories: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3,  fiber: 0,   servingSize: 240, servingUnit: '1 cup (240ml)' },
  { fdcId: 'f14', name: 'Whole Wheat Bread',          calories: 247, protein: 13,   carbs: 41,   fat: 4,    fiber: 7,   servingSize: 30, servingUnit: '1 slice' },
  { fdcId: 'f15', name: 'White Rice (cooked)',        calories: 130, protein: 2.7,  carbs: 28,   fat: 0.3,  fiber: 0.4 },

  // ── South Indian — all per 100g ───────────────────────────────────────────
  // Idli: 1 piece ≈ 45g, ~39 kcal → per 100g = 87 kcal
  { fdcId: 'ind_idli',         name: 'Idli',                       calories: 87,  protein: 4.4,  carbs: 17,  fat: 0.4, fiber: 1,   servingSize: 45,  servingUnit: '1 piece' },
  // Plain dosa: 1 piece ≈ 80g, 133 kcal → per 100g = 166 kcal
  { fdcId: 'ind_dosa',         name: 'Plain Dosa',                 calories: 166, protein: 4.4,  carbs: 31,  fat: 3.1, fiber: 1.3, servingSize: 80,  servingUnit: '1 dosa' },
  // Masala dosa: ≈ 150g, 230 kcal → per 100g = 153 kcal
  { fdcId: 'ind_masala_dosa',  name: 'Masala Dosa',                calories: 153, protein: 3.3,  carbs: 27,  fat: 4,   fiber: 1.3, servingSize: 150, servingUnit: '1 dosa' },
  // Sambar: 1 cup ≈ 250ml/g, 102 kcal → per 100g = 41 kcal
  { fdcId: 'ind_sambar',       name: 'Sambar',                     calories: 41,  protein: 2,    carbs: 6.4, fat: 0.8, fiber: 1.6, servingSize: 250, servingUnit: '1 cup' },
  // Rasam: 1 cup ≈ 250ml, 45 kcal → per 100g = 18 kcal
  { fdcId: 'ind_rasam',        name: 'Rasam',                      calories: 18,  protein: 0.8,  carbs: 3.2, fat: 0.2, fiber: 0.4, servingSize: 250, servingUnit: '1 cup' },
  // Uttapam: ≈ 120g, 180 kcal → per 100g = 150 kcal
  { fdcId: 'ind_uttapam',      name: 'Uttapam',                    calories: 150, protein: 4.2,  carbs: 27,  fat: 3.3, fiber: 1.3, servingSize: 120, servingUnit: '1 piece' },
  // Ven Pongal: 1 cup ≈ 200g, 220 kcal → per 100g = 110 kcal
  { fdcId: 'ind_pongal',       name: 'Ven Pongal',                 calories: 110, protein: 3,    carbs: 19,  fat: 3,   fiber: 1,   servingSize: 200, servingUnit: '1 cup' },
  // Curd rice: 1 cup ≈ 200g, 198 kcal → per 100g = 99 kcal
  { fdcId: 'ind_curd_rice',    name: 'Curd Rice',                  calories: 99,  protein: 2.5,  carbs: 17.5,fat: 2,   fiber: 0.3, servingSize: 200, servingUnit: '1 cup' },
  // Lemon rice: 1 cup ≈ 200g, 210 kcal → per 100g = 105 kcal
  { fdcId: 'ind_lemon_rice',   name: 'Lemon Rice',                 calories: 105, protein: 2,    carbs: 20,  fat: 2,   fiber: 0.5, servingSize: 200, servingUnit: '1 cup' },
  // Medu Vada: 1 piece ≈ 60g, 97 kcal → per 100g = 162 kcal
  { fdcId: 'ind_vada',         name: 'Medu Vada',                  calories: 162, protein: 6.7,  carbs: 20,  fat: 6.7, fiber: 1.7, servingSize: 60,  servingUnit: '1 piece' },

  // ── Breads & Roti — all per 100g ─────────────────────────────────────────
  // Chapati: 1 piece ≈ 40g, 71 kcal → per 100g = 178 kcal
  { fdcId: 'ind_chapati',      name: 'Chapati / Roti',             calories: 178, protein: 6.3,  carbs: 32.5,fat: 3.8, fiber: 2.5, servingSize: 40,  servingUnit: '1 piece' },
  // Plain Paratha: 1 piece ≈ 70g, 130 kcal → per 100g = 186 kcal
  { fdcId: 'ind_paratha',      name: 'Plain Paratha',              calories: 186, protein: 4.3,  carbs: 28.6,fat: 7.1, fiber: 1.4, servingSize: 70,  servingUnit: '1 piece' },
  // Aloo Paratha: 1 piece ≈ 120g, 200 kcal → per 100g = 167 kcal
  { fdcId: 'ind_aloo_paratha', name: 'Aloo Paratha',               calories: 167, protein: 3.3,  carbs: 25,  fat: 5.8, fiber: 1.7, servingSize: 120, servingUnit: '1 piece' },
  // Naan: 1 piece ≈ 90g, 262 kcal → per 100g = 291 kcal
  { fdcId: 'ind_naan',         name: 'Naan',                       calories: 291, protein: 10,   carbs: 50,  fat: 5.6, fiber: 2.2, servingSize: 90,  servingUnit: '1 piece' },
  // Puri: 1 piece ≈ 35g, 80 kcal → per 100g = 229 kcal
  { fdcId: 'ind_puri',         name: 'Puri',                       calories: 229, protein: 5.7,  carbs: 28.6,fat: 11.4,fiber: 1.4, servingSize: 35,  servingUnit: '1 piece' },

  // ── Dal & Legumes — per 100g ──────────────────────────────────────────────
  { fdcId: 'ind_dal_tadka',    name: 'Dal Tadka',                  calories: 72,  protein: 4,    carbs: 10.4,fat: 2,   fiber: 2.8, servingSize: 250, servingUnit: '1 cup' },
  { fdcId: 'ind_chana_masala', name: 'Chana Masala',               calories: 108, protein: 5.6,  carbs: 16,  fat: 2.8, fiber: 4,   servingSize: 250, servingUnit: '1 cup' },
  { fdcId: 'ind_rajma',        name: 'Rajma',                      calories: 104, protein: 5.6,  carbs: 16.8,fat: 1.6, fiber: 4.4, servingSize: 250, servingUnit: '1 cup' },
  { fdcId: 'ind_moong_dal',    name: 'Moong Dal',                  calories: 60,  protein: 4,    carbs: 9.6, fat: 0.4, fiber: 2.4, servingSize: 250, servingUnit: '1 cup' },

  // ── Vegetables & Curry — per 100g ────────────────────────────────────────
  { fdcId: 'ind_palak_paneer', name: 'Palak Paneer',               calories: 112, protein: 5.6,  carbs: 4.8, fat: 8,   fiber: 1.2, servingSize: 250, servingUnit: '1 cup' },
  { fdcId: 'ind_paneer_bhurji',name: 'Paneer Bhurji',              calories: 265, protein: 18,   carbs: 6,   fat: 19,  fiber: 1   },
  { fdcId: 'ind_aloo_gobi',    name: 'Aloo Gobi',                  calories: 58,  protein: 1.6,  carbs: 8.8, fat: 2,   fiber: 1.6, servingSize: 250, servingUnit: '1 cup' },

  // ── Non-Veg Curries — per 100g ────────────────────────────────────────────
  { fdcId: 'ind_chicken_curry',name: 'Chicken Curry',              calories: 116, protein: 11.2, carbs: 3.2, fat: 6.4, fiber: 0.4, servingSize: 250, servingUnit: '1 cup' },
  { fdcId: 'ind_butter_chicken',name: 'Butter Chicken',            calories: 128, protein: 10.4, carbs: 4.8, fat: 7.2, fiber: 0.4, servingSize: 250, servingUnit: '1 cup' },
  { fdcId: 'ind_mutton_curry', name: 'Mutton Curry',               calories: 136, protein: 11.2, carbs: 2,   fat: 8.8, fiber: 0.2, servingSize: 250, servingUnit: '1 cup' },
  // Egg curry: 2 eggs ≈ 160g, 215 kcal → per 100g = 134 kcal
  { fdcId: 'ind_egg_curry',    name: 'Egg Curry',                  calories: 134, protein: 8.8,  carbs: 5,   fat: 8.8, fiber: 0.6, servingSize: 160, servingUnit: '2 eggs' },
  { fdcId: 'ind_fish_curry',   name: 'Fish Curry',                 calories: 88,  protein: 9.6,  carbs: 2.4, fat: 4.4, fiber: 0.4, servingSize: 250, servingUnit: '1 cup' },
  // Boiled egg: 1 whole ≈ 50g, 78 kcal → per 100g = 156 kcal
  { fdcId: 'ind_boiled_egg',   name: 'Boiled Egg',                 calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6,fiber: 0,   servingSize: 50,  servingUnit: '1 whole' },

  // ── Dairy & Protein — per 100g ────────────────────────────────────────────
  { fdcId: 'ind_paneer',       name: 'Paneer',                     calories: 265, protein: 18,   carbs: 3,   fat: 20,  fiber: 0   },
  { fdcId: 'ind_curd',         name: 'Curd / Plain Yogurt',        calories: 61,  protein: 3.5,  carbs: 4.7, fat: 3.3, fiber: 0   },
  // Sweet Lassi: 1 glass ≈ 300ml, 180 kcal → per 100g = 60 kcal
  { fdcId: 'ind_lassi',        name: 'Sweet Lassi',                calories: 60,  protein: 1.7,  carbs: 10.7,fat: 1.2, fiber: 0,   servingSize: 300, servingUnit: '1 glass' },
  // Masala chai: 1 cup ≈ 150ml, 80 kcal → per 100g = 53 kcal
  { fdcId: 'ind_chai',         name: 'Masala Chai with Milk',      calories: 53,  protein: 1.7,  carbs: 8,   fat: 1.3, fiber: 0,   servingSize: 150, servingUnit: '1 cup' },
  { fdcId: 'ind_whey',         name: 'Whey Protein Powder',        calories: 400, protein: 80,   carbs: 10,  fat: 5,   fiber: 0,   servingSize: 30,  servingUnit: '1 scoop (30g)' },

  // ── Millets — per 100g (cooked) ───────────────────────────────────────────
  { fdcId: 'ind_kambu',        name: 'Kambu (Pearl Millet) porridge', calories: 115, protein: 3,  carbs: 23,  fat: 1,   fiber: 2.5 },
  { fdcId: 'ind_ragi',         name: 'Ragi Kali (Finger Millet)',    calories: 120, protein: 3,   carbs: 25,  fat: 0.5, fiber: 3   },
  { fdcId: 'ind_varagu',       name: 'Varagu (Kodo Millet)',          calories: 110, protein: 2.9, carbs: 22,  fat: 0.9, fiber: 2   },
  { fdcId: 'ind_kuthiraivali', name: 'Kuthiraivali (Barnyard Millet)',calories: 105, protein: 3.5, carbs: 20,  fat: 0.8, fiber: 3   },
  { fdcId: 'ind_kavuni',       name: 'Kavuni Arisi (Black Rice)',     calories: 130, protein: 3,   carbs: 28,  fat: 0.5, fiber: 2.5 },

  // ── Fruits & Snacks — per 100g ────────────────────────────────────────────
  { fdcId: 'ind_mango',        name: 'Mango',                      calories: 60,  protein: 0.8,  carbs: 15,  fat: 0.4, fiber: 1.6, servingSize: 165, servingUnit: '1 cup cubed' },
  { fdcId: 'ind_peanuts',      name: 'Roasted Peanuts',            calories: 567, protein: 25,   carbs: 16,  fat: 49,  fiber: 9,   servingSize: 30,  servingUnit: '30g handful' },
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
