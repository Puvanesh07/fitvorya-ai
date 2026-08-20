import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { finishWorkout, fetchPersonalRecords } from '../services/workoutService'
import type { SessionExercise, SetEntry, PersonalRecord } from '../types/workout'
import { useRestTimer } from '../hooks/useRestTimer'
import { localTodayISO } from '../utils/format'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function WorkoutSession() {
  const { templateId } = useParams<{ templateId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const uid = profile?.uid ?? ''

  const template = BUILT_IN_TEMPLATES.find(t => t.id === templateId)

  const [exercises, setExercises] = useState<SessionExercise[]>([])
  const [startTime] = useState(Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [newPRs, setNewPRs] = useState<PersonalRecord[]>([])

  const { isRunning: restActive, timeLeft: restSecondsLeft, start: startRest, stop: cancelRest } = useRestTimer()

  useEffect(() => {
    if (!template) return
    setExercises(template.exercises.map(e => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      sets: Array.from({ length: e.defaultSets }, (_, i) => ({
        setNumber: i + 1,
        reps: e.defaultReps,
        weightKg: e.defaultWeightKg,
        completed: false,
      })),
      restSeconds: e.restSeconds,
    })))
  }, [template])

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [startTime])

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-text-secondary">Template not found</p>
        <button onClick={() => navigate('/workout')} className="btn-ghost">← Back to Workouts</button>
      </div>
    )
  }

  function updateSet(exerciseIdx: number, setIdx: number, updates: Partial<SetEntry>) {
    setExercises(prev => {
      const copy = [...prev]
      copy[exerciseIdx] = {
        ...copy[exerciseIdx],
        sets: copy[exerciseIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, ...updates } : s
        ),
      }
      return copy
    })
  }

  function completeSet(exerciseIdx: number, setIdx: number) {
    updateSet(exerciseIdx, setIdx, { completed: true })
    const ex = exercises[exerciseIdx]
    if (ex.restSeconds > 0) startRest(ex.restSeconds)
    const allSetsComplete = exercises[exerciseIdx].sets.every((s, i) =>
      i === setIdx ? true : s.completed
    )
    if (allSetsComplete && exerciseIdx < exercises.length - 1) {
      setTimeout(() => setActiveExerciseIndex(exerciseIdx + 1), 300)
    }
  }

  async function handleFinish() {
    if (!uid || !template) return
    setSaving(true)
    try {
      await finishWorkout(uid, {
        templateId: template.id,
        name: template.name,
        date: localTodayISO(),   // local timezone, not UTC
        startedAt: startTime,
        finishedAt: Date.now(),
        durationSeconds: elapsedSeconds,
        exercises,
        totalVolumeKg: exercises.reduce((sum, ex) =>
          sum + ex.sets.filter(s => s.completed).reduce((s2, set) => s2 + set.weightKg * set.reps, 0), 0
        ),
      })

      const allPRs = await fetchPersonalRecords(uid)
      const todayStr = localTodayISO()
      const todayPRs = allPRs.filter(pr => {
        const prDate = new Date(pr.achievedAt)
        const prDateStr = `${prDate.getFullYear()}-${String(prDate.getMonth() + 1).padStart(2, '0')}-${String(prDate.getDate()).padStart(2, '0')}`
        return prDateStr === todayStr
      })
      
      if (todayPRs.length > 0) setNewPRs(todayPRs)
      setShowCompletion(true)
    } catch (err) {
      console.error('Failed to save workout', err)
    } finally {
      setSaving(false)
    }
  }

  const currentExercise = exercises[activeExerciseIndex]
  const allComplete = exercises.every(ex => ex.sets.every(s => s.completed))
  const completedCount = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-30 bg-surface border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/workout')} className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-surface2 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-text-primary">{template.name}</h1>
              <p className="text-xs text-text-secondary">{formatTime(elapsedSeconds)} · {completedCount}/{totalSets} sets</p>
            </div>
          </div>
          <button onClick={handleFinish} disabled={saving || !allComplete}
            className={`btn-purple py-2 px-5 text-sm ${!allComplete ? 'opacity-50' : ''}`}>
            {saving && <LoadingSpinner size="sm" />}
            Finish
          </button>
        </div>
      </div>

      {restActive && (
        <div className="card-orange mx-4 mt-4 p-4 flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-xs font-semibold text-text-secondary">Rest Timer</p>
            <p className="text-2xl font-black text-text-primary">{restSecondsLeft}s</p>
          </div>
          <button onClick={cancelRest} className="btn-ghost py-2 px-4 text-sm">Skip</button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-4 py-4 scrollbar-hide">
        {exercises.map((ex, i) => {
          const completed = ex.sets.every(s => s.completed)
          return (
            <button key={i} onClick={() => setActiveExerciseIndex(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                i === activeExerciseIndex
                  ? 'bg-purple-600 text-white shadow-lg'
                  : completed
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-surface2 text-text-secondary'
              }`}>
              {ex.exerciseName}
            </button>
          )
        })}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {currentExercise && (
          <div className="card p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-text-primary mb-4">{currentExercise.exerciseName}</h2>

            <div className="flex flex-col gap-3">
              {currentExercise.sets.map((set, setIdx) => (
                <div key={setIdx} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  set.completed
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-border bg-surface2'
                }`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    set.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {set.setNumber}
                  </div>

                  <div className="flex gap-2 flex-1">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1">Reps</label>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(activeExerciseIndex, setIdx, { reps: Number(e.target.value) })}
                        disabled={set.completed}
                        className="input py-2 text-sm w-full"
                        min={0}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={set.weightKg}
                        onChange={(e) => updateSet(activeExerciseIndex, setIdx, { weightKg: Number(e.target.value) })}
                        disabled={set.completed}
                        className="input py-2 text-sm w-full"
                        min={0}
                        step="0.5"
                      />
                    </div>
                  </div>

                  {!set.completed ? (
                    <button onClick={() => completeSet(activeExerciseIndex, setIdx)}
                      className="btn-purple py-2 px-4 text-sm flex-shrink-0">
                      ✓
                    </button>
                  ) : (
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-500 text-white flex-shrink-0">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {exercises.map((ex, exIdx) => (
            exIdx !== activeExerciseIndex && (
              <div key={exIdx} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-text-primary">{ex.exerciseName}</h3>
                  <span className="text-xs text-text-secondary">
                    {ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets
                  </span>
                </div>
                <div className="flex gap-2">
                  {ex.sets.map((s, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full transition-all ${
                      s.completed ? 'bg-green-500' : 'bg-border'
                    }`} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) navigate('/workout') }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => navigate('/workout')} />
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="card p-8 text-center">
              <div className="h-20 w-20 rounded-full gradient-brand flex items-center justify-center text-white text-4xl mx-auto mb-4 animate-float">
                🎉
              </div>
              <h2 className="text-2xl font-black text-text-primary mb-2">Workout Complete!</h2>
              <p className="text-sm text-text-secondary mb-5">
                Great job! You completed {template.name} in {formatTime(elapsedSeconds)}.
              </p>

              {newPRs.length > 0 && (
                <div className="card-yellow p-4 mb-5">
                  <p className="text-xs font-bold text-text-secondary mb-2">🏆 New Personal Records!</p>
                  {newPRs.map((pr, i) => (
                    <p key={i} className="text-sm font-semibold text-text-primary">
                      {pr.exerciseName}: {pr.weightKg}kg × {pr.reps} reps
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="card-purple p-4">
                  <p className="text-xs text-text-secondary">Total Sets</p>
                  <p className="text-2xl font-black text-text-primary">{completedCount}</p>
                </div>
                <div className="card-green p-4">
                  <p className="text-xs text-text-secondary">Volume</p>
                  <p className="text-2xl font-black text-text-primary">
                    {Math.round(exercises.reduce((sum, ex) =>
                      sum + ex.sets.filter(s => s.completed).reduce((s2, set) => s2 + set.weightKg * set.reps, 0), 0
                    ))}kg
                  </p>
                </div>
              </div>

              <button onClick={() => navigate('/workout')} className="btn-purple w-full py-3">
                Back to Workouts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
