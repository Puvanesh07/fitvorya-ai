import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

// ─── Register ────────────────────────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  // Send verification email (non-blocking — don't fail registration if this errors)
  try {
    await sendEmailVerification(credential.user)
  } catch {
    // Best effort — user can request resend from profile
  }
  return credential.user
}

export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser)
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/** Sign in with Google. Uses redirect on mobile/in-app browsers where
 *  popups are blocked (Instagram, TikTok, iOS Safari), popup on desktop. */
export async function loginWithGoogle(): Promise<User> {
  const isMobileOrInApp = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    || /FBAN|FBAV|Instagram|Twitter|Line|wv/i.test(navigator.userAgent)

  if (isMobileOrInApp) {
    await signInWithRedirect(auth, googleProvider)
    // Result handled by getGoogleRedirectResult() called on app init
    // This line is never reached on redirect path
    throw new Error('Redirecting…')
  }
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

/** Call once on app startup inside AuthContext to capture the redirect result */
export async function getGoogleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth)
    return result?.user ?? null
  } catch {
    return null
  }
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
