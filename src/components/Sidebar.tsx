import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../firebase/auth'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: '⊞',  label: 'Dashboard' },
  { to: '/workout',   icon: '🏋️', label: 'Workout'   },
  { to: '/nutrition', icon: '🥗',  label: 'Nutrition' },
  { to: '/pregnancy', icon: '🤰',  label: 'Pregnancy' },
  { to: '/baby',      icon: '👶',  label: 'Baby'      },
  { to: '/weight',    icon: '⚖️',  label: 'Weight'    },
  { to: '/progress',  icon: '📈',  label: 'Progress'  },
  { to: '/profile',   icon: '👤',  label: 'Profile'   },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const initial = profile?.displayName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-lg shadow-purple-500/25'
        : 'text-text-secondary hover:bg-surface2 hover:text-text-primary'
    }`

  return (
    <>
      {/* ── Overlay (mobile) ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col
          bg-surface border-r border-border card-shadow
          transition-all duration-300 ease-in-out
          ${open ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}
          md:translate-x-0 md:${open ? 'w-64' : 'w-64'}
        `}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-white font-black text-sm shadow-md">
              F
            </div>
            <span className="font-black gradient-text text-base">FitvoryaAI</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-surface2 flex items-center justify-center text-text-secondary transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5" aria-label="App pages">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={linkClass}
              aria-label={n.label}
              onClick={() => { if (window.innerWidth < 768) onClose() }}
            >
              <span className="text-lg leading-none w-6 text-center flex-shrink-0" aria-hidden="true">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border flex-shrink-0 flex flex-col gap-1">
          {/* User card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface2 border border-border mb-2">
            <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">{profile?.displayName ?? 'User'}</p>
              <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-text-secondary hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
            aria-label="Sign out"
          >
            <span className="text-lg w-6 text-center" aria-hidden="true">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
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
