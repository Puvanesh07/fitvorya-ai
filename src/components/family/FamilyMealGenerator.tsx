import { useState } from 'react'
import type { FamilyMember, FamilyMeal, CuisinePreference } from '../../types/family'
import { generateFamilyMeal } from '../../data/familyData'
import { ROLE_CONFIG } from '../../data/familyData'

interface Props {
  members: FamilyMember[]
  cuisinePreference: CuisinePreference
}

type MealTime = FamilyMeal['mealTime']
const MEAL_TIMES: { value: MealTime; label: string; emoji: string; bg: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
  { value: 'lunch',     label: 'Lunch',     emoji: '☀️', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' },
  { value: 'snack',     label: 'Snack',     emoji: '🍎', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' },
  { value: 'dinner',    label: 'Dinner',    emoji: '🌙', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' },
]

export default function FamilyMealGenerator({ members, cuisinePreference }: Props) {
  const [selectedTime, setSelectedTime] = useState<MealTime>('dinner')
  const [meal,         setMeal]         = useState<FamilyMeal | null>(null)
  const [generated,    setGenerated]    = useState(false)

  if (members.length === 0) {
    return (
      <div className="card card-shadow text-center py-12">
        <p className="text-4xl mb-3">👨‍👩‍👧</p>
        <p className="font-bold text-text-primary mb-1">No family members yet</p>
        <p className="text-sm text-text-secondary">Add family members first, then generate meals adapted for everyone.</p>
      </div>
    )
  }

  function generate() {
    const m = generateFamilyMeal(members, selectedTime, cuisinePreference)
    setMeal(m)
    setGenerated(true)
  }

  const currentMealMeta = MEAL_TIMES.find(t => t.value === selectedTime)!

  return (
    <div className="flex flex-col gap-5">

      {/* Meal time selector */}
      <div className="card card-shadow flex flex-col gap-3">
        <h3 className="font-black text-text-primary flex items-center gap-2"><span>🍽️</span> Generate Family Meal</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MEAL_TIMES.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedTime(t.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                selectedTime === t.value
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-transparent shadow-md'
                  : 'border-border bg-surface2 text-text-secondary hover:border-emerald-300'
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 bg-surface2 rounded-2xl border border-border">
          <span className="text-sm text-text-secondary">Cuisine:</span>
          <span className="font-semibold text-text-primary capitalize text-sm">
            {cuisinePreference === 'tamil' ? '🇮🇳 Tamil / Indian' : cuisinePreference === 'global' ? '🌍 Global' : '✨ Mixed'}
          </span>
          <span className="text-xs text-text-muted ml-auto">Change in Family Settings</span>
        </div>

        <button
          onClick={generate}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span>✨</span> {generated ? 'Regenerate Meal' : 'Generate Family Meal'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          ⚠️ <strong>General meal ideas only.</strong> Each member's adaptation is based on their profile.
          Always ensure foods are appropriate and safe for each family member. Consult healthcare providers for medical dietary needs.
        </p>
      </div>

      {/* Generated meal */}
      {meal && (
        <div className="flex flex-col gap-4 animate-fade-up">

          {/* Base meal card */}
          <div className={`rounded-3xl border p-5 ${currentMealMeta.bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{meal.baseEmoji}</span>
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">{currentMealMeta.label} — Family Base</p>
                <h3 className="font-black text-text-primary text-lg">{meal.baseName}</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {meal.nutrients.map(n => (
                <span key={n} className="px-2.5 py-1 bg-white/60 dark:bg-black/20 rounded-full text-xs font-semibold text-text-secondary">{n}</span>
              ))}
            </div>
          </div>

          {/* Per-member adaptations */}
          <div>
            <h4 className="font-bold text-text-primary mb-3 flex items-center gap-2">
              <span>👨‍👩‍👧</span> Adaptations for Each Member
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meal.adaptations.map(a => {
                const member = members.find(m => m.id === a.memberId)
                const cfg = member ? ROLE_CONFIG[member.role] : null
                return (
                  <div key={a.memberId} className="card card-shadow p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cfg ? `bg-gradient-to-br ${cfg.color}` : 'bg-surface2'}`}>
                        {a.memberEmoji}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm">{a.memberName}</p>
                        <p className="text-xs text-text-muted">{a.portion}</p>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{a.description}</p>
                    {a.texture && (
                      <span className="text-[10px] px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-700 w-fit capitalize">
                        Texture: {a.texture.replace(/_/g,' ')}
                      </span>
                    )}
                    {a.notes && (
                      <p className="text-[11px] text-text-muted italic leading-relaxed">💡 {a.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Regenerate hint */}
          <p className="text-center text-xs text-text-muted">
            Not happy with this suggestion? Tap <strong>Regenerate</strong> for a different meal.
          </p>
        </div>
      )}

      {!generated && (
        <div className="card card-shadow text-center py-10">
          <p className="text-5xl mb-3">🍽️</p>
          <p className="font-black text-text-primary mb-1">Ready to generate</p>
          <p className="text-sm text-text-secondary">
            Select a meal time and tap <strong>Generate Family Meal</strong> to get personalised suggestions for everyone.
          </p>
        </div>
      )}
    </div>
  )
}
