import type { PregnancyStage } from '../../types/pregnancy'
import type { MonthlyGuide } from '../../types/pregnancy'

interface Props {
  stage: PregnancyStage
  guides: MonthlyGuide[]
  selectedMonth: number
  onSelectMonth: (m: number) => void
}

const MONTH_EMOJIS = ['🌱','💓','👶','🌟','👁️','👂','🧠','🦴','🤰','🎉']
const TRIMESTER_COLORS: Record<number, string> = {
  1: 'from-violet-500 to-purple-400',
  2: 'from-pink-500 to-rose-400',
  3: 'from-orange-500 to-amber-400',
}
const TRIMESTER_BG: Record<number, string> = {
  1: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700',
  2: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700',
  3: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
}

export default function PregnancyTimeline({ stage, guides, selectedMonth, onSelectMonth }: Props) {
  return (
    <div className="card card-shadow flex flex-col gap-5">

      {/* Current stage banner */}
      <div className={`rounded-2xl p-4 border ${TRIMESTER_BG[stage.trimester]}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
              Currently in
            </p>
            <h3 className="text-lg font-black text-text-primary">
              Week {stage.week} · Month {stage.month}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {stage.trimester === 1 ? 'First' : stage.trimester === 2 ? 'Second' : 'Third'} Trimester
              {' · '}
              {stage.isOverdue
                ? '🎉 Past due date — speak with your healthcare provider'
                : `${stage.weeksRemaining} weeks to go`}
            </p>
          </div>
          <div className="text-5xl">{MONTH_EMOJIS[stage.month - 1]}</div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Week 1</span>
            <span>{Math.min(Math.round((stage.week / 40) * 100), 100)}% complete</span>
            <span>Week 40</span>
          </div>
          <div className="h-2.5 bg-white/60 dark:bg-black/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${TRIMESTER_COLORS[stage.trimester]} transition-all duration-700`}
              style={{ width: `${Math.min((stage.week / 40) * 100, 100)}%` }}
            />
          </div>
          {/* Trimester markers */}
          <div className="flex justify-between text-[10px] text-text-muted mt-1 px-0.5">
            <span>T1</span>
            <span style={{ marginLeft: '30%' }}>T2</span>
            <span style={{ marginLeft: '19%' }}>T3</span>
            <span>Due</span>
          </div>
        </div>
      </div>

      {/* Month selector */}
      <div>
        <h4 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wide">
          Pregnancy Journey — Month by Month
        </h4>

        {/* Trimester groups */}
        {[1, 2, 3].map(tri => {
          const triMonths = guides.filter(g => g.trimester === tri)
          const triLabel  = tri === 1 ? 'First Trimester (Months 1–3)' : tri === 2 ? 'Second Trimester (Months 4–6)' : 'Third Trimester (Months 7–10)'
          return (
            <div key={tri} className="mb-4">
              <p className={`text-xs font-bold mb-2 px-1 ${
                tri === 1 ? 'text-violet-600 dark:text-violet-400'
                : tri === 2 ? 'text-pink-600 dark:text-pink-400'
                : 'text-orange-600 dark:text-orange-400'
              }`}>
                {triLabel}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {triMonths.map(g => {
                  const isCurrent  = g.month === stage.month
                  const isPast     = g.month < stage.month
                  const isSelected = g.month === selectedMonth
                  return (
                    <button
                      key={g.month}
                      onClick={() => onSelectMonth(g.month)}
                      className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${
                        isSelected
                          ? `border-transparent bg-gradient-to-br ${TRIMESTER_COLORS[tri]} text-white shadow-lg`
                          : isCurrent
                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                          : isPast
                          ? 'border-border bg-surface2 opacity-70'
                          : 'border-border bg-surface2 hover:border-purple-300'
                      }`}
                    >
                      {isCurrent && !isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-surface animate-pulse" />
                      )}
                      <span className="text-xl">{MONTH_EMOJIS[g.month - 1]}</span>
                      <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                        Month {g.month}
                      </span>
                      <span className={`text-[10px] leading-tight ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                        {g.weeks}
                      </span>
                      {isPast && !isCurrent && (
                        <span className="text-[10px] text-success">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
