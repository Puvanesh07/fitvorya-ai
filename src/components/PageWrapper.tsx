import type { ReactNode } from 'react'
import Navbar from './Navbar'

interface Props {
  children: ReactNode
  className?: string
}

export default function PageWrapper({ children, className = '' }: Props) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mesh-bg" />
      <Navbar />
      <main className={`relative z-10 mx-auto max-w-6xl px-4 py-6 sm:py-8 ${className}`}>
        {children}
      </main>
    </div>
  )
}
