import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { editProfile } from '../services/userService'
import PageWrapper from '../components/PageWrapper'
import LoadingSpinner from '../components/LoadingSpinner'
import { GOAL_LABELS, ACTIVITY_LABELS } from '../types/user'
import type { Gender, FitnessGoal, ActivityLevel } from '../types/user'
import { computeMetrics } from '../utils/calculations'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [age, setAge] = useState(String(profile?.age ?? ''))
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'male')
  const [height, setHeight] = useState(String(profile?.height ?? ''))
  const [weight, setWeight] = useState(String(profile?.weight ?? ''))
  const [targetWeight, setTargetWeight] = useState(String(profile?.targetWeight ?? ''))
  const [goal, setGoal] = useState<FitnessGoal>(profile?.goal ?? 'general_fitness')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderate')

  if (!profile) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>
      </PageWrapper>
    )
  }

  const metrics = computeMetrics(profile)
  const initial = profile.displayName.charAt(0).toUpperCase()

  function startEdit() {
    if (!profile) return
    setDisplayName(profile.displayName)
    setAge(String(profile.age))
    setGender(profile.gender)
    setHeight(String(profile.height))
    setWeight(String(profile.weight))
    setTargetWeight(String(profile.targetWeight))
    setGoal(profile.goal)
    setActivityLevel(profile.activityLevel)
    setError('')
    setSuccess(false)
    setEditing(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError('')
    if (!displayName.trim()) { setError('Name is required.'); return }
    if (!age || Number(age) < 10 || Number(age) > 120) { setError('Enter a valid age (10–120).'); return }
    if (!height || Number(height) < 100 || Number(height) > 250) { setError('Enter height in cm (100–250).'); return }
    if (!weight || Number(weight) < 20 || Number(weight) > 400) { setError('Enter a valid weight (20–400 kg).'); return }
    if (!targetWeight || Number(targetWeight) < 20 || Number(targetWeight) > 400) { setError('Enter a valid target weight.'); return }

    setSaving(true)
    try {
      await editProfile(profile!.uid, {
        displayName: displayName.trim(), age: Number(age), gender,
        height: Number(height), weight: Number(weight),
        targetWeight: Number(targetWeight), goal, activityLevel,
      })
      await refreshProfile()
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'gradient-text' : 'text-text-primary'}`}>{value}</span>
    </div>
  )

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="card p-5 sm:p-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h2 className="font-bold text-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  )

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold glow-sm animate-pulse-glow">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{profile.displayName}</h1>
            <p className="text-sm text-text-secondary">{profile.email}</p>
            <span className="badge badge-brand mt-1">{GOAL_LABELS[profile.goal]}</span>
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} className="btn-ghost py-2 px-4 text-sm">
            ✏️ Edit
          </button>
        )}
      </div>

      {success && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success animate-fade-in">
          <span>✓</span> Profile updated successfully.
        </div>
      )}

      {/* Read view */}
      {!editing ? (
        <div className="flex flex-col gap-4">
          <Section title="Personal Info" icon="👤">
            <Field label="Age" value={`${profile.age} years`} />
            <Field label="Gender" value={profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} />
            <Field label="Height" value={`${profile.height} cm`} />
            <Field label="Current Weight" value={`${profile.weight} kg`} />
            <Field label="Target Weight" value={`${profile.targetWeight} kg`} />
          </Section>

          <Section title="Goal & Activity" icon="🎯">
            <Field label="Goal" value={GOAL_LABELS[profile.goal]} highlight />
            <Field label="Activity Level" value={ACTIVITY_LABELS[profile.activityLevel]} />
          </Section>

          <Section title="Your Metrics" icon="📊">
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { label: 'BMI', value: `${metrics.bmi}`, sub: metrics.bmiCategory },
                { label: 'BMR', value: `${metrics.bmr} kcal` },
                { label: 'TDEE', value: `${metrics.tdee} kcal` },
                { label: 'Daily Target', value: `${metrics.targetCalories} kcal` },
                { label: 'Protein', value: `${metrics.macros.proteinG} g` },
                { label: 'Carbs', value: `${metrics.macros.carbsG} g` },
              ].map((m) => (
                <div key={m.label} className="bg-surface2 rounded-xl p-3 border border-border/50">
                  <p className="text-xs text-text-secondary mb-1">{m.label}</p>
                  <p className="font-bold text-text-primary text-sm">{m.value}</p>
                  {m.sub && <p className="text-xs text-text-secondary">{m.sub}</p>}
                </div>
              ))}
            </div>
          </Section>
        </div>
      ) : (
        /* Edit form */
        <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
          <div className="card p-5 sm:p-6 animate-scale-in">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">👤</span>
              <h2 className="font-bold text-text-primary">Personal Info</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Full name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Age</label>
                  <input type="number" min={10} max={120} value={age} onChange={(e) => setAge(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Height (cm)</label>
                  <input type="number" min={100} max={250} value={height} onChange={(e) => setHeight(e.target.value)} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <button key={g} type="button" onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${gender === g ? 'border-brand bg-brand-light text-brand' : 'border-border bg-surface2 text-text-secondary hover:border-brand/40'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Current weight (kg)</label>
                  <input type="number" step="0.1" min={20} max={400} value={weight} onChange={(e) => setWeight(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Target weight (kg)</label>
                  <input type="number" step="0.1" min={20} max={400} value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="input" />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🎯</span>
              <h2 className="font-bold text-text-primary">Goal & Activity</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Fitness goal</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value as FitnessGoal)} className="input">
                  {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => (
                    <option key={g} value={g}>{GOAL_LABELS[g]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Activity level</label>
                <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)} className="input">
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
                    <option key={a} value={a}>{ACTIVITY_LABELS[a]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger animate-fade-in">
              <span>⚠️</span>{error}
            </div>
          )}

          <div className="flex gap-3 pb-8">
            <button type="button" onClick={() => { setEditing(false); setError('') }} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving && <LoadingSpinner size="sm" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </PageWrapper>
  )
}
