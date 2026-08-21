import type { AgeStage, AgeStageId, TextureLevel } from '../../types/baby'

interface Props {
  stages: AgeStage[]
  currentStageId: AgeStageId
  selectedStageId: AgeStageId
  ageMonths: number
  ageLabel: string
  onSelectStage: (id: AgeStageId) => void
}

const TEXTURE_STEPS: { level: TextureLevel; label: string; emoji: string }[] = [
  { level: 'milk_only',    label: 'Milk Only',    emoji: '🍼' },
  { level: 'puree',        label: 'Puree',        emoji: '🥣' },
  { level: 'mash',         label: 'Mash',         emoji: '🥄' },
  { level: 'soft_lumps',   label: 'Soft Lumps',   emoji: '🫙' },
  { level: 'finger_foods', label: 'Finger Foods', emoji: '✋' },
  { level: 'family_foods', label: 'Family Foods', emoji: '🍽️' },
]

const STAGE_COLORS: Record<AgeStageId, { glow: string; accent: string; text: string }> = {
  months_0_6:  { glow: 'rgb(56 189 248 / 0.18)',  accent: 'rgb(56 189 248)',  text: 'rgb(125 211 252)' },
  months_6_9:  { glow: 'rgb(32 195 190 / 0.18)',  accent: 'rgb(32 195 190)', text: 'rgb(94 234 212)'  },
  months_9_12: { glow: 'rgb(139 92 246 / 0.18)',  accent: 'rgb(139 92 246)', text: 'rgb(196 181 253)' },
  years_1_2:   { glow: 'rgb(244 114 182 / 0.18)', accent: 'rgb(244 114 182)',text: 'rgb(249 168 212)' },
  years_2_3:   { glow: 'rgb(251 146 60 / 0.18)',  accent: 'rgb(251 146 60)', text: 'rgb(253 186 116)' },
}

export default function BabyAgeTimeline({
  stages, currentStageId, selectedStageId, ageMonths, ageLabel, onSelectStage,
}: Props) {
  const currentStage  = stages.find(s => s.id === currentStageId)!
  const selectedStage = stages.find(s => s.id === selectedStageId)!
  const cc = STAGE_COLORS[currentStageId]
  const progressPct = Math.min(100, Math.round((ageMonths / 36) * 100))

  return (
    <div className="flex flex-col gap-3">

      {/* Current age banner */}
      <div className="g-card p-4 animate-slide-up" style={{
        background: cc.glow,
        borderColor: `${cc.accent}44`,
        boxShadow: `0 4px 24px ${cc.glow}`,
      }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: cc.text, opacity: 0.7 }}>Your baby is</p>
            <h2 className="text-xl font-black text-text-primary">{ageLabel} old</h2>
            <p className="text-xs mt-0.5" style={{ color: cc.text }}>{currentStage.label} stage</p>
          </div>
          <span className="text-4xl select-none">{currentStage.emoji}</span>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-text-muted mb-1">
            <span>Birth</span>
            <span>{progressPct}% of first 3 years</span>
            <span>3 yrs</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(255 255 255 / 0.1)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: cc.accent }} />
          </div>
        </div>
      </div>

      {/* Stage selector */}
      <div className="g-card p-3 flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Select Age Stage</p>
        <div className="flex flex-col gap-1.5">
          {stages.map(stage => {
            const sc = STAGE_COLORS[stage.id]
            const isCurrent  = stage.id === currentStageId
            const isSelected = stage.id === selectedStageId
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                style={isSelected ? {
                  background: `${sc.glow}`,
                  border: `1px solid ${sc.accent}55`,
                  boxShadow: `0 2px 12px ${sc.glow}`,
                } : {
                  background: 'rgb(255 255 255 / 0.03)',
                  border: '1px solid rgb(255 255 255 / 0.07)',
                }}
              >
                {isCurrent && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-bg"
                    style={{ background: sc.accent, animation: 'pulse 2s infinite' }} />
                )}
                <span className="text-xl flex-shrink-0">{stage.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-text-primary">
                    {stage.label}
                    {isCurrent && <span className="ml-1.5 text-[10px] font-normal text-text-muted">← current</span>}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 truncate">
                    {stage.primaryFeedingMode === 'milk_only' ? 'Breast milk / formula only'
                      : stage.primaryFeedingMode === 'milk_plus_solids' ? 'Milk + complementary solids'
                      : stage.primaryFeedingMode === 'solids_plus_milk' ? 'Solids + milk drinks'
                      : 'Family foods'}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: isSelected ? sc.text : 'rgb(var(--text-muted))' }}>
                  {isSelected ? '✓' : '›'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Texture progression */}
      <div className="g-card p-3 flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Texture Progression</p>
        <div className="flex flex-col gap-1">
          {TEXTURE_STEPS.map((step, i) => {
            const isNow  = step.level === selectedStage.texture
            const isPast = TEXTURE_STEPS.findIndex(s => s.level === selectedStage.texture) > i
            return (
              <div key={step.level} className="flex items-center gap-2">
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all"
                    style={isNow ? {
                      background: 'linear-gradient(135deg, rgb(32 195 190), rgb(56 189 248))',
                      color: 'white',
                      boxShadow: '0 2px 8px rgb(32 195 190 / 0.4)',
                    } : isPast ? {
                      background: 'rgb(16 185 129 / 0.2)',
                      border: '1px solid rgb(16 185 129 / 0.35)',
                      color: 'rgb(110 231 183)',
                    } : {
                      background: 'rgb(255 255 255 / 0.04)',
                      border: '1px solid rgb(255 255 255 / 0.08)',
                      color: 'rgb(var(--text-muted))',
                    }}>
                    {isPast ? '✓' : i + 1}
                  </div>
                  {i < TEXTURE_STEPS.length - 1 && (
                    <div className="w-px h-3 mt-0.5"
                      style={{ background: isPast || isNow ? 'rgb(32 195 190 / 0.4)' : 'rgb(255 255 255 / 0.06)' }} />
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all"
                  style={isNow ? {
                    background: 'rgb(32 195 190 / 0.1)',
                    border: '1px solid rgb(32 195 190 / 0.22)',
                  } : { background: 'transparent' }}>
                  <span className="text-sm">{step.emoji}</span>
                  <span className="text-xs font-semibold" style={{
                    color: isNow ? 'rgb(94 234 212)' : isPast ? 'rgb(var(--text-secondary))' : 'rgb(var(--text-muted))',
                  }}>
                    {step.label}
                    {isNow && <span className="ml-1 text-[9px] opacity-60">← now</span>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
