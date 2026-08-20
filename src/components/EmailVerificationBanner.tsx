import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { resendVerificationEmail } from '../firebase/auth'

export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Don't show if: no user, already verified, Google sign-in (no email to verify), or dismissed
  if (!user || user.emailVerified || !user.email || dismissed) return null

  async function handleResend() {
    try {
      await resendVerificationEmail()
      setSent(true)
    } catch {
      // Silently ignore — Firebase rate-limits resend requests
    }
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Please verify your email address.
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-normal">
              Check your inbox at <strong>{user.email}</strong>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!sent ? (
            <button
              onClick={handleResend}
              className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 border border-yellow-400 dark:border-yellow-600 rounded-lg px-3 py-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors"
            >
              Resend email
            </button>
          ) : (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              ✓ Sent! Check your inbox
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss verification banner"
            className="text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
