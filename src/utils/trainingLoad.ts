// ─────────────────────────────────────────────────────────────────────────────
// Training Load Engine — sports-science load metrics computed from REAL
// logged sessions. Nothing here is simulated.
//
//  • Session load  = MET-minutes weighted non-linearly by intensity
//                    (Gaudino et al. sTRIMP-style: intensity² time product),
//                    scaled to body mass so kg-lifted and cardio sessions are
//                    comparable on one axis.
//  • Acute load    = sum of session load, last 7 days.
//  • Chronic load  = average weekly session load over the last 28 days.
//  • ACWR          = acute ÷ chronic. The sports-medicine consensus "sweet
//                    spot" is 0.8–1.3; <0.8 detraining, >1.5 elevated
//                    injury/illness risk (Gabbett 2016).
//  • Monotony      = daily-load mean ÷ SD (Foster); high monotony + high load
//                    = strain, a marker of overreaching weeks.
//  • Readiness     = heuristic 0–100 combining ACWR proximity to the optimal
//                    band, rest-day balance and recent session density.
// ─────────────────────────────────────────────────────────────────────────────

import type { WorkoutSession } from '../types/workout'
import { dateToISO } from './format'
import { sessionMinutes, sessionMet } from './insights'

export type LoadZone = 'detraining' | 'optimal' | 'caution' | 'danger' | 'unknown'

export interface TrainingLoadSummary {
  /** Per-day total load for the last 28 days (oldest → newest) */
  daily: { date: string; load: number }[]
  /** Load units accumulated in the last 7 days */
  acuteLoad: number
  /** Average weekly load over the last 28 days */
  chronicWeekly: number
  /** Acute:chronic workload ratio, or null with <2 weeks of data */
  acwr: number | null
  zone: LoadZone
  /** 0–100 readiness heuristic */
  readiness: number
  /** Days in the last 7 with no session */
  restDaysLast7: number
  sessionsLast7: number
  /** Foster's monotony (mean ÷ SD of daily load, 28d) — null if too sparse */
  monotony: number | null
  /** weekly load × monotony */
  strain: number | null
}

/** Non-linear intensity weighting: resting ≈ 1 MET, and the multiplier grows
 *  quadratically above it (matches the shape of published TRIMP curves). */
function intensityWeight(met: number): number {
  const aboveRest = Math.max(0, met - 1)
  return 0.5 * aboveRest * aboveRest / 10 + aboveRest * 0.4
}

/** Load units for one session (dimensionless, comparable across modalities). */
export function sessionLoad(session: WorkoutSession, weightKg: number, templateCategories: Record<string, string>): number {
  const minutes = sessionMinutes(session)
  if (minutes <= 0) return 0
  const met = sessionMet(session, templateCategories)
  const massFactor = weightKg > 0 ? weightKg / 70 : 1  // normalised to a 70 kg reference athlete
  return Math.round(minutes * intensityWeight(met) * massFactor * 10) / 10
}

function std(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function computeTrainingLoad(
  sessions: WorkoutSession[],
  weightKg: number,
  templateCategories: Record<string, string> = {},
): TrainingLoadSummary {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Buckets for 28 days, oldest → newest
  const dayLoad = new Map<string, number>()
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    dayLoad.set(dateToISO(d), 0)
  }

  const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 27)
  let acuteLoad = 0
  let sessionsLast7 = 0
  const now = today.getTime()

  for (const s of sessions) {
    const load = sessionLoad(s, weightKg, templateCategories)
    if (load <= 0) continue
    const sd = dayLoad.get(s.date)
    if (sd !== undefined) dayLoad.set(s.date, sd + load)
    const d = new Date(s.date + 'T00:00:00').getTime()
    if (d < cutoff.getTime()) continue // outside the 28-day window
    if (now - d < 7 * 86400000) {
      acuteLoad += load
      sessionsLast7 += 1
    }
  }

  const daily = [...dayLoad.entries()].map(([date, load]) => ({ date, load: Math.round(load * 10) / 10 }))
  const chronicTotal = daily.reduce((a, x) => a + x.load, 0)
  const chronicWeekly = Math.round(chronicTotal / 4)
  const acwr = chronicWeekly > 0 ? Math.round((acuteLoad / chronicWeekly) * 100) / 100 : null

  let zone: LoadZone = 'unknown'
  if (acwr != null) {
    if (acwr < 0.8) zone = 'detraining'
    else if (acwr <= 1.3) zone = 'optimal'
    else if (acwr <= 1.5) zone = 'caution'
    else zone = 'danger'
  }

  // Monotony uses only days with recorded activity inside the 28d window,
  // otherwise a 4-session month gives a misleadingly "monotonous" score.
  const activeDayLoads = daily.map(d => d.load).filter(l => l > 0)
  let monotony: number | null = null
  if (activeDayLoads.length >= 4) {
    const mean = activeDayLoads.reduce((a, b) => a + b, 0) / activeDayLoads.length
    const sd = std(activeDayLoads)
    monotony = sd > 0 ? Math.round((mean / sd) * 100) / 100 : null
  }
  const strain = monotony != null ? Math.round(chronicWeekly * monotony) : null

  // ── Readiness heuristic ────────────────────────────────────────────────────
  // Start at 100 and deduct for load-pattern red flags.
  let readiness = 100
  const restDaysLast7 = 7 - new Set(sessions
    .filter(s => now - new Date(s.date + 'T00:00:00').getTime() < 7 * 86400000)
    .map(s => s.date)).size

  if (acwr == null) {
    readiness = 60 // not enough data to judge — neutral-low
  } else if (acwr > 1.5) {
    readiness -= 35
  } else if (acwr > 1.3) {
    readiness -= 18
  } else if (acwr < 0.6) {
    readiness -= 10
  }
  if (sessionsLast7 >= 6 && restDaysLast7 === 0) readiness -= 15 // no recovery day
  if (restDaysLast7 === 0 && acuteLoad > 0) readiness -= 5
  if (monotony != null && monotony > 2) readiness -= 10          // same load every day
  readiness = Math.max(5, Math.min(100, readiness))

  return {
    daily,
    acuteLoad: Math.round(acuteLoad * 10) / 10,
    chronicWeekly,
    acwr,
    zone,
    readiness,
    restDaysLast7,
    sessionsLast7,
    monotony,
    strain,
  }
}

export const ZONE_META: Record<LoadZone, { label: string; color: string; advice: string }> = {
  detraining: { label: 'Detraining',   color: '#60a5fa', advice: 'Load is dropping below your baseline — add a session to maintain fitness.' },
  optimal:    { label: 'Optimal',      color: '#10b981', advice: 'You are in the sweet spot — progress without elevated injury risk.' },
  caution:    { label: 'Caution',      color: '#f59e0b', advice: 'Load is spiking slightly — keep the next session moderate.' },
  danger:     { label: 'High risk',    color: '#ef4444', advice: 'Sharp load spike — prioritise rest and light mobility today.' },
  unknown:    { label: 'Building data', color: '#a78bfa', advice: 'Log a couple more weeks of training for reliable load ratios.' },
}
