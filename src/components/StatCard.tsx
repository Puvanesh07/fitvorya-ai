interface Props {
  label: string
  value: string | number
  unit?: string
  sub?: string
  icon?: string
  gradient?: string
  change?: string
  changeUp?: boolean
  className?: string
}

export default function StatCard({ label, value, unit, sub, icon, gradient, change, changeUp, className = '' }: Props) {
  return (
    <div
      className={`card card-hover card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0 ${className}`}
      style={{ animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        {icon && (
          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0 ${gradient ?? 'gradient-brand'}`}
            style={{ boxShadow: gradient ? undefined : '0 4px 12px rgba(108,65,210,0.35)' }}>
            {icon}
          </div>
        )}
        {change !== undefined && (
          <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
            changeUp !== false
              ? 'text-green-400 bg-green-400/10'
              : 'text-red-400 bg-red-400/10'
          }`}>
            {changeUp !== false ? '↑' : '↓'} {change}
          </span>
        )}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-black text-text-primary leading-none tracking-tight">
        {value}
        {unit && <span className="ml-1 text-xs sm:text-sm font-normal text-text-muted">{unit}</span>}
      </p>
      {sub && <p className="text-[10px] text-text-muted mt-1.5 leading-snug">{sub}</p>}
    </div>
  )
}
