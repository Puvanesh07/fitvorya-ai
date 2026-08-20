import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { useRestTimer } from '../hooks/useRestTimer'
import { useUnit } from '../hooks/useUnit'
import { finishWorkout, sessionVolume, formatDuration } from '../services/workoutService'
import { TEMPLATE_MAP } from '../data/templates'
import { EXERCISES } from '../data/exercises'
import type { SessionExercise, SetEntry, PersonalRecord } from '../types/workout'
import { todayISO } from '../utils/format'
import { displayToKg, kgToDisplay } from '../hooks/useUnit'

// ── Rest Timer overlay ────────────────────────────────────────────────────────
function RestTimerBar({
  timeLeft, total, isRunning, isMuted, onSkip, onToggleMute,
}: {
  timeLeft: number; total: number; isRunning: boolean; isMuted: boolean;
  onSkip: () => void; onToggleMute: () => void;
}) {
  if (!isRunning && timeLeft === 0) return null
  const pct = total > 0 ? Math.round(((total - timeLeft) / total) * 100) : 0
  const urgent = timeLeft <= 5 && timeLeft > 0

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 px-4 py-3 animate-fade-up transition-colors ${urgent ? 'bg-coral-50/80 dark:bg-coral-50/10' : ''}`}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <span className="text-sm font-semibold text-text-primary">Rest Timer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleMute}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-teal-700 hover:text-teal-700 transition-all text-sm"
              aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button onClick={onSkip}
              className="btn-ghost py-1.5 px-3 text-xs">
              Skip →
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`stat-number text-2xl min-w-[3rem] ${urgent ? 'text-coral-500 animate-pulse' : 'text-teal-700'}`}>
            {timeLeft}s
          </div>
          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-coral-400' : 'gradient-brand'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-text-secondary">{total}s</span>
        </div>
      </div>
    </div>
  )
}

// ── PR Celebration ────────────────────────────────────────────────────────────
function PRCelebration({ prs, onDismiss }: { prs: PersonalRecord[]; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative card p-8 max-w-sm w-full text-center animate-scale-in">
        <div className="text-6xl mb-4 animate-float">🏆</div>
        <h2 className="text-2xl font-bold font-display gradient-text mb-2">Personal Record!</h2>
        <p className="text-text-secondary text-sm mb-5">You crushed your previous best!</p>
        {prs.map(pr => (
          <div key={pr.exerciseId} className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-700/20 p-4 mb-3">
            <p className="font-bold text-text-primary">{pr.exerciseName}</p>
            <p className="text-teal-700 font-semibold text-lg mt-1">
              {pr.weightKg}kg × {pr.reps} reps
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Est. 1RM: <strong>{pr.oneRepMaxKg}kg</strong>
            </p>
          </div>
        ))}
        <button onClick={onDismiss} className="btn-primary w-full mt-2">
          🎉 Keep going!
        </button>
      </div>
    </div>
  )
}

// ── Set row ───────────────────────────────────────────────────────────────────
function SetRow({
  set, exIdx, setIdx, unit, onChange, onComplete, onStartRest, restSecs,
}: {
  set: SetEntry; exIdx: number; setIdx: number;
  unit: 'kg' | 'lbs';
  onChange: (exIdx: number, setIdx: number, field: 'weightKg' | 'reps', val: number) => void;
  onComplete: (exIdx: number, setIdx: number) => void;
  onStartRest: (secs: number) => void;
  restSecs: number;
}) {
  const displayWeight = kgToDisplay(set.weightKg, unit)

  return (
    <div className={`flex items-center gap-2 sm:gap-3 py-2.5 border-b border-border/50 last:border-0 transition-colors rounded-lg px-2 ${set.completed ? 'bg-teal-50 dark:bg-teal-900/15' : ''}`}>
      <span className={`w-6 text-center text-xs font-bold ${set.completed ? 'text-teal-700' : 'text-text-muted'}`}>
        {set.setNumber}
      </span>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          min={0}
          step={unit === 'lbs' ? 2.5 : 0.5}
          value={displayWeight || ''}
          onChange={e => onChange(exIdx, setIdx, 'weightKg', displayToKg(Number(e.target.value), unit))}
          className="w-16 sm:w-20 input py-1.5 px-2 text-center text-sm"
          placeholder="0"
          disabled={set.completed}
        />
        <span className="text-xs text-text-muted">{unit}</span>
      </div>
      <span className="text-text-muted">×</span>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          min={0}
          value={set.reps || ''}
          onChange={e => onChange(exIdx, setIdx, 'reps', Number(e.target.value))}
          className="w-14 sm:w-16 input py-1.5 px-2 text-center text-sm"
          placeholder="0"
          disabled={set.completed}
        />
        <span className="text-xs text-text-muted">reps</span>
      </div>
      <button
        onClick={() => {
          if (!set.completed) {
            onComplete(exIdx, setIdx)
            onStartRest(restSecs)
          }
        }}
        className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 ${
          set.completed
            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 cursor-default'
            : 'border border-border hover:border-teal-700 hover:bg-teal-50 text-text-muted hover:text-teal-700'
        }`}
        aria-label={set.completed ? 'Completed' : 'Mark complete'}
      >
        {set.completed ? '✓' : '○'}
      </button>
    </div>
  )
}

// ── Main Session page ─────────────────────────────────────────────────────────
export default function WorkoutSession() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { unit } = useUnit()
  const restTimer = useRestTimer()

  const uid = profile?.uid ?? ''
  const startedAt = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [newPRs, setNewPRs] = useState<PersonalRecord[]>([])
  const [showFinish, setShowFinish] = useState(false)
  const [workoutName, setWorkoutName] = useState('My Workout')
  const [exercises, setExercises] = useState<SessionExercise[]>([])
  const [showExLib, setShowExLib] = useState(false)
  const [exSearch, setExSearch] = useState('')

  // Build session from template or empty
  useEffect(() => {
    if (!templateId || templateId === 'new' || templateId === 'custom') {
      setWorkoutName('Custom Workout')
      setExercises([])
      return
    }
    const tpl = TEMPLATE_MAP.get(templateId)
    if (!tpl) { navigate('/workout'); return }
    setWorkoutName(tpl.name)
    setExercises(tpl.exercises.map(te => ({
      exerciseId:   te.exerciseId,
      exerciseName: te.exerciseName,
      restSeconds:  te.restSeconds,
      sets: Array.from({ length: te.defaultSets }, (_, i) => ({
        setNumber:  i + 1,
        weightKg:   te.defaultWeightKg,
        reps:       te.defaultReps,
        completed:  false,
      })),
    })))
  }, [templateId])

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  function updateSet(exIdx: number, setIdx: number, field: 'weightKg' | 'reps', val: number) {
    setExercises(prev => prev.map((ex, ei) => ei !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, [field]: val }),
    }))
  }

  function completeSet(exIdx: number, setIdx: number) {
    setExercises(prev => prev.map((ex, ei) => ei !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, completed: true }),
    }))
  }

  function addSet(exIdx: number) {
    setExercises(prev => prev.map((ex, ei) => ei !== exIdx ? ex : {
      ...ex,
      sets: [...ex.sets, {
        setNumber: ex.sets.length + 1,
        weightKg: ex.sets.at(-1)?.weightKg ?? 0,
        reps:     ex.sets.at(-1)?.reps     ?? 10,
        completed: false,
      }],
    }))
  }

  function removeExercise(exIdx: number) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx))
  }

  function addExercise(ex: typeof EXERCISES[0]) {
    setExercises(prev => [...prev, {
      exerciseId:   ex.id,
      exerciseName: ex.name,
      restSeconds:  90,
      sets: [{ setNumber: 1, weightKg: 0, reps: 10, completed: false }],
    }])
    setShowExLib(false)
  }

  async function handleFinish() {
    if (!uid) return
    setSaving(true)
    restTimer.stop()
    const now = Date.now()
    const volKg = sessionVolume(exercises)
    try {
      const { newPRs: prs } = await finishWorkout(uid, {
        templateId: templateId !== 'new' && templateId !== 'custom' ? templateId : undefined,
        name: workoutName,
        date: todayISO(),
        startedAt: startedAt.current,
        finishedAt: now,
        durationSeconds: elapsed,
        exercises,
        totalVolumeKg: volKg,
      })
      if (prs.length > 0) {
        setNewPRs(prs)
      } else {
        navigate('/workout')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const completedSets = exercises.flatMap(e => e.sets).filter(s => s.completed).length
  const totalSets     = exercises.flatMap(e => e.sets).length
  const volKg         = sessionVolume(exercises)

  const filteredEx = exSearch.trim().length > 0
    ? EXERCISES.filter(e => e.name.toLowerCase().includes(exSearch.toLowerCase()))
    : EXERCISES

  return (
    <div className="min-h-screen bg-bg">
      <div className="mesh-bg" />

      {/* Session header */}
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/workout')} className="btn-ghost py-1.5 px-3 text-sm">
            ← Back
          </button>
          <input
            value={workoutName}
            onChange={e => setWorkoutName(e.target.value)}
            className="flex-1 bg-transparent text-center font-bold font-display text-text-primary focus:outline-none text-sm sm:text-base"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary hidden sm:block">{formatDuration(elapsed)}</span>
            <button
              onClick={() => setShowFinish(true)}
              disabled={saving || completedSets === 0}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              {saving ? <LoadingSpinner size="sm" /> : 'Finish'}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-border">
          <div
            className="h-full gradient-brand transition-all duration-500"
            style={{ width: totalSets > 0 ? `${(completedSets / totalSets) * 100}%` : '0%' }}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-5 pb-32">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Duration',  value: formatDuration(elapsed),       icon: '⏱️' },
            { label: 'Sets Done', value: `${completedSets}/${totalSets}`, icon: '✅' },
            { label: 'Volume',    value: `${Math.round(volKg)}kg`,       icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <span className="text-lg">{s.icon}</span>
              <p className="stat-number text-base text-text-primary mt-1">{s.value}</p>
              <p className="text-[10px] text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Exercises */}
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-4xl animate-float">🏋️</span>
            <p className="text-text-secondary text-sm">No exercises yet.</p>
            <button onClick={() => setShowExLib(true)} className="btn-primary py-2.5 px-6">
              + Add Exercise
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {exercises.map((ex, ei) => {
              const doneSets = ex.sets.filter(s => s.completed).length
              return (
                <div key={`${ex.exerciseId}-${ei}`} className="card overflow-hidden animate-fade-up opacity-0"
                  style={{ animationFillMode: 'forwards', animationDelay: `${ei * 60}ms` }}>
                  {/* Exercise header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface2">
                    <div>
                      <p className="font-bold font-display text-text-primary text-sm sm:text-base">{ex.exerciseName}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {doneSets}/{ex.sets.length} sets · Rest {ex.restSeconds}s
                      </p>
                    </div>
                    <button onClick={() => removeExercise(ei)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger transition-colors text-xs">
                      ✕
                    </button>
                  </div>

                  {/* Set header */}
                  <div className="flex items-center gap-2 sm:gap-3 px-4 py-2 text-xs text-text-muted font-semibold uppercase tracking-wider bg-surface2/50">
                    <span className="w-6 text-center">#</span>
                    <span className="flex-1">Weight</span>
                    <span className="w-4" />
                    <span className="flex-1">Reps</span>
                    <span className="w-9" />
                  </div>

                  {/* Sets */}
                  <div className="px-2">
                    {ex.sets.map((set, si) => (
                      <SetRow
                        key={si}
                        set={set} exIdx={ei} setIdx={si} unit={unit}
                        onChange={updateSet}
                        onComplete={completeSet}
                        onStartRest={restTimer.start}
                        restSecs={ex.restSeconds}
                      />
                    ))}
                  </div>

                  {/* Add set */}
                  <button
                    onClick={() => addSet(ei)}
                    className="w-full py-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-t border-border"
                  >
                    + Add Set
                  </button>
                </div>
              )
            })}

            <button onClick={() => setShowExLib(true)} className="btn-ghost w-full py-3">
              + Add Exercise
            </button>
          </div>
        )}
      </main>

      {/* Rest timer bar */}
      <RestTimerBar
        timeLeft={restTimer.timeLeft}
        total={restTimer.timeLeft > 0 ? restTimer.timeLeft + (restTimer.progress * restTimer.timeLeft / (100 - restTimer.progress || 1)) : 0}
        isRunning={restTimer.isRunning}
        isMuted={restTimer.isMuted}
        onSkip={restTimer.stop}
        onToggleMute={restTimer.toggleMute}
      />

      {/* Exercise library modal */}
      {showExLib && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowExLib(false) }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExLib(false)} />
          <div className="relative w-full max-w-lg animate-scale-in">
            <div className="card p-5 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold font-display text-text-primary">Exercise Library</h2>
                <button onClick={() => setShowExLib(false)}
                  className="h-7 w-7 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-secondary transition-colors">✕</button>
              </div>
              <input
                type="text"
                value={exSearch}
                onChange={e => setExSearch(e.target.value)}
                className="input mb-3"
                placeholder="Search exercises…"
                autoFocus
              />
              <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                {filteredEx.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="text-left px-3 py-3 rounded-xl hover:bg-surface2 transition-colors border border-transparent hover:border-border"
                  >
                    <p className="text-sm font-semibold text-text-primary">{ex.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5 capitalize">
                      {ex.muscleGroup.replace('_', ' ')} · {ex.equipment.replace('_', ' ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finish confirm modal */}
      {showFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowFinish(false) }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFinish(false)} />
          <div className="relative w-full max-w-sm animate-scale-in">
            <div className="card p-6">
              <h2 className="font-bold font-display text-text-primary text-lg mb-2">Finish Workout?</h2>
              <div className="rounded-xl bg-surface2 p-4 mb-5 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="stat-number text-lg text-teal-700">{formatDuration(elapsed)}</p>
                  <p className="text-xs text-text-secondary">Duration</p>
                </div>
                <div>
                  <p className="stat-number text-lg text-text-primary">{completedSets}</p>
                  <p className="text-xs text-text-secondary">Sets</p>
                </div>
                <div>
                  <p className="stat-number text-lg text-coral-400">{Math.round(volKg)}</p>
                  <p className="text-xs text-text-secondary">Vol (kg)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowFinish(false)} className="btn-ghost flex-1">Keep going</button>
                <button onClick={() => { setShowFinish(false); handleFinish() }} disabled={saving} className="btn-primary flex-1">
                  {saving ? <LoadingSpinner size="sm" /> : '🏁 Save workout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PR celebration */}
      {newPRs.length > 0 && (
        <PRCelebration prs={newPRs} onDismiss={() => navigate('/workout')} />
      )}
    </div>
  )
}
