import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-20 left-10 orb orb-purple h-80 w-80 opacity-20 animate-orb-pulse blur-3xl" />
      <div className="absolute bottom-20 right-10 orb orb-pink h-96 w-96 opacity-15 animate-orb-pulse blur-3xl" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo + brand */}
        <div className="flex items-center justify-center gap-3 mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-2xl">
            <span className="text-3xl font-black text-white">F</span>
          </div>
          <h1 className="text-4xl font-black gradient-text">FitvoryaAI</h1>
        </div>

        {/* Tagline */}
        <h2 className="text-3xl sm:text-5xl font-black text-text-primary mb-4 leading-tight animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}>
          Your AI-Ppppowered<br />Fitness Companion
        </h2>
        <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto mb-10 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}>
          Track workouts, nutrition, and progress with personalized AI insights. Achieve your fitness goals faster.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}>
          <Link to="/register" className="btn-purple py-3.5 px-10 text-base shadow-2xl">
            Get Started Free
          </Link>
          <Link to="/login" className="btn-ghost py-3.5 px-10 text-base">
            Sign In
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20">
          {[
            { icon: '🏋️', title: 'Smart Workouts', desc: 'AI-generated workout plans' },
            { icon: '🥗', title: 'Nutrition Tracking', desc: 'Log meals with USDA database' },
            { icon: '📈', title: 'Progress Insights', desc: 'Track streaks, PRs & badges' },
          ].map((f, i) => (
            <div key={f.title}
              className="card p-6 card-hover text-center animate-fade-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: `${400 + i * 100}ms` }}>
              <span className="text-4xl mb-3 block animate-float">{f.icon}</span>
              <h3 className="text-base font-bold text-text-primary mb-1">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
