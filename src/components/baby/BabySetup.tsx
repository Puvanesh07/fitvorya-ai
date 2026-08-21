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
  { value: 'non_vegetarian', label: 'Non-Veg',        emoji: '🍗' },
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
    if (!name.trim()) e.name = "Please enter your baby's name."
    if (!dob) e.dob = "Please enter your baby's date of birth."
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

  const previewAge   = dob ? calculateAgeMonths(dob) : null
  const previewLabel = previewAge !== null ? calculateAgeLabel(previewAge) : null
  const previewStage = previewAge !== null ? getStageById(getStageIdForAge(previewAge)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 g-modal-overlay animate-pop-in">
      <div className="g-modal-panel w-full max-w-md animate-pop-in overflow-hidden">

        {/* Header strip */}
        <div className="px-6 pt-6 pb-5" style={{
          background: 'linear-gradient(135deg, rgb(32 195 190 / 0.18), rgb(56 189 248 / 0.12))',
          borderBottom: '1px solid rgb(255 255 255 / 0.07)',
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgb(32 195 190 / 0.2)', border: '1px solid rgb(32 195 190 / 0.3)' }}>
              👶
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary">
                {existing ? 'Update Baby Profile' : 'Set Up Baby Nutrition'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                We'll personalise guidance based on your baby's age.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>

          {/* Baby name */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">Baby's name</label>
            <input
              type="text"
              placeholder="e.g. Arjun or Priya"
              value={name}
              onChange={e => { setName(e.target.value); setErrors({}) }}
              className="g-input"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">Date of birth</label>
            <input
              type="date"
              max={today}
              value={dob}
              onChange={e => { setDob(e.target.value); setErrors({}) }}
              className="g-input"
            />
            {errors.dob && <p className="text-red-400 text-xs mt-1">{errors.dob}</p>}
          </div>

          {/* Age preview */}
          {previewLabel && previewStage && !errors.dob && (
            <div className="g-card-sm p-3 flex items-center gap-3 animate-slide-up"
              style={{ background: 'rgb(32 195 190 / 0.08)', borderColor: 'rgb(32 195 190 / 0.2)' }}>
              <span className="text-xl">{previewStage.emoji}</span>
              <div>
                <p className="text-[10px] text-text-muted">Current age</p>
                <p className="text-sm font-bold text-text-primary">{previewLabel} old</p>
                <p className="text-xs text-teal-400">{previewStage.label} stage</p>
              </div>
            </div>
          )}

          {/* Diet type */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">Diet type</label>
            <div className="grid grid-cols-3 gap-2">
              {DIET_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setDietType(d.value)}
                  className="g-select-btn flex-col items-center justify-center gap-1 py-3"
                  style={dietType === d.value ? {
                    background: 'rgb(32 195 190 / 0.18)', borderColor: 'rgb(32 195 190 / 0.45)',
                    color: 'rgb(94 234 212)', boxShadow: '0 0 0 1px rgb(32 195 190 / 0.1)',
                  } : {}}>
                  <span className="text-xl">{d.emoji}</span>
                  <span className="text-[11px] font-bold">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tamil preference toggle */}
          <button
            onClick={() => setTamilPref(v => !v)}
            className="g-select-btn gap-3"
            style={tamilPref ? {
              background: 'rgb(251 146 60 / 0.12)', borderColor: 'rgb(251 146 60 / 0.35)',
              color: 'rgb(253 186 116)',
            } : {}}
          >
            <span className="text-xl flex-shrink-0">🍚</span>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold">Tamil traditional food preference</p>
              <p className="text-[10px] opacity-60 mt-0.5">Ragi, kambu, idli, and traditional Tamil foods</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              tamilPref
                ? 'border-orange-400 bg-orange-400'
                : 'border-white/20 bg-transparent'
            }`}>
              {tamilPref && <span className="text-white text-[9px] font-black">✓</span>}
            </div>
          </button>

          {/* Disclaimer */}
          <div className="g-disclaimer">
            ⚠️ <strong>Health disclaimer:</strong> General nutrition info only — not a substitute
            for paediatric advice. Always consult your doctor.
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-2.5" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
          {onCancel && (
            <button onClick={onCancel} className="g-btn flex-1 py-3">Cancel</button>
          )}
          <button onClick={handleSave} className="g-btn g-btn-teal flex-1 py-3">
            {existing ? 'Update Profile' : 'Start Baby Journey 👶'}
          </button>
        </div>
      </div>
    </div>
  )
}
