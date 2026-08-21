import { useState } from 'react'
import type { PregnancyProfile, DietType } from '../../types/pregnancy'
import { calculateDueDate } from '../../services/pregnancyService'

interface Props {
  existing: PregnancyProfile | null
  onSave: (p: PregnancyProfile) => void
  onCancel?: () => void
}

const DIET_OPTIONS: { value: DietType; label: string; emoji: string }[] = [
  { value: 'vegetarian',     label: 'Vegetarian',  emoji: '🥬' },
  { value: 'eggetarian',     label: 'Eggetarian',  emoji: '🥚' },
  { value: 'non_vegetarian', label: 'Non-Veg',     emoji: '🍗' },
  { value: 'vegan',          label: 'Vegan',       emoji: '🌱' },
]

const RESTRICTION_OPTIONS = [
  { id: 'no_fish',               label: 'No fish / seafood'                  },
  { id: 'no_dairy',              label: 'No dairy (lactose intolerant)'       },
  { id: 'no_gluten',             label: 'Gluten-free'                         },
  { id: 'no_nuts',               label: 'Nut allergy'                         },
  { id: 'no_eggs',               label: 'No eggs'                             },
  { id: 'gestational_diabetes',  label: 'Gestational diabetes (managing sugars)' },
]

export default function PregnancySetup({ existing, onSave, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [startDate,    setStartDate]    = useState(existing?.startDate ?? '')
  const [dietType,     setDietType]     = useState<DietType>(existing?.dietType ?? 'non_vegetarian')
  const [restrictions, setRestrictions] = useState<string[]>(existing?.restrictions ?? [])
  const [tamilPref,    setTamilPref]    = useState(existing?.tamilFoodPreference ?? true)
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  function toggleRestriction(id: string) {
    setRestrictions(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!startDate) e.startDate = 'Please enter your last menstrual period date.'
    else {
      const start = new Date(startDate)
      const now   = new Date()
      if (start > now) e.startDate = 'Start date cannot be in the future.'
      const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      if (diff > 305) e.startDate = 'Date seems too far in the past (over 10 months).'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      startDate,
      dueDate:             calculateDueDate(startDate),
      dietType,
      restrictions,
      allergies:           [],
      tamilFoodPreference: tamilPref,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 g-modal-overlay animate-pop-in">
      <div className="g-modal-panel w-full max-w-md animate-pop-in overflow-hidden">

        {/* Header strip */}
        <div className="px-6 pt-6 pb-5" style={{
          background: 'linear-gradient(135deg, rgb(244 114 182 / 0.16), rgb(139 92 246 / 0.12))',
          borderBottom: '1px solid rgb(255 255 255 / 0.07)',
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgb(244 114 182 / 0.2)', border: '1px solid rgb(244 114 182 / 0.3)' }}>
              🤰
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary">
                {existing ? 'Update Pregnancy Details' : 'Set Up Pregnancy Nutrition'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                We'll personalise your nutrition guide based on your stage.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>

          {/* LMP date */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              First day of last menstrual period (LMP)
            </label>
            <input
              type="date"
              max={today}
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setErrors({}) }}
              className="g-input"
            />
            {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
            <p className="text-[10px] text-text-muted mt-1">
              Used to calculate your current pregnancy week. You can update it anytime.
            </p>
          </div>

          {/* Due date preview */}
          {startDate && !errors.startDate && (
            <div className="g-card-sm p-3 flex items-center gap-3 animate-slide-up"
              style={{ background: 'rgb(139 92 246 / 0.1)', borderColor: 'rgb(139 92 246 / 0.22)' }}>
              <span className="text-xl">📅</span>
              <div>
                <p className="text-[10px] text-text-muted">Estimated Due Date</p>
                <p className="text-sm font-bold text-text-primary">
                  {new Date(calculateDueDate(startDate)).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Diet type */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">Diet type</label>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setDietType(d.value)}
                  className="g-select-btn gap-2"
                  style={dietType === d.value ? {
                    background: 'rgb(139 92 246 / 0.18)', borderColor: 'rgb(139 92 246 / 0.45)',
                    color: 'rgb(196 181 253)', boxShadow: '0 0 0 1px rgb(139 92 246 / 0.1)',
                  } : {}}>
                  <span>{d.emoji}</span>
                  <span className="text-xs font-bold">{d.label}</span>
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
              <p className="text-[10px] opacity-60 mt-0.5">Kambu, ragi, keerai, and traditional Tamil foods</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              tamilPref ? 'border-orange-400 bg-orange-400' : 'border-white/20 bg-transparent'
            }`}>
              {tamilPref && <span className="text-white text-[9px] font-black">✓</span>}
            </div>
          </button>

          {/* Dietary restrictions */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">
              Dietary restrictions <span className="font-normal text-text-muted">(optional)</span>
            </label>
            <div className="flex flex-col gap-1.5">
              {RESTRICTION_OPTIONS.map(r => {
                const active = restrictions.includes(r.id)
                return (
                  <button key={r.id} onClick={() => toggleRestriction(r.id)}
                    className="g-select-btn gap-2.5"
                    style={active ? {
                      background: 'rgb(139 92 246 / 0.14)', borderColor: 'rgb(139 92 246 / 0.38)',
                      color: 'rgb(196 181 253)',
                    } : {}}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 text-[9px] transition-all ${
                      active ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/20'
                    }`}>
                      {active && '✓'}
                    </div>
                    <span className="text-xs">{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="g-disclaimer">
            ⚠️ <strong>Health disclaimer:</strong> General nutrition info only — not a substitute
            for medical advice. Always consult your doctor or midwife.
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-2.5" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
          {onCancel && (
            <button onClick={onCancel} className="g-btn flex-1 py-3">Cancel</button>
          )}
          <button onClick={handleSave} className="g-btn g-btn-primary flex-1 py-3">
            {existing ? 'Update Details' : 'Start My Journey 🤰'}
          </button>
        </div>
      </div>
    </div>
  )
}
