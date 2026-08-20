import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { resendVerificationEmail } from '../firebase/auth'

export default function EmailVerificationBanner() {
  const { user }    = useAuth()
  const [sent, setSent]           = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!user || user.emailVerified || !user.email || dismissed) return null

  async function handleResend() {
    try { await resendVerificationEmail(); setSent(true) } catch { /* rate-limited */ }
  }

  return (
    <div className="px-4 py-3" style={{ background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-semibold text-amber-300">
            Please verify your email.{' '}
            <span className="font-normal text-amber-400/80">Check your inbox at <strong className="text-amber-300">{user.email}</strong></span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!sent ? (
            <button onClick={handleResend}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}>
              Resend email
            </button>
          ) : (
            <span className="text-xs font-bold text-green-400">✓ Sent! Check inbox</span>
          )}
          <button onClick={() => setDismissed(true)} aria-label="Dismiss"
            className="text-amber-500/70 hover:text-amber-400 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
