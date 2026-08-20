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

/** Sign in with Google.
 *  Uses popup on desktop and direct-URL browsers.
 *  Falls back to redirect only for in-app browsers (Instagram, TikTok, etc.)
 *  where popups are genuinely blocked by the OS webview. */
export async function loginWithGoogle(): Promise<User> {
  const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line\/|wv\)/.test(navigator.userAgent)

  if (isInAppBrowser) {
    await signInWithRedirect(auth, googleProvider)
    throw new Error('Redirecting…')
  }

  try {
    const credential = await signInWithPopup(auth, googleProvider)
    return credential.user
  } catch (err: unknown) {
    // Popup blocked by browser settings — fall back to redirect
    if (err instanceof Error && err.message.includes('popup-blocked')) {
      await signInWithRedirect(auth, googleProvider)
      throw new Error('Redirecting…')
    }
    throw err
  }
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
