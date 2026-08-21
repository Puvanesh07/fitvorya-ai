import { useState } from 'react'
import type { MealPlan, DietType } from '../../types/pregnancy'
import { generateMealPlan } from '../../services/pregnancyService'

interface Props {
  week: number
  dietType: DietType
  tamilPref: boolean
}

type PlanDays  = 1 | 7
type Pref      = 'tamil' | 'global' | 'mixed'

const MEAL_META = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.2)'  },
  lunch:     { emoji: '☀️', label: 'Lunch',     color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.2)'  },
  snack:     { emoji: '🍎', label: 'Snack',     color: 'rgb(196 181 253)', bg: 'rgb(139 92 246 / 0.08)', border: 'rgb(139 92 246 / 0.2)' },
  dinner:    { emoji: '🌙', label: 'Dinner',    color: 'rgb(125 211 252)', bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.2)' },
} as const

export default function PregnancyMealPlanner({ week, dietType, tamilPref }: Props) {
  const [plan,       setPlan]       = useState<MealPlan | null>(null)
  const [planDays,   setPlanDays]   = useState<PlanDays>(7)
  const [preference, setPreference] = useState<Pref>(tamilPref ? 'tamil' : 'mixed')
  const [activeDiet, setActiveDiet] = useState<DietType>(dietType)
  const [activeDay,  setActiveDay]  = useState(0)
  const [generated,  setGenerated]  = useState(false)

  function generate() {
    setPlan(generateMealPlan(week, activeDiet, preference, planDays))
    setActiveDay(0)
    setGenerated(true)
  }

  const currentDay = plan?.days[activeDay]

  return (
    <div className="flex flex-col gap-4">

      {/* Settings card */}
      <div className="g-card p-4 flex flex-col gap-4">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">📅 Personalise Your Meal Plan</h3>

        {/* Duration */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Plan duration</p>
          <div className="flex gap-2">
            {([1, 7] as PlanDays[]).map(d => (
              <button key={d} onClick={() => setPlanDays(d)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={planDays === d ? {
                  background: 'linear-gradient(135deg, rgb(139 92 246), rgb(244 114 182))',
                  color: 'white', border: 'none',
                  boxShadow: '0 2px 12px rgb(139 92 246 / 0.4)',
                } : {
                  background: 'rgb(255 255 255 / 0.04)',
                  border: '1px solid rgb(255 255 255 / 0.08)',
                  color: 'rgb(var(--text-secondary))',
                }}>
                {d === 1 ? '1 Day' : '7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Food style */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Food style</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'tamil',  label: 'Tamil',  emoji: '🍚' },
              { value: 'global', label: 'Global', emoji: '🌍' },
              { value: 'mixed',  label: 'Mixed',  emoji: '✨' },
            ] as { value: Pref; label: string; emoji: string }[]).map(p => (
              <button key={p.value} onClick={() => setPreference(p.value)}
                className="g-select-btn flex-col items-center justify-center gap-1 py-2.5"
                style={preference === p.value ? {
                  background: 'rgb(139 92 246 / 0.18)', borderColor: 'rgb(139 92 246 / 0.45)',
                  color: 'rgb(196 181 253)',
                } : {}}>
                <span className="text-lg">{p.emoji}</span>
                <span className="text-[11px] font-bold">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diet type */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Diet type</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'vegetarian',     label: 'Vegetarian', emoji: '🥬' },
              { value: 'eggetarian',     label: 'Eggetarian', emoji: '🥚' },
              { value: 'non_vegetarian', label: 'Non-Veg',    emoji: '🍗' },
              { value: 'vegan',          label: 'Vegan',      emoji: '🌱' },
            ] as { value: DietType; label: string; emoji: string }[]).map(d => (
              <button key={d.value} onClick={() => setActiveDiet(d.value)}
                className="g-select-btn gap-2"
                style={activeDiet === d.value ? {
                  background: 'rgb(139 92 246 / 0.18)', borderColor: 'rgb(139 92 246 / 0.45)',
                  color: 'rgb(196 181 253)',
                } : {}}>
                <span>{d.emoji}</span>
                <span className="text-xs font-bold">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} className="g-btn g-btn-primary w-full py-3">
          ✨ {generated ? 'Regenerate Meal Plan' : 'Generate My Meal Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ <strong>General meal ideas only.</strong> Portion sizes and specific needs vary. Consult your doctor or dietitian for personalised advice.
      </div>

      {/* Generated plan */}
      {plan && (
        <div className="flex flex-col gap-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-text-primary text-sm">
                {plan.days.length === 1 ? "Today's Meal Plan" : `${plan.days.length}-Day Meal Plan`}
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Week {plan.week} · {plan.dietType.replace('_', '-')} · {plan.preference} style
              </p>
            </div>
            <span className="text-xl">🍽️</span>
          </div>

          {/* Day tabs */}
          {plan.days.length > 1 && (
            <div className="g-tab-bar overflow-x-auto">
              {plan.days.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`g-tab ${activeDay === i ? 'g-tab-active' : ''}`}>
                  {d.dayLabel.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Day meals */}
          {currentDay && (
            <div className="flex flex-col gap-2.5">
              {plan.days.length > 1 && (
                <p className="text-xs font-bold text-text-secondary">{currentDay.dayLabel}</p>
              )}

              {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(key => {
                const meal = currentDay[key]
                const meta = MEAL_META[key]
                return (
                  <div key={key} className="g-card-sm p-3"
                    style={{ background: meta.bg, borderColor: meta.border }}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                          style={{ color: meta.color, opacity: 0.8 }}>{meta.label}</p>
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
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Water reminder */}
              <div className="g-card-sm p-3 flex items-center gap-2.5"
                style={{ background: 'rgb(56 189 248 / 0.08)', borderColor: 'rgb(56 189 248 / 0.2)' }}>
                <span className="text-lg">💧</span>
                <div>
                  <p className="text-xs font-bold text-sky-300">
                    Drink {currentDay.waterLiters}L water today
                  </p>
                  <p className="text-[11px] text-sky-400/70">
                    ~{Math.round(currentDay.waterLiters * 4)} glasses. Coconut water counts!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Week overview */}
          {plan.days.length > 1 && (
            <details className="g-card p-3">
              <summary className="cursor-pointer text-xs font-bold text-text-secondary flex items-center gap-2 select-none list-none">
                <span>📋</span> Full week overview
                <span className="ml-auto text-[10px] text-text-muted">tap to expand</span>
              </summary>
              <div className="mt-3 flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
                {plan.days.map((day, i) => (
                  <div key={i} className="pb-2 last:pb-0" style={{ borderBottom: '1px solid rgb(255 255 255 / 0.05)' }}>
                    <p className="text-[10px] font-black text-text-primary mb-1">{day.dayLabel}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(k => (
                        <div key={k} className="flex gap-1 items-start">
                          <span className="text-[10px]">{MEAL_META[k].emoji}</span>
                          <p className="text-[10px] text-text-muted leading-tight truncate">{day[k].name}</p>
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
          <h3 className="font-black text-text-primary text-sm">Ready to generate your plan</h3>
          <p className="text-xs text-text-muted">Choose your preferences above and tap Generate.</p>
        </div>
      )}
    </div>
  )
}
