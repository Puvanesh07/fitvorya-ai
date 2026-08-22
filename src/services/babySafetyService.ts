// ── Baby Food Safety Service ─────────────────────────────────────────────────
// Age-based food safety evaluation for babies 0-36+ months.
// Returns appropriate/not-appropriate with medical guidance based on reliable sources.
// IMPORTANT: This is informational only. Always defer to healthcare providers.

import type { UnifiedFood } from '../types/food'

export interface BabySafetyResult {
  level: 'appropriate' | 'not-appropriate' | 'caution' | 'info'
  ageGuidance: string
  reason: string
  recommendation: string
  preparationNotes?: string
}

// ── Age stage definitions ─────────────────────────────────────────────────────
export function getAgeStage(ageMonths: number): string {
  if (ageMonths < 6) return '0-6 months'
  if (ageMonths < 9) return '6-9 months'
  if (ageMonths < 12) return '9-12 months'
  if (ageMonths < 24) return '12-24 months'
  return '24+ months'
}

// ── Foods to AVOID under 12 months ────────────────────────────────────────────
const AVOID_UNDER_12_MONTHS = [
  { keywords: ['honey', 'honeycomb'], reason: 'Risk of infant botulism' },
  { keywords: ['cow milk', "cow's milk", 'whole milk', 'dairy milk'], reason: 'Can cause intestinal bleeding and iron deficiency' },
  { keywords: ['added salt', 'salted', 'soy sauce', 'table salt'], reason: 'Kidneys cannot process excess sodium' },
  { keywords: ['added sugar', 'sweetened', 'sugar syrup'], reason: 'No nutritional benefit, promotes poor eating habits' },
  { keywords: ['artificial sweetener', 'aspartame', 'sucralose'], reason: 'Not suitable for infant development' },
]

// ── Choking hazards (all ages, requires modification) ─────────────────────────
const CHOKING_HAZARDS = [
  'whole grape', 'whole cherry', 'whole nut', 'whole almond', 'whole peanut',
  'popcorn', 'hard candy', 'raw carrot', 'raw apple', 'large pieces',
  'whole raisin', 'whole blueberry', 'cherry tomato', 'hot dog',
  'marshmallow', 'chewing gum', 'hard raw vegetables',
]

// ── High-mercury fish (limit/avoid) ───────────────────────────────────────────
const HIGH_MERCURY_FISH = [
  'shark', 'swordfish', 'king mackerel', 'tilefish', 'marlin', 'orange roughy',
]

// ── Foods requiring careful preparation ───────────────────────────────────────
const ALLERGENIC_FOODS = [
  'peanut', 'tree nut', 'almond', 'cashew', 'walnut',
  'egg', 'milk', 'soy', 'wheat', 'fish', 'shellfish', 'sesame',
]

// ── Main evaluation function ──────────────────────────────────────────────────
export function evaluateBabyFoodSafety(
  food: UnifiedFood,
  ageMonths: number
): BabySafetyResult {
  const foodName = food.name.toLowerCase()
  const ageStage = getAgeStage(ageMonths)

  // ── 0-6 months: Only breast milk or formula ────────────────────────────────
  if (ageMonths < 6) {
    // Exception: breast milk or formula
    if (foodName.includes('breast milk') || foodName.includes('formula') || foodName.includes('infant formula')) {
      return {
        level: 'appropriate',
        ageGuidance: '0-6 months',
        reason: 'Primary nutrition source for infants at this stage.',
        recommendation: 'Breast milk or appropriately prepared infant formula provides complete nutrition.',
      }
    }

    return {
      level: 'not-appropriate',
      ageGuidance: '0-6 months',
      reason: 'Solid foods are not introduced at this stage.',
      recommendation: 'Babies under 6 months only need breast milk or formula. Discuss any feeding changes with your paediatrician before introducing solids.',
    }
  }

  // ── Check foods to avoid under 12 months ───────────────────────────────────
  if (ageMonths < 12) {
    for (const item of AVOID_UNDER_12_MONTHS) {
      for (const keyword of item.keywords) {
        if (foodName.includes(keyword)) {
          return {
            level: 'not-appropriate',
            ageGuidance: ageStage,
            reason: item.reason,
            recommendation: `Avoid ${keyword} until after 12 months of age. Consult your paediatrician.`,
          }
        }
      }
    }
  }

  // ── Check high-mercury fish (all ages) ────────────────────────────────────
  for (const fish of HIGH_MERCURY_FISH) {
    if (foodName.includes(fish)) {
      return {
        level: 'not-appropriate',
        ageGuidance: ageStage,
        reason: 'High mercury content can affect neurological development.',
        recommendation: 'Choose low-mercury fish alternatives like salmon, cod, or tilapia.',
      }
    }
  }

  // ── Check choking hazards (requires texture modification) ──────────────────
  for (const hazard of CHOKING_HAZARDS) {
    if (foodName.includes(hazard)) {
      return {
        level: 'caution',
        ageGuidance: ageStage,
        reason: 'Potential choking hazard in current form.',
        recommendation: 'This food must be modified to an age-appropriate texture before serving.',
        preparationNotes: getPreparationNote(hazard, ageMonths),
      }
    }
  }

  // ── Age-specific texture and food introduction guidance ────────────────────
  
  // 6-9 months: Purées and mashed foods
  if (ageMonths >= 6 && ageMonths < 9) {
    // Check for common allergens (introduce carefully, one at a time)
    for (const allergen of ALLERGENIC_FOODS) {
      if (foodName.includes(allergen)) {
        return {
          level: 'caution',
          ageGuidance: '6-9 months',
          reason: 'Common allergen - introduce with care.',
          recommendation: 'Introduce allergens one at a time, in small amounts, and watch for reactions. Consult your paediatrician about allergy introduction.',
          preparationNotes: 'Serve as smooth purée or well-mashed. Introduce on a day when you can monitor for 2-3 hours.',
        }
      }
    }

    return {
      level: 'appropriate',
      ageGuidance: '6-9 months',
      reason: 'Suitable for introduction at this stage.',
      recommendation: 'Generally age-appropriate when properly prepared.',
      preparationNotes: 'Serve as smooth purée or well-mashed consistency. No lumps. Start with 1-2 teaspoons and gradually increase.',
    }
  }

  // 9-12 months: Soft finger foods, mashed foods with soft lumps
  if (ageMonths >= 9 && ageMonths < 12) {
    for (const allergen of ALLERGENIC_FOODS) {
      if (foodName.includes(allergen)) {
        return {
          level: 'caution',
          ageGuidance: '9-12 months',
          reason: 'Common allergen - monitor for reactions.',
          recommendation: 'If already introduced successfully, continue offering. If first introduction, serve in small amounts and monitor.',
          preparationNotes: 'Serve mashed or as soft finger food pieces (pea-sized). Ensure food is soft enough to squash between fingers.',
        }
      }
    }

    return {
      level: 'appropriate',
      ageGuidance: '9-12 months',
      reason: 'Suitable for this age stage.',
      recommendation: 'Age-appropriate when properly prepared.',
      preparationNotes: 'Serve mashed with soft lumps or as soft finger foods (pea-sized pieces). Food should be soft enough to squash between your fingers.',
    }
  }

  // 12-24 months: Family foods with modifications
  if (ageMonths >= 12 && ageMonths < 24) {
    // Honey is now OK after 12 months
    if (foodName.includes('honey')) {
      return {
        level: 'appropriate',
        ageGuidance: '12-24 months',
        reason: 'Safe to introduce after 12 months.',
        recommendation: 'Honey can now be safely included in your toddler\'s diet.',
        preparationNotes: 'Use in small amounts. Still avoid added sugars where possible.',
      }
    }

    // Whole cow's milk is now OK
    if (foodName.includes('cow milk') || foodName.includes('whole milk')) {
      return {
        level: 'appropriate',
        ageGuidance: '12-24 months',
        reason: 'Appropriate as primary milk after 12 months.',
        recommendation: 'Whole cow\'s milk can replace formula or breast milk as the main milk drink.',
        preparationNotes: 'Offer 2-3 cups per day. Continue breast milk if desired.',
      }
    }

    return {
      level: 'appropriate',
      ageGuidance: '12-24 months',
      reason: 'Suitable for toddlers.',
      recommendation: 'Generally appropriate when prepared for toddler consumption.',
      preparationNotes: 'Serve in small, manageable pieces. Cut round foods into quarters. Still avoid added salt and sugar where possible.',
    }
  }

  // 24+ months: Most family foods appropriate
  return {
    level: 'appropriate',
    ageGuidance: '24+ months',
    reason: 'Suitable for this age.',
    recommendation: 'Age-appropriate as part of a balanced diet.',
    preparationNotes: 'Continue to supervise eating and cut foods to prevent choking. Maintain healthy eating habits.',
  }
}

// ── Preparation guidance by age ───────────────────────────────────────────────
function getPreparationNote(hazard: string, ageMonths: number): string {
  if (hazard.includes('grape') || hazard.includes('cherry') || hazard.includes('tomato')) {
    if (ageMonths < 12) return 'Cut into quarters lengthwise, then mash or purée.'
    if (ageMonths < 24) return 'Cut into quarters lengthwise to reduce choking risk.'
    return 'Cut in half or quarters lengthwise. Always supervise eating.'
  }

  if (hazard.includes('nut') || hazard.includes('peanut') || hazard.includes('almond')) {
    if (ageMonths < 12) return 'Serve only as smooth nut butter (thinned) or ground into powder.'
    if (ageMonths < 36) return 'Serve as nut butter or finely ground. No whole or chopped nuts.'
    return 'Finely chop or serve as nut butter. Whole nuts not recommended until age 4-5.'
  }

  if (hazard.includes('raw carrot') || hazard.includes('raw apple')) {
    if (ageMonths < 12) return 'Cook until very soft, then mash or purée.'
    if (ageMonths < 24) return 'Cook until soft or grate finely. No raw hard pieces.'
    return 'Grate or cut into thin matchsticks. Always supervise.'
  }

  if (hazard.includes('popcorn')) {
    return 'Not recommended for children under 4 years old due to high choking risk.'
  }

  if (hazard.includes('hot dog')) {
    if (ageMonths < 24) return 'Cut lengthwise into strips, then into small pieces.'
    return 'Cut lengthwise into quarters, then into small pieces. Remove casing if present.'
  }

  return 'Modify texture to be age-appropriate: purée, mash, or cut into safe sizes.'
}

// ── Helper: Format safety result for UI ──────────────────────────────────────
export function formatBabySafetyForUI(result: BabySafetyResult): {
  icon: string
  color: string
  bgColor: string
  borderColor: string
} {
  switch (result.level) {
    case 'appropriate':
      return {
        icon: '✓',
        color: 'rgb(110 231 183)',
        bgColor: 'rgb(16 185 129 / 0.12)',
        borderColor: 'rgb(16 185 129 / 0.28)',
      }
    case 'not-appropriate':
      return {
        icon: '✗',
        color: 'rgb(252 165 165)',
        bgColor: 'rgb(239 68 68 / 0.12)',
        borderColor: 'rgb(239 68 68 / 0.28)',
      }
    case 'caution':
      return {
        icon: '⚠',
        color: 'rgb(253 224 71)',
        bgColor: 'rgb(234 179 8 / 0.12)',
        borderColor: 'rgb(234 179 8 / 0.28)',
      }
    case 'info':
    default:
      return {
        icon: 'ℹ',
        color: 'rgb(125 211 252)',
        bgColor: 'rgb(56 189 248 / 0.10)',
        borderColor: 'rgb(56 189 248 / 0.25)',
      }
  }
}
