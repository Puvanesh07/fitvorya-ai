// ── Meal Plan Engine ──────────────────────────────────────────────────────────
// Generates meal plans for Pregnancy, Baby, and Family from the real food DB.
// The food database (LOCAL_FOOD_DB) is the source of truth for all nutritional
// data. No dummy calories — every meal's macros are computed from real foods.
//
// Architecture:
//   1. MEAL_TEMPLATES maps context (pregnancy/baby/family) + preference + diet
//      to named meal combos  e.g. { name: 'Idli + Sambar', foods: [...fdcIds] }
//   2. Each template references fdcIds from LOCAL_FOOD_DB
//   3. The engine looks up each food, sums macros, and returns a MealSlotPlan
//   4. No randomness repeat: a shuffle-without-replacement pool resets weekly

import { LOCAL_FOOD_DB } from './foodService'
import type { UnifiedFood } from '../types/food'
import type { MealSlotPlan, MealPlanFood } from '../types/food'

// ── Lookup ────────────────────────────────────────────────────────────────────
const FOOD_MAP = new Map<string, UnifiedFood>(LOCAL_FOOD_DB.map(f => [f.fdcId, f]))

function getFood(fdcId: string): UnifiedFood | null {
  return FOOD_MAP.get(fdcId) ?? null
}

function r1(v: number) { return Math.round(v * 10) / 10 }

function scaleAndSum(items: { fdcId: string; grams: number }[]): {
  foods: MealPlanFood[]
  calories: number; protein: number; carbs: number; fat: number; fiber: number
} {
  let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0
  const foods: MealPlanFood[] = []

  for (const { fdcId, grams } of items) {
    const food = getFood(fdcId)
    if (!food) continue
    const f = grams / 100
    calories += food.calories * f
    protein  += food.protein  * f
    carbs    += food.carbs    * f
    fat      += food.fat      * f
    fiber    += (food.fiber ?? 0) * f
    foods.push({ food, grams })
  }

  return {
    foods,
    calories: Math.round(calories),
    protein:  r1(protein),
    carbs:    r1(carbs),
    fat:      r1(fat),
    fiber:    r1(fiber),
  }
}

// ── Template types ────────────────────────────────────────────────────────────
interface MealTemplate {
  name:      string
  emoji:     string
  items:     { fdcId: string; grams: number }[]
  nutrients: string[]
  tags:      string[]   // 'veg', 'nonveg', 'vegan', 'tamil', 'global', 'baby_safe', etc.
}

// ── Shuffle without replacement ───────────────────────────────────────────────
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWithoutRepeat<T>(pool: T[], count: number): T[] {
  if (pool.length === 0) return []
  const result: T[] = []
  const shuffledPool = shuffled(pool)
  for (let i = 0; i < count; i++) {
    result.push(shuffledPool[i % shuffledPool.length])
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PREGNANCY MEAL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const PREGNANCY_TEMPLATES: Record<'breakfast' | 'lunch' | 'snack' | 'dinner', MealTemplate[]> = {
  breakfast: [
    // ── Tamil vegetarian
    {
      name: 'Ragi Dosa + Sambar + Coconut Chutney',
      emoji: '🥞',
      items: [{ fdcId: 'loc_ragi_dosa', grams: 160 }, { fdcId: 'loc_sambar', grams: 150 }, { fdcId: 'loc_coconut_chut', grams: 40 }],
      nutrients: ['Calcium', 'Iron', 'Fibre'],
      tags: ['veg', 'vegan', 'tamil'],
    },
    {
      name: 'Kambu Koozh + Curd + Banana',
      emoji: '🥣',
      items: [{ fdcId: 'loc_kambu_koozh', grams: 300 }, { fdcId: 'loc_curd', grams: 100 }, { fdcId: 'f12', grams: 100 }],
      nutrients: ['Iron', 'Probiotics', 'Potassium'],
      tags: ['veg', 'tamil'],
    },
    {
      name: 'Idli + Sambar + Coconut Chutney',
      emoji: '🫓',
      items: [{ fdcId: 'loc_idli', grams: 135 }, { fdcId: 'loc_sambar', grams: 200 }, { fdcId: 'loc_coconut_chut', grams: 40 }],
      nutrients: ['Protein', 'Folate', 'Fibre'],
      tags: ['veg', 'vegan', 'tamil'],
    },
    {
      name: 'Ragi Porridge + Banana + Almonds',
      emoji: '🥣',
      items: [{ fdcId: 'loc_ragi_porridge', grams: 250 }, { fdcId: 'f12', grams: 100 }, { fdcId: 'f9', grams: 20 }],
      nutrients: ['Calcium', 'Potassium', 'Vitamin E'],
      tags: ['veg', 'vegan', 'tamil'],
    },
    {
      name: 'Ven Pongal + Sambar + Pickle',
      emoji: '🍲',
      items: [{ fdcId: 'loc_pongal', grams: 200 }, { fdcId: 'loc_sambar', grams: 200 }],
      nutrients: ['Protein', 'Iron', 'B vitamins'],
      tags: ['veg', 'tamil'],
    },
    {
      name: 'Poha + Peanuts + Coconut Water',
      emoji: '🥣',
      items: [{ fdcId: 'loc_poha', grams: 200 }, { fdcId: 'loc_peanuts', grams: 20 }, { fdcId: 'loc_coconut_water', grams: 200 }],
      nutrients: ['Iron', 'Protein', 'Electrolytes'],
      tags: ['veg', 'vegan', 'tamil', 'global'],
    },
    // ── Global
    {
      name: 'Oatmeal + Banana + Almonds',
      emoji: '🥣',
      items: [{ fdcId: 'f4', grams: 60 }, { fdcId: 'f12', grams: 100 }, { fdcId: 'f9', grams: 20 }],
      nutrients: ['Iron', 'Fibre', 'Vitamin E'],
      tags: ['veg', 'vegan', 'global'],
    },
    {
      name: 'Scrambled Eggs + Whole Grain Toast + Apple',
      emoji: '🍳',
      items: [{ fdcId: 'f3', grams: 150 }, { fdcId: 'f14', grams: 60 }, { fdcId: 'f11', grams: 150 }],
      nutrients: ['Protein', 'Choline', 'Fibre'],
      tags: ['nonveg', 'global'],
    },
    {
      name: 'Greek Yogurt + Pomegranate + Almonds',
      emoji: '🥗',
      items: [{ fdcId: 'f5', grams: 150 }, { fdcId: 'loc_pomegranate', grams: 80 }, { fdcId: 'f9', grams: 20 }],
      nutrients: ['Calcium', 'Iron', 'Protein'],
      tags: ['veg', 'global'],
    },
    {
      name: 'Whole Wheat Toast + Avocado + Boiled Egg',
      emoji: '🍞',
      items: [{ fdcId: 'f14', grams: 60 }, { fdcId: 'f3', grams: 100 }],
      nutrients: ['Healthy Fats', 'Protein', 'Folate'],
      tags: ['nonveg', 'global'],
    },
    {
      name: 'Uttapam + Tomato Chutney + Curd',
      emoji: '🥞',
      items: [{ fdcId: 'loc_uttapam', grams: 240 }, { fdcId: 'loc_tomato_chut', grams: 40 }, { fdcId: 'loc_curd', grams: 100 }],
      nutrients: ['Protein', 'Probiotics', 'Calcium'],
      tags: ['veg', 'tamil'],
    },
    // ── Non-veg breakfast
    {
      name: 'Egg Dosa + Sambar',
      emoji: '🥚',
      items: [{ fdcId: 'loc_dosa', grams: 80 }, { fdcId: 'f3', grams: 100 }, { fdcId: 'loc_sambar', grams: 150 }],
      nutrients: ['Protein', 'Choline', 'Folate'],
      tags: ['nonveg', 'tamil'],
    },
    {
      name: 'Ragi Porridge + Boiled Egg + Guava',
      emoji: '🥣',
      items: [{ fdcId: 'loc_ragi_porridge', grams: 200 }, { fdcId: 'f3', grams: 100 }, { fdcId: 'loc_guava', grams: 100 }],
      nutrients: ['Calcium', 'Protein', 'Vitamin C'],
      tags: ['nonveg', 'tamil'],
    },
  ],
  lunch: [
    {
      name: 'Red Rice + Drumstick Sambar + Spinach Kootu + Curd',
      emoji: '🍚',
      items: [{ fdcId: 'loc_red_rice', grams: 200 }, { fdcId: 'loc_sambar', grams: 200 }, { fdcId: 'loc_keerai', grams: 100 }, { fdcId: 'loc_curd', grams: 100 }],
      nutrients: ['Iron', 'Calcium', 'Folate', 'Probiotics'],
      tags: ['veg', 'tamil'],
    },
    {
      name: 'Red Rice + Fish Curry + Drumstick Sambar',
      emoji: '🍚',
      items: [{ fdcId: 'loc_red_rice', grams: 200 }, { fdcId: 'loc_fish_curry', grams: 200 }, { fdcId: 'loc_sambar', grams: 150 }],
      nutrients: ['Omega-3', 'Iron', 'Calcium'],
      tags: ['nonveg', 'tamil'],
    },
    {
      name: 'Chapati + Dal + Spinach Sabzi',
      emoji: '🫓',
      items: [{ fdcId: 'loc_chapati', grams: 120 }, { fdcId: 'loc_dal_tadka', grams: 200 }, { fdcId: 'loc_keerai', grams: 100 }],
      nutrients: ['Protein', 'Iron', 'Fibre'],
      tags: ['veg', 'vegan', 'global', 'tamil'],
    },
    {
      name: 'Rice + Chicken Curry + Spinach Dal',
      emoji: '🍗',
      items: [{ fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_chicken_curry', grams: 200 }, { fdcId: 'loc_keerai', grams: 80 }],
      nutrients: ['Protein', 'Iron', 'B12'],
      tags: ['nonveg', 'tamil', 'global'],
    },
    {
      name: 'Khichdi + Curd + Pickle',
      emoji: '🥣',
      items: [{ fdcId: 'loc_khichdi', grams: 300 }, { fdcId: 'loc_curd', grams: 150 }],
      nutrients: ['Protein', 'Probiotics', 'Fibre'],
      tags: ['veg', 'tamil', 'global'],
    },
    {
      name: 'Lentil Soup + Brown Rice + Beetroot Salad',
      emoji: '🥣',
      items: [{ fdcId: 'loc_toor_dal', grams: 200 }, { fdcId: 'f2', grams: 200 }, { fdcId: 'loc_keerai_b', grams: 100 }],
      nutrients: ['Protein', 'Iron', 'Fibre'],
      tags: ['veg', 'vegan', 'global'],
    },
    {
      name: 'Quinoa Salad + Grilled Chicken',
      emoji: '🥗',
      items: [{ fdcId: 'f1', grams: 150 }, { fdcId: 'f8', grams: 100 }, { fdcId: 'loc_keerai', grams: 80 }],
      nutrients: ['Complete Protein', 'Iron', 'Vitamins'],
      tags: ['nonveg', 'global'],
    },
    {
      name: 'Chole + Chapati + Raita',
      emoji: '🫘',
      items: [{ fdcId: 'loc_chole', grams: 200 }, { fdcId: 'loc_chapati', grams: 80 }, { fdcId: 'loc_curd', grams: 100 }],
      nutrients: ['Protein', 'Fibre', 'Calcium'],
      tags: ['veg', 'vegan', 'global', 'tamil'],
    },
    {
      name: 'Rajma + Rice + Curd',
      emoji: '🫘',
      items: [{ fdcId: 'loc_rajma', grams: 200 }, { fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_curd', grams: 100 }],
      nutrients: ['Protein', 'Iron', 'Probiotics'],
      tags: ['veg', 'global'],
    },
    {
      name: 'Egg Curry + Rice + Carrot Salad',
      emoji: '🥚',
      items: [{ fdcId: 'loc_egg_curry', grams: 200 }, { fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_carrot', grams: 80 }],
      nutrients: ['Protein', 'Choline', 'Vitamin A'],
      tags: ['nonveg', 'tamil', 'global'],
    },
  ],
  snack: [
    {
      name: 'Sundal + Banana',
      emoji: '🫘',
      items: [{ fdcId: 'loc_sundal', grams: 150 }, { fdcId: 'f12', grams: 100 }],
      nutrients: ['Protein', 'Fibre', 'Potassium'],
      tags: ['veg', 'vegan', 'tamil'],
    },
    {
      name: 'Almonds + Pomegranate',
      emoji: '🌰',
      items: [{ fdcId: 'f9', grams: 30 }, { fdcId: 'loc_pomegranate', grams: 100 }],
      nutrients: ['Vitamin E', 'Iron', 'Antioxidants'],
      tags: ['veg', 'vegan', 'global', 'tamil'],
    },
    {
      name: 'Ragi Ladoo + Coconut Water',
      emoji: '🧆',
      items: [{ fdcId: 'loc_ragi_ladoo', grams: 80 }, { fdcId: 'loc_coconut_water', grams: 250 }],
      nutrients: ['Calcium', 'Electrolytes', 'Iron'],
      tags: ['veg', 'tamil'],
    },
    {
      name: 'Greek Yogurt + Guava',
      emoji: '🥛',
      items: [{ fdcId: 'f5', grams: 150 }, { fdcId: 'loc_guava', grams: 100 }],
      nutrients: ['Calcium', 'Vitamin C', 'Protein'],
      tags: ['veg', 'global'],
    },
    {
      name: 'Boiled Eggs + Apple',
      emoji: '🥚',
      items: [{ fdcId: 'f3', grams: 100 }, { fdcId: 'f11', grams: 150 }],
      nutrients: ['Protein', 'Choline', 'Fibre'],
      tags: ['nonveg', 'global'],
    },
    {
      name: 'Moong Dal Chaat + Coconut Water',
      emoji: '🫘',
      items: [{ fdcId: 'loc_moong_dal', grams: 150 }, { fdcId: 'loc_coconut_water', grams: 250 }],
      nutrients: ['Protein', 'Folate', 'Electrolytes'],
      tags: ['veg', 'vegan', 'tamil'],
    },
    {
      name: 'Papaya + Curd',
      emoji: '🍈',
      items: [{ fdcId: 'loc_papaya', grams: 200 }, { fdcId: 'loc_curd', grams: 100 }],
      nutrients: ['Vitamin A', 'Vitamin C', 'Probiotics'],
      tags: ['veg', 'tamil', 'global'],
    },
    {
      name: 'Peanuts + Banana + Coconut Water',
      emoji: '🥜',
      items: [{ fdcId: 'loc_peanuts', grams: 30 }, { fdcId: 'f12', grams: 100 }, { fdcId: 'loc_coconut_water', grams: 200 }],
      nutrients: ['Protein', 'Potassium', 'Magnesium'],
      tags: ['veg', 'vegan', 'tamil'],
    },
  ],
  dinner: [
    {
      name: 'Kambu Roti + Dal + Bhindi Sabzi',
      emoji: '🫓',
      items: [{ fdcId: 'loc_chapati', grams: 120 }, { fdcId: 'loc_dal_fry', grams: 200 }, { fdcId: 'loc_bhindi', grams: 100 }],
      nutrients: ['Iron', 'Protein', 'Fibre'],
      tags: ['veg', 'vegan', 'tamil'],
    },
    {
      name: 'Idli + Drumstick Sambar + Coconut Chutney',
      emoji: '🫓',
      items: [{ fdcId: 'loc_idli', grams: 135 }, { fdcId: 'loc_sambar', grams: 200 }, { fdcId: 'loc_coconut_chut', grams: 40 }],
      nutrients: ['Folate', 'Calcium', 'Iron'],
      tags: ['veg', 'vegan', 'tamil'],
    },
    {
      name: 'Upma + Curd + Mixed Fruit',
      emoji: '🥣',
      items: [{ fdcId: 'loc_upma', grams: 200 }, { fdcId: 'loc_curd', grams: 100 }, { fdcId: 'f12', grams: 100 }],
      nutrients: ['Fibre', 'Probiotics', 'Potassium'],
      tags: ['veg', 'tamil'],
    },
    {
      name: 'Grilled Chicken + Sweet Potato + Broccoli',
      emoji: '🍗',
      items: [{ fdcId: 'f1', grams: 150 }, { fdcId: 'f7', grams: 150 }, { fdcId: 'f8', grams: 100 }],
      nutrients: ['Protein', 'Vitamin A', 'Vitamin C'],
      tags: ['nonveg', 'global'],
    },
    {
      name: 'Salmon + Brown Rice + Spinach',
      emoji: '🐟',
      items: [{ fdcId: 'f6', grams: 150 }, { fdcId: 'f2', grams: 150 }, { fdcId: 'loc_keerai', grams: 100 }],
      nutrients: ['Omega-3', 'Iron', 'Complete Protein'],
      tags: ['nonveg', 'global'],
    },
    {
      name: 'Paneer Curry + Chapati + Curd',
      emoji: '🧀',
      items: [{ fdcId: 'loc_paneer_curry', grams: 200 }, { fdcId: 'loc_chapati', grams: 80 }, { fdcId: 'loc_curd', grams: 100 }],
      nutrients: ['Calcium', 'Protein', 'Iron'],
      tags: ['veg', 'global', 'tamil'],
    },
    {
      name: 'Egg Curry + Ragi Dosa + Curd',
      emoji: '🥚',
      items: [{ fdcId: 'loc_egg_curry', grams: 200 }, { fdcId: 'loc_ragi_dosa', grams: 160 }, { fdcId: 'loc_curd', grams: 100 }],
      nutrients: ['Protein', 'Calcium', 'Choline'],
      tags: ['nonveg', 'tamil'],
    },
    {
      name: 'Rice + Mutton Curry + Spinach Kootu',
      emoji: '🍚',
      items: [{ fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_mutton_curry', grams: 150 }, { fdcId: 'loc_keerai', grams: 100 }],
      nutrients: ['Iron', 'Protein', 'Folate'],
      tags: ['nonveg', 'tamil'],
    },
    {
      name: 'Vegetable Biryani + Raita + Boiled Egg',
      emoji: '🍚',
      items: [{ fdcId: 'loc_veg_biryani', grams: 300 }, { fdcId: 'loc_curd', grams: 100 }, { fdcId: 'f3', grams: 100 }],
      nutrients: ['Protein', 'Carbs', 'Probiotics'],
      tags: ['nonveg', 'global', 'tamil'],
    },
    {
      name: 'Dal + Brown Rice + Beetroot Poriyal',
      emoji: '🍲',
      items: [{ fdcId: 'loc_dal_tadka', grams: 200 }, { fdcId: 'f2', grams: 200 }, { fdcId: 'loc_keerai_b', grams: 100 }],
      nutrients: ['Protein', 'Iron', 'Fibre'],
      tags: ['veg', 'vegan', 'global'],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// BABY MEAL TEMPLATES — grouped by age stage
// ─────────────────────────────────────────────────────────────────────────────
export type BabyStage = 'months_6_9' | 'months_9_12' | 'years_1_2' | 'years_2_3'

interface BabyMealTemplate extends MealTemplate {
  texture: string
  stage:   BabyStage[]
}

const BABY_TEMPLATES: Record<'breakfast' | 'morningSnack' | 'lunch' | 'eveningSnack' | 'dinner', BabyMealTemplate[]> = {
  breakfast: [
    { name: 'Rice Porridge (Kanji)', emoji: '🥣', items: [{ fdcId: 'loc_rice_porridge', grams: 150 }], nutrients: ['Carbohydrates', 'Easy digest'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9'] },
    { name: 'Ragi Malt Porridge', emoji: '🥣', items: [{ fdcId: 'loc_ragi_malt', grams: 150 }], nutrients: ['Calcium', 'Iron', 'Fibre'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Ragi Porridge + Banana Puree', emoji: '🥣', items: [{ fdcId: 'loc_ragi_porridge', grams: 120 }, { fdcId: 'loc_banana_puri', grams: 80 }], nutrients: ['Calcium', 'Potassium', 'Iron'], tags: ['veg', 'vegan'], texture: 'mash', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Oatmeal + Banana (mashed)', emoji: '🥣', items: [{ fdcId: 'f4', grams: 30 }, { fdcId: 'f12', grams: 80 }], nutrients: ['Iron', 'Fibre', 'Potassium'], tags: ['veg', 'vegan'], texture: 'mash', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Soft Idli + Sambar', emoji: '🫓', items: [{ fdcId: 'loc_idli', grams: 90 }, { fdcId: 'loc_sambar', grams: 80 }], nutrients: ['Protein', 'Carbs', 'Iron'], tags: ['veg', 'vegan'], texture: 'soft_lumps', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Idli + Sambar + Curd', emoji: '🫓', items: [{ fdcId: 'loc_idli', grams: 135 }, { fdcId: 'loc_sambar', grams: 100 }, { fdcId: 'loc_curd', grams: 80 }], nutrients: ['Protein', 'Probiotics', 'Calcium'], tags: ['veg'], texture: 'finger_foods', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Ragi Dosa + Coconut Chutney', emoji: '🥞', items: [{ fdcId: 'loc_ragi_dosa', grams: 80 }, { fdcId: 'loc_coconut_chut', grams: 30 }], nutrients: ['Calcium', 'Iron', 'Protein'], tags: ['veg', 'vegan'], texture: 'finger_foods', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Ven Pongal', emoji: '🍲', items: [{ fdcId: 'loc_pongal', grams: 200 }], nutrients: ['Protein', 'Carbs', 'Zinc'], tags: ['veg'], texture: 'finger_foods', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Scrambled Egg + Roti (soft)', emoji: '🍳', items: [{ fdcId: 'f3', grams: 100 }, { fdcId: 'loc_chapati', grams: 40 }], nutrients: ['Protein', 'Choline', 'Iron'], tags: ['nonveg'], texture: 'family_foods', stage: ['years_2_3'] },
  ],
  morningSnack: [
    { name: 'Banana Puree', emoji: '🍌', items: [{ fdcId: 'loc_banana_puri', grams: 80 }], nutrients: ['Potassium', 'B6', 'Energy'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Sweet Potato Puree', emoji: '🍠', items: [{ fdcId: 'loc_sweet_pot_pur', grams: 100 }], nutrients: ['Vitamin A', 'Fibre', 'Potassium'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Mashed Banana + Curd', emoji: '🍌', items: [{ fdcId: 'f12', grams: 100 }, { fdcId: 'loc_curd', grams: 80 }], nutrients: ['Potassium', 'Calcium', 'Probiotics'], tags: ['veg'], texture: 'mash', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Mashed Papaya', emoji: '🍈', items: [{ fdcId: 'loc_papaya', grams: 120 }], nutrients: ['Vitamin A', 'Vitamin C', 'Digestive enzymes'], tags: ['veg', 'vegan'], texture: 'mash', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Soft Banana Pieces', emoji: '🍌', items: [{ fdcId: 'f12', grams: 100 }], nutrients: ['Potassium', 'B6', 'Energy'], tags: ['veg', 'vegan'], texture: 'finger_foods', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Apple + Curd', emoji: '🍎', items: [{ fdcId: 'f11', grams: 100 }, { fdcId: 'loc_curd', grams: 80 }], nutrients: ['Vitamin C', 'Fibre', 'Calcium'], tags: ['veg'], texture: 'soft_lumps', stage: ['years_1_2', 'years_2_3'] },
  ],
  lunch: [
    { name: 'Dal Rice (soft)', emoji: '🍚', items: [{ fdcId: 'loc_dal_rice', grams: 150 }], nutrients: ['Protein', 'Iron', 'Carbs'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Sweet Potato + Moong Dal Puree', emoji: '🍠', items: [{ fdcId: 'loc_sweet_pot_pur', grams: 80 }, { fdcId: 'loc_moong_dal', grams: 100 }], nutrients: ['Vitamin A', 'Protein', 'Iron'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Khichdi + Carrot Mash', emoji: '🥣', items: [{ fdcId: 'loc_khichdi', grams: 150 }, { fdcId: 'loc_carrot', grams: 80 }], nutrients: ['Protein', 'Vitamin A', 'Fibre'], tags: ['veg', 'vegan'], texture: 'mash', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Rice + Sambar + Curd', emoji: '🍚', items: [{ fdcId: 'loc_white_rice', grams: 150 }, { fdcId: 'loc_sambar', grams: 100 }, { fdcId: 'loc_curd', grams: 80 }], nutrients: ['Protein', 'Probiotics', 'Folate'], tags: ['veg'], texture: 'soft_lumps', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Rice + Dal + Bhindi Sabzi', emoji: '🍚', items: [{ fdcId: 'loc_white_rice', grams: 150 }, { fdcId: 'loc_dal_tadka', grams: 150 }, { fdcId: 'loc_bhindi', grams: 80 }], nutrients: ['Protein', 'Fibre', 'Iron'], tags: ['veg', 'vegan'], texture: 'family_foods', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Chicken Rice Khichdi (soft)', emoji: '🍗', items: [{ fdcId: 'loc_white_rice', grams: 120 }, { fdcId: 'f1', grams: 80 }], nutrients: ['Protein', 'Iron', 'B12'], tags: ['nonveg'], texture: 'soft_lumps', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Chicken + Rice + Vegetable', emoji: '🍗', items: [{ fdcId: 'f1', grams: 100 }, { fdcId: 'loc_white_rice', grams: 150 }, { fdcId: 'loc_carrot', grams: 80 }], nutrients: ['Protein', 'Iron', 'Vitamin A'], tags: ['nonveg'], texture: 'family_foods', stage: ['years_2_3'] },
    { name: 'Fish Rice (mashed)', emoji: '🐟', items: [{ fdcId: 'loc_white_rice', grams: 120 }, { fdcId: 'loc_fish_curry', grams: 100 }], nutrients: ['Omega-3', 'Protein', 'Vitamin D'], tags: ['nonveg'], texture: 'mash', stage: ['months_9_12', 'years_1_2'] },
  ],
  eveningSnack: [
    { name: 'Mashed Banana', emoji: '🍌', items: [{ fdcId: 'f12', grams: 80 }], nutrients: ['Potassium', 'Energy', 'B6'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Ragi Porridge', emoji: '🥣', items: [{ fdcId: 'loc_ragi_porridge', grams: 120 }], nutrients: ['Calcium', 'Iron', 'Fibre'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Apple Puree', emoji: '🍎', items: [{ fdcId: 'f11', grams: 100 }], nutrients: ['Vitamin C', 'Fibre', 'Antioxidants'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Soft Fruits + Curd', emoji: '🍓', items: [{ fdcId: 'loc_papaya', grams: 80 }, { fdcId: 'loc_curd', grams: 80 }], nutrients: ['Vitamin C', 'Calcium', 'Probiotics'], tags: ['veg'], texture: 'soft_lumps', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Coconut Water + Banana', emoji: '🥥', items: [{ fdcId: 'loc_coconut_water', grams: 150 }, { fdcId: 'f12', grams: 80 }], nutrients: ['Electrolytes', 'Potassium', 'Hydration'], tags: ['veg', 'vegan'], texture: 'finger_foods', stage: ['years_1_2', 'years_2_3'] },
  ],
  dinner: [
    { name: 'Dal Rice Porridge', emoji: '🥣', items: [{ fdcId: 'loc_dal_rice', grams: 150 }], nutrients: ['Protein', 'Iron', 'Carbs'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Ragi Kanji + Dal', emoji: '🥣', items: [{ fdcId: 'loc_ragi_porridge', grams: 120 }, { fdcId: 'loc_moong_dal', grams: 80 }], nutrients: ['Calcium', 'Protein', 'Iron'], tags: ['veg', 'vegan'], texture: 'puree', stage: ['months_6_9', 'months_9_12'] },
    { name: 'Khichdi + Curd', emoji: '🥣', items: [{ fdcId: 'loc_khichdi', grams: 200 }, { fdcId: 'loc_curd', grams: 80 }], nutrients: ['Protein', 'Probiotics', 'Carbs'], tags: ['veg'], texture: 'mash', stage: ['months_9_12', 'years_1_2'] },
    { name: 'Idli + Sambar (soft)', emoji: '🫓', items: [{ fdcId: 'loc_idli', grams: 90 }, { fdcId: 'loc_sambar', grams: 100 }], nutrients: ['Protein', 'Folate', 'Iron'], tags: ['veg', 'vegan'], texture: 'soft_lumps', stage: ['months_9_12', 'years_1_2', 'years_2_3'] },
    { name: 'Rice + Dal + Vegetable', emoji: '🍚', items: [{ fdcId: 'loc_white_rice', grams: 150 }, { fdcId: 'loc_dal_tadka', grams: 150 }, { fdcId: 'loc_keerai', grams: 60 }], nutrients: ['Protein', 'Iron', 'Fibre'], tags: ['veg', 'vegan'], texture: 'family_foods', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Chapati + Dal + Curd', emoji: '🫓', items: [{ fdcId: 'loc_chapati', grams: 80 }, { fdcId: 'loc_dal_fry', grams: 150 }, { fdcId: 'loc_curd', grams: 80 }], nutrients: ['Protein', 'Calcium', 'Iron'], tags: ['veg'], texture: 'family_foods', stage: ['years_1_2', 'years_2_3'] },
    { name: 'Chicken Khichdi', emoji: '🍗', items: [{ fdcId: 'loc_white_rice', grams: 120 }, { fdcId: 'f1', grams: 100 }, { fdcId: 'loc_carrot', grams: 60 }], nutrients: ['Protein', 'Iron', 'Vitamin A'], tags: ['nonveg'], texture: 'soft_lumps', stage: ['months_9_12', 'years_1_2'] },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY MEAL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const FAMILY_TEMPLATES: Record<'breakfast' | 'lunch' | 'snack' | 'dinner', MealTemplate[]> = {
  breakfast: [
    { name: 'Idli + Sambar + Coconut Chutney', emoji: '🫓', items: [{ fdcId: 'loc_idli', grams: 135 }, { fdcId: 'loc_sambar', grams: 200 }, { fdcId: 'loc_coconut_chut', grams: 40 }], nutrients: ['Protein', 'Fibre', 'Folate'], tags: ['veg', 'vegan', 'tamil'] },
    { name: 'Dosa + Sambar + Chutney', emoji: '🥞', items: [{ fdcId: 'loc_dosa', grams: 160 }, { fdcId: 'loc_sambar', grams: 200 }, { fdcId: 'loc_coconut_chut', grams: 40 }], nutrients: ['Protein', 'Iron', 'Carbs'], tags: ['veg', 'vegan', 'tamil'] },
    { name: 'Ragi Dosa + Coconut Chutney + Curd', emoji: '🥞', items: [{ fdcId: 'loc_ragi_dosa', grams: 160 }, { fdcId: 'loc_coconut_chut', grams: 40 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Calcium', 'Iron', 'Probiotics'], tags: ['veg', 'tamil'] },
    { name: 'Ven Pongal + Sambar', emoji: '🍲', items: [{ fdcId: 'loc_pongal', grams: 200 }, { fdcId: 'loc_sambar', grams: 200 }], nutrients: ['Protein', 'Carbs', 'Zinc'], tags: ['veg', 'tamil'] },
    { name: 'Poha + Peanuts + Coconut Water', emoji: '🥣', items: [{ fdcId: 'loc_poha', grams: 200 }, { fdcId: 'loc_peanuts', grams: 30 }, { fdcId: 'loc_coconut_water', grams: 200 }], nutrients: ['Iron', 'Protein', 'Electrolytes'], tags: ['veg', 'vegan', 'global', 'tamil'] },
    { name: 'Oats + Banana + Almonds + Milk', emoji: '🥣', items: [{ fdcId: 'f4', grams: 60 }, { fdcId: 'f12', grams: 100 }, { fdcId: 'f9', grams: 20 }, { fdcId: 'f13', grams: 200 }], nutrients: ['Fibre', 'Protein', 'Calcium'], tags: ['veg', 'global'] },
    { name: 'Scrambled Eggs + Whole Grain Toast', emoji: '🍳', items: [{ fdcId: 'f3', grams: 150 }, { fdcId: 'f14', grams: 60 }], nutrients: ['Protein', 'Choline', 'B vitamins'], tags: ['nonveg', 'global'] },
    { name: 'Uttapam + Tomato Chutney + Curd', emoji: '🥞', items: [{ fdcId: 'loc_uttapam', grams: 240 }, { fdcId: 'loc_tomato_chut', grams: 40 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Protein', 'Probiotics', 'Calcium'], tags: ['veg', 'tamil'] },
    { name: 'Upma + Coconut Chutney + Banana', emoji: '🥣', items: [{ fdcId: 'loc_upma', grams: 200 }, { fdcId: 'loc_coconut_chut', grams: 40 }, { fdcId: 'f12', grams: 100 }], nutrients: ['Fibre', 'Potassium', 'Iron'], tags: ['veg', 'tamil', 'global'] },
    { name: 'Appam + Coconut Milk + Egg Curry', emoji: '🍮', items: [{ fdcId: 'loc_appam', grams: 120 }, { fdcId: 'loc_coconut_milk', grams: 80 }, { fdcId: 'loc_egg_curry', grams: 150 }], nutrients: ['Protein', 'Healthy Fats', 'Choline'], tags: ['nonveg', 'tamil'] },
  ],
  lunch: [
    { name: 'Red Rice + Sambar + Keerai Kootu + Curd', emoji: '🍚', items: [{ fdcId: 'loc_red_rice', grams: 200 }, { fdcId: 'loc_sambar', grams: 200 }, { fdcId: 'loc_keerai', grams: 100 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Iron', 'Calcium', 'Probiotics'], tags: ['veg', 'tamil'] },
    { name: 'Rice + Fish Curry + Rasam', emoji: '🍚', items: [{ fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_fish_curry', grams: 200 }, { fdcId: 'loc_rasam', grams: 200 }], nutrients: ['Omega-3', 'Protein', 'Iron'], tags: ['nonveg', 'tamil'] },
    { name: 'Rice + Chicken Curry + Dal + Curd', emoji: '🍗', items: [{ fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_chicken_curry', grams: 200 }, { fdcId: 'loc_dal_tadka', grams: 150 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Protein', 'Iron', 'Probiotics'], tags: ['nonveg', 'tamil'] },
    { name: 'Chapati + Chole + Raita', emoji: '🫓', items: [{ fdcId: 'loc_chapati', grams: 120 }, { fdcId: 'loc_chole', grams: 200 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Protein', 'Fibre', 'Calcium'], tags: ['veg', 'global', 'tamil'] },
    { name: 'Chapati + Rajma + Curd', emoji: '🫓', items: [{ fdcId: 'loc_chapati', grams: 120 }, { fdcId: 'loc_rajma', grams: 200 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Protein', 'Iron', 'Fibre'], tags: ['veg', 'global'] },
    { name: 'Rice + Mutton Curry + Drumstick Sambar', emoji: '🍚', items: [{ fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_mutton_curry', grams: 150 }, { fdcId: 'loc_sambar', grams: 150 }], nutrients: ['Iron', 'Protein', 'Fibre'], tags: ['nonveg', 'tamil'] },
    { name: 'Vegetable Biryani + Raita', emoji: '🍚', items: [{ fdcId: 'loc_veg_biryani', grams: 300 }, { fdcId: 'loc_curd', grams: 150 }], nutrients: ['Carbs', 'Protein', 'Probiotics'], tags: ['veg', 'global', 'tamil'] },
    { name: 'Dal Khichdi + Pickle + Curd', emoji: '🥣', items: [{ fdcId: 'loc_khichdi', grams: 300 }, { fdcId: 'loc_curd', grams: 150 }], nutrients: ['Protein', 'Fibre', 'Probiotics'], tags: ['veg', 'global', 'tamil'] },
    { name: 'Brown Rice + Egg Curry + Spinach', emoji: '🍚', items: [{ fdcId: 'f2', grams: 200 }, { fdcId: 'loc_egg_curry', grams: 200 }, { fdcId: 'loc_keerai', grams: 80 }], nutrients: ['Protein', 'Iron', 'Choline'], tags: ['nonveg', 'global'] },
  ],
  snack: [
    { name: 'Sundal + Coconut Water', emoji: '🫘', items: [{ fdcId: 'loc_sundal', grams: 150 }, { fdcId: 'loc_coconut_water', grams: 250 }], nutrients: ['Protein', 'Fibre', 'Electrolytes'], tags: ['veg', 'vegan', 'tamil'] },
    { name: 'Ragi Ladoo + Milk', emoji: '🧆', items: [{ fdcId: 'loc_ragi_ladoo', grams: 80 }, { fdcId: 'f13', grams: 200 }], nutrients: ['Calcium', 'Iron', 'Protein'], tags: ['veg', 'tamil'] },
    { name: 'Almonds + Pomegranate', emoji: '🌰', items: [{ fdcId: 'f9', grams: 30 }, { fdcId: 'loc_pomegranate', grams: 100 }], nutrients: ['Vitamin E', 'Iron', 'Antioxidants'], tags: ['veg', 'vegan', 'global', 'tamil'] },
    { name: 'Moong Dal Chaat + Coconut Water', emoji: '🫘', items: [{ fdcId: 'loc_moong_dal', grams: 150 }, { fdcId: 'loc_coconut_water', grams: 250 }], nutrients: ['Protein', 'Folate', 'Electrolytes'], tags: ['veg', 'vegan', 'tamil'] },
    { name: 'Greek Yogurt + Fruits', emoji: '🥛', items: [{ fdcId: 'f5', grams: 150 }, { fdcId: 'f11', grams: 150 }], nutrients: ['Calcium', 'Protein', 'Vitamin C'], tags: ['veg', 'global'] },
    { name: 'Boiled Eggs + Apple', emoji: '🥚', items: [{ fdcId: 'f3', grams: 100 }, { fdcId: 'f11', grams: 150 }], nutrients: ['Protein', 'Choline', 'Fibre'], tags: ['nonveg', 'global'] },
    { name: 'Peanuts + Banana', emoji: '🥜', items: [{ fdcId: 'loc_peanuts', grams: 40 }, { fdcId: 'f12', grams: 100 }], nutrients: ['Protein', 'Potassium', 'Magnesium'], tags: ['veg', 'vegan', 'global', 'tamil'] },
    { name: 'Buttermilk + Murukku', emoji: '🥛', items: [{ fdcId: 'loc_buttermilk', grams: 250 }, { fdcId: 'loc_murukku', grams: 30 }], nutrients: ['Probiotics', 'Calcium', 'Electrolytes'], tags: ['veg', 'tamil'] },
  ],
  dinner: [
    { name: 'Idli + Sambar + Coconut Chutney', emoji: '🫓', items: [{ fdcId: 'loc_idli', grams: 135 }, { fdcId: 'loc_sambar', grams: 200 }, { fdcId: 'loc_coconut_chut', grams: 40 }], nutrients: ['Protein', 'Folate', 'Fibre'], tags: ['veg', 'vegan', 'tamil'] },
    { name: 'Chapati + Dal + Bhindi Sabzi', emoji: '🫓', items: [{ fdcId: 'loc_chapati', grams: 120 }, { fdcId: 'loc_dal_fry', grams: 200 }, { fdcId: 'loc_bhindi', grams: 100 }], nutrients: ['Protein', 'Iron', 'Fibre'], tags: ['veg', 'vegan', 'global', 'tamil'] },
    { name: 'Grilled Chicken + Sweet Potato + Broccoli', emoji: '🍗', items: [{ fdcId: 'f1', grams: 150 }, { fdcId: 'f7', grams: 150 }, { fdcId: 'f8', grams: 100 }], nutrients: ['Protein', 'Vitamin A', 'Vitamin C'], tags: ['nonveg', 'global'] },
    { name: 'Egg Curry + Ragi Dosa + Curd', emoji: '🥚', items: [{ fdcId: 'loc_egg_curry', grams: 200 }, { fdcId: 'loc_ragi_dosa', grams: 160 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Protein', 'Calcium', 'Probiotics'], tags: ['nonveg', 'tamil'] },
    { name: 'Paneer Curry + Roti + Curd', emoji: '🧀', items: [{ fdcId: 'loc_paneer_curry', grams: 200 }, { fdcId: 'loc_chapati', grams: 80 }, { fdcId: 'loc_curd', grams: 100 }], nutrients: ['Calcium', 'Protein', 'Probiotics'], tags: ['veg', 'global', 'tamil'] },
    { name: 'Upma + Curd + Banana', emoji: '🥣', items: [{ fdcId: 'loc_upma', grams: 200 }, { fdcId: 'loc_curd', grams: 100 }, { fdcId: 'f12', grams: 100 }], nutrients: ['Fibre', 'Probiotics', 'Potassium'], tags: ['veg', 'tamil'] },
    { name: 'Dal + Rice + Spinach', emoji: '🍲', items: [{ fdcId: 'loc_dal_tadka', grams: 200 }, { fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_keerai', grams: 80 }], nutrients: ['Protein', 'Iron', 'Folate'], tags: ['veg', 'vegan', 'global'] },
    { name: 'Fish Curry + Rice + Rasam', emoji: '🐟', items: [{ fdcId: 'loc_fish_curry', grams: 200 }, { fdcId: 'loc_white_rice', grams: 200 }, { fdcId: 'loc_rasam', grams: 200 }], nutrients: ['Omega-3', 'Protein', 'Iron'], tags: ['nonveg', 'tamil'] },
    { name: 'Salmon + Brown Rice + Broccoli', emoji: '🐟', items: [{ fdcId: 'f6', grams: 150 }, { fdcId: 'f2', grams: 150 }, { fdcId: 'f8', grams: 100 }], nutrients: ['Omega-3', 'Protein', 'Vitamin C'], tags: ['nonveg', 'global'] },
    { name: 'Khichdi + Curd + Pickle', emoji: '🥣', items: [{ fdcId: 'loc_khichdi', grams: 300 }, { fdcId: 'loc_curd', grams: 150 }], nutrients: ['Protein', 'Probiotics', 'Fibre'], tags: ['veg', 'global', 'tamil'] },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Diet filter helpers — support MULTI-SELECT diet arrays
// ─────────────────────────────────────────────────────────────────────────────
export type DietType = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'
export type FoodStyle = 'tamil' | 'global' | 'mixed'

/** Convert a diet value (or array) to the set of allowed template tags */
function dietToTags(diet: DietType | DietType[]): string[] {
  const diets = Array.isArray(diet) ? diet : [diet]
  const allowed = new Set<string>()
  for (const d of diets) {
    if (d === 'vegan')          { allowed.add('vegan') }
    if (d === 'vegetarian')     { allowed.add('veg') }
    if (d === 'eggetarian')     { allowed.add('veg'); allowed.add('nonveg') }
    if (d === 'non_vegetarian') { allowed.add('veg'); allowed.add('vegan'); allowed.add('nonveg') }
  }
  return [...allowed]
}

/** True when the template should be excluded for eggetarian (meat items but not eggs) */
function isNonVegMeat(t: MealTemplate): boolean {
  const MEAT_IDS = ['loc_chicken_curry', 'loc_fish_curry', 'loc_mutton_curry', 'loc_biryani', 'f6', 'f10']
  return t.tags.includes('nonveg') && t.items.some(i => MEAT_IDS.includes(i.fdcId))
}

function styleTags(style: FoodStyle, dayIndex: number): string[] {
  if (style === 'tamil')  return ['tamil']
  if (style === 'global') return ['global']
  return dayIndex % 2 === 0 ? ['tamil'] : ['global']
}

function filterTemplates<T extends MealTemplate>(
  templates: T[],
  diet: DietType | DietType[],
  style: FoodStyle,
  dayIndex: number,
): T[] {
  const diets = Array.isArray(diet) ? diet : [diet]
  const dTags = dietToTags(diets)
  const sTags = styleTags(style, dayIndex)
  const eggOnly = diets.length > 0 && diets.every(d => d === 'eggetarian')

  return templates.filter(t => {
    const hasDiet  = t.tags.some(tag => dTags.includes(tag))
    const hasStyle = t.tags.some(tag => sTags.includes(tag))
    // pure-eggetarian: exclude meat non-veg
    if (eggOnly && isNonVegMeat(t)) return false
    return hasDiet && hasStyle
  })
}

function buildSlot(
  slot: MealSlotPlan['slot'],
  label: string,
  emoji: string,
  template: MealTemplate,
): MealSlotPlan {
  const { foods, calories, protein, carbs, fat, fiber } = scaleAndSum(template.items)
  return {
    slot, label, emoji,
    name:        template.name,
    description: template.nutrients.slice(0, 3).join(' · '),
    foods,
    nutrients:   template.nutrients,
    totalCalories: calories,
    totalProtein:  protein,
    totalCarbs:    carbs,
    totalFat:      fat,
    totalFiber:    fiber,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generate pregnancy meal plan
// ─────────────────────────────────────────────────────────────────────────────
export interface PregnancyPlanOptions {
  week:    number
  /** Single diet or multi-select array e.g. ['vegetarian', 'non_vegetarian'] */
  diet:    DietType | DietType[]
  style:   FoodStyle
  days:    number   // 1 or 7
}

export interface PregnancyDayPlan {
  dayLabel:    string
  dayIndex:    number
  breakfast:   MealSlotPlan
  snack:       MealSlotPlan
  lunch:       MealSlotPlan
  dinner:      MealSlotPlan
  totalCalories: number
  waterLiters: number
}

export function generatePregnancyPlan(opts: PregnancyPlanOptions): PregnancyDayPlan[] {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const waterLiters = opts.week >= 29 ? 2.5 : 2.0

  const pools = {
    breakfast: pickWithoutRepeat(filterTemplates(PREGNANCY_TEMPLATES.breakfast, opts.diet, opts.style, 0), opts.days),
    lunch:     pickWithoutRepeat(filterTemplates(PREGNANCY_TEMPLATES.lunch,     opts.diet, opts.style, 0), opts.days),
    snack:     pickWithoutRepeat(filterTemplates(PREGNANCY_TEMPLATES.snack,     opts.diet, opts.style, 0), opts.days),
    dinner:    pickWithoutRepeat(filterTemplates(PREGNANCY_TEMPLATES.dinner,    opts.diet, opts.style, 0), opts.days),
  }

  return Array.from({ length: opts.days }, (_, i) => {
    const breakfast = buildSlot('breakfast',    'Breakfast', '🌅', pools.breakfast[i] ?? pools.breakfast[0])
    const snack     = buildSlot('eveningSnack', 'Snack',     '🍎', pools.snack[i]     ?? pools.snack[0])
    const lunch     = buildSlot('lunch',        'Lunch',     '☀️', pools.lunch[i]     ?? pools.lunch[0])
    const dinner    = buildSlot('dinner',       'Dinner',    '🌙', pools.dinner[i]    ?? pools.dinner[0])
    const total     = breakfast.totalCalories + snack.totalCalories + lunch.totalCalories + dinner.totalCalories
    return { dayLabel: DAYS[i % 7], dayIndex: i, breakfast, snack, lunch, dinner, totalCalories: total, waterLiters }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generate baby meal plan
// ─────────────────────────────────────────────────────────────────────────────
export type BabyDietType = 'vegetarian' | 'non_vegetarian' | 'vegan'

export interface BabyPlanOptions {
  stage: BabyStage
  /** Single diet or multi-select array */
  diet:  BabyDietType | BabyDietType[]
  days:  number
}

export interface BabyDayPlan {
  dayLabel:      string
  dayIndex:      number
  breakfast:     MealSlotPlan
  morningSnack:  MealSlotPlan
  lunch:         MealSlotPlan
  eveningSnack:  MealSlotPlan
  dinner:        MealSlotPlan
  totalCalories: number
  milkFeeds:     string
  waterNote?:    string
  texture:       string
}

function babyDietToTags(diet: BabyDietType | BabyDietType[]): string[] {
  const diets = Array.isArray(diet) ? diet : [diet]
  const allowed = new Set<string>()
  for (const d of diets) {
    if (d === 'vegan')          allowed.add('vegan')
    if (d === 'vegetarian')     allowed.add('veg')
    if (d === 'non_vegetarian') { allowed.add('veg'); allowed.add('vegan'); allowed.add('nonveg') }
  }
  return [...allowed]
}

function filterBaby<T extends BabyMealTemplate>(templates: T[], stage: BabyStage, diet: BabyDietType | BabyDietType[]): T[] {
  const dTags = babyDietToTags(diet)
  return templates.filter(t => t.stage.includes(stage) && t.tags.some(tag => dTags.includes(tag)))
}

const BABY_TEXTURE: Record<BabyStage, string> = {
  months_6_9:  'Smooth puree',
  months_9_12: 'Soft mash / lumps',
  years_1_2:   'Soft finger foods',
  years_2_3:   'Family foods (small pieces)',
}

const BABY_MILK: Record<BabyStage, string> = {
  months_6_9:  'Breast milk or formula on demand (4–6 feeds/day) — solids are complementary',
  months_9_12: 'Breast milk or formula ~3–4 feeds/day between solid meals',
  years_1_2:   'Breast milk or whole milk ~2–3 times/day',
  years_2_3:   'Whole milk or dairy ~1–2 cups/day',
}

export function generateBabyPlan(opts: BabyPlanOptions): BabyDayPlan[] {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  function pool<T extends BabyMealTemplate>(tpls: T[]) {
    const filtered = filterBaby(tpls, opts.stage, opts.diet)
    return pickWithoutRepeat(filtered.length > 0 ? filtered : tpls.filter(t => t.stage.includes(opts.stage)), opts.days)
  }

  const pools = {
    breakfast:    pool(BABY_TEMPLATES.breakfast),
    morningSnack: pool(BABY_TEMPLATES.morningSnack),
    lunch:        pool(BABY_TEMPLATES.lunch),
    eveningSnack: pool(BABY_TEMPLATES.eveningSnack),
    dinner:       pool(BABY_TEMPLATES.dinner),
  }

  const texture  = BABY_TEXTURE[opts.stage]
  const milkText = BABY_MILK[opts.stage]

  return Array.from({ length: opts.days }, (_, i) => {
    const breakfast    = buildSlot('breakfast',    'Breakfast',    '🌅', pools.breakfast[i]    ?? pools.breakfast[0])
    const morningSnack = buildSlot('morningSnack', 'Morning Snack','🍎', pools.morningSnack[i] ?? pools.morningSnack[0])
    const lunch        = buildSlot('lunch',        'Lunch',        '☀️', pools.lunch[i]        ?? pools.lunch[0])
    const eveningSnack = buildSlot('eveningSnack', 'Evening Snack','🌆', pools.eveningSnack[i] ?? pools.eveningSnack[0])
    const dinner       = buildSlot('dinner',       'Dinner',       '🌙', pools.dinner[i]       ?? pools.dinner[0])
    const total = breakfast.totalCalories + morningSnack.totalCalories + lunch.totalCalories + eveningSnack.totalCalories + dinner.totalCalories
    return {
      dayLabel: DAYS[i % 7], dayIndex: i,
      breakfast, morningSnack, lunch, eveningSnack, dinner,
      totalCalories: total,
      milkFeeds:     milkText,
      waterNote:     opts.stage !== 'months_6_9' ? 'Offer sips of water between meals (no juice needed)' : undefined,
      texture,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generate family meal plan
// ─────────────────────────────────────────────────────────────────────────────
export type CuisinePreference = 'tamil' | 'global' | 'mixed'
export type FamilyDietPref = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'

export interface FamilyMember {
  id:        string
  name:      string
  role:      string
  dietPref:  FamilyDietPref
  ageMonths?:   number
  pregnancyWeek?: number
}

export interface FamilyMealSlot {
  slot:     'breakfast' | 'lunch' | 'snack' | 'dinner'
  base:     MealSlotPlan
  adaptations: { memberId: string; memberName: string; emoji: string; note: string; portion: string }[]
}

export interface FamilyDayPlan {
  dayLabel:   string
  dayIndex:   number
  breakfast:  FamilyMealSlot
  lunch:      FamilyMealSlot
  snack:      FamilyMealSlot
  dinner:     FamilyMealSlot
  totalCalories: number
}

const ROLE_EMOJI: Record<string, string> = {
  adult_male: '👨', adult_female: '👩', pregnant: '🤰', baby: '👶',
  toddler: '🧒', senior_male: '👴', senior_female: '👵', child: '🧑',
}

function memberAdaptation(
  member: FamilyMember,
  meal: MealSlotPlan,
): { memberId: string; memberName: string; emoji: string; note: string; portion: string } {
  const emoji = ROLE_EMOJI[member.role] ?? '👤'
  const mealName = meal.name

  switch (member.role) {
    case 'baby': {
      const months = member.ageMonths ?? 0
      if (months < 6)  return { memberId: member.id, memberName: member.name, emoji, note: 'Breast milk or formula only', portion: 'Milk feeds only' }
      if (months < 9)  return { memberId: member.id, memberName: member.name, emoji, note: `Smooth puree of ${mealName.split('+')[0].trim()}. No salt/sugar/honey.`, portion: '2–4 tbsp' }
      return { memberId: member.id, memberName: member.name, emoji, note: `Soft mashed version of ${mealName.split('+')[0].trim()}. No salt/honey.`, portion: 'Small portion (~½ cup)' }
    }
    case 'toddler':
      return { memberId: member.id, memberName: member.name, emoji, note: 'Small toddler portion — soft, no whole nuts. Grapes halved.', portion: '¼ adult portion' }
    case 'pregnant':
      return { memberId: member.id, memberName: member.name, emoji, note: `Pregnancy-adapted${member.pregnancyWeek ? ` (Week ${member.pregnancyWeek})` : ''} — extra iron & calcium. Avoid raw foods.`, portion: 'Standard + extra iron/protein food' }
    case 'senior_male':
    case 'senior_female':
      return { memberId: member.id, memberName: member.name, emoji, note: 'Softer texture, less salt, extra fibre. Reduce oil.', portion: '70% adult portion' }
    case 'child':
      return { memberId: member.id, memberName: member.name, emoji, note: 'Child portion — all family foods are suitable.', portion: '½ adult portion' }
    default:
      return { memberId: member.id, memberName: member.name, emoji, note: 'Standard adult serving.', portion: 'Full serving' }
  }
}

function buildFamilySlot(
  slot: 'breakfast' | 'lunch' | 'snack' | 'dinner',
  template: MealTemplate,
  members: FamilyMember[],
): FamilyMealSlot {
  const emoji = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' }[slot]
  const label = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }[slot]
  const base  = buildSlot(slot as MealSlotPlan['slot'], label, emoji, template)
  return {
    slot, base,
    adaptations: members.map(m => memberAdaptation(m, base)),
  }
}

function effectiveDiet(members: FamilyMember[]): DietType | DietType[] {
  if (members.length === 0) return 'vegetarian'
  const prefs = [...new Set(members.map(m => m.dietPref))] as DietType[]
  if (prefs.length === 1) return prefs[0]
  // Mixed family — return all unique diets so filterTemplates opens up the full pool
  return prefs
}

export function generateFamilyPlan(
  members: FamilyMember[],
  cuisine: CuisinePreference,
  days = 7,
): FamilyDayPlan[] {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const diet = effectiveDiet(members)

  const pools = {
    breakfast: pickWithoutRepeat(filterTemplates(FAMILY_TEMPLATES.breakfast, diet, cuisine, 0), days),
    lunch:     pickWithoutRepeat(filterTemplates(FAMILY_TEMPLATES.lunch,     diet, cuisine, 0), days),
    snack:     pickWithoutRepeat(filterTemplates(FAMILY_TEMPLATES.snack,     diet, cuisine, 0), days),
    dinner:    pickWithoutRepeat(filterTemplates(FAMILY_TEMPLATES.dinner,    diet, cuisine, 0), days),
  }

  return Array.from({ length: days }, (_, i) => {
    const bk = buildFamilySlot('breakfast', pools.breakfast[i] ?? pools.breakfast[0], members)
    const ln = buildFamilySlot('lunch',     pools.lunch[i]     ?? pools.lunch[0],     members)
    const sn = buildFamilySlot('snack',     pools.snack[i]     ?? pools.snack[0],     members)
    const dn = buildFamilySlot('dinner',    pools.dinner[i]    ?? pools.dinner[0],    members)
    const total = bk.base.totalCalories + ln.base.totalCalories + sn.base.totalCalories + dn.base.totalCalories
    return { dayLabel: DAYS[i % 7], dayIndex: i, breakfast: bk, lunch: ln, snack: sn, dinner: dn, totalCalories: total }
  })
}

/** Regenerate a single meal slot for a given day */
export function regenerateFamilyMeal(
  slot: 'breakfast' | 'lunch' | 'snack' | 'dinner',
  members: FamilyMember[],
  cuisine: CuisinePreference,
  excludeNames: string[] = [],
): FamilyMealSlot {
  const diet      = effectiveDiet(members)
  const templates = filterTemplates(FAMILY_TEMPLATES[slot], diet, cuisine, Math.floor(Math.random() * 2))
  const available = templates.filter(t => !excludeNames.includes(t.name))
  const pool      = available.length > 0 ? available : templates
  const pick      = pool[Math.floor(Math.random() * pool.length)]
  return buildFamilySlot(slot, pick, members)
}
