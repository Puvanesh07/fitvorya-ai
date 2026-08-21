import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../firebase/auth'
import { useAuth } from '../context/AuthContext'

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IconDashboard({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconWorkout({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/>
    </svg>
  )
}
function IconNutrition({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9S3 15.97 3 11a9 9 0 0 1 9-9z"/>
      <path d="M12 7v5l3 3"/>
    </svg>
  )
}
function IconWeight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4"/><path d="M4 19l1.5-6h13L20 19H4z"/>
    </svg>
  )
}
function IconProgress({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  )
}
function IconPregnancy({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.5"/><path d="M12 8c0 4 3 6 3 10H9c0-4 3-6 3-10z"/>
    </svg>
  )
}
function IconBaby({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
      <circle cx="9" cy="7.5" r="0.5" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="7.5" r="0.5" fill="currentColor" stroke="none"/>
      <path d="M10 10.5c.6.8 3.4.8 4 0"/>
    </svg>
  )
}
function IconFamily({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="2.5"/><circle cx="17" cy="7" r="2"/>
      <path d="M3 19v-2a6 6 0 0 1 12 0v2"/><path d="M17 13a4 4 0 0 1 4 4v2"/>
    </svg>
  )
}
function IconProfile({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/>
    </svg>
  )
}
function IconLogout({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
function IconClose({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ── Nav items ─────────────────────────────────────────────────────────────────
export const NAV = [
  { to: '/dashboard', icon: <IconDashboard />, iconLg: <IconDashboard size={22} />, label: 'Dashboard',  color: '#8b5cf6' },
  { to: '/workout',   icon: <IconWorkout />,   iconLg: <IconWorkout   size={22} />, label: 'Workout',    color: '#ec4899' },
  { to: '/nutrition', icon: <IconNutrition />, iconLg: <IconNutrition size={22} />, label: 'Nutrition',  color: '#10b981' },
  { to: '/weight',    icon: <IconWeight />,    iconLg: <IconWeight    size={22} />, label: 'Weight',     color: '#f59e0b' },
  { to: '/progress',  icon: <IconProgress />,  iconLg: <IconProgress  size={22} />, label: 'Progress',   color: '#60a5fa' },
  { to: '/pregnancy', icon: <IconPregnancy />, iconLg: <IconPregnancy size={22} />, label: 'Pregnancy',  color: '#f472b6' },
  { to: '/baby',      icon: <IconBaby />,      iconLg: <IconBaby      size={22} />, label: 'Baby',       color: '#34d399' },
  { to: '/family',    icon: <IconFamily />,    iconLg: <IconFamily    size={22} />, label: 'Family',     color: '#a78bfa' },
  { to: '/profile',   icon: <IconProfile />,   iconLg: <IconProfile   size={22} />, label: 'Profile',    color: '#fb923c' },
]

// SidebarProps kept for AppLayout compatibility — expanded/setExpanded ignored
interface SidebarProps {
  expanded: boolean
  setExpanded: (v: boolean) => void
}

export default function Sidebar({ }: SidebarProps) {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const initial = profile?.displayName?.charAt(0)?.toUpperCase()
    ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <>
      {/* ── DESKTOP: icon-only sidebar, always 60px wide ── */}
      <aside
        className="g-sidebar hidden md:flex flex-col fixed left-0 top-0 h-full z-40 flex-shrink-0"
        style={{ overflow: 'visible' }}
        aria-label="Main navigation"
      >
        {/* Brand logo */}
        <div className="flex items-center justify-center h-14 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-white font-black text-xs"
            style={{ boxShadow: '0 4px 14px rgba(108,65,210,0.45)' }}
          >
            F
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5 scrollbar-hide" style={{ overflowX: 'visible' }} aria-label="App pages">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              aria-label={n.label}
              className={({ isActive }) =>
                `g-sidebar-link ${isActive ? 'g-sidebar-link-active' : ''}`
              }
            >
              {n.icon}
              {/* Tooltip */}
              <span className="g-tooltip">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 h-px flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Footer: avatar + logout */}
        <div className="px-2 py-2 flex flex-col gap-0.5 flex-shrink-0" style={{ overflow: 'visible' }}>
          {/* Avatar */}
          <button
            onClick={() => navigate('/profile')}
            aria-label="Profile"
            className="g-sidebar-link"
          >
            <div
              className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center text-white text-[10px] font-black"
              style={{ boxShadow: '0 2px 8px rgba(108,65,210,0.4)' }}
            >
              {initial}
            </div>
            <span className="g-tooltip">{profile?.displayName ?? 'Profile'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="g-sidebar-link hover:!text-red-400 hover:!bg-red-500/10"
          >
            <IconLogout />
            <span className="g-tooltip">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE: bottom sheet ── */}
      <MobileNav sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} handleLogout={handleLogout} />
    </>
  )
}

// ── Mobile bottom-sheet nav ────────────────────────────────────────────────────
function MobileNav({
  sheetOpen,
  setSheetOpen,
  handleLogout,
}: {
  sheetOpen: boolean
  setSheetOpen: (v: boolean) => void
  handleLogout: () => void
}) {
  const { profile } = useAuth()

  return (
    <div className="md:hidden">
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50"
        style={{
          transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          borderRadius: '20px 20px 0 0',
          background: 'rgb(14 13 26 / 0.97)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.55)',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1.5">
          <div className="h-1 w-8 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center text-white font-black text-xs">F</div>
            <div>
              <p className="text-xs font-black gradient-text leading-none">FitvoryaAI</p>
              <p className="text-[10px] text-text-muted">{profile?.displayName ?? 'User'}</p>
            </div>
          </div>
          <button
            onClick={() => setSheetOpen(false)}
            className="h-7 w-7 rounded-full flex items-center justify-center text-text-muted"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <IconClose size={14} />
          </button>
        </div>

        <div className="mx-4 my-1.5" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Nav grid */}
        <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setSheetOpen(false)}
              aria-label={n.label}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {({ isActive }) => (
                <>
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? `${n.color}22` : 'rgba(255,255,255,0.05)',
                      border: isActive ? `1px solid ${n.color}44` : '1px solid rgba(255,255,255,0.07)',
                      color: isActive ? n.color : 'rgba(170,165,210,0.75)',
                      boxShadow: isActive ? `0 2px 10px ${n.color}25` : 'none',
                    }}
                  >
                    {n.icon}
                  </div>
                  <span className="text-[9px] font-bold text-center leading-tight"
                    style={{ color: isActive ? n.color : 'rgba(170,165,210,0.6)' }}>
                    {n.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mx-4 mb-2" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Sign out */}
        <div className="px-3 pb-6">
          <button
            onClick={() => { setSheetOpen(false); handleLogout() }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-all"
            style={{ background: 'rgba(255,75,75,0.07)', border: '1px solid rgba(255,75,75,0.18)' }}
          >
            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,75,75,0.14)', color: 'rgb(248,113,113)' }}>
              <IconLogout size={14} />
            </div>
            <span className="text-xs font-bold" style={{ color: 'rgb(252,165,165)' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          aria-label={sheetOpen ? 'Close menu' : 'Open navigation'}
          className="h-11 w-11 rounded-2xl gradient-brand text-white flex items-center justify-center transition-all duration-300 active:scale-95"
          style={{ boxShadow: '0 6px 22px rgba(108,65,210,0.55)' }}
        >
          {sheetOpen ? <IconClose size={18} /> : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          )}
        </button>
      </div>

      <div className="h-20" aria-hidden="true" />
    </div>
  )
}
