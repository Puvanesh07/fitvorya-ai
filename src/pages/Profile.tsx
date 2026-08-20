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

// ── CSV export helper ─────────────────────────────────────────────────────────
function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [exporting, setExporting]     = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [age, setAge]                 = useState(String(profile?.age ?? ''))
  const [gender, setGender]           = useState<Gender>(profile?.gender ?? 'other')
  const [height, setHeight]           = useState(String(profile?.height ?? ''))
  const [weight, setWeight]           = useState(String(profile?.weight ?? ''))
  const [targetWeight, setTargetWeight] = useState(String(profile?.targetWeight ?? ''))
  const [goal, setGoal]               = useState<FitnessGoal>(profile?.goal ?? 'maintain_weight')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderate')

  if (!profile) {
    return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>
  }

  const metrics = computeMetrics(profile)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await updateUserProfile(user.uid, {
        displayName,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        targetWeight: targetWeight ? Number(targetWeight) : undefined,
        goal,
        activityLevel,
      })
      await refreshProfile()
      setEditing(false)
    } catch {
      setError('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  async function handleExport() {
    if (!user) return
    setExporting(true)
    try {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const startStr = dateToISO(sixMonthsAgo)
      const todayStr = localTodayISO()

      const [weights, meals, workouts] = await Promise.all([
        fetchWeightHistory(user.uid),
        fetchMealsForRange(user.uid, startStr, todayStr),
        fetchWorkoutHistory(user.uid),
      ])

      // Weight CSV
      downloadCSV(`fittracker-weight-${todayStr}.csv`, [
        ['Date', 'Weight (kg)', 'Note'],
        ...weights.map(w => [w.date, String(w.weight), w.note ?? '']),
      ])

      // Meals CSV
      downloadCSV(`fittracker-meals-${todayStr}.csv`, [
        ['Date', 'Meal', 'Food', 'Grams', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'],
        ...meals.map(m => [
          m.date, m.meal, m.foodItem.name,
          String(m.grams),
          String(Math.round(m.foodItem.calories * m.grams / 100)),
          String(Math.round(m.foodItem.protein  * m.grams / 100)),
          String(Math.round(m.foodItem.carbs    * m.grams / 100)),
          String(Math.round(m.foodItem.fat      * m.grams / 100)),
        ]),
      ])

      // Workouts CSV
      downloadCSV(`fittracker-workouts-${todayStr}.csv`, [
        ['Date', 'Workout', 'Duration (min)', 'Total Volume (kg)', 'Exercises'],
        ...workouts.map(w => [
          w.date, w.name,
          String(w.durationSeconds ? Math.round(w.durationSeconds / 60) : ''),
          String(w.totalVolumeKg ?? ''),
          w.exercises.map(e => e.exerciseName).join('; '),
        ]),
      ])
    } catch {
      setError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const initial = profile.displayName?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            Your <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Manage your account and preferences</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost py-2.5 px-5">
          🚪 Sign Out
        </button>
      </div>

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full gradient-brand flex items-center justify-center text-white text-3xl font-black shadow-xl">
            {initial}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{profile.displayName}</h2>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="badge badge-brand capitalize">{profile.gender}</span>
              <span className="badge badge-teal">{profile.age} years</span>
              {user && !user.emailVerified && (
                <span className="badge bg-yellow-100 text-yellow-700 border border-yellow-300">⚠️ Unverified</span>
              )}
            </div>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="card-purple p-4">
                <p className="text-xs font-semibold text-text-secondary mb-1">Height</p>
                <p className="text-lg font-bold text-text-primary">{profile.height} cm</p>
              </div>
              <div className="card-yellow p-4">
                <p className="text-xs font-semibold text-text-secondary mb-1">Weight</p>
                <p className="text-lg font-bold text-text-primary">{profile.weight} kg</p>
              </div>
              <div className="card-green p-4">
                <p className="text-xs font-semibold text-text-secondary mb-1">Goal</p>
                <p className="text-sm font-bold text-text-primary capitalize">{profile.goal.replace('_', ' ')}</p>
              </div>
              <div className="card-blue p-4">
                <p className="text-xs font-semibold text-text-secondary mb-1">Target Weight</p>
                <p className="text-lg font-bold text-text-primary">
                  {profile.targetWeight && profile.targetWeight > 0
                    ? `${profile.targetWeight} kg`
                    : profile.goal === 'maintain_weight' || profile.goal === 'general_fitness'
                    ? `${profile.weight} kg`
                    : '—'}
                </p>
              </div>
            </div>

            <div className="card-lime p-5 mb-5">
              <p className="text-xs font-semibold text-text-secondary mb-2">Activity Level</p>
              <p className="text-sm font-bold text-text-primary capitalize">{profile.activityLevel.replace('_', ' ')}</p>
            </div>

            <button onClick={() => setEditing(true)} className="btn-purple w-full sm:w-auto px-6">
              ✏️ Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="input" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                  className="input" min={13} max={120} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="input">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Height (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                  className="input" min={100} max={250} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Current Weight (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="input" min={30} max={300} step="0.1" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value as FitnessGoal)} className="input">
                <option value="lose_weight">Lose Weight</option>
                <option value="maintain_weight">Maintain Weight</option>
                <option value="gain_weight">Gain Weight</option>
                <option value="build_muscle">Build Muscle</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>

            {goal !== 'maintain_weight' && goal !== 'general_fitness' && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Target Weight (kg)</label>
                <input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)}
                  className="input" min={30} max={300} step="0.1" />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Activity Level</label>
              <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)} className="input">
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (athlete)</option>
              </select>
            </div>

            {error && <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-purple flex-1">
                {saving && <LoadingSpinner size="sm" />}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Metrics card */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-bold text-text-primary mb-4">Calculated Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">BMI</p>
            <p className="text-2xl font-black text-text-primary">{metrics.bmi.toFixed(1)}</p>
            <p className="text-xs text-text-secondary">{metrics.bmiCategory}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">BMR</p>
            <p className="text-2xl font-black text-text-primary">{Math.round(metrics.bmr)}</p>
            <p className="text-xs text-text-secondary">kcal/day at rest</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">TDEE</p>
            <p className="text-2xl font-black text-text-primary">{Math.round(metrics.tdee)}</p>
            <p className="text-xs text-text-secondary">kcal/day total</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">Target Calories</p>
            <p className="text-2xl font-black text-text-primary">{Math.round(metrics.targetCalories)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">Protein Goal</p>
            <p className="text-2xl font-black text-text-primary">{Math.round(metrics.macros.proteinG)}g</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">Progress</p>
            <p className="text-2xl font-black text-text-primary">{metrics.progressPercent}%</p>
          </div>
        </div>
      </div>

      {/* Data & Privacy card */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-text-primary mb-2">Data & Privacy</h2>
        <p className="text-sm text-text-secondary mb-5">
          Export your data at any time or permanently delete your account.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} disabled={exporting}
            className="btn-ghost py-2.5 px-5 flex items-center gap-2">
            {exporting ? <LoadingSpinner size="sm" /> : <span>📥</span>}
            {exporting ? 'Exporting…' : 'Export My Data (CSV)'}
          </button>
          <button onClick={() => setShowDeleteModal(true)}
            className="py-2.5 px-5 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">
            🗑️ Delete Account
          </button>
        </div>

        {error && <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5 mt-3">{error}</p>}
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          email={user?.email ?? ''}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => navigate('/')}
        />
      )}
    </div>
  )
}

// ── Delete Account Modal ──────────────────────────────────────────────────────
function DeleteAccountModal({
  email, onClose, onDeleted,
}: {
  email: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canDelete = confirm.trim().toLowerCase() === 'delete my account'

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    setError('')
    try {
      await deleteCurrentUser()
      onDeleted()
    } catch (err: unknown) {
      // Firebase throws "requires-recent-login" if session is old
      if (err instanceof Error && err.message.includes('recent-login')) {
        setError('For security, please sign out and sign back in before deleting your account.')
      } else {
        setError('Failed to delete account. Please try again.')
      }
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card p-6 border-2 border-red-200">
          <h2 className="text-xl font-black text-text-primary mb-2">Delete Account</h2>
          <p className="text-sm text-text-secondary mb-4">
            This will permanently delete your account and all data including weight logs,
            meals, workouts, and measurements. <strong>This cannot be undone.</strong>
          </p>
          <p className="text-sm text-text-secondary mb-1">
            Account: <strong>{email}</strong>
          </p>
          <p className="text-sm text-text-secondary mb-4">
            Type <strong>delete my account</strong> to confirm:
          </p>
          <input
            type="text"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="input mb-4"
            placeholder="delete my account"
            autoComplete="off"
          />

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5 mb-4">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                canDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-surface2 text-text-muted cursor-not-allowed'
              }`}
            >
              {deleting ? <LoadingSpinner size="sm" /> : '🗑️ Delete Forever'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
