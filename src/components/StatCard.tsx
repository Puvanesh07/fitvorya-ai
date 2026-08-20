interface Props {
  label: string
  value: string | number
  unit?: string
  sub?: string
  icon?: string
  gradient?: string
  className?: string
}

export default function StatCard({ label, value, unit, sub, icon, gradient, className = '' }: Props) {
  return (
    <div className={`card card-hover p-4 sm:p-5 animate-fade-up opacity-0 ${className}`} style={{ animationFillMode: 'forwards' }}>
      {icon && (
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg mb-3 ${gradient ?? 'gradient-brand'}`}>
          {icon}
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary leading-none">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-text-secondary">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-text-secondary mt-1.5">{sub}</p>}
    </div>
  )
}
