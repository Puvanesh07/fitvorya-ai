import { useTheme } from '../context/ThemeContext'

interface Props { className?: string }

export default function ThemeToggle({ className = '' }: Props) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${className}`}
      style={{ background: isDark ? 'linear-gradient(135deg,#6c41d2,#8b5cf6)' : 'rgba(255,255,255,0.15)' }}
    >
      <span
        className="inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 text-[10px]"
        style={{ transform: isDark ? 'translateX(24px)' : 'translateX(4px)' }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
