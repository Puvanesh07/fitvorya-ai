import { useState } from 'react'
import type { FamilyMember, FamilyMeal, CuisinePreference } from '../../types/family'
import { generateFamilyMeal } from '../../data/familyData'

interface Props {
  members: FamilyMember[]
  cuisinePreference: CuisinePreference
}

type MealTime = FamilyMeal['mealTime']

const MEAL_TIMES: { value: MealTime; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.2)'  },
  { value: 'lunch',     label: 'Lunch',     emoji: '☀️', color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.2)'  },
  { value: 'snack',     label: 'Snack',     emoji: '🍎', color: 'rgb(167 139 250)', bg: 'rgb(167 139 250 / 0.08)',border: 'rgb(167 139 250 / 0.2)'},
  { value: 'dinner',    label: 'Dinner',    emoji: '🌙', color: 'rgb(56 189 248)',  bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.2)' },
]

const CUISINE_LABEL: Record<string, string> = {
  tamil: '🇮🇳 Tamil / Indian', global: '🌍 Global', mixed: '✨ Mixed',
}

export default function FamilyMealGenerator({ members, cuisinePreference }: Props) {
  const [selectedTime, setSelectedTime] = useState<MealTime>('dinner')
  const [meal,         setMeal]         = useState<FamilyMeal | null>(null)
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

  function generate() {
    setMeal(generateFamilyMeal(members, selectedTime, cuisinePreference))
    setGenerated(true)
  }

  const meta = MEAL_TIMES.find(t => t.value === selectedTime)!

  return (
    <div className="flex flex-col gap-4">

      {/* Settings card */}
      <div className="g-card p-4 flex flex-col gap-4">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">🍽️ Generate Family Meal</h3>

        {/* Meal time grid */}
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TIMES.map(t => (
            <button key={t.value} onClick={() => setSelectedTime(t.value)}
              className="g-select-btn flex-col items-center justify-center gap-1 py-2.5"
              style={selectedTime === t.value ? { background: t.bg, borderColor: t.border, color: t.color } : {}}>
              <span className="text-lg">{t.emoji}</span>
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Cuisine info row */}
        <div className="g-card-sm px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Cuisine</span>
          <span className="text-xs font-bold text-text-secondary">{CUISINE_LABEL[cuisinePreference]}</span>
          <span className="text-[10px] text-text-muted">Change in Family Settings</span>
        </div>

        <button onClick={generate} className="g-btn g-btn-emerald w-full py-3">
          ✨ {generated ? 'Regenerate Meal' : 'Generate Family Meal'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ <strong>General meal ideas only.</strong> Ensure foods are safe and appropriate for each family member. Consult healthcare providers for medical dietary needs.
      </div>

      {/* Generated meal */}
      {meal && (
        <div className="flex flex-col gap-3 animate-slide-up">

          {/* Base meal */}
          <div className="g-card-sm p-4" style={{ background: meta.bg, borderColor: meta.border }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{meal.baseEmoji}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: meta.color, opacity: 0.8 }}>
                  {meta.label} — Family Base
                </p>
                <h3 className="font-black text-text-primary text-base">{meal.baseName}</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {meal.nutrients.map(n => (
                <span key={n} className="g-badge" style={{ background: `${meta.color}18`, borderColor: `${meta.color}30`, color: meta.color }}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Per-member adaptations */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-0.5">👨‍👩‍👧 Adaptations for Each Member</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {meal.adaptations.map(a => {
                const member = members.find(m => m.id === a.memberId)
                void member // role config available for future use
                return (
                  <div key={a.memberId} className="g-card p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'rgb(16 185 129 / 0.12)', border: '1px solid rgb(16 185 129 / 0.22)' }}>
                        {a.memberEmoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-xs truncate">{a.memberName}</p>
                        <p className="text-[10px] text-text-muted">{a.portion}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{a.description}</p>
                    {a.texture && (
                      <span className="g-badge w-fit capitalize" style={{ background: 'rgb(32 195 190 / 0.1)', borderColor: 'rgb(32 195 190 / 0.22)', color: 'rgb(94 234 212)' }}>
                        Texture: {a.texture.replace(/_/g, ' ')}
                      </span>
                    )}
                    {a.notes && (
                      <p className="text-[10px] text-text-muted italic leading-relaxed">💡 {a.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-center text-[10px] text-text-muted">
            Not happy with this? Tap <strong>Regenerate</strong> for a different suggestion.
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
