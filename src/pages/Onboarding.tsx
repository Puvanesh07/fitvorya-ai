import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Gender, ActivityLevel, FitnessGoal } from '../types'

const STEPS = ['basics', 'metrics', 'goals'] as const
type Step = typeof STEPS[number]

const STEP_LABELS = ['Basic Info', 'Body Metrics', 'Your Goals']

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: '🛋️ Sedentary',  desc: 'Little / no exercise' },
  { value: 'light',       label: '🚶 Light',       desc: '1–3 days / week'      },
  { value: 'moderate',    label: '🏃 Moderate',    desc: '3–5 days / week'      },
  { value: 'active',      label: '💪 Active',      desc: '6–7 days / week'      },
  { value: 'very_active', label: '🔥 Very Active', desc: 'Athlete level'         },
]

const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_weight',     label: '📉 Lose Weight'    },
  { value: 'gain_weight',     label: '📈 Gain Weight'    },
  { value: 'maintain_weight', label: '✨ Maintain'        },
  { value: 'build_muscle',    label: '💪 Build Muscle'   },
  { value: 'general_fitness', label: '🏃 General Fitness' },
]

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  // ── Pre-populate from any existing (partial) Firestore profile so the
  //    user doesn't lose data if they started onboarding earlier.
  const [step,    setStep]    = useState<Step>('basics')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const [displayName,   setDisplayName]   = useState(profile?.displayName ?? user?.displayName ?? '')
  const [age,           setAge]           = useState(profile?.age ? String(profile.age) : '')
  const [gender,        setGender]        = useState<Gender>(profile?.gender ?? 'other')
  const [height,        setHeight]        = useState(profile?.height ? String(profile.height) : '')
  const [weight,        setWeight]        = useState(profile?.weight ? String(profile.weight) : '')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderate')
  const [goal,          setGoal]          = useState<FitnessGoal>(profile?.goal ?? 'maintain_weight')
  const [targetWeight,  setTargetWeight]  = useState(profile?.targetWeight ? String(profile.targetWeight) : '')

  // ── Per-step validation — "Next" is only enabled when this step is filled ──
  const canProgress: Record<Step, boolean> = {
    basics:  displayName.trim().length > 0 && !!age && !!gender,
    metrics: !!height && !!weight,
    goals:   !!goal && (goal === 'maintain_weight' || goal === 'general_fitness' || !!targetWeight),
  }

  // ── Save intermediate progress to Firestore after each step so the user
  //    can resume from where they left off even if they close the browser.
  async function saveStep(stepData: Record<string, unknown>) {
    if (!user) return
    try {
      await updateUserProfile(user.uid, {
        uid:   user.uid,
        email: user.email ?? '',
        ...stepData,
        // Explicitly NOT setting onboardingComplete here — that only happens
        // when the user explicitly submits the final step.
      })
    } catch {
      // Non-blocking — if intermediate save fails the user can still proceed
    }
  }

  async function handleNext() {
    const idx = STEPS.indexOf(step)
    if (idx >= STEPS.length - 1) return

    // Save progress for the step we're leaving
    if (step === 'basics') {
      await saveStep({ displayName: displayName.trim(), age: Number(age), gender })
    } else if (step === 'metrics') {
      await saveStep({ height: Number(height), weight: Number(weight), activityLevel, startingWeight: Number(weight) })
    }

    setStep(STEPS[idx + 1])
  }

  function handleBack() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  // ── Final submit — only called from the step-3 "Complete Setup" button ──
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)
    try {
      await updateUserProfile(user.uid, {
        uid:               user.uid,
        email:             user.email ?? '',
        displayName:       displayName.trim(),
        age:               Number(age),
        gender,
        height:            Number(height),
        weight:            Number(weight),
        activityLevel,
        goal,
        startingWeight:    Number(weight),
        targetWeight:      targetWeight ? Number(targetWeight) : undefined,
        onboardingComplete: true,   // ← set ONLY here, on explicit final submission
      })
      // Refresh the in-memory profile so OnboardingRoute sees onboardingComplete=true
      // and doesn't redirect back here.
      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepIdx     = STEPS.indexOf(step)
  const progressPct = ((stepIdx + 0.5) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="fixed pointer-events-none"
        style={{ top: '-20%', left: '-15%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,65,210,0.2) 0%, transparent 68%)' }} />
      <div className="fixed pointer-events-none"
        style={{ bottom: '-20%', right: '-15%', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230,55,165,0.16) 0%, transparent 68%)' }} />
      <div className="fixed pointer-events-none"
        style={{ top: '40%', right: '8%', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md animate-pop-in">
        <div className="g-modal-panel p-7">

          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-white text-xl font-black mx-auto mb-3"
              style={{ boxShadow: '0 8px 24px rgba(108,65,210,0.55)' }}>
              F
            </div>
            <h1 className="text-xl font-black text-text-primary mb-1">Complete Your Profile</h1>
            <p className="text-xs text-text-muted">Help us personalise your FitvoryaAI experience</p>
          </div>

          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              {STEPS.map((s, i) => {
                const isActive   = i === stepIdx
                const isComplete = i < stepIdx
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className={`g-step-dot ${isComplete ? 'g-step-dot-done' : isActive ? 'g-step-dot-active' : 'g-step-dot-pending'}`}>
                        {isComplete ? '✓' : i + 1}
                      </div>
                      <span className={`text-[9px] font-bold whitespace-nowrap ${
                        isActive ? 'text-purple-300' : isComplete ? 'text-text-secondary' : 'text-text-muted'
                      }`}>
                        {STEP_LABELS[i]}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="g-step-line mx-1.5 mb-3.5">
                        <div className="g-step-line-fill" style={{ width: isComplete ? '100%' : '0%' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Overall progress bar */}
            <div className="g-step-line h-1.5">
              <div className="g-step-line-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Form — wraps all steps; only submits on step 3 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* ── Step 1: Basics ── */}
            {step === 'basics' && (
              <div className="animate-slide-up flex flex-col gap-4">
                <h2 className="text-sm font-black text-text-primary">Tell us about yourself</h2>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5">Display Name</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="g-input" placeholder="Your name" autoFocus />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5">Age</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)}
                    className="g-input" placeholder="25" min={13} max={120} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['male', 'female', 'other'] as Gender[]).map(g => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className={`g-select-btn justify-center py-2.5 ${gender === g ? 'g-select-btn-active' : ''}`}>
                        {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '⚧️ Other'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Metrics ── */}
            {step === 'metrics' && (
              <div className="animate-slide-up flex flex-col gap-4">
                <h2 className="text-sm font-black text-text-primary">Your body metrics</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1.5">Height (cm)</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                      className="g-input" placeholder="170" min={100} max={250} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1.5">Weight (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                      className="g-input" placeholder="70" min={30} max={300} step="0.1" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-2">Activity Level</label>
                  <div className="flex flex-col gap-1.5">
                    {ACTIVITY_OPTIONS.map(o => (
                      <button key={o.value} type="button" onClick={() => setActivityLevel(o.value as ActivityLevel)}
                        className={`g-select-btn justify-between ${activityLevel === o.value ? 'g-select-btn-active' : ''}`}>
                        <span className="font-bold">{o.label}</span>
                        <span className="text-[11px] opacity-60">{o.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Goals ── */}
            {step === 'goals' && (
              <div className="animate-slide-up flex flex-col gap-4">
                <h2 className="text-sm font-black text-text-primary">Set your goal</h2>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-2">Primary Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GOAL_OPTIONS.map(g => (
                      <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                        className={`g-select-btn justify-center py-3 text-center ${goal === g.value ? 'g-select-btn-active' : ''}`}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {goal !== 'maintain_weight' && goal !== 'general_fitness' && (
                  <div className="animate-slide-up">
                    <label className="block text-xs font-bold text-text-secondary mb-1.5">Target Weight (kg)</label>
                    <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
                      className="g-input" placeholder="65" min={30} max={300} step="0.1" />
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="g-disclaimer"
                style={{ background: 'rgb(239 68 68 / 0.08)', borderColor: 'rgb(239 68 68 / 0.22)', color: 'rgb(248 113 113)' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Navigation — type="button" on Next/Back prevents form submit */}
            <div className="flex gap-2.5 pt-1">
              {step !== 'basics' && (
                <button type="button" onClick={handleBack} className="g-btn flex-1 py-3">
                  ← Back
                </button>
              )}

              {/* Steps 1 & 2 — advance to next step (no form submit) */}
              {step !== 'goals' && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProgress[step]}
                  className="g-btn g-btn-primary flex-1 py-3"
                >
                  Next →
                </button>
              )}

              {/* Step 3 — actual form submission, saves onboardingComplete: true */}
              {step === 'goals' && (
                <button
                  type="submit"
                  disabled={loading || !canProgress.goals}
                  className="g-btn g-btn-primary flex-1 py-3"
                >
                  {loading ? <><LoadingSpinner size="sm" /> Saving…</> : 'Complete Setup 🎉'}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-muted mt-4 opacity-60">
          Your data stays private and is never shared.
        </p>
      </div>
    </div>
  )
}
