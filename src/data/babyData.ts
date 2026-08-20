import type {
  AgeStage, AgeStageId, BabyFood, StageGuide, BabyMealPlan,
  BabyDayPlan, BabyMealEntry, BabyDietType, TextureLevel,
} from '../types/baby'

// ── DISCLAIMER ────────────────────────────────────────────────────────────────
// All content is general information only. Not medical or pediatric advice.
// Consult a paediatrician or qualified healthcare professional for guidance.
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// AGE STAGES
// ══════════════════════════════════════════════════════════════════════════════

export const AGE_STAGES: AgeStage[] = [
  {
    id: 'months_0_6', label: '0–6 Months', shortLabel: '0–6m', emoji: '🍼',
    ageRangeMonths: [0, 6],
    texture: 'milk_only',
    primaryFeedingMode: 'milk_only',
  },
  {
    id: 'months_6_9', label: '6–9 Months', shortLabel: '6–9m', emoji: '🥣',
    ageRangeMonths: [6, 9],
    texture: 'puree',
    primaryFeedingMode: 'milk_plus_solids',
  },
  {
    id: 'months_9_12', label: '9–12 Months', shortLabel: '9–12m', emoji: '🫙',
    ageRangeMonths: [9, 12],
    texture: 'soft_lumps',
    primaryFeedingMode: 'milk_plus_solids',
  },
  {
    id: 'years_1_2', label: '1–2 Years', shortLabel: '1–2y', emoji: '🍚',
    ageRangeMonths: [12, 24],
    texture: 'finger_foods',
    primaryFeedingMode: 'solids_plus_milk',
  },
  {
    id: 'years_2_3', label: '2–3 Years', shortLabel: '2–3y', emoji: '🧒',
    ageRangeMonths: [24, 36],
    texture: 'family_foods',
    primaryFeedingMode: 'family_foods',
  },
]

export function getStageById(id: AgeStageId): AgeStage {
  return AGE_STAGES.find(s => s.id === id) ?? AGE_STAGES[0]
}

export function getStageForAge(ageMonths: number): AgeStage {
  return AGE_STAGES.find(s =>
    ageMonths >= s.ageRangeMonths[0] && ageMonths < s.ageRangeMonths[1]
  ) ?? AGE_STAGES[AGE_STAGES.length - 1]
}

// ══════════════════════════════════════════════════════════════════════════════
// BABY FOOD DATABASE
// ══════════════════════════════════════════════════════════════════════════════

export const BABY_FOODS: BabyFood[] = [

  // ── Tamil Traditional ──────────────────────────────────────────────────────
  {
    id: 'ragi_porridge', name: 'Ragi Porridge', tamilName: 'ராகி கஞ்சி', emoji: '🥣',
    category: 'tamil_traditional', minAgeMonths: 6,
    textures: ['puree', 'mash'],
    benefits: ['Excellent calcium source', 'Good iron content', 'Easy to digest'],
    nutrients: ['Calcium', 'Iron', 'Fibre', 'Amino acids'],
    safety: 'safe',
    preparationTips: [
      'Mix ragi flour with water or breast milk/formula for a smooth paste',
      'Cook on low heat, stirring continuously until thick',
      'Cool to a safe temperature before feeding',
      'Start very thin — thicken gradually as baby adjusts',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'rice_porridge', name: 'Rice Porridge (Kanji)', tamilName: 'அரிசி கஞ்சி', emoji: '🍚',
    category: 'tamil_traditional', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Easily digestible', 'Gentle first food', 'Energy source'],
    nutrients: ['Carbohydrates', 'B vitamins', 'Iron (when fortified)'],
    safety: 'safe',
    preparationTips: [
      'Cook rice with extra water until very soft and mushy',
      'Can mix with breast milk, formula, or dal water',
      'Red rice or hand-pounded rice adds more nutrients',
      'Can add a small amount of ghee after 8 months',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'moong_dal', name: 'Moong Dal (Green Gram Dal)', tamilName: 'பாசிப்பருப்பு', emoji: '🫘',
    category: 'tamil_traditional', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Excellent first protein', 'Easy to digest', 'Folate and iron'],
    nutrients: ['Protein', 'Iron', 'Folate', 'Fibre'],
    safety: 'safe',
    preparationTips: [
      'Wash, soak 30 mins, cook very soft with plenty of water',
      'Blend or mash to smooth consistency for young babies',
      'Mix with rice for a complete protein combination',
      'Khichdi with moong dal and rice is a classic first combination',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'soft_idli', name: 'Soft Idli', tamilName: 'இட்லி', emoji: '🫓',
    category: 'tamil_traditional', minAgeMonths: 8,
    textures: ['mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Fermented — good for gut health', 'Easy to digest', 'Protein from dal'],
    nutrients: ['Protein', 'Carbohydrates', 'B vitamins', 'Probiotics'],
    safety: 'safe',
    preparationTips: [
      'For babies 8–10 months: mash idli with sambar or water',
      'For 10–12 months: soft small pieces, well mashed',
      'For toddlers: small bite-sized soft pieces',
      'Avoid very hot sambar — check temperature carefully',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'khichdi', name: 'Rice & Dal Khichdi', tamilName: 'கிச்சடி', emoji: '🍲',
    category: 'tamil_traditional', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Complete protein combination', 'Balanced carbs and protein', 'Very gentle on digestion'],
    nutrients: ['Protein', 'Iron', 'Carbohydrates', 'B vitamins'],
    safety: 'safe',
    preparationTips: [
      'Use 1:1 ratio rice to moong dal with 4× water',
      'Cook until very soft and mushy',
      'Add mashed vegetables for older babies',
      'A small amount of ghee adds healthy fats for babies over 8 months',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'vegetable_kootu', name: 'Soft Vegetable Kootu', tamilName: 'கூட்டு', emoji: '🥘',
    category: 'tamil_traditional', minAgeMonths: 8,
    textures: ['mash', 'soft_lumps'],
    benefits: ['Multiple vegetables in one meal', 'Protein from dal', 'Rich in vitamins'],
    nutrients: ['Vitamins A & C', 'Iron', 'Protein', 'Fibre'],
    safety: 'safe',
    preparationTips: [
      'Cook vegetables and dal very soft',
      'Mash well before serving to babies under 10 months',
      'Avoid too much spice for young babies',
      'Start with mild vegetables like pumpkin or bottle gourd',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'kambu_porridge', name: 'Kambu Porridge', tamilName: 'கம்பு கஞ்சி', emoji: '🥣',
    category: 'tamil_traditional', minAgeMonths: 8,
    textures: ['puree', 'mash'],
    benefits: ['Higher iron than wheat', 'Good calcium', 'Traditional weaning food'],
    nutrients: ['Iron', 'Calcium', 'Fibre', 'Protein'],
    safety: 'safe',
    preparationTips: [
      'Mix kambu flour with water, cook to smooth porridge',
      'Start with small amounts — introduce gradually',
      'Can sweeten with a small amount of jaggery for toddlers (avoid added sugar for infants)',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'samai_pongal', name: 'Samai Pongal', tamilName: 'சாமை பொங்கல்', emoji: '🍚',
    category: 'tamil_traditional', minAgeMonths: 10,
    textures: ['mash', 'soft_lumps'],
    benefits: ['Light millet — gentle on digestion', 'Iron content', 'Good variety grain'],
    nutrients: ['Iron', 'Fibre', 'Protein'],
    safety: 'safe',
    preparationTips: [
      'Cook samai with moong dal until very soft',
      'Mash well for younger babies',
      'Mild tempering with ghee and cumin is fine for babies over 10 months',
    ],
    chokingRisk: false, commonAllergen: false,
  },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  {
    id: 'banana_baby', name: 'Banana', tamilName: 'வாழைப்பழம்', emoji: '🍌',
    category: 'fruits', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods', 'family_foods'],
    benefits: ['Natural sweetness babies love', 'Potassium', 'Easy first food'],
    nutrients: ['Potassium', 'Vitamin B6', 'Vitamin C', 'Fibre'],
    safety: 'safe',
    preparationTips: [
      '6–8 months: mash well with a fork, no added sugar',
      '8–10 months: soft mashed or small soft pieces',
      '10–12 months: small soft slices',
      'Toddlers: sliced pieces or whole small banana',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'apple_baby', name: 'Apple', tamilName: 'ஆப்பிள்', emoji: '🍎',
    category: 'fruits', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Fibre for digestion', 'Vitamin C', 'Natural sweetness'],
    nutrients: ['Fibre', 'Vitamin C', 'Potassium'],
    safety: 'safe',
    preparationTips: [
      '6–8 months: steam/cook and puree — raw apple is a choking hazard',
      '8–10 months: finely grated raw or soft-cooked pieces',
      '10–12 months: soft-cooked thin slices',
      'Toddlers 18m+: very thin raw slices (watch carefully)',
    ],
    chokingRisk: true,
    chokingNote: 'Raw apple chunks are a choking hazard. Always cook or grate for children under 18 months.',
    commonAllergen: false,
  },
  {
    id: 'pear_baby', name: 'Pear', tamilName: 'பேரிக்காய்', emoji: '🍐',
    category: 'fruits', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Very gentle on digestion', 'Natural sweetness', 'Fibre'],
    nutrients: ['Fibre', 'Vitamin C', 'Folate'],
    safety: 'safe',
    preparationTips: [
      '6–8 months: cook and puree',
      '8–10 months: soft-cooked small pieces or mash',
      '10–12 months: ripe soft pear in small pieces',
      'Very ripe pear can be given soft without cooking',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'mango_baby', name: 'Mango', tamilName: 'மாம்பழம்', emoji: '🥭',
    category: 'fruits', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Vitamins A & C', 'Natural sweetness', 'Antioxidants'],
    nutrients: ['Vitamins A & C', 'Folate', 'Potassium'],
    safety: 'safe',
    safetyNote: 'Only fully ripe mango. Some babies may show peri-oral rash (skin contact reaction) — this is different from an allergy. If concerned, consult your paediatrician.',
    preparationTips: [
      '6–8 months: ripe mango puree',
      '8–12 months: soft mango pieces',
      'Always ripe and soft — never unripe mango for babies',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'avocado_baby', name: 'Avocado', emoji: '🥑',
    category: 'fruits', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Healthy fats for brain development', 'Creamy texture', 'Calorie-dense'],
    nutrients: ['Healthy fats', 'Folate', 'Vitamin K', 'Potassium'],
    safety: 'safe',
    preparationTips: [
      'Mash ripe avocado — no cooking needed',
      'Can mix with breast milk/formula for younger babies',
      'A perfect first food — naturally smooth and nutritious',
      'Store unused portion covered — browns quickly',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'papaya_baby', name: 'Papaya', tamilName: 'பப்பாளி', emoji: '🍈',
    category: 'fruits', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Digestive enzymes', 'Vitamin C', 'Beta-carotene'],
    nutrients: ['Vitamin C', 'Vitamin A', 'Folate'],
    safety: 'safe',
    safetyNote: 'Only fully ripe soft papaya. Never give unripe papaya to babies.',
    preparationTips: [
      'Only fully ripe papaya — soft and orange-fleshed',
      'Mash or puree — no cooking needed when ripe',
      'Remove all seeds carefully',
    ],
    chokingRisk: false, commonAllergen: false,
  },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  {
    id: 'carrot_baby', name: 'Carrot', tamilName: 'கேரட்', emoji: '🥕',
    category: 'vegetables', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Beta-carotene (Vitamin A)', 'Natural sweetness', 'Eye development'],
    nutrients: ['Vitamin A', 'Fibre', 'Potassium'],
    safety: 'safe',
    preparationTips: [
      '6–8 months: steam and puree until completely smooth',
      '8–10 months: soft-cooked and mashed',
      '10–12 months: soft-cooked small pieces',
      'Raw carrot sticks are a choking hazard — always cook for under 18 months',
    ],
    chokingRisk: true,
    chokingNote: 'Raw carrot is a choking hazard. Always cook until soft for children under 18 months.',
    commonAllergen: false,
  },
  {
    id: 'pumpkin_baby', name: 'Pumpkin', tamilName: 'பூசணிக்காய்', emoji: '🎃',
    category: 'vegetables', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Naturally sweet', 'Beta-carotene', 'Easy to digest'],
    nutrients: ['Vitamin A', 'Potassium', 'Fibre'],
    safety: 'safe',
    preparationTips: [
      'Steam or bake until very soft',
      'Blends to silky smooth puree easily',
      'One of the best first vegetables — mild, sweet, nutritious',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'sweet_potato_baby', name: 'Sweet Potato', tamilName: 'சேனைக்கிழங்கு', emoji: '🍠',
    category: 'vegetables', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Vitamin A powerhouse', 'Natural sweetness', 'Sustained energy'],
    nutrients: ['Vitamin A', 'Vitamin C', 'Potassium', 'Fibre'],
    safety: 'safe',
    preparationTips: [
      'Bake or steam and mash — very easy preparation',
      'Naturally sweet — babies generally love it',
      'Mix with dal or yogurt for added protein',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'bottle_gourd_baby', name: 'Bottle Gourd (Surakkai)', tamilName: 'சுரக்காய்', emoji: '🫙',
    category: 'vegetables', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Very easy to digest', 'Hydrating', 'Gentle first vegetable'],
    nutrients: ['Water', 'Vitamin C', 'Fibre', 'Calcium'],
    safety: 'safe',
    preparationTips: [
      'Cook until very soft and blend to smooth puree',
      'Very mild taste — easy for babies to accept',
      'Good for babies with digestive sensitivity',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'potato_baby', name: 'Potato', tamilName: 'உருளைக்கிழங்கு', emoji: '🥔',
    category: 'vegetables', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Energy from carbohydrates', 'Potassium', 'Versatile base'],
    nutrients: ['Carbohydrates', 'Potassium', 'Vitamin C', 'B vitamins'],
    safety: 'safe',
    preparationTips: [
      'Boil or steam and mash — never add salt for babies under 1 year',
      'Can mix with vegetable purees',
      'Mashed potato is a classic easy first food',
    ],
    chokingRisk: false, commonAllergen: false,
  },

  // ── Protein ────────────────────────────────────────────────────────────────
  {
    id: 'egg_baby', name: 'Egg (Well Cooked)', tamilName: 'முட்டை', emoji: '🥚',
    category: 'protein', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Complete protein', 'Choline for brain development', 'Iron and Vitamin D'],
    nutrients: ['Protein', 'Choline', 'Iron', 'Vitamins D & B12'],
    safety: 'safe',
    safetyNote: 'Always cook eggs fully — no runny yolks for babies. Egg is a common allergen; introduce a small amount first and watch for reactions over 3 days before giving more.',
    preparationTips: [
      'Introduce well-cooked egg yolk first around 6 months',
      'Introduce whole egg (yolk + white) from 6 months — current guidance supports early introduction',
      'Scrambled egg: cook fully until no runniness',
      'Watch for any allergic reaction when introducing for first time',
    ],
    chokingRisk: false,
    commonAllergen: true,
    allergenName: 'Egg',
  },
  {
    id: 'chicken_baby', name: 'Chicken (Well Cooked)', tamilName: 'சிக்கன்', emoji: '🍗',
    category: 'protein', minAgeMonths: 8,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['High quality protein', 'Iron', 'B vitamins'],
    nutrients: ['Protein', 'Iron', 'Zinc', 'B vitamins'],
    safety: 'safe',
    safetyNote: 'Always cook chicken thoroughly. Never serve undercooked poultry.',
    preparationTips: [
      '8–10 months: blend cooked chicken with broth or vegetables',
      '10–12 months: finely shredded soft-cooked chicken',
      'Toddlers: small tender pieces',
      'Never give whole pieces or tough chicken to young babies',
    ],
    chokingRisk: true,
    chokingNote: 'Chicken pieces can be a choking hazard. Ensure it is finely shredded or pureed for babies under 10 months.',
    commonAllergen: false,
  },
  {
    id: 'fish_baby', name: 'Fish (Low-Mercury, Well Cooked)', tamilName: 'மீன்', emoji: '🐟',
    category: 'protein', minAgeMonths: 8,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Omega-3 for brain and eye development', 'High quality protein', 'Vitamin D'],
    nutrients: ['Omega-3', 'Protein', 'Vitamin D', 'Iodine'],
    safety: 'safe',
    safetyNote: 'Choose low-mercury fish: tilapia, rohu, catfish, sardines. Avoid high-mercury fish (shark, swordfish). Fish is a common allergen — introduce carefully.',
    preparationTips: [
      'Choose boneless low-mercury fish',
      'Cook thoroughly — no raw fish for babies',
      'Check carefully for any bones before serving',
      'Blend or flake finely for younger babies',
    ],
    chokingRisk: true,
    chokingNote: 'Fish bones are a serious choking hazard. Always check thoroughly for bones.',
    commonAllergen: true,
    allergenName: 'Fish',
  },

  // ── Global / Dairy ──────────────────────────────────────────────────────────
  {
    id: 'oatmeal_baby', name: 'Oatmeal', emoji: '🥣',
    category: 'global', minAgeMonths: 6,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Iron-fortified versions available', 'Fibre', 'Beta-glucan'],
    nutrients: ['Iron', 'Fibre', 'B vitamins', 'Magnesium'],
    safety: 'safe',
    preparationTips: [
      'Use finely ground or baby oats',
      'Cook with breast milk, formula, or water',
      'Iron-fortified baby oatmeal is excellent for babies',
      'Start thin and thicken as baby progresses',
    ],
    chokingRisk: false,
    commonAllergen: false,
  },
  {
    id: 'yogurt_baby', name: 'Plain Full-Fat Yogurt', emoji: '🥛',
    category: 'dairy', minAgeMonths: 8,
    textures: ['puree', 'mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Calcium', 'Protein', 'Probiotics for gut health'],
    nutrients: ['Calcium', 'Protein', 'Probiotics', 'B12'],
    safety: 'safe',
    safetyNote: 'Plain full-fat pasteurised yogurt only. Dairy is a common allergen — introduce carefully. Whole cow\'s milk as a main drink is not recommended under 12 months, but small amounts of dairy in food (yogurt, cheese) can be introduced from ~6–8 months with guidance.',
    preparationTips: [
      'Use plain unsweetened full-fat yogurt only — no flavoured or low-fat',
      'Mix with fruit purees for added flavour naturally',
      'Dairy is a common allergen — watch for reactions',
    ],
    chokingRisk: false,
    commonAllergen: true,
    allergenName: 'Dairy',
  },
  {
    id: 'soft_pasta_baby', name: 'Soft Pasta', emoji: '🍝',
    category: 'global', minAgeMonths: 9,
    textures: ['mash', 'soft_lumps', 'finger_foods'],
    benefits: ['Energy', 'Enriched with iron in many varieties', 'Easy to eat'],
    nutrients: ['Carbohydrates', 'Iron (enriched)', 'B vitamins'],
    safety: 'safe',
    safetyNote: 'Wheat is a common allergen — introduce small amount first and observe.',
    preparationTips: [
      'Cook until very soft — beyond al dente',
      'Small shapes (stelline, ditalini) or broken pieces',
      'Mix with vegetable puree or soft sauce',
    ],
    chokingRisk: false,
    commonAllergen: true,
    allergenName: 'Wheat/Gluten',
  },
  {
    id: 'quinoa_baby', name: 'Quinoa', emoji: '🌾',
    category: 'global', minAgeMonths: 8,
    textures: ['puree', 'mash', 'soft_lumps'],
    benefits: ['Complete protein — all amino acids', 'Iron', 'Gluten-free'],
    nutrients: ['Complete protein', 'Iron', 'Magnesium', 'Fibre'],
    safety: 'safe',
    preparationTips: [
      'Rinse well before cooking (removes bitter coating)',
      'Cook in water or broth until soft and fluffy',
      'Blend for younger babies, serve as is for older ones',
      'Mix with vegetable puree or dal',
    ],
    chokingRisk: false, commonAllergen: false,
  },
  {
    id: 'peanut_butter_baby', name: 'Peanut Butter (Thin/Diluted)', emoji: '🥜',
    category: 'protein', minAgeMonths: 6,
    textures: ['puree', 'mash'],
    benefits: ['Protein and healthy fats', 'Early introduction may reduce allergy risk'],
    nutrients: ['Protein', 'Healthy fats', 'Niacin', 'Folate'],
    safety: 'caution',
    safetyNote: 'Peanut is a major allergen. Current guidance supports early introduction (from ~6 months) for most babies to help prevent allergy — but discuss with your paediatrician first, especially if there is eczema or a family history of peanut allergy. NEVER give whole peanuts or thick peanut butter — choking hazard.',
    preparationTips: [
      'Thin smooth peanut butter with water or breast milk to a loose consistency',
      'Introduce a very small amount first (tip of teaspoon)',
      'Wait 3 days and watch for any reaction before increasing',
      'Never give whole peanuts or thick spoonfuls — choking risk',
    ],
    chokingRisk: true,
    chokingNote: 'Whole peanuts and thick peanut butter are choking hazards. Only thinned smooth peanut butter.',
    commonAllergen: true,
    allergenName: 'Peanut',
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// STAGE GUIDES
// ══════════════════════════════════════════════════════════════════════════════

export const STAGE_GUIDES: StageGuide[] = [
  {
    stageId: 'months_0_6',
    title: 'Milk is Everything',
    overview: 'For most babies in this stage, breast milk or appropriately prepared infant formula provides complete nutrition. Solid foods are generally not developmentally appropriate before around 6 months. The focus here is on feeding well, feeding safely, and recognising your baby\'s cues.',
    feedingOverview: 'Breast milk or infant formula is the sole recommended source of nutrition for most babies under 6 months. Introducing solids before developmental readiness is not recommended and can carry risks.',
    milkFeeding: 'Breastfeeding on demand is ideal — typically every 2–3 hours for newborns, gradually spacing out. If formula feeding, follow your healthcare provider\'s and formula manufacturer\'s guidance on amounts and preparation. Never add cereal to bottles. Never dilute formula.',
    solidsFocus: null,
    textureFocus: 'milk_only',
    dailyMeals: 0,
    keyNutrients: [
      { name: 'Breast milk / Formula', emoji: '🍼', reason: 'Complete nutrition for this stage', sources: ['Breast milk', 'Infant formula (as directed by healthcare provider)'] },
      { name: 'Vitamin D', emoji: '☀️', reason: 'Many breastfed babies need supplementation — ask your doctor', sources: ['Consult your paediatrician about supplementation'] },
    ],
    tamilFoods: [],
    globalFoods: [],
    fruits: [],
    vegetables: [],
    proteinFoods: [],
    foodsToAvoid: [
      'All solid foods until developmental readiness and healthcare guidance',
      'Honey — risk of infant botulism',
      'Cow\'s milk as a main drink',
      'Sugar, salt, and seasoning',
      'Juice',
      'Choking hazards',
    ],
    chokingSafety: [
      'No solid foods in this stage for most babies',
      'Always feed lying at a safe angle or upright',
      'Never prop a bottle',
      'Wind baby after feeds to prevent discomfort',
    ],
    developerMilestones: [
      'Signs of readiness for solids (usually around 6 months): sitting with minimal support, showing interest in food, loss of tongue-thrust reflex',
      'These signs together suggest readiness — not one sign alone',
      'Discuss with your paediatrician before starting solids',
    ],
    doctorNote: 'Always follow your paediatrician\'s guidance on when and how to start solids. Developmental readiness varies between babies. The WHO recommends exclusive breastfeeding for 6 months where possible.',
  },
  {
    stageId: 'months_6_9',
    title: 'First Foods Journey',
    overview: 'Around 6 months, when your baby shows signs of developmental readiness, you can begin introducing complementary foods alongside milk. This is an exciting milestone — but milk (breast milk or formula) remains the primary nutrition source.',
    feedingOverview: 'Breast milk or formula remains the main nutrition. Solid foods are complementary at this stage — they introduce new tastes and textures, not replace milk feeds.',
    milkFeeding: 'Continue breastfeeding on demand or formula feeds (approximately 600–800ml/day). Solids are in addition to, not instead of, milk at this stage.',
    solidsFocus: 'Start with smooth, single-ingredient purees. Introduce one new food at a time and wait 3–5 days before trying something new — this helps identify any reactions.',
    textureFocus: 'puree',
    dailyMeals: 2,
    keyNutrients: [
      { name: 'Iron', emoji: '💪', reason: 'Breast milk iron decreases from 6 months; iron-rich foods are important', sources: ['Ragi', 'Moong dal', 'Pureed meat', 'Iron-fortified baby cereals', 'Pureed spinach'] },
      { name: 'Zinc', emoji: '⚡', reason: 'Supports immune function and growth', sources: ['Pureed meat', 'Lentils', 'Egg yolk', 'Oatmeal'] },
      { name: 'Vitamin A', emoji: '🥕', reason: 'Immune function and eye development', sources: ['Sweet potato', 'Carrot', 'Pumpkin', 'Mango'] },
    ],
    tamilFoods: ['Ragi porridge', 'Rice porridge (kanji)', 'Moong dal puree', 'Pumpkin puree', 'Bottle gourd puree', 'Sweet potato mash'],
    globalFoods: ['Avocado mash', 'Sweet potato puree', 'Pear puree', 'Oatmeal', 'Banana mash'],
    fruits: ['Banana (mashed)', 'Pear (cooked puree)', 'Apple (cooked puree)', 'Avocado (mashed)', 'Mango (soft puree)'],
    vegetables: ['Sweet potato', 'Pumpkin', 'Carrot (cooked puree)', 'Potato', 'Bottle gourd', 'Zucchini'],
    proteinFoods: ['Moong dal', 'Well-cooked egg yolk (from ~6m)', 'Whole cooked egg (discuss timing with paediatrician)', 'Lentil puree'],
    foodsToAvoid: ['Honey (until 12 months — botulism risk)', 'Salt and sugar', 'Cow\'s milk as main drink', 'Whole nuts and seeds (choking)', 'Raw hard vegetables', 'Unpasteurised dairy', 'High-mercury fish', 'Processed/packaged baby snacks with added sugar'],
    chokingSafety: ['Always puree or mash to smooth consistency', 'Never leave baby unattended while eating', 'Sit baby upright during meals', 'Start with small amounts — 1–2 teaspoons'],
    developerMilestones: ['Sitting with support', 'Opens mouth when food is offered', 'Can move food from spoon to back of mouth', 'Shows interest in what others are eating'],
    doctorNote: 'Introduce common allergens (egg, peanut butter, fish, dairy, wheat) one at a time with 3–5 days between new ones. Discuss with your paediatrician for guidance, especially if your baby has eczema or family history of allergies.',
  },
  {
    stageId: 'months_9_12',
    title: 'Expanding Tastes & Textures',
    overview: 'Baby is now more experienced with food. Textures can progress from smooth to mashed with soft lumps. Variety increases significantly — introducing more family foods in appropriate textures.',
    feedingOverview: 'Milk feeds continue (3–4 times/day). Solids are now 2–3 meals plus small snacks. Baby is developing chewing skills and hand-to-mouth coordination.',
    milkFeeding: 'Breast milk or formula continues — approximately 500–600ml formula/day if formula fed. Breastfeeding on demand continues.',
    solidsFocus: 'Progress to mashed and soft lumpy foods. Introduce finger foods — soft pieces baby can self-feed. This is the age for Baby-Led Weaning or a combined spoon/finger food approach.',
    textureFocus: 'soft_lumps',
    dailyMeals: 3,
    keyNutrients: [
      { name: 'Iron', emoji: '💪', reason: 'Critical at this stage — actively include iron-rich foods daily', sources: ['Ragi', 'Moong dal', 'Soft chicken/fish', 'Egg', 'Khichdi', 'Oatmeal'] },
      { name: 'Calcium', emoji: '🦴', reason: 'Bone and teeth development', sources: ['Ragi', 'Yogurt', 'Soft cheese', 'Calcium-fortified foods'] },
      { name: 'Zinc', emoji: '⚡', reason: 'Growth and immunity', sources: ['Meat', 'Lentils', 'Egg', 'Oats'] },
    ],
    tamilFoods: ['Ragi porridge', 'Soft idli mashed with sambar', 'Khichdi', 'Soft vegetable kootu', 'Samai pongal (soft)', 'Dal rice', 'Kambu porridge'],
    globalFoods: ['Oatmeal with banana', 'Avocado on soft toast pieces', 'Well-cooked pasta', 'Scrambled egg (soft)', 'Quinoa with vegetable'],
    fruits: ['Banana pieces', 'Soft-cooked apple slices', 'Ripe mango pieces', 'Pear pieces', 'Papaya pieces', 'Soft melon pieces'],
    vegetables: ['Steamed carrot sticks (soft)', 'Sweet potato wedges (soft)', 'Pumpkin pieces', 'Peas (squished)', 'Broccoli florets (well-cooked)'],
    proteinFoods: ['Scrambled egg', 'Finely shredded chicken', 'Soft fish (boneless)', 'Dal', 'Yogurt', 'Soft tofu'],
    foodsToAvoid: ['Honey', 'Cow\'s milk as main drink', 'Whole grapes, nuts, popcorn (choking)', 'Raw hard vegetables', 'Added salt and sugar', 'High-mercury fish', 'Hard cheese chunks'],
    chokingSafety: ['Cut all foods into small soft pieces — no larger than 1cm', 'Grapes must be quartered lengthways', 'No whole nuts or seeds', 'Always sit upright', 'No food in the car/pram (hard to monitor)'],
    developerMilestones: ['Pincer grasp developing (picking up small items with thumb and finger)', 'Self-feeding finger foods', 'Chewing with gums', 'Showing preferences and dislikes'],
    doctorNote: 'Your baby should have been introduced to all major allergens by now. 9-month developmental check with your paediatrician is a good time to discuss feeding progress.',
  },
  {
    stageId: 'years_1_2',
    title: 'Toddler Table Time',
    overview: 'After the first birthday, toddlers transition to a more varied diet closer to family foods. Cow\'s milk can now replace formula as a drink (up to ~400ml/day). Three meals plus 2 snacks is a typical pattern.',
    feedingOverview: 'Three main meals plus 2 snacks daily. Cow\'s whole milk (up to ~400ml/day) or continued breastfeeding. Toddlers can now eat most family foods in appropriate textures.',
    milkFeeding: 'Whole cow\'s milk can now be introduced as a drink (about 300–400ml/day). Continued breastfeeding is also beneficial. Avoid low-fat milk for under 2 years.',
    solidsFocus: 'Most family foods are appropriate now. Focus on variety, iron-rich foods, and healthy fats. Limit salt, sugar, and processed foods.',
    textureFocus: 'finger_foods',
    dailyMeals: 3,
    keyNutrients: [
      { name: 'Iron', emoji: '💪', reason: 'Iron deficiency is common in toddlers — include iron-rich foods daily', sources: ['Ragi', 'Dal', 'Egg', 'Chicken', 'Kambu', 'Leafy greens', 'Oats'] },
      { name: 'Calcium', emoji: '🦴', reason: 'Ongoing bone development', sources: ['Whole milk', 'Ragi', 'Yogurt', 'Cheese', 'Drumstick leaves'] },
      { name: 'Healthy fats', emoji: '🥑', reason: 'Brain development continues to age 3', sources: ['Avocado', 'Ghee (small amounts)', 'Nut butters', 'Oily fish', 'Eggs'] },
    ],
    tamilFoods: ['Idli + sambar', 'Soft dosa + chutney', 'Rice + dal + vegetable', 'Kambu roti', 'Ragi dosa', 'Pongal', 'Khichdi', 'Curd rice'],
    globalFoods: ['Oatmeal with fruit', 'Scrambled eggs on toast', 'Pasta with soft sauce', 'Rice with lentils', 'Yogurt with fruit'],
    fruits: ['Most fruits in age-appropriate pieces', 'Banana', 'Mango', 'Grapes (quartered lengthways)', 'Orange segments', 'Strawberry pieces'],
    vegetables: ['Most cooked and many raw vegetables', 'Carrot sticks (can be raw now for most toddlers with supervision)', 'Broccoli', 'Peas', 'Spinach', 'Sweet potato'],
    proteinFoods: ['Egg (all ways)', 'Chicken pieces (tender)', 'Fish (boneless)', 'Dal varieties', 'Yogurt', 'Cheese', 'Smooth nut butters'],
    foodsToAvoid: ['Honey is now fine after 12 months', 'Avoid: whole grapes, whole cherry tomatoes, whole nuts, large chunks of meat (choking)', 'Limit: added salt, added sugar, processed snacks, sugary drinks, fruit juice', 'Avoid: low-fat milk (under 2 years)'],
    chokingSafety: ['Grapes and cherry tomatoes must still be quartered', 'Supervise all meals', 'No eating while walking or playing', 'Sit at a table for meals'],
    developerMilestones: ['Using spoon (messy but important!)', 'Drinking from an open cup', 'Strong food preferences emerging', 'Can eat most family foods'],
    doctorNote: 'Iron deficiency anaemia is common in toddlers. Regular paediatric check-ups monitor growth and development. Discuss concerns about food refusal (very common at this age) with your paediatrician.',
  },
  {
    stageId: 'years_2_3',
    title: 'Full Family Foods',
    overview: 'Toddlers aged 2–3 eat mostly family foods. Focus on building healthy habits, offering variety, and making mealtimes positive. Food refusal and strong preferences are developmentally normal.',
    feedingOverview: 'Three meals and 1–2 snacks. Whole milk or continued breastfeeding. Appetite varies greatly day to day — this is normal.',
    milkFeeding: 'About 300–350ml whole milk/day or continued breastfeeding. Semi-skimmed milk can be introduced from age 2 if growth is normal.',
    solidsFocus: 'Full family foods in appropriate pieces. Focus on variety across all food groups. Healthy fat foods support continued brain development.',
    textureFocus: 'family_foods',
    dailyMeals: 3,
    keyNutrients: [
      { name: 'Iron', emoji: '💪', reason: 'Ongoing need — include iron-rich foods daily', sources: ['Kambu', 'Ragi', 'Dal', 'Egg', 'Meat', 'Keerai', 'Oats'] },
      { name: 'Calcium', emoji: '🦴', reason: 'Bone building continues', sources: ['Milk', 'Ragi', 'Yogurt', 'Cheese', 'Sesame (ellu podi)'] },
      { name: 'Omega-3', emoji: '🐟', reason: 'Brain and eye development to age 3', sources: ['Oily fish (sardines, salmon)', 'Walnuts', 'Chia seeds', 'Eggs'] },
    ],
    tamilFoods: ['Full family meals in appropriate portions', 'Kambu / ragi / samai varieties', 'Dal rice', 'Sambar', 'Kootu', 'Idli', 'Dosa', 'Curd rice'],
    globalFoods: ['Oatmeal', 'Eggs in various forms', 'Pasta', 'Sandwiches', 'Yogurt', 'Fruit salads'],
    fruits: ['All fruits', 'Encourage variety', 'Whole fruit preferred over juice'],
    vegetables: ['All vegetables', 'Aim for variety of colours', 'Include leafy greens regularly'],
    proteinFoods: ['Eggs', 'Chicken', 'Fish (2×/week, low mercury)', 'Dal varieties', 'Yogurt', 'Cheese', 'Smooth nut butters', 'Beans and legumes'],
    foodsToAvoid: ['Whole nuts (choking risk still applies)', 'High-salt processed foods', 'Sugary drinks including juice', 'No whole grapes without supervision (cut in half at minimum)'],
    chokingSafety: ['Whole nuts still a choking risk at this age', 'Supervise all meals', 'Grapes can be halved (not quartered as before) for most 2-year-olds — use judgment'],
    developerMilestones: ['Using fork and spoon independently', 'Drinking from an open cup', 'Strong opinions about food — normal!', 'Helping in simple food preparation is great for engagement'],
    doctorNote: 'Fussy eating is extremely common at this age — offer variety without pressure. Division of responsibility: parents decide what and when; child decides whether and how much. Discuss persistent concerns with your paediatrician.',
  },
]

export function getStageGuide(stageId: AgeStageId): StageGuide {
  return STAGE_GUIDES.find(g => g.stageId === stageId) ?? STAGE_GUIDES[0]
}

export function getFoodsByAgeStage(minAgeMonths: number): BabyFood[] {
  return BABY_FOODS.filter(f => f.minAgeMonths <= minAgeMonths)
}

export function getFoodsByCategory(category: BabyFood['category'], minAgeMonths: number): BabyFood[] {
  return BABY_FOODS.filter(f => f.category === category && f.minAgeMonths <= minAgeMonths)
}

// ══════════════════════════════════════════════════════════════════════════════
// MEAL TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

const MEAL_DB: Record<string, Record<string, { name: string; emoji: string; texture: TextureLevel; nutrients: string[] }[]>> = {
  months_6_9: {
    breakfast: [
      { name: 'Ragi Porridge', emoji: '🥣', texture: 'puree', nutrients: ['Calcium', 'Iron'] },
      { name: 'Rice Kanji with Moong Dal', emoji: '🍚', texture: 'puree', nutrients: ['Protein', 'Iron'] },
      { name: 'Banana Mash', emoji: '🍌', texture: 'puree', nutrients: ['Potassium', 'B6'] },
      { name: 'Oatmeal Puree', emoji: '🥣', texture: 'puree', nutrients: ['Iron', 'Fibre'] },
    ],
    lunch: [
      { name: 'Moong Dal & Rice Khichdi', emoji: '🍲', texture: 'puree', nutrients: ['Protein', 'Iron'] },
      { name: 'Sweet Potato Puree', emoji: '🍠', texture: 'puree', nutrients: ['Vitamin A', 'Fibre'] },
      { name: 'Pumpkin & Dal Puree', emoji: '🎃', texture: 'puree', nutrients: ['Vitamin A', 'Protein'] },
    ],
    snack: [
      { name: 'Apple Puree', emoji: '🍎', texture: 'puree', nutrients: ['Vitamin C', 'Fibre'] },
      { name: 'Pear Puree', emoji: '🍐', texture: 'puree', nutrients: ['Fibre', 'Vitamin C'] },
      { name: 'Avocado Mash', emoji: '🥑', texture: 'mash', nutrients: ['Healthy fats', 'Folate'] },
    ],
    dinner: [
      { name: 'Bottle Gourd & Rice Puree', emoji: '🫙', texture: 'puree', nutrients: ['Vitamin C', 'Carbs'] },
      { name: 'Ragi & Banana Porridge', emoji: '🥣', texture: 'puree', nutrients: ['Calcium', 'Potassium'] },
      { name: 'Moong Dal Soup', emoji: '🥣', texture: 'puree', nutrients: ['Protein', 'Iron'] },
    ],
  },
  months_9_12: {
    breakfast: [
      { name: 'Ragi Porridge with Banana', emoji: '🥣', texture: 'mash', nutrients: ['Calcium', 'Potassium'] },
      { name: 'Soft Idli Mashed with Dal', emoji: '🫓', texture: 'soft_lumps', nutrients: ['Protein', 'B vitamins'] },
      { name: 'Oatmeal with Mango', emoji: '🥣', texture: 'mash', nutrients: ['Iron', 'Vitamin A'] },
      { name: 'Scrambled Egg (soft)', emoji: '🥚', texture: 'soft_lumps', nutrients: ['Protein', 'Choline'] },
    ],
    lunch: [
      { name: 'Dal Khichdi with Vegetables', emoji: '🍲', texture: 'soft_lumps', nutrients: ['Protein', 'Iron', 'Vitamins'] },
      { name: 'Rice + Dal + Mashed Carrot', emoji: '🍚', texture: 'soft_lumps', nutrients: ['Iron', 'Vitamin A'] },
      { name: 'Samai Pongal (soft)', emoji: '🍚', texture: 'soft_lumps', nutrients: ['Iron', 'Protein'] },
    ],
    snack: [
      { name: 'Soft Banana Pieces', emoji: '🍌', texture: 'finger_foods', nutrients: ['Potassium', 'B6'] },
      { name: 'Sweet Potato Wedges (soft-cooked)', emoji: '🍠', texture: 'finger_foods', nutrients: ['Vitamin A', 'Fibre'] },
      { name: 'Yogurt with Mashed Fruit', emoji: '🥛', texture: 'mash', nutrients: ['Calcium', 'Protein'] },
    ],
    dinner: [
      { name: 'Vegetable Khichdi', emoji: '🍲', texture: 'soft_lumps', nutrients: ['Protein', 'Iron', 'Vitamins'] },
      { name: 'Soft Idli + Sambar', emoji: '🫓', texture: 'soft_lumps', nutrients: ['Protein', 'B vitamins'] },
      { name: 'Rice + Moong Dal Soup', emoji: '🍚', texture: 'soft_lumps', nutrients: ['Protein', 'Iron'] },
    ],
  },
  years_1_2: {
    breakfast: [
      { name: 'Ragi Dosa + Coconut Chutney', emoji: '🥞', texture: 'finger_foods', nutrients: ['Calcium', 'Iron'] },
      { name: 'Idli + Sambar', emoji: '🫓', texture: 'finger_foods', nutrients: ['Protein', 'B vitamins'] },
      { name: 'Oatmeal with Banana & Almonds', emoji: '🥣', texture: 'soft_lumps', nutrients: ['Iron', 'Calcium'] },
      { name: 'Scrambled Eggs on Toast', emoji: '🍳', texture: 'finger_foods', nutrients: ['Protein', 'Choline'] },
    ],
    morningSnack: [
      { name: 'Banana Slices', emoji: '🍌', texture: 'finger_foods', nutrients: ['Potassium', 'B6'] },
      { name: 'Soft Fruit Pieces', emoji: '🍎', texture: 'finger_foods', nutrients: ['Vitamin C', 'Fibre'] },
      { name: 'Yogurt', emoji: '🥛', texture: 'soft_lumps', nutrients: ['Calcium', 'Protein'] },
    ],
    lunch: [
      { name: 'Rice + Dal + Vegetable', emoji: '🍚', texture: 'finger_foods', nutrients: ['Protein', 'Iron', 'Vitamins'] },
      { name: 'Kambu Roti + Dal', emoji: '🫓', texture: 'finger_foods', nutrients: ['Iron', 'Protein'] },
      { name: 'Soft Pasta with Vegetable Sauce', emoji: '🍝', texture: 'soft_lumps', nutrients: ['Carbs', 'Iron', 'Vitamins'] },
    ],
    eveningSnack: [
      { name: 'Ragi Ladoo (small)', emoji: '🧆', texture: 'finger_foods', nutrients: ['Calcium', 'Iron'] },
      { name: 'Soft Fruit with Yogurt', emoji: '🥛', texture: 'soft_lumps', nutrients: ['Calcium', 'Vitamin C'] },
      { name: 'Steamed Vegetable Pieces', emoji: '🥕', texture: 'finger_foods', nutrients: ['Vitamins', 'Fibre'] },
    ],
    dinner: [
      { name: 'Dal Rice + Beetroot Poriyal', emoji: '🍚', texture: 'finger_foods', nutrients: ['Iron', 'Folate'] },
      { name: 'Idli + Moong Dal', emoji: '🫓', texture: 'finger_foods', nutrients: ['Protein', 'Iron'] },
      { name: 'Khichdi with Vegetables', emoji: '🍲', texture: 'soft_lumps', nutrients: ['Protein', 'Iron', 'Vitamins'] },
    ],
  },
  years_2_3: {
    breakfast: [
      { name: 'Ragi Dosa + Egg Bhurji', emoji: '🥚', texture: 'family_foods', nutrients: ['Calcium', 'Protein'] },
      { name: 'Oatmeal with Fruits & Nuts', emoji: '🥣', texture: 'family_foods', nutrients: ['Iron', 'Omega-3'] },
      { name: 'Idli + Sambar + Coconut Chutney', emoji: '🫓', texture: 'family_foods', nutrients: ['Protein', 'Fibre'] },
    ],
    morningSnack: [
      { name: 'Fruit Salad', emoji: '🍎', texture: 'family_foods', nutrients: ['Vitamins C & A', 'Fibre'] },
      { name: 'Soaked Almonds (4–5)', emoji: '🌰', texture: 'family_foods', nutrients: ['Healthy fats', 'Calcium'] },
      { name: 'Yogurt with Mango', emoji: '🥛', texture: 'family_foods', nutrients: ['Calcium', 'Vitamin A'] },
    ],
    lunch: [
      { name: 'Rice + Sambar + Vegetables', emoji: '🍚', texture: 'family_foods', nutrients: ['Protein', 'Iron', 'Vitamins'] },
      { name: 'Chapati / Kambu Roti + Dal + Sabzi', emoji: '🫓', texture: 'family_foods', nutrients: ['Iron', 'Fibre', 'Protein'] },
      { name: 'Pasta with Chicken & Vegetables', emoji: '🍝', texture: 'family_foods', nutrients: ['Protein', 'Iron', 'Vitamins'] },
    ],
    eveningSnack: [
      { name: 'Sundal (chickpeas)', emoji: '🫘', texture: 'family_foods', nutrients: ['Protein', 'Iron'] },
      { name: 'Banana & Peanut Butter (smooth, thin)', emoji: '🍌', texture: 'family_foods', nutrients: ['Protein', 'Potassium'] },
      { name: 'Curd with Fruit', emoji: '🥛', texture: 'family_foods', nutrients: ['Calcium', 'Vitamins'] },
    ],
    dinner: [
      { name: 'Rice + Dal + Keerai Kootu', emoji: '🍚', texture: 'family_foods', nutrients: ['Protein', 'Iron', 'Calcium'] },
      { name: 'Ragi Porridge with Dates & Almonds', emoji: '🥣', texture: 'family_foods', nutrients: ['Calcium', 'Iron'] },
      { name: 'Idli + Vegetable Sambar', emoji: '🫓', texture: 'family_foods', nutrients: ['Protein', 'Vitamins'] },
    ],
  },
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateBabyMealPlan(
  stageId: AgeStageId,
  dietType: BabyDietType,
  preference: 'tamil' | 'global' | 'mixed',
  days = 7,
): BabyMealPlan {
  // 0-6 months: no solid meal plan
  if (stageId === 'months_0_6') {
    return {
      stageId, days: [], dietType, preference,
      generatedAt: new Date().toISOString(),
    }
  }

  const templates = MEAL_DB[stageId] ?? MEAL_DB['months_6_9']
  const hasSnacks = stageId === 'years_1_2' || stageId === 'years_2_3'

  const milkFeedNote: Record<AgeStageId, string> = {
    months_0_6:  'Breast milk or formula exclusively',
    months_6_9:  'Continue breast milk / formula on demand (approx. 4–5 feeds/day)',
    months_9_12: 'Continue breast milk / formula (approx. 3–4 feeds/day)',
    years_1_2:   'Whole milk ~300–400ml/day or continued breastfeeding',
    years_2_3:   'Whole/semi-skimmed milk ~300ml/day',
  }

  const dayPlans: BabyDayPlan[] = Array.from({ length: days }, (_, i) => {
    const bf  = pickRandom(templates.breakfast ?? [])
    const lu  = pickRandom(templates.lunch ?? [])
    const dn  = pickRandom(templates.dinner ?? [])
    const sn  = templates.snack    ? pickRandom(templates.snack)    : undefined
    const msn = templates.morningSnack  ? pickRandom(templates.morningSnack)  : undefined
    const esn = templates.eveningSnack  ? pickRandom(templates.eveningSnack)  : undefined

    const toEntry = (m: typeof bf): BabyMealEntry => ({
      name: m.name, emoji: m.emoji, texture: m.texture,
      description: `${m.nutrients.slice(0, 2).join(', ')}`,
      nutrients: m.nutrients,
    })

    return {
      dayLabel:     DAYS[i % 7],
      breakfast:    toEntry(bf),
      lunch:        toEntry(lu),
      dinner:       toEntry(dn),
      morningSnack: msn ? toEntry(msn) : sn ? toEntry(sn) : undefined,
      eveningSnack: hasSnacks && esn ? toEntry(esn) : undefined,
      milkFeeds:    milkFeedNote[stageId],
      waterNote:    (['months_9_12','years_1_2','years_2_3'] as AgeStageId[]).includes(stageId)
        ? 'Offer small sips of water with meals'
        : undefined,
    }
  })

  return {
    stageId, days: dayPlans, dietType, preference,
    generatedAt: new Date().toISOString(),
  }
}

// ── Default allergen tracker items ─────────────────────────────────────────────
export const DEFAULT_ALLERGEN_FOODS = [
  { foodId: 'egg',       foodName: 'Egg',              emoji: '🥚', category: 'allergen' as const },
  { foodId: 'peanut',    foodName: 'Peanut',           emoji: '🥜', category: 'allergen' as const },
  { foodId: 'dairy',     foodName: 'Dairy (Cow\'s milk products)', emoji: '🥛', category: 'allergen' as const },
  { foodId: 'wheat',     foodName: 'Wheat / Gluten',   emoji: '🌾', category: 'allergen' as const },
  { foodId: 'soy',       foodName: 'Soy',              emoji: '🫘', category: 'allergen' as const },
  { foodId: 'fish',      foodName: 'Fish',             emoji: '🐟', category: 'allergen' as const },
  { foodId: 'shellfish', foodName: 'Shellfish',        emoji: '🦐', category: 'allergen' as const },
  { foodId: 'tree_nuts', foodName: 'Tree Nuts (cashew, almond, walnut)', emoji: '🌰', category: 'allergen' as const },
  { foodId: 'sesame',    foodName: 'Sesame',           emoji: '🌿', category: 'allergen' as const },
]
