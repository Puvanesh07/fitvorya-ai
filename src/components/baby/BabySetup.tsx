import { useState } from 'react'
import type { BabyProfile, BabyDietType } from '../../types/baby'
import { calculateAgeMonths, calculateAgeLabel, getStageIdForAge } from '../../services/babyService'
import { getStageById } from '../../data/babyData'

interface Props {
  existing: BabyProfile | null
  onSave: (p: BabyProfile) => void
  onCancel?: () => void
}

const DIET_OPTIONS: { value: BabyDietType; label: string; emoji: string }[] = [
  { value: 'vegetarian',     label: 'Vegetarian',     emoji: '🥬' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian', emoji: '🍗' },
  { value: 'vegan',          label: 'Vegan',          emoji: '🌱' },
]

export default function BabySetup({ existing, onSave, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [name,      setName]      = useState(existing?.name ?? '')
  const [dob,       setDob]       = useState(existing?.dateOfBirth ?? '')
  const [dietType,  setDietType]  = useState<BabyDietType>(existing?.dietType ?? 'non_vegetarian')
  const [tamilPref, setTamilPref] = useState(existing?.tamilFoodPreference ?? true)
  const [errors,    setErrors]    = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Please enter your baby\'s name.'
    if (!dob) e.dob = 'Please enter your baby\'s date of birth.'
    else {
      const age = calculateAgeMonths(dob)
      if (age < 0 || new Date(dob) > new Date()) e.dob = 'Date of birth cannot be in the future.'
      if (age > 48) e.dob = 'This feature is for babies and toddlers up to 3 years.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      name: name.trim(),
      dateOfBirth: dob,
      dietType,
      allergiesReported: existing?.allergiesReported ?? [],
      tamilFoodPreference: tamilPref,
    })
  }

  // Live age preview
  const previewAge = dob ? calculateAgeMonths(dob) : null
  const previewLabel = previewAge !== null ? calculateAgeLabel(previewAge) : null
  const previewStage = previewAge !== null ? getStageById(getStageIdForAge(previewAge)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-3xl card-shadow w-full max-w-lg animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
          <div className="text-3xl mb-2">👶</div>
          <h2 className="text-xl font-black">
            {existing ? 'Update Baby Profile' : 'Set Up Baby Nutrition'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            We'll personalise nutrition guidance based on your baby's age.
          </p>
        </div>

        {/* Form */}
        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

          {/* Baby name */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-1.5">
              Baby's name
            </label>
            <input
              type="text"
              placeholder="e.g. Arjun or Priya"
              value={name}
              onChange={e => { setName(e.target.value); setErrors({}) }}
              className="input"
            />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-1.5">
              Date of birth
            </label>
            <input
              type="date"
              max={today}
              value={dob}
              onChange={e => { setDob(e.target.value); setErrors({}) }}
              className="input"
            />
            {errors.dob && <p className="text-danger text-xs mt-1">{errors.dob}</p>}
          </div>

          {/* Age preview */}
          {previewLabel && previewStage && !errors.dob && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 flex items-center gap-3 border border-blue-200 dark:border-blue-700">
              <span className="text-2xl">{previewStage.emoji}</span>
              <div>
                <p className="text-xs text-text-secondary">Current age</p>
                <p className="font-bold text-text-primary">{previewLabel} old</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{previewStage.label} stage</p>
              </div>
            </div>
          )}

          {/* Diet type */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">Diet type</label>
            <div className="grid grid-cols-3 gap-2">
              {DIET_OPTIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDietType(d.value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                    dietType === d.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-border bg-surface2 text-text-secondary hover:border-blue-300'
                  }`}
                >
                  <span className="text-xl">{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tamil food preference */}
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
              <p className="text-xs opacity-70">Ragi, kambu, idli, and traditional Tamil foods</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              tamilPref ? 'bg-orange-400 border-orange-400' : 'border-border'
            }`}>
              {tamilPref && <span className="text-white text-xs">✓</span>}
            </div>
          </button>

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠️ <strong>Health disclaimer:</strong> FitTracker provides general nutrition information only.
              It is not a substitute for advice from a paediatrician or qualified healthcare professional.
              Always consult your doctor for personalised guidance.
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
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-500 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            {existing ? 'Update Profile' : 'Start Baby Journey 👶'}
          </button>
        </div>
      </div>
    </div>
  )
}
