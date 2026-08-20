import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../firebase/auth'
import { useAuth } from '../context/AuthContext'

// ── SVG icon set ──────────────────────────────────────────────────────────────
function IconDashboard({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconWorkout({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/>
    </svg>
  )
}
function IconNutrition({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9S3 15.97 3 11a9 9 0 0 1 9-9z"/>
      <path d="M12 7v5l3 3"/>
    </svg>
  )
}
function IconWeight({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 19l1.5-6h13L20 19H4z"/>
    </svg>
  )
}
function IconProgress({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  )
}
function IconPregnancy({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.5"/>
      <path d="M12 8c0 4 3 6 3 10H9c0-4 3-6 3-10z"/>
    </svg>
  )
}
function IconBaby({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
      <circle cx="9" cy="7.5" r="0.5" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="7.5" r="0.5" fill="currentColor" stroke="none"/>
      <path d="M10 10.5c.6.8 3.4.8 4 0"/>
    </svg>
  )
}
function IconFamily({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="2.5"/>
      <circle cx="17" cy="7" r="2"/>
      <path d="M3 19v-2a6 6 0 0 1 12 0v2"/>
      <path d="M17 13a4 4 0 0 1 4 4v2"/>
    </svg>
  )
}
function IconProfile({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20v-1a8 8 0 0 1 16 0v1"/>
    </svg>
  )
}
function IconLogout({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
function IconClose({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ── Nav items ─────────────────────────────────────────────────────────────────
export const NAV = [
  { to: '/dashboard', icon: <IconDashboard />, iconLg: <IconDashboard size={24} />, label: 'Dashboard',  color: '#8b5cf6' },
  { to: '/workout',   icon: <IconWorkout />,   iconLg: <IconWorkout   size={24} />, label: 'Workout',    color: '#ec4899' },
  { to: '/nutrition', icon: <IconNutrition />, iconLg: <IconNutrition size={24} />, label: 'Nutrition',  color: '#10b981' },
  { to: '/weight',    icon: <IconWeight />,    iconLg: <IconWeight    size={24} />, label: 'Weight',     color: '#f59e0b' },
  { to: '/progress',  icon: <IconProgress />,  iconLg: <IconProgress  size={24} />, label: 'Progress',   color: '#60a5fa' },
  { to: '/pregnancy', icon: <IconPregnancy />, iconLg: <IconPregnancy size={24} />, label: 'Pregnancy',  color: '#f472b6' },
  { to: '/baby',      icon: <IconBaby />,      iconLg: <IconBaby      size={24} />, label: 'Baby',       color: '#34d399' },
  { to: '/family',    icon: <IconFamily />,    iconLg: <IconFamily    size={24} />, label: 'Family',     color: '#a78bfa' },
  { to: '/profile',   icon: <IconProfile />,   iconLg: <IconProfile   size={24} />, label: 'Profile',    color: '#fb923c' },
]

interface SidebarProps {
  expanded: boolean
  setExpanded: (v: boolean) => void
}

export default function Sidebar({ expanded, setExpanded }: SidebarProps) {
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
      {/* ── DESKTOP sidebar ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="sidebar hidden md:flex flex-col fixed left-0 top-0 h-full z-40 transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0"
        style={{ width: expanded ? '220px' : '68px' }}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div
          className="flex items-center h-16 px-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0"
            style={{ boxShadow: '0 4px 16px rgba(108,65,210,0.45)' }}
          >
            F
          </div>
          <div className={`ml-3 transition-all duration-200 overflow-hidden whitespace-nowrap ${expanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}`}>
            <p className="font-black text-sm gradient-text leading-none">FitvoryaAI</p>
            <p className="text-[10px] text-text-muted font-medium mt-0.5 leading-none">Fitness Platform</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 flex flex-col gap-0.5 scrollbar-hide" aria-label="App pages">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              aria-label={n.label}
              className={({ isActive }) =>
                `group flex items-center h-11 rounded-xl transition-all duration-150 overflow-hidden relative ${
                  isActive
                    ? 'sidebar-link-active text-purple-300'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-purple-400" />
                  )}
                  <span className="flex-shrink-0 flex items-center justify-center w-11" aria-hidden="true">
                    {n.icon}
                  </span>
                  <span className={`text-sm font-semibold whitespace-nowrap pr-3 transition-all duration-200 ${expanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                    {n.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 h-px flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Footer */}
        <div className="px-2 py-3 flex flex-col gap-0.5 flex-shrink-0">
          {/* User */}
          <div className="flex items-center h-12 rounded-xl overflow-hidden">
            <span className="flex-shrink-0 flex items-center justify-center w-11">
              <div
                className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-black"
                style={{ boxShadow: '0 2px 8px rgba(108,65,210,0.4)' }}
              >
                {initial}
              </div>
            </span>
            <div className={`flex-1 min-w-0 pr-3 transition-all duration-200 ${expanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
              <p className="text-xs font-bold text-text-primary truncate leading-tight">{profile?.displayName ?? 'User'}</p>
              <p className="text-[10px] text-text-muted truncate leading-tight">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex items-center h-10 w-full rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all overflow-hidden"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-11">
              <IconLogout />
            </span>
            <span className={`text-sm font-semibold whitespace-nowrap pr-3 transition-all duration-200 ${expanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
              Sign Out
            </span>
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
      {/* ── Backdrop ── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
          style={{ animation: 'fadeIn 0.2s ease forwards' }}
        />
      )}

      {/* ── Bottom sheet ── */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 transition-transform duration-350 ease-out"
        style={{
          transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          borderRadius: '24px 24px 0 0',
          background: 'rgb(18, 17, 32)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Header row: brand + close */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white font-black text-sm"
              style={{ boxShadow: '0 4px 14px rgba(108,65,210,0.45)' }}
            >
              F
            </div>
            <div>
              <p className="text-sm font-black gradient-text leading-none">FitvoryaAI</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {profile?.displayName ?? 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSheetOpen(false)}
            aria-label="Close menu"
            className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted transition-all"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <IconClose />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-4" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

        {/* Nav grid — 4 columns */}
        <div className="grid grid-cols-4 gap-3 px-5 pb-4">
          {NAV.map((n, i) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setSheetOpen(false)}
              aria-label={n.label}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
              style={{
                animationDelay: `${i * 30}ms`,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {({ isActive }) => (
                <>
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive
                        ? `${n.color}25`
                        : 'rgba(255,255,255,0.06)',
                      border: isActive
                        ? `1px solid ${n.color}55`
                        : '1px solid rgba(255,255,255,0.08)',
                      color: isActive ? n.color : 'rgba(170,165,210,0.8)',
                      boxShadow: isActive ? `0 4px 14px ${n.color}30` : 'none',
                    }}
                  >
                    {n.iconLg}
                  </div>
                  <span
                    className="text-[10px] font-bold text-center leading-tight"
                    style={{ color: isActive ? n.color : 'rgba(170,165,210,0.7)' }}
                  >
                    {n.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

        {/* Sign out */}
        <div className="px-5 pb-8">
          <button
            onClick={() => { setSheetOpen(false); handleLogout() }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all active:scale-98"
            style={{
              background: 'rgba(255,75,75,0.08)',
              border: '1px solid rgba(255,75,75,0.2)',
            }}
          >
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,75,75,0.15)', color: 'rgb(255,100,100)' }}
            >
              <IconLogout size={18} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'rgb(255,120,120)' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── FAB trigger (always visible at bottom-center) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          aria-label={sheetOpen ? 'Close menu' : 'Open navigation'}
          className="h-14 w-14 rounded-2xl gradient-brand text-white flex items-center justify-center transition-all duration-300 active:scale-95"
          style={{
            boxShadow: sheetOpen
              ? '0 8px 32px rgba(108,65,210,0.7)'
              : '0 6px 24px rgba(108,65,210,0.5)',
          }}
        >
          {sheetOpen ? (
            <IconClose size={22} />
          ) : (
            /* Dashboard grid icon — matches reference */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          )}
        </button>
      </div>

      {/* Bottom safe-area spacer */}
      <div className="h-24" aria-hidden="true" />
    </div>
  )
}
