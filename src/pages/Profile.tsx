import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../firebase/auth'
import { updateUserProfile } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Gender, ActivityLevel, FitnessGoal } from '../types'
import { computeMetrics } from '../utils/calculations'

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [age, setAge] = useState(String(profile?.age ?? ''))
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'other')
  const [height, setHeight] = useState(String(profile?.height ?? ''))
  const [weight, setWeight] = useState(String(profile?.weight ?? ''))
  const [targetWeight, setTargetWeight] = useState(String(profile?.targetWeight ?? ''))
  const [goal, setGoal] = useState<FitnessGoal>(profile?.goal ?? 'maintain_weight')
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
            </div>
          </div>
        </div>

        {!editing ? (
          <>
            {/* View mode */}
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
                <p className="text-lg font-bold text-text-primary capitalize">{profile.goal}</p>
              </div>
              <div className="card-blue p-4">
                <p className="text-xs font-semibold text-text-secondary mb-1">Target</p>
                <p className="text-lg font-bold text-text-primary">{profile.targetWeight ?? '—'} kg</p>
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
          <>
            {/* Edit mode */}
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
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight</option>
                </select>
              </div>

              {goal !== 'maintain_weight' && (
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
          </>
        )}
      </div>

      {/* Metrics card */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-text-primary mb-4">Calculated Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">BMI</p>
            <p className="text-2xl font-black text-text-primary">{metrics.bmi.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">BMR</p>
            <p className="text-2xl font-black text-text-primary">{Math.round(metrics.bmr)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">TDEE</p>
            <p className="text-2xl font-black text-text-primary">{Math.round(metrics.tdee)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">Target Calories</p>
            <p className="text-2xl font-black text-text-primary">{Math.round(metrics.targetCalories)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">Protein Goal</p>
            <p className="text-2xl font-black text-text-primary">{Math.round((metrics.targetCalories * 0.3) / 4)}g</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">Progress</p>
            <p className="text-2xl font-black text-text-primary">{metrics.progressPercent}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
