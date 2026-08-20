import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { logout } from '../firebase/auth'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/workout',   label: 'Workout',   icon: '🏋️' },
  { to: '/nutrition', label: 'Nutrition', icon: '🥗' },
  { to: '/weight',    label: 'Weight',    icon: '⚖️' },
  { to: '/progress',  label: 'Progress',  icon: '📈' },
  { to: '/profile',   label: 'Profile',   icon: '👤' },
]

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
      isActive
        ? 'text-brand bg-brand-light'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface2'
    }`

  const initial = profile?.displayName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-105">
            F
          </div>
          <span className="font-bold gradient-text hidden sm:block">FitvoryaAI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="text-base">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Avatar + logout (desktop) */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <div className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                {initial}
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost py-1.5 px-3 text-xs"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="flex flex-col gap-1.5 rounded-lg p-1.5 hover:bg-surface2 transition-colors md:hidden"
          >
            <span className={`block h-0.5 w-5 bg-text-primary rounded-full transition-all duration-300 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-text-primary rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-text-primary rounded-full transition-all duration-300 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`overflow-hidden transition-all duration-300 md:hidden ${menuOpen ? 'max-h-72' : 'max-h-0'}`}>
        <div className="border-t border-border/50 px-4 pb-4 pt-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClass}
              onClick={() => setMenuOpen(false)}
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                {initial}
              </div>
              <span className="text-xs text-text-secondary truncate max-w-[140px]">
                {profile?.displayName ?? user?.email}
              </span>
            </div>
            <button onClick={handleLogout} className="text-xs text-danger hover:underline transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
