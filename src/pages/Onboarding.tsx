import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Gender, ActivityLevel, FitnessGoal } from '../types'

const STEPS = ['basics', 'metrics', 'goals'] as const
type Step = typeof STEPS[number]

const STEP_LABELS = ['Basic Info', 'Body Metrics', 'Your Goals']

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]       = useState<Step>('basics')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [displayName, setDisplayName]     = useState('')
  const [age, setAge]                     = useState('')
  const [gender, setGender]               = useState<Gender>('other')
  const [height, setHeight]               = useState('')
  const [weight, setWeight]               = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal]                   = useState<FitnessGoal>('maintain_weight')
  const [targetWeight, setTargetWeight]   = useState('')

  const canProgress = {
    basics:  displayName.trim().length > 0 && !!age && !!gender,
    metrics: !!height && !!weight,
    goals:   !!goal && (goal === 'maintain_weight' || goal === 'general_fitness' || !!targetWeight),
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(''); setLoading(true)
    try {
      await updateUserProfile(user.uid, {
        uid: user.uid, email: user.email ?? '',
        displayName: displayName.trim(), age: Number(age), gender,
        height: Number(height), weight: Number(weight), activityLevel, goal,
        startingWeight: Number(weight),
        targetWeight: targetWeight ? Number(targetWeight) : undefined,
        onboardingComplete: true,
      })
      await refreshProfile()
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally { setLoading(false) }
  }

  function nextStep() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }
  function prevStep() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed top-0 left-0 h-[450px] w-[450px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,65,210,0.18) 0%, transparent 70%)', transform: 'translate(-35%,-35%)' }} />
      <div className="fixed bottom-0 right-0 h-[380px] w-[380px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(230,55,165,0.14) 0%, transparent 70%)', transform: 'translate(35%,35%)' }} />

      <div className="relative z-10 w-full max-w-lg">
        <div className="card card-shadow p-7 rounded-2xl"
          style={{ border: '1px solid rgba(108,65,210,0.22)', boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(108,65,210,0.08)' }}>

          {/* Header */}
          <div className="text-center mb-7">
            <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-black mx-auto mb-4"
              style={{ boxShadow: '0 8px 24px rgba(108,65,210,0.5)' }}>F</div>
            <h1 className="text-2xl font-black text-text-primary mb-1.5">Complete Your Profile</h1>
            <p className="text-sm text-text-muted">Help us personalise your experience</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-7">
            {STEPS.map((s, i) => {
              const isActive   = i === stepIdx
              const isComplete = i < stepIdx
              return (
                <div key={s} className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
                      style={{
                        background: isComplete ? 'linear-gradient(135deg,#6c41d2,#ec4899)' : isActive ? 'rgba(108,65,210,0.3)' : 'rgba(255,255,255,0.06)',
                        border: isActive ? '1px solid rgba(108,65,210,0.6)' : 'none',
                        color: isComplete || isActive ? 'white' : 'rgba(170,165,210,0.5)',
                      }}>
                      {isComplete ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-purple-300' : isComplete ? 'text-text-muted' : 'text-text-muted'}`}>
                      {STEP_LABELS[i]}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full gradient-brand transition-all duration-500"
                      style={{ width: isComplete ? '100%' : isActive ? '50%' : '0%' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Step 1: Basics */}
            {step === 'basics' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <h2 className="text-base font-black text-text-primary">Basic Info</h2>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Display Name</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="input" placeholder="Your name" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Age</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)}
                    className="input" placeholder="25" min={13} max={120} required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Gender</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['male', 'female', 'other'] as Gender[]).map(g => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className="py-3 px-3 rounded-xl text-sm font-bold transition-all capitalize"
                        style={{
                          background: gender === g ? 'linear-gradient(135deg,rgba(108,65,210,0.4),rgba(108,65,210,0.2))' : 'rgba(255,255,255,0.04)',
                          border: gender === g ? '1px solid rgba(108,65,210,0.6)' : '1px solid rgba(255,255,255,0.08)',
                          color: gender === g ? 'rgb(175,135,255)' : 'rgba(170,165,210,0.8)',
                        }}>
                        {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '⚧️ Other'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Metrics */}
            {step === 'metrics' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <h2 className="text-base font-black text-text-primary">Body Metrics</h2>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Height (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                    className="input" placeholder="170" min={100} max={250} required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Current Weight (kg)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                    className="input" placeholder="70" min={30} max={300} step="0.1" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Activity Level</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { value: 'sedentary',    label: '🛋️ Sedentary',   desc: 'Little/no exercise' },
                      { value: 'light',        label: '🚶 Light',        desc: '1–3 days/week'      },
                      { value: 'moderate',     label: '🏃 Moderate',     desc: '3–5 days/week'      },
                      { value: 'active',       label: '💪 Active',       desc: '6–7 days/week'      },
                      { value: 'very_active',  label: '🔥 Very Active',  desc: 'Athlete level'       },
                    ].map(o => (
                      <button key={o.value} type="button" onClick={() => setActivityLevel(o.value as ActivityLevel)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all text-left"
                        style={{
                          background: activityLevel === o.value ? 'linear-gradient(135deg,rgba(108,65,210,0.3),rgba(108,65,210,0.15))' : 'rgba(255,255,255,0.04)',
                          border: activityLevel === o.value ? '1px solid rgba(108,65,210,0.5)' : '1px solid rgba(255,255,255,0.07)',
                          color: activityLevel === o.value ? 'rgb(175,135,255)' : 'rgba(170,165,210,0.8)',
                        }}>
                        <span>{o.label}</span>
                        <span className="text-xs opacity-70">{o.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 'goals' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <h2 className="text-base font-black text-text-primary">Your Goals</h2>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Primary Goal</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([
                      { value: 'lose_weight',     label: '📉 Lose Weight'    },
                      { value: 'gain_weight',     label: '📈 Gain Weight'    },
                      { value: 'maintain_weight', label: '✨ Maintain'        },
                      { value: 'build_muscle',    label: '💪 Build Muscle'   },
                      { value: 'general_fitness', label: '🏃 General Fitness' },
                    ] as { value: FitnessGoal; label: string }[]).map(g => (
                      <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                        className="py-3 px-3 rounded-xl text-sm font-bold transition-all text-left"
                        style={{
                          background: goal === g.value ? 'linear-gradient(135deg,rgba(108,65,210,0.35),rgba(108,65,210,0.18))' : 'rgba(255,255,255,0.04)',
                          border: goal === g.value ? '1px solid rgba(108,65,210,0.55)' : '1px solid rgba(255,255,255,0.07)',
                          color: goal === g.value ? 'rgb(175,135,255)' : 'rgba(170,165,210,0.8)',
                        }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                {goal !== 'maintain_weight' && goal !== 'general_fitness' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-bold text-text-primary mb-2">Target Weight (kg)</label>
                    <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
                      className="input" placeholder="65" min={30} max={300} step="0.1" required />
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-danger rounded-xl px-4 py-2.5"
                style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.25)' }}>
                {error}
              </p>
            )}

            <div className="flex gap-3">
              {step !== 'basics' && (
                <button type="button" onClick={prevStep} className="btn-ghost flex-1 py-3">← Back</button>
              )}
              {step !== 'goals' ? (
                <button type="button" onClick={nextStep} disabled={!canProgress[step]}
                  className="btn-purple flex-1 py-3"
                  style={!canProgress[step] ? { opacity: 0.4 } : {}}>
                  Next →
                </button>
              ) : (
                <button type="submit" disabled={loading || !canProgress.goals} className="btn-purple flex-1 py-3">
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Saving…' : 'Complete Setup 🎉'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
