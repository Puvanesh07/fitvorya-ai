/**
 * PregnancyExerciseCoach
 *
 * Full pregnancy exercise coach UI:
 *   1. Intake gate  — week, activity level, clinician restrictions check
 *   2. Clinician gate — shown when restrictions = yes (no workout generated)
 *   3. Daily session  — step-through player with animated figure + instructions
 *   4. Weekly plan    — 7-day overview with focus labels
 *   5. Stop modal     — warning signs list, Firestore log
 *
 * Safety guarantee: restrictions flag is checked in the router prop, not just
 * the UI, so a restricted user never sees an exercise plan.
 */

import { useState } from 'react'
import {
  buildDailySession,
  type PregnancyExercise,
} from './PregnancyExerciseAnimation'
import PregnancyExerciseAnimation from './PregnancyExerciseAnimation'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActivityLevel = 'beginner' | 'moderate' | 'active'
type View = 'intake' | 'gate' | 'session' | 'complete' | 'weekly'

interface IntakeData {
  week:          number
  activityLevel: ActivityLevel
  hasRestrictions: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FOCUS_LABEL: Record<string, string> = {
  Mon: '🚶 Walking',   Tue: '💪 Strength',  Wed: '🧘 Mobility',
  Thu: '🌬️ Breathing', Fri: '🚶 Walking',   Sat: '💪 Strength', Sun: '😴 Rest',
}

const WARNING_SIGNS = [
  'Vaginal bleeding or fluid leakage',
  'Dizziness or feeling faint',
  'Chest pain or palpitations',
  'Painful uterine contractions',
  'Shortness of breath before exertion',
  'Calf pain or swelling',
  'Decreased fetal movement',
  'Severe headache or visual changes',
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string; emoji: string }[] = [
  { value: 'beginner',  label: 'Gentle',   desc: 'Little/no exercise before pregnancy', emoji: '🌱' },
  { value: 'moderate',  label: 'Moderate', desc: 'Some exercise most weeks',            emoji: '🌿' },
  { value: 'active',    label: 'Active',   desc: 'Regular exercise pre-pregnancy',      emoji: '🌳' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 1. Intake screen
// ─────────────────────────────────────────────────────────────────────────────

function IntakeScreen({
  initialWeek,
  onComplete,
}: {
  initialWeek: number
  onComplete: (data: IntakeData) => void
}) {
  const [week,             setWeek]             = useState(initialWeek || 12)
  const [activityLevel,    setActivityLevel]    = useState<ActivityLevel>('beginner')
  const [hasRestrictions,  setHasRestrictions]  = useState<boolean | null>(null)

  const canContinue = week >= 1 && week <= 42 && hasRestrictions !== null

  function handleContinue() {
    if (!canContinue) return
    onComplete({ week, activityLevel, hasRestrictions: hasRestrictions! })
  }

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto animate-slide-up">

      {/* Header */}
      <div className="g-card-glow-pink p-4 text-center">
        <div className="text-3xl mb-2">🤰</div>
        <h2 className="text-base font-black text-text-primary mb-1">Pregnancy Exercise Coach</h2>
        <p className="text-xs text-text-muted leading-relaxed">
          Prenatal exercise is safe and beneficial for most pregnancies.
          Let's personalise a plan for you.
        </p>
      </div>

      {/* Pregnancy week */}
      <div className="g-card p-4 flex flex-col gap-3">
        <label className="text-xs font-bold text-text-secondary">Your current pregnancy week</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1} max={42}
            value={week}
            onChange={e => setWeek(Math.max(1, Math.min(42, Number(e.target.value))))}
            className="g-input w-24 text-center text-base font-black"
          />
          <div className="flex-1">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgb(255 255 255 / 0.08)' }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (week / 40) * 100)}%`,
                  background: 'linear-gradient(90deg, #ec4899, #a855f7)',
                }} />
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              Trimester {week <= 13 ? 1 : week <= 27 ? 2 : 3} · {40 - Math.min(week, 40)} weeks to go
            </p>
          </div>
        </div>
      </div>

      {/* Activity level */}
      <div className="g-card p-4 flex flex-col gap-3">
        <label className="text-xs font-bold text-text-secondary">Activity level before pregnancy</label>
        <div className="flex flex-col gap-2">
          {ACTIVITY_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setActivityLevel(o.value)}
              className="g-select-btn gap-3 text-left"
              style={activityLevel === o.value ? {
                background: 'rgb(244 114 182 / 0.15)', borderColor: 'rgb(244 114 182 / 0.4)',
                color: 'rgb(249 168 212)',
              } : {}}>
              <span className="text-lg flex-shrink-0">{o.emoji}</span>
              <div>
                <p className="text-xs font-bold">{o.label}</p>
                <p className="text-[10px] opacity-60">{o.desc}</p>
              </div>
              {activityLevel === o.value && (
                <span className="ml-auto text-pink-400 flex-shrink-0 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Clinician restrictions gate — most important safety check */}
      <div className="g-card p-4 flex flex-col gap-3">
        <div>
          <label className="text-xs font-bold text-text-secondary">
            Has your doctor or midwife advised you to restrict or avoid exercise?
          </label>
          <p className="text-[10px] text-text-muted mt-0.5">
            This includes conditions like placenta praevia, pre-eclampsia, cervical incompetence, or PPROM.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'No restrictions', value: false, color: 'rgb(16 185 129)', bg: 'rgb(16 185 129 / 0.12)', border: 'rgb(16 185 129 / 0.35)' },
            { label: 'Yes, I have restrictions', value: true,  color: 'rgb(239 68 68)', bg: 'rgb(239 68 68 / 0.12)', border: 'rgb(239 68 68 / 0.35)' },
          ].map(opt => (
            <button key={String(opt.value)} onClick={() => setHasRestrictions(opt.value)}
              className="g-select-btn justify-center py-3 text-xs font-bold text-center flex-col gap-1"
              style={hasRestrictions === opt.value ? {
                background: opt.bg, borderColor: opt.border, color: opt.color,
              } : {}}>
              {opt.value ? '⚠️' : '✅'}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="g-disclaimer">
        ⚠️ <strong>This is general guidance only.</strong> Always consult your doctor or midwife
        before starting or continuing exercise during pregnancy.
      </div>

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="g-btn g-btn-primary py-3.5 w-full text-sm font-black">
        Continue →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Clinician gate (shown when restrictions = yes)
// ─────────────────────────────────────────────────────────────────────────────

function ClinicianGate({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-md mx-auto animate-slide-up">
      <div className="g-card p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'rgb(239 68 68 / 0.12)', border: '1px solid rgb(239 68 68 / 0.25)' }}>
          🩺
        </div>
        <h2 className="text-base font-black text-text-primary">Let's check with your clinician first</h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
          Since you have an activity restriction, we won't generate a generic workout plan.
          Please confirm with your doctor or midwife which activities are safe for you right now.
        </p>
        <div className="g-card-sm p-3 w-full text-left"
          style={{ background: 'rgb(56 189 248 / 0.07)', borderColor: 'rgb(56 189 248 / 0.18)' }}>
          <p className="text-xs text-sky-300 leading-relaxed">
            💡 Come back once your clinician has given the green light — we'll tailor a plan
            that fits exactly what they've approved.
          </p>
        </div>
        <div className="g-disclaimer w-full text-left">
          ⚠️ If you're unsure, call 108 / 112 for emergencies or contact your healthcare provider.
        </div>
        <button onClick={onBack} className="g-btn w-full py-3">← Back to intake</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Stop-exercise safety modal
// ─────────────────────────────────────────────────────────────────────────────

function StopModal({
  exercise,
  uid,
  onContinue,
  onStop,
}: {
  exercise: PregnancyExercise
  uid:      string
  onContinue: () => void
  onStop:     () => void
}) {
  const [selectedSign, setSelectedSign] = useState<string | null>(null)

  async function handleStop() {
    // Log to Firestore — non-blocking
    try {
      await addDoc(collection(db, 'users', uid, 'exerciseStops'), {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        reason:     selectedSign ?? 'User stopped session',
        timestamp:  serverTimestamp(),
      })
    } catch { /* non-blocking */ }
    onStop()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 g-modal-overlay animate-pop-in">
      <div className="g-modal-panel w-full max-w-md animate-pop-in p-5 flex flex-col gap-4">

        <div className="text-center">
          <div className="text-3xl mb-2">🛑</div>
          <h3 className="text-base font-black text-text-primary mb-1">Stop your session?</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            If you're experiencing any of the signs below, stop exercising immediately
            and contact your healthcare provider or emergency services.
          </p>
        </div>

        {/* Warning signs checklist */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Are you experiencing any of these?
          </p>
          {WARNING_SIGNS.map(sign => (
            <button key={sign} onClick={() => setSelectedSign(s => s === sign ? null : sign)}
              className="g-select-btn gap-2.5 text-left text-xs"
              style={selectedSign === sign ? {
                background: 'rgb(239 68 68 / 0.15)', borderColor: 'rgb(239 68 68 / 0.35)',
                color: 'rgb(252 165 165)',
              } : {}}>
              <span className="flex-shrink-0">{selectedSign === sign ? '⚠️' : '○'}</span>
              {sign}
            </button>
          ))}
        </div>

        <div className="g-disclaimer text-[11px]">
          ⚠️ FitTracker cannot diagnose symptoms. When in doubt, contact your clinician or
          call 108 / 112 emergency services.
        </div>

        <div className="flex gap-2.5">
          <button onClick={onContinue} className="g-btn flex-1 py-3 text-xs">
            I'm okay, continue
          </button>
          <button onClick={handleStop}
            className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgb(239 68 68 / 0.2)', border: '1px solid rgb(239 68 68 / 0.35)', color: 'rgb(252 165 165)' }}>
            {selectedSign ? `Stop — ${selectedSign.slice(0, 20)}…` : 'Stop session'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Session player
// ─────────────────────────────────────────────────────────────────────────────

function SessionPlayer({
  exercises,
  intake,
  uid,
  onFinish,
  onBack,
}: {
  exercises: PregnancyExercise[]
  intake:    IntakeData
  uid:       string
  onFinish:  () => void
  onBack:    () => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completed,  setCompleted]  = useState<Set<number>>(new Set())
  const [showStop,   setShowStop]   = useState(false)

  const exercise = exercises[currentIdx]
  const progress = Math.round((completed.size / exercises.length) * 100)
  const isLast   = currentIdx === exercises.length - 1

  function markDone() {
    setCompleted(prev => new Set([...prev, currentIdx]))
    if (!isLast) setCurrentIdx(i => i + 1)
    else onFinish()
  }

  return (
    <div className="flex flex-col gap-4 animate-slide-up">

      {/* Session header */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="g-btn g-btn-sm g-btn-icon">←</button>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-text-muted mb-1">
            <span>Exercise {currentIdx + 1} of {exercises.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(255 255 255 / 0.08)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ec4899, #a855f7)' }} />
          </div>
        </div>
        <button onClick={() => setShowStop(true)}
          className="g-btn g-btn-sm text-[11px]"
          style={{ color: 'rgb(252 165 165)', borderColor: 'rgb(239 68 68 / 0.25)' }}>
          🛑 Stop
        </button>
      </div>

      {/* Exercise tab strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {exercises.map((ex, i) => (
          <button key={ex.id} onClick={() => setCurrentIdx(i)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap"
            style={{
              background: i === currentIdx
                ? 'linear-gradient(135deg, #ec4899, #a855f7)'
                : completed.has(i)
                ? 'rgb(16 185 129 / 0.15)'
                : 'rgb(255 255 255 / 0.04)',
              border: i === currentIdx
                ? 'none'
                : completed.has(i)
                ? '1px solid rgb(16 185 129 / 0.3)'
                : '1px solid rgb(255 255 255 / 0.07)',
              color: i === currentIdx
                ? 'white'
                : completed.has(i)
                ? 'rgb(110 231 183)'
                : 'rgba(170,165,200,0.75)',
            }}>
            {completed.has(i) ? '✓ ' : ''}{ex.name}
          </button>
        ))}
      </div>

      {/* Current exercise card */}
      <div className="g-card overflow-hidden">
        {/* Pink top accent */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #ec4899, #a855f7)' }} />
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-text-primary">{exercise.name}</h2>
              <p className="text-xs text-text-muted mt-0.5 capitalize">{exercise.category}</p>
            </div>
            <span className="g-badge" style={{ background: 'rgb(244 114 182 / 0.12)', borderColor: 'rgb(244 114 182 / 0.25)', color: 'rgb(249 168 212)' }}>
              {exercise.durationMin} min
            </span>
          </div>

          {/* Animated figure + steps */}
          <PregnancyExerciseAnimation exercise={exercise} week={intake.week} size={100} />

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgb(255 255 255 / 0.07)' }}>
            {currentIdx > 0 && (
              <button onClick={() => setCurrentIdx(i => i - 1)} className="g-btn g-btn-sm flex-shrink-0">
                ← Prev
              </button>
            )}
            <button onClick={markDone}
              className="g-btn flex-1 py-3 font-black text-sm"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                border: 'none', color: 'white',
                boxShadow: '0 4px 16px rgb(236 72 153 / 0.35)',
              }}>
              {completed.has(currentIdx)
                ? isLast ? '🎉 Finish' : 'Next →'
                : isLast ? '✓ Complete & Finish' : '✓ Done, next →'}
            </button>
          </div>
        </div>
      </div>

      {/* Stop modal */}
      {showStop && (
        <StopModal
          exercise={exercise}
          uid={uid}
          onContinue={() => setShowStop(false)}
          onStop={onFinish}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Weekly plan view
// ─────────────────────────────────────────────────────────────────────────────

function WeeklyPlan({
  intake,
  onStartDay,
  onBack,
}: {
  intake:      IntakeData
  onStartDay:  (exercises: PregnancyExercise[]) => void
  onBack:      () => void
}) {
  const today = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="g-btn g-btn-sm g-btn-icon">←</button>
        <div>
          <h2 className="text-sm font-black text-text-primary">7-Day Exercise Plan</h2>
          <p className="text-xs text-text-muted">Week {intake.week} · {ACTIVITY_OPTIONS.find(o => o.value === intake.activityLevel)?.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DAYS.map(day => {
          const session  = buildDailySession({ week: intake.week, activityLevel: intake.activityLevel, dayOfWeek: day })
          const isToday  = day === today
          const isRest   = session.isRestDay

          return (
            <div key={day} className="g-card p-3 flex flex-col gap-2"
              style={isToday ? { borderColor: 'rgb(244 114 182 / 0.45)', background: 'rgb(244 114 182 / 0.06)' } : {}}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-text-primary">{day}</span>
                  {isToday && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgb(244 114 182 / 0.18)', color: 'rgb(249 168 212)' }}>
                      Today
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted">{DAY_FOCUS_LABEL[day]}</span>
              </div>

              {isRest ? (
                <p className="text-xs text-text-muted">Rest and recover 🌸</p>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    {session.exercises.slice(0, 3).map(ex => (
                      <div key={ex.id} className="flex items-center gap-1.5">
                        <span className="text-[10px] text-pink-400">•</span>
                        <span className="text-[11px] text-text-secondary truncate">{ex.name}</span>
                        <span className="text-[10px] text-text-muted flex-shrink-0">{ex.durationMin}m</span>
                      </div>
                    ))}
                    {session.exercises.length > 3 && (
                      <p className="text-[10px] text-text-muted pl-3">+{session.exercises.length - 3} more</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-text-muted">~{session.totalMinutes} min total</span>
                    <button
                      onClick={() => onStartDay(session.exercises)}
                      className="g-btn g-btn-sm text-[10px] px-2.5"
                      style={isToday ? {
                        background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                        border: 'none', color: 'white',
                      } : {}}>
                      {isToday ? 'Start now →' : 'Preview'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="g-card-sm p-3 text-center">
        <p className="text-[10px] text-text-muted leading-relaxed">
          ℹ️ Always warm up and cool down. Stop if you feel unwell. Consult your doctor before starting any new exercise programme during pregnancy.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Session complete screen
// ─────────────────────────────────────────────────────────────────────────────

function SessionComplete({
  exercises,
  onRestart,
  onWeekly,
}: {
  exercises: PregnancyExercise[]
  onRestart: () => void
  onWeekly:  () => void
}) {
  const totalMin = exercises.reduce((s, e) => s + e.durationMin, 0)

  return (
    <div className="max-w-sm mx-auto animate-pop-in flex flex-col items-center gap-5 py-8 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: 'linear-gradient(135deg, rgb(244 114 182 / 0.25), rgb(168 85 247 / 0.2))', border: '1px solid rgb(244 114 182 / 0.3)', boxShadow: '0 8px 28px rgb(244 114 182 / 0.22)' }}>
        🎉
      </div>
      <div>
        <h2 className="text-xl font-black text-text-primary mb-1">Session Complete!</h2>
        <p className="text-sm text-text-muted">
          {exercises.length} exercises · {totalMin} minutes · Well done 🌸
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { label: 'Exercises', value: exercises.length, color: '#ec4899' },
          { label: 'Minutes',   value: totalMin,          color: '#a855f7' },
          { label: 'Trimester', value: 'Done ✓',          color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="g-card p-3 rounded-xl text-center">
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="g-disclaimer text-left w-full">
        🌸 <strong>Great work!</strong> Stay hydrated and rest if needed. If you have any concerns after exercise, contact your healthcare provider.
      </div>
      <div className="flex gap-2.5 w-full">
        <button onClick={onWeekly} className="g-btn flex-1 py-3 text-sm">📅 Weekly plan</button>
        <button onClick={onRestart}
          className="flex-1 py-3 rounded-xl text-sm font-black transition-all"
          style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', border: 'none', boxShadow: '0 4px 16px rgb(236 72 153 / 0.35)' }}>
          🔄 New session
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Today's session home — shown after intake, before starting
// ─────────────────────────────────────────────────────────────────────────────

function TodayHome({
  intake,
  onStart,
  onWeekly,
  onReIntake,
}: {
  intake:     IntakeData
  onStart:    (exercises: PregnancyExercise[]) => void
  onWeekly:   () => void
  onReIntake: () => void
}) {
  const today    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
  const dayAbbr  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
  const session  = buildDailySession({ week: intake.week, activityLevel: intake.activityLevel, dayOfWeek: dayAbbr })
  const trimester: 1|2|3 = intake.week <= 13 ? 1 : intake.week <= 27 ? 2 : 3

  const trimColors: Record<1|2|3, { glow: string; accent: string; text: string }> = {
    1: { glow: 'rgb(139 92 246 / 0.14)', accent: '#a855f7', text: 'rgb(196 181 253)' },
    2: { glow: 'rgb(244 114 182 / 0.14)', accent: '#ec4899', text: 'rgb(249 168 212)' },
    3: { glow: 'rgb(251 146 60 / 0.14)',  accent: '#fb923c', text: 'rgb(253 186 116)' },
  }
  const tc = trimColors[trimester]

  return (
    <div className="flex flex-col gap-4 animate-slide-up">

      {/* Status banner */}
      <div className="g-card p-4" style={{ background: tc.glow, borderColor: `${tc.accent}44`, boxShadow: `0 4px 20px ${tc.glow}` }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: tc.text, opacity: 0.7 }}>Week {intake.week}</p>
            <h2 className="text-lg font-black text-text-primary">
              {session.isRestDay ? 'Rest Day 🌸' : `Today — ${DAY_FOCUS_LABEL[today]}`}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: tc.text }}>
              Trimester {trimester} · {ACTIVITY_OPTIONS.find(o => o.value === intake.activityLevel)?.label} level
            </p>
          </div>
          <button onClick={onReIntake} className="g-btn g-btn-sm text-[10px]">✏️ Edit</button>
        </div>
      </div>

      {session.isRestDay ? (
        <div className="g-card p-6 text-center flex flex-col items-center gap-3">
          <span className="text-4xl">😴</span>
          <h3 className="text-base font-black text-text-primary">Rest & Recover</h3>
          <p className="text-sm text-text-muted leading-relaxed max-w-xs">
            Rest days are essential for your body and your baby. Stay hydrated, do some gentle stretching, and take it easy.
          </p>
          <button onClick={onWeekly} className="g-btn g-btn-sm mt-1">📅 View weekly plan</button>
        </div>
      ) : (
        <>
          {/* Exercises preview */}
          <div className="g-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-text-secondary">Today's exercises</h3>
              <span className="g-badge">{session.totalMinutes} min total</span>
            </div>
            <div className="flex flex-col gap-2">
              {session.exercises.map((ex, i) => (
                <div key={ex.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: 'rgb(255 255 255 / 0.03)', border: '1px solid rgb(255 255 255 / 0.07)' }}>
                  <span className="text-xs font-black text-text-muted flex-shrink-0 w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{ex.name}</p>
                    <p className="text-[10px] text-text-muted">{ex.muscles}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="g-badge text-[9px]">{ex.durationMin}m</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={ex.difficulty === 'Gentle'
                        ? { background: 'rgb(16 185 129 / 0.12)', color: 'rgb(110 231 183)' }
                        : { background: 'rgb(234 179 8 / 0.12)', color: 'rgb(253 224 71)' }}>
                      {ex.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="g-disclaimer">
            ⚠️ <strong>Important:</strong> Stop immediately if you experience pain, bleeding, dizziness, or contractions. Consult your healthcare provider before exercising.
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <button onClick={onWeekly} className="g-btn flex-1 py-3 text-sm">📅 Weekly plan</button>
            <button onClick={() => onStart(session.exercises)}
              className="flex-1 py-3.5 rounded-xl text-sm font-black transition-all"
              style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', border: 'none', boxShadow: '0 4px 16px rgb(236 72 153 / 0.35)' }}>
              ▶ Start Session
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  pregnancyWeek: number   // from PregnancyProfile
  uid:           string
}

export default function PregnancyExerciseCoach({ pregnancyWeek, uid }: Props) {
  const [view,           setView]           = useState<View>('intake')
  const [intake,         setIntake]         = useState<IntakeData | null>(null)
  const [sessionExs,     setSessionExs]     = useState<PregnancyExercise[]>([])

  function handleIntakeComplete(data: IntakeData) {
    setIntake(data)
    if (data.hasRestrictions) {
      setView('gate')
    } else {
      setView('session')
    }
  }

  function startSession(exercises: PregnancyExercise[]) {
    setSessionExs(exercises)
    setView('session')
  }

  if (view === 'intake' || !intake) {
    return <IntakeScreen initialWeek={pregnancyWeek} onComplete={handleIntakeComplete} />
  }

  if (view === 'gate') {
    return <ClinicianGate onBack={() => setView('intake')} />
  }

  if (view === 'weekly') {
    return (
      <WeeklyPlan
        intake={intake}
        onStartDay={exs => { startSession(exs); setView('session') }}
        onBack={() => setView('session')}
      />
    )
  }

  if (view === 'complete') {
    return (
      <SessionComplete
        exercises={sessionExs}
        onRestart={() => setView('session')}
        onWeekly={() => setView('weekly')}
      />
    )
  }

  // Default: today home / session player
  if (sessionExs.length === 0) {
    return (
      <TodayHome
        intake={intake}
        onStart={exs => { startSession(exs) }}
        onWeekly={() => setView('weekly')}
        onReIntake={() => setView('intake')}
      />
    )
  }

  return (
    <SessionPlayer
      exercises={sessionExs}
      intake={intake}
      uid={uid}
      onFinish={() => setView('complete')}
      onBack={() => setSessionExs([])}
    />
  )
}
