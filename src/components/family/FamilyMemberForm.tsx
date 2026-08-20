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
  { value: 'vegetarian',     label: 'Vegetarian',     emoji: '🥬' },
  { value: 'eggetarian',     label: 'Eggetarian',     emoji: '🥚' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian', emoji: '🍗' },
  { value: 'vegan',          label: 'Vegan',          emoji: '🌱' },
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
  const [name,       setName]       = useState(existing?.name ?? '')
  const [role,       setRole]       = useState<MemberRole>(existing?.role ?? 'adult_male')
  const [dob,        setDob]        = useState(existing?.dateOfBirth ?? '')
  const [ageYears,   setAgeYears]   = useState(String(existing?.ageYears ?? ''))
  const [ageMonths,  setAgeMonths]  = useState(String(existing?.ageMonths ?? ''))
  const [pregWeek,   setPregWeek]   = useState(String(existing?.pregnancyWeek ?? ''))
  const [diet,       setDiet]       = useState<DietPref>(existing?.dietPref ?? 'non_vegetarian')
  const [activity,   setActivity]   = useState<ActivityLevel>(existing?.activityLevel ?? 'moderate')
  const [allergies,  setAllergies]  = useState<string[]>(existing?.allergies ?? [])
  const [dislikes,   setDislikes]   = useState(existing?.dislikes.join(', ') ?? '')
  const [prefs,      setPrefs]      = useState(existing?.preferences.join(', ') ?? '')
  const [tamilPref,  setTamilPref]  = useState(existing?.tamilFoodPreference ?? true)
  const [errors,     setErrors]     = useState<Record<string,string>>({})

  const isBaby    = role === 'baby'
  const isToddler = role === 'toddler'
  const isPreg    = role === 'pregnant'

  function toggleAllergen(a: string) {
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  function validate(): boolean {
    const e: Record<string,string> = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (isBaby && !ageMonths) e.age = 'Please enter age in months.'
    if ((isToddler) && !ageYears && !dob) e.age = 'Please enter age or date of birth.'
    if (isPreg && pregWeek && (Number(pregWeek) < 1 || Number(pregWeek) > 42)) e.pregWeek = 'Week must be 1–42.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const member: FamilyMember = {
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
    }
    onSave(member)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-3xl card-shadow w-full max-w-lg animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
          <div className="text-3xl mb-1">{ROLE_CONFIG[role].emoji}</div>
          <h2 className="text-xl font-black">{existing ? 'Edit Member' : 'Add Family Member'}</h2>
          <p className="text-white/70 text-sm">Fill in the details to personalise nutrition advice.</p>
        </div>

        <div className="p-5 flex flex-col gap-4 max-h-[72vh] overflow-y-auto">

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amma, Appa, Baby Arjun" className="input" />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.map(r => {
                const cfg = ROLE_CONFIG[r]
                return (
                  <button key={r} onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${role === r ? `bg-gradient-to-br ${cfg.color} text-white border-transparent shadow-md` : 'border-border bg-surface2 text-text-secondary hover:border-emerald-300'}`}>
                    <span className="text-xl">{cfg.emoji}</span>
                    <span className="text-center leading-tight">{cfg.label.split('(')[0].trim()}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Age fields — context-sensitive */}
          {isBaby && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Age (months)</label>
              <input type="number" min={0} max={24} value={ageMonths} onChange={e => setAgeMonths(e.target.value)} placeholder="e.g. 8" className="input" />
              {errors.age && <p className="text-danger text-xs mt-1">{errors.age}</p>}
            </div>
          )}
          {(isToddler || role === 'child') && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Date of birth or age (years)</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" max={new Date().toISOString().split('T')[0]} value={dob} onChange={e => setDob(e.target.value)} className="input" />
                <input type="number" min={1} max={12} value={ageYears} onChange={e => setAgeYears(e.target.value)} placeholder="Age in years" className="input" />
              </div>
              {errors.age && <p className="text-danger text-xs mt-1">{errors.age}</p>}
            </div>
          )}
          {!isBaby && !isToddler && role !== 'child' && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Age (years) — optional</label>
              <input type="number" min={1} max={120} value={ageYears} onChange={e => setAgeYears(e.target.value)} placeholder="e.g. 32" className="input" />
            </div>
          )}

          {/* Pregnancy week */}
          {isPreg && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Pregnancy week (optional)</label>
              <input type="number" min={1} max={42} value={pregWeek} onChange={e => setPregWeek(e.target.value)} placeholder="e.g. 20" className="input" />
              {errors.pregWeek && <p className="text-danger text-xs mt-1">{errors.pregWeek}</p>}
            </div>
          )}

          {/* Diet type */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Diet type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIETS.map(d => (
                <button key={d.value} onClick={() => setDiet(d.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${diet === d.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-border bg-surface2 text-text-secondary hover:border-emerald-300'}`}>
                  <span>{d.emoji}</span><span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity level — adults only */}
          {!isBaby && !isToddler && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Activity level</label>
              <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)} className="input">
                {ACTIVITIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}

          {/* Allergies */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Food allergies / intolerances</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGIES.map(a => (
                <button key={a} onClick={() => toggleAllergen(a)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${allergies.includes(a) ? 'bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300' : 'bg-surface2 border-border text-text-secondary hover:border-red-300'}`}>
                  {allergies.includes(a) ? '✗ ' : ''}{a}
                </button>
              ))}
            </div>
          </div>

          {/* Dislikes + preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Food dislikes <span className="font-normal">(comma separated)</span></label>
              <input type="text" value={dislikes} onChange={e => setDislikes(e.target.value)} placeholder="e.g. bitter gourd, brinjal" className="input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">Food preferences <span className="font-normal">(comma separated)</span></label>
              <input type="text" value={prefs} onChange={e => setPrefs(e.target.value)} placeholder="e.g. ragi, oats, dal" className="input" />
            </div>
          </div>

          {/* Tamil pref */}
          <button onClick={() => setTamilPref(v => !v)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${tamilPref ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'border-border bg-surface2 text-text-secondary'}`}>
            <span className="text-xl">🍚</span>
            <div className="text-left flex-1">
              <p className="font-bold">Tamil traditional food preference</p>
              <p className="text-xs opacity-70">Include kambu, ragi, keerai, and traditional Tamil foods</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${tamilPref ? 'bg-orange-400 border-orange-400' : 'border-border'}`}>
              {tamilPref && <span className="text-white text-xs">✓</span>}
            </div>
          </button>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl">
            <p className="text-xs text-amber-800 dark:text-amber-300">⚠️ FitTracker provides general nutrition information only. Not a substitute for medical advice.</p>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-text-secondary hover:bg-surface2 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity">
            {existing ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}
