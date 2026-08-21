import { useState } from 'react'
import type { BabyMealPlan, AgeStageId, BabyDietType } from '../../types/baby'
import { generateBabyMealPlan } from '../../data/babyData'

interface Props {
  stageId: AgeStageId
  dietType: BabyDietType
  tamilPref: boolean
  ageMonths?: number
}

type PlanDays = 1 | 7
type Pref     = 'tamil' | 'global' | 'mixed'

const MEAL_ICONS = {
  breakfast:    { emoji: '🌅', label: 'Breakfast',     color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.18)'  },
  morningSnack: { emoji: '🍎', label: 'Morning Snack', color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.18)'  },
  lunch:        { emoji: '☀️', label: 'Lunch',         color: 'rgb(56 189 248)',  bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.18)' },
  eveningSnack: { emoji: '🌆', label: 'Evening Snack', color: 'rgb(167 139 250)', bg: 'rgb(167 139 250 / 0.08)',border: 'rgb(167 139 250 / 0.18)'},
  dinner:       { emoji: '🌙', label: 'Dinner',        color: 'rgb(129 140 248)', bg: 'rgb(129 140 248 / 0.08)',border: 'rgb(129 140 248 / 0.18)'},
} as const

export default function BabyMealPlanner({ stageId, dietType, tamilPref }: Props) {
  const [plan,       setPlan]       = useState<BabyMealPlan | null>(null)
  const [planDays,   setPlanDays]   = useState<PlanDays>(7)
  const [preference, setPreference] = useState<Pref>(tamilPref ? 'tamil' : 'mixed')
  const [activeDiet, setActiveDiet] = useState<BabyDietType>(dietType)
  const [activeDay,  setActiveDay]  = useState(0)
  const [generated,  setGenerated]  = useState(false)

  const isMilkOnly = stageId === 'months_0_6'

  function generate() {
    const p = generateBabyMealPlan(stageId, activeDiet, preference, planDays)
    setPlan(p); setActiveDay(0); setGenerated(true)
  }

  if (isMilkOnly) {
    return (
      <div className="g-card p-8 text-center flex flex-col items-center gap-3">
        <span className="text-4xl">🍼</span>
        <h3 className="font-black text-text-primary text-base">Milk is complete nutrition at this stage</h3>
        <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
          For babies under 6 months, breast milk or formula provides all the nutrition needed.
          Meal plans activate when your baby is ready for solids (around 6 months).
        </p>
        <div className="g-disclaimer w-full max-w-sm text-left mt-1">
          ⚠️ Always discuss starting solids with your paediatrician.
        </div>
      </div>
    )
  }

  const currentDay = plan?.days[activeDay]

  return (
    <div className="flex flex-col gap-4">

      {/* Settings card */}
      <div className="g-card p-4 flex flex-col gap-4">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">📅 Plan Settings</h3>

        {/* Duration */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Duration</p>
          <div className="flex gap-2">
            {([1, 7] as PlanDays[]).map(d => (
              <button key={d} onClick={() => setPlanDays(d)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${planDays === d ? 'g-tab-active-teal' : 'g-select-btn justify-center'}`}
                style={planDays === d ? {
                  background: 'linear-gradient(135deg, rgb(32 195 190), rgb(56 189 248))',
                  color: 'white', border: 'none',
                  boxShadow: '0 2px 12px rgb(32 195 190 / 0.4)',
                } : {}}>
                {d === 1 ? '1 Day' : '7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Food style */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Food style</p>
          <div className="grid grid-cols-3 gap-2">
            {([{ value: 'tamil', label: 'Tamil', emoji: '🍚' }, { value: 'global', label: 'Global', emoji: '🌍' }, { value: 'mixed', label: 'Mixed', emoji: '✨' }] as { value: Pref; label: string; emoji: string }[]).map(p => (
              <button key={p.value} onClick={() => setPreference(p.value)}
                className="g-select-btn flex-col items-center justify-center gap-1 py-2.5"
                style={preference === p.value ? { background: 'rgb(32 195 190 / 0.15)', borderColor: 'rgb(32 195 190 / 0.4)', color: 'rgb(94 234 212)' } : {}}>
                <span className="text-lg">{p.emoji}</span>
                <span className="text-[11px] font-bold">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diet */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Diet type</p>
          <div className="grid grid-cols-3 gap-2">
            {([{ value: 'vegetarian', label: 'Veg', emoji: '🥬' }, { value: 'non_vegetarian', label: 'Non-Veg', emoji: '🍗' }, { value: 'vegan', label: 'Vegan', emoji: '🌱' }] as { value: BabyDietType; label: string; emoji: string }[]).map(d => (
              <button key={d.value} onClick={() => setActiveDiet(d.value)}
                className="g-select-btn justify-center gap-1.5"
                style={activeDiet === d.value ? { background: 'rgb(32 195 190 / 0.15)', borderColor: 'rgb(32 195 190 / 0.4)', color: 'rgb(94 234 212)' } : {}}>
                <span>{d.emoji}</span><span className="text-[11px]">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} className="g-btn g-btn-teal w-full py-3">
          ✨ {generated ? 'Regenerate Plan' : 'Generate Meal Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ <strong>General meal ideas only.</strong> Always prepare foods in age-appropriate textures. Consult your paediatrician. Never give honey under 12 months.
      </div>

      {/* Generated plan */}
      {plan && plan.days.length > 0 && (
        <div className="flex flex-col gap-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-text-primary text-sm">
                {plan.days.length === 1 ? "Today's Meal Plan" : `${plan.days.length}-Day Meal Plan`}
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5 capitalize">
                {stageId.replace(/_/g, ' ')} · {plan.preference} · {plan.dietType.replace(/_/g, '-')}
              </p>
            </div>
            <span className="text-xl">🍽️</span>
          </div>

          {/* Day tabs */}
          {plan.days.length > 1 && (
            <div className="g-tab-bar overflow-x-auto">
              {plan.days.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`g-tab ${activeDay === i ? 'g-tab-active-teal' : ''}`}>
                  {d.dayLabel.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {currentDay && (
            <div className="flex flex-col gap-2.5">
              {plan.days.length > 1 && (
                <p className="text-xs font-bold text-text-secondary">{currentDay.dayLabel}</p>
              )}

              {(['breakfast', 'morningSnack', 'lunch', 'eveningSnack', 'dinner'] as const).map(key => {
                const meal = currentDay[key]
                if (!meal) return null
                const meta = MEAL_ICONS[key]
                return (
                  <div key={key} className="g-card-sm p-3"
                    style={{ background: meta.bg, borderColor: meta.border }}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: meta.color, opacity: 0.8 }}>{meta.label}</p>
                        <p className="font-bold text-text-primary text-xs">{meal.name}</p>
                        <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{meal.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {meal.nutrients.map(n => (
                            <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: `${meta.color}18`, color: meta.color }}>
                              {n}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-text-muted mt-1 capitalize">Texture: {meal.texture.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Milk feeds */}
              <div className="g-card-sm p-3 flex items-center gap-2.5"
                style={{ background: 'rgb(56 189 248 / 0.08)', borderColor: 'rgb(56 189 248 / 0.2)' }}>
                <span className="text-lg">🍼</span>
                <div>
                  <p className="text-xs font-bold text-sky-300">Milk feeds</p>
                  <p className="text-[11px] text-sky-400/80">{currentDay.milkFeeds}</p>
                </div>
              </div>

              {currentDay.waterNote && (
                <div className="g-card-sm p-3 flex items-center gap-2.5"
                  style={{ background: 'rgb(32 195 190 / 0.08)', borderColor: 'rgb(32 195 190 / 0.18)' }}>
                  <span className="text-lg">💧</span>
                  <p className="text-xs text-teal-300">{currentDay.waterNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Week overview accordion */}
          {plan.days.length > 1 && (
            <details className="g-card p-3">
              <summary className="cursor-pointer text-xs font-bold text-text-secondary flex items-center gap-2 select-none list-none">
                <span>📋</span> Full week overview
                <span className="ml-auto text-text-muted text-[10px]">tap to expand</span>
              </summary>
              <div className="mt-3 flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
                {plan.days.map((day, i) => (
                  <div key={i} className="pb-2 last:pb-0" style={{ borderBottom: '1px solid rgb(255 255 255 / 0.05)' }}>
                    <p className="text-[10px] font-black text-text-primary mb-1">{day.dayLabel}</p>
                    <div className="grid grid-cols-3 gap-1">
                      {(['breakfast', 'lunch', 'dinner'] as const).map(k => day[k] && (
                        <div key={k} className="flex gap-1 items-start">
                          <span className="text-[10px]">{MEAL_ICONS[k].emoji}</span>
                          <p className="text-[10px] text-text-muted leading-tight">{day[k]!.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {!generated && (
        <div className="g-card p-8 text-center flex flex-col items-center gap-2">
          <p className="text-4xl">🍽️</p>
          <h3 className="font-black text-text-primary text-sm">Ready to generate</h3>
          <p className="text-xs text-text-muted">Choose your preferences above and tap Generate.</p>
        </div>
      )}
    </div>
  )
}
