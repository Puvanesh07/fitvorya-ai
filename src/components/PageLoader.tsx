export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div
          className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-black mx-auto mb-5"
          style={{ boxShadow: '0 8px 32px rgba(108,65,210,0.45)', animation: 'glow-pulse 2s ease-in-out infinite' }}
        >
          F
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          {[0, 150, 300].map(delay => (
            <div key={delay} className="h-2 w-2 rounded-full animate-bounce"
              style={{ background: delay === 300 ? '#ec4899' : '#8b5cf6', animationDelay: `${delay}ms` }} />
          ))}
        </div>
        <p className="text-xs text-text-muted font-semibold">Loading…</p>
      </div>
    </div>
  )
}
