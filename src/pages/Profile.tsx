import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout, deleteCurrentUser } from '../firebase/auth'
import { updateUserProfile } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Gender, ActivityLevel, FitnessGoal } from '../types'
import { computeMetrics } from '../utils/calculations'
import { fetchWeightHistory } from '../services/weightService'
import { fetchMealsForRange } from '../services/nutritionService'
import { fetchWorkoutHistory } from '../services/workoutService'
import { localTodayISO, dateToISO } from '../utils/format'

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [exporting, setExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [displayName, setDisplayName]     = useState(profile?.displayName ?? '')
  const [age, setAge]                     = useState(String(profile?.age ?? ''))
  const [gender, setGender]               = useState<Gender>(profile?.gender ?? 'other')
  const [height, setHeight]               = useState(String(profile?.height ?? ''))
  const [weight, setWeight]               = useState(String(profile?.weight ?? ''))
  const [targetWeight, setTargetWeight]   = useState(String(profile?.targetWeight ?? ''))
  const [goal, setGoal]                   = useState<FitnessGoal>(profile?.goal ?? 'maintain_weight')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderate')

  if (!profile) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>

  const metrics = computeMetrics(profile)
  const initial = profile.displayName?.charAt(0)?.toUpperCase() ?? 'U'

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true); setError('')
    try {
      await updateUserProfile(user.uid, { displayName, age: Number(age), gender, height: Number(height), weight: Number(weight), targetWeight: targetWeight ? Number(targetWeight) : undefined, goal, activityLevel })
      await refreshProfile(); setEditing(false)
    } catch { setError('Failed to update. Please try again.') }
    finally { setSaving(false) }
  }

  async function handleLogout() { await logout(); navigate('/') }

  async function handleExport() {
    if (!user) return
    setExporting(true)
    try {
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const startStr = dateToISO(sixMonthsAgo)
      const todayStr = localTodayISO()
      const [weights, meals, workouts] = await Promise.all([
        fetchWeightHistory(user.uid),
        fetchMealsForRange(user.uid, startStr, todayStr),
        fetchWorkoutHistory(user.uid),
      ])
      downloadCSV(`fittracker-weight-${todayStr}.csv`, [
        ['Date', 'Weight (kg)', 'Note'],
        ...weights.map(w => [w.date, String(w.weight), w.note ?? '']),
      ])
      downloadCSV(`fittracker-meals-${todayStr}.csv`, [
        ['Date', 'Meal', 'Food', 'Grams', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'],
        ...meals.map(m => [m.date, m.meal, m.foodItem.name, String(m.grams),
          String(Math.round(m.foodItem.calories * m.grams / 100)),
          String(Math.round(m.foodItem.protein  * m.grams / 100)),
          String(Math.round(m.foodItem.carbs    * m.grams / 100)),
          String(Math.round(m.foodItem.fat      * m.grams / 100))]),
      ])
      downloadCSV(`fittracker-workouts-${todayStr}.csv`, [
        ['Date', 'Workout', 'Duration (min)', 'Total Volume (kg)', 'Exercises'],
        ...workouts.map(w => [w.date, w.name,
          String(w.durationSeconds ? Math.round(w.durationSeconds / 60) : ''),
          String(w.totalVolumeKg ?? ''),
          w.exercises.map(e => e.exerciseName).join('; ')]),
      ])
    } catch { setError('Export failed. Please try again.') }
    finally { setExporting(false) }
  }

  // const cardBorder = 'border: 1px solid rgba(255,255,255,0.07)'

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Your <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Manage your account and preferences</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost btn-sm">Sign Out</button>
      </div>

      {/* Profile hero card */}
      <div className="card card-shadow p-6 rounded-2xl mb-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-18 w-18 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-black shadow-xl flex-shrink-0"
            style={{ height: 72, width: 72, boxShadow: '0 8px 24px rgba(108,65,210,0.45)' }}>
            {initial}
          </div>
          <div>
            <h2 className="text-lg font-black text-text-primary">{profile.displayName}</h2>
            <p className="text-sm text-text-muted mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize"
                style={{ background: 'rgba(108,65,210,0.15)', color: '#a78bfa', border: '1px solid rgba(108,65,210,0.3)' }}>
                {profile.gender}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(108,65,210,0.15)', color: '#a78bfa', border: '1px solid rgba(108,65,210,0.3)' }}>
                {profile.age} yrs
              </span>
              {user && !user.emailVerified && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                  ⚠️ Unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Height',   value: `${profile.height} cm`,           card: 'card-purple' },
                { label: 'Weight',   value: `${profile.weight} kg`,            card: 'card-yellow' },
                { label: 'Goal',     value: profile.goal.replace(/_/g, ' '),   card: 'card-green'  },
                { label: 'Target',   value: `${profile.targetWeight ?? profile.weight} kg`, card: 'card-blue' },
              ].map(item => (
                <div key={item.label} className={`${item.card} p-3.5 rounded-xl`}>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1">{item.label}</p>
                  <p className="text-sm font-black text-text-primary capitalize leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="card-orange p-3.5 rounded-xl mb-5">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1">Activity Level</p>
              <p className="text-sm font-black text-text-primary capitalize">{profile.activityLevel.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={() => setEditing(true)} className="btn-purple btn-sm">Edit Profile</button>
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} className="input" min={13} max={120} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value as Gender)} className="input">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Height (cm)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="input" min={100} max={250} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Weight (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="input" min={30} max={300} step="0.1" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Fitness Goal</label>
              <select value={goal} onChange={e => setGoal(e.target.value as FitnessGoal)} className="input">
                <option value="lose_weight">Lose Weight</option>
                <option value="maintain_weight">Maintain Weight</option>
                <option value="gain_weight">Gain Weight</option>
                <option value="build_muscle">Build Muscle</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>
            {goal !== 'maintain_weight' && goal !== 'general_fitness' && (
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Target Weight (kg)</label>
                <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} className="input" min={30} max={300} step="0.1" />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Activity Level</label>
              <select value={activityLevel} onChange={e => setActivityLevel(e.target.value as ActivityLevel)} className="input">
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="light">Light (1–3 days/week)</option>
                <option value="moderate">Moderate (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very_active">Very Active (athlete)</option>
              </select>
            </div>
            {error && (
              <p className="text-xs text-danger rounded-xl px-4 py-2.5"
                style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.25)' }}>
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-purple flex-1">
                {saving && <LoadingSpinner size="sm" />} Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Calculated metrics */}
      <div className="card card-shadow p-5 rounded-2xl mb-5 animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards', animationDelay: '80ms' }}>
        <h2 className="text-sm font-black text-text-primary mb-4">Calculated Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'BMI',            value: metrics.bmi.toFixed(1),             sub: metrics.bmiCategory,    card: 'card-purple' },
            { label: 'BMR',            value: `${Math.round(metrics.bmr)}`,        sub: 'kcal/day at rest',     card: 'card-blue'   },
            { label: 'TDEE',           value: `${Math.round(metrics.tdee)}`,       sub: 'kcal/day total',       card: 'card-green'  },
            { label: 'Target Cals',    value: `${Math.round(metrics.targetCalories)}`, sub: 'kcal/day goal',    card: 'card-yellow' },
            { label: 'Protein Goal',   value: `${Math.round(metrics.macros.proteinG)}g`, sub: 'daily target',   card: 'card-pink'   },
            { label: 'Progress',       value: `${metrics.progressPercent}%`,       sub: 'toward goal weight',   card: 'card-orange' },
          ].map(m => (
            <div key={m.label} className={`${m.card} p-4 rounded-xl`}>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">{m.label}</p>
              <p className="text-2xl font-black text-text-primary tracking-tight">{m.value}</p>
              <p className="text-[10px] text-text-muted mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="card card-shadow p-5 rounded-2xl animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards', animationDelay: '160ms' }}>
        <h2 className="text-sm font-black text-text-primary mb-1">Data & Privacy</h2>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">Export your data at any time, or permanently delete your account.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} disabled={exporting} className="btn-ghost btn-sm flex items-center gap-2">
            {exporting ? <LoadingSpinner size="sm" /> : <span>📥</span>}
            {exporting ? 'Exporting…' : 'Export My Data (CSV)'}
          </button>
          <button onClick={() => setShowDeleteModal(true)}
            className="btn-sm rounded-xl border-2 font-bold text-danger transition-colors hover:bg-danger/10"
            style={{ border: '1px solid rgba(255,75,75,0.35)', background: 'rgba(255,75,75,0.08)', color: 'rgb(255,75,75)' }}>
            🗑️ Delete Account
          </button>
        </div>
        {error && (
          <p className="text-xs text-danger rounded-xl px-4 py-2.5 mt-3"
            style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.25)' }}>
            {error}
          </p>
        )}
      </div>

      {showDeleteModal && (
        <DeleteAccountModal email={user?.email ?? ''} onClose={() => setShowDeleteModal(false)} onDeleted={() => navigate('/')} />
      )}
    </div>
  )
}

function DeleteAccountModal({ email, onClose, onDeleted }: { email: string; onClose: () => void; onDeleted: () => void }) {
  const [confirm, setConfirm]   = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')
  const canDelete = confirm.trim().toLowerCase() === 'delete my account'

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true); setError('')
    try { await deleteCurrentUser(); onDeleted() }
    catch (err: unknown) {
      if (err instanceof Error && err.message.includes('recent-login')) {
        setError('Please sign out and sign back in before deleting your account.')
      } else { setError('Failed to delete account. Please try again.') }
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card card-shadow p-6 rounded-2xl"
          style={{ border: '1px solid rgba(255,75,75,0.3)' }}>
          <h2 className="text-lg font-black text-text-primary mb-2">Delete Account</h2>
          <p className="text-sm text-text-muted mb-4 leading-relaxed">
            This permanently deletes your account and <strong className="text-text-primary">all data</strong> including logs, meals, workouts, and measurements. This cannot be undone.
          </p>
          <p className="text-sm text-text-muted mb-1">Account: <strong className="text-text-primary">{email}</strong></p>
          <p className="text-sm text-text-muted mb-4">Type <strong className="text-text-primary">delete my account</strong> to confirm:</p>
          <input type="text" value={confirm} onChange={e => setConfirm(e.target.value)}
            className="input mb-4" placeholder="delete my account" autoComplete="off" />
          {error && (
            <p className="text-xs text-danger rounded-xl px-4 py-2.5 mb-4"
              style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.25)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={!canDelete || deleting}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all"
              style={{
                background: canDelete ? 'rgb(220,38,38)' : 'rgba(255,255,255,0.05)',
                color: canDelete ? 'white' : 'rgba(170,165,210,0.5)',
                cursor: canDelete ? 'pointer' : 'not-allowed',
              }}>
              {deleting ? <LoadingSpinner size="sm" /> : '🗑️ Delete Forever'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
