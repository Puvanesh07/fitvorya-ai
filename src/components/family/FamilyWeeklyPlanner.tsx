import { useState } from 'react'
import type { FamilyMember, FamilyWeekPlan, FamilyDayPlan, FamilyMeal, CuisinePreference } from '../../types/family'
import { generateFamilyWeekPlan, generateFamilyMeal } from '../../data/familyData'

interface Props {
  members: FamilyMember[]
  cuisinePreference: CuisinePreference
}

const MEAL_KEYS: (keyof FamilyDayPlan)[] = ['breakfast', 'lunch', 'snack', 'dinner']
const MEAL_META: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.2)'  },
  lunch:     { emoji: '☀️', label: 'Lunch',     color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.2)'  },
  snack:     { emoji: '🍎', label: 'Snack',     color: 'rgb(167 139 250)', bg: 'rgb(167 139 250 / 0.08)',border: 'rgb(167 139 250 / 0.2)'},
  dinner:    { emoji: '🌙', label: 'Dinner',    color: 'rgb(56 189 248)',  bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.2)' },
}

const CUISINE_LABEL: Record<string, string> = {
  tamil: '🇮🇳 Tamil / Indian', global: '🌍 Global', mixed: '✨ Mixed',
}

export default function FamilyWeeklyPlanner({ members, cuisinePreference }: Props) {
  const [plan,      setPlan]      = useState<FamilyWeekPlan | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [generated, setGenerated] = useState(false)

  if (members.length === 0) {
    return (
      <div className="g-card p-10 text-center flex flex-col items-center gap-3">
        <p className="text-4xl">📅</p>
        <p className="font-bold text-text-primary text-sm">Add family members first</p>
        <p className="text-xs text-text-muted">Weekly plan requires at least one family member.</p>
      </div>
    )
  }

  function generatePlan() {
    setPlan(generateFamilyWeekPlan(members, cuisinePreference))
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
      const days = [...prev.days]; days[dayIdx] = newDay
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
    <div className="flex flex-col gap-4">

      {/* Header card */}
      <div className="g-card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">📅 7-Day Family Meal Plan</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          A full week of meals adapted for every family member — from adults to babies.
        </p>
        <div className="g-card-sm px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Cuisine</span>
          <span className="text-xs font-bold text-text-secondary">{CUISINE_LABEL[cuisinePreference]}</span>
        </div>
        <button onClick={generatePlan} className="g-btn g-btn-emerald w-full py-3">
          ✨ {generated ? 'Regenerate Full Week' : 'Generate 7-Day Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ General meal ideas only. Ensure all foods are appropriate for each family member's age and health.
      </div>

      {plan && (
        <div className="flex flex-col gap-3 animate-slide-up">

          {/* Day tabs */}
          <div className="g-tab-bar overflow-x-auto">
            {plan.days.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)}
                className={`g-tab ${activeDay === i ? 'g-tab-active-emerald' : ''}`}>
                {d.dayLabel.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Current day */}
          {currentDay && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-text-primary text-sm">{currentDay.dayLabel}</h4>
                <button onClick={() => regenerateDay(activeDay)}
                  className="g-btn g-btn-sm gap-1">
                  🔄 Regen day
                </button>
              </div>

              {MEAL_KEYS.map(key => {
                const meal = currentDay[key] as FamilyMeal
                const meta = MEAL_META[key as string]
                return (
                  <div key={key} className="g-card-sm p-3" style={{ background: meta.bg, borderColor: meta.border }}>
                    {/* Meal header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.emoji}</span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color, opacity: 0.75 }}>{meta.label}</p>
                          <p className="font-bold text-text-primary text-xs">{meal.baseName}</p>
                        </div>
                      </div>
                      <button onClick={() => regenerateMeal(activeDay, key)}
                        className="text-xs text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
                        title="Regenerate this meal">🔄</button>
                    </div>

                    {/* Adaptations accordion */}
                    <details>
                      <summary className="cursor-pointer text-[11px] font-semibold text-text-muted hover:text-text-secondary transition-colors select-none list-none">
                        👨‍👩‍👧 Show adaptations ({meal.adaptations.length})
                      </summary>
                      <div className="mt-2 flex flex-col gap-1.5 pt-2" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
                        {meal.adaptations.map(a => (
                          <div key={a.memberId} className="flex gap-2 p-2 rounded-lg"
                            style={{ background: 'rgb(255 255 255 / 0.04)' }}>
                            <span className="text-base flex-shrink-0">{a.memberEmoji}</span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-text-primary">{a.memberName} — {a.portion}</p>
                              <p className="text-[11px] text-text-muted leading-relaxed">{a.description}</p>
                              {a.notes && <p className="text-[10px] text-text-muted italic mt-0.5">💡 {a.notes}</p>}
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

          {/* Week overview accordion */}
          <details className="g-card p-3">
            <summary className="cursor-pointer text-xs font-bold text-text-secondary flex items-center gap-2 select-none list-none">
              <span>📋</span> Full week overview
              <span className="ml-auto text-text-muted text-[10px]">tap to expand</span>
            </summary>
            <div className="mt-3 flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
              {plan.days.map((day, i) => (
                <div key={i} className="pb-2 last:pb-0" style={{ borderBottom: '1px solid rgb(255 255 255 / 0.05)' }}>
                  <p className="text-[10px] font-black text-text-primary mb-1">{day.dayLabel}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {MEAL_KEYS.map(k => (
                      <div key={k} className="flex gap-1 items-start">
                        <span className="text-[10px]">{MEAL_META[k as string].emoji}</span>
                        <p className="text-[10px] text-text-muted leading-tight truncate">{(day[k] as FamilyMeal).baseName}</p>
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
        <div className="g-card p-8 text-center flex flex-col items-center gap-2">
          <p className="text-4xl">📅</p>
          <p className="font-black text-text-primary text-sm">Ready to generate your family plan</p>
          <p className="text-xs text-text-muted">Tap the button above to create a 7-day plan.</p>
        </div>
      )}
    </div>
  )
}
