import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import EmailVerificationBanner from './EmailVerificationBanner'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <EmailVerificationBanner />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

