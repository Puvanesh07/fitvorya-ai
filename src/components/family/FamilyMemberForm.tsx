import { useState } from 'react'
import type { FamilyMember, MemberRole, DietPref, ActivityLevel } from '../../types/family'
import { ROLE_CONFIG } from '../../data/familyData'
import { newMemberId } from '../../services/familyService'

interface Props {
  existing: FamilyMember | null
  onSave: (m: FamilyMember) => void
  onCancel: () => void
}

const ROLES: MemberRole[] = [
  'adult_male','adult_female','pregnant','baby','toddler','child','senior_male','senior_female',
]
const DIETS: { value: DietPref; label: string; emoji: string }[] = [
  { value: 'vegetarian',     label: 'Veg',     emoji: '🥬' },
  { value: 'eggetarian',     label: 'Egget.',  emoji: '🥚' },
  { value: 'non_vegetarian', label: 'Non-Veg', emoji: '🍗' },
  { value: 'vegan',          label: 'Vegan',   emoji: '🌱' },
]
const ACTIVITIES: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary',   label: 'Sedentary (little/no exercise)' },
  { value: 'light',       label: 'Light (1–3 days/week)'          },
  { value: 'moderate',    label: 'Moderate (3–5 days/week)'       },
  { value: 'active',      label: 'Active (6–7 days/week)'         },
  { value: 'very_active', label: 'Very Active'                    },
]
const COMMON_ALLERGIES = ['Dairy','Eggs','Gluten/Wheat','Nuts','Peanuts','Soy','Fish','Shellfish','Sesame']

export default function FamilyMemberForm({ existing, onSave, onCancel }: Props) {
  const [name,      setName]      = useState(existing?.name ?? '')
  const [role,      setRole]      = useState<MemberRole>(existing?.role ?? 'adult_male')
  const [dob,       setDob]       = useState(existing?.dateOfBirth ?? '')
  const [ageYears,  setAgeYears]  = useState(String(existing?.ageYears ?? ''))
  const [ageMonths, setAgeMonths] = useState(String(existing?.ageMonths ?? ''))
  const [pregWeek,  setPregWeek]  = useState(String(existing?.pregnancyWeek ?? ''))
  const [diet,      setDiet]      = useState<DietPref>(existing?.dietPref ?? 'non_vegetarian')
  const [activity,  setActivity]  = useState<ActivityLevel>(existing?.activityLevel ?? 'moderate')
  const [allergies, setAllergies] = useState<string[]>(existing?.allergies ?? [])
  const [dislikes,  setDislikes]  = useState(existing?.dislikes.join(', ') ?? '')
  const [prefs,     setPrefs]     = useState(existing?.preferences.join(', ') ?? '')
  const [tamilPref, setTamilPref] = useState(existing?.tamilFoodPreference ?? true)
  const [errors,    setErrors]    = useState<Record<string, string>>({})

  const isBaby    = role === 'baby'
  const isToddler = role === 'toddler'
  const isPreg    = role === 'pregnant'

  function toggleAllergen(a: string) {
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (isBaby && !ageMonths) e.age = 'Please enter age in months.'
    if (isToddler && !ageYears && !dob) e.age = 'Please enter age or date of birth.'
    if (isPreg && pregWeek && (Number(pregWeek) < 1 || Number(pregWeek) > 42)) e.pregWeek = 'Week must be 1–42.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      id:                  existing?.id ?? newMemberId(),
      name:                name.trim(),
      role,
      dateOfBirth:         dob || undefined,
      ageYears:            ageYears ? Number(ageYears) : undefined,
      ageMonths:           ageMonths ? Number(ageMonths) : undefined,
      dietPref:            diet,
      activityLevel:       activity,
      allergies,
      dislikes:            dislikes.split(',').map(s => s.trim()).filter(Boolean),
      preferences:         prefs.split(',').map(s => s.trim()).filter(Boolean),
      pregnancyWeek:       pregWeek ? Number(pregWeek) : undefined,
      tamilFoodPreference: tamilPref,
      createdAt:           existing?.createdAt,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 g-modal-overlay animate-pop-in">
      <div className="g-modal-panel w-full max-w-lg animate-pop-in overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{
          background: 'linear-gradient(135deg, rgb(16 185 129 / 0.18), rgb(32 195 190 / 0.12))',
          borderBottom: '1px solid rgb(255 255 255 / 0.07)',
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgb(16 185 129 / 0.2)', border: '1px solid rgb(16 185 129 / 0.3)' }}>
              {ROLE_CONFIG[role].emoji}
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary">{existing ? 'Edit Member' : 'Add Family Member'}</h2>
              <p className="text-xs text-text-muted">Personalise nutrition advice for this member.</p>
            </div>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '68vh' }}>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Amma, Appa, Baby Arjun" className="g-input" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Role grid */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Role</label>
            <div className="grid grid-cols-4 gap-1.5">
              {ROLES.map(r => {
                const cfg = ROLE_CONFIG[r]
                return (
                  <button key={r} onClick={() => setRole(r)}
                    className="g-select-btn flex-col items-center justify-center gap-0.5 py-2.5 text-center"
                    style={role === r ? {
                      background: 'rgb(16 185 129 / 0.18)', borderColor: 'rgb(16 185 129 / 0.45)',
                      color: 'rgb(110 231 183)', boxShadow: '0 0 0 1px rgb(16 185 129 / 0.1)',
                    } : {}}>
                    <span className="text-lg">{cfg.emoji}</span>
                    <span className="text-[9px] font-bold leading-tight text-center">
                      {cfg.label.split('(')[0].trim()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Age — context-sensitive */}
          {isBaby && (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Age (months)</label>
              <input type="number" min={0} max={24} value={ageMonths}
                onChange={e => setAgeMonths(e.target.value)} placeholder="e.g. 8" className="g-input" />
              {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
            </div>
          )}
          {(isToddler || role === 'child') && (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Date of birth or age (years)</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" max={new Date().toISOString().split('T')[0]} value={dob}
                  onChange={e => setDob(e.target.value)} className="g-input" />
                <input type="number" min={1} max={12} value={ageYears}
                  onChange={e => setAgeYears(e.target.value)} placeholder="Age in years" className="g-input" />
              </div>
              {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
            </div>
          )}
          {!isBaby && !isToddler && role !== 'child' && (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Age (years) — optional</label>
              <input type="number" min={1} max={120} value={ageYears}
                onChange={e => setAgeYears(e.target.value)} placeholder="e.g. 32" className="g-input" />
            </div>
          )}
          {isPreg && (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Pregnancy week (optional)</label>
              <input type="number" min={1} max={42} value={pregWeek}
                onChange={e => setPregWeek(e.target.value)} placeholder="e.g. 20" className="g-input" />
              {errors.pregWeek && <p className="text-red-400 text-xs mt-1">{errors.pregWeek}</p>}
            </div>
          )}

          {/* Diet */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Diet type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DIETS.map(d => (
                <button key={d.value} onClick={() => setDiet(d.value)}
                  className="g-select-btn flex-col items-center gap-0.5 py-2 justify-center"
                  style={diet === d.value ? {
                    background: 'rgb(16 185 129 / 0.18)', borderColor: 'rgb(16 185 129 / 0.45)',
                    color: 'rgb(110 231 183)',
                  } : {}}>
                  <span>{d.emoji}</span>
                  <span className="text-[10px] font-bold">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity level */}
          {!isBaby && !isToddler && (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Activity level</label>
              <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)}
                className="g-input" style={{ cursor: 'pointer' }}>
                {ACTIVITIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}

          {/* Allergies */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Allergies / intolerances</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGIES.map(a => (
                <button key={a} onClick={() => toggleAllergen(a)}
                  className="g-pill"
                  style={allergies.includes(a) ? {
                    background: 'rgb(239 68 68 / 0.15)', borderColor: 'rgb(239 68 68 / 0.35)',
                    color: 'rgb(252 165 165)',
                  } : {}}>
                  {allergies.includes(a) ? '✗ ' : ''}{a}
                </button>
              ))}
            </div>
          </div>

          {/* Dislikes + preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Dislikes <span className="font-normal opacity-60">(comma separated)</span>
              </label>
              <input type="text" value={dislikes} onChange={e => setDislikes(e.target.value)}
                placeholder="e.g. bitter gourd, brinjal" className="g-input" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Preferences <span className="font-normal opacity-60">(comma separated)</span>
              </label>
              <input type="text" value={prefs} onChange={e => setPrefs(e.target.value)}
                placeholder="e.g. ragi, oats, dal" className="g-input" />
            </div>
          </div>

          {/* Tamil preference */}
          <button onClick={() => setTamilPref(v => !v)}
            className="g-select-btn gap-3"
            style={tamilPref ? {
              background: 'rgb(251 146 60 / 0.12)', borderColor: 'rgb(251 146 60 / 0.35)',
              color: 'rgb(253 186 116)',
            } : {}}>
            <span className="text-xl flex-shrink-0">🍚</span>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold">Tamil traditional food preference</p>
              <p className="text-[10px] opacity-60 mt-0.5">Include kambu, ragi, keerai, and traditional Tamil foods</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${tamilPref ? 'border-orange-400 bg-orange-400' : 'border-white/20'}`}>
              {tamilPref && <span className="text-white text-[9px] font-black">✓</span>}
            </div>
          </button>

          <div className="g-disclaimer">
            ⚠️ FitTracker provides general nutrition information only. Not a substitute for medical advice.
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2.5" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
          <button onClick={onCancel} className="g-btn flex-1 py-3">Cancel</button>
          <button onClick={handleSave} className="g-btn g-btn-emerald flex-1 py-3">
            {existing ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}
