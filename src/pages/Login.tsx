import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginWithEmail, loginWithGoogle } from '../firebase/auth'
import ThemeToggle from '../components/ThemeToggle'
import LoadingSpinner from '../components/LoadingSpinner'

function getFirebaseError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code
    const map: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    }
    return map[code] ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(getFirebaseError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(getFirebaseError(err))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="mesh-bg" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="font-bold gradient-text">FitvoryaAI</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Form */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm animate-scale-in">
          {/* Card */}
          <div className="card p-8 glow-sm">
            <div className="text-center mb-8">
              <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl mx-auto mb-4 animate-float">
                👋
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
              <p className="text-sm text-text-secondary mt-1">Sign in to continue your journey</p>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="btn-ghost w-full mb-4"
            >
              {googleLoading ? <LoadingSpinner size="sm" /> : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-text-secondary">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmailLogin} noValidate className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 border border-danger/20 px-3 py-2.5 text-xs text-danger animate-fade-in">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full mt-1">
                {loading && <LoadingSpinner size="sm" />}
                Sign in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-brand hover:underline transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
