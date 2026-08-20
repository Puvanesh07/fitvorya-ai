import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'
import EmailVerificationBanner from './EmailVerificationBanner'
import { useAuth } from '../context/AuthContext'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, user } = useAuth()
  const initial = profile?.displayName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area — shifts right on md+ when sidebar present */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">

        {/* ── Top Navbar ── */}
        <header className="sticky top-0 z-30 glass border-b border-border/60 flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">

            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="h-9 w-9 rounded-xl hover:bg-surface2 flex items-center justify-center text-text-secondary transition-colors border border-border"
                aria-label="Toggle navigation"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Brand — only on mobile (md+ shows sidebar) */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center text-white font-black text-xs">F</div>
                <span className="font-black gradient-text text-sm">FitvoryaAI</span>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Profile avatar link */}
              <Link
                to="/profile"
                aria-label="Your profile"
                className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-purple-500/20"
              >
                {initial}
              </Link>
            </div>
          </div>
        </header>

        {/* Email verification banner */}
        <EmailVerificationBanner />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
