import type {
  FamilyMember, MemberRole, FamilyMeal, MemberAdaptation,
  FamilyDayPlan, CuisinePreference, ShoppingItem, ShoppingCategory,
} from '../types/family'

// ── Member config ─────────────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<MemberRole, { label: string; emoji: string; color: string }> = {
  adult_male:    { label: 'Adult (Male)',    emoji: '👨', color: 'from-blue-500 to-indigo-500'   },
  adult_female:  { label: 'Adult (Female)',  emoji: '👩', color: 'from-purple-500 to-violet-500' },
  pregnant:      { label: 'Pregnant',        emoji: '🤰', color: 'from-pink-500 to-rose-500'     },
  baby:          { label: 'Baby',            emoji: '👶', color: 'from-teal-400 to-cyan-400'     },
  toddler:       { label: 'Toddler',         emoji: '🧒', color: 'from-green-500 to-emerald-500' },
  senior_male:   { label: 'Senior (Male)',   emoji: '👴', color: 'from-amber-500 to-orange-500'  },
  senior_female: { label: 'Senior (Female)', emoji: '👵', color: 'from-orange-500 to-amber-400'  },
  child:         { label: 'Child',           emoji: '🧒', color: 'from-lime-500 to-green-400'    },
}

export function getMemberAge(m: FamilyMember): number {
  if (m.dateOfBirth) {
    const dob = new Date(m.dateOfBirth)
    const now = new Date()
    return Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  }
  return m.ageYears ?? 0
}

export function getMemberAgeLabel(m: FamilyMember): string {
  if (m.role === 'baby')    return `${m.ageMonths ?? 0} months`
  if (m.role === 'toddler') return `${getMemberAge(m)} years`
  if (m.role === 'pregnant') return m.pregnancyWeek ? `Week ${m.pregnancyWeek}` : 'Pregnant'
  return `${getMemberAge(m)} yrs`
}

// ── Tamil meal templates ──────────────────────────────────────────────────────

const TAMIL_BREAKFASTS = [
  { name: 'Idli + Sambar + Coconut Chutney',  emoji: '🫓', nutrients: ['Protein', 'Iron', 'Probiotics']       },
  { name: 'Ragi Dosa + Coconut Chutney',       emoji: '🥞', nutrients: ['Calcium', 'Iron', 'Fibre']            },
  { name: 'Kambu Idli + Drumstick Sambar',     emoji: '🫓', nutrients: ['Iron', 'Calcium', 'Folate']           },
  { name: 'Samai Pongal + Rasam',              emoji: '🍚', nutrients: ['Iron', 'Protein', 'Antioxidants']     },
  { name: 'Thinai Upma + Coconut Chutney',     emoji: '🥘', nutrients: ['Iron', 'Fibre', 'B vitamins']         },
  { name: 'Ragi Porridge + Banana',            emoji: '🥣', nutrients: ['Calcium', 'Potassium', 'Iron']        },
]
const TAMIL_LUNCHES = [
  { name: 'Red Rice + Drumstick Sambar + Keerai Kootu + Curd',emoji: '🍚', nutrients: ['Iron', 'Calcium', 'Folate', 'Protein']  },
  { name: 'Rice + Dal + Beetroot Poriyal + Appalam',            emoji: '🍚', nutrients: ['Protein', 'Iron', 'Folate']             },
  { name: 'Kambu Roti + Dal + Mixed Vegetable Curry',           emoji: '🫓', nutrients: ['Iron', 'Fibre', 'Protein']              },
  { name: 'Rice + Chicken Kulambu + Beans Poriyal',             emoji: '🍚', nutrients: ['Protein', 'Iron', 'Vitamins']           },
  { name: 'Red Rice + Fish Curry + Keerai + Curd',              emoji: '🐟', nutrients: ['Omega-3', 'Iron', 'Calcium', 'Folate']  },
  { name: 'Rice + Rajma + Mixed Vegetables + Papad',            emoji: '🍚', nutrients: ['Protein', 'Iron', 'Fibre']              },
]
const TAMIL_SNACKS = [
  { name: 'Ragi Ladoo',                emoji: '🧆', nutrients: ['Calcium', 'Iron']         },
  { name: 'Sundal (Chana)',             emoji: '🫘', nutrients: ['Protein', 'Fibre', 'Iron'] },
  { name: 'Banana + Soaked Almonds',    emoji: '🍌', nutrients: ['Potassium', 'Vitamin E']  },
  { name: 'Ellu Urundai (small)',       emoji: '🌰', nutrients: ['Calcium', 'Iron']         },
  { name: 'Cucumber + Peanut Chutney',  emoji: '🥒', nutrients: ['Hydration', 'Protein']   },
]
const TAMIL_DINNERS = [
  { name: 'Rice + Moong Dal + Bottle Gourd Kootu', emoji: '🍚', nutrients: ['Protein', 'Iron', 'Fibre']    },
  { name: 'Idli + Drumstick Sambar',               emoji: '🫓', nutrients: ['Protein', 'Folate', 'Iron']   },
  { name: 'Ragi Dosa + Egg Bhurji',                emoji: '🥚', nutrients: ['Calcium', 'Protein', 'Choline']},
  { name: 'Dal Khichdi + Curd',                    emoji: '🍲', nutrients: ['Protein', 'Probiotics']       },
  { name: 'Thinai Pongal + Rasam',                 emoji: '🍚', nutrients: ['Iron', 'Protein']             },
  { name: 'Rice + Chicken Pepper Fry + Dal',       emoji: '🍗', nutrients: ['Protein', 'Iron', 'Zinc']     },
]

// ── Global meal templates ─────────────────────────────────────────────────────

const GLOBAL_BREAKFASTS = [
  { name: 'Oatmeal + Banana + Almonds',           emoji: '🥣', nutrients: ['Iron', 'Potassium', 'Fibre']      },
  { name: 'Scrambled Eggs + Whole Grain Toast',    emoji: '🍳', nutrients: ['Protein', 'Choline', 'Fibre']     },
  { name: 'Greek Yogurt + Berries + Granola',      emoji: '🥛', nutrients: ['Calcium', 'Protein', 'Antioxidants']},
  { name: 'Avocado Toast + Poached Egg',           emoji: '🥑', nutrients: ['Healthy fats', 'Protein', 'Folate'] },
  { name: 'Quinoa Porridge + Mixed Berries',       emoji: '🥣', nutrients: ['Complete protein', 'Antioxidants']},
]
const GLOBAL_LUNCHES = [
  { name: 'Baked Salmon + Quinoa + Roasted Vegetables', emoji: '🐟', nutrients: ['Omega-3', 'Complete protein', 'Vitamins']},
  { name: 'Lentil Soup + Whole Grain Bread',            emoji: '🥣', nutrients: ['Protein', 'Iron', 'Fibre']               },
  { name: 'Grilled Chicken Salad + Avocado',            emoji: '🥗', nutrients: ['Protein', 'Healthy fats', 'Iron']        },
  { name: 'Chickpea & Spinach Stew + Brown Rice',       emoji: '🍲', nutrients: ['Iron', 'Protein', 'Folate']              },
  { name: 'Pasta with Tomato Sauce + Vegetables',       emoji: '🍝', nutrients: ['Carbs', 'Lycopene', 'Vitamins']          },
]
const GLOBAL_SNACKS = [
  { name: 'Apple + Almond Butter',         emoji: '🍎', nutrients: ['Fibre', 'Healthy fats']    },
  { name: 'Greek Yogurt + Pomegranate',    emoji: '🥛', nutrients: ['Calcium', 'Protein', 'Iron']},
  { name: 'Hummus + Carrot Sticks',        emoji: '🥕', nutrients: ['Protein', 'Fibre', 'Vitamins']},
  { name: 'Chia Pudding with Mango',       emoji: '🫙', nutrients: ['Omega-3', 'Fibre', 'Vitamin A']},
  { name: 'Walnuts + Dates',               emoji: '🌰', nutrients: ['Omega-3', 'Iron', 'Energy'] },
]
const GLOBAL_DINNERS = [
  { name: 'Baked Chicken + Sweet Potato + Greens', emoji: '🍗', nutrients: ['Protein', 'Vitamin A', 'Iron']       },
  { name: 'Vegetable Stir Fry + Brown Rice',       emoji: '🍚', nutrients: ['Vitamins', 'Fibre', 'Carbs']         },
  { name: 'Fish Tacos + Avocado + Salad',          emoji: '🌮', nutrients: ['Omega-3', 'Healthy fats', 'Protein'] },
  { name: 'Lentil Dal + Naan + Salad',             emoji: '🍛', nutrients: ['Protein', 'Iron', 'Fibre']           },
  { name: 'Egg Fried Rice + Vegetables',           emoji: '🍳', nutrients: ['Protein', 'Choline', 'Fibre']        },
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Build member adaptation ───────────────────────────────────────────────────

export function buildAdaptation(
  member: FamilyMember,
  _mealTime: FamilyMeal['mealTime'],
): MemberAdaptation {
  const cfg   = ROLE_CONFIG[member.role]
  const base  = (desc: string, portion: string, texture?: string, notes?: string): MemberAdaptation => ({
    memberId:    member.id,
    memberName:  member.name,
    memberEmoji: cfg.emoji,
    description: desc,
    portion,
    texture,
    notes,
  })

  switch (member.role) {
    case 'baby':
      if ((member.ageMonths ?? 0) < 6) {
        return base('Breast milk or formula only — no solid foods at this stage', 'On demand', 'milk_only', 'Consult paediatrician before starting solids')
      }
      if ((member.ageMonths ?? 0) < 9) {
        return base('Soft puree version of family base (dal, rice, vegetable)', 'Small — 2–4 tbsp', 'puree', 'Single ingredient, no salt/sugar/honey')
      }
      return base('Mashed soft version with family vegetables and dal', 'Small portion', 'soft_lumps', 'Soft finger foods can be offered alongside')

    case 'toddler':
      return base('Family meal in small toddler portion — soft, no whole nuts', 'Toddler portion (¼ adult)', 'finger_foods', 'No honey before 1yr; grapes must be halved')

    case 'pregnant':
      return base(
        `Pregnancy-adapted portion — extra iron and calcium focus${member.pregnancyWeek ? ` (Week ${member.pregnancyWeek})` : ''}`,
        'Standard + extra serving of protein/iron food',
        undefined,
        'Add drumstick leaves or ragi if available. Avoid raw foods.',
      )

    case 'senior_male':
    case 'senior_female':
      return base('Softer texture, smaller portion, low salt, extra fibre', 'Moderate — 70% of adult', 'soft', 'Reduce oil, increase vegetables and calcium')

    case 'child':
      return base('Child-sized portion — all family foods fine', 'Half adult portion', undefined, 'Avoid excess salt and processed ingredients')

    default:
      return base('Standard adult portion', 'Full serving', undefined, undefined)
  }
}

// ── Generate a single family meal ─────────────────────────────────────────────

export function generateFamilyMeal(
  members: FamilyMember[],
  mealTime: FamilyMeal['mealTime'],
  cuisine: CuisinePreference,
): FamilyMeal {
  const tamil  = cuisine === 'tamil' || cuisine === 'mixed'
  const global = cuisine === 'global' || (cuisine === 'mixed')

  let pool: { name: string; emoji: string; nutrients: string[] }[]
  if (mealTime === 'breakfast') pool = tamil ? TAMIL_BREAKFASTS : global ? GLOBAL_BREAKFASTS : [...TAMIL_BREAKFASTS, ...GLOBAL_BREAKFASTS]
  else if (mealTime === 'lunch') pool = tamil ? TAMIL_LUNCHES : global ? GLOBAL_LUNCHES : [...TAMIL_LUNCHES, ...GLOBAL_LUNCHES]
  else if (mealTime === 'snack') pool = tamil ? TAMIL_SNACKS : global ? GLOBAL_SNACKS : [...TAMIL_SNACKS, ...GLOBAL_SNACKS]
  else pool = tamil ? TAMIL_DINNERS : global ? GLOBAL_DINNERS : [...TAMIL_DINNERS, ...GLOBAL_DINNERS]

  const base = pickRandom(pool)

  // Filter pool for non-veg if all members are vegetarian
  const allVeg = members.every(m => m.dietPref === 'vegetarian' || m.dietPref === 'vegan')
  const vegTerms = ['chicken', 'fish', 'egg', 'mutton', 'prawn', 'salmon', 'tuna', 'meat']
  const filteredPool = allVeg
    ? pool.filter(p => !vegTerms.some(t => p.name.toLowerCase().includes(t)))
    : pool
  const safePick = filteredPool.length > 0 ? pickRandom(filteredPool) : base

  return {
    baseName:        safePick.name,
    baseEmoji:       safePick.emoji,
    baseDescription: `Family base: ${safePick.name}`,
    nutrients:       safePick.nutrients,
    mealTime,
    adaptations:     members.map(m => buildAdaptation(m, mealTime)),
  }
}

// ── Generate full week plan ───────────────────────────────────────────────────

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export function generateFamilyWeekPlan(members: FamilyMember[], cuisine: CuisinePreference) {
  const days: FamilyDayPlan[] = DAYS.map(day => ({
    dayLabel:  day,
    breakfast: generateFamilyMeal(members, 'breakfast', cuisine),
    lunch:     generateFamilyMeal(members, 'lunch',     cuisine),
    snack:     generateFamilyMeal(members, 'snack',     cuisine),
    dinner:    generateFamilyMeal(members, 'dinner',    cuisine),
  }))
  return { days, cuisinePreference: cuisine, generatedAt: new Date().toISOString() }
}

// ── Shopping list generator ───────────────────────────────────────────────────

const SHOPPING_TEMPLATES: Record<CuisinePreference, { name: string; emoji: string; category: ShoppingCategory; qty: string }[]> = {
  tamil: [
    { name: 'Ragi flour',         emoji: '🌾', category: 'grains',    qty: '500g'  },
    { name: 'Kambu (millet)',      emoji: '🌾', category: 'grains',    qty: '500g'  },
    { name: 'Red rice',            emoji: '🍚', category: 'grains',    qty: '1kg'   },
    { name: 'Moong dal',           emoji: '🫘', category: 'pulses',    qty: '500g'  },
    { name: 'Chana dal',           emoji: '🫘', category: 'pulses',    qty: '250g'  },
    { name: 'Drumstick leaves',    emoji: '🥬', category: 'vegetables',qty: '1 bunch'},
    { name: 'Spinach (keerai)',    emoji: '🥬', category: 'vegetables',qty: '1 bunch'},
    { name: 'Drumstick',           emoji: '🫛', category: 'vegetables',qty: '4 pieces'},
    { name: 'Carrot',              emoji: '🥕', category: 'vegetables',qty: '250g'  },
    { name: 'Banana',              emoji: '🍌', category: 'fruits',    qty: '1 dozen'},
    { name: 'Pomegranate',         emoji: '🍎', category: 'fruits',    qty: '2'     },
    { name: 'Sesame seeds (ellu)', emoji: '🌿', category: 'nuts_seeds',qty: '100g'  },
    { name: 'Groundnuts',          emoji: '🥜', category: 'nuts_seeds',qty: '200g'  },
    { name: 'Eggs',                emoji: '🥚', category: 'protein',   qty: '12'    },
    { name: 'Curd / Yogurt',       emoji: '🥛', category: 'dairy',     qty: '500ml' },
    { name: 'Coconut',             emoji: '🥥', category: 'other',     qty: '2'     },
  ],
  global: [
    { name: 'Oats',                emoji: '🥣', category: 'grains',    qty: '500g'  },
    { name: 'Quinoa',              emoji: '🌾', category: 'grains',    qty: '300g'  },
    { name: 'Whole grain bread',   emoji: '🍞', category: 'grains',    qty: '1 loaf'},
    { name: 'Brown rice',          emoji: '🍚', category: 'grains',    qty: '500g'  },
    { name: 'Lentils',             emoji: '🫘', category: 'pulses',    qty: '400g'  },
    { name: 'Chickpeas',           emoji: '🫘', category: 'pulses',    qty: '400g'  },
    { name: 'Spinach',             emoji: '🥬', category: 'vegetables',qty: '200g'  },
    { name: 'Broccoli',            emoji: '🥦', category: 'vegetables',qty: '1 head'},
    { name: 'Sweet potato',        emoji: '🍠', category: 'vegetables',qty: '500g'  },
    { name: 'Avocado',             emoji: '🥑', category: 'fruits',    qty: '3'     },
    { name: 'Berries (mixed)',     emoji: '🫐', category: 'fruits',    qty: '300g'  },
    { name: 'Almonds',             emoji: '🌰', category: 'nuts_seeds',qty: '200g'  },
    { name: 'Chia seeds',          emoji: '🫙', category: 'nuts_seeds',qty: '100g'  },
    { name: 'Eggs',                emoji: '🥚', category: 'protein',   qty: '12'    },
    { name: 'Greek yogurt',        emoji: '🥛', category: 'dairy',     qty: '500g'  },
    { name: 'Salmon fillet',       emoji: '🐟', category: 'protein',   qty: '400g'  },
  ],
  mixed: [
    { name: 'Ragi flour',         emoji: '🌾', category: 'grains',    qty: '500g'  },
    { name: 'Oats',               emoji: '🥣', category: 'grains',    qty: '400g'  },
    { name: 'Red rice',           emoji: '🍚', category: 'grains',    qty: '1kg'   },
    { name: 'Quinoa',             emoji: '🌾', category: 'grains',    qty: '200g'  },
    { name: 'Moong dal',          emoji: '🫘', category: 'pulses',    qty: '500g'  },
    { name: 'Lentils',            emoji: '🫘', category: 'pulses',    qty: '300g'  },
    { name: 'Drumstick leaves',   emoji: '🥬', category: 'vegetables',qty: '1 bunch'},
    { name: 'Spinach',            emoji: '🥬', category: 'vegetables',qty: '200g'  },
    { name: 'Sweet potato',       emoji: '🍠', category: 'vegetables',qty: '500g'  },
    { name: 'Carrot',             emoji: '🥕', category: 'vegetables',qty: '250g'  },
    { name: 'Banana',             emoji: '🍌', category: 'fruits',    qty: '1 dozen'},
    { name: 'Avocado',            emoji: '🥑', category: 'fruits',    qty: '2'     },
    { name: 'Almonds',            emoji: '🌰', category: 'nuts_seeds',qty: '200g'  },
    { name: 'Sesame seeds',       emoji: '🌿', category: 'nuts_seeds',qty: '100g'  },
    { name: 'Eggs',               emoji: '🥚', category: 'protein',   qty: '12'    },
    { name: 'Greek yogurt',       emoji: '🥛', category: 'dairy',     qty: '500g'  },
  ],
}

export function generateShoppingList(cuisine: CuisinePreference, members: FamilyMember[]): ShoppingItem[] {
  const base = SHOPPING_TEMPLATES[cuisine]
  const hasPregnant = members.some(m => m.role === 'pregnant')
  const allVeg      = members.every(m => m.dietPref === 'vegetarian' || m.dietPref === 'vegan')

  let items = base.map((t, i) => ({
    id:       `item_${i}`,
    name:     t.name,
    emoji:    t.emoji,
    category: t.category,
    quantity: t.qty,
    checked:  false,
  }))

  // Add pregnancy-specific extras
  if (hasPregnant) {
    items.push({ id: 'extra_ragi', name: 'Ragi (extra for pregnancy)', emoji: '🌿', category: 'grains', quantity: '500g', checked: false })
    items.push({ id: 'extra_drum', name: 'Drumstick (murungakkai)', emoji: '🫛', category: 'vegetables', quantity: '6 pieces', checked: false })
  }

  // Remove meat/fish if all vegetarian
  if (allVeg) {
    const vegTerms = ['salmon', 'chicken', 'fish', 'meat', 'prawn']
    items = items.filter(i => !vegTerms.some(t => i.name.toLowerCase().includes(t)))
  }

  return items
}

export const SHOPPING_CATEGORY_CONFIG: Record<ShoppingCategory, { label: string; emoji: string }> = {
  vegetables: { label: 'Vegetables',    emoji: '🥬' },
  fruits:     { label: 'Fruits',        emoji: '🍎' },
  grains:     { label: 'Grains',        emoji: '🌾' },
  protein:    { label: 'Protein',       emoji: '💪' },
  dairy:      { label: 'Dairy',         emoji: '🥛' },
  nuts_seeds: { label: 'Nuts & Seeds',  emoji: '🥜' },
  pulses:     { label: 'Pulses & Legumes', emoji: '🫘' },
  spices:     { label: 'Spices',        emoji: '🧂' },
  other:      { label: 'Other',         emoji: '🛒' },
}
