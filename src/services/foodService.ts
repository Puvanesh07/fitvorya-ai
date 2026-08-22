// ── Unified Food Search Service ───────────────────────────────────────────────
// Single service used by FitTracker, Pregnancy, Baby, and Family.
// Features:
//   • Local fallback DB (instant, zero-latency)
//   • USDA FoodData Central via Netlify function (prod) or direct (dev)
//   • Open Food Facts via Netlify function
//   • LRU-style in-memory response cache (100 entries, 10-min TTL)
//   • Request cancellation (AbortController) — stale queries auto-cancelled
//   • Debounce helper
//   • Recently searched foods (localStorage, last 8)
//   • Relevance scoring + ranking

import type { UnifiedFood } from '../types/food'

// ── Local fallback database ───────────────────────────────────────────────────
// All values per 100g. Covers Indian, South Indian, Tamil, and global staples.
export const LOCAL_FOOD_DB: UnifiedFood[] = [
  // ── South Indian ──────────────────────────────────────────────────────────
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
  { fdcId: 'loc_upma',          name: 'Upma',                        calories: 131, protein: 3.5,  carbs: 22.0, fat: 4.0, fiber: 1.8,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_poha',          name: 'Poha / Aval (cooked)',        calories: 130, protein: 2.2,  carbs: 26.3, fat: 2.0, fiber: 1.0,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_rava_upma',     name: 'Rava Semolina Upma',          calories: 148, protein: 4.0,  carbs: 25.0, fat: 4.5, fiber: 1.5,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_khichdi',       name: 'Khichdi',                     calories: 124, protein: 4.8,  carbs: 22.0, fat: 2.5, fiber: 2.2,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },

  // ── Millets ───────────────────────────────────────────────────────────────
  { fdcId: 'loc_ragi',          name: 'Ragi Finger Millet (dry)',    calories: 336, protein: 7.3,  carbs: 72.0, fat: 1.5, fiber: 3.6, calcium: 344, iron: 3.9, source: 'local', servingSize: 30,  servingUnit: '30g raw',   category: 'grains' },
  { fdcId: 'loc_ragi_porridge', name: 'Ragi Porridge',               calories: 72,  protein: 1.5,  carbs: 15.0, fat: 0.4, fiber: 1.0, calcium: 72,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_ragi_dosa',     name: 'Ragi Dosa',                   calories: 115, protein: 3.5,  carbs: 21.0, fat: 1.8, fiber: 1.5, source: 'local', servingSize: 80,  servingUnit: '1 dosa',    category: 'grains' },
  { fdcId: 'loc_kambu',         name: 'Kambu Pearl Millet (dry)',    calories: 361, protein: 11.0, carbs: 67.0, fat: 5.0, fiber: 2.3, iron: 8.0,    source: 'local', servingSize: 30,  servingUnit: '30g raw',   category: 'grains' },
  { fdcId: 'loc_kambu_koozh',   name: 'Kambu Koozh (Millet Kanji)', calories: 55,  protein: 1.8,  carbs: 11.0, fat: 0.5, fiber: 0.8, source: 'local', servingSize: 250, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_thinai',        name: 'Thinai Foxtail Millet',       calories: 351, protein: 12.3, carbs: 60.9, fat: 4.3, fiber: 8.0, source: 'local', servingSize: 30,  servingUnit: '30g raw',   category: 'grains' },

  // ── Rice & breads ─────────────────────────────────────────────────────────
  { fdcId: 'loc_red_rice',      name: 'Red Rice (cooked)',            calories: 112, protein: 2.6,  carbs: 23.5, fat: 0.9, fiber: 2.0,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_white_rice',    name: 'White Rice (cooked)',          calories: 130, protein: 2.7,  carbs: 28.0, fat: 0.3, fiber: 0.4,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_brown_rice',    name: 'Brown Rice (cooked)',          calories: 112, protein: 2.6,  carbs: 24.0, fat: 0.9, fiber: 1.8,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'grains' },
  { fdcId: 'loc_chapati',       name: 'Chapati Roti',                 calories: 178, protein: 6.3,  carbs: 32.5, fat: 3.8, fiber: 2.5,  source: 'local', servingSize: 40,  servingUnit: '1 piece',   category: 'grains' },
  { fdcId: 'loc_paratha',       name: 'Plain Paratha',                calories: 186, protein: 4.3,  carbs: 28.6, fat: 7.1, fiber: 1.4,  source: 'local', servingSize: 70,  servingUnit: '1 piece',   category: 'grains' },
  { fdcId: 'loc_aloo_paratha',  name: 'Aloo Paratha',                 calories: 167, protein: 3.3,  carbs: 25.0, fat: 5.8, fiber: 1.7,  source: 'local', servingSize: 120, servingUnit: '1 piece',   category: 'prepared' },
  { fdcId: 'loc_naan',          name: 'Naan',                         calories: 291, protein: 10.0, carbs: 50.0, fat: 5.6, fiber: 2.2,  source: 'local', servingSize: 90,  servingUnit: '1 piece',   category: 'grains' },
  { fdcId: 'loc_puri',          name: 'Puri',                         calories: 229, protein: 5.7,  carbs: 28.6, fat: 11.4,fiber: 1.4,  source: 'local', servingSize: 35,  servingUnit: '1 piece',   category: 'grains' },

  // ── Dal & legumes ─────────────────────────────────────────────────────────
  { fdcId: 'loc_dal_tadka',     name: 'Dal Tadka',                   calories: 72,  protein: 4.0,  carbs: 10.4, fat: 2.0, fiber: 2.8,  source: 'local', servingSize: 250, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_dal_fry',       name: 'Dal Fry',                     calories: 86,  protein: 4.5,  carbs: 11.0, fat: 2.8, fiber: 3.0,  source: 'local', servingSize: 250, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_chana_masala',  name: 'Chana Masala',                calories: 108, protein: 5.6,  carbs: 16.0, fat: 2.8, fiber: 4.0,  source: 'local', servingSize: 250, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_moong_dal',     name: 'Moong Dal (cooked)',          calories: 105, protein: 7.0,  carbs: 19.0, fat: 0.4, fiber: 2.8,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_toor_dal',      name: 'Toor Dal (cooked)',           calories: 116, protein: 7.2,  carbs: 20.6, fat: 0.4, fiber: 2.7,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_rajma',         name: 'Rajma Kidney Beans (cooked)', calories: 127, protein: 8.7,  carbs: 22.0, fat: 0.5, fiber: 6.4,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_chole',         name: 'Chole Chickpea Curry',        calories: 164, protein: 8.9,  carbs: 27.4, fat: 2.6, fiber: 7.6,  source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'legumes' },
  { fdcId: 'loc_sundal',        name: 'Sundal Chickpea',             calories: 140, protein: 7.5,  carbs: 24.0, fat: 2.2, fiber: 6.0,  source: 'local', servingSize: 150, servingUnit: '1 cup',     category: 'legumes' },

  // ── Proteins ──────────────────────────────────────────────────────────────
  { fdcId: 'f1',  name: 'Chicken Breast (cooked)',    calories: 165, protein: 31.0, carbs: 0.0,  fat: 3.6, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'f6',  name: 'Salmon (cooked)',             calories: 208, protein: 20.0, carbs: 0.0,  fat: 13.0,fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'f10', name: 'Tuna Canned in Water',        calories: 116, protein: 26.0, carbs: 0.0,  fat: 1.0, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'f3',  name: 'Whole Egg',                   calories: 155, protein: 13.0, carbs: 1.1,  fat: 11.0,fiber: 0.0, source: 'local', servingSize: 50,  servingUnit: '1 large egg', category: 'protein' },
  { fdcId: 'f9',  name: 'Almonds',                     calories: 579, protein: 21.0, carbs: 22.0, fat: 50.0,fiber: 12.0,source: 'local', servingSize: 30,  servingUnit: '~23 almonds', category: 'nuts_seeds' },
  { fdcId: 'loc_paneer',        name: 'Paneer (fresh)', calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8, fiber: 0.0, calcium: 480, source: 'local', servingSize: 50, servingUnit: '2 pieces',  category: 'dairy' },
  { fdcId: 'loc_chicken_curry', name: 'Chicken Curry',  calories: 167, protein: 14.0, carbs: 5.5, fat: 10.5, fiber: 1.0, source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'prepared' },
  { fdcId: 'loc_fish_curry',    name: 'Fish Curry (South Indian)', calories: 123, protein: 13.5, carbs: 5.0, fat: 5.5, fiber: 0.8, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'prepared' },
  { fdcId: 'loc_egg_curry',     name: 'Egg Curry',      calories: 145, protein: 8.5,  carbs: 5.0, fat: 10.5, fiber: 0.8, source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'prepared' },
  { fdcId: 'loc_mutton_curry',  name: 'Mutton Curry',   calories: 192, protein: 15.2, carbs: 4.2, fat: 13.0, fiber: 0.5, source: 'local', servingSize: 200, servingUnit: '1 cup',     category: 'prepared' },
  { fdcId: 'loc_biryani',       name: 'Chicken Biryani',calories: 185, protein: 8.5,  carbs: 28.0,fat: 5.2,  fiber: 1.2, source: 'local', servingSize: 300, servingUnit: '1 plate',   category: 'prepared' },
  { fdcId: 'loc_veg_biryani',   name: 'Vegetable Biryani',calories: 150,protein: 3.8, carbs: 28.0,fat: 3.5,  fiber: 2.5, source: 'local', servingSize: 300, servingUnit: '1 plate',   category: 'prepared' },

  // ── Beef & global meats ───────────────────────────────────────────────────
  { fdcId: 'loc_beef',          name: 'Beef (cooked, lean)',          calories: 250, protein: 26.0, carbs: 0.0, fat: 15.0, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_ground_beef',   name: 'Ground Beef (cooked)',         calories: 215, protein: 26.0, carbs: 0.0, fat: 11.0, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_beef_steak',    name: 'Beef Steak (cooked)',          calories: 271, protein: 25.0, carbs: 0.0, fat: 18.0, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_beef_mince',    name: 'Beef Mince (cooked)',          calories: 218, protein: 24.0, carbs: 0.0, fat: 13.0, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_beef_roast',    name: 'Beef Roast (cooked)',          calories: 215, protein: 28.0, carbs: 0.0, fat: 11.0, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_pork_chop',     name: 'Pork Chop (cooked)',           calories: 231, protein: 25.0, carbs: 0.0, fat: 14.0, fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_turkey_breast', name: 'Turkey Breast (cooked)',       calories: 135, protein: 30.0, carbs: 0.0, fat: 0.7,  fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_shrimp',        name: 'Shrimp (cooked)',               calories: 99,  protein: 24.0, carbs: 0.2, fat: 0.3,  fiber: 0.0, source: 'local', category: 'protein' },
  { fdcId: 'loc_lamb',          name: 'Lamb (cooked)',                 calories: 258, protein: 25.0, carbs: 0.0, fat: 17.0, fiber: 0.0, source: 'local', category: 'protein' },

  // ── Global staples ────────────────────────────────────────────────────────
  { fdcId: 'loc_oats',          name: 'Oats (dry)',                   calories: 389, protein: 17.0, carbs: 66.0, fat: 7.0, fiber: 10.0, source: 'local', servingSize: 40, servingUnit: '½ cup dry', category: 'grains' },
  { fdcId: 'loc_sweet_potato',  name: 'Sweet Potato (cooked)',        calories: 90,  protein: 2.0,  carbs: 21.0, fat: 0.1, fiber: 3.0,  source: 'local', servingSize: 150, servingUnit: '1 medium', category: 'vegetables' },
  { fdcId: 'loc_quinoa',        name: 'Quinoa (cooked)',              calories: 120, protein: 4.4,  carbs: 21.3, fat: 1.9, fiber: 2.8,  source: 'local', servingSize: 185, servingUnit: '1 cup',    category: 'grains' },
  { fdcId: 'loc_avocado',       name: 'Avocado',                      calories: 160, protein: 2.0,  carbs: 8.5,  fat: 15.0,fiber: 6.7,  source: 'local', servingSize: 80,  servingUnit: '½ medium', category: 'fruits' },
  { fdcId: 'loc_banana',        name: 'Banana',                       calories: 89,  protein: 1.1,  carbs: 23.0, fat: 0.3, fiber: 2.6,  source: 'local', servingSize: 120, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_apple',         name: 'Apple',                        calories: 52,  protein: 0.3,  carbs: 14.0, fat: 0.2, fiber: 2.4,  source: 'local', servingSize: 182, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_orange',        name: 'Orange',                       calories: 47,  protein: 0.9,  carbs: 12.0, fat: 0.1, fiber: 2.4,  source: 'local', servingSize: 131, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_lentils',       name: 'Lentils (cooked)',             calories: 116, protein: 9.0,  carbs: 20.0, fat: 0.4, fiber: 8.0,  source: 'local', servingSize: 200, servingUnit: '1 cup',    category: 'legumes' },
  { fdcId: 'loc_black_beans',   name: 'Black Beans (cooked)',         calories: 132, protein: 8.9,  carbs: 24.0, fat: 0.5, fiber: 8.7,  source: 'local', servingSize: 200, servingUnit: '1 cup',    category: 'legumes' },
  { fdcId: 'loc_whole_bread',   name: 'Whole Wheat Bread',            calories: 247, protein: 13.0, carbs: 41.0, fat: 4.0, fiber: 7.0,  source: 'local', servingSize: 30,  servingUnit: '1 slice',  category: 'grains' },
  { fdcId: 'f7',  name: 'Sweet Potato (cooked)', calories: 90,  protein: 2.0,  carbs: 21.0, fat: 0.1, fiber: 3.0, source: 'local', category: 'vegetables' },
  { fdcId: 'f8',  name: 'Broccoli (cooked)',     calories: 35,  protein: 2.4,  carbs: 7.0,  fat: 0.4, fiber: 2.0, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_keerai',        name: 'Spinach Keerai (cooked)',  calories: 23,  protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.4, iron: 2.7, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_drumstick_lv',  name: 'Drumstick Leaves (Murungai)', calories: 64, protein: 6.7, carbs: 8.3, fat: 1.7, fiber: 2.0, calcium: 185, iron: 4.0, source: 'local', servingSize: 50, servingUnit: '1 handful', category: 'vegetables' },
  { fdcId: 'loc_bhindi',        name: 'Bhindi Okra (cooked)',     calories: 33,  protein: 2.0, carbs: 7.5, fat: 0.2, fiber: 3.2, source: 'local', category: 'vegetables' },
  { fdcId: 'loc_keerai_b',      name: 'Beetroot (cooked)',        calories: 44,  protein: 1.7, carbs: 10.0,fat: 0.2, fiber: 2.0, source: 'local', servingSize: 100, category: 'vegetables' },
  { fdcId: 'loc_carrot',        name: 'Carrot (cooked)',          calories: 41,  protein: 0.9, carbs: 10.0,fat: 0.2, fiber: 3.0, source: 'local', category: 'vegetables' },

  // ── Dairy & drinks ────────────────────────────────────────────────────────
  { fdcId: 'f5',  name: 'Greek Yogurt (plain)',   calories: 59,  protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0.0, source: 'local', servingSize: 150, servingUnit: '½ cup', category: 'dairy' },
  { fdcId: 'f13', name: 'Whole Milk',              calories: 61,  protein: 3.2,  carbs: 4.8, fat: 3.3, fiber: 0.0, source: 'local', servingSize: 240, servingUnit: '1 cup', category: 'dairy' },
  { fdcId: 'loc_curd',          name: 'Curd Dahi (plain)', calories: 60, protein: 3.5, carbs: 4.5, fat: 3.0, fiber: 0.0, calcium: 120, source: 'local', servingSize: 200, servingUnit: '1 cup', category: 'dairy' },
  { fdcId: 'loc_buttermilk',    name: 'Buttermilk (Moru)',calories: 23, protein: 1.6, carbs: 2.8, fat: 0.9, fiber: 0.0, source: 'local', servingSize: 250, servingUnit: '1 glass', category: 'beverages' },
  { fdcId: 'loc_coconut_water', name: 'Coconut Water',    calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, source: 'local', servingSize: 250, servingUnit: '1 glass', category: 'beverages' },

  // ── Fruits ────────────────────────────────────────────────────────────────
  { fdcId: 'f11', name: 'Apple',        calories: 52,  protein: 0.3,  carbs: 14.0, fat: 0.2, fiber: 2.4, source: 'local', servingSize: 150, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'f12', name: 'Banana',       calories: 89,  protein: 1.1,  carbs: 23.0, fat: 0.3, fiber: 2.6, source: 'local', servingSize: 120, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_mango',         name: 'Mango',        calories: 60,  protein: 0.8, carbs: 15.0, fat: 0.4, fiber: 1.6, source: 'local', servingSize: 150, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_guava',         name: 'Guava',        calories: 68,  protein: 2.6, carbs: 14.3, fat: 1.0, fiber: 5.4, source: 'local', servingSize: 100, servingUnit: '1 medium', category: 'fruits' },
  { fdcId: 'loc_papaya',        name: 'Papaya (ripe)',calories: 43,  protein: 0.5, carbs: 10.8, fat: 0.3, fiber: 1.7, source: 'local', servingSize: 200, servingUnit: '1 cup diced', category: 'fruits' },
  { fdcId: 'loc_pomegranate',   name: 'Pomegranate',  calories: 83,  protein: 1.7, carbs: 18.7, fat: 1.2, fiber: 4.0, iron: 0.3, source: 'local', servingSize: 100, servingUnit: '½ cup arils', category: 'fruits' },

  // ── Oats & cereals ────────────────────────────────────────────────────────
  { fdcId: 'f4',  name: 'Oats (dry)',              calories: 389, protein: 17.0, carbs: 66.0, fat: 7.0,  fiber: 10.0,source: 'local', servingSize: 40,  servingUnit: '⅓ cup', category: 'grains' },
  { fdcId: 'f14', name: 'Whole Wheat Bread',        calories: 247, protein: 13.0, carbs: 41.0, fat: 4.0,  fiber: 7.0, source: 'local', servingSize: 30,  servingUnit: '1 slice',  category: 'grains' },
  { fdcId: 'f2',  name: 'Brown Rice (cooked)',      calories: 112, protein: 2.6,  carbs: 24.0, fat: 0.9,  fiber: 1.8, source: 'local', servingSize: 200, servingUnit: '1 cup',    category: 'grains' },
  { fdcId: 'f15', name: 'White Rice (cooked)',      calories: 130, protein: 2.7,  carbs: 28.0, fat: 0.3,  fiber: 0.4, source: 'local', servingSize: 200, servingUnit: '1 cup',    category: 'grains' },

  // ── Baby specific ─────────────────────────────────────────────────────────
  { fdcId: 'loc_rice_porridge', name: 'Rice Porridge Kanji',       calories: 60,  protein: 1.2, carbs: 13.5, fat: 0.2, fiber: 0.2, source: 'local', servingSize: 150, servingUnit: '½ cup', category: 'grains' },
  { fdcId: 'loc_dal_rice',      name: 'Dal Rice (soft cooked)',    calories: 105, protein: 3.8, carbs: 20.5, fat: 0.8, fiber: 1.5, source: 'local', servingSize: 150, servingUnit: '½ cup', category: 'prepared' },
  { fdcId: 'loc_sweet_pot_pur', name: 'Sweet Potato Puree',        calories: 76,  protein: 1.4, carbs: 17.7, fat: 0.1, fiber: 2.5, source: 'local', servingSize: 100, servingUnit: '½ cup', category: 'vegetables' },
  { fdcId: 'loc_ragi_malt',     name: 'Ragi Malt Baby Porridge',   calories: 85,  protein: 2.0, carbs: 17.5, fat: 0.8, fiber: 1.2, calcium: 100, source: 'local', servingSize: 150, servingUnit: '½ cup', category: 'grains' },
]

// ── Relevance scorer ──────────────────────────────────────────────────────────
function scoreRelevance(name: string, query: string): number {
  const n = name.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const words = q.split(/\s+/).filter(Boolean)

  if (n === q)                        return 100
  if (n.startsWith(q + ' '))          return 92
  if (n.startsWith(q))                return 90
  if (n.includes(' ' + q + ' '))      return 85
  if (n.includes(' ' + q))            return 82
  if (n.includes(q))                  return 78
  if (words.length > 1 && words.every(w => n.includes(w))) return 70
  if (n.startsWith(words[0] + ' '))   return 60
  if (n.startsWith(words[0]))         return 55
  const matchCount = words.filter(w => n.includes(w)).length
  if (matchCount >= words.length - 1) return 45
  if (matchCount > 0)                 return 25
  return 0
}

// ── Cache ─────────────────────────────────────────────────────────────────────
interface CacheEntry {
  foods:     UnifiedFood[]
  expiresAt: number
}

const CACHE      = new Map<string, CacheEntry>()
const CACHE_TTL  = 10 * 60 * 1000   // 10 minutes
const CACHE_MAX  = 100

function cacheGet(key: string): UnifiedFood[] | null {
  const entry = CACHE.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { CACHE.delete(key); return null }
  return entry.foods
}

function cacheSet(key: string, foods: UnifiedFood[]) {
  if (CACHE.size >= CACHE_MAX) {
    // Evict the oldest entry
    const firstKey = CACHE.keys().next().value
    if (firstKey) CACHE.delete(firstKey)
  }
  CACHE.set(key, { foods, expiresAt: Date.now() + CACHE_TTL })
}

// ── Recent searches (localStorage) ───────────────────────────────────────────
const RECENT_KEY = 'fittracker_recent_foods'
const RECENT_MAX = 8

export function getRecentFoods(): UnifiedFood[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as UnifiedFood[]) : []
  } catch { return [] }
}

export function addRecentFood(food: UnifiedFood) {
  try {
    const existing = getRecentFoods().filter(f => f.fdcId !== food.fdcId)
    const updated  = [food, ...existing].slice(0, RECENT_MAX)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch { /* storage full */ }
}

export function clearRecentFoods() {
  try { localStorage.removeItem(RECENT_KEY) } catch { /* ignore */ }
}

// ── AbortController store (one per logical search context) ───────────────────
const activeControllers = new Map<string, AbortController>()

function cancelPrevious(contextId: string) {
  const prev = activeControllers.get(contextId)
  if (prev) { prev.abort(); activeControllers.delete(contextId) }
}

// ── Core search function ──────────────────────────────────────────────────────
const IS_DEV     = import.meta.env.DEV
const USDA_KEY   = import.meta.env.VITE_USDA_API_KEY ?? ''
const USDA_BASE  = 'https://api.nal.usda.gov/fdc/v1'

export interface SearchOptions {
  /** Context id used to cancel previous in-flight requests. Default: 'default' */
  contextId?: string
  maxResults?: number
  /** Signal for external cancellation */
  signal?: AbortSignal
}

export async function searchFoods(
  query: string,
  options: SearchOptions = {},
): Promise<UnifiedFood[]> {
  const trimmed   = query.trim()
  const contextId = options.contextId ?? 'default'
  const maxResults = options.maxResults ?? 20

  if (trimmed.length < 2) return []

  const cacheKey = `${trimmed.toLowerCase()}:${maxResults}`
  const cached   = cacheGet(cacheKey)
  if (cached) return cached

  // Cancel any previous in-flight request for this context
  cancelPrevious(contextId)
  const controller = new AbortController()
  activeControllers.set(contextId, controller)

  // Merge with external signal
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort())
  }

  // ── 1. Local DB first — instant ───────────────────────────────────────────
  const localResults = LOCAL_FOOD_DB
    .map(f => ({ food: f, score: scoreRelevance(f.name, trimmed) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.food)

  const seen = new Set(localResults.map(f => f.fdcId))
  const merged: UnifiedFood[] = [...localResults]

  try {
    let apiResults: UnifiedFood[] = []

    if (IS_DEV && USDA_KEY) {
      // Dev: call USDA directly
      const res = await fetch(
        `${USDA_BASE}/foods/search?query=${encodeURIComponent(trimmed)}&pageSize=20&api_key=${USDA_KEY}&dataType=Foundation,SR%20Legacy,Branded&sortBy=score&sortOrder=desc`,
        { signal: controller.signal },
      )
      if (res.ok) {
        const data = await res.json() as {
          foods: Array<{
            fdcId: number; description: string; brandOwner?: string
            foodNutrients: Array<{ nutrientId: number; value: number }>
            servingSize?: number; servingSizeUnit?: string
            foodCategory?: string
          }>
        }
        apiResults = (data.foods ?? []).map(f => {
          const get = (id: number) => f.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0
          // ID 1008 = Energy (kcal), ID 1062 = Energy (kJ) — convert kJ→kcal as fallback
          const kcal = get(1008) || Math.round(get(1062) / 4.184)
          return {
            fdcId:       String(f.fdcId),
            name:        toTitleCase(f.description),
            brand:       f.brandOwner,
            calories:    Math.round(kcal),
            protein:     r1(get(1003)),
            carbs:       r1(get(1005)),
            fat:         r1(get(1004)),
            fiber:       r1(get(1079)),
            sodium:      r1(get(1093)),
            sugar:       r1(get(2000)),
            calcium:     r1(get(1087)),
            iron:        r1(get(1089)),
            servingSize: f.servingSize ?? undefined,
            servingUnit: f.servingSizeUnit ?? undefined,
            source:      'usda' as const,
          } satisfies UnifiedFood
          // Keep any item that has nutritional data (don't silently discard)
        }).filter(f => f.calories > 0 || f.protein > 0 || f.carbs > 0 || f.fat > 0)
      }
    } else if (!IS_DEV) {
      // Prod: call Netlify function
      const res = await fetch('/.netlify/functions/searchFood', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: trimmed, maxResults: 20 }),
        signal:  controller.signal,
      })
      if (res.ok) {
        const data = await res.json() as { foods: UnifiedFood[] }
        apiResults = data.foods ?? []
      }
    }

    // Merge API results, dedup by fdcId
    for (const f of apiResults) {
      if (!seen.has(f.fdcId)) {
        merged.push(f)
        seen.add(f.fdcId)
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return []
    // Network error → use local only
  } finally {
    activeControllers.delete(contextId)
  }

  // Re-score merged list so API results get their own relevance rank
  const ranked = merged
    .map(f => ({ f, score: scoreRelevance(f.name, trimmed) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.f)
    .slice(0, maxResults)

  cacheSet(cacheKey, ranked)
  return ranked
}

// ── Debounce helper ───────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ── Macro scaler ──────────────────────────────────────────────────────────────
export interface ScaledMacros {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export function scaleMacros(food: UnifiedFood, grams: number): ScaledMacros {
  const f = grams / 100
  return {
    calories: Math.round(food.calories * f),
    protein:  r1(food.protein * f),
    carbs:    r1(food.carbs   * f),
    fat:      r1(food.fat     * f),
    fiber:    r1((food.fiber ?? 0) * f),
  }
}

function r1(v: number) { return Math.round(v * 10) / 10 }

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim()
}

// ── Macro summing for a list of {food, grams} pairs ──────────────────────────
export function sumMacros(items: { food: UnifiedFood; grams: number }[]): ScaledMacros {
  return items.reduce<ScaledMacros>(
    (acc, { food, grams }) => {
      const m = scaleMacros(food, grams)
      return {
        calories: acc.calories + m.calories,
        protein:  r1(acc.protein + m.protein),
        carbs:    r1(acc.carbs   + m.carbs),
        fat:      r1(acc.fat     + m.fat),
        fiber:    r1(acc.fiber   + m.fiber),
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  )
}
