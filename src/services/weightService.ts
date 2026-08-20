import {
  addWeightEntry,
  getWeightEntries,
  updateWeightEntry,
  deleteWeightEntry,
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
