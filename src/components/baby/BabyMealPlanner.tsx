import { useState } from 'react'
import type { BabyMealPlan, AgeStageId, BabyDietType } from '../../types/baby'
import { generateBabyMealPlan } from '../../data/babyData'

interface Props {
  stageId: AgeStageId
  dietType: BabyDietType
  tamilPref: boolean
  ageMonths: number
}

type PlanDays = 1 | 7
type Pref = 'tamil' | 'global' | 'mixed'

const MEAL_ICONS = {
  breakfast:     { emoji: '🌅', label: 'Breakfast',       bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  morningSnack:  { emoji: '🍎', label: 'Morning Snack',   bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' },
  lunch:         { emoji: '☀️', label: 'Lunch',           bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' },
  eveningSnack:  { emoji: '🌆', label: 'Evening Snack',   bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' },
  dinner:        { emoji: '🌙', label: 'Dinner',          bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700' },
} as const

export default function BabyMealPlanner({ stageId, dietType, tamilPref }: Omit<Props, 'ageMonths'> & { ageMonths?: number }) {
  const [plan,       setPlan]       = useState<BabyMealPlan | null>(null)
  const [planDays,   setPlanDays]   = useState<PlanDays>(7)
  const [preference, setPreference] = useState<Pref>(tamilPref ? 'tamil' : 'mixed')
  const [activeDiet, setActiveDiet] = useState<BabyDietType>(dietType)
  const [activeDay,  setActiveDay]  = useState(0)
  const [generated,  setGenerated]  = useState(false)

  const isMilkOnly = stageId === 'months_0_6'

  function generate() {
    const p = generateBabyMealPlan(stageId, activeDiet, preference, planDays)
    setPlan(p)
    setActiveDay(0)
    setGenerated(true)
  }

  if (isMilkOnly) {
    return (
      <div className="card card-shadow text-center py-12 flex flex-col items-center gap-3">
        <span className="text-5xl">🍼</span>
        <h3 className="font-black text-text-primary">Milk is complete nutrition at this stage</h3>
        <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
          For babies under 6 months, breast milk or appropriately prepared infant formula provides all the nutrition needed.
          Solid food meal plans are not appropriate for this stage.
        </p>
        <p className="text-xs text-text-muted mt-2">
          When your baby shows signs of readiness (usually around 6 months), the Meal Planner will activate.
        </p>
        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl max-w-sm">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            ⚠️ Always discuss starting solids with your paediatrician.
          </p>
        </div>
      </div>
    )
  }

  const currentDay = plan?.days[activeDay]

  return (
    <div className="flex flex-col gap-5">

      {/* Config */}
      <div className="card card-shadow flex flex-col gap-4">
        <h3 className="font-black text-text-primary flex items-center gap-2"><span>📅</span> Plan Settings</h3>

        {/* Days */}
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Duration</p>
          <div className="flex gap-2">
            {([1, 7] as PlanDays[]).map(d => (
              <button key={d} onClick={() => setPlanDays(d)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${planDays === d ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white border-transparent shadow-md' : 'border-border bg-surface2 text-text-secondary hover:border-teal-300'}`}>
                {d === 1 ? '1 Day' : '7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Food style */}
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Food style</p>
          <div className="grid grid-cols-3 gap-2">
            {([{ value: 'tamil', label: 'Tamil', emoji: '🍚' }, { value: 'global', label: 'Global', emoji: '🌍' }, { value: 'mixed', label: 'Mixed', emoji: '✨' }] as { value: Pref; label: string; emoji: string }[]).map(p => (
              <button key={p.value} onClick={() => setPreference(p.value)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${preference === p.value ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' : 'border-border bg-surface2 text-text-secondary hover:border-teal-300'}`}>
                <span className="text-lg">{p.emoji}</span><span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diet */}
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Diet type</p>
          <div className="grid grid-cols-3 gap-2">
            {([{ value: 'vegetarian', label: 'Veg', emoji: '🥬' }, { value: 'non_vegetarian', label: 'Non-Veg', emoji: '🍗' }, { value: 'vegan', label: 'Vegan', emoji: '🌱' }] as { value: BabyDietType; label: string; emoji: string }[]).map(d => (
              <button key={d.value} onClick={() => setActiveDiet(d.value)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${activeDiet === d.value ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' : 'border-border bg-surface2 text-text-secondary hover:border-teal-300'}`}>
                <span>{d.emoji}</span><span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-black text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <span>✨</span>{generated ? 'Regenerate Plan' : 'Generate Meal Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          ⚠️ <strong>General meal ideas only.</strong> Always ensure foods are prepared in age-appropriate textures.
          Consult your paediatrician for personalised feeding guidance.
          Never give honey to babies under 12 months.
        </p>
      </div>

      {/* Generated plan */}
      {plan && plan.days.length > 0 && (
        <div className="flex flex-col gap-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-text-primary">{plan.days.length === 1 ? "Today's Meal Plan" : `${plan.days.length}-Day Meal Plan`}</h3>
              <p className="text-xs text-text-secondary mt-0.5 capitalize">{stageId.replace(/_/g,' ')} · {plan.preference} · {plan.dietType.replace(/_/g,'-')}</p>
            </div>
            <span className="text-2xl">🍽️</span>
          </div>

          {/* Day tabs */}
          {plan.days.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {plan.days.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeDay === i ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md' : 'bg-surface2 border border-border text-text-secondary hover:border-teal-300'}`}>
                  {d.dayLabel.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {currentDay && (
            <div className="flex flex-col gap-3">
              {plan.days.length > 1 && <h4 className="font-bold text-text-primary">{currentDay.dayLabel}</h4>}

              {(['breakfast', 'morningSnack', 'lunch', 'eveningSnack', 'dinner'] as const).map(key => {
                const meal = currentDay[key]
                if (!meal) return null
                const meta = MEAL_ICONS[key]
                return (
                  <div key={key} className={`rounded-2xl border p-4 ${meta.bg}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-0.5">{meta.label}</p>
                        <p className="font-bold text-text-primary text-sm">{meal.name}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{meal.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {meal.nutrients.map(n => (
                            <span key={n} className="px-2 py-0.5 bg-white/60 dark:bg-black/20 rounded-full text-[10px] font-semibold text-text-secondary">{n}</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-text-muted mt-1 block capitalize">Texture: {meal.texture.replace(/_/g,' ')}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Milk feeds */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                <span className="text-2xl">🍼</span>
                <div>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Milk feeds</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{currentDay.milkFeeds}</p>
                </div>
              </div>

              {currentDay.waterNote && (
                <div className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 rounded-2xl">
                  <span className="text-2xl">💧</span>
                  <p className="text-sm text-cyan-700 dark:text-cyan-300">{currentDay.waterNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Week overview */}
          {plan.days.length > 1 && (
            <details className="card card-shadow">
              <summary className="cursor-pointer font-bold text-text-primary text-sm flex items-center gap-2 select-none">
                <span>📋</span> Full week overview
                <span className="ml-auto text-text-muted text-xs">tap to expand</span>
              </summary>
              <div className="mt-4 flex flex-col gap-3">
                {plan.days.map((day, i) => (
                  <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <p className="text-xs font-black text-text-primary mb-1">{day.dayLabel}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(['breakfast','lunch','dinner'] as const).map(k => day[k] && (
                        <div key={k} className="flex gap-1 items-start">
                          <span className="text-xs">{MEAL_ICONS[k].emoji}</span>
                          <p className="text-xs text-text-secondary leading-tight">{day[k]!.name}</p>
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
        <div className="text-center py-10 card card-shadow">
          <p className="text-5xl mb-3">🍽️</p>
          <h3 className="font-black text-text-primary mb-1">Ready to generate</h3>
          <p className="text-sm text-text-secondary">Choose your preferences above and tap <strong>Generate Meal Plan</strong>.</p>
        </div>
      )}
    </div>
  )
}
