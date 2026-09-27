import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout, deleteCurrentUser, resendVerificationEmail } from '../firebase/auth'
import { updateUserProfile } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLoader     from '../components/PageLoader'
import type { Gender, ActivityLevel, FitnessGoal } from '../types'
import type { Measurement } from '../types/progress'
import { GOAL_LABELS, ACTIVITY_LABELS } from '../types/user'
import { computeMetrics } from '../utils/calculations'
import { fetchWeightHistory, addWeight } from '../services/weightService'
import { fetchMealsForRange } from '../services/nutritionService'
import { fetchWorkoutHistory, fetchPersonalRecords } from '../services/workoutService'
import { fetchProgressSummary, fetchMeasurements } from '../services/progressService'
import { localTodayISO, dateToISO } from '../utils/format'
import { estimateBodyComposition, bodyFatCategory, latestNavyEligibleMeasurement } from '../utils/bodyComp'
import { useUnit, kgToDisplay, displayToKg } from '../hooks/useUnit'

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// Compact big-number formatting for lifetime stats (e.g. 12.4k kg)
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${Math.round(n)}`
}

interface AthleteSnapshot {
  workouts: number
  volumeKg: number
  prs: number
  streak: number
  longest: number
  badgesEarned: number
  badgesTotal: number
}

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const { unit } = useUnit()
  const navigate = useNavigate()
  const [editing, setEditing]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [exporting, setExporting]     = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [snapshot, setSnapshot]       = useState<AthleteSnapshot | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])

  const [displayName, setDisplayName]     = useState(profile?.displayName ?? '')
  const [age, setAge]                     = useState(String(profile?.age ?? ''))
  const [gender, setGender]               = useState<Gender>(profile?.gender ?? 'other')
  const [height, setHeight]               = useState(String(profile?.height ?? ''))
  const [weight, setWeight]               = useState(String(profile?.weight ?? ''))
  const [targetWeight, setTargetWeight]   = useState(String(profile?.targetWeight ?? ''))
  const [goal, setGoal]                   = useState<FitnessGoal>(profile?.goal ?? 'maintain_weight')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderate')

  // ── Lifetime achievements + measurement records (for body composition) ──
  useEffect(() => {
    const uid = profile?.uid
    if (!uid) return
    let alive = true
    Promise.all([fetchWorkoutHistory(uid), fetchPersonalRecords(uid), fetchProgressSummary(uid)])
      .then(([wo, pr, sum]) => {
        if (!alive) return
        setSnapshot({
          workouts: wo.length,
          volumeKg: wo.reduce((s, w) => s + (w.totalVolumeKg ?? 0), 0),
          prs: pr.length,
          streak: sum.streak.currentStreak,
          longest: sum.streak.longestStreak,
          badgesEarned: sum.badges.filter(b => b.earned).length,
          badgesTotal: sum.badges.length,
        })
      })
      .catch(() => { /* snapshot chips simply stay empty */ })
    fetchMeasurements(uid)
      .then(ms => { if (alive) setMeasurements(ms) })
      .catch(() => { /* body-comp card falls back to hint */ })
    return () => { alive = false }
  }, [profile?.uid])

  if (!profile) return <PageLoader variant="profile" />

  const metrics = computeMetrics(profile)
  const initial = profile.displayName?.charAt(0)?.toUpperCase() ?? 'U'

  // ── U.S. Navy body composition from real tape measurements ──
  const navySource = latestNavyEligibleMeasurement(measurements, profile.gender)
  const bodyComp = navySource
    ? estimateBodyComposition(navySource, profile.height, profile.gender, profile.weight)
    : null

  // Live recompute while editing — shows the metabolic impact before saving
  const preview = editing
    ? computeMetrics({
        ...profile,
        age: Number(age) || profile.age,
        gender,
        height: Number(height) || profile.height,
        weight: Number(weight) || profile.weight,
        goal,
        activityLevel,
      })
    : null

  function startEdit() {
    setDisplayName(profile!.displayName)
    setAge(String(profile!.age))
    setGender(profile!.gender)
    setHeight(String(profile!.height))
    setWeight(String(profile!.weight))
    setTargetWeight(String(profile!.targetWeight ?? ''))
    setGoal(profile!.goal)
    setActivityLevel(profile!.activityLevel)
    setError('')
    setEditing(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true); setError('')
    try {
      await updateUserProfile(user.uid, { displayName, age: Number(age), gender, height: Number(height), weight: Number(weight), targetWeight: targetWeight ? Number(targetWeight) : undefined, goal, activityLevel })
      // Keep weight history consistent with a manual profile-weight edit
      if (Math.abs(Number(weight) - profile!.weight) > 0.05) {
        await addWeight(user.uid, Number(weight), localTodayISO(), 'Updated from profile')
      }
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

  // BMI gauge geometry: map 15 → 40 onto the 0–100% bar
  const bmiPos  = Math.max(1, Math.min(99, ((metrics.bmi - 15) / 25) * 100))
  const hMeters = profile.height / 100
  const healthyLowKg  = 18.5 * hMeters * hMeters
  const healthyHighKg = 24.9 * hMeters * hMeters

  // Macro energy split (protein 4, carbs 4, fat 9 kcal/g)
  const macroKcal = {
    protein: metrics.macros.proteinG * 4,
    carbs:   metrics.macros.carbsG * 4,
    fat:     metrics.macros.fatG * 9,
  }
  const macroTotal = Math.max(1, macroKcal.protein + macroKcal.carbs + macroKcal.fat)

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 sm:mb-7">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Your <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Athlete identity, metabolic profile & account</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost btn-sm self-start sm:self-auto">Sign Out</button>
      </div>

      {/* ── Athlete hero card ── */}
      <div className="card card-shadow p-4 sm:p-6 rounded-2xl mb-4 sm:mb-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-start gap-3 sm:gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl sm:text-3xl font-black"
              style={{ boxShadow: '0 8px 24px rgba(108,65,210,0.45)' }}>
              {initial}
            </div>
            {(snapshot?.streak ?? 0) > 0 && (
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black card-orange flex items-center gap-0.5">
                🔥{snapshot!.streak}d
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-text-primary truncate">{profile.displayName}</h2>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5 truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                style={{ background: 'rgba(108,65,210,0.15)', color: '#a78bfa', border: '1px solid rgba(108,65,210,0.3)' }}>
                {profile.gender} · {profile.age} yrs
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.28)' }}>
                🎯 {GOAL_LABELS[profile.goal]}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.28)' }}>
                ⚡ {ACTIVITY_LABELS[profile.activityLevel].split(' (')[0]}
              </span>
              {user && !user.emailVerified && (
                <button
                  onClick={async () => { try { await resendVerificationEmail(); setVerificationSent(true) } catch { /* ignore */ } }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                  {verificationSent ? '✓ Verification sent' : '⚠️ Verify email — tap to resend'}
                </button>
              )}
              {user?.emailVerified && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
          {!editing && (
            <button onClick={startEdit} className="btn-purple btn-sm flex-shrink-0 self-center">✏️ Edit</button>
          )}
        </div>

        {!editing ? (
          <>
            {/* Body facts — unit aware */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
              {[
                { label: 'Height',  value: `${profile.height} cm`, icon: '📐', card: 'card-purple' },
                { label: 'Weight',  value: `${kgToDisplay(profile.weight, unit).toFixed(1)} ${unit}`, icon: '⚖️', card: 'card-yellow' },
                { label: 'Target',  value: `${kgToDisplay(profile.targetWeight, unit).toFixed(1)} ${unit}`, icon: '🎯', card: 'card-green' },
                { label: 'BMI',     value: metrics.bmi.toFixed(1), icon: '📊', card: 'card-blue', sub: metrics.bmiCategory },
              ].map(item => (
                <div key={item.label} className={`${item.card} p-3 sm:p-3.5 rounded-xl`}>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1">{item.icon} {item.label}</p>
                  <p className="text-base sm:text-lg font-black text-text-primary leading-tight">{item.value}</p>
                  {'sub' in item && item.sub && <p className="text-[10px] text-text-muted mt-0.5">{item.sub}</p>}
                </div>
              ))}
            </div>

            {/* Real goal progress */}
            <div>
              <div className="flex justify-between text-[10px] text-text-muted mb-1">
                <span>{kgToDisplay(profile.startingWeight ?? profile.weight, unit).toFixed(0)} {unit} start</span>
                <span className="font-black text-text-primary">{metrics.progressPercent}% there</span>
                <span>{kgToDisplay(profile.targetWeight, unit).toFixed(0)} {unit} goal</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, metrics.progressPercent)}%`, background: 'linear-gradient(90deg,#6c41d2,#ec4899)' }} />
              </div>
            </div>
          </>
        ) : (
          /* ── Edit form ── */
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
                <label className="block text-sm font-bold text-text-primary mb-2">Weight ({unit})</label>
                <input type="number" step="0.1"
                  value={unit === 'lbs' ? String(Math.round(kgToDisplay(Number(weight) || 0, 'lbs') * 10) / 10) : weight}
                  onChange={e => setWeight(unit === 'lbs'
                    ? String(displayToKg(Number(e.target.value) || 0, 'lbs'))
                    : e.target.value)}
                  className="input" required />
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
                <label className="block text-sm font-bold text-text-primary mb-2">Target Weight ({unit})</label>
                <input type="number" step="0.1"
                  value={unit === 'lbs' ? String(Math.round(kgToDisplay(Number(targetWeight) || 0, 'lbs') * 10) / 10) : targetWeight}
                  onChange={e => setTargetWeight(unit === 'lbs' && e.target.value !== ''
                    ? String(displayToKg(Number(e.target.value), 'lbs'))
                    : e.target.value)}
                  className="input" />
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

            {/* Live metabolic preview of unsaved changes */}
            {preview && (
              <div className="p-3 rounded-xl text-center"
                style={{ background: 'rgba(108,65,210,0.08)', border: '1px dashed rgba(140,65,212,0.4)' }}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1">New targets preview</p>
                <p className="text-sm font-black text-text-primary">
                  {Math.round(preview.targetCalories)} kcal/day · {preview.macros.proteinG}g protein · BMI {preview.bmi.toFixed(1)}
                  <span className="text-[10px] font-semibold ml-1.5" style={{ color: preview.bmiCategoryColor }}>({preview.bmiCategory})</span>
                </p>
              </div>
            )}

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

      {/* ── Athlete snapshot — lifetime stats from real logs ── */}
      <div className="card card-shadow p-4 sm:p-5 rounded-2xl mb-4 sm:mb-5 animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards', animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-text-primary">Athlete Snapshot</h2>
          <Link to="/progress" className="text-xs font-bold text-purple-400 hover:text-purple-300">Full history →</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { icon: '🏋️', label: 'Workouts',    value: snapshot ? String(snapshot.workouts) : '…' },
            { icon: '📦', label: 'Lifted',      value: snapshot ? `${compact(kgToDisplay(snapshot.volumeKg, unit))} ${unit}` : '…' },
            { icon: '🏆', label: 'Records',     value: snapshot ? String(snapshot.prs) : '…' },
            { icon: '🔥', label: 'Streak',      value: snapshot ? `${snapshot.streak}d` : '…' },
            { icon: '⚡', label: 'Longest',     value: snapshot ? `${snapshot.longest}d` : '…' },
            { icon: '🏅', label: 'Badges',      value: snapshot ? `${snapshot.badgesEarned}/${snapshot.badgesTotal}` : '…' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-2 py-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-lg">{s.icon}</span>
              <p className="text-sm sm:text-base font-black text-text-primary mt-1 leading-tight">{s.value}</p>
              <p className="text-[9px] sm:text-[10px] font-semibold text-text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Metabolic + Body composition ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">

        {/* Metabolic profile — BMI gauge + energy + macros */}
        <div className="card card-shadow p-4 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '120ms' }}>
          <h2 className="text-sm font-black text-text-primary mb-4">Metabolic Profile</h2>

          {/* BMI gauge */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide">BMI</p>
            <p className="text-sm font-black" style={{ color: metrics.bmiCategoryColor }}>
              {metrics.bmi.toFixed(1)} · {metrics.bmiCategory}
            </p>
          </div>
          <div className="relative mb-1.5">
            <div className="h-2.5 rounded-full overflow-hidden flex">
              <div style={{ width: '14%', background: 'rgba(96,165,250,0.5)' }} />
              <div style={{ width: '26%', background: 'rgba(16,185,129,0.55)' }} />
              <div style={{ width: '20%', background: 'rgba(245,158,11,0.55)' }} />
              <div style={{ width: '40%', background: 'rgba(239,68,68,0.5)' }} />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 h-4 w-1.5 rounded-full bg-white"
              style={{ left: `calc(${bmiPos}% - 3px)`, boxShadow: '0 0 6px rgba(255,255,255,0.8)', transition: 'left 0.6s ease' }} />
          </div>
          <p className="text-[10px] text-text-muted mb-4">
            Healthy range for your height: {kgToDisplay(healthyLowKg, unit).toFixed(1)}–{kgToDisplay(healthyHighKg, unit).toFixed(1)} {unit}
            <span className="opacity-70"> · WHO classification, less meaningful for athletes</span>
          </p>

          {/* Energy chain */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'BMR',  value: metrics.bmr,     sub: 'at rest' },
              { label: 'TDEE', value: metrics.tdee,    sub: 'maintenance' },
              { label: 'Target', value: metrics.targetCalories, sub: 'daily goal' },
            ].map(e => (
              <div key={e.label} className="rounded-xl p-2.5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-wide">{e.label}</p>
                <p className="text-base font-black text-text-primary leading-tight mt-0.5">{Math.round(e.value)}</p>
                <p className="text-[9px] text-text-muted">kcal · {e.sub}</p>
              </div>
            ))}
          </div>

          {/* Macro split */}
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Daily Macro Targets</p>
          <div className="h-2.5 rounded-full overflow-hidden flex mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: `${macroKcal.protein / macroTotal * 100}%`, background: '#10b981' }} />
            <div style={{ width: `${macroKcal.carbs / macroTotal * 100}%`, background: '#8b5cf6' }} />
            <div style={{ width: `${macroKcal.fat / macroTotal * 100}%`, background: '#f59e0b' }} />
            {/* macroTotal guard: divides over the kcal sum, always > 0 for a real target */}
          </div>
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-green-400">🥩 {metrics.macros.proteinG}g protein ({Math.round(macroKcal.protein / macroTotal * 100)}%)</span>
            <span className="text-purple-400">🍚 {metrics.macros.carbsG}g carbs ({Math.round(macroKcal.carbs / macroTotal * 100)}%)</span>
            <span className="text-amber-400">🥑 {metrics.macros.fatG}g fat ({Math.round(macroKcal.fat / macroTotal * 100)}%)</span>
          </div>
        </div>

        {/* Body composition */}
        <div className="card card-shadow p-4 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '180ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-text-primary">Body Composition</h2>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
              U.S. NAVY METHOD
            </span>
          </div>
          {bodyComp ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative h-24 w-24 flex-shrink-0">
                  <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                    <circle cx="48" cy="48" r="40" fill="none"
                      stroke={bodyFatCategory(bodyComp.bodyFatPct, profile.gender).color}
                      strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(100, bodyComp.bodyFatPct * 2.5) / 100} ${2 * Math.PI * 40}`}
                      style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                  </svg>
                  <span className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-text-primary leading-none">{bodyComp.bodyFatPct}%</span>
                    <span className="text-[8px] font-bold text-text-muted uppercase mt-0.5">body fat</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black mb-2"
                    style={{
                      background: `${bodyFatCategory(bodyComp.bodyFatPct, profile.gender).color}1f`,
                      color: bodyFatCategory(bodyComp.bodyFatPct, profile.gender).color,
                      border: `1px solid ${bodyFatCategory(bodyComp.bodyFatPct, profile.gender).color}4d`,
                    }}>
                    {bodyFatCategory(bodyComp.bodyFatPct, profile.gender).label}
                  </span>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Estimated from your tape measurements logged {bodyComp.basedOnDate}.
                    {!bodyComp.confident && ' Outside the method\u2019s most accurate range — treat as a trend.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="card-green rounded-xl px-3 py-3 text-center">
                  <p className="text-[10px] text-text-muted font-semibold">Lean Mass</p>
                  <p className="text-lg font-black text-text-primary mt-0.5">{kgToDisplay(bodyComp.leanMassKg, unit).toFixed(1)} <span className="text-xs font-normal text-text-muted">{unit}</span></p>
                </div>
                <div className="card-orange rounded-xl px-3 py-3 text-center">
                  <p className="text-[10px] text-text-muted font-semibold">Fat Mass</p>
                  <p className="text-lg font-black text-text-primary mt-0.5">{kgToDisplay(bodyComp.fatMassKg, unit).toFixed(1)} <span className="text-xs font-normal text-text-muted">{unit}</span></p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <span className="text-3xl opacity-50">📏</span>
              <p className="text-xs text-text-muted max-w-[26ch] leading-relaxed">
                {profile.gender === 'other'
                  ? 'This estimate needs a binary gender setting for its validated formulas.'
                  : 'Log waist' + (profile.gender === 'female' ? ', hip & neck' : ' & neck') + ' measurements (cm) to unlock your body-fat estimate.'}
              </p>
              <Link to="/progress" className="text-xs font-bold text-purple-400 hover:text-purple-300">Log measurements →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Data & Privacy ── */}
      <div className="card card-shadow p-4 sm:p-5 rounded-2xl animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards', animationDelay: '240ms' }}>
        <h2 className="text-sm font-black text-text-primary mb-1">Data & Privacy</h2>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">Everything you've logged is yours — export it any time (6 months of weight, meals & workouts as CSV), or permanently delete your account.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} disabled={exporting} className="btn-ghost btn-sm flex items-center justify-center gap-2">
            {exporting ? <LoadingSpinner size="sm" /> : <span>📥</span>}
            {exporting ? 'Exporting…' : 'Export My Data (CSV)'}
          </button>
          <button onClick={() => setShowDeleteModal(true)}
            className="btn-sm rounded-xl border-2 font-bold text-danger transition-colors hover:bg-danger/10"
            style={{ border: '1px solid rgba(255,75,75,0.35)', background: 'rgba(255,75,75,0.08)', color: 'rgb(255,75,75)' }}>
            🗑️ Delete Account
          </button>
        </div>
        {error && !editing && (
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

