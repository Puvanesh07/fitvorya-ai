import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { saveNewProfile } from '../services/userService'
import LoadingSpinner from '../components/LoadingSpinner'
import ThemeToggle from '../components/ThemeToggle'
import type { Gender, FitnessGoal, ActivityLevel } from '../types/user'
import { GOAL_LABELS, ACTIVITY_LABELS } from '../types/user'

const GOALS: { value: FitnessGoal; icon: string; desc: string }[] = [
  { value: 'lose_weight',     icon: '📉', desc: 'Burn fat, get lean' },
  { value: 'gain_weight',     icon: '📈', desc: 'Build mass, get bigger' },
  { value: 'build_muscle',    icon: '💪', desc: 'Lean bulk, stay athletic' },
  { value: 'maintain_weight', icon: '⚖️', desc: 'Stay at current weight' },
  { value: 'general_fitness', icon: '🏃', desc: 'Just stay healthy' },
]

const ACTIVITIES: { value: ActivityLevel; icon: string }[] = [
  { value: 'sedentary',   icon: '🛋️' },
  { value: 'light',       icon: '🚶' },
  { value: 'moderate',    icon: '🏋️' },
  { value: 'active',      icon: '🚴' },
  { value: 'very_active', icon: '🔥' },
]

const TOTAL_STEPS = 3

const STEP_INFO = [
  { title: 'About you',    subtitle: 'We use this to calculate your daily needs.', icon: '👤' },
  { title: 'Your weight',  subtitle: 'Tell us where you are and where you want to be.', icon: '⚖️' },
  { title: 'Your goal',    subtitle: 'Pick your goal and activity level.', icon: '🎯' },
]

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [animDir, setAnimDir] = useState<'right' | 'left'>('right')

  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [goal, setGoal] = useState<FitnessGoal>('lose_weight')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')

  function validateStep(): string {
    if (step === 0) {
      if (!age || Number(age) < 10 || Number(age) > 120) return 'Enter a valid age (10–120).'
      if (!height || Number(height) < 100 || Number(height) > 250) return 'Enter height in cm (100–250).'
    }
    if (step === 1) {
      if (!weight || Number(weight) < 20 || Number(weight) > 400) return 'Enter a valid weight (20–400 kg).'
      if (!targetWeight || Number(targetWeight) < 20 || Number(targetWeight) > 400) return 'Enter a valid target weight.'
    }
    return ''
  }

  function goNext(e: FormEvent) {
    e.preventDefault()
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setAnimDir('right')
    setStep((s) => s + 1)
  }

  function goBack() {
    setError('')
    setAnimDir('left')
    setStep((s) => s - 1)
  }

  async function handleFinish(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await saveNewProfile(user, {
        displayName: user.displayName ?? 'User',
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        targetWeight: Number(targetWeight),
        goal,
        activityLevel,
        weightUnit: 'kg',
        onboardingComplete: true,
      })
      await refreshProfile()
      navigate('/dashboard')
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const animClass = animDir === 'right' ? 'animate-slide-right' : 'animate-slide-left'

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="mesh-bg" />

      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="font-bold gradient-text">FitvoryaAI</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEP_INFO.map((_s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < step ? 'gradient-brand text-white' :
                    i === step ? 'gradient-brand text-white shadow-lg glow-sm' :
                    'bg-surface2 text-text-secondary border border-border'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < TOTAL_STEPS - 1 && (
                    <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-border" style={{ width: '60px' }}>
                      <div className={`h-full gradient-brand transition-all duration-500 ${i < step ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary">{STEP_INFO[step].icon} {STEP_INFO[step].title}</h1>
              <p className="text-sm text-text-secondary mt-1">{STEP_INFO[step].subtitle}</p>
            </div>
          </div>

          <div className={`card p-6 sm:p-8 ${animClass} opacity-0`} style={{ animationFillMode: 'forwards' }} key={step}>

            {/* ── Step 0: Personal ── */}
            {step === 0 && (
              <form onSubmit={goNext} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Age</label>
                  <input type="number" min={10} max={120} value={age} onChange={(e) => setAge(e.target.value)} className="input" placeholder="25" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['male', 'female', 'other'] as Gender[]).map((g) => (
                      <button
                        key={g} type="button" onClick={() => setGender(g)}
                        className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all duration-200 ${
                          gender === g
                            ? 'border-brand bg-brand-light text-brand shadow-sm'
                            : 'border-border bg-surface2 text-text-secondary hover:border-brand/40'
                        }`}
                      >
                        {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Height (cm)</label>
                  <div className="relative">
                    <input type="number" min={100} max={250} value={height} onChange={(e) => setHeight(e.target.value)} className="input pr-12" placeholder="175" required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium">cm</span>
                  </div>
                </div>

                {error && <p role="alert" className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}
                <button type="submit" className="btn-primary w-full mt-1">Continue →</button>
              </form>
            )}

            {/* ── Step 1: Weight ── */}
            {step === 1 && (
              <form onSubmit={goNext} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Current weight</label>
                  <div className="relative">
                    <input type="number" step="0.1" min={20} max={400} value={weight} onChange={(e) => setWeight(e.target.value)} className="input pr-10" placeholder="78.0" required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium">kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Target weight</label>
                  <div className="relative">
                    <input type="number" step="0.1" min={20} max={400} value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="input pr-10" placeholder="70.0" required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium">kg</span>
                  </div>
                </div>

                {weight && targetWeight && Number(weight) > 0 && Number(targetWeight) > 0 && (
                  <div className="rounded-xl bg-brand-light border border-brand/20 p-4 animate-fade-in">
                    <p className="text-sm text-brand font-medium">
                      {Number(weight) > Number(targetWeight)
                        ? `📉 ${(Number(weight) - Number(targetWeight)).toFixed(1)} kg to lose`
                        : Number(weight) < Number(targetWeight)
                        ? `📈 ${(Number(targetWeight) - Number(weight)).toFixed(1)} kg to gain`
                        : '✅ Already at target weight!'}
                    </p>
                  </div>
                )}

                {error && <p role="alert" className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={goBack} className="btn-ghost flex-1">← Back</button>
                  <button type="submit" className="btn-primary flex-1">Continue →</button>
                </div>
              </form>
            )}

            {/* ── Step 2: Goal + Activity ── */}
            {step === 2 && (
              <form onSubmit={handleFinish} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Fitness goal</label>
                  <div className="flex flex-col gap-2">
                    {GOALS.map(({ value, icon, desc }) => (
                      <button
                        key={value} type="button" onClick={() => setGoal(value)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                          goal === value
                            ? 'border-brand bg-brand-light shadow-sm'
                            : 'border-border bg-surface2 hover:border-brand/40'
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${goal === value ? 'text-brand' : 'text-text-primary'}`}>{GOAL_LABELS[value]}</p>
                          <p className="text-xs text-text-secondary">{desc}</p>
                        </div>
                        {goal === value && <span className="ml-auto text-brand text-sm">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Activity level</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ACTIVITIES.map(({ value, icon }) => (
                      <button
                        key={value} type="button" onClick={() => setActivityLevel(value)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all duration-200 ${
                          activityLevel === value
                            ? 'border-brand bg-brand-light text-brand'
                            : 'border-border bg-surface2 text-text-secondary hover:border-brand/40'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        <span className="text-[10px] leading-tight text-center capitalize">{value.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary mt-2 text-center">{ACTIVITY_LABELS[activityLevel]}</p>
                </div>

                {error && <p role="alert" className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={goBack} className="btn-ghost flex-1">← Back</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving && <LoadingSpinner size="sm" />}
                    {saving ? 'Setting up...' : '🚀 Start tracking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
