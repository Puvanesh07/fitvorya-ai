import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: '🏋️', title: 'Smart Workouts',    desc: 'Built-in templates with real-time set tracking, rest timers, and PR detection.',           color: 'card-purple', accent: '#8b5cf6' },
  { icon: '🥗', title: 'Nutrition Tracking', desc: 'Log meals from a 50+ item food database plus USDA for accurate calorie & macro data.',      color: 'card-teal',   accent: '#2dc3be' },
  { icon: '📈', title: 'Progress Insights',  desc: 'Daily streaks, achievement badges, body measurements, and visual progress charts.',         color: 'card-yellow', accent: '#f59e0b' },
  { icon: '⚖️', title: 'Weight Tracker',     desc: 'Log weight daily, set a goal, and watch your trend line move toward your target.',          color: 'card-blue',   accent: '#60a5fa' },
  { icon: '🔥', title: 'Streak System',      desc: 'Stay motivated with daily activity streaks and 18 unlockable milestone badges.',             color: 'card-pink',   accent: '#ec4899' },
  { icon: '💧', title: 'Hydration Logging',  desc: 'Track daily water intake with quick-add presets and a visual goal progress bar.',           color: 'card-green',  accent: '#10b981' },
]

const STATS = [
  { value: '50+',  label: 'Indian Foods'       },
  { value: '8',    label: 'Workout Templates'  },
  { value: '18',   label: 'Achievement Badges' },
  { value: '100%', label: 'Free to Use'        },
]

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">

      {/* Background ambient blobs */}
      <div className="fixed top-0 left-0 h-[500px] w-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,65,210,0.18) 0%, transparent 70%)', transform: 'translate(-30%,-30%)' }} />
      <div className="fixed top-[20%] right-0 h-[400px] w-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(230,55,165,0.12) 0%, transparent 70%)', transform: 'translate(30%,0)' }} />
      <div className="fixed bottom-0 left-[40%] h-[350px] w-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,65,210,0.1) 0%, transparent 70%)', transform: 'translate(-50%,30%)' }} />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center"
            style={{ boxShadow: '0 4px 16px rgba(108,65,210,0.45)' }}>
            <span className="text-sm font-black text-white">F</span>
          </div>
          <span className="text-base font-black gradient-text">FitvoryaAI</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/login" className="btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn-purple btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center pt-16 pb-24 px-6 max-w-5xl mx-auto">

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 animate-fade-up opacity-0"
          style={{
            animationFillMode: 'forwards',
            background: 'rgba(108,65,210,0.15)',
            border: '1px solid rgba(108,65,210,0.35)',
          }}
        >
          <span>🚀</span>
          <span className="text-xs font-bold text-purple-300">Your complete fitness companion</span>
        </div>

        <h1
          className="text-4xl sm:text-6xl lg:text-7xl font-black text-text-primary leading-[1.05] mb-7 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '80ms' }}
        >
          Transform your{' '}
          <span className="gradient-text">fitness journey</span>
          <br className="hidden sm:block" /> with AI-powered tracking
        </h1>

        <p
          className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '160ms' }}
        >
          Track workouts, log nutrition, monitor weight, and celebrate milestones.
          Built for India — with 50+ Indian foods, smart calorie math, and real streak motivation.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '240ms' }}
        >
          <Link to="/register" className="btn-purple py-3.5 px-10 text-base pulse-ring">
            Start Free Today
          </Link>
          <Link to="/login" className="btn-ghost py-3.5 px-8 text-base">
            Sign In →
          </Link>
        </div>

        {/* Stats strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '320ms' }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="card card-hover p-5 rounded-2xl text-center"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-2xl font-black gradient-text">{s.value}</p>
              <p className="text-xs text-text-muted mt-1 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-text-primary mb-3 tracking-tight">
            Everything you need,{' '}
            <span className="gradient-text">nothing you don't</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm leading-relaxed">
            A focused, fast fitness tracker designed for real people with real goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`${f.color} p-7 rounded-2xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 animate-fade-up opacity-0`}
              style={{ animationFillMode: 'forwards', animationDelay: `${i * 70}ms` }}
            >
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl mb-5"
                style={{ background: `${f.accent}22`, border: `1px solid ${f.accent}44` }}
              >
                {f.icon}
              </div>
              <h3 className="text-base font-black text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 text-center pb-24 px-6">
        <div
          className="max-w-lg mx-auto card p-12 rounded-2xl text-center"
          style={{ border: '1px solid rgba(108,65,210,0.25)', boxShadow: '0 0 60px rgba(108,65,210,0.12)' }}
        >
          <div
            className="h-20 w-20 rounded-2xl gradient-brand flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 animate-float"
            style={{ boxShadow: '0 8px 32px rgba(108,65,210,0.45)' }}
          >
            F
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-3 tracking-tight">Ready to start?</h2>
          <p className="text-text-secondary mb-8 text-sm leading-relaxed">Create your free account in under a minute. No credit card needed.</p>
          <Link to="/register" className="btn-purple py-3.5 px-12 text-base">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-10 text-xs text-text-muted">
        © 2026 FitvoryaAI · Built with ❤️ for your fitness goals
      </footer>
    </div>
  )
}
