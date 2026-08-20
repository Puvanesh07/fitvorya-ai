import { useState } from 'react'
import type { PregnancyProfile, DietType } from '../../types/pregnancy'
import { calculateDueDate } from '../../services/pregnancyService'

interface Props {
  existing: PregnancyProfile | null
  onSave: (p: PregnancyProfile) => void
  onCancel?: () => void
}

const DIET_OPTIONS: { value: DietType; label: string; emoji: string }[] = [
  { value: 'vegetarian',     label: 'Vegetarian',     emoji: '🥬' },
  { value: 'eggetarian',     label: 'Eggetarian',     emoji: '🥚' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian', emoji: '🍗' },
  { value: 'vegan',          label: 'Vegan',          emoji: '🌱' },
]

const RESTRICTION_OPTIONS = [
  { id: 'no_fish',        label: 'No fish / seafood' },
  { id: 'no_dairy',       label: 'No dairy (lactose intolerant)' },
  { id: 'no_gluten',      label: 'Gluten-free' },
  { id: 'no_nuts',        label: 'Nut allergy' },
  { id: 'no_eggs',        label: 'No eggs' },
  { id: 'gestational_diabetes', label: 'Gestational diabetes (managing sugars)' },
]

export default function PregnancySetup({ existing, onSave, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [startDate,          setStartDate]          = useState(existing?.startDate ?? '')
  const [dietType,           setDietType]           = useState<DietType>(existing?.dietType ?? 'non_vegetarian')
  const [restrictions,       setRestrictions]       = useState<string[]>(existing?.restrictions ?? [])
  const [tamilPref,          setTamilPref]          = useState(existing?.tamilFoodPreference ?? true)
  const [errors,             setErrors]             = useState<Record<string, string>>({})

  function toggleRestriction(id: string) {
    setRestrictions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!startDate) e.startDate = 'Please enter your last menstrual period date.'
    const start = new Date(startDate)
    const now   = new Date()
    if (start > now) e.startDate = 'Start date cannot be in the future.'
    const diff  = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (diff > 305) e.startDate = 'Date seems too far in the past (over 10 months). Please check.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const due = calculateDueDate(startDate)
    onSave({
      startDate,
      dueDate:             due,
      dietType,
      restrictions,
      allergies:           [],
      tamilFoodPreference: tamilPref,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-3xl card-shadow w-full max-w-lg animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
          <div className="text-3xl mb-2">🤰</div>
          <h2 className="text-xl font-black">
            {existing ? 'Update Pregnancy Details' : 'Set Up Pregnancy Nutrition'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            We'll personalise your nutrition guide based on your stage.
          </p>
        </div>

        {/* Form */}
        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

          {/* LMP date */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-1.5">
              First day of your last menstrual period (LMP)
            </label>
            <input
              type="date"
              max={today}
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setErrors({}) }}
              className="input"
            />
            {errors.startDate && (
              <p className="text-danger text-xs mt-1">{errors.startDate}</p>
            )}
            <p className="text-text-muted text-xs mt-1">
              This is used to calculate your current pregnancy week. You can update it anytime.
            </p>
          </div>

          {/* Due date preview */}
          {startDate && !errors.startDate && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-3 flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs text-text-secondary">Estimated Due Date</p>
                <p className="font-bold text-text-primary">
                  {new Date(calculateDueDate(startDate)).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Diet type */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              Diet type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDietType(d.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                    dietType === d.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-border bg-surface2 text-text-secondary hover:border-purple-300'
                  }`}
                >
                  <span>{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tamil food preference */}
          <div>
            <button
              onClick={() => setTamilPref(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                tamilPref
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                  : 'border-border bg-surface2 text-text-secondary'
              }`}
            >
              <span className="text-xl">🍚</span>
              <div className="text-left">
                <p className="font-bold">Tamil traditional food preference</p>
                <p className="text-xs opacity-70">Get suggestions for kambu, ragi, keerai, and traditional Tamil foods</p>
              </div>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                tamilPref ? 'bg-orange-400 border-orange-400' : 'border-border'
              }`}>
                {tamilPref && <span className="text-white text-xs">✓</span>}
              </div>
            </button>
          </div>

          {/* Restrictions */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              Dietary restrictions <span className="font-normal text-text-muted">(optional)</span>
            </label>
            <div className="flex flex-col gap-1.5">
              {RESTRICTION_OPTIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggleRestriction(r.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    restrictions.includes(r.id)
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-border bg-surface2 text-text-secondary hover:border-purple-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 text-xs ${
                    restrictions.includes(r.id)
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'border-border'
                  }`}>
                    {restrictions.includes(r.id) ? '✓' : ''}
                  </span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠️ <strong>Health disclaimer:</strong> FitTracker provides general nutrition information only.
              It is not a substitute for advice from a qualified healthcare professional.
              Always consult your doctor or midwife for personalised guidance.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-text-secondary hover:bg-surface2 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl gradient-brand text-white text-sm font-bold shadow-lg shadow-purple-500/25 hover:opacity-90 transition-opacity"
          >
            {existing ? 'Update Details' : 'Start My Journey 🤰'}
          </button>
        </div>
      </div>
    </div>
  )
}
