import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import WorkoutAnimation from '../components/WorkoutAnimation'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { finishWorkout, fetchPersonalRecords } from '../services/workoutService'
import type { SessionExercise, SetEntry, PersonalRecord } from '../types/workout'
import { useRestTimer } from '../hooks/useRestTimer'
import { localTodayISO } from '../utils/format'

function formatTime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function draftKey(uid: string, tplId: string) { return `workout_draft_${uid}_${tplId}` }
interface WorkoutDraft { exercises: SessionExercise[]; startTime: number; activeExerciseIndex: number }

export default function WorkoutSession() {
  const { templateId } = useParams<{ templateId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const uid = profile?.uid ?? ''
  const template = BUILT_IN_TEMPLATES.find(t => t.id === templateId)
  const storageKey = uid && templateId ? draftKey(uid, templateId) : null

  const savedDraft = storageKey ? (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null') as WorkoutDraft | null }
    catch { return null }
  })() : null

  const [exercises, setExercises] = useState<SessionExercise[]>(savedDraft?.exercises ?? [])
  const [startTime] = useState<number>(savedDraft?.startTime ?? Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [activeIdx, setActiveIdx] = useState(savedDraft?.activeExerciseIndex ?? 0)
  const [saving, setSaving] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [newPRs, setNewPRs] = useState<PersonalRecord[]>([])

  const { isRunning: restActive, timeLeft: restLeft, start: startRest, stop: cancelRest } = useRestTimer()

  useEffect(() => {
    if (!template || savedDraft) return
    setExercises(template.exercises.map(e => ({
      exerciseId: e.exerciseId, exerciseName: e.exerciseName, restSeconds: e.restSeconds,
      sets: Array.from({ length: e.defaultSets }, (_, i) => ({
        setNumber: i + 1, reps: e.defaultReps, weightKg: e.defaultWeightKg, completed: false,
      })),
    })))
  }, [template])

  useEffect(() => {
    if (!storageKey || exercises.length === 0) return
    localStorage.setItem(storageKey, JSON.stringify({ exercises, startTime, activeExerciseIndex: activeIdx }))
  }, [exercises, activeIdx])

  useEffect(() => {
    const iv = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [startTime])

  if (!template) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <p className="text-text-secondary">Template not found</p>
      <button onClick={() => navigate('/workout')} className="btn-ghost">← Back</button>
    </div>
  )

  function updateSet(eIdx: number, sIdx: number, u: Partial<SetEntry>) {
    setExercises(prev => { const c = [...prev]; c[eIdx] = { ...c[eIdx], sets: c[eIdx].sets.map((s,i) => i===sIdx?{...s,...u}:s) }; return c })
  }

  function completeSet(eIdx: number, sIdx: number) {
    updateSet(eIdx, sIdx, { completed: true })
    const ex = exercises[eIdx]
    if (ex.restSeconds > 0) startRest(ex.restSeconds)
    const allDone = exercises[eIdx].sets.every((s,i) => i===sIdx ? true : s.completed)
    if (allDone && eIdx < exercises.length - 1) setTimeout(() => setActiveIdx(eIdx + 1), 400)
  }

  async function handleFinish() {
    if (!uid || !template) return
    setSaving(true)
    try {
      await finishWorkout(uid, {
        templateId: template.id, name: template.name, date: localTodayISO(),
        startedAt: startTime, finishedAt: Date.now(), durationSeconds: elapsedSeconds,
        exercises,
        totalVolumeKg: exercises.reduce((s,ex) => s + ex.sets.filter(x=>x.completed).reduce((s2,set)=>s2+set.weightKg*set.reps,0), 0),
      })
      if (storageKey) localStorage.removeItem(storageKey)
      const todayStr = localTodayISO()
      const allPRs = await fetchPersonalRecords(uid)
      const todayPRs = allPRs.filter(pr => {
        const d = new Date(pr.achievedAt)
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === todayStr
      })
      if (todayPRs.length > 0) setNewPRs(todayPRs)
      setShowCompletion(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const currentEx = exercises[activeIdx]
  const allComplete = exercises.every(ex => ex.sets.every(s => s.completed))
  const doneCount = exercises.reduce((s,ex) => s + ex.sets.filter(x=>x.completed).length, 0)
  const totalSets = exercises.reduce((s,ex) => s + ex.sets.length, 0)
  const progress = totalSets > 0 ? Math.round((doneCount / totalSets) * 100) : 0

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { if (storageKey) localStorage.removeItem(storageKey); navigate('/workout') }}
            className="h-9 w-9 rounded-xl border border-border hover:bg-surface2 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Back"
          >
            <svg className="h-4 w-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold text-text-primary truncate">{template.name}</h1>
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            {/* Overall progress bar */}
            <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">{doneCount}/{totalSets} sets · {progress}% complete</p>
          </div>

          <button
            onClick={handleFinish}
            disabled={saving || !allComplete}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              allComplete
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-surface2 text-text-muted cursor-not-allowed'
            }`}
          >
            {saving ? <LoadingSpinner size="sm" /> : allComplete ? '🎉 Finish' : 'Finish'}
          </button>
        </div>
      </div>

      {/* ── Rest timer banner ── */}
      {restActive && (
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="text-xs font-bold text-orange-100">Rest Time</p>
                <p className="text-3xl font-black text-white leading-none">{restLeft}s</p>
              </div>
            </div>
            <button onClick={cancelRest} className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition-colors">
              Skip →
            </button>
          </div>
        </div>
      )}

      {/* ── Exercise tab bar ── */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {exercises.map((ex, i) => {
          const isActive = i === activeIdx
          const isDone   = ex.sets.every(s => s.completed)
          const done     = ex.sets.filter(s => s.completed).length
          const total    = ex.sets.length

          return (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 flex flex-col gap-1 px-3.5 py-2.5 rounded-2xl transition-all duration-200 border ${
                isActive
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : isDone
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-border bg-surface2 hover:border-purple-300'
              }`}
              style={{
                minWidth: 100,
                background: isActive
                  ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
                  : undefined,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">
                  {isDone ? '✅' : isActive ? '⚡' : '○'}
                </span>
                <span className={`text-[11px] font-bold truncate max-w-[80px] ${
                  isActive ? 'text-white' : isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-text-primary'
                }`}>
                  {ex.exerciseName}
                </span>
              </div>
              <div className={`h-1 w-full rounded-full ${isActive ? 'bg-white/25' : 'bg-border'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isActive ? 'bg-white' : isDone ? 'bg-emerald-500' : 'bg-purple-400'
                  }`}
                  style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                />
              </div>
              <span className={`text-[9px] font-semibold ${
                isActive ? 'text-white/70' : 'text-text-muted'
              }`}>
                {done}/{total} sets
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-4 pb-24">

        {/* Active exercise card */}
        {currentEx && (
          <div className="card card-shadow mb-5 overflow-hidden animate-fade-in">
            {/* Card header gradient band */}
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-purple-400 to-pink-500" />
            <div className="p-5">
              {/* Exercise name + animation */}
              <div className="mb-4">
                <h2 className="text-lg font-black text-text-primary mb-0.5">{currentEx.exerciseName}</h2>
                <p className="text-xs text-text-muted">
                  {currentEx.sets.filter(s=>s.completed).length}/{currentEx.sets.length} sets complete
                </p>
              </div>

              {/* Animation + Instructions */}
              <div className="mb-5 p-4 bg-surface2 rounded-2xl border border-border">
                <WorkoutAnimation
                  gender={profile?.gender}
                  exerciseName={currentEx.exerciseName}
                  exerciseId={currentEx.exerciseId}
                />
              </div>

              {/* Set rows */}
              <div className="flex flex-col gap-2.5">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 px-2">
                  <div className="col-span-2 text-[10px] font-bold text-text-muted text-center">SET</div>
                  <div className="col-span-4 text-[10px] font-bold text-text-muted text-center">REPS</div>
                  <div className="col-span-4 text-[10px] font-bold text-text-muted text-center">KG</div>
                  <div className="col-span-2" />
                </div>

                {currentEx.sets.map((set, sIdx) => (
                  <div
                    key={sIdx}
                    className={`grid grid-cols-12 gap-2 items-center px-2 py-2.5 rounded-xl border transition-all duration-300 ${
                      set.completed
                        ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-300 dark:border-emerald-800'
                        : 'bg-surface border-border'
                    }`}
                  >
                    {/* Set number */}
                    <div className="col-span-2 flex justify-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        set.completed
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 text-purple-700 dark:text-purple-300'
                      }`}>
                        {set.completed
                          ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          : set.setNumber
                        }
                      </div>
                    </div>

                    {/* Reps input */}
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => updateSet(activeIdx, sIdx, { reps: Number(e.target.value) })}
                        disabled={set.completed}
                        className={`input py-2 text-sm text-center font-bold w-full ${set.completed ? 'opacity-60' : ''}`}
                        min={0}
                      />
                    </div>

                    {/* Weight input */}
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={set.weightKg}
                        onChange={e => updateSet(activeIdx, sIdx, { weightKg: Number(e.target.value) })}
                        disabled={set.completed}
                        className={`input py-2 text-sm text-center font-bold w-full ${set.completed ? 'opacity-60' : ''}`}
                        min={0} step="0.5"
                      />
                    </div>

                    {/* Complete button */}
                    <div className="col-span-2 flex justify-center">
                      {!set.completed ? (
                        <button
                          onClick={() => completeSet(activeIdx, sIdx)}
                          className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 text-white text-base font-bold hover:from-purple-700 hover:to-purple-500 transition-all shadow-md shadow-purple-500/30 flex items-center justify-center"
                        >
                          ✓
                        </button>
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other exercises summary */}
        {exercises.length > 1 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">All Exercises</p>
            {exercises.map((ex, exIdx) => (
              <button
                key={exIdx}
                onClick={() => setActiveIdx(exIdx)}
                className={`card p-4 text-left transition-all w-full ${
                  exIdx === activeIdx
                    ? 'border-purple-400 dark:border-purple-600 ring-1 ring-purple-400/30'
                    : 'hover:border-purple-200 dark:hover:border-purple-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-bold ${exIdx === activeIdx ? 'text-purple-600 dark:text-purple-400' : 'text-text-primary'}`}>
                    {exIdx === activeIdx && <span className="mr-1">⚡</span>}
                    {ex.exerciseName}
                  </h3>
                  <span className={`text-xs font-semibold ${
                    ex.sets.every(s=>s.completed) ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'
                  }`}>
                    {ex.sets.filter(s=>s.completed).length}/{ex.sets.length}
                  </span>
                </div>
                <div className="flex gap-1">
                  {ex.sets.map((s,i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      s.completed ? 'bg-emerald-500' : exIdx===activeIdx ? 'bg-purple-300 dark:bg-purple-700' : 'bg-border'
                    }`} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Completion modal ── */}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => navigate('/workout')} />
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="card card-shadow overflow-hidden">
              {/* Gradient top */}
              <div className="h-2 bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-500" />
              <div className="p-8 text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl shadow-purple-500/30 animate-float">
                  🎉
                </div>
                <h2 className="text-2xl font-black text-text-primary mb-1">Workout Complete!</h2>
                <p className="text-sm text-text-secondary mb-6">
                  {template.name} · {formatTime(elapsedSeconds)}
                </p>

                {newPRs.length > 0 && (
                  <div className="card-yellow p-4 mb-5 text-left rounded-2xl">
                    <p className="text-xs font-bold text-text-secondary mb-2">🏆 New Personal Records!</p>
                    {newPRs.map((pr, i) => (
                      <p key={i} className="text-sm font-bold text-text-primary">
                        {pr.exerciseName}: {pr.weightKg}kg × {pr.reps}
                      </p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="card-purple p-3 rounded-2xl">
                    <p className="text-[10px] text-text-secondary">Sets</p>
                    <p className="text-xl font-black text-text-primary">{doneCount}</p>
                  </div>
                  <div className="card-green p-3 rounded-2xl">
                    <p className="text-[10px] text-text-secondary">Volume</p>
                    <p className="text-xl font-black text-text-primary">
                      {Math.round(exercises.reduce((s,ex) => s + ex.sets.filter(x=>x.completed).reduce((s2,set)=>s2+set.weightKg*set.reps,0),0))}kg
                    </p>
                  </div>
                  <div className="card-orange p-3 rounded-2xl">
                    <p className="text-[10px] text-text-secondary">PRs</p>
                    <p className="text-xl font-black text-text-primary">{newPRs.length}</p>
                  </div>
                </div>

                <button
                  onClick={() => { if (storageKey) localStorage.removeItem(storageKey); navigate('/workout') }}
                  className="btn-purple w-full py-3 text-base"
                >
                  Back to Workouts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
