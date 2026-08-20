import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../firebase/auth'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { to: '/dashboard', icon: '⊞',  label: 'Dashboard'  },
  { to: '/workout',   icon: '🏋️', label: 'Workout'    },
  { to: '/nutrition', icon: '🥗',  label: 'Nutrition'  },
  { to: '/weight',    icon: '⚖️',  label: 'Weight'     },
  { to: '/progress',  icon: '📈',  label: 'Progress'   },
  { to: '/profile',   icon: '👤',  label: 'Profile'    },
]

export default function Sidebar() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const initial = profile?.displayName?.charAt(0)?.toUpperCase()
    ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link ${isActive ? 'active' : ''}`

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`sidebar card-shadow ${expanded ? 'expanded' : ''}`}
        aria-label="Main navigation"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div
          className="sidebar-link mb-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
          role="button"
          aria-label="Go to dashboard"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
        >
          <div className="sidebar-icon">
            <div className="h-7 w-7 rounded-xl gradient-brand flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              F
            </div>
          </div>
          {expanded && <span className="font-black gradient-text text-base">FitvoryaAI</span>}
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border mb-3 mx-auto" role="separator" />

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 flex-1 w-full" aria-label="App pages">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={linkClass}
              aria-label={n.label}
              title={expanded ? undefined : n.label}
            >
              <span className="sidebar-icon" aria-hidden="true">{n.icon}</span>
              {expanded && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <div className="sidebar-link justify-center">
            <ThemeToggle />
            {expanded && <span className="text-xs text-text-muted">Theme</span>}
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link text-left"
            aria-label="Sign out"
          >
            <span className="sidebar-icon" aria-hidden="true">🚪</span>
            {expanded && <span>Sign out</span>}
          </button>
          {/* Avatar */}
          <div className="sidebar-link items-center" aria-label={`Signed in as ${profile?.displayName ?? user?.email ?? 'User'}`}>
            <div
              className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              aria-hidden="true"
            >
              {initial}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{profile?.displayName ?? 'User'}</p>
                <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}
            aria-label={n.label}
          >
            <span className="mnb-icon" aria-hidden="true">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
