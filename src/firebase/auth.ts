import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  deleteUser,
  type User,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()
// Request email scope so we always get the email address
googleProvider.addScope('email')
googleProvider.addScope('profile')

// ─── Register ────────────────────────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  try {
    await sendEmailVerification(credential.user)
  } catch {
    // Non-blocking — user can resend from profile
  }
  return credential.user
}

export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser)
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function loginWithGoogle(): Promise<User> {
  // Always use popup — it works on all modern browsers including Firebase Hosting.
  // The COOP warnings in the console are informational only and don't break sign-in.
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

// ─── Account deletion ────────────────────────────────────────────────────────

export async function deleteCurrentUser(): Promise<void> {
  if (!auth.currentUser) throw new Error('No user signed in')
  await deleteUser(auth.currentUser)
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await signOut(auth)
}

// ─── Observer ────────────────────────────────────────────────────────────────

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
