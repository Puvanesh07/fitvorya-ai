/**
 * AI Health Coach Service
 *
 * Architecture:
 *   Firestore user data
 *     → collectUserData()   — parallel reads, only fields needed
 *     → buildContext()      — compact text block sent to Groq
 *     → streamChat()        — SSE-style token-by-token via fetch + ReadableStream
 *     → getDailyRec()       — cached once/day in Firestore
 *
 * Groq is called directly from the client using VITE_GROQ_API_KEY
 * (same pattern as the pregnancy / baby / family coaches in geminiService.ts).
 */

import {
  doc, getDoc, setDoc, collection,
  getDocs, query, orderBy, limit, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { localTodayISO, dateToISO } from '../utils/format'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoachMessage {
  role:      'user' | 'assistant'
  content:   string
  timestamp: string
}

export interface DailyRecommendation {
  summary:    string
  workout:    string
  nutrition:  string
  hydration:  string
  generatedAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'qwen/qwen3.6-27b'

function getKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set.')
  return key
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Data collection — parallel Firestore reads
// ─────────────────────────────────────────────────────────────────────────────

interface RawUserData {
  profile:   Record<string, unknown> | null
  weights:   { weight: number; date: string }[]
  workouts:  { date: string; name: string; durationSecs?: number }[]
  meals:     { date: string; calories: number; protein: number; carbs: number; fat: number }[]
  water:     { date: string; amount: number }[]
}

export async function collectUserData(uid: string): Promise<RawUserData> {
  const cutoff14 = new Date(); cutoff14.setDate(cutoff14.getDate() - 14)
  const cutoff7  = new Date(); cutoff7.setDate(cutoff7.getDate() - 7)
  const cut7     = dateToISO(cutoff7)
  const today    = localTodayISO()

  const [profileSnap, weightSnap, workoutSnap, mealSnap, waterSnap] = await Promise.all([
    // Profile doc
    getDoc(doc(db, 'users', uid)),

    // Last 14 weight entries — ordered desc
    getDocs(query(
      collection(db, 'users', uid, 'weights'),
      orderBy('date', 'desc'),
      limit(14),
    )),

    // Workouts in last 7 days
    getDocs(query(
      collection(db, 'users', uid, 'workouts'),
      where('date', '>=', cut7),
      orderBy('date', 'desc'),
      limit(20),
    )),

    // Meals in last 7 days
    getDocs(query(
      collection(db, 'users', uid, 'meals'),
      where('date', '>=', cut7),
      where('date', '<=', today),
      orderBy('date', 'asc'),
      limit(200),
    )),

    // Water in last 7 days
    getDocs(query(
      collection(db, 'users', uid, 'water'),
      where('date', '>=', cut7),
      where('date', '<=', today),
      orderBy('date', 'asc'),
      limit(100),
    )),
  ])

  const profile = profileSnap.exists() ? (profileSnap.data() as Record<string, unknown>) : null

  const weights = weightSnap.docs.map(d => ({
    weight: d.data().weight as number,
    date:   d.data().date   as string,
  }))

  const workouts = workoutSnap.docs.map(d => ({
    date:         d.data().date as string,
    name:         (d.data().name ?? d.data().templateName ?? 'Workout') as string,
    durationSecs: d.data().durationSecs as number | undefined,
  }))

  // Aggregate meals by date → daily totals
  const mealMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>()
  for (const d of mealSnap.docs) {
    const data    = d.data()
    const date    = data.date as string
    const grams   = (data.grams as number) / 100
    const food    = data.foodItem as Record<string, number>
    const cur     = mealMap.get(date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
    mealMap.set(date, {
      calories: cur.calories + (food.calories ?? 0) * grams,
      protein:  cur.protein  + (food.protein  ?? 0) * grams,
      carbs:    cur.carbs    + (food.carbs    ?? 0) * grams,
      fat:      cur.fat      + (food.fat      ?? 0) * grams,
    })
  }
  const meals = Array.from(mealMap.entries()).map(([date, v]) => ({
    date,
    calories: Math.round(v.calories),
    protein:  Math.round(v.protein),
    carbs:    Math.round(v.carbs),
    fat:      Math.round(v.fat),
  }))

  // Aggregate water by date
  const waterMap = new Map<string, number>()
  for (const d of waterSnap.docs) {
    const date = d.data().date as string
    waterMap.set(date, (waterMap.get(date) ?? 0) + (d.data().amount as number))
  }
  const water = Array.from(waterMap.entries()).map(([date, amount]) => ({ date, amount }))

  return { profile, weights, workouts, meals, water }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Context builder — compact structured text for the system prompt
// ─────────────────────────────────────────────────────────────────────────────

function avg(nums: number[]): string {
  if (!nums.length) return '—'
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
}

export function buildContext(data: RawUserData): string {
  const { profile, weights, workouts, meals, water } = data

  // Weight trend
  const currentWeight = weights[0]?.weight ?? null
  const oldestWeight  = weights[weights.length - 1]?.weight ?? null
  const weightTrend   = currentWeight && oldestWeight && weights.length > 1
    ? `${currentWeight} kg (${(currentWeight - oldestWeight) >= 0 ? '+' : ''}${(currentWeight - oldestWeight).toFixed(1)} kg over ${weights.length} days)`
    : currentWeight ? `${currentWeight} kg (single entry)` : 'Not recorded'

  // Nutrition averages
  const avgCals    = avg(meals.map(m => m.calories))
  const avgProtein = avg(meals.map(m => m.protein))
  const avgCarbs   = avg(meals.map(m => m.carbs))
  const avgFat     = avg(meals.map(m => m.fat))

  // Water average (ml → L)
  const avgWaterL = water.length
    ? (water.reduce((s, w) => s + w.amount, 0) / water.length / 1000).toFixed(2)
    : '—'

  // Workouts this week
  const workoutCount = workouts.length
  const workoutNames = workouts.slice(0, 5).map(w => w.name).join(', ') || 'None logged'

  // Profile fields
  const name         = (profile?.displayName as string | undefined) ?? 'User'
  const age          = profile?.age ?? '—'
  const gender       = profile?.gender ?? '—'
  const goal         = profile?.goal ?? '—'
  const targetWeight = profile?.targetWeight ?? '—'
  const activity     = profile?.activityLevel ?? '—'
  const height       = profile?.height ?? '—'

  return `
PROFILE
Name: ${name} | Age: ${age} | Gender: ${gender} | Height: ${height} cm
Activity level: ${activity}
Primary goal: ${goal}
Target weight: ${targetWeight} kg

WEIGHT (last ${weights.length} entries)
Current: ${weightTrend}

WORKOUTS (last 7 days)
Sessions: ${workoutCount}
Recent: ${workoutNames}

NUTRITION — avg/day (last 7 days, ${meals.length} logged days)
Calories: ${avgCals} kcal | Protein: ${avgProtein}g | Carbs: ${avgCarbs}g | Fat: ${avgFat}g

HYDRATION — avg/day (last 7 days)
Water: ${avgWaterL} L
`.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. System prompt
// ─────────────────────────────────────────────────────────────────────────────

function systemPrompt(context: string): string {
  return `You are FitTracker AI Coach — a personal, supportive health and fitness coach.
You have access to the user's real data below. Use it to give specific, personalised advice.

RULES:
- Always reference the user's actual numbers (weight, calories, workouts, water).
- Tone: warm, direct, practical. Never preachy.
- Never give medical diagnoses or prescribe medications.
- For serious medical symptoms → say "Please consult your doctor."
- Keep replies concise unless the user asks for a full plan/table.
- End with one actionable tip the user can do today.

USER DATA:
${context}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Streaming chat — token-by-token via ReadableStream
// ─────────────────────────────────────────────────────────────────────────────

export async function streamChat(params: {
  context:     string
  history:     CoachMessage[]
  userMessage: string
  onToken:     (partial: string) => void
  signal?:     AbortSignal
}): Promise<string> {
  const { context, history, userMessage, onToken, signal } = params

  const messages = [
    { role: 'system', content: systemPrompt(context) },
    // Keep last 8 turns to stay within token limits
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const res = await fetch(GROQ_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      max_tokens:  800,
      temperature: 0.7,
      stream:      true,
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq error ${res.status}: ${errText}`)
  }

  const reader  = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText  = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const payload = trimmed.slice(6)
      if (payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[]
        }
        const token = parsed.choices?.[0]?.delta?.content ?? ''
        if (token) {
          fullText += token
          // Strip <think>…</think> blocks that qwen emits before stripping
          const visible = fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trimStart()
          onToken(visible)
        }
      } catch {
        // Malformed SSE chunk — skip
      }
    }
  }

  return fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Non-streaming call (used for structured daily recommendation JSON)
// ─────────────────────────────────────────────────────────────────────────────

async function callGroqOnce(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      max_tokens:  400,
      temperature: 0.5,
      stream:      false,
    }),
  })
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`)
  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  return (data.choices?.[0]?.message?.content ?? '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Daily recommendation — generated once per day, cached in Firestore
// ─────────────────────────────────────────────────────────────────────────────

const REC_PLACEHOLDER: DailyRecommendation = {
  summary:     'Loading your personalised recommendation…',
  workout:     '—',
  nutrition:   '—',
  hydration:   '—',
  generatedAt: '',
}

export async function getDailyRecommendation(uid: string): Promise<DailyRecommendation> {
  const today  = localTodayISO()
  const ref    = doc(db, 'users', uid, 'aiRecommendations', today)
  const cached = await getDoc(ref)

  // Return cached if it exists for today
  if (cached.exists()) {
    return cached.data() as DailyRecommendation
  }

  // Generate fresh
  try {
    const data    = await collectUserData(uid)
    const context = buildContext(data)

    const name = (data.profile?.displayName as string | undefined)?.split(' ')[0] ?? 'there'

    const raw = await callGroqOnce([
      {
        role:    'system',
        content: `You are FitTracker AI Coach. Generate a personalised daily recommendation.
Return ONLY valid JSON — no markdown, no code fences, no extra text.
Use the user data below.

USER DATA:
${context}`,
      },
      {
        role:    'user',
        content: `Generate today's recommendation for ${name} as valid JSON:
{
  "summary": "One warm sentence greeting and overview of today (mention 1–2 specific numbers from their data)",
  "workout": "Specific workout suggestion for today based on their recent activity (e.g. rest day / push day / cardio)",
  "nutrition": "One specific nutrition tip using their actual avg calories/protein numbers",
  "hydration": "Hydration goal and tip based on their avg water intake"
}`,
      },
    ])

    // Strip any markdown fences Groq might add despite instructions
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed  = JSON.parse(cleaned) as DailyRecommendation
    const rec: DailyRecommendation = {
      summary:     parsed.summary    || 'Ready to crush today?',
      workout:     parsed.workout    || 'Check the Workout tab for a plan.',
      nutrition:   parsed.nutrition  || 'Log your meals to track progress.',
      hydration:   parsed.hydration  || 'Aim for 2.5L of water today.',
      generatedAt: today,
    }

    // Cache in Firestore — fire and forget
    setDoc(ref, { ...rec, createdAt: serverTimestamp() }).catch(() => {})

    return rec
  } catch {
    // If Groq fails, return a graceful placeholder
    return {
      summary:     'Your AI coach is ready. Ask me anything about your fitness journey!',
      workout:     'Head to the Workout tab to start a session.',
      nutrition:   'Log your meals in Nutrition to get personalised tips.',
      hydration:   'Aim to drink at least 2.5L of water today.',
      generatedAt: today,
    }
  }
}

export { REC_PLACEHOLDER }
