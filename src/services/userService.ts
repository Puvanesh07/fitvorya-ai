import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
} from '../firebase/firestore'
import type { UserProfile } from '../types/user'
import type { User } from 'firebase/auth'

/**
 * Load profile from Firestore.
 * Returns null if the user hasn't completed onboarding yet.
 */
export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  return getUserProfile(uid)
}

/**
 * Create a brand-new profile after registration + onboarding.
 */
export async function saveNewProfile(
  firebaseUser: User,
  profileData: Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  await createUserProfile(firebaseUser.uid, {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    ...profileData,
    onboardingComplete: true,
  })
}

/**
 * Merge updates into an existing profile.
 */
export async function editProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  await updateUserProfile(uid, updates)
}
