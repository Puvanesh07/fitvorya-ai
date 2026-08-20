import type {
  PregnancyFood, MonthlyGuide, WeeklyGuide, MealIdea,
} from '../types/pregnancy'

// ── DISCLAIMER ────────────────────────────────────────────────────────────────
// All content is general nutritional information only. It is not medical advice.
// Always consult a qualified healthcare professional for personalised guidance.
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// FOOD DATABASE
// ══════════════════════════════════════════════════════════════════════════════

export const PREGNANCY_FOODS: PregnancyFood[] = [
  // ── Tamil Traditional ──────────────────────────────────────────────────────
  {
    id: 'kambu', name: 'Kambu (Pearl Millet)', tamilName: 'கம்பு', emoji: '🌾',
    category: 'millets',
    benefits: ['High iron content', 'Rich in fibre', 'Sustained energy'],
    nutrients: ['Iron', 'Calcium', 'Fibre', 'B vitamins'],
    safety: 'safe',
    servingSuggestion: 'Kambu kanji, roti, or porridge',
  },
  {
    id: 'ragi', name: 'Ragi (Finger Millet)', tamilName: 'ராகி', emoji: '🌿',
    category: 'millets',
    benefits: ['Excellent calcium source', 'Supports bone development', 'Iron-rich'],
    nutrients: ['Calcium', 'Iron', 'Amino acids', 'Fibre'],
    safety: 'safe',
    servingSuggestion: 'Ragi koozh, ragi dosa, ragi porridge',
  },
  {
    id: 'thinai', name: 'Thinai (Foxtail Millet)', tamilName: 'தினை', emoji: '🌾',
    category: 'millets',
    benefits: ['Rich in protein', 'Good for blood sugar balance', 'Iron source'],
    nutrients: ['Protein', 'Iron', 'Fibre', 'B vitamins'],
    safety: 'safe',
    servingSuggestion: 'Thinai pongal, upma, or idli',
  },
  {
    id: 'varagu', name: 'Varagu (Kodo Millet)', tamilName: 'வரகு', emoji: '🌾',
    category: 'millets',
    benefits: ['Good source of fibre', 'Supports digestion', 'Nutrient-dense'],
    nutrients: ['Fibre', 'Iron', 'Protein', 'Calcium'],
    safety: 'safe',
    servingSuggestion: 'Varagu rice, porridge',
  },
  {
    id: 'samai', name: 'Samai (Little Millet)', tamilName: 'சாமை', emoji: '🌾',
    category: 'millets',
    benefits: ['Light and digestible', 'Good for nausea-prone periods', 'Iron content'],
    nutrients: ['Iron', 'Fibre', 'Protein'],
    safety: 'safe',
    servingSuggestion: 'Samai rice, pongal, upma',
  },
  {
    id: 'kuthiraivali', name: 'Kuthiraivali (Barnyard Millet)', tamilName: 'குதிரைவாலி', emoji: '🌾',
    category: 'millets',
    benefits: ['High fibre', 'Good for constipation relief', 'Iron-rich'],
    nutrients: ['Fibre', 'Iron', 'Calcium', 'Phosphorus'],
    safety: 'safe',
    servingSuggestion: 'Kuthiraivali pongal, porridge',
  },
  {
    id: 'karuppu_kavuni', name: 'Karuppu Kavuni Rice', tamilName: 'கருப்பு காவுனி', emoji: '🍚',
    category: 'rice',
    benefits: ['Rich in antioxidants', 'Iron and calcium content', 'Traditional grain'],
    nutrients: ['Iron', 'Calcium', 'Antioxidants', 'Fibre'],
    safety: 'safe',
    servingSuggestion: 'Cooked rice, sweet pongal',
  },
  {
    id: 'red_rice', name: 'Red Rice', tamilName: 'சிவப்பு அரிசி', emoji: '🍚',
    category: 'rice',
    benefits: ['Higher nutrients than polished white rice', 'Fibre content', 'Iron source'],
    nutrients: ['Iron', 'Fibre', 'B vitamins', 'Zinc'],
    safety: 'safe',
    servingSuggestion: 'Steamed rice with sambar, kootu',
  },
  {
    id: 'mapillai_samba', name: 'Mapillai Samba Rice', tamilName: 'மாப்பிள்ளை சம்பா', emoji: '🍚',
    category: 'rice',
    benefits: ['Traditional variety', 'Rich in iron', 'Energy-dense'],
    nutrients: ['Iron', 'Zinc', 'Fibre'],
    safety: 'safe',
    servingSuggestion: 'Cooked rice with dal and vegetables',
  },
  // ── Traditional Vegetables ─────────────────────────────────────────────────
  {
    id: 'murungai_keerai', name: 'Drumstick Leaves (Moringa)', tamilName: 'முருங்கை கீரை', emoji: '🥬',
    category: 'vegetables',
    benefits: ['Exceptionally high iron', 'Rich in calcium', 'Folate source'],
    nutrients: ['Iron', 'Calcium', 'Folate', 'Vitamins A & C'],
    safety: 'safe',
    servingSuggestion: 'Keerai kootu, sambar, stir fry',
  },
  {
    id: 'agathi_keerai', name: 'Agathi Keerai', tamilName: 'அகத்தி கீரை', emoji: '🥬',
    category: 'vegetables',
    benefits: ['Iron-rich', 'Supports digestion', 'Calcium source'],
    nutrients: ['Iron', 'Calcium', 'Vitamin C'],
    safety: 'caution',
    safetyNote: 'Best consumed in moderation; consult your midwife if unsure.',
    servingSuggestion: 'Stir fry, kootu — in moderate amounts',
  },
  {
    id: 'spinach', name: 'Spinach / Palak Keerai', tamilName: 'பாலக் கீரை', emoji: '🥬',
    category: 'vegetables',
    benefits: ['Excellent folate source', 'Iron content', 'Antioxidants'],
    nutrients: ['Folate', 'Iron', 'Vitamins A & K', 'Calcium'],
    safety: 'safe',
    servingSuggestion: 'Dal palak, stir fry, kootu',
  },
  {
    id: 'drumstick', name: 'Drumstick (Murungakkai)', tamilName: 'முருங்கைக்காய்', emoji: '🫛',
    category: 'vegetables',
    benefits: ['Good source of calcium', 'Iron content', 'Vitamin C'],
    nutrients: ['Calcium', 'Iron', 'Vitamin C', 'Fibre'],
    safety: 'safe',
    servingSuggestion: 'Sambar, kootu, curry',
  },
  {
    id: 'carrot', name: 'Carrot', tamilName: 'கேரட்', emoji: '🥕',
    category: 'vegetables',
    benefits: ['High beta-carotene (Vitamin A)', 'Fibre', 'Good for eye development'],
    nutrients: ['Vitamin A', 'Fibre', 'Potassium', 'Vitamin C'],
    safety: 'safe',
    servingSuggestion: 'Raw, cooked curry, sambar',
  },
  {
    id: 'beetroot', name: 'Beetroot', tamilName: 'பீட்ரூட்', emoji: '🟣',
    category: 'vegetables',
    benefits: ['High folate', 'Good iron source', 'Supports blood health'],
    nutrients: ['Folate', 'Iron', 'Potassium', 'Vitamin C'],
    safety: 'safe',
    servingSuggestion: 'Poriyal, halwa, juice — in moderation',
  },
  {
    id: 'pumpkin', name: 'Pumpkin (Poosanikai)', tamilName: 'பூசணிக்காய்', emoji: '🎃',
    category: 'vegetables',
    benefits: ['Beta-carotene rich', 'Gentle on digestion', 'Good fibre'],
    nutrients: ['Vitamin A', 'Fibre', 'Potassium', 'Vitamin C'],
    safety: 'safe',
    servingSuggestion: 'Curry, kootu, sambar',
  },
  {
    id: 'bottle_gourd', name: 'Bottle Gourd (Surakkai)', tamilName: 'சுரக்காய்', emoji: '🫙',
    category: 'vegetables',
    benefits: ['Very easy to digest', 'Hydrating', 'Good for nausea-prone periods'],
    nutrients: ['Water', 'Fibre', 'Vitamin C', 'Calcium'],
    safety: 'safe',
    servingSuggestion: 'Kootu, curry, dal',
  },
  {
    id: 'sweet_potato', name: 'Sweet Potato', tamilName: 'சேனைக்கிழங்கு', emoji: '🍠',
    category: 'vegetables',
    benefits: ['Rich in beta-carotene', 'Sustained energy', 'Fibre content'],
    nutrients: ['Vitamin A', 'Potassium', 'Fibre', 'B vitamins'],
    safety: 'safe',
    servingSuggestion: 'Boiled, roasted, curry',
  },
  {
    id: 'ladies_finger', name: "Ladies Finger (Vendaikkai)", tamilName: 'வெண்டைக்காய்', emoji: '🫛',
    category: 'vegetables',
    benefits: ['Good folate source', 'Fibre for digestion', 'Calcium content'],
    nutrients: ['Folate', 'Fibre', 'Calcium', 'Vitamin C'],
    safety: 'safe',
    servingSuggestion: 'Stir fry, curry, sambar',
  },
  // ── Fruits ─────────────────────────────────────────────────────────────────
  {
    id: 'banana', name: 'Banana', tamilName: 'வாழைப்பழம்', emoji: '🍌',
    category: 'fruits',
    benefits: ['Helps with nausea', 'Good potassium source', 'Easy to digest'],
    nutrients: ['Potassium', 'Vitamin B6', 'Fibre', 'Magnesium'],
    safety: 'safe',
    servingSuggestion: '1–2 bananas per day, ideal for morning sickness',
  },
  {
    id: 'pomegranate', name: 'Pomegranate', tamilName: 'மாதுளை', emoji: '🍎',
    category: 'fruits',
    benefits: ['High in folate', 'Iron content', 'Rich in antioxidants'],
    nutrients: ['Folate', 'Iron', 'Vitamin C', 'Potassium'],
    safety: 'safe',
    servingSuggestion: 'Fresh seeds or juice — great for iron absorption',
  },
  {
    id: 'guava', name: 'Guava', tamilName: 'கொய்யாப்பழம்', emoji: '🍈',
    category: 'fruits',
    benefits: ['Very high Vitamin C', 'Folate source', 'Fibre content'],
    nutrients: ['Vitamin C', 'Folate', 'Fibre', 'Potassium'],
    safety: 'safe',
    servingSuggestion: 'Fresh guava — excellent Vitamin C source',
  },
  {
    id: 'orange', name: 'Orange', tamilName: 'ஆரஞ்சு', emoji: '🍊',
    category: 'fruits',
    benefits: ['High Vitamin C aids iron absorption', 'Folate content', 'Hydrating'],
    nutrients: ['Vitamin C', 'Folate', 'Calcium', 'Potassium'],
    safety: 'safe',
    servingSuggestion: 'Fresh fruit or juice — pair with iron-rich meal',
  },
  {
    id: 'apple', name: 'Apple', tamilName: 'ஆப்பிள்', emoji: '🍎',
    category: 'fruits',
    benefits: ['Fibre content', 'Vitamin C', 'Quercetin antioxidants'],
    nutrients: ['Fibre', 'Vitamin C', 'Potassium'],
    safety: 'safe',
    servingSuggestion: 'Eat with skin for maximum fibre',
  },
  {
    id: 'mango', name: 'Mango', tamilName: 'மாம்பழம்', emoji: '🥭',
    category: 'fruits',
    benefits: ['High Vitamin A & C', 'Folate', 'Natural energy'],
    nutrients: ['Vitamins A & C', 'Folate', 'Potassium', 'Fibre'],
    safety: 'moderate',
    safetyNote: 'Ripe mango is generally considered suitable in moderate amounts. Raw/unripe mango preparations are best discussed with your healthcare provider.',
    servingSuggestion: 'Ripe mango in moderate portions',
  },
  {
    id: 'papaya', name: 'Papaya', tamilName: 'பப்பாளி', emoji: '🍈',
    category: 'fruits',
    benefits: ['Ripe papaya provides Vitamin C and folate', 'Digestive enzymes'],
    nutrients: ['Vitamin C', 'Folate', 'Potassium'],
    safety: 'caution',
    safetyNote: 'Ripe papaya in moderate amounts is generally considered safe; unripe or semi-ripe papaya is traditionally avoided during pregnancy. Please discuss with your healthcare provider.',
    servingSuggestion: 'Only fully ripe papaya in small amounts',
  },
  {
    id: 'pear', name: 'Pear', tamilName: 'பேரிக்காய்', emoji: '🍐',
    category: 'fruits',
    benefits: ['High fibre helps constipation', 'Folate content', 'Gentle on digestion'],
    nutrients: ['Fibre', 'Folate', 'Vitamin C', 'Potassium'],
    safety: 'safe',
    servingSuggestion: 'Fresh, washed pear — good for constipation',
  },
  {
    id: 'watermelon', name: 'Watermelon', tamilName: 'தர்பூசணி', emoji: '🍉',
    category: 'fruits',
    benefits: ['Very hydrating', 'Helps with swelling', 'Vitamin C content'],
    nutrients: ['Water', 'Vitamin C', 'Lycopene', 'Potassium'],
    safety: 'safe',
    servingSuggestion: 'Fresh slices — excellent for hydration in third trimester',
  },
  // ── Protein foods ──────────────────────────────────────────────────────────
  {
    id: 'eggs', name: 'Eggs', tamilName: 'முட்டை', emoji: '🥚',
    category: 'protein',
    benefits: ['Complete protein', 'Choline for brain development', 'Vitamin D'],
    nutrients: ['Protein', 'Choline', 'Vitamins D & B12', 'Iron'],
    safety: 'safe',
    safetyNote: 'Always cook eggs fully — avoid raw or undercooked eggs.',
    servingSuggestion: 'Fully cooked: boiled, scrambled, omelette',
  },
  {
    id: 'moong_dal', name: 'Moong Dal (Green Gram)', tamilName: 'பாசிப்பருப்பு', emoji: '🫘',
    category: 'protein',
    benefits: ['Easy to digest protein', 'Folate content', 'Iron source'],
    nutrients: ['Protein', 'Folate', 'Iron', 'Fibre'],
    safety: 'safe',
    servingSuggestion: 'Dal, khichdi, payasam, kootu',
  },
  {
    id: 'chana_dal', name: 'Chana Dal (Chickpea Dal)', tamilName: 'கடலைப்பருப்பு', emoji: '🫘',
    category: 'protein',
    benefits: ['Protein and fibre', 'Iron source', 'Slow digesting carbs'],
    nutrients: ['Protein', 'Iron', 'Fibre', 'B vitamins'],
    safety: 'safe',
    servingSuggestion: 'Dal, sundal, kootu',
  },
  {
    id: 'groundnuts', name: 'Groundnuts / Peanuts', tamilName: 'கடலை', emoji: '🥜',
    category: 'protein',
    benefits: ['Good protein and healthy fats', 'Folate source', 'Niacin content'],
    nutrients: ['Protein', 'Folate', 'Healthy fats', 'Niacin'],
    safety: 'safe',
    safetyNote: 'Fine unless you have a peanut allergy. Introduce with awareness of family allergy history.',
    servingSuggestion: 'Boiled peanuts, peanut chutney, small handful as snack',
  },
  {
    id: 'chicken', name: 'Chicken', tamilName: 'சிக்கன்', emoji: '🍗',
    category: 'protein',
    benefits: ['High quality protein', 'Iron source', 'B vitamins'],
    nutrients: ['Protein', 'Iron', 'Vitamins B6 & B12', 'Zinc'],
    safety: 'safe',
    safetyNote: 'Always cook thoroughly to safe internal temperature.',
    servingSuggestion: 'Well-cooked chicken curry, soup, grilled',
  },
  {
    id: 'fish_low_mercury', name: 'Low-Mercury Fish (Tilapia, Catfish, Sardines)', tamilName: 'மீன்', emoji: '🐟',
    category: 'protein',
    benefits: ['Omega-3 for brain development', 'Protein', 'Vitamin D'],
    nutrients: ['Omega-3', 'Protein', 'Vitamin D', 'Iodine'],
    safety: 'safe',
    safetyNote: 'Choose low-mercury varieties. Avoid high-mercury fish like shark, swordfish, king mackerel.',
    servingSuggestion: 'Well-cooked fish curry, steamed — 2–3 portions per week',
  },
  {
    id: 'sesame', name: 'Sesame Seeds (Ellu)', tamilName: 'எள்', emoji: '🌰',
    category: 'protein',
    benefits: ['Calcium-rich', 'Iron source', 'Healthy fats'],
    nutrients: ['Calcium', 'Iron', 'Healthy fats', 'Protein'],
    safety: 'moderate',
    safetyNote: 'Sesame in normal culinary amounts in cooking is generally fine. Large medicinal doses are traditionally avoided. Consult your midwife if uncertain.',
    servingSuggestion: 'Ellu podi, til ladoo in moderate amounts',
  },
  // ── Global healthy foods ───────────────────────────────────────────────────
  {
    id: 'oats', name: 'Oats', emoji: '🥣',
    category: 'global',
    benefits: ['Sustained energy', 'Beta-glucan fibre', 'Iron content'],
    nutrients: ['Iron', 'Fibre', 'B vitamins', 'Magnesium'],
    safety: 'safe',
    servingSuggestion: 'Oatmeal, overnight oats, oat dosa',
  },
  {
    id: 'quinoa', name: 'Quinoa', emoji: '🌾',
    category: 'global',
    benefits: ['Complete protein (all amino acids)', 'Good iron content', 'Magnesium'],
    nutrients: ['Complete protein', 'Iron', 'Magnesium', 'Fibre'],
    safety: 'safe',
    servingSuggestion: 'Quinoa upma, salad, porridge — can substitute for rice',
  },
  {
    id: 'avocado', name: 'Avocado', emoji: '🥑',
    category: 'global',
    benefits: ['Healthy fats for brain development', 'Folate', 'Potassium'],
    nutrients: ['Folate', 'Healthy fats', 'Potassium', 'Vitamin K'],
    safety: 'safe',
    servingSuggestion: 'Toast, smoothies, salad',
  },
  {
    id: 'greek_yogurt', name: 'Greek Yogurt', emoji: '🥛',
    category: 'dairy',
    benefits: ['High protein', 'Excellent calcium', 'Probiotic bacteria'],
    nutrients: ['Protein', 'Calcium', 'Probiotics', 'Vitamin B12'],
    safety: 'safe',
    safetyNote: 'Choose pasteurised varieties.',
    servingSuggestion: 'With fruit, as a dip, smoothies',
  },
  {
    id: 'chia_seeds', name: 'Chia Seeds', emoji: '🫙',
    category: 'healthy_fats',
    benefits: ['Omega-3 fatty acids', 'High fibre', 'Calcium content'],
    nutrients: ['Omega-3', 'Calcium', 'Fibre', 'Protein'],
    safety: 'safe',
    servingSuggestion: '1–2 tbsp daily — chia pudding, added to porridge or juice',
  },
  {
    id: 'flax_seeds', name: 'Flax Seeds (Alsi)', emoji: '🫙',
    category: 'healthy_fats',
    benefits: ['Omega-3 source', 'Fibre for digestion', 'Lignans'],
    nutrients: ['Omega-3', 'Fibre', 'Protein', 'Magnesium'],
    safety: 'moderate',
    safetyNote: 'Ground flax in small amounts (1 tsp/day) in food is generally considered fine. Large amounts are best avoided. Consult your healthcare provider.',
    servingSuggestion: 'Ground — sprinkle on porridge or dosa batter in small amounts',
  },
  {
    id: 'almonds', name: 'Almonds', emoji: '🌰',
    category: 'healthy_fats',
    benefits: ['Vitamin E', 'Calcium', 'Healthy fats and protein'],
    nutrients: ['Vitamin E', 'Calcium', 'Healthy fats', 'Protein'],
    safety: 'safe',
    servingSuggestion: 'Soaked almonds (8–10/day), almond milk',
  },
  {
    id: 'walnuts', name: 'Walnuts', emoji: '🌰',
    category: 'healthy_fats',
    benefits: ['Plant-based Omega-3', 'Brain-supporting fats', 'Antioxidants'],
    nutrients: ['Omega-3', 'Vitamin E', 'Antioxidants', 'Protein'],
    safety: 'safe',
    servingSuggestion: '4–5 walnuts daily as snack or in porridge',
  },
  {
    id: 'whole_grain_bread', name: 'Whole Grain Bread', emoji: '🍞',
    category: 'grains',
    benefits: ['Fibre for digestion', 'B vitamins', 'Sustained energy'],
    nutrients: ['Fibre', 'B vitamins', 'Iron', 'Magnesium'],
    safety: 'safe',
    servingSuggestion: 'Toast with eggs or avocado',
  },
  {
    id: 'curd', name: 'Curd / Dahi', tamilName: 'தயிர்', emoji: '🥛',
    category: 'dairy',
    benefits: ['Calcium for bone development', 'Probiotics', 'Protein'],
    nutrients: ['Calcium', 'Protein', 'Probiotics', 'Vitamin B12'],
    safety: 'safe',
    servingSuggestion: 'Curd rice, lassi, raita, plain curd',
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// MONTHLY GUIDES
// ══════════════════════════════════════════════════════════════════════════════

export const MONTHLY_GUIDES: MonthlyGuide[] = [
  {
    month: 1, weeks: 'Weeks 1–4', trimester: 1,
    title: 'The Beginning',
    babyDevelopment: 'The embryo is forming. Major organs begin their earliest development. Neural tube formation starts — folate is critical at this stage.',
    motherChanges: 'You may not feel pregnant yet. Some experience light spotting, breast tenderness, or fatigue. Morning sickness may begin toward the end of this month.',
    nutritionFocus: ['Folate (critical for neural tube)', 'Iron', 'Vitamin B6 (for nausea)', 'Hydration'],
    keyNutrients: [
      { name: 'Folate', emoji: '🌿', reason: 'Critical for neural tube formation in weeks 3–4', sources: ['Drumstick leaves', 'Spinach', 'Moong dal', 'Ladies finger', 'Orange'] },
      { name: 'Iron', emoji: '💪', reason: 'Supports blood volume increase beginning now', sources: ['Kambu', 'Ragi', 'Spinach', 'Pomegranate', 'Groundnuts'] },
      { name: 'Vitamin B6', emoji: '🍌', reason: 'May help reduce nausea', sources: ['Banana', 'Potato', 'Chickpeas', 'Oats'] },
    ],
    tamilFoods: ['Ragi koozh', 'Kambu kanji', 'Moong dal kootu', 'Drumstick leaf sambar', 'Spinach kootu', 'Curd rice', 'Idli with sambar'],
    globalFoods: ['Oatmeal with banana', 'Scrambled eggs on toast', 'Avocado toast', 'Greek yogurt', 'Soaked almonds'],
    fruits: ['Banana', 'Orange', 'Guava', 'Pomegranate', 'Apple'],
    vegetables: ['Drumstick leaves', 'Spinach', 'Ladies finger', 'Carrot', 'Beetroot'],
    hydration: 'Aim for 8–10 glasses of water daily. Coconut water is a good option. Avoid excess caffeine.',
    symptomsToNote: ['Nausea', 'Breast tenderness', 'Fatigue', 'Light spotting (implantation)'],
    cautions: ['Avoid alcohol completely', 'Limit caffeine to less than 200mg/day', 'Avoid raw/undercooked eggs and meat', 'Avoid unpasteurised dairy'],
    doctorNote: 'Begin prenatal supplements as advised by your doctor. Folic acid is typically recommended from before conception through the first trimester.',
  },
  {
    month: 2, weeks: 'Weeks 5–8', trimester: 1,
    title: 'Vital Organs Form',
    babyDevelopment: 'Heart begins beating. Brain, spinal cord, and major organs are developing rapidly. Facial features start to form.',
    motherChanges: 'Morning sickness is often at its most intense. Fatigue is common. Heightened smell sensitivity. Food aversions may appear.',
    nutritionFocus: ['Folate', 'Vitamin B6 (nausea management)', 'Iron', 'Protein', 'Zinc'],
    keyNutrients: [
      { name: 'Folate', emoji: '🌿', reason: 'Neural tube closure completes around week 6', sources: ['Spinach', 'Drumstick leaves', 'Moong dal', 'Orange', 'Beetroot'] },
      { name: 'Zinc', emoji: '⚡', reason: 'Supports cell growth and immune function', sources: ['Pumpkin seeds', 'Chickpeas', 'Eggs', 'Chicken', 'Oats'] },
      { name: 'Vitamin B6', emoji: '🍌', reason: 'Commonly helps with nausea', sources: ['Banana', 'Potato', 'Chickpeas', 'Oats'] },
    ],
    tamilFoods: ['Ragi porridge (gentle on stomach)', 'Banana', 'Plain curd rice', 'Samai pongal', 'Soft idli', 'Coconut chutney'],
    globalFoods: ['Plain crackers', 'Banana oatmeal', 'Ginger tea (small amounts)', 'Greek yogurt', 'Avocado'],
    fruits: ['Banana', 'Orange', 'Apple', 'Pear', 'Watermelon'],
    vegetables: ['Bottle gourd', 'Pumpkin', 'Spinach', 'Carrot'],
    hydration: 'Sip water frequently even if nausea is present. Cold water or coconut water may be better tolerated. Avoid large drinks all at once.',
    symptomsToNote: ['Morning sickness (can occur any time of day)', 'Food aversions', 'Strong fatigue', 'Frequent urination'],
    cautions: ['Avoid raw fish (sushi, sashimi)', 'Avoid high-mercury fish', 'Avoid alcohol', 'Limit caffeine'],
    doctorNote: 'Your first antenatal appointment is typically in this period. Discuss any severe vomiting with your doctor — hyperemesis gravidarum needs medical attention.',
  },
  {
    month: 3, weeks: 'Weeks 9–12', trimester: 1,
    title: 'Foetus Takes Shape',
    babyDevelopment: 'All major organs are present. Baby has distinct human features. Moves but you cannot feel it yet. Fingernails and toenails developing.',
    motherChanges: 'Nausea may begin to ease. Energy may slightly return. Uterus is now about grapefruit-sized. Risk of miscarriage reduces significantly after 12 weeks.',
    nutritionFocus: ['Protein', 'Calcium', 'Iron', 'Folate', 'Vitamin D'],
    keyNutrients: [
      { name: 'Protein', emoji: '💪', reason: 'Supports rapid tissue and organ growth', sources: ['Eggs', 'Chicken', 'Moong dal', 'Chana dal', 'Greek yogurt'] },
      { name: 'Calcium', emoji: '🦴', reason: 'Bone and tooth formation begins', sources: ['Ragi', 'Curd', 'Drumstick leaves', 'Sesame', 'Almonds'] },
      { name: 'Vitamin D', emoji: '☀️', reason: 'Aids calcium absorption for bone development', sources: ['Eggs', 'Low-mercury fish', 'Fortified milk', 'Sunlight exposure'] },
    ],
    tamilFoods: ['Ragi mudde', 'Kambu roti', 'Drumstick sambar', 'Egg curry', 'Curd rice', 'Ellu podi rice (in moderation)', 'Keerai kootu'],
    globalFoods: ['Greek yogurt', 'Boiled eggs', 'Oatmeal with almonds', 'Avocado toast', 'Quinoa', 'Sardines (well-cooked)'],
    fruits: ['Pomegranate', 'Orange', 'Guava', 'Apple', 'Pear'],
    vegetables: ['Drumstick leaves', 'Drumstick', 'Spinach', 'Carrot', 'Sweet potato'],
    hydration: '8–10 glasses of water. Coconut water is excellent. Herbal teas like ginger in small amounts may help remaining nausea.',
    symptomsToNote: ['Nausea may ease', 'Headaches possible', 'Bloating', 'Constipation may begin'],
    cautions: ['Continue to avoid alcohol, raw meat, high-mercury fish', 'Avoid unpasteurised cheeses', 'Be careful with herbal teas — not all are safe in pregnancy'],
    doctorNote: 'First trimester screening tests (nuchal scan, blood tests) are typically done in weeks 11–13. Discuss your supplement plan with your doctor.',
  },
  {
    month: 4, weeks: 'Weeks 13–16', trimester: 2,
    title: 'Second Trimester Begins',
    babyDevelopment: 'Baby can now make facial expressions. Skeleton hardens. Baby begins to hear sounds. Gender may be visible on scan.',
    motherChanges: 'Energy often returns. Nausea usually reduces significantly. Belly begins to show. Appetite typically improves.',
    nutritionFocus: ['Protein', 'Calcium', 'Iron', 'Omega-3', 'Fibre'],
    keyNutrients: [
      { name: 'Omega-3', emoji: '🐟', reason: 'Supports brain and eye development', sources: ['Low-mercury fish', 'Walnuts', 'Flaxseed (small amounts)', 'Chia seeds'] },
      { name: 'Calcium', emoji: '🦴', reason: 'Bones and teeth development continues', sources: ['Ragi', 'Curd', 'Milk', 'Drumstick leaves', 'Almonds'] },
      { name: 'Iron', emoji: '💪', reason: 'Blood volume continues to increase', sources: ['Kambu', 'Spinach', 'Pomegranate juice', 'Chicken', 'Beetroot'] },
    ],
    tamilFoods: ['Ragi dosa', 'Kambu idli', 'Fish curry (low-mercury)', 'Drumstick sambar', 'Egg omelette', 'Sundal (various dals)', 'Keerai masiyal'],
    globalFoods: ['Salmon (well-cooked)', 'Quinoa', 'Greek yogurt parfait', 'Chia pudding', 'Walnut salad', 'Avocado'],
    fruits: ['Mango (ripe, moderate)', 'Pomegranate', 'Orange', 'Guava', 'Watermelon'],
    vegetables: ['Spinach', 'Sweet potato', 'Carrot', 'Beetroot', 'Drumstick'],
    hydration: '10 glasses of water daily. Appetite has likely returned — use it to nourish yourself well.',
    symptomsToNote: ['Round ligament pain (normal)', 'Increased appetite', 'Mild back ache', 'Nasal congestion'],
    cautions: ['Continue avoiding high-mercury fish, alcohol, raw foods', 'Watch for gestational diabetes signs — discuss screening with your doctor'],
    doctorNote: 'Anomaly scan (anatomy scan) is typically scheduled around week 18–20. Continue prenatal vitamins as prescribed.',
  },
  {
    month: 5, weeks: 'Weeks 17–20', trimester: 2,
    title: 'You Feel Baby Move',
    babyDevelopment: 'Baby covered in vernix (protective coating). Movements become noticeable (quickening). Hearing is developed. Sleep-wake cycles begin.',
    motherChanges: 'Belly clearly visible. First movements felt. Lower back pressure may increase. Appetite strong.',
    nutritionFocus: ['Iron', 'Protein', 'Calcium', 'Vitamin C', 'Fibre'],
    keyNutrients: [
      { name: 'Iron', emoji: '💪', reason: 'Blood volume is at peak increase now', sources: ['Kambu', 'Ragi', 'Spinach', 'Beetroot', 'Pomegranate', 'Chicken'] },
      { name: 'Vitamin C', emoji: '🍊', reason: 'Enhances iron absorption significantly', sources: ['Orange', 'Guava', 'Lemon', 'Drumstick', 'Tomato'] },
      { name: 'Protein', emoji: '🥚', reason: 'Baby muscle and tissue growth is rapid', sources: ['Eggs', 'Chicken', 'Dal', 'Greek yogurt', 'Fish'] },
    ],
    tamilFoods: ['Kambu kanji with iron-rich accompaniments', 'Chicken curry with rice', 'Ragi roti', 'Drumstick leaf rice', 'Keerai dal', 'Beetroot poriyal'],
    globalFoods: ['Iron-fortified oatmeal', 'Lentil soup', 'Chicken quinoa bowl', 'Greek yogurt', 'Chia seeds', 'Avocado'],
    fruits: ['Orange', 'Guava', 'Pomegranate', 'Apple', 'Watermelon'],
    vegetables: ['Spinach', 'Beetroot', 'Drumstick leaves', 'Carrot', 'Sweet potato'],
    hydration: '10+ glasses. Coconut water excellent. Avoid processed juices with added sugar.',
    symptomsToNote: ['Baby movements', 'Lower back pain', 'Swollen ankles', 'Heartburn beginning'],
    cautions: ['Avoid lying flat on back for extended periods now', 'Watch portions of high-sugar foods', 'Report reduced fetal movement to your doctor'],
    doctorNote: 'Gestational diabetes screening (OGTT) is typically recommended around weeks 24–28. Discuss iron levels at your next check-up.',
  },
  {
    month: 6, weeks: 'Weeks 21–24', trimester: 2,
    title: 'Growing Strong',
    babyDevelopment: 'Baby can respond to sounds and light. Lung development ongoing. Brain developing rapidly. Baby gaining fat under skin.',
    motherChanges: 'Belly expanding noticeably. Braxton Hicks contractions may begin. Heartburn common. Sleep becoming more challenging.',
    nutritionFocus: ['Calcium', 'Vitamin D', 'Iron', 'Magnesium', 'Protein'],
    keyNutrients: [
      { name: 'Calcium', emoji: '🦴', reason: 'Peak bone mineralisation period for baby', sources: ['Ragi', 'Curd', 'Milk', 'Drumstick leaves', 'Almonds', 'Sesame'] },
      { name: 'Magnesium', emoji: '⚡', reason: 'Supports muscle function and may reduce leg cramps', sources: ['Kambu', 'Almonds', 'Oats', 'Banana', 'Chickpeas'] },
      { name: 'Vitamin D', emoji: '☀️', reason: 'Calcium absorption for baby bones', sources: ['Eggs', 'Fish', 'Fortified milk', 'Moderate sun exposure'] },
    ],
    tamilFoods: ['Ragi halwa', 'Ragi dosa with curd', 'Drumstick sambar', 'Sesame rice (ellu sadam) in moderation', 'Almond milk', 'Banana'],
    globalFoods: ['Greek yogurt', 'Fortified oat milk', 'Almond butter on toast', 'Chia pudding', 'Walnut oatmeal'],
    fruits: ['Banana', 'Orange', 'Pomegranate', 'Guava', 'Watermelon'],
    vegetables: ['Drumstick leaves', 'Drumstick', 'Sweet potato', 'Carrot', 'Pumpkin'],
    hydration: '10 glasses minimum. Coconut water is excellent for electrolytes. Avoid carbonated drinks that can worsen heartburn.',
    symptomsToNote: ['Heartburn', 'Braxton Hicks', 'Leg cramps', 'Difficulty sleeping', 'Swelling in feet/ankles'],
    cautions: ['Avoid spicy or acidic foods if heartburn is present', 'Sleep on left side — better circulation', 'Keep legs elevated when resting'],
    doctorNote: 'Gestational diabetes test (OGTT) typically this month. Discuss calcium and Vitamin D levels with your doctor.',
  },
  {
    month: 7, weeks: 'Weeks 25–28', trimester: 3,
    title: 'Third Trimester Begins',
    babyDevelopment: 'Baby opens eyes. Brain development accelerating. Gains significant weight. Lungs maturing. Baby is viable if born now.',
    motherChanges: 'Shortness of breath as uterus pushes up. Frequent urination returns. Fatigue increases. Back pain may intensify.',
    nutritionFocus: ['DHA/Omega-3', 'Iron', 'Protein', 'Vitamin K', 'Fibre'],
    keyNutrients: [
      { name: 'DHA (Omega-3)', emoji: '🐟', reason: 'Critical for brain and eye development this trimester', sources: ['Low-mercury fish', 'Walnuts', 'Chia seeds', 'Flaxseed (small amounts)'] },
      { name: 'Vitamin K', emoji: '🥬', reason: 'Blood clotting for both mother and baby', sources: ['Spinach', 'Drumstick leaves', 'Broccoli', 'Keerai varieties'] },
      { name: 'Iron', emoji: '💪', reason: 'Blood volume still increasing, prepare for birth', sources: ['Kambu', 'Ragi', 'Chicken', 'Pomegranate', 'Beetroot'] },
    ],
    tamilFoods: ['Fish curry with red rice', 'Keerai sambar', 'Drumstick leaf rasam', 'Ragi koozh', 'Chicken kulambu', 'Dal with drumstick'],
    globalFoods: ['Baked salmon', 'Walnut oatmeal', 'Chia seed smoothie', 'Lentil soup', 'Quinoa with vegetables'],
    fruits: ['Watermelon', 'Pomegranate', 'Orange', 'Guava', 'Apple'],
    vegetables: ['Spinach', 'Drumstick leaves', 'Carrot', 'Sweet potato', 'Bottle gourd'],
    hydration: '10–12 glasses. Dehydration can trigger Braxton Hicks. Coconut water is beneficial.',
    symptomsToNote: ['Shortness of breath', 'Back pain', 'Increased Braxton Hicks', 'Insomnia', 'Heartburn'],
    cautions: ['Avoid very spicy food if heartburn is a problem', 'Avoid lying on back', 'Monitor baby movement patterns', 'Avoid raw/undercooked foods'],
    doctorNote: 'Glucose tolerance results should be reviewed. Third trimester scans typically begin. Discuss birth plan with your healthcare team.',
  },
  {
    month: 8, weeks: 'Weeks 29–32', trimester: 3,
    title: 'Baby Fattening Up',
    babyDevelopment: 'Baby gaining weight rapidly — about 200–250g per week. Brain forming billions of connections. Bones hardening. May be in head-down position.',
    motherChanges: 'Uncomfortable but close to the end. Pelvic pressure increases. Heartburn peaks. Colostrum may begin. Very frequent urination.',
    nutritionFocus: ['Calcium', 'Iron', 'Protein', 'Healthy fats', 'Vitamin C'],
    keyNutrients: [
      { name: 'Calcium', emoji: '🦴', reason: 'Baby\'s bone density increase peaks this month', sources: ['Ragi', 'Milk', 'Curd', 'Drumstick leaves', 'Almonds', 'Sesame'] },
      { name: 'Protein', emoji: '💪', reason: 'Baby gaining significant weight — needs protein', sources: ['Eggs', 'Chicken', 'Fish', 'Dal', 'Greek yogurt'] },
      { name: 'Vitamin C', emoji: '🍊', reason: 'Iron absorption and immune support before birth', sources: ['Orange', 'Guava', 'Lemon', 'Drumstick'] },
    ],
    tamilFoods: ['Ragi porridge with milk', 'Drumstick sambar', 'Egg curry', 'Curd with drumstick leaf', 'Kambu roti with dal', 'Sundal'],
    globalFoods: ['Milk-based smoothie', 'Greek yogurt with fruit', 'Almond milk oatmeal', 'Baked chicken', 'Chia pudding with almonds'],
    fruits: ['Orange', 'Pomegranate', 'Guava', 'Apple', 'Watermelon'],
    vegetables: ['Drumstick leaves', 'Carrot', 'Sweet potato', 'Spinach', 'Bottle gourd'],
    hydration: '10–12 glasses. Elevate feet when sitting. Limit fluids right before bedtime to reduce night wake-ups.',
    symptomsToNote: ['Pelvic pressure', 'Waddling gait', 'Heartburn worsens', 'Colostrum leakage (normal)', 'Rib cage discomfort'],
    cautions: ['Small, frequent meals to manage heartburn', 'Avoid heavy meals close to bedtime', 'Report any sudden swelling, headaches, or visual changes immediately'],
    doctorNote: 'Antenatal visits now every 2–4 weeks. Discuss Group B Streptococcus test, birth plan, and breastfeeding preparation with your doctor.',
  },
  {
    month: 9, weeks: 'Weeks 33–36', trimester: 3,
    title: 'Getting Ready',
    babyDevelopment: 'Baby in head-down position in most cases. Lungs nearly mature. Baby practising breathing movements. Fingernails reaching fingertips. Almost full-term.',
    motherChanges: 'Lightening (baby drops lower) may occur. Pelvic pressure may ease breathing slightly. Nesting instinct common. Anxiety about labour.',
    nutritionFocus: ['Iron', 'Vitamin K', 'Protein', 'Energy foods', 'Hydration'],
    keyNutrients: [
      { name: 'Iron', emoji: '💪', reason: 'Prepare iron stores for blood loss during delivery', sources: ['Kambu', 'Ragi', 'Chicken', 'Spinach', 'Pomegranate'] },
      { name: 'Vitamin K', emoji: '🥬', reason: 'Supports blood clotting before and after delivery', sources: ['Keerai', 'Spinach', 'Drumstick leaves', 'Broccoli'] },
      { name: 'Energy foods', emoji: '⚡', reason: 'Building energy reserves for labour', sources: ['Dates', 'Banana', 'Oats', 'Red rice', 'Sweet potato'] },
    ],
    tamilFoods: ['Ragi porridge with dates', 'Kambu kanji', 'Drumstick leaf curry', 'Chicken rice', 'Keerai kootu', 'Ellu urundai (sesame balls — in moderation)'],
    globalFoods: ['Medjool dates (discussed with midwife)', 'Oatmeal with banana', 'Lentil soup', 'Baked chicken with quinoa', 'Greek yogurt'],
    fruits: ['Dates (in consultation with your midwife)', 'Pomegranate', 'Orange', 'Banana', 'Guava'],
    vegetables: ['Spinach', 'Drumstick leaves', 'Carrot', 'Sweet potato', 'Bottle gourd'],
    hydration: 'Stay well hydrated. Dehydration can trigger false contractions.',
    symptomsToNote: ['Pelvic pressure increasing', 'Braxton Hicks more frequent', 'Mucus plug discharge', 'Swelling', 'Insomnia'],
    cautions: ['Report contractions before 37 weeks to your doctor immediately', 'Avoid exhausting yourself', 'Prepare hospital bag'],
    doctorNote: 'Weekly visits may begin. GBS test around weeks 35–37. Discuss signs of true labour vs Braxton Hicks. Finalize birth plan.',
  },
  {
    month: 10, weeks: 'Weeks 37–40+', trimester: 3,
    title: 'Full Term — Baby is Ready',
    babyDevelopment: 'Baby is full term from week 37. Fully formed and ready for the world. Final fat deposition occurring. Lanugo (fine hair) mostly gone.',
    motherChanges: 'Waiting and watching. Pelvic pressure significant. Cervix begins to soften and dilate. Every day counts — lungs and brain still maturing.',
    nutritionFocus: ['Light easily-digestible foods', 'Iron', 'Hydration', 'Energy'],
    keyNutrients: [
      { name: 'Iron', emoji: '💪', reason: 'Final iron stores for delivery and recovery', sources: ['Ragi', 'Kambu', 'Spinach', 'Chicken', 'Pomegranate'] },
      { name: 'Easy energy', emoji: '⚡', reason: 'Labour is physically demanding — keep energy up', sources: ['Banana', 'Dates', 'Rice', 'Oats', 'Sweet potato'] },
      { name: 'Hydration', emoji: '💧', reason: 'Well-hydrated body supports labour progress', sources: ['Water', 'Coconut water', 'Light soup', 'Fruit'] },
    ],
    tamilFoods: ['Light rice with sambar', 'Ragi porridge', 'Banana', 'Curd rice', 'Idli with chutney', 'Coconut water', 'Light chicken soup'],
    globalFoods: ['Oatmeal with banana', 'Toast with eggs', 'Fruit and yogurt', 'Lentil soup', 'Smoothie'],
    fruits: ['Banana', 'Orange', 'Dates', 'Watermelon', 'Pomegranate'],
    vegetables: ['Bottle gourd (easy to digest)', 'Carrot', 'Pumpkin', 'Spinach'],
    hydration: 'Stay well hydrated throughout labour. Coconut water is excellent. Avoid large heavy meals as labour approaches.',
    symptomsToNote: ['Increased Braxton Hicks or real contractions', 'Mucus plug or bloody show', 'Waters breaking', 'Strong pelvic pressure'],
    cautions: ['Go to hospital if: regular contractions 5 min apart, waters break, reduced fetal movement, heavy bleeding'],
    doctorNote: 'Daily or every-other-day monitoring possible after 40 weeks. Do not delay contacting your doctor if you have concerns.',
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// WEEKLY GUIDES (representative weeks — covers 40 weeks by mapping to nearest)
// ══════════════════════════════════════════════════════════════════════════════

const WEEK_MEAL_IDEAS: Record<string, MealIdea[]> = {
  early: [
    { time: 'breakfast', emoji: '🌅', name: 'Ragi Porridge', description: 'Ragi with milk and banana — gentle on morning nausea', dietTypes: ['vegetarian','eggetarian','non_vegetarian','vegan'] },
    { time: 'lunch',     emoji: '🍚', name: 'Curd Rice & Moong Dal', description: 'Easy to digest, good protein and probiotics', dietTypes: ['vegetarian','eggetarian'] },
    { time: 'snack',     emoji: '🍌', name: 'Banana & Almonds', description: 'B6 for nausea, potassium and healthy fats', dietTypes: ['vegetarian','eggetarian','non_vegetarian','vegan'] },
    { time: 'dinner',    emoji: '🌙', name: 'Kambu Idli & Sambar', description: 'Millet-based dinner with drumstick sambar for iron and folate', dietTypes: ['vegetarian','eggetarian','non_vegetarian','vegan'] },
  ],
  mid: [
    { time: 'breakfast', emoji: '🌅', name: 'Oatmeal with Pomegranate', description: 'Iron-rich oats with folate-packed pomegranate seeds', dietTypes: ['vegetarian','eggetarian','non_vegetarian','vegan'] },
    { time: 'lunch',     emoji: '🍚', name: 'Red Rice + Fish Curry', description: 'Omega-3 from low-mercury fish, complex carbs from red rice', dietTypes: ['non_vegetarian'] },
    { time: 'lunch',     emoji: '🍚', name: 'Red Rice + Dal + Keerai', description: 'Protein and iron-rich vegetarian combination', dietTypes: ['vegetarian','eggetarian','vegan'] },
    { time: 'snack',     emoji: '🥛', name: 'Greek Yogurt & Guava', description: 'Calcium and Vitamin C combination', dietTypes: ['vegetarian','eggetarian','non_vegetarian'] },
    { time: 'dinner',    emoji: '🌙', name: 'Chicken Quinoa Bowl', description: 'Complete protein with all amino acids for baby growth', dietTypes: ['non_vegetarian','eggetarian'] },
    { time: 'dinner',    emoji: '🌙', name: 'Ragi Dosa + Egg Bhurji', description: 'Calcium-rich ragi with complete protein egg', dietTypes: ['eggetarian'] },
  ],
  late: [
    { time: 'breakfast', emoji: '🌅', name: 'Kambu Kanji with Dates', description: 'Iron-rich millet porridge with energy-boosting dates', dietTypes: ['vegetarian','eggetarian','non_vegetarian','vegan'] },
    { time: 'lunch',     emoji: '🍚', name: 'Chicken Rice & Drumstick Sambar', description: 'High protein with iron and calcium-rich sambar', dietTypes: ['non_vegetarian'] },
    { time: 'lunch',     emoji: '🍚', name: 'Rice + Sambar + Keerai Kootu', description: 'Balanced vegetarian meal with iron and calcium', dietTypes: ['vegetarian','eggetarian','vegan'] },
    { time: 'snack',     emoji: '🍊', name: 'Orange & Soaked Almonds', description: 'Vitamin C boosts iron absorption from earlier meal', dietTypes: ['vegetarian','eggetarian','non_vegetarian','vegan'] },
    { time: 'dinner',    emoji: '🌙', name: 'Ragi Porridge & Soft Idli', description: 'Light, calcium-rich dinner — easy on heartburn', dietTypes: ['vegetarian','eggetarian','non_vegetarian','vegan'] },
  ],
}

export const WEEKLY_GUIDES: WeeklyGuide[] = Array.from({ length: 40 }, (_, i) => {
  const week = i + 1
  const isEarly = week <= 12
  const isLate  = week >= 29
  const stage   = isEarly ? 'early' : isLate ? 'late' : 'mid'

  const tips: Record<string, { nutrition: string; wellness: string }> = {
    early: {
      nutrition: 'Focus on folate-rich foods like drumstick leaves, spinach, and moong dal. Small, frequent meals can help with nausea.',
      wellness: 'Rest as needed — your body is working hard even if you cannot see it. Light walking is generally fine; consult your doctor for exercise guidance.',
    },
    mid: {
      nutrition: 'Appetite has returned — eat a wide variety of iron, calcium, and protein-rich foods. Include Vitamin C with iron-rich foods for better absorption.',
      wellness: 'Moderate regular activity as advised by your healthcare provider. Sleep on your left side for better circulation.',
    },
    late: {
      nutrition: 'Focus on iron, calcium, and easy-to-digest foods. Smaller more frequent meals help with heartburn and stomach compression.',
      wellness: 'Elevate feet when resting to reduce swelling. Pelvic floor exercises as advised by your healthcare provider. Rest is important.',
    },
  }

  const highlights: Record<string, string> = {
    early: `Week ${week}: Your baby's foundation is forming. Every nutrient you eat supports critical development. Rest when you need to.`,
    mid: `Week ${week}: You're in the golden trimester. Baby is growing rapidly — focus on a varied, nutrient-dense diet.`,
    late: `Week ${week}: The final stretch. Focus on building iron stores and eating light digestible meals.`,
  }

  return {
    week,
    highlights: highlights[stage],
    nutritionTip: tips[stage].nutrition,
    wellnessTip: tips[stage].wellness,
    hydrationGoalLiters: week >= 29 ? 2.5 : 2.0,
    mealIdeas: WEEK_MEAL_IDEAS[stage],
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getFoodsByCategory(category: PregnancyFood['category']): PregnancyFood[] {
  return PREGNANCY_FOODS.filter(f => f.category === category)
}

export function getMonthlyGuide(month: number): MonthlyGuide | undefined {
  return MONTHLY_GUIDES.find(g => g.month === month)
}

export function getWeeklyGuide(week: number): WeeklyGuide {
  const clamped = Math.max(1, Math.min(40, week))
  return WEEKLY_GUIDES[clamped - 1]
}

export function getSafetyColor(safety: PregnancyFood['safety']): string {
  switch (safety) {
    case 'safe':     return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    case 'moderate': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
    case 'caution':  return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400'
    case 'avoid':    return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
  }
}

export function getSafetyLabel(safety: PregnancyFood['safety']): string {
  switch (safety) {
    case 'safe':     return '✓ Generally safe'
    case 'moderate': return '⚠ Moderate amounts'
    case 'caution':  return '⚠ Use caution'
    case 'avoid':    return '✗ Best avoided'
  }
}
