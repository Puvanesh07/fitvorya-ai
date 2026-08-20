import { useAuth } from '../context/AuthContext'

const KG_TO_LBS = 2.20462

/** Convert kg → display value based on user preference */
export function kgToDisplay(kg: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') return Math.round(kg * KG_TO_LBS * 10) / 10
  return kg
}

/** Convert display value → kg for storage */
export function displayToKg(value: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') return Math.round((value / KG_TO_LBS) * 100) / 100
  return value
}

/** Format with unit label */
export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  return `${kgToDisplay(kg, unit)} ${unit}`
}

/** Hook: returns helpers bound to the current user's unit preference */
export function useUnit() {
  const { profile } = useAuth()
  const unit = profile?.weightUnit ?? 'kg'

  return {
    unit,
    display: (kg: number) => kgToDisplay(kg, unit),
    toKg:    (val: number) => displayToKg(val, unit),
    format:  (kg: number) => formatWeight(kg, unit),
    label:   unit,
  }
}
