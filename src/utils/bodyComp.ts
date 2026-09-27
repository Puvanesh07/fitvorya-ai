// ─────────────────────────────────────────────────────────────────────────────
// Body Composition — U.S. Navy circumference method.
// The accepted field-gymnastic alternative to DEXA: estimates body density
// from tape measurements + height, converted to body-fat % via the Brozek
// equation (495 / density − 450).
//   Men:   needs waist (at navel) + neck + height
//   Women: needs waist + hips + neck + height
// All inputs in centimetres. Accuracy degrades outside ~10–40% body fat,
// which we surface honestly in the UI.
// ─────────────────────────────────────────────────────────────────────────────

import type { Measurement } from '../types/progress'
import type { Gender } from '../types/user'

export interface BodyComposition {
  /** Estimated body-fat percentage */
  bodyFatPct: number
  /** Lean mass in kg, using the entry's weight (or profile weight) */
  leanMassKg: number
  /** Fat mass in kg */
  fatMassKg: number
  /** Which measurement record produced this */
  basedOnDate: string
  /** True when the estimate is in the method's reliable range */
  confident: boolean
}

const log10 = Math.log10

export function estimateBodyComposition(
  measurement: Measurement,
  heightCm: number,
  gender: Gender,
  fallbackWeightKg?: number,
): BodyComposition | null {
  const waist = measurement.waist
  const neck  = measurement.neck
  const hips  = measurement.hips
  if (!waist || !neck || heightCm <= 0) return null

  let density: number | null = null
  if (gender === 'male') {
    const abdominal = waist - neck
    if (abdominal <= 0) return null
    density = 1.0324 - 0.19077 * log10(abdominal) + 0.15456 * log10(heightCm)
  } else if (gender === 'female') {
    if (!hips) return null
    const girth = waist + hips - neck
    if (girth <= 0) return null
    density = 1.29579 - 0.35004 * log10(girth) + 0.22100 * log10(heightCm)
  }
  // gender 'other' → no validated formula; return null rather than guess.
  if (density == null || density <= 0) return null

  const bodyFatPct = Math.round((495 / density - 450) * 10) / 10
  if (bodyFatPct < 2 || bodyFatPct > 70) return null // physiologically implausible → bad inputs

  const weight = measurement.weight ?? fallbackWeightKg
  const leanMassKg = weight ? Math.round(weight * (1 - bodyFatPct / 100) * 10) / 10 : 0
  const fatMassKg  = weight ? Math.round((weight - leanMassKg) * 10) / 10 : 0

  return {
    bodyFatPct,
    leanMassKg,
    fatMassKg,
    basedOnDate: measurement.date,
    confident: bodyFatPct >= 8 && bodyFatPct <= 35,
  }
}

/** What the user still needs to log for their gender, for empty-state hints. */
export function bodyCompMissingFields(measurement: Measurement | undefined, gender: Gender, heightCm: number): string[] {
  const missing: string[] = []
  if (heightCm <= 0) missing.push('height')
  if (!measurement?.waist) missing.push('waist')
  if (!measurement?.neck)  missing.push('neck')
  if (gender === 'female' && !measurement?.hips) missing.push('hips')
  return missing
}

/** Healthy reference bands (ACE guidelines) for the badge label. */
export function bodyFatCategory(pct: number, gender: Gender): { label: string; color: string } {
  if (gender === 'female') {
    if (pct < 14)  return { label: 'Essential fat', color: '#60a5fa' }
    if (pct < 21)  return { label: 'Athlete',       color: '#10b981' }
    if (pct < 32)  return { label: 'Fit',           color: '#10b981' }
    if (pct < 40)  return { label: 'Average',       color: '#f59e0b' }
    return { label: 'Above range', color: '#ef4444' }
  }
  if (pct < 6)  return { label: 'Essential fat', color: '#60a5fa' }
  if (pct < 14) return { label: 'Athlete',       color: '#10b981' }
  if (pct < 18) return { label: 'Fit',           color: '#10b981' }
  if (pct < 25) return { label: 'Average',       color: '#f59e0b' }
  return { label: 'Above range', color: '#ef4444' }
}

/** Find the newest measurement record usable for the Navy method. */
/** @param descSorted measurements newest-first (as returned by fetchMeasurements) */
export function latestNavyEligibleMeasurement(
  descSorted: Measurement[],
  gender: Gender,
): Measurement | undefined {
  return descSorted.find(m =>
    m.waist != null && m.neck != null && (gender !== 'female' || m.hips != null),
  )
}
