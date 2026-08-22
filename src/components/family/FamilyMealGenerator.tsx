// ── Family Meal Generator — powered by real food data ─────────────────────────
import { useState } from 'react'
import type { FamilyMember, CuisinePreference } from '../../types/family'
import {
  regenerateFamilyMeal,
  type FamilyMealSlot,
  type FamilyMember as EngineMember,
} from '../../services/mealPlanEngine'

interface Props {
  members:           FamilyMember[]
  cuisinePreference: CuisinePreference
}

type SlotKey = 'breakfast' | 'lunch' | 'snack' | 'dinner'

const MEAL_TIMES: { value: SlotKey; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.22)'  },
  { value: 'lunch',     label: 'Lunch',     emoji: '☀️', color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.22)'  },
  { value: 'snack',     label: 'Snack',     emoji: '🍎', color: 'rgb(167 139 250)', bg: 'rgb(167 139 250 / 0.08)',border: 'rgb(167 139 250 / 0.22)'},
  { value: 'dinner',    label: 'Dinner',    emoji: '🌙', color: 'rgb(56 189 248)',  bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.22)' },
]

const CUISINE_LABEL: Record<string, string> = {
  tamil: '🇮🇳 Tamil / Indian', global: '🌍 Global', mixed: '✨ Mixed',
}

function toEngineMembers(members: FamilyMember[]): EngineMember[] {
  return members.map(m => ({
    id:            m.id,
    name:          m.name,
    role:          m.role,
    dietPref:      m.dietPref,
    ageMonths:     m.ageMonths,
    pregnancyWeek: m.pregnancyWeek,
  }))
}

export default function FamilyMealGenerator({ members, cuisinePreference }: Props) {
  const [selectedTime, setSelectedTime] = useState<SlotKey>('dinner')
  const [meal,         setMeal]         = useState<FamilyMealSlot | null>(null)
  const [generated,    setGenerated]    = useState(false)

  if (members.length === 0) {
    return (
      <div className="g-card p-10 text-center flex flex-col items-center gap-3">
        <p className="text-4xl">👨‍👩‍👧</p>
        <p className="font-bold text-text-primary text-sm">No family members yet</p>
        <p className="text-xs text-text-muted">Add family members first, then generate meals adapted for everyone.</p>
      </div>
    )
  }

  const engineMembers = toEngineMembers(members)

  function generate() {
    const last = meal?.base.name ? [meal.base.name] : []
    setMeal(regenerateFamilyMeal(selectedTime, engineMembers, cuisinePreference, last))
    setGenerated(true)
  }

  const meta = MEAL_TIMES.find(t => t.value === selectedTime)!

  return (
    <div className="flex flex-col gap-4">

      {/* Settings card */}
      <div className="g-card p-4 flex flex-col gap-4">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">🍽️ Generate Family Meal</h3>

        <div className="grid grid-cols-4 gap-2">
          {MEAL_TIMES.map(t => (
            <button key={t.value} type="button" onClick={() => setSelectedTime(t.value)}
              className="g-select-btn flex-col items-center justify-center gap-1 py-2.5"
              style={selectedTime === t.value ? { background: t.bg, borderColor: t.border, color: t.color } : {}}>
              <span className="text-lg">{t.emoji}</span>
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="g-card-sm px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Cuisine</span>
          <span className="text-xs font-bold text-text-secondary">{CUISINE_LABEL[cuisinePreference]}</span>
        </div>

        <button type="button" onClick={generate} className="g-btn g-btn-emerald w-full py-3">
          ✨ {generated ? 'Regenerate Meal' : 'Generate Family Meal'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ <strong>General meal ideas only.</strong> All nutrition values come from a real food database.
        Ensure foods are appropriate for each member.
      </div>

      {/* Generated meal */}
      {meal && (
        <div className="flex flex-col gap-3 animate-slide-up">

          {/* Base meal card */}
          <div className="g-card-sm p-4" style={{ background: meta.bg, borderColor: meta.border }}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl flex-shrink-0">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: meta.color, opacity: 0.8 }}>
                  {meta.label} — Family Base
                </p>
                <h3 className="font-black text-text-primary text-base leading-tight">{meal.base.name}</h3>
                {/* Macros */}
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <span className="text-sm font-black" style={{ color: meta.color }}>{meal.base.totalCalories} kcal</span>
                  <span className="text-[11px] text-emerald-400">P {meal.base.totalProtein}g</span>
                  <span className="text-[11px] text-yellow-400">C {meal.base.totalCarbs}g</span>
                  <span className="text-[11px] text-orange-400">F {meal.base.totalFat}g</span>
                </div>
              </div>
            </div>

            {/* Food items */}
            <div className="flex flex-col gap-1.5 mb-3">
              {meal.base.foods.map(({ food, grams }, i) => {
                const cal = Math.round(food.calories * grams / 100)
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'rgb(255 255 255 / 0.05)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{food.name}</p>
                      <p className="text-[10px] text-text-muted">{grams}g{food.servingUnit ? ` · ${food.servingUnit}` : ''}</p>
                    </div>
                    <p className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: meta.color }}>{cal} kcal</p>
                  </div>
                )
              })}
            </div>

            {/* Nutrient badges */}
            <div className="flex flex-wrap gap-1.5">
              {meal.base.nutrients.map(n => (
                <span key={n} className="g-badge"
                  style={{ background: `${meta.color}18`, borderColor: `${meta.color}30`, color: meta.color }}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Per-member adaptations */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-0.5">
              👨‍👩‍👧 Adaptations for Each Member
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {meal.adaptations.map(a => (
                <div key={a.memberId} className="g-card p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: 'rgb(16 185 129 / 0.12)', border: '1px solid rgb(16 185 129 / 0.22)' }}>
                      {a.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary text-xs truncate">{a.memberName}</p>
                      <p className="text-[10px] text-text-muted">{a.portion}</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{a.note}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-text-muted">
            Not happy? Tap <strong>Regenerate</strong> for a different suggestion.
          </p>
        </div>
      )}

      {!generated && (
        <div className="g-card p-8 text-center flex flex-col items-center gap-2">
          <p className="text-4xl">🍽️</p>
          <p className="font-black text-text-primary text-sm">Ready to generate</p>
          <p className="text-xs text-text-muted">Select a meal time and tap Generate.</p>
        </div>
      )}
    </div>
  )
}
