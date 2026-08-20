export default function PageLoader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 orb orb-purple h-96 w-96 opacity-20 animate-orb-pulse blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 orb orb-pink h-96 w-96 opacity-15 animate-orb-pulse blur-3xl" style={{ animationDelay: '1s' }} />
      
      {/* Loader content */}
      <div className="relative z-10 text-center">
        {/* Spinning logo */}
        <div className="h-20 w-20 rounded-2xl gradient-brand flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl animate-pulse">
          F
        </div>
        
        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-3 w-3 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        
        <p className="text-sm text-text-secondary mt-4 animate-pulse">Loading your data...</p>
      </div>
    </div>
  )
}
