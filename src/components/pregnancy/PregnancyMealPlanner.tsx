import { useState } from 'react'
import type { MealPlan, DietType } from '../../types/pregnancy'
import { generateMealPlan } from '../../services/pregnancyService'

interface Props {
  week: number
  dietType: DietType
  tamilPref: boolean
}

type PlanDays = 1 | 7
type Preference = 'tamil' | 'global' | 'mixed'

const MEAL_ICONS = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  lunch:     { emoji: '☀️', label: 'Lunch',     color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' },
  snack:     { emoji: '🍎', label: 'Snack',     color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' },
  dinner:    { emoji: '🌙', label: 'Dinner',    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' },
} as const

export default function PregnancyMealPlanner({ week, dietType, tamilPref }: Props) {
  const [plan,       setPlan]       = useState<MealPlan | null>(null)
  const [planDays,   setPlanDays]   = useState<PlanDays>(7)
  const [preference, setPreference] = useState<Preference>(tamilPref ? 'tamil' : 'mixed')
  const [activeDiet, setActiveDiet] = useState<DietType>(dietType)
  const [activeDay,  setActiveDay]  = useState(0)
  const [generated,  setGenerated]  = useState(false)

  function generate() {
    const newPlan = generateMealPlan(week, activeDiet, preference, planDays)
    setPlan(newPlan)
    setActiveDay(0)
    setGenerated(true)
  }

  const currentDay = plan?.days[activeDay]

  return (
    <div className="flex flex-col gap-5">

      {/* Config panel */}
      <div className="card card-shadow flex flex-col gap-4">
        <h3 className="font-black text-text-primary flex items-center gap-2">
          <span>📅</span> Personalise Your Meal Plan
        </h3>

        {/* Days */}
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Plan duration</p>
          <div className="flex gap-2">
            {([1, 7] as PlanDays[]).map(d => (
              <button
                key={d}
                onClick={() => setPlanDays(d)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                  planDays === d
                    ? 'gradient-brand text-white border-transparent shadow-md shadow-purple-500/20'
                    : 'border-border bg-surface2 text-text-secondary hover:border-purple-300'
                }`}
              >
                {d === 1 ? '1 Day' : '7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Food preference */}
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Food style</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'tamil',  label: 'Tamil',  emoji: '🍚' },
              { value: 'global', label: 'Global', emoji: '🌍' },
              { value: 'mixed',  label: 'Mixed',  emoji: '✨' },
            ] as { value: Preference; label: string; emoji: string }[]).map(p => (
              <button
                key={p.value}
                onClick={() => setPreference(p.value)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all ${
                  preference === p.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-border bg-surface2 text-text-secondary hover:border-purple-300'
                }`}
              >
                <span className="text-lg">{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diet type override */}
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Diet type</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'vegetarian',     label: 'Vegetarian',     emoji: '🥬' },
              { value: 'eggetarian',     label: 'Eggetarian',     emoji: '🥚' },
              { value: 'non_vegetarian', label: 'Non-Vegetarian', emoji: '🍗' },
              { value: 'vegan',          label: 'Vegan',          emoji: '🌱' },
            ] as { value: DietType; label: string; emoji: string }[]).map(d => (
              <button
                key={d.value}
                onClick={() => setActiveDiet(d.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                  activeDiet === d.value
                    ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-border bg-surface2 text-text-secondary hover:border-purple-300'
                }`}
              >
                <span>{d.emoji}</span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          className="w-full py-3.5 rounded-2xl gradient-brand text-white font-black text-sm shadow-lg shadow-purple-500/25 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span>✨</span>
          {generated ? 'Regenerate Meal Plan' : 'Generate My Meal Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          ⚠️ These are <strong>general meal ideas</strong> only. Portion sizes and specific needs vary.
          Consult your doctor or registered dietitian for personalised nutrition advice.
        </p>
      </div>

      {/* Generated plan */}
      {plan && (
        <div className="flex flex-col gap-4 animate-fade-up">

          {/* Plan header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-text-primary">
                {plan.days.length === 1 ? "Today's Meal Plan" : `${plan.days.length}-Day Meal Plan`}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Week {plan.week} · {plan.dietType.replace('_', '-')} · {plan.preference} style
              </p>
            </div>
            <span className="text-2xl">🍽️</span>
          </div>

          {/* Day tabs — only for 7-day plan */}
          {plan.days.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {plan.days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeDay === i
                      ? 'gradient-brand text-white shadow-md'
                      : 'bg-surface2 border border-border text-text-secondary hover:border-purple-300'
                  }`}
                >
                  {d.dayLabel.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Day meals */}
          {currentDay && (
            <div className="flex flex-col gap-3">
              {plan.days.length > 1 && (
                <h4 className="font-bold text-text-primary text-base">{currentDay.dayLabel}</h4>
              )}

              {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealKey => {
                const meal = currentDay[mealKey]
                const meta = MEAL_ICONS[mealKey]
                return (
                  <div key={mealKey} className={`rounded-2xl border p-4 ${meta.color}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-0.5">
                          {meta.label}
                        </p>
                        <p className="font-bold text-text-primary text-sm">{meal.name}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{meal.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {meal.nutrients.map(n => (
                            <span key={n} className="px-2 py-0.5 bg-white/60 dark:bg-black/20 rounded-full text-[10px] font-semibold text-text-secondary">
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
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                <span className="text-2xl">💧</span>
                <div>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    Drink {currentDay.waterLiters}L water today
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    That's about {Math.round(currentDay.waterLiters * 4)} glasses. Coconut water counts too!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Full week overview — condensed */}
          {plan.days.length > 1 && (
            <details className="card card-shadow">
              <summary className="cursor-pointer font-bold text-text-primary text-sm flex items-center gap-2 select-none">
                <span>📋</span> View full week overview
                <span className="ml-auto text-text-muted text-xs">tap to expand</span>
              </summary>
              <div className="mt-4 flex flex-col gap-3">
                {plan.days.map((day, i) => (
                  <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <p className="text-xs font-black text-text-primary mb-1.5">{day.dayLabel}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(k => (
                        <div key={k} className="flex gap-1.5 items-start">
                          <span className="text-xs">{MEAL_ICONS[k].emoji}</span>
                          <p className="text-xs text-text-secondary leading-tight">{day[k].name}</p>
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

      {/* Empty state */}
      {!generated && (
        <div className="text-center py-10 card card-shadow">
          <p className="text-5xl mb-3">🍽️</p>
          <h3 className="font-black text-text-primary mb-1">Your Meal Plan is Ready to Generate</h3>
          <p className="text-sm text-text-secondary">
            Choose your preferences above and tap <strong>"Generate My Meal Plan"</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
