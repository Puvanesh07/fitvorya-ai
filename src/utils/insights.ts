// ─────────────────────────────────────────────────────────────────────────────
// Insights engine — pure functions that turn raw tracking data into personal
// targets, energy estimates, weight-pace projections and rule-based insights.
// Every value shown here is DERIVED from real user data — nothing is simulated.
// ─────────────────────────────────────────────────────────────────────────────

import type { ActivityLevel, FitnessGoal } from '../types/user'
import type { WorkoutSession } from '../types/workout'
import type { WeightEntry } from '../types/weight'
import { dateToISO } from './format'

// ─── Personalized hydration goal ──────────────────────────────────────────────
// Baseline 35 ml per kg body weight (EFSA/NAS guidance range), plus an
// activity bonus for extra fluid lost during training. Clamped to a sane
// 1.5 L – 5 L window.

const WATER_ACTIVITY_BONUS: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 250,
  moderate: 500,
  active: 750,
  very_active: 1000,
}

export function calculateWaterGoal(weightKg: number, activityLevel: ActivityLevel): number {
  const raw = weightKg * 35 + WATER_ACTIVITY_BONUS[activityLevel]
  // Round to the nearest 50 ml so the number reads cleanly in the UI
  return Math.min(5000, Math.max(1500, Math.round(raw / 50) * 50))
}

// ─── Workout energy expenditure (MET-based) ──────────────────────────────────
// kcal/min = MET × 3.5 × bodyWeightKg / 200   (ACSM / Compendium of Physical
// Activities formula). MET values follow the compendium for the training
// modality; unknown sessions fall back to a moderate 6.0.

export const CATEGORY_METS: Record<string, number> = {
  strength: 5.0,
  hypertrophy: 5.0,
  cardio: 8.5,
  hiit: 10.0,
  mobility: 3.5,
}

const DEFAULT_MET = 6.0

export function estimateSessionCalories(
  durationSeconds: number,
  weightKg: number,
  met: number = DEFAULT_MET,
): number {
  const minutes = durationSeconds / 60
  if (minutes <= 0 || weightKg <= 0) return 0
  return Math.round((met * 3.5 * weightKg / 200) * minutes)
}

/** Session duration in minutes, preferring the stored durationSeconds and
 *  falling back to the startedAt/finishedAt timestamps for older records. */
export function sessionMinutes(session: WorkoutSession): number {
  if (session.durationSeconds > 0) return Math.round(session.durationSeconds / 60)
  if (session.startedAt && session.finishedAt) {
    return Math.max(0, Math.round((session.finishedAt - session.startedAt) / 60000))
  }
  return 0
}

/** Resolve the MET value for a session. The session itself doesn't carry a
 *  category, so we look it up from the built-in template when available. */
export function sessionMet(
  session: WorkoutSession,
  templateCategories: Record<string, string>,
): number {
  const cat = session.templateId ? templateCategories[session.templateId] : undefined
  return cat && CATEGORY_METS[cat] != null ? CATEGORY_METS[cat] : DEFAULT_MET
}

export function estimateSessionCaloriesFor(
  session: WorkoutSession,
  weightKg: number,
  templateCategories: Record<string, string> = {},
): number {
  return estimateSessionCalories(
    sessionMinutes(session) * 60,
    weightKg,
    sessionMet(session, templateCategories),
  )
}

// ─── Weight pace & goal ETA ───────────────────────────────────────────────────

export interface WeightPace {
  /** Avg kg change per week over the lookback window (signed) */
  weeklyRateKg: number
  /** Days of data the rate was computed from */
  spanDays: number
  /** Projected date the target weight is reached (ISO), or null */
  etaDate: string | null
  /** Whether the current trend moves toward the goal */
  movingToGoal: boolean
  /** kg remaining from current → target */
  remainingKg: number
}

/**
 * Compute the recent weight pace via first-to-last average rate over the
 * last `lookbackDays` entries, then project an ETA for the goal weight.
 */
export function computeWeightPace(
  weightsDesc: WeightEntry[],
  targetWeightKg: number,
  lookbackDays = 30,
): WeightPace | null {
  if (weightsDesc.length < 2) return null
  const newest = weightsDesc[0]
  const cutoffMs = new Date(newest.date + 'T00:00:00').getTime() - lookbackDays * 86400000
  const window = weightsDesc.filter(w => new Date(w.date + 'T00:00:00').getTime() >= cutoffMs)
  if (window.length < 2) return null

  const oldest = window[window.length - 1]
  const spanDays = Math.max(1, Math.round(
    (new Date(newest.date + 'T00:00:00').getTime() - new Date(oldest.date + 'T00:00:00').getTime()) / 86400000,
  ))
  const weeklyRateKg = ((newest.weight - oldest.weight) / spanDays) * 7
  const remainingKg = targetWeightKg - newest.weight

  const losing = weeklyRateKg < -0.02
  const gaining = weeklyRateKg > 0.02
  const movingToGoal = remainingKg < 0 ? losing : remainingKg > 0 ? gaining : true

  let etaDate: string | null = null
  if (Math.abs(remainingKg) >= 0.1 && movingToGoal && Math.abs(weeklyRateKg) >= 0.05) {
    const weeksNeeded = Math.abs(remainingKg) / Math.abs(weeklyRateKg)
    const eta = new Date(newest.date + 'T00:00:00')
    eta.setDate(eta.getDate() + Math.ceil(weeksNeeded * 7))
    // Healthy-rate guard: cap the projection at 1.5 kg/week either direction
    if (Math.abs(weeklyRateKg) <= 1.5 && weeksNeeded < 104) etaDate = dateToISO(eta)
  }

  return { weeklyRateKg, spanDays, etaDate, movingToGoal, remainingKg }
}

/** 7-day rolling average of the (descending-sorted) weight history */
export function weeklyAverageWeight(weightsDesc: WeightEntry[]): number | null {
  if (weightsDesc.length === 0) return null
  const cutoffMs = Date.now() - 7 * 86400000
  const recent = weightsDesc.filter(w => new Date(w.date + 'T00:00:00').getTime() >= cutoffMs)
  const pool = recent.length > 0 ? recent : weightsDesc.slice(0, 1)
  return pool.reduce((s, w) => s + w.weight, 0) / pool.length
}

// ─── Rule-based daily insights ────────────────────────────────────────────────

export interface Insight {
  id: string
  icon: string
  tone: 'good' | 'warn' | 'info'
  title: string
  detail: string
}

export interface InsightInputs {
  goal: FitnessGoal
  targetCalories: number
  proteinTargetG: number
  caloriesLogged: number
  proteinLoggedG: number
  waterMl: number
  waterGoalMl: number
  workoutsThisWeek: number
  workoutsLastWeek: number
  activeDaysThisWeek: number
  streak: number
  pace: WeightPace | null
}

/**
 * Generates prioritized, human-meaningful insights from today's + this
 * week's real data. Pure rules — deterministic, offline, no API needed.
 */
export function generateInsights(i: InsightInputs): Insight[] {
  const out: Insight[] = []

  // Calorie pacing vs goal
  const remaining = i.targetCalories - i.caloriesLogged
  if (i.caloriesLogged === 0) {
    out.push({ id: 'no-food', icon: '🍽️', tone: 'info', title: 'Nothing logged yet', detail: 'Add your first meal to unlock live insight tracking.' })
  } else if (remaining < 0) {
    out.push({ id: 'over', icon: '🔥', tone: 'warn', title: `${Math.round(-remaining)} kcal over goal`, detail: `You're above your ${i.goal === 'lose_weight' ? 'deficit' : 'maintenance'} target. Next meal: keep it light — soup, salad or a protein shake.` })
  } else if (remaining < i.targetCalories * 0.15) {
    out.push({ id: 'close', icon: '🎯', tone: 'good', title: `${Math.round(remaining)} kcal left today`, detail: 'You’re right on plan. A small protein-rich dinner keeps you there.' })
  }

  // Protein sufficiency — the single most actionable macro target
  const proteinPct = i.proteinTargetG > 0 ? i.proteinLoggedG / i.proteinTargetG : 0
  if (i.caloriesLogged > 0 && proteinPct < 0.6) {
    out.push({ id: 'protein-low', icon: '🥩', tone: 'warn', title: 'Protein behind target', detail: `Only ${Math.round(i.proteinLoggedG)}g of ${Math.round(i.proteinTargetG)}g so far. Eggs, paneer, chicken or whey can close the gap tonight.` })
  } else if (proteinPct >= 1) {
    out.push({ id: 'protein-hit', icon: '💪', tone: 'good', title: 'Protein goal hit', detail: `${Math.round(i.proteinLoggedG)}g — your muscles got what they asked for today.` })
  }

  // Hydration
  if (i.waterMl === 0) {
    out.push({ id: 'no-water', icon: '💧', tone: 'info', title: 'Hydration not started', detail: `Goal today is ${(i.waterGoalMl / 1000).toFixed(1)} L. A glass now is the easiest win of the day.` })
  } else if (i.waterMl / i.waterGoalMl < 0.5) {
    out.push({ id: 'water-low', icon: '💧', tone: 'warn', title: 'Halfway to hydration goal', detail: `${(i.waterMl / 1000).toFixed(1)} L of ${(i.waterGoalMl / 1000).toFixed(1)} L. Drink a glass while you read this.` })
  }

  // Training frequency & progression
  if (i.workoutsThisWeek === 0 && i.workoutsLastWeek >= 2) {
    out.push({ id: 'freq-drop', icon: '📉', tone: 'warn', title: 'Quiet training week', detail: `Last week you trained ${i.workoutsLastWeek}×. Even a 20-minute bodyweight session keeps momentum alive.` })
  } else if (i.workoutsThisWeek >= 3 && i.workoutsThisWeek >= i.workoutsLastWeek) {
    out.push({ id: 'freq-good', icon: '⚡', tone: 'good', title: `${i.workoutsThisWeek} sessions this week`, detail: 'Consistency above target — recovery and sleep are now the lever that matters most.' })
  }

  // Streak celebration
  if (i.streak >= 7) {
    out.push({ id: 'streak', icon: '🔥', tone: 'good', title: `${i.streak}-day streak`, detail: 'You’ve logged something every day for over a week. This is how habits cement.' })
  }

  // Weight pace vs goal
  if (i.pace && i.pace.spanDays >= 7) {
    const rate = Math.abs(i.pace.weeklyRateKg)
    if (i.pace.movingToGoal && i.pace.etaDate) {
      out.push({
        id: 'pace', icon: '🧭', tone: 'good',
        title: `On pace for ${new Date(i.pace.etaDate + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
        detail: `Trending ${i.pace.weeklyRateKg > 0 ? 'up' : 'down'} ${rate.toFixed(2)} kg/week — a healthy, sustainable rate toward your goal.`,
      })
    } else if (!i.pace.movingToGoal && rate > 0.1) {
      out.push({
        id: 'wrong-dir', icon: '⚠️', tone: 'warn',
        title: 'Weight moving away from goal',
        detail: `Last ${i.pace.spanDays} days show ${i.pace.weeklyRateKg > 0 ? '+' : ''}${i.pace.weeklyRateKg.toFixed(2)} kg/week. Re-check portion sizes and training volume.`,
      })
    } else if (rate <= 0.05) {
      out.push({ id: 'plateau', icon: '🪨', tone: 'info', title: 'Weight holding steady', detail: 'If this lasts 2+ weeks, adjust calories by ~150 kcal or add one training session.' })
    }
  }

  return out.slice(0, 4)
}

// ─── Week helpers ─────────────────────────────────────────────────────────────

/** ISO dates (asc) for the last `n` days including today */
export function lastNDates(n: number): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(dateToISO(d))
  }
  return dates
}

/** Monday-based ISO date of the current week's start, relative to `ref` */
function mondayOf(ref: Date): Date {
  const m = new Date(ref)
  m.setHours(0, 0, 0, 0)
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}

/** Sessions falling in the current Monday-based week */
export function sessionsThisWeek(sessions: WorkoutSession[]): number {
  const thisMonday = dateToISO(mondayOf(new Date()))
  return sessions.filter(s => s.date >= thisMonday).length
}

/** Sessions falling in the previous Monday-based week */
export function sessionsLastWeek(sessions: WorkoutSession[]): number {
  const now = new Date()
  const thisMonday = dateToISO(mondayOf(now))
  const lastMonday = mondayOf(now)
  lastMonday.setDate(lastMonday.getDate() - 7)
  const startStr = dateToISO(lastMonday)
  return sessions.filter(s => s.date >= startStr && s.date < thisMonday).length
}

/** Recommended next template: prefer a muscle group untouched in the last 7 days */
export function pickRecommendedTemplates(
  templates: Array<{ id: string; name: string; category: string; estimatedMinutes: number; description?: string }>,
  recentSessions: WorkoutSession[],
  goal: FitnessGoal,
): Array<{ id: string; name: string; estimatedMinutes: number }> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = dateToISO(cutoff)
  const trainedRecently = new Set(
    recentSessions.filter(s => s.date >= cutoffStr).map(s => s.templateId ?? s.name),
  )

  const goalBoost: Record<string, string[]> = {
    lose_weight:   ['hiit', 'cardio', 'strength'],
    build_muscle:  ['strength', 'hypertrophy'],
    gain_weight:   ['strength', 'hypertrophy'],
    maintain_weight: ['strength', 'cardio', 'mobility'],
    general_fitness: ['strength', 'cardio', 'mobility'],
  }
  const preferred = goalBoost[goal] ?? ['strength', 'cardio']

  const scored = templates.map(t => {
    let score = 0
    if (preferred.indexOf(t.category) === 0) score += 3
    else if (preferred.includes(t.category)) score += 2
    if (!trainedRecently.has(t.id)) score += 2 // variety bonus
    return { t, score }
  })
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, 3).map(({ t }) => ({ id: t.id, name: t.name, estimatedMinutes: t.estimatedMinutes }))
}
