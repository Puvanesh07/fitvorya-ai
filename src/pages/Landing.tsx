import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🏋️',
    title: 'Smart Workouts',
    desc: 'Built-in workout templates with real-time set tracking, rest timers, and PR detection.',
    color: 'card-purple',
  },
  {
    icon: '🥗',
    title: 'Nutrition Tracking',
    desc: 'Log meals from a 50+ item Indian food database plus USDA for accurate calorie & macro data.',
    color: 'card-green',
  },
  {
    icon: '📈',
    title: 'Progress Insights',
    desc: 'Daily streaks, achievement badges, body measurements, and visual progress charts.',
    color: 'card-yellow',
  },
  {
    icon: '⚖️',
    title: 'Weight Tracker',
    desc: 'Log weight daily, set a goal, and watch your trend line move toward your target.',
    color: 'card-blue',
  },
  {
    icon: '🔥',
    title: 'Streak System',
    desc: 'Stay motivated with daily activity streaks and 18 unlockable milestone badges.',
    color: 'card-pink',
  },
  {
    icon: '💧',
    title: 'Hydration Logging',
    desc: 'Track daily water intake with quick-add presets and a visual goal progress bar.',
    color: 'card-lime',
  },
]

const STATS = [
  { value: '50+', label: 'Indian Foods' },
  { value: '8',   label: 'Workout Templates' },
  { value: '18',  label: 'Achievement Badges' },
  { value: '100%', label: 'Free to Use' },
]

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-0 orb orb-purple h-[500px] w-[500px] opacity-20 animate-orb-pulse blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-0 right-0 orb orb-pink h-[400px] w-[400px] opacity-15 animate-orb-pulse blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/2 orb orb-purple h-[300px] w-[300px] opacity-10 animate-orb-pulse blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" style={{ animationDelay: '4s' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
            <span className="text-lg font-black text-white">F</span>
          </div>
          <span className="text-lg font-black gradient-text">FitvoryaAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost py-2 px-5 text-sm">Sign In</Link>
          <Link to="/register" className="btn-purple py-2 px-5 text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center pt-16 pb-24 px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <span className="text-sm">🚀</span>
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Your complete fitness companion</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-text-primary leading-[1.05] mb-6 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '80ms' }}>
          Transform your{' '}
          <span className="gradient-text">fitness journey</span>
          <br className="hidden sm:block" /> with AI-powered tracking
        </h1>

        <p className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '160ms' }}>
          Track workouts, log nutrition, monitor weight, and celebrate milestones.
          Built for India — with 50+ Indian foods, smart calorie math, and real streak motivation.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '240ms' }}>
          <Link to="/register" className="btn-purple py-4 px-10 text-base shadow-2xl pulse-ring">
            Start Free Today
          </Link>
          <Link to="/login" className="btn-ghost py-4 px-10 text-base">
            Sign In →
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '320ms' }}>
          {STATS.map(s => (
            <div key={s.label} className="card card-shadow p-4 text-center">
              <p className="text-2xl font-black gradient-text">{s.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-text-primary mb-3">
            Everything you need,{' '}
            <span className="gradient-text">nothing you don't</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            A focused, fast fitness tracker designed for real people with real goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`${f.color} p-6 rounded-2xl card-hover animate-fade-up opacity-0`}
              style={{ animationFillMode: 'forwards', animationDelay: `${i * 70}ms` }}
            >
              <span className="text-4xl mb-4 block animate-float" style={{ animationDelay: `${i * 200}ms` }}>{f.icon}</span>
              <h3 className="text-base font-bold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="relative z-10 text-center pb-24 px-6">
        <div className="max-w-xl mx-auto card p-10 card-shadow">
          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-xl animate-float">F</div>
          <h2 className="text-2xl font-black text-text-primary mb-3">Ready to start?</h2>
          <p className="text-text-secondary mb-6">Create your free account in under a minute. No credit card needed.</p>
          <Link to="/register" className="btn-purple py-3.5 px-10 text-base">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8 text-xs text-text-muted">
        © 2026 FitvoryaAI · Built with ❤️ for your fitness goals
      </footer>
    </div>
  )
}
