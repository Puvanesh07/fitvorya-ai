import type { PregnancyStage, MonthlyGuide } from '../../types/pregnancy'

interface Props {
  stage: PregnancyStage
  guides: MonthlyGuide[]
  selectedMonth: number
  onSelectMonth: (m: number) => void
}

const MONTH_EMOJIS = ['🌱','💓','👶','🌟','👁️','👂','🧠','🦴','🤰','🎉']

const TRIM_COLORS: Record<number, { glow: string; accent: string; text: string; label: string }> = {
  1: { glow: 'rgb(139 92 246 / 0.18)',  accent: 'rgb(139 92 246)', text: 'rgb(196 181 253)', label: 'First Trimester'  },
  2: { glow: 'rgb(244 114 182 / 0.18)', accent: 'rgb(244 114 182)',text: 'rgb(249 168 212)', label: 'Second Trimester' },
  3: { glow: 'rgb(251 146 60 / 0.18)',  accent: 'rgb(251 146 60)', text: 'rgb(253 186 116)', label: 'Third Trimester'  },
}

const TRIM_LABEL_COLOR: Record<number, string> = {
  1: 'rgb(196 181 253)', 2: 'rgb(249 168 212)', 3: 'rgb(253 186 116)',
}

export default function PregnancyTimeline({ stage, guides, selectedMonth, onSelectMonth }: Props) {
  const tc  = TRIM_COLORS[stage.trimester]
  const pct = Math.min(Math.round((stage.week / 40) * 100), 100)

  return (
    <div className="g-card p-4 flex flex-col gap-4">

      {/* Current stage banner */}
      <div className="rounded-xl p-4 animate-slide-up" style={{
        background: tc.glow, border: `1px solid ${tc.accent}44`,
        boxShadow: `0 4px 20px ${tc.glow}`,
      }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: tc.text, opacity: 0.7 }}>
              Currently in
            </p>
            <h3 className="text-lg font-black text-text-primary">Week {stage.week} · Month {stage.month}</h3>
            <p className="text-xs mt-0.5" style={{ color: tc.text }}>
              {tc.label}
              {' · '}
              {stage.isOverdue
                ? '🎉 Past due — speak with your provider'
                : `${stage.weeksRemaining} weeks to go`}
            </p>
          </div>
          <span className="text-4xl select-none">{MONTH_EMOJIS[stage.month - 1]}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-text-muted mb-1">
            <span>Wk 1</span>
            <span>{pct}% complete</span>
            <span>Wk 40</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(255 255 255 / 0.12)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: tc.accent }} />
          </div>
          {/* Trimester markers */}
          <div className="flex justify-between text-[9px] text-text-muted mt-1">
            <span>T1</span>
            <span style={{ marginLeft: '28%' }}>T2</span>
            <span style={{ marginLeft: '19%' }}>T3</span>
            <span>Due</span>
          </div>
        </div>
      </div>

      {/* Month selector */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 px-0.5">
          Pregnancy Journey — Month by Month
        </p>

        {[1, 2, 3].map(tri => {
          const triMonths = guides.filter(g => g.trimester === tri)
          const triLabels: Record<number, string> = {
            1: 'First Trimester (1–3)', 2: 'Second Trimester (4–6)', 3: 'Third Trimester (7–10)',
          }
          const tc2 = TRIM_COLORS[tri]
          return (
            <div key={tri} className="mb-4 last:mb-0">
              <p className="text-[10px] font-bold mb-2 px-0.5" style={{ color: TRIM_LABEL_COLOR[tri] }}>
                {triLabels[tri]}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {triMonths.map(g => {
                  const isCurrent  = g.month === stage.month
                  const isPast     = g.month < stage.month
                  const isSelected = g.month === selectedMonth
                  return (
                    <button key={g.month} onClick={() => onSelectMonth(g.month)}
                      className="relative flex flex-col items-center gap-0.5 p-2.5 rounded-xl text-center transition-all"
                      style={isSelected ? {
                        background: tc2.glow,
                        border: `1px solid ${tc2.accent}55`,
                        boxShadow: `0 2px 12px ${tc2.glow}`,
                      } : isCurrent ? {
                        background: `${tc2.accent}12`,
                        border: `1px solid ${tc2.accent}44`,
                      } : {
                        background: 'rgb(255 255 255 / 0.03)',
                        border: '1px solid rgb(255 255 255 / 0.07)',
                        opacity: isPast ? 0.65 : 1,
                      }}>
                      {isCurrent && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-bg"
                          style={{ background: tc2.accent, animation: 'pulse 2s infinite' }} />
                      )}
                      <span className="text-base">{MONTH_EMOJIS[g.month - 1]}</span>
                      <span className="text-[10px] font-black" style={{ color: isSelected ? tc2.text : 'rgb(var(--text-primary))' }}>
                        M{g.month}
                      </span>
                      <span className="text-[9px] leading-tight" style={{ color: isSelected ? tc2.text : 'rgb(var(--text-muted))', opacity: 0.7 }}>
                        {g.weeks}
                      </span>
                      {isPast && !isCurrent && (
                        <span className="text-[9px]" style={{ color: 'rgb(110 231 183)' }}>✓</span>
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
