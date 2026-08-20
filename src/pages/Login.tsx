import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { loginWithEmail, loginWithGoogle } from '../firebase/auth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await loginWithEmail(email, password)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Incorrect email or password.')
      } else if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please wait a moment and try again.')
      } else {
        setError('Sign in failed. Please try again.')
      }
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(''); setLoading(true)
    try {
      await loginWithGoogle()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (!msg.includes('popup-closed') && !msg.includes('cancelled')) {
        setError(msg.includes('popup-blocked')
          ? 'Popup was blocked. Please allow popups for this site.'
          : 'Google sign-in failed. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed top-0 right-0 h-[400px] w-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,65,210,0.2) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
      <div className="fixed bottom-0 left-0 h-[350px] w-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(230,55,165,0.15) 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

      <div className="relative z-10 w-full max-w-md">

        {/* Card */}
        <div
          className="card card-shadow p-8 sm:p-10 rounded-2xl animate-scale-in"
          style={{ border: '1px solid rgba(108,65,210,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(108,65,210,0.08)' }}
        >
          {/* Brand */}
          <div className="text-center mb-8">
            <div
              className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-3xl font-black mx-auto mb-4"
              style={{ boxShadow: '0 8px 24px rgba(108,65,210,0.5)' }}
            >F</div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight mb-1.5">Welcome Back</h1>
            <p className="text-sm text-text-secondary">Sign in to continue your fitness journey</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••" required autoComplete="current-password" />
            </div>

            {error && (
              <div className="text-xs text-danger rounded-xl px-4 py-3 font-semibold"
                style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.25)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-purple w-full py-3.5 text-base mt-1">
              {loading ? <><LoadingSpinner size="sm" /> Signing in…</> : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-text-muted font-semibold" style={{ background: 'rgb(22,21,38)' }}>
                  Or continue with
                </span>
              </div>
            </div>

            <button type="button" onClick={handleGoogleSignIn} disabled={loading}
              className="btn-ghost w-full py-3 text-sm flex items-center justify-center gap-2.5">
              <GoogleIcon />
              Sign in with Google
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">Sign up</Link>
          </p>
        </div>

        <div className="text-center mt-5">
          <Link to="/" className="text-sm text-text-muted hover:text-text-secondary transition-colors">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
