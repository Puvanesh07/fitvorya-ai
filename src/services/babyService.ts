import type { BabyProfile, AgeStageId, FoodIntroRecord, IntroStatus } from '../types/baby'
import { getStageForAge } from '../data/babyData'
import { db } from '../firebase/config'
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'

// ── Age calculation ───────────────────────────────────────────────────────────

export function calculateAgeMonths(dateOfBirth: string): number {
  const dob   = new Date(dateOfBirth)
  const today = new Date()
  const years  = today.getFullYear() - dob.getFullYear()
  const months = today.getMonth()    - dob.getMonth()
  return Math.max(0, years * 12 + months)
}

export function calculateAgeLabel(ageMonths: number): string {
  if (ageMonths < 1)  return 'Newborn'
  if (ageMonths < 12) return `${ageMonths} month${ageMonths === 1 ? '' : 's'}`
  const years  = Math.floor(ageMonths / 12)
  const months = ageMonths % 12
  if (months === 0) return `${years} year${years === 1 ? '' : 's'}`
  return `${years}y ${months}m`
}

export function getStageIdForAge(ageMonths: number): AgeStageId {
  return getStageForAge(ageMonths).id
}

// ── Firestore — Baby profile ──────────────────────────────────────────────────

export async function saveBabyProfile(
  uid: string,
  profile: Omit<BabyProfile, 'updatedAt'>,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'baby', 'profile'),
    { ...profile, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function loadBabyProfile(uid: string): Promise<BabyProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'baby', 'profile'))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    name:                 d.name ?? '',
    dateOfBirth:          d.dateOfBirth ?? '',
    dietType:             d.dietType ?? 'non_vegetarian',
    allergiesReported:    d.allergiesReported ?? [],
    tamilFoodPreference:  d.tamilFoodPreference ?? true,
    updatedAt:            d.updatedAt?.toDate?.()?.toISOString(),
  }
}

// ── Firestore — Food introduction records ─────────────────────────────────────

export async function saveFoodIntroRecord(
  uid: string,
  record: FoodIntroRecord,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'baby', 'foodIntro', 'items', record.foodId),
    { ...record, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function loadFoodIntroRecords(uid: string): Promise<FoodIntroRecord[]> {
  const snap = await getDocs(
    collection(db, 'users', uid, 'baby', 'foodIntro', 'items'),
  )
  return snap.docs.map(d => {
    const data = d.data()
    return {
      foodId:         data.foodId ?? d.id,
      foodName:       data.foodName ?? '',
      emoji:          data.emoji ?? '🍽️',
      category:       data.category ?? 'general',
      status:         (data.status ?? 'not_introduced') as IntroStatus,
      dateIntroduced: data.dateIntroduced,
      notes:          data.notes,
      updatedAt:      data.updatedAt?.toDate?.()?.toISOString(),
    } satisfies FoodIntroRecord
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<IntroStatus, { label: string; emoji: string; color: string; bg: string }> = {
  not_introduced:   { label: 'Not introduced', emoji: '○', color: 'text-text-muted',  bg: 'bg-surface2 border-border' },
  introduced:       { label: 'Introduced',     emoji: '🟡', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  tolerated:        { label: 'Tolerated ✓',    emoji: '✅', color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' },
  reaction_reported:{ label: 'Reaction noted', emoji: '⚠️', color: 'text-red-600 dark:text-red-400',   bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' },
}
