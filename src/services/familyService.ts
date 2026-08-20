import type { FamilyProfile, FamilyMember, ShoppingItem } from '../types/family'
import { db } from '../firebase/config'
import {
  doc, getDoc, setDoc, deleteDoc, collection,
  getDocs, serverTimestamp,
} from 'firebase/firestore'

// ── Firestore paths ───────────────────────────────────────────────────────────
// users/{uid}/familyProfile          — document: FamilyProfile (name, cuisine pref)
// users/{uid}/familyMembers/{id}     — document: FamilyMember   (5 segments ✓)
// users/{uid}/familyShopping/list    — document: ShoppingList   (5 segments ✓)
//
// NOTE: Firestore requires an ODD number of path segments for documents
// and EVEN for collections. Paths like 'users/{uid}/family/members' (4 segments)
// would be a collection, but it has an even number → invalid document reference.

const familyProfileRef = (uid: string) =>
  doc(db, 'users', uid, 'familyProfile', 'data')          // 5 segments ✓

const memberCol = (uid: string) =>
  collection(db, 'users', uid, 'familyMembers')            // 3 segments ✓ (collection)

const memberRef = (uid: string, id: string) =>
  doc(db, 'users', uid, 'familyMembers', id)               // 4 segments ✓ (document)

const shoppingRef = (uid: string) =>
  doc(db, 'users', uid, 'familyShopping', 'list')          // 4 segments ✓ (document)

// ── Family profile ─────────────────────────────────────────────────────────────

export async function loadFamilyProfile(uid: string): Promise<FamilyProfile | null> {
  const [profileSnap, membersSnap] = await Promise.all([
    getDoc(familyProfileRef(uid)),
    getDocs(memberCol(uid)),
  ])
  const members: FamilyMember[] = membersSnap.docs.map(d => d.data() as FamilyMember)
  if (!profileSnap.exists() && members.length === 0) return null
  const data = profileSnap.exists() ? profileSnap.data() : {}
  return {
    id:                uid,
    familyName:        data.familyName        ?? 'Our Family',
    cuisinePreference: data.cuisinePreference ?? 'mixed',
    members:           members.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')),
    updatedAt:         data.updatedAt?.toDate?.()?.toISOString(),
  }
}

export async function saveFamilyProfile(
  uid: string,
  update: Partial<Pick<FamilyProfile, 'familyName' | 'cuisinePreference'>>,
): Promise<void> {
  await setDoc(familyProfileRef(uid), { ...update, updatedAt: serverTimestamp() }, { merge: true })
}

// ── Members ────────────────────────────────────────────────────────────────────

export async function saveFamilyMember(uid: string, member: FamilyMember): Promise<void> {
  const now = new Date().toISOString()
  await setDoc(memberRef(uid, member.id), {
    ...member,
    updatedAt: now,
    createdAt: member.createdAt ?? now,
  })
}

export async function deleteFamilyMember(uid: string, memberId: string): Promise<void> {
  await deleteDoc(memberRef(uid, memberId))
}

// ── Shopping list ──────────────────────────────────────────────────────────────

export async function saveShoppingList(uid: string, list: ShoppingItem[]): Promise<void> {
  await setDoc(shoppingRef(uid), {
    items: list,
    generatedAt: new Date().toISOString(),
  })
}

export async function loadShoppingList(uid: string): Promise<ShoppingItem[]> {
  const snap = await getDoc(shoppingRef(uid))
  if (!snap.exists()) return []
  return (snap.data().items ?? []) as ShoppingItem[]
}

export async function updateShoppingItem(
  uid: string,
  allItems: ShoppingItem[],
  updatedItem: ShoppingItem,
): Promise<ShoppingItem[]> {
  const next = allItems.map(i => i.id === updatedItem.id ? updatedItem : i)
  await saveShoppingList(uid, next)
  return next
}

export async function removeShoppingItem(
  uid: string,
  allItems: ShoppingItem[],
  itemId: string,
): Promise<ShoppingItem[]> {
  const next = allItems.filter(i => i.id !== itemId)
  await saveShoppingList(uid, next)
  return next
}

// ── ID generator ───────────────────────────────────────────────────────────────
export function newMemberId(): string {
  return `member_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
