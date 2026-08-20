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
  { level: 'milk_only',    label: 'Milk Only',     emoji: '🍼' },
  { level: 'puree',        label: 'Puree',         emoji: '🥣' },
  { level: 'mash',         label: 'Mash',          emoji: '🥄' },
  { level: 'soft_lumps',   label: 'Soft Lumps',    emoji: '🫙' },
  { level: 'finger_foods', label: 'Finger Foods',  emoji: '✋' },
  { level: 'family_foods', label: 'Family Foods',  emoji: '🍽️' },
]

const STAGE_COLORS: Record<AgeStageId, { grad: string; light: string; border: string; text: string }> = {
  months_0_6:  { grad: 'from-blue-400 to-cyan-400',   light: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-700',   text: 'text-blue-700 dark:text-blue-300' },
  months_6_9:  { grad: 'from-teal-400 to-green-400',  light: 'bg-teal-50 dark:bg-teal-900/20',   border: 'border-teal-200 dark:border-teal-700',   text: 'text-teal-700 dark:text-teal-300' },
  months_9_12: { grad: 'from-purple-400 to-violet-400',light: 'bg-purple-50 dark:bg-purple-900/20',border: 'border-purple-200 dark:border-purple-700',text: 'text-purple-700 dark:text-purple-300'},
  years_1_2:   { grad: 'from-pink-400 to-rose-400',   light: 'bg-pink-50 dark:bg-pink-900/20',   border: 'border-pink-200 dark:border-pink-700',   text: 'text-pink-700 dark:text-pink-300' },
  years_2_3:   { grad: 'from-orange-400 to-amber-400',light: 'bg-orange-50 dark:bg-orange-900/20',border: 'border-orange-200 dark:border-orange-700',text: 'text-orange-700 dark:text-orange-300'},
}

export default function BabyAgeTimeline({
  stages, currentStageId, selectedStageId, ageMonths, ageLabel, onSelectStage,
}: Props) {
  const currentStage  = stages.find(s => s.id === currentStageId)!
  const selectedStage = stages.find(s => s.id === selectedStageId)!
  const currentColors = STAGE_COLORS[currentStageId]

  // Progress within 0–36 months
  const progressPct = Math.min(100, Math.round((ageMonths / 36) * 100))

  return (
    <div className="flex flex-col gap-4">

      {/* Current age banner */}
      <div className={`rounded-3xl bg-gradient-to-br ${currentColors.grad} p-5 text-white card-shadow`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Your baby is</p>
            <h2 className="text-2xl font-black">{ageLabel} old</h2>
            <p className="text-white/80 text-sm mt-0.5">{currentStage.label} stage</p>
          </div>
          <span className="text-5xl select-none">{currentStage.emoji}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-white/60 text-xs mb-1">
            <span>Birth</span>
            <span>{progressPct}% of first 3 years</span>
            <span>3 Years</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage selector */}
      <div className="card card-shadow flex flex-col gap-3">
        <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide">
          Select Age Stage
        </h4>
        <div className="flex flex-col gap-2">
          {stages.map(stage => {
            const colors    = STAGE_COLORS[stage.id]
            const isCurrent  = stage.id === currentStageId
            const isSelected = stage.id === selectedStageId
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? `bg-gradient-to-r ${colors.grad} text-white border-transparent shadow-md`
                    : `${colors.light} ${colors.border} hover:shadow-sm`
                }`}
              >
                {isCurrent && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-surface animate-pulse" />
                )}
                <span className="text-2xl flex-shrink-0">{stage.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${isSelected ? 'text-white' : colors.text}`}>
                    {stage.label}
                    {isCurrent && <span className="ml-2 text-xs font-normal opacity-80">← current</span>}
                  </p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-text-muted'}`}>
                    {stage.primaryFeedingMode === 'milk_only'
                      ? 'Breast milk / formula only'
                      : stage.primaryFeedingMode === 'milk_plus_solids'
                      ? 'Milk + complementary solids'
                      : stage.primaryFeedingMode === 'solids_plus_milk'
                      ? 'Solids + milk drinks'
                      : 'Family foods'}
                  </p>
                </div>
                <span className={`text-sm ${isSelected ? 'text-white' : 'text-text-muted'}`}>
                  {isSelected ? '✓' : '›'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Texture progression */}
      <div className="card card-shadow flex flex-col gap-3">
        <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide">
          Texture Progression Guide
        </h4>
        <div className="flex flex-col gap-1.5">
          {TEXTURE_STEPS.map((step, i) => {
            const isCurrentTexture = step.level === selectedStage.texture
            const isPast = TEXTURE_STEPS.findIndex(s => s.level === selectedStage.texture) > i
            return (
              <div key={step.level} className="flex items-center gap-3">
                {/* Line connector */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 24 }}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrentTexture
                      ? 'bg-gradient-to-br from-teal-400 to-blue-500 text-white shadow-md'
                      : isPast
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-300 dark:border-green-700'
                      : 'bg-surface2 text-text-muted border border-border'
                  }`}>
                    {isPast ? '✓' : i + 1}
                  </div>
                  {i < TEXTURE_STEPS.length - 1 && (
                    <div className={`w-0.5 h-4 mt-0.5 ${isPast || isCurrentTexture ? 'bg-teal-300 dark:bg-teal-700' : 'bg-border'}`} />
                  )}
                </div>
                <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  isCurrentTexture
                    ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700'
                    : 'bg-surface2'
                }`}>
                  <span className="text-base">{step.emoji}</span>
                  <span className={`text-sm font-semibold ${
                    isCurrentTexture ? 'text-teal-700 dark:text-teal-300' : isPast ? 'text-text-secondary' : 'text-text-muted'
                  }`}>
                    {step.label}
                    {isCurrentTexture && <span className="ml-1 text-xs font-normal opacity-70">← now</span>}
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
