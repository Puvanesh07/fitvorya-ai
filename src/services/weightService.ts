import {
  addWeightEntry,
  getWeightEntries,
  updateWeightEntry,
  deleteWeightEntry,
  updateUserProfile,
} from '../firebase/firestore'
import type { WeightEntry } from '../types/weight'

export async function fetchWeightHistory(uid: string): Promise<WeightEntry[]> {
  return getWeightEntries(uid)
}

export async function addWeight(
  uid: string,
  weight: number,
  date: string,
  note?: string,
): Promise<string> {
  return addWeightEntry(uid, { weight, date, note: note ?? '' })
}

export async function editWeight(
  uid: string,
  entryId: string,
  weight: number,
  date: string,
  note?: string,
): Promise<void> {
  return updateWeightEntry(uid, entryId, { weight, date, note: note ?? '' })
}

export async function removeWeight(uid: string, entryId: string): Promise<void> {
  return deleteWeightEntry(uid, entryId)
}

/** Latest weight entry from a sorted list, or undefined */
export function getLatestWeight(entries: WeightEntry[]): WeightEntry | undefined {
  if (entries.length === 0) return undefined
  return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]
}

/**
 * Keep profile.weight in sync with the newest weight-history entry.
 * profile.weight drives BMI / BMR / TDEE / calorie & macro targets on every
 * page — without this call those values freeze at the onboarding snapshot
 * even after the user logs a newer weight.
 */
export async function syncProfileWeight(
  uid: string,
  entries: WeightEntry[],
): Promise<void> {
  const latest = getLatestWeight(entries)
  if (!latest) return
  try {
    await updateUserProfile(uid, { weight: latest.weight })
  } catch {
    // Non-fatal: history is already saved; targets resync on next logging
  }
}
