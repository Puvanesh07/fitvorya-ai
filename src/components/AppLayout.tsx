import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import EmailVerificationBanner from './EmailVerificationBanner'
import { useAuth } from '../context/AuthContext'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [expanded, setExpanded] = useState(false)
  const { profile } = useAuth()
  const navigate = useNavigate()

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
        {/* Desktop top bar — user avatar only */}
        <header className="top-bar hidden md:flex sticky top-0 z-30 justify-end">
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
        </header>

        <EmailVerificationBanner />

        <main className="flex-1 overflow-x-hidden">
          <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
