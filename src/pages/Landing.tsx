import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '500K+', label: 'Weights Logged' },
  { value: '98%', label: 'Goal Success' },
  { value: '4.9★', label: 'User Rating' },
]

const FEATURES = [
  {
    icon: '⚖️',
    title: 'Smart Weight Tracking',
    desc: 'Log daily weights and watch your journey unfold on beautiful charts.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: '🎯',
    title: 'Personalised Goals',
    desc: 'Set your goal and get a science-backed calorie and macro target instantly.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    desc: 'BMI, BMR, TDEE, progress — every metric you need in one place.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    desc: 'Your data is yours alone. Secured by Firebase with military-grade rules.',
    color: 'from-green-500 to-teal-500',
  },
]

const HOW = [
  { step: '01', title: 'Create your account', desc: 'Sign up free in 10 seconds with email or Google.' },
  { step: '02', title: 'Set up your profile', desc: 'Enter your details and pick your fitness goal.' },
  { step: '03', title: 'Track daily', desc: 'Log weight, review metrics, watch your progress.' },
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-bg text-text-primary overflow-x-hidden">
      {/* Mesh background */}
      <div className="mesh-bg" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm">F</div>
            <span className="text-lg font-bold gradient-text">FitvoryaAI</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="btn-primary py-2 px-5 text-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost py-2 px-4 text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary py-2 px-5 text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-6xl px-5 pt-24 pb-20 text-center">
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <span className="badge badge-brand mb-6 inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            V1 — Now Live
          </span>
        </div>

        <h1 className="animate-fade-up opacity-0 delay-100 text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-6" style={{ animationFillMode: 'forwards' }}>
          Your fitness,{' '}
          <span className="gradient-text text-glow">simplified.</span>
        </h1>

        <p className="animate-fade-up opacity-0 delay-200 mx-auto mb-10 max-w-2xl text-lg text-text-secondary leading-relaxed" style={{ animationFillMode: 'forwards' }}>
          Track weight, hit goals, understand your body. FitvoryaAI gives you the metrics that matter — beautifully, privately, free.
        </p>

        <div className="animate-fade-up opacity-0 delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animationFillMode: 'forwards' }}>
          <Link
            to="/register"
            className="btn-primary w-full sm:w-auto px-8 py-4 text-base glow-brand"
          >
            Start for free →
          </Link>
          <Link
            to="/login"
            className="btn-ghost w-full sm:w-auto px-8 py-4 text-base"
          >
            Sign in
          </Link>
        </div>

        {/* Hero visual */}
        <div className="animate-fade-up opacity-0 delay-400 mt-16 relative" style={{ animationFillMode: 'forwards' }}>
          <div className="relative mx-auto max-w-2xl">
            {/* Glow behind card */}
            <div className="absolute inset-0 gradient-brand rounded-3xl blur-3xl opacity-20 scale-105" />
            {/* Mock dashboard card */}
            <div className="relative glass rounded-3xl p-6 sm:p-8 border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-text-secondary text-sm">Good morning, Puvanesh 👋</p>
                  <p className="font-bold text-xl mt-0.5">Your Dashboard</p>
                </div>
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold">P</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'BMI', val: '22.4', color: 'text-success' },
                  { label: 'Calories', val: '2,100', color: 'text-brand' },
                  { label: 'Protein', val: '140g', color: 'text-brand2' },
                  { label: 'Progress', val: '68%', color: 'text-warning' },
                ].map((m) => (
                  <div key={m.label} className="card p-3 text-center">
                    <p className={`text-xl font-bold ${m.color}`}>{m.val}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
              {/* Mini chart bars */}
              <div className="flex items-end gap-1.5 h-16">
                {[40, 55, 48, 62, 58, 70, 65, 75, 68, 80, 76, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm opacity-80"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, rgb(var(--brand)), rgb(var(--brand2)))`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2 text-right">Weight trend — last 12 entries</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border/50 bg-surface/50 py-10">
        <div className="mx-auto max-w-4xl px-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="animate-fade-up opacity-0 text-center"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
              >
                <p className="text-3xl font-bold gradient-text">{s.value}</p>
                <p className="text-sm text-text-secondary mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need</h2>
          <p className="text-text-secondary max-w-xl mx-auto">No bloat. Just the tools that actually move the needle on your fitness journey.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card card-hover p-6 animate-fade-up opacity-0"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-xl mb-4 shadow-lg`}>
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-surface/30 py-24 border-y border-border/50">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Up and running in minutes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW.map((h, i) => (
              <div key={h.step} className="relative animate-fade-up opacity-0" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}>
                <div className="text-5xl font-black gradient-text opacity-30 mb-3">{h.step}</div>
                <h3 className="font-semibold text-lg mb-2">{h.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{h.desc}</p>
                {i < HOW.length - 1 && (
                  <div className="hidden sm:block absolute top-8 -right-4 text-border text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="relative">
          <div className="absolute inset-0 gradient-brand rounded-3xl blur-3xl opacity-10" />
          <div className="relative card p-10 sm:p-16 border-brand/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">transform</span> your fitness?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Join thousands already tracking smarter. Free forever, no credit card needed.
            </p>
            <Link to="/register" className="btn-primary inline-flex px-10 py-4 text-base glow-brand">
              Create your free account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-xs">F</div>
          <span className="font-semibold gradient-text">FitvoryaAI</span>
        </div>
        <p className="text-sm text-text-secondary">V1 · Built with React, Firebase & Tailwind CSS</p>
      </footer>
    </div>
  )
}
