import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Gender, ActivityLevel, FitnessGoal } from '../types'

const STEPS = ['basics', 'metrics', 'goals'] as const
type Step = typeof STEPS[number]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('basics')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('other')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<FitnessGoal>('maintain_weight')
  const [targetWeight, setTargetWeight] = useState('')

  const canProgress = {
    basics: displayName.trim().length > 0 && age && gender,
    metrics: height && weight,
    goals: goal && (goal === 'maintain_weight' || targetWeight),
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        goal,
        // Store starting weight once at onboarding for real progress tracking
        startingWeight: Number(weight),
        targetWeight: targetWeight ? Number(targetWeight) : undefined,
        onboardingComplete: true,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function nextStep() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function prevStep() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-20 left-20 orb orb-purple h-80 w-80 opacity-15 animate-orb-pulse blur-3xl" />
      <div className="absolute bottom-20 right-20 orb orb-pink h-96 w-96 opacity-10 animate-orb-pulse blur-3xl" style={{ animationDelay: '2s' }} />

      {/* Form card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="card p-8 card-shadow">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-xl">
              F
            </div>
            <h1 className="text-2xl font-black text-text-primary mb-2">Complete Your Profile</h1>
            <p className="text-sm text-text-secondary">Help us personalize your experience</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => {
              const active = STEPS.indexOf(step) >= i
              return (
                <div key={s} className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full gradient-brand transition-all duration-500 ${active ? 'w-full' : 'w-0'}`}
                  />
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Step 1: Basics */}
            {step === 'basics' && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-bold text-text-primary mb-4">Basic Info</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="input"
                      placeholder="25"
                      min={13}
                      max={120}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Gender</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['male', 'female', 'other'] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all capitalize ${
                            gender === g
                              ? 'gradient-brand text-white shadow-lg border-2 border-purple-400'
                              : 'bg-surface2 text-text-secondary border-2 border-border hover:border-purple-300'
                          }`}
                        >
                          {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '⚧️ Other'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Metrics */}
            {step === 'metrics' && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-bold text-text-primary mb-4">Body Metrics</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="input"
                      placeholder="170"
                      min={100}
                      max={250}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Current Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="input"
                      placeholder="70"
                      min={30}
                      max={300}
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Activity Level</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { value: 'sedentary', label: '🛋️ Sedentary', desc: 'Little/no exercise' },
                        { value: 'light', label: '🚶 Light', desc: '1-3 days/week' },
                        { value: 'moderate', label: '🏃 Moderate', desc: '3-5 days/week' },
                        { value: 'active', label: '💪 Active', desc: '6-7 days/week' },
                        { value: 'very_active', label: '🔥 Very Active', desc: 'Athlete level' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setActivityLevel(option.value as ActivityLevel)}
                          className={`text-left py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                            activityLevel === option.value
                              ? 'gradient-brand text-white shadow-lg border-2 border-purple-400'
                              : 'bg-surface2 text-text-secondary border-2 border-border hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            <span className={`text-xs ${activityLevel === option.value ? 'text-white/80' : 'text-text-tertiary'}`}>
                              {option.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 'goals' && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-bold text-text-primary mb-4">Your Goals</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Primary Goal</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['lose_weight', 'maintain_weight', 'gain_weight'] as FitnessGoal[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGoal(g)}
                          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                            goal === g
                              ? 'gradient-brand text-white shadow-lg border-2 border-purple-400'
                              : 'bg-surface2 text-text-secondary border-2 border-border hover:border-purple-300'
                          }`}
                        >
                          <div className="text-center">
                            {g === 'lose_weight' ? '📉 Lose' : g === 'maintain_weight' ? '✨ Maintain' : '📈 Gain'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {goal !== 'maintain_weight' && (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-semibold text-text-primary mb-2">Target Weight (kg)</label>
                      <input
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        className="input"
                        placeholder="65"
                        min={30}
                        max={300}
                        step="0.1"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-4">
              {step !== 'basics' && (
                <button type="button" onClick={prevStep} className="btn-ghost flex-1 py-2.5">
                  ← Back
                </button>
              )}
              {step !== 'goals' ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProgress[step]}
                  className="btn-purple flex-1 py-2.5"
                >
                  Next →
                </button>
              ) : (
                <button type="submit" disabled={loading || !canProgress.goals} className="btn-purple flex-1 py-2.5">
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
