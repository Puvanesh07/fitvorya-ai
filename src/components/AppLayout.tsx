import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import EmailVerificationBanner from './EmailVerificationBanner'
import { useAuth } from '../context/AuthContext'

interface AppLayoutProps {
  children: ReactNode
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [expanded, setExpanded] = useState(false)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const COLLAPSED = 68
  const EXPANDED  = 220
  const initial   = profile?.displayName?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out"
        style={{
          marginLeft:
            typeof window !== 'undefined' && window.innerWidth >= 768
              ? expanded ? EXPANDED : COLLAPSED
              : 0,
        }}
      >
        {/* Desktop top bar */}
        <header className="top-bar hidden md:flex sticky top-0 z-30">
          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="input pl-9 py-2 text-sm h-9"
              style={{ borderRadius: '0.75rem' }}
            />
          </div>

          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Quick add */}
            <button
              onClick={() => navigate('/workout')}
              aria-label="Quick add workout"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white transition-all gradient-brand"
              style={{ boxShadow: '0 4px 14px rgba(108,65,210,0.4)' }}
            >
              <PlusIcon />
            </button>

            {/* Notifications */}
            <button
              aria-label="Notifications"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-all relative"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <BellIcon />
              <span
                className="absolute top-1.5 right-1.5 rounded-full"
                style={{ width: '6px', height: '6px', background: 'rgb(230,55,165)' }}
              />
            </button>

            {/* User avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 h-9 px-2 rounded-xl transition-all"
              style={{ background: 'transparent' }}
              aria-label="Go to profile"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-black"
                style={{ boxShadow: '0 2px 10px rgba(108,65,210,0.45)' }}
              >
                {initial}
              </div>
              <span className="text-sm font-semibold text-text-primary hidden lg:block">
                {profile?.displayName?.split(' ')[0] ?? 'User'}
              </span>
            </button>
          </div>
        </header>

        <EmailVerificationBanner />

        <main className="flex-1 overflow-x-hidden">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
