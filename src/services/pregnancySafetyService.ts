// ── Pregnancy Food Safety Service ────────────────────────────────────────────
// Week/trimester-aware food safety evaluation for pregnancy.
// Returns suitable/caution/avoid with medical guidance based on reliable sources.
// IMPORTANT: This is informational only. Always defer to healthcare providers.

import type { UnifiedFood } from '../types/food'

export interface PregnancySafetyResult {
  level: 'suitable' | 'caution' | 'avoid' | 'info'
  trimester: string
  reason: string
  recommendation: string
  preparationGuidance?: string
}

// ── Trimester helper ──────────────────────────────────────────────────────────
export function getTrimester(week: number): string {
  if (week <= 13) return 'First Trimester'
  if (week <= 27) return 'Second Trimester'
  return 'Third Trimester'
}

// ── Foods to AVOID during pregnancy ───────────────────────────────────────────
const AVOID_KEYWORDS = [
  { 
    keywords: ['raw fish', 'sushi', 'sashimi', 'ceviche', 'poke', 'raw salmon', 'raw tuna'],
    reason: 'Risk of harmful bacteria (Listeria, Salmonella) and parasites',
    advice: 'Avoid all raw fish during pregnancy. Choose fully cooked fish options.'
  },
  {
    keywords: ['raw egg', 'undercooked egg', 'runny egg', 'soft boiled egg'],
    reason: 'Risk of Salmonella infection',
    advice: 'Ensure eggs are fully cooked with firm yolk and white. Avoid raw cookie dough and homemade mayonnaise.'
  },
  {
    keywords: ['unpasteurized', 'raw milk', 'raw cheese'],
    reason: 'Risk of Listeria, which can cause miscarriage or stillbirth',
    advice: 'Choose only pasteurized dairy products. Check cheese labels carefully.'
  },
  {
    keywords: ['soft cheese', 'blue cheese', 'brie', 'camembert', 'feta', 'queso fresco', 'gorgonzola'],
    reason: 'May contain Listeria if made from unpasteurized milk',
    advice: 'Avoid unless label confirms pasteurized milk. Hard cheeses and processed cheese are safe.'
  },
  {
    keywords: ['liver', 'liver pate', 'liver sausage', 'foie gras'],
    reason: 'Very high in Vitamin A (retinol), which can harm fetal development',
    advice: 'Avoid all liver products during pregnancy, especially in first trimester.'
  },
  {
    keywords: ['raw sprouts', 'alfalfa sprout', 'bean sprout', 'mung bean sprout'],
    reason: 'High risk of bacterial contamination (E. coli, Salmonella)',
    advice: 'Avoid raw sprouts completely. Cooked sprouts are safe.'
  },
  {
    keywords: ['shark', 'swordfish', 'king mackerel', 'tilefish', 'marlin', 'bigeye tuna'],
    reason: 'Very high mercury levels can damage baby\'s developing brain and nervous system',
    advice: 'Avoid these high-mercury fish completely. Choose low-mercury fish like salmon, cod, or tilapia (2-3 servings/week).'
  },
  {
    keywords: ['alcohol', 'wine', 'beer', 'liquor', 'alcoholic'],
    reason: 'No safe amount of alcohol during pregnancy - risk of Fetal Alcohol Spectrum Disorders',
    advice: 'Completely avoid all alcoholic beverages during pregnancy and while breastfeeding.'
  },
  {
    keywords: ['raw meat', 'undercooked meat', 'rare steak', 'rare beef', 'tartare'],
    reason: 'Risk of Toxoplasmosis and bacterial infections',
    advice: 'Ensure all meat is cooked to safe internal temperatures. Use a food thermometer.'
  },
]

// ── Foods requiring CAUTION ───────────────────────────────────────────────────
const CAUTION_KEYWORDS = [
  {
    keywords: ['tuna', 'canned tuna', 'albacore tuna', 'yellowfin tuna'],
    reason: 'Moderate mercury content',
    advice: 'Limit to 2 servings (170g each) per week of light canned tuna, or 1 serving of albacore/white tuna.',
    trimesterSpecific: {
      1: 'First trimester: Be especially cautious as this is a critical development period.',
      2: 'Second trimester: Limit to 2 servings per week maximum.',
      3: 'Third trimester: Continue limiting to 2 servings per week.',
    }
  },
  {
    keywords: ['caffeine', 'coffee', 'espresso', 'caffeinated', 'energy drink'],
    reason: 'High caffeine intake linked to low birth weight and miscarriage risk',
    advice: 'Limit total caffeine to 200mg per day (about one 12oz cup of coffee). Consider decaf alternatives.',
    trimesterSpecific: {
      1: 'First trimester: Keep caffeine under 200mg/day - critical development period.',
      2: 'Second trimester: Continue limiting to 200mg/day maximum.',
      3: 'Third trimester: Maintain 200mg/day limit.',
    }
  },
  {
    keywords: ['deli meat', 'lunch meat', 'cold cuts', 'hot dog', 'cold sandwich meat'],
    reason: 'Risk of Listeria contamination',
    advice: 'Heat deli meats to steaming hot (165°F/74°C) before eating. Freshly cooked meats are safer.',
  },
  {
    keywords: ['smoked salmon', 'lox', 'smoked fish', 'smoked seafood'],
    reason: 'Risk of Listeria if refrigerated and not canned',
    advice: 'Avoid refrigerated smoked seafood. Canned or shelf-stable versions are safe. Cook thoroughly if unsure.',
  },
  {
    keywords: ['herbal tea', 'herbal infusion'],
    reason: 'Some herbs may affect pregnancy',
    advice: 'Consult your healthcare provider before consuming herbal teas. Stick to proven-safe options like ginger or peppermint.',
  },
  {
    keywords: ['saccharin', 'artificial sweetener'],
    reason: 'Some artificial sweeteners cross the placenta',
    advice: 'Aspartame, sucralose, and stevia are generally considered safe in moderation. Avoid saccharin.',
  },
]

// ── Beneficial foods with trimester-specific notes ────────────────────────────
const BENEFICIAL_FOODS = [
  {
    keywords: ['folate', 'folic acid', 'leafy green', 'spinach', 'kale', 'broccoli'],
    benefit: 'Rich in folate, essential for neural tube development',
    trimesterSpecific: {
      1: 'CRITICAL in first trimester: Folate prevents neural tube defects. Aim for 600mcg daily.',
      2: 'Continue folate-rich foods for ongoing development.',
      3: 'Maintain folate intake to support final growth phase.',
    }
  },
  {
    keywords: ['iron', 'red meat', 'lean beef', 'chicken', 'lentil', 'bean'],
    benefit: 'Important for red blood cell production and preventing anemia',
    trimesterSpecific: {
      1: 'Begin building iron stores early.',
      2: 'Increase iron intake as blood volume expands significantly.',
      3: 'Iron needs peak in third trimester. Consider iron-rich foods at every meal.',
    }
  },
  {
    keywords: ['calcium', 'dairy', 'milk', 'yogurt', 'cheese'],
    benefit: 'Essential for baby\'s bone development',
    trimesterSpecific: {
      1: 'Start establishing good calcium intake (1000mg/day).',
      2: 'Maintain calcium for skeletal development.',
      3: 'Peak calcium demand as baby\'s bones harden. Ensure 1000mg daily.',
    }
  },
  {
    keywords: ['omega-3', 'salmon', 'sardine', 'chia seed', 'walnut', 'dha'],
    benefit: 'Supports baby\'s brain and eye development',
    trimesterSpecific: {
      1: 'Begin omega-3 intake for early neural development.',
      2: 'Continue omega-3s for ongoing brain development.',
      3: 'Critical period for brain and eye development. Aim for 200-300mg DHA daily.',
    }
  },
]

// ── Main evaluation function ──────────────────────────────────────────────────
export function evaluatePregnancyFoodSafety(
  food: UnifiedFood,
  week: number
): PregnancySafetyResult {
  const foodName = food.name.toLowerCase()
  const brand = (food.brand ?? '').toLowerCase()
  const combined = `${foodName} ${brand}`
  const trimester = getTrimester(week)
  const trimesterNum = week <= 13 ? 1 : week <= 27 ? 2 : 3

  // ── Check AVOID list ─────────────────────────────────────────────────────
  for (const item of AVOID_KEYWORDS) {
    for (const keyword of item.keywords) {
      if (combined.includes(keyword)) {
        return {
          level: 'avoid',
          trimester,
          reason: item.reason,
          recommendation: item.advice,
        }
      }
    }
  }

  // ── Check CAUTION list ───────────────────────────────────────────────────
  for (const item of CAUTION_KEYWORDS) {
    for (const keyword of item.keywords) {
      if (combined.includes(keyword)) {
        const trimesterAdvice = item.trimesterSpecific?.[trimesterNum as 1 | 2 | 3]
        return {
          level: 'caution',
          trimester,
          reason: item.reason,
          recommendation: item.advice,
          preparationGuidance: trimesterAdvice,
        }
      }
    }
  }

  // ── Check BENEFICIAL foods ───────────────────────────────────────────────
  for (const item of BENEFICIAL_FOODS) {
    for (const keyword of item.keywords) {
      if (combined.includes(keyword)) {
        const trimesterNote = item.trimesterSpecific[trimesterNum as 1 | 2 | 3]
        return {
          level: 'suitable',
          trimester,
          reason: item.benefit,
          recommendation: 'Excellent choice for pregnancy nutrition.',
          preparationGuidance: trimesterNote,
        }
      }
    }
  }

  // ── Default: Generally suitable with standard precautions ─────────────────
  return {
    level: 'suitable',
    trimester,
    reason: 'Nutrition information available.',
    recommendation: 'Generally suitable when properly prepared and cooked. Always ensure food is fresh and thoroughly cooked.',
    preparationGuidance: 'Verify suitability for your specific pregnancy stage and any personal dietary restrictions with your healthcare provider.',
  }
}

// ── Helper: Format safety result for UI ──────────────────────────────────────
export function formatPregnancySafetyForUI(result: PregnancySafetyResult): {
  icon: string
  color: string
  bgColor: string
  borderColor: string
} {
  switch (result.level) {
    case 'suitable':
      return {
        icon: '✓',
        color: 'rgb(110 231 183)',
        bgColor: 'rgb(16 185 129 / 0.12)',
        borderColor: 'rgb(16 185 129 / 0.28)',
      }
    case 'avoid':
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
