import type {
  PregnancyProfile, PregnancyStage, MealPlan, DayPlan, DietType,
} from '../types/pregnancy'
import { db } from '../firebase/config'
import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore'

// ── Week / month / trimester calculation ──────────────────────────────────────

export function calculateStage(startDate: string): PregnancyStage {
  const start = new Date(startDate)
  const today = new Date()
  const msPerDay  = 1000 * 60 * 60 * 24

  const daysPregnant  = Math.floor((today.getTime() - start.getTime()) / msPerDay)
  const week          = Math.max(1, Math.min(42, Math.floor(daysPregnant / 7) + 1))
  const month         = Math.max(1, Math.min(10, Math.ceil(week / 4)))
  const trimester     = week <= 12 ? 1 : week <= 28 ? 2 : 3
  const dueDate       = new Date(start.getTime() + 280 * msPerDay)
  const daysUntilDue  = Math.floor((dueDate.getTime() - today.getTime()) / msPerDay)
  const weeksRemaining = Math.max(0, Math.floor(daysUntilDue / 7))

  return {
    week,
    month,
    trimester: trimester as 1 | 2 | 3,
    weeksRemaining,
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
  }
}

export function weekToMonth(week: number): number {
  return Math.max(1, Math.min(10, Math.ceil(week / 4)))
}

export function trimesterLabel(trimester: 1 | 2 | 3): string {
  return ['First Trimester', 'Second Trimester', 'Third Trimester'][trimester - 1]
}

export function calculateDueDate(startDate: string): string {
  const start = new Date(startDate)
  const due   = new Date(start.getTime() + 280 * 24 * 60 * 60 * 1000)
  return due.toISOString().split('T')[0]
}

// ── Firestore CRUD ────────────────────────────────────────────────────────────

export async function savePregnancyProfile(
  uid: string,
  profile: Omit<PregnancyProfile, 'updatedAt'>,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'pregnancy', 'profile'),
    { ...profile, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function loadPregnancyProfile(uid: string): Promise<PregnancyProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'pregnancy', 'profile'))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    startDate:             data.startDate ?? '',
    dueDate:               data.dueDate ?? '',
    dietType:              data.dietType ?? 'non_vegetarian',
    restrictions:          data.restrictions ?? [],
    allergies:             data.allergies ?? [],
    tamilFoodPreference:   data.tamilFoodPreference ?? true,
    updatedAt:             data.updatedAt?.toDate?.()?.toISOString(),
  }
}

// ── Meal plan generator (rule-based, no LLM needed) ───────────────────────────

const MEAL_TEMPLATES = {
  vegetarian: {
    tamil: {
      breakfast: [
        { name: 'Ragi Dosa + Coconut Chutney', emoji: '🥞', nutrients: ['Calcium', 'Iron'] },
        { name: 'Kambu Idli + Sambar', emoji: '🫓', nutrients: ['Iron', 'Fibre', 'Folate'] },
        { name: 'Ragi Porridge with Banana', emoji: '🥣', nutrients: ['Calcium', 'Potassium', 'B6'] },
      ],
      lunch: [
        { name: 'Red Rice + Drumstick Sambar + Keerai Kootu', emoji: '🍚', nutrients: ['Iron', 'Calcium', 'Folate'] },
        { name: 'Samai Pongal + Rasam + Papad', emoji: '🍚', nutrients: ['Iron', 'Protein', 'Fibre'] },
        { name: 'Rice + Dal + Beetroot Poriyal + Curd', emoji: '🍚', nutrients: ['Protein', 'Iron', 'Probiotics'] },
      ],
      snack: [
        { name: 'Sundal (Chickpeas) + Banana', emoji: '🫘', nutrients: ['Protein', 'Fibre', 'Potassium'] },
        { name: 'Soaked Almonds + Orange', emoji: '🌰', nutrients: ['Vitamin E', 'Vitamin C'] },
        { name: 'Ragi Ladoo + Coconut Water', emoji: '🧆', nutrients: ['Calcium', 'Electrolytes'] },
      ],
      dinner: [
        { name: 'Kambu Roti + Dal + Vegetable Curry', emoji: '🫓', nutrients: ['Iron', 'Protein', 'Fibre'] },
        { name: 'Thinai Pongal + Rasam', emoji: '🍲', nutrients: ['Iron', 'Protein'] },
        { name: 'Idli + Drumstick Sambar', emoji: '🫓', nutrients: ['Folate', 'Calcium', 'Iron'] },
      ],
    },
    global: {
      breakfast: [
        { name: 'Oatmeal with Pomegranate & Almonds', emoji: '🥣', nutrients: ['Iron', 'Folate', 'Calcium'] },
        { name: 'Greek Yogurt Parfait with Guava', emoji: '🥗', nutrients: ['Calcium', 'Protein', 'Vitamin C'] },
        { name: 'Whole Grain Toast + Avocado + Egg', emoji: '🍳', nutrients: ['Healthy fats', 'Folate', 'Protein'] },
      ],
      lunch: [
        { name: 'Lentil Soup + Whole Grain Bread', emoji: '🥣', nutrients: ['Protein', 'Iron', 'Fibre'] },
        { name: 'Quinoa Salad with Roasted Vegetables', emoji: '🥗', nutrients: ['Complete protein', 'Iron', 'Vitamin A'] },
        { name: 'Chickpea & Spinach Stew', emoji: '🍲', nutrients: ['Iron', 'Folate', 'Protein'] },
      ],
      snack: [
        { name: 'Chia Pudding with Mango', emoji: '🍮', nutrients: ['Omega-3', 'Fibre', 'Vitamin A'] },
        { name: 'Walnut & Date Mix', emoji: '🌰', nutrients: ['Omega-3', 'Iron', 'Energy'] },
        { name: 'Hummus & Carrot Sticks', emoji: '🥕', nutrients: ['Protein', 'Vitamin A', 'Fibre'] },
      ],
      dinner: [
        { name: 'Vegetable Quinoa Bowl', emoji: '🥗', nutrients: ['Complete protein', 'Iron', 'Fibre'] },
        { name: 'Pasta with Spinach & Ricotta', emoji: '🍝', nutrients: ['Calcium', 'Iron', 'Protein'] },
        { name: 'Sweet Potato & Lentil Curry', emoji: '🍛', nutrients: ['Vitamin A', 'Protein', 'Iron'] },
      ],
    },
  },
  non_vegetarian: {
    tamil: {
      breakfast: [
        { name: 'Egg Dosa + Sambar', emoji: '🥚', nutrients: ['Protein', 'Choline', 'Iron'] },
        { name: 'Ragi Porridge + Boiled Egg', emoji: '🥣', nutrients: ['Calcium', 'Protein', 'Choline'] },
        { name: 'Chicken Idiyappam + Coconut Milk', emoji: '🫘', nutrients: ['Protein', 'Healthy fats'] },
      ],
      lunch: [
        { name: 'Red Rice + Fish Curry + Drumstick Sambar', emoji: '🍚', nutrients: ['Omega-3', 'Iron', 'Calcium'] },
        { name: 'Chicken Biryani (mild) + Raita', emoji: '🍚', nutrients: ['Protein', 'Calcium', 'B vitamins'] },
        { name: 'Rice + Mutton Kulambu + Keerai', emoji: '🍚', nutrients: ['Iron', 'Protein', 'Folate'] },
      ],
      snack: [
        { name: 'Egg Sundal + Coconut Water', emoji: '🥚', nutrients: ['Protein', 'Choline', 'Electrolytes'] },
        { name: 'Chicken Soup', emoji: '🥣', nutrients: ['Protein', 'Collagen', 'Minerals'] },
        { name: 'Boiled Egg + Guava', emoji: '🥚', nutrients: ['Protein', 'Vitamin C'] },
      ],
      dinner: [
        { name: 'Kambu Roti + Chicken Curry', emoji: '🍗', nutrients: ['Iron', 'Protein', 'B12'] },
        { name: 'Rice + Fish Fry + Dal', emoji: '🐟', nutrients: ['Omega-3', 'Protein', 'Iron'] },
        { name: 'Egg Curry + Ragi Dosa', emoji: '🥚', nutrients: ['Protein', 'Calcium', 'Choline'] },
      ],
    },
    global: {
      breakfast: [
        { name: 'Scrambled Eggs + Whole Grain Toast', emoji: '🍳', nutrients: ['Protein', 'Choline', 'Fibre'] },
        { name: 'Greek Yogurt + Berries + Granola', emoji: '🥣', nutrients: ['Calcium', 'Protein', 'Antioxidants'] },
        { name: 'Omelette with Spinach & Cheese', emoji: '🍳', nutrients: ['Protein', 'Iron', 'Calcium'] },
      ],
      lunch: [
        { name: 'Baked Salmon + Quinoa + Vegetables', emoji: '🐟', nutrients: ['Omega-3', 'Complete protein', 'Iron'] },
        { name: 'Grilled Chicken Salad', emoji: '🥗', nutrients: ['Protein', 'Iron', 'Vitamins'] },
        { name: 'Chicken & Lentil Soup', emoji: '🥣', nutrients: ['Protein', 'Iron', 'Fibre'] },
      ],
      snack: [
        { name: 'Boiled Eggs + Apple', emoji: '🥚', nutrients: ['Protein', 'Choline', 'Fibre'] },
        { name: 'Tuna Crackers (low-mercury)', emoji: '🐟', nutrients: ['Omega-3', 'Protein'] },
        { name: 'Greek Yogurt + Pomegranate', emoji: '🥛', nutrients: ['Calcium', 'Protein', 'Iron'] },
      ],
      dinner: [
        { name: 'Baked Chicken + Sweet Potato + Greens', emoji: '🍗', nutrients: ['Protein', 'Vitamin A', 'Iron'] },
        { name: 'Fish Tacos with Avocado', emoji: '🐟', nutrients: ['Omega-3', 'Healthy fats', 'Protein'] },
        { name: 'Chicken Stir Fry with Brown Rice', emoji: '🍚', nutrients: ['Protein', 'Iron', 'Fibre'] },
      ],
    },
  },
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateMealPlan(
  week: number,
  dietType: DietType,
  preference: 'tamil' | 'global' | 'mixed',
  days = 7,
): MealPlan {
  const diet = dietType === 'vegan' || dietType === 'vegetarian' || dietType === 'eggetarian'
    ? 'vegetarian'
    : 'non_vegetarian'

  const templates = MEAL_TEMPLATES[diet]

  const dayPlans: DayPlan[] = Array.from({ length: days }, (_, i) => {
    const pref = preference === 'mixed'
      ? (i % 2 === 0 ? 'tamil' : 'global')
      : preference

    const t = templates[pref]
    const bfRaw = pickRandom(t.breakfast)
    const lnRaw = pickRandom(t.lunch)
    const snRaw = pickRandom(t.snack)
    const dnRaw = pickRandom(t.dinner)

    return {
      dayLabel:  DAYS[i % 7],
      breakfast: { ...bfRaw, description: `Nutritious start — ${bfRaw.nutrients.slice(0, 2).join(', ')}` },
      lunch:     { ...lnRaw, description: `Balanced midday — ${lnRaw.nutrients.slice(0, 2).join(', ')}` },
      snack:     { ...snRaw, description: `Healthy snack — ${snRaw.nutrients.slice(0, 2).join(', ')}` },
      dinner:    { ...dnRaw, description: `Light evening — ${dnRaw.nutrients.slice(0, 2).join(', ')}` },
      waterLiters: week >= 29 ? 2.5 : 2.0,
    }
  })

  return {
    days: dayPlans,
    generatedAt: new Date().toISOString(),
    week,
    dietType,
    preference,
  }
}
