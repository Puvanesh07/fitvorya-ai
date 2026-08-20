import { useState } from 'react'
import type { FamilyMember, FamilyWeekPlan, FamilyDayPlan, FamilyMeal, CuisinePreference } from '../../types/family'
import { generateFamilyWeekPlan, generateFamilyMeal } from '../../data/familyData'

interface Props {
  members: FamilyMember[]
  cuisinePreference: CuisinePreference
}

const MEAL_KEYS: (keyof FamilyDayPlan)[] = ['breakfast','lunch','snack','dinner']
const MEAL_META: Record<string, { emoji: string; label: string; bg: string }> = {
  breakfast: { emoji:'🌅', label:'Breakfast', bg:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  lunch:     { emoji:'☀️', label:'Lunch',     bg:'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' },
  snack:     { emoji:'🍎', label:'Snack',     bg:'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' },
  dinner:    { emoji:'🌙', label:'Dinner',    bg:'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' },
}

export default function FamilyWeeklyPlanner({ members, cuisinePreference }: Props) {
  const [plan,      setPlan]      = useState<FamilyWeekPlan | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [generated, setGenerated] = useState(false)

  if (members.length === 0) {
    return (
      <div className="card card-shadow text-center py-12">
        <p className="text-4xl mb-3">📅</p>
        <p className="font-bold text-text-primary mb-1">Add family members first</p>
        <p className="text-sm text-text-secondary">Weekly plan requires at least one family member.</p>
      </div>
    )
  }

  function generatePlan() {
    const p = generateFamilyWeekPlan(members, cuisinePreference)
    setPlan(p)
    setActiveDay(0)
    setGenerated(true)
  }

  function regenerateDay(dayIdx: number) {
    if (!plan) return
    const newDay: FamilyDayPlan = {
      dayLabel:  plan.days[dayIdx].dayLabel,
      breakfast: generateFamilyMeal(members, 'breakfast', cuisinePreference),
      lunch:     generateFamilyMeal(members, 'lunch',     cuisinePreference),
      snack:     generateFamilyMeal(members, 'snack',     cuisinePreference),
      dinner:    generateFamilyMeal(members, 'dinner',    cuisinePreference),
    }
    setPlan(prev => {
      if (!prev) return prev
      const days = [...prev.days]
      days[dayIdx] = newDay
      return { ...prev, days }
    })
  }

  function regenerateMeal(dayIdx: number, mealKey: keyof FamilyDayPlan) {
    if (!plan || mealKey === 'dayLabel') return
    const newMeal = generateFamilyMeal(members, mealKey as FamilyMeal['mealTime'], cuisinePreference)
    setPlan(prev => {
      if (!prev) return prev
      const days = [...prev.days]
      days[dayIdx] = { ...days[dayIdx], [mealKey]: newMeal }
      return { ...prev, days }
    })
  }

  const currentDay = plan?.days[activeDay]

  return (
    <div className="flex flex-col gap-5">

      {/* Generate button */}
      <div className="card card-shadow flex flex-col gap-3">
        <h3 className="font-black text-text-primary flex items-center gap-2"><span>📅</span> 7-Day Family Meal Plan</h3>
        <p className="text-sm text-text-secondary">
          Generates a full week of meals adapted for every family member — from adults to babies.
        </p>
        <div className="flex items-center gap-2 p-3 bg-surface2 rounded-2xl border border-border">
          <span className="text-sm text-text-secondary">Cuisine:</span>
          <span className="font-semibold text-sm capitalize">
            {cuisinePreference === 'tamil' ? '🇮🇳 Tamil / Indian' : cuisinePreference === 'global' ? '🌍 Global' : '✨ Mixed'}
          </span>
        </div>
        <button
          onClick={generatePlan}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span>✨</span> {generated ? 'Regenerate Full Week' : 'Generate 7-Day Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          ⚠️ General meal ideas only. Ensure all foods are appropriate for each family member's age and health. Consult your healthcare provider for personalised dietary advice.
        </p>
      </div>

      {plan && (
        <div className="flex flex-col gap-4 animate-fade-up">

          {/* Day tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {plan.days.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl text-xs font-bold transition-all min-w-[52px] ${
                  activeDay === i
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'bg-surface border border-border text-text-secondary hover:border-emerald-300 card-shadow'
                }`}
              >
                <span>{d.dayLabel.slice(0,3)}</span>
              </button>
            ))}
          </div>

          {/* Current day */}
          {currentDay && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-text-primary text-lg">{currentDay.dayLabel}</h4>
                <button
                  onClick={() => regenerateDay(activeDay)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface2 border border-border text-xs font-semibold text-text-secondary hover:border-emerald-400 hover:text-emerald-600 transition-all"
                >
                  🔄 Regenerate day
                </button>
              </div>

              {MEAL_KEYS.map(key => {
                const meal = currentDay[key] as FamilyMeal
                const meta = MEAL_META[key as string]
                return (
                  <div key={key} className={`rounded-2xl border p-4 ${meta.bg}`}>
                    {/* Meal header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">{meta.label}</p>
                          <p className="font-bold text-text-primary text-sm">{meal.baseName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => regenerateMeal(activeDay, key)}
                        className="text-xs text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
                        title="Regenerate this meal"
                      >🔄</button>
                    </div>

                    {/* Adaptations — collapsed by default, expandable */}
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors select-none">
                        👨‍👩‍👧 Show adaptations ({meal.adaptations.length})
                      </summary>
                      <div className="mt-3 flex flex-col gap-2">
                        {meal.adaptations.map(a => (
                          <div key={a.memberId} className="flex gap-2 p-2.5 bg-white/50 dark:bg-black/10 rounded-xl">
                            <span className="text-lg flex-shrink-0">{a.memberEmoji}</span>
                            <div>
                              <p className="text-xs font-bold text-text-primary">{a.memberName} — {a.portion}</p>
                              <p className="text-xs text-text-secondary">{a.description}</p>
                              {a.notes && <p className="text-[10px] text-text-muted mt-0.5 italic">💡 {a.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )
              })}
            </div>
          )}

          {/* Week overview condensed */}
          <details className="card card-shadow">
            <summary className="cursor-pointer font-bold text-text-primary text-sm flex items-center gap-2 select-none">
              <span>📋</span> Full week overview
              <span className="ml-auto text-text-muted text-xs">tap to expand</span>
            </summary>
            <div className="mt-4 flex flex-col gap-3">
              {plan.days.map((day, i) => (
                <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <p className="text-xs font-black text-text-primary mb-1.5">{day.dayLabel}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {MEAL_KEYS.map(k => (
                      <div key={k} className="flex gap-1.5 items-start">
                        <span className="text-xs">{MEAL_META[k as string].emoji}</span>
                        <p className="text-xs text-text-secondary leading-tight">{(day[k] as FamilyMeal).baseName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {!generated && (
        <div className="card card-shadow text-center py-10">
          <p className="text-5xl mb-3">📅</p>
          <p className="font-black text-text-primary mb-1">Ready to generate your family plan</p>
          <p className="text-sm text-text-secondary">Tap the button above to create a 7-day personalised family meal plan.</p>
        </div>
      )}
    </div>
  )
}
