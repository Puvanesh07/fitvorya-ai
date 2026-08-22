import type { Handler } from '@netlify/functions'

// ── Types ─────────────────────────────────────────────────────────────────────
interface FoodResult {
  fdcId: string
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium?: number
  sugar?: number
  calcium?: number
  iron?: number
  servingSize?: number
  servingUnit?: string
  imageUrl?: string
  category?: string
  source: 'usda' | 'openfoodfacts' | 'local'
}

interface USDAFood {
  fdcId: number
  description: string
  brandOwner?: string
  brandName?: string
  foodCategory?: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients: Array<{ nutrientId: number; value: number }>
}

interface OFFProduct {
  id?: string
  product_name?: string
  brands?: string
  image_front_small_url?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'proteins_100g'?: number
    'carbohydrates_100g'?: number
    'fat_100g'?: number
    'fiber_100g'?: number
    'sodium_100g'?: number
    'sugars_100g'?: number
    'calcium_100g'?: number
    'iron_100g'?: number
  }
}

// ── Local Indian/Tamil food database ─────────────────────────────────────────
// Rich database of South Indian, Indian, and common Asian foods not well
// represented in USDA. All values per 100g.
const LOCAL_FOODS: FoodResult[] = [
  // ── South Indian staples ─────────────────────────────────────────────────
  { fdcId: 'loc_idli',          name: 'Idli',                        calories: 87,  protein: 4.4,  carbs: 17.0, fat: 0.4, fiber: 1.0,  source: 'local', servingSize: 45,  servingUnit: '1 piece',   category: 'grains' },
  { fdcId: 'loc_dosa',          name: 'Plain Dosa',                  calories: 166, protein: 4.4,  carbs: 31.0, fat: 3.1, fiber: 1.3,  source: 'local', servingSize: 80,  servingUnit: '1 dosa',    category: 'grains' },
  { fdcId: 'loc_masala_dosa',   name: 'Masala Dosa',                 calories: 153, protein: 3.3,  carbs: 27.0, fat: 4.0, fiber: 1.3,  source: 'local', servingSize: 150, servingUnit: '1 dosa',    category: 'prepared' },
  { fdcId: 'loc_uttapam',       name: 'Uttapam',                     calories: 150, protein: 4.2,  carbs: 27.0, fat: 3.3, fiber: 1.3,  source: 'local', servingSize: 120, servingUnit: '1 piece',   category: 'grains' },
  { fdcId: 'loc_pongal',        name: 'Ven Pongal',                  calories: 110, protein: 3.0,  carbs: 19.0, fat: 3.0, fiber: 1.0,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_sambar',        name: 'Sambar',                      calories: 41,  protein: 2.0,  carbs: 6.4,  fat: 0.8, fiber: 1.6,  source: 'local', servingSize: 250, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_rasam',         name: 'Rasam',                       calories: 18,  protein: 0.8,  carbs: 3.2,  fat: 0.2, fiber: 0.4,  source: 'local', servingSize: 250, servingUnit: '1 cup',     category: 'prepared' },
  { fdcId: 'loc_curd_rice',     name: 'Curd Rice',                   calories: 99,  protein: 2.5,  carbs: 17.5, fat: 2.0, fiber: 0.3,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_lemon_rice',    name: 'Lemon Rice',                  calories: 105, protein: 2.0,  carbs: 20.0, fat: 2.0, fiber: 0.5,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_tamarind_rice', name: 'Tamarind Rice (Puliyodarai)', calories: 180, protein: 2.8,  carbs: 32.0, fat: 4.5, fiber: 1.0,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'prepared' },
  { fdcId: 'loc_medu_vada',     name: 'Medu Vada',                   calories: 162, protein: 6.7,  carbs: 20.0, fat: 6.7, fiber: 1.7,  source: 'local', servingSize: 60,  servingUnit: '1 piece',   category: 'prepared' },
  { fdcId: 'loc_idiyappam',     name: 'Idiyappam',                   calories: 108, protein: 1.8,  carbs: 23.0, fat: 0.3, fiber: 0.5,  source: 'local', servingSize: 100, servingUnit: '2 pieces',  category: 'grains' },
  { fdcId: 'loc_appam',         name: 'Appam',                       calories: 100, protein: 1.8,  carbs: 22.0, fat: 0.5, fiber: 0.4,  source: 'local', servingSize: 60,  servingUnit: '1 piece',   category: 'grains' },
  { fdcId: 'loc_puttu',         name: 'Puttu',                       calories: 148, protein: 3.0,  carbs: 28.0, fat: 2.5, fiber: 1.2,  source: 'local', servingSize: 100, servingUnit: '1 serving', category: 'grains' },

  // ── Millets ───────────────────────────────────────────────────────────────
  { fdcId: 'loc_ragi',          name: 'Ragi / Finger Millet (dry)', calories: 336, protein: 7.3,  carbs: 72.0, fat: 1.5, fiber: 3.6, calcium: 344, iron: 3.9, source: 'local', servingSize: 30, servingUnit: '30g (raw)', category: 'grains' },
  { fdcId: 'loc_ragi_porridge', name: 'Ragi Porridge',               calories: 72,  protein: 1.5,  carbs: 15.0, fat: 0.4, fiber: 1.0, calcium: 72,  source: 'local', servingSize: 200, servingUnit: '1 cup',    category: 'grains' },
  { fdcId: 'loc_ragi_dosa',     name: 'Ragi Dosa',                   calories: 115, protein: 3.5,  carbs: 21.0, fat: 1.8, fiber: 1.5, source: 'local', servingSize: 80, servingUnit: '1 dosa',   category: 'grains' },
  { fdcId: 'loc_kambu',         name: 'Kambu / Pearl Millet (dry)', calories: 361, protein: 11.0, carbs: 67.0, fat: 5.0, fiber: 2.3, iron: 8.0, source: 'local', servingSize: 30, servingUnit: '30g (raw)', category: 'grains' },
  { fdcId: 'loc_kambu_koozh',   name: 'Kambu Koozh (Millet Kanji)', calories: 55,  protein: 1.8,  carbs: 11.0, fat: 0.5, fiber: 0.8, source: 'local', servingSize: 250, servingUnit: '1 cup',    category: 'grains' },
  { fdcId: 'loc_thinai',        name: 'Thinai / Foxtail Millet',    calories: 351, protein: 12.3, carbs: 60.9, fat: 4.3, fiber: 8.0, source: 'local', servingSize: 30, servingUnit: '30g (raw)',  category: 'grains' },
  { fdcId: 'loc_varagu',        name: 'Varagu / Kodo Millet',        calories: 309, protein: 9.8,  carbs: 65.9, fat: 2.2, fiber: 5.2, source: 'local', servingSize: 30, servingUnit: '30g (raw)',  category: 'grains' },
  { fdcId: 'loc_samai',         name: 'Samai / Little Millet',       calories: 341, protein: 7.7,  carbs: 67.0, fat: 4.7, fiber: 7.6, source: 'local', servingSize: 30, servingUnit: '30g (raw)',  category: 'grains' },

  // ── Rice & wheat ──────────────────────────────────────────────────────────
  { fdcId: 'loc_red_rice',      name: 'Red Rice (cooked)',            calories: 112, protein: 2.6,  carbs: 23.5, fat: 0.9, fiber: 2.0, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'grains' },
  { fdcId: 'loc_white_rice',    name: 'White Rice (cooked)',          calories: 130, protein: 2.7,  carbs: 28.0, fat: 0.3, fiber: 0.4, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'grains' },
  { fdcId: 'loc_brown_rice',    name: 'Brown Rice (cooked)',          calories: 112, protein: 2.6,  carbs: 24.0, fat: 0.9, fiber: 1.8, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'grains' },
  { fdcId: 'loc_chapati',       name: 'Chapati / Roti',               calories: 178, protein: 6.3,  carbs: 32.5, fat: 3.8, fiber: 2.5, source: 'local', servingSize: 40,  servingUnit: '1 piece', category: 'grains' },
  { fdcId: 'loc_paratha',       name: 'Plain Paratha',                calories: 186, protein: 4.3,  carbs: 28.6, fat: 7.1, fiber: 1.4, source: 'local', servingSize: 70,  servingUnit: '1 piece', category: 'grains' },
  { fdcId: 'loc_aloo_paratha',  name: 'Aloo Paratha',                 calories: 167, protein: 3.3,  carbs: 25.0, fat: 5.8, fiber: 1.7, source: 'local', servingSize: 120, servingUnit: '1 piece', category: 'prepared' },
  { fdcId: 'loc_naan',          name: 'Naan',                         calories: 291, protein: 10.0, carbs: 50.0, fat: 5.6, fiber: 2.2, source: 'local', servingSize: 90,  servingUnit: '1 piece', category: 'grains' },
  { fdcId: 'loc_puri',          name: 'Puri',                         calories: 229, protein: 5.7,  carbs: 28.6, fat: 11.4,fiber: 1.4, source: 'local', servingSize: 35,  servingUnit: '1 piece', category: 'grains' },

  // ── Dal & legumes ─────────────────────────────────────────────────────────
  { fdcId: 'loc_dal_tadka',     name: 'Dal Tadka',                    calories: 72,  protein: 4.0,  carbs: 10.4, fat: 2.0, fiber: 2.8, source: 'local', servingSize: 250, servingUnit: '1 cup', category: 'legumes' },
  { fdcId: 'loc_dal_fry',       name: 'Dal Fry',                      calories: 86,  protein: 4.5,  carbs: 11.0, fat: 2.8, fiber: 3.0, source: 'local', servingSize: 250, servingUnit: '1 cup', category: 'legumes' },
  { fdcId: 'loc_chana_masala',  name: 'Chana Masala',                 calories: 108, protein: 5.6,  carbs: 16.0, fat: 2.8, fiber: 4.0, source: 'local', servingSize: 250, servingUnit: '1 cup', category: 'legumes' },
  { fdcId: 'loc_moong_dal',     name: 'Moong Dal (cooked)',           calories: 105, protein: 7.0,  carbs: 19.0, fat: 0.4, fiber: 2.8, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'legumes' },
  { fdcId: 'loc_toor_dal',      name: 'Toor Dal (cooked)',            calories: 116, protein: 7.2,  carbs: 20.6, fat: 0.4, fiber: 2.7, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'legumes' },
  { fdcId: 'loc_rajma',         name: 'Rajma (Kidney Beans, cooked)', calories: 127, protein: 8.7,  carbs: 22.0, fat: 0.5, fiber: 6.4, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'legumes' },
  { fdcId: 'loc_chole',         name: 'Chole (Chickpea Curry)',       calories: 164, protein: 8.9,  carbs: 27.4, fat: 2.6, fiber: 7.6, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'legumes' },
  { fdcId: 'loc_sundal',        name: 'Sundal (Chickpea)',            calories: 140, protein: 7.5,  carbs: 24.0, fat: 2.2, fiber: 6.0, source: 'local', servingSize: 150, servingUnit: '1 cup', category: 'legumes' },

  // ── Indian vegetables ─────────────────────────────────────────────────────
  { fdcId: 'loc_drumstick',     name: 'Drumstick (Moringa) cooked',   calories: 37,  protein: 2.1,  carbs: 8.5,  fat: 0.2, fiber: 3.2, calcium: 30, iron: 0.36, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_drumstick_lv',  name: 'Drumstick Leaves (Murungai)', calories: 64,  protein: 6.7,  carbs: 8.3,  fat: 1.7, fiber: 2.0, calcium: 185, iron: 4.0, source: 'local', servingSize: 50, servingUnit: '1 handful', category: 'vegetables' },
  { fdcId: 'loc_bhindi',        name: 'Bhindi / Okra (cooked)',       calories: 33,  protein: 2.0,  carbs: 7.5,  fat: 0.2, fiber: 3.2, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_brinjal',       name: 'Brinjal / Eggplant (cooked)', calories: 35,  protein: 0.8,  carbs: 8.7,  fat: 0.2, fiber: 2.5, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_keerai',        name: 'Spinach / Keerai (cooked)',    calories: 23,  protein: 2.9,  carbs: 3.6,  fat: 0.4, fiber: 2.4, iron: 2.7, source: 'local', servingSize: 100, category: 'vegetables' },
  { fdcId: 'loc_bitter_gourd',  name: 'Bitter Gourd / Karela',        calories: 17,  protein: 1.0,  carbs: 3.7,  fat: 0.2, fiber: 2.8, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_raw_banana',    name: 'Raw Banana (cooked)',           calories: 89,  protein: 1.3,  carbs: 21.6, fat: 0.1, fiber: 2.3, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_yam',           name: 'Yam / Senai Kizhangu',         calories: 118, protein: 1.5,  carbs: 28.0, fat: 0.1, fiber: 4.1, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_ash_gourd',     name: 'Ash Gourd / Poosanikai',       calories: 13,  protein: 0.4,  carbs: 3.0,  fat: 0.1, fiber: 0.8, source: 'local', category: 'vegetables' },

  // ── Curries & prepared ────────────────────────────────────────────────────
  { fdcId: 'loc_chicken_curry', name: 'Chicken Curry',                calories: 167, protein: 14.0, carbs: 5.5,  fat: 10.5, fiber: 1.0, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'prepared' },
  { fdcId: 'loc_fish_curry',    name: 'Fish Curry (South Indian)',    calories: 123, protein: 13.5, carbs: 5.0,  fat: 5.5,  fiber: 0.8, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'prepared' },
  { fdcId: 'loc_mutton_curry',  name: 'Mutton Curry',                  calories: 192, protein: 15.2, carbs: 4.2,  fat: 13.0, fiber: 0.5, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'prepared' },
  { fdcId: 'loc_egg_curry',     name: 'Egg Curry',                    calories: 145, protein: 8.5,  carbs: 5.0,  fat: 10.5, fiber: 0.8, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'prepared' },
  { fdcId: 'loc_paneer',        name: 'Paneer (fresh)',                calories: 265, protein: 18.3, carbs: 3.4,  fat: 20.8, fiber: 0.0, calcium: 480, source: 'local', servingSize: 50, servingUnit: '2 pieces', category: 'dairy' },
  { fdcId: 'loc_paneer_curry',  name: 'Paneer Curry / Palak Paneer',  calories: 131, protein: 7.1,  carbs: 6.8,  fat: 8.6,  fiber: 1.5, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'prepared' },
  { fdcId: 'loc_biryani',       name: 'Chicken Biryani',              calories: 185, protein: 8.5,  carbs: 28.0, fat: 5.2,  fiber: 1.2, source: 'local', servingSize: 300, servingUnit: '1 plate', category: 'prepared' },
  { fdcId: 'loc_veg_biryani',   name: 'Vegetable Biryani',            calories: 150, protein: 3.8,  carbs: 28.0, fat: 3.5,  fiber: 2.5, source: 'local', servingSize: 300, servingUnit: '1 plate', category: 'prepared' },
  { fdcId: 'loc_upma',          name: 'Upma',                         calories: 131, protein: 3.5,  carbs: 22.0, fat: 4.0,  fiber: 1.8, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'grains' },
  { fdcId: 'loc_poha',          name: 'Poha / Aval (cooked)',         calories: 130, protein: 2.2,  carbs: 26.3, fat: 2.0,  fiber: 1.0, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'grains' },
  { fdcId: 'loc_rava_upma',     name: 'Rava / Semolina Upma',        calories: 148, protein: 4.0,  carbs: 25.0, fat: 4.5,  fiber: 1.5, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'grains' },
  { fdcId: 'loc_khichdi',       name: 'Khichdi',                      calories: 124, protein: 4.8,  carbs: 22.0, fat: 2.5,  fiber: 2.2, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'grains' },

  // ── Chutneys, condiments ──────────────────────────────────────────────────
  { fdcId: 'loc_coconut_chut',  name: 'Coconut Chutney',              calories: 124, protein: 1.4,  carbs: 6.5,  fat: 10.5, fiber: 3.0, source: 'local', servingSize: 40, servingUnit: '2 tbsp', category: 'condiments' },
  { fdcId: 'loc_tomato_chut',   name: 'Tomato Chutney',               calories: 52,  protein: 1.0,  carbs: 9.5,  fat: 1.5,  fiber: 1.5, source: 'local', servingSize: 40, servingUnit: '2 tbsp', category: 'condiments' },

  // ── Dairy & drinks ────────────────────────────────────────────────────────
  { fdcId: 'loc_curd',          name: 'Curd / Dahi (plain)',           calories: 60,  protein: 3.5,  carbs: 4.5,  fat: 3.0, fiber: 0.0, calcium: 120, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'dairy' },
  { fdcId: 'loc_buttermilk',    name: 'Buttermilk (Moru)',             calories: 23,  protein: 1.6,  carbs: 2.8,  fat: 0.9, fiber: 0.0, source: 'local', servingSize: 250, servingUnit: '1 glass', category: 'dairy' },
  { fdcId: 'loc_coconut_water', name: 'Coconut Water',                 calories: 19,  protein: 0.7,  carbs: 3.7,  fat: 0.2, fiber: 1.1, source: 'local', servingSize: 250, servingUnit: '1 glass', category: 'beverages' },
  { fdcId: 'loc_coconut_milk',  name: 'Coconut Milk',                  calories: 230, protein: 2.3,  carbs: 5.5,  fat: 23.8,fiber: 2.2, source: 'local', servingSize: 50, servingUnit: '¼ cup', category: 'dairy' },
  { fdcId: 'loc_lassi',         name: 'Lassi (plain yogurt drink)',    calories: 65,  protein: 2.5,  carbs: 7.0,  fat: 3.0, fiber: 0.0, source: 'local', servingSize: 250, servingUnit: '1 glass', category: 'beverages' },

  // ── Snacks & sweets ───────────────────────────────────────────────────────
  { fdcId: 'loc_peanuts',       name: 'Peanuts / Groundnuts (roasted)',calories: 585, protein: 25.8, carbs: 21.5, fat: 49.7,fiber: 8.0, source: 'local', servingSize: 30, servingUnit: '30g (small handful)', category: 'nuts_seeds' },
  { fdcId: 'loc_sesame',        name: 'Sesame Seeds / Ellu',           calories: 573, protein: 17.7, carbs: 23.5, fat: 49.7,fiber: 11.8, source: 'local', servingSize: 15, servingUnit: '1 tbsp', category: 'nuts_seeds' },
  { fdcId: 'loc_ragi_ladoo',    name: 'Ragi Ladoo',                    calories: 370, protein: 6.5,  carbs: 52.0, fat: 14.5,fiber: 3.5, source: 'local', servingSize: 40, servingUnit: '1 piece', category: 'sweets' },
  { fdcId: 'loc_murukku',       name: 'Murukku',                       calories: 480, protein: 7.5,  carbs: 64.0, fat: 21.0,fiber: 2.0, source: 'local', servingSize: 30, servingUnit: '5-6 pieces', category: 'sweets' },
  { fdcId: 'loc_payasam',       name: 'Payasam / Kheer',               calories: 130, protein: 3.5,  carbs: 21.0, fat: 4.0, fiber: 0.2, source: 'local', servingSize: 150, servingUnit: '1 cup', category: 'sweets' },

  // ── Fruits ────────────────────────────────────────────────────────────────
  { fdcId: 'loc_mango',         name: 'Mango',                         calories: 60,  protein: 0.8,  carbs: 15.0, fat: 0.4, fiber: 1.6, source: 'local', servingSize: 150, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_banana',        name: 'Banana',                        calories: 89,  protein: 1.1,  carbs: 23.0, fat: 0.3, fiber: 2.6, source: 'local', servingSize: 120, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_guava',         name: 'Guava',                         calories: 68,  protein: 2.6,  carbs: 14.3, fat: 1.0, fiber: 5.4, source: 'local', servingSize: 100, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_papaya',        name: 'Papaya (ripe)',                 calories: 43,  protein: 0.5,  carbs: 10.8, fat: 0.3, fiber: 1.7, source: 'local', servingSize: 200, servingUnit: '1 cup diced', category: 'fruits' },
  { fdcId: 'loc_pomegranate',   name: 'Pomegranate',                   calories: 83,  protein: 1.7,  carbs: 18.7, fat: 1.2, fiber: 4.0, iron: 0.3, source: 'local', servingSize: 100, servingUnit: '½ cup arils', category: 'fruits' },
  { fdcId: 'loc_jackfruit',     name: 'Jackfruit (raw)',               calories: 95,  protein: 1.7,  carbs: 23.0, fat: 0.6, fiber: 1.5, source: 'local', servingSize: 100, category: 'fruits' },
  { fdcId: 'loc_gooseberry',    name: 'Amla / Indian Gooseberry',      calories: 44,  protein: 0.9,  carbs: 10.2, fat: 0.6, fiber: 4.3, source: 'local', servingSize: 50, servingUnit: '4-5 pieces', category: 'fruits' },

  // ── Baby-specific foods ───────────────────────────────────────────────────
  { fdcId: 'loc_rice_porridge', name: 'Rice Porridge (Kanji)',         calories: 60,  protein: 1.2,  carbs: 13.5, fat: 0.2, fiber: 0.2, source: 'local', servingSize: 150, servingUnit: '½ cup', category: 'grains' },
  { fdcId: 'loc_dal_rice',      name: 'Dal Rice (soft cooked)',        calories: 105, protein: 3.8,  carbs: 20.5, fat: 0.8, fiber: 1.5, source: 'local', servingSize: 150, servingUnit: '½ cup', category: 'prepared' },
  { fdcId: 'loc_sweet_pot_puri',name: 'Sweet Potato Puree',            calories: 76,  protein: 1.4,  carbs: 17.7, fat: 0.1, fiber: 2.5, source: 'local', servingSize: 100, servingUnit: '½ cup', category: 'vegetables' },
  { fdcId: 'loc_banana_puri',   name: 'Banana Puree',                  calories: 89,  protein: 1.1,  carbs: 23.0, fat: 0.3, fiber: 2.6, source: 'local', servingSize: 80,  servingUnit: '½ banana', category: 'fruits' },
  { fdcId: 'loc_ragi_malt',     name: 'Ragi Malt (baby porridge)',     calories: 85,  protein: 2.0,  carbs: 17.5, fat: 0.8, fiber: 1.2, calcium: 100, source: 'local', servingSize: 150, servingUnit: '½ cup', category: 'grains' },
]

// Build a lookup map for fast deduplication
const LOCAL_MAP = new Map(LOCAL_FOODS.map(f => [f.fdcId, f]))

// ── USDA nutrient ID → field mapping ─────────────────────────────────────────
function parseUSDA(f: USDAFood): FoodResult {
  const get = (id: number) => f.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0
  return {
    fdcId:       String(f.fdcId),
    name:        toTitleCase(f.description),
    brand:       f.brandOwner ?? f.brandName,
    calories:    Math.round(get(1008)),
    protein:     round1(get(1003)),
    carbs:       round1(get(1005)),
    fat:         round1(get(1004)),
    fiber:       round1(get(1079)),
    sodium:      round1(get(1093)),
    sugar:       round1(get(2000)),
    calcium:     round1(get(1087)),
    iron:        round1(get(1089)),
    servingSize: f.servingSize ?? undefined,
    servingUnit: f.servingSizeUnit ?? undefined,
    source:      'usda',
    category:    mapFoodCategory(f.foodCategory),
  }
}

// ── Open Food Facts parser ────────────────────────────────────────────────────
function parseOFF(p: OFFProduct): FoodResult | null {
  if (!p.product_name || !p.nutriments) return null
  const n   = p.nutriments
  const cal = n['energy-kcal_100g'] ?? 0
  if (cal <= 0) return null
  return {
    fdcId:    `off_${p.id ?? Math.random().toString(36).slice(2)}`,
    name:     toTitleCase(p.product_name),
    brand:    p.brands,
    calories: Math.round(cal),
    protein:  round1(n['proteins_100g'] ?? 0),
    carbs:    round1(n['carbohydrates_100g'] ?? 0),
    fat:      round1(n['fat_100g'] ?? 0),
    fiber:    round1(n['fiber_100g'] ?? 0),
    sodium:   round1((n['sodium_100g'] ?? 0) * 1000), // convert g→mg
    sugar:    round1(n['sugars_100g'] ?? 0),
    calcium:  round1((n['calcium_100g'] ?? 0) * 1000),
    iron:     round1((n['iron_100g'] ?? 0) * 1000),
    imageUrl: p.image_front_small_url,
    source:   'openfoodfacts',
  }
}

// ── Relevance scorer — puts best matches first ────────────────────────────────
function scoreRelevance(name: string, query: string): number {
  const n = name.toLowerCase()
  const q = query.toLowerCase().trim()
  const words = q.split(/\s+/)

  if (n === q) return 100
  if (n.startsWith(q)) return 90
  if (n.includes(q)) return 80

  // All words present
  if (words.every(w => n.includes(w))) return 70
  // First word matches start
  if (n.startsWith(words[0])) return 60
  // Most words present
  const matchCount = words.filter(w => n.includes(w)).length
  if (matchCount === words.length - 1) return 50
  if (matchCount > 0) return 30

  return 0
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function round1(v: number) { return Math.round(v * 10) / 10 }

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

function mapFoodCategory(cat?: string): string | undefined {
  if (!cat) return undefined
  const c = cat.toLowerCase()
  if (c.includes('vegetable')) return 'vegetables'
  if (c.includes('fruit')) return 'fruits'
  if (c.includes('dairy') || c.includes('milk') || c.includes('cheese')) return 'dairy'
  if (c.includes('grain') || c.includes('bread') || c.includes('cereal') || c.includes('rice')) return 'grains'
  if (c.includes('legume') || c.includes('bean') || c.includes('lentil')) return 'legumes'
  if (c.includes('poultry') || c.includes('beef') || c.includes('pork') || c.includes('fish') || c.includes('seafood') || c.includes('meat') || c.includes('egg')) return 'protein'
  if (c.includes('nut') || c.includes('seed')) return 'nuts_seeds'
  if (c.includes('sweet') || c.includes('candy') || c.includes('sugar')) return 'sweets'
  if (c.includes('oil') || c.includes('fat')) return 'oils'
  if (c.includes('beverage') || c.includes('juice') || c.includes('drink')) return 'beverages'
  return 'other'
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

// ── Main handler ──────────────────────────────────────────────────────────────
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let query = ''
  let maxResults = 20
  try {
    const body = JSON.parse(event.body ?? '{}')
    query      = (body.query ?? '').trim()
    maxResults = Math.min(body.maxResults ?? 20, 50)
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  if (!query || query.length < 2) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ foods: [], source: 'empty' }) }
  }

  const seen     = new Set<string>()
  const results: (FoodResult & { _score: number })[] = []

  function addResult(r: FoodResult) {
    if (seen.has(r.fdcId) || r.calories <= 0) return
    seen.add(r.fdcId)
    results.push({ ...r, _score: scoreRelevance(r.name, query) })
  }

  // ── 1. Local database first (instant, zero latency) ──────────────────────
  for (const food of LOCAL_FOODS) {
    const score = scoreRelevance(food.name, query)
    if (score > 0) addResult(food)
  }

  const USDA_KEY = process.env.USDA_API_KEY ?? ''

  // ── 2. USDA FoodData Central ─────────────────────────────────────────────
  if (USDA_KEY) {
    try {
      const url =
        `https://api.nal.usda.gov/fdc/v1/foods/search` +
        `?api_key=${USDA_KEY}` +
        `&query=${encodeURIComponent(query)}` +
        `&dataType=Foundation,SR%20Legacy,Branded` +
        `&pageSize=20` +
        `&sortBy=score&sortOrder=desc`

      const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
      if (res.ok) {
        const data = await res.json() as { foods?: USDAFood[] }
        for (const f of (data.foods ?? []).slice(0, 15)) {
          const parsed = parseUSDA(f)
          if (parsed.calories > 0) addResult(parsed)
        }
      }
    } catch { /* fall through to OFF */ }
  }

  // ── 3. Open Food Facts (branded/packaged) ────────────────────────────────
  if (results.length < 10) {
    try {
      const url =
        `https://world.openfoodfacts.org/cgi/search.pl` +
        `?search_terms=${encodeURIComponent(query)}` +
        `&search_simple=1&action=process&json=1&page_size=10` +
        `&fields=id,product_name,brands,nutriments,image_front_small_url`

      const res = await fetch(url, {
        headers: { 'User-Agent': 'FitTrackerApp/1.0 (contact@fittracker.app)' },
        signal: AbortSignal.timeout(4000),
      })
      if (res.ok) {
        const data = await res.json() as { products?: OFFProduct[] }
        for (const p of (data.products ?? []).slice(0, 8)) {
          const f = parseOFF(p)
          if (f) addResult(f)
        }
      }
    } catch { /* silent */ }
  }

  // Sort by relevance score descending
  results.sort((a, b) => b._score - a._score)

  // Strip internal score field before returning
  const foods = results.slice(0, maxResults).map(({ _score: _, ...f }) => f)

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      foods,
      source: foods.length > 0 ? 'api' : 'empty',
      total:  foods.length,
    }),
  }
}
