import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
function IconCoach({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-4 6.5V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
      <path d="M9 21h6"/>
      <circle cx="9.5" cy="9" r="0.5" fill="currentColor" stroke="none"/>
      <circle cx="14.5" cy="9" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

// ── Nav items ─────────────────────────────────────────────────────────────────
export const NAV = [
  { to: '/dashboard', icon: <IconDashboard />, label: 'Dashboard', color: '#8b5cf6' },
  { to: '/coach',     icon: <IconCoach />,     label: 'AI Coach',  color: '#a78bfa' },
  { to: '/workout',   icon: <IconWorkout />,   label: 'Workout',   color: '#ec4899' },
  { to: '/nutrition', icon: <IconNutrition />, label: 'Nutrition', color: '#10b981' },
  { to: '/weight',    icon: <IconWeight />,    label: 'Weight',    color: '#f59e0b' },
  { to: '/progress',  icon: <IconProgress />,  label: 'Progress',  color: '#60a5fa' },
  { to: '/pregnancy', icon: <IconPregnancy />, label: 'Pregnancy', color: '#f472b6' },
  { to: '/baby',      icon: <IconBaby />,      label: 'Baby',      color: '#34d399' },
  { to: '/family',    icon: <IconFamily />,    label: 'Family',    color: '#a78bfa' },
  { to: '/profile',   icon: <IconProfile />,   label: 'Profile',   color: '#fb923c' },
]

// ── Portal tooltip — renders to document.body, never clipped by overflow ──────
// This is the key fix: CSS tooltips are clipped when any ancestor has
// overflow-y:auto/scroll (even if overflow-x:visible is set). By portalling
// to <body> and positioning with getBoundingClientRect we bypass all clipping.
interface TooltipPortalProps {
  label:   string
  anchor:  React.RefObject<HTMLElement | null>
  visible: boolean
}

function TooltipPortal({ label, anchor, visible }: TooltipPortalProps) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!visible || !anchor.current) return
    const r  = anchor.current.getBoundingClientRect()
    setPos({
      top:  r.top + r.height / 2,
      left: r.right + 12,
    })
  }, [visible, anchor])

  if (!visible) return null

  return createPortal(
    <div
      role="tooltip"
      style={{
        position:       'fixed',
        top:            pos.top,
        left:           pos.left,
        transform:      'translateY(-50%)',
        zIndex:         9999,
        pointerEvents:  'none',
        // Glassmorphism style
        background:     'rgb(18 16 34 / 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:         '1px solid rgba(255,255,255,0.12)',
        borderLeft:     '2px solid rgba(139,92,246,0.75)',
        color:          'rgba(230,225,255,0.95)',
        fontSize:       '0.72rem',
        fontWeight:     700,
        letterSpacing:  '0.01em',
        padding:        '0.32rem 0.7rem',
        borderRadius:   '0.5rem',
        boxShadow:      '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.06)',
        whiteSpace:     'nowrap',
        // Smooth entrance
        animation:      'tooltipPortalIn 0.15s ease forwards',
      }}
    >
      {/* Arrow */}
      <span style={{
        position:    'absolute',
        right:       '100%',
        top:         '50%',
        transform:   'translateY(-50%)',
        borderWidth: 5,
        borderStyle: 'solid',
        borderColor: 'transparent rgba(139,92,246,0.75) transparent transparent',
      }} />
      {label}
    </div>,
    document.body,
  )
}

// ── Sidebar nav item with portal tooltip ──────────────────────────────────────
interface NavItemProps {
  to:       string
  icon:     React.ReactNode
  label:    string
  isActive: boolean
}

function SidebarNavItem({ to, icon, label, isActive }: NavItemProps) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)

  return (
    <>
      <NavLink
        ref={ref}
        to={to}
        aria-label={label}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={()   => setHovered(true)}
        onBlur={()    => setHovered(false)}
        style={{
          position:        'relative',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          width:           44,
          height:          40,
          borderRadius:    '0.625rem',
          margin:          '0 auto',
          transition:      'all 0.15s ease',
          // No white — explicit dark colors only
          color:    isActive ? 'rgb(196,181,253)' : 'rgba(160,155,200,0.75)',
          background: isActive
            ? 'linear-gradient(135deg, rgba(109,67,210,0.75), rgba(109,67,210,0.45))'
            : hovered
            ? 'rgba(255,255,255,0.07)'
            : 'transparent',
          border: isActive ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
          boxShadow: isActive ? '0 2px 12px rgba(108,65,210,0.3)' : 'none',
          outline: 'none',
          textDecoration: 'none',
        }}
      >
        {icon}
      </NavLink>
      <TooltipPortal label={label} anchor={ref} visible={hovered} />
    </>
  )
}

// ── Footer button with portal tooltip ─────────────────────────────────────────
interface FooterBtnProps {
  onClick:  () => void
  icon:     React.ReactNode
  label:    string
  danger?:  boolean
}

function FooterBtn({ onClick, icon, label, danger }: FooterBtnProps) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={ref}
        onClick={onClick}
        aria-label={label}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={()   => setHovered(true)}
        onBlur={()    => setHovered(false)}
        style={{
          position:       'relative',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          44,
          height:         40,
          borderRadius:   '0.625rem',
          margin:         '0 auto',
          transition:     'all 0.15s ease',
          color:   danger && hovered ? 'rgb(248,113,113)' : 'rgba(160,155,200,0.75)',
          background: hovered
            ? danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)'
            : 'transparent',
          border:    '1px solid transparent',
          outline:   'none',
          cursor:    'pointer',
        }}
      >
        {icon}
      </button>
      <TooltipPortal label={label} anchor={ref} visible={hovered} />
    </>
  )
}

// ── SidebarProps ──────────────────────────────────────────────────────────────
interface SidebarProps {
  expanded:    boolean
  setExpanded: (v: boolean) => void
}

export default function Sidebar({ }: SidebarProps) {
  const { profile, user } = useAuth()
  const navigate          = useNavigate()
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
        aria-label="Main navigation"
        className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 flex-shrink-0"
        style={{
          width:               60,
          background:          'rgb(12 11 22 / 0.97)',
          backdropFilter:      'blur(28px)',
          WebkitBackdropFilter:'blur(28px)',
          borderRight:         '1px solid rgba(255,255,255,0.07)',
          boxShadow:           '4px 0 24px rgba(0,0,0,0.45)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-center h-14 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="gradient-brand"
            style={{
              height: 32, width: 32, borderRadius: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 900, fontSize: '0.7rem',
              boxShadow: '0 4px 14px rgba(108,65,210,0.45)',
            }}
          >
            F
          </div>
        </div>

        {/* Nav links — overflow-y:auto is fine because tooltips portal to body */}
        <nav
          aria-label="App pages"
          className="flex-1 scrollbar-hide"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            padding:   '0.5rem',
            display:   'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} children={({ isActive }) => (
              <SidebarNavItem to={n.to} icon={n.icon} label={n.label} isActive={isActive} />
            )} />
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 flex-shrink-0" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Footer */}
        <div className="flex flex-col flex-shrink-0" style={{ padding: '0.5rem', gap: 2 }}>
          {/* Avatar / profile */}
          <FooterBtn
            onClick={() => navigate('/profile')}
            label={profile?.displayName ?? 'Profile'}
            icon={
              <div
                className="gradient-brand"
                style={{
                  height: 28, width: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.62rem', fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(108,65,210,0.4)',
                }}
              >
                {initial}
              </div>
            }
          />
          {/* Logout */}
          <FooterBtn
            onClick={handleLogout}
            label="Sign Out"
            icon={<IconLogout />}
            danger
          />
        </div>
      </aside>

      {/* ── MOBILE bottom sheet ── */}
      <MobileNav sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} handleLogout={handleLogout} />
    </>
  )
}

// ── Mobile bottom-sheet nav ───────────────────────────────────────────────────
function MobileNav({
  sheetOpen,
  setSheetOpen,
  handleLogout,
}: {
  sheetOpen:    boolean
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
          transform:           sheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition:          'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          borderRadius:        '20px 20px 0 0',
          background:          'rgb(12 11 22 / 0.97)',
          backdropFilter:      'blur(32px)',
          WebkitBackdropFilter:'blur(32px)',
          border:              '1px solid rgba(255,255,255,0.08)',
          borderBottom:        'none',
          boxShadow:           '0 -8px 40px rgba(0,0,0,0.55)',
          maxHeight:           '88vh',
          overflowY:           'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1.5">
          <div style={{ height: 4, width: 32, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div
              className="gradient-brand"
              style={{ height: 28, width: 28, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.7rem' }}
            >F</div>
            <div>
              <p className="text-xs font-black gradient-text leading-none">FitvoryaAI</p>
              <p style={{ fontSize: '0.625rem', color: 'rgba(160,155,200,0.7)' }}>{profile?.displayName ?? 'User'}</p>
            </div>
          </div>
          <button
            onClick={() => setSheetOpen(false)}
            style={{ height: 28, width: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(160,155,200,0.7)', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer' }}
          >
            <IconClose size={14} />
          </button>
        </div>

        <div style={{ height: 1, margin: '6px 16px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Nav grid */}
        <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setSheetOpen(false)}
              aria-label={n.label}
            >
              {({ isActive }) => (
                <div
                  className="flex flex-col items-center gap-1 p-2 rounded-xl active:scale-95 transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div style={{
                    height:     36,
                    width:      36,
                    borderRadius: '0.625rem',
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? `${n.color}22` : 'rgba(255,255,255,0.05)',
                    border:     isActive ? `1px solid ${n.color}44` : '1px solid rgba(255,255,255,0.07)',
                    color:      isActive ? n.color : 'rgba(160,155,200,0.75)',
                    boxShadow:  isActive ? `0 2px 10px ${n.color}25` : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {n.icon}
                  </div>
                  <span style={{ fontSize: '0.56rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, color: isActive ? n.color : 'rgba(160,155,200,0.6)' }}>
                    {n.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>

        <div style={{ height: 1, margin: '0 16px 8px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Sign out */}
        <div className="px-3 pb-6">
          <button
            onClick={() => { setSheetOpen(false); handleLogout() }}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            10,
              width:          '100%',
              padding:        '10px 12px',
              borderRadius:   '0.75rem',
              background:     'rgba(255,75,75,0.07)',
              border:         '1px solid rgba(255,75,75,0.18)',
              cursor:         'pointer',
            }}
          >
            <div style={{ height: 28, width: 28, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,75,75,0.14)', color: 'rgb(248,113,113)', flexShrink: 0 }}>
              <IconLogout size={14} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(252,165,165)' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          aria-label={sheetOpen ? 'Close menu' : 'Open navigation'}
          className="gradient-brand"
          style={{
            height:       44,
            width:        44,
            borderRadius: '1rem',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            color:        'white',
            border:       'none',
            cursor:       'pointer',
            transition:   'all 0.3s ease',
            boxShadow:    '0 6px 22px rgba(108,65,210,0.55)',
          }}
        >
          {sheetOpen ? <IconClose size={18} /> : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          )}
        </button>
      </div>

      <div style={{ height: 80 }} aria-hidden="true" />
    </div>
  )
}
