import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import { fetchWorkoutHistory, fetchHeatmap } from '../services/workoutService'
import type { WorkoutSession } from '../types/workout'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { formatFullDate } from '../utils/format'

const TEMPLATE_META: Record<string, {
  icon: string; cardColor: string; accent: string
  muscles: string; difficulty: string; diffColor: string
}> = {
  tpl_push:     { icon: '💪', cardColor: 'card-purple', accent: '#8b5cf6', muscles: 'Chest · Shoulders · Triceps', difficulty: 'Intermediate', diffColor: '#f59e0b' },
  tpl_pull:     { icon: '🔙', cardColor: 'card-blue',   accent: '#60a5fa', muscles: 'Back · Biceps',               difficulty: 'Intermediate', diffColor: '#f59e0b' },
  tpl_legs:     { icon: '🦵', cardColor: 'card-green',  accent: '#10b981', muscles: 'Quads · Hamstrings · Glutes', difficulty: 'Advanced',     diffColor: '#f87171' },
  tpl_upper:    { icon: '🏋️', cardColor: 'card-pink',   accent: '#ec4899', muscles: 'Full Upper Body',             difficulty: 'Intermediate', diffColor: '#f59e0b' },
  tpl_lower:    { icon: '⬇️', cardColor: 'card-orange', accent: '#f97316', muscles: 'Quads · Glutes · Hamstrings', difficulty: 'Intermediate', diffColor: '#f59e0b' },
  tpl_full_body:{ icon: '🏃', cardColor: 'card-teal',   accent: '#2dc3be', muscles: 'Full Body',                   difficulty: 'Beginner',     diffColor: '#10b981' },
  tpl_hiit:     { icon: '🔥', cardColor: 'card-yellow', accent: '#f59e0b', muscles: 'Cardio · Full Body',           difficulty: 'Advanced',     diffColor: '#f87171' },
  tpl_5x5:      { icon: '⚡', cardColor: 'card-blue',   accent: '#60a5fa', muscles: 'Compound Strength',            difficulty: 'Advanced',     diffColor: '#f87171' },
}

export default function Workout() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [history, setHistory]   = useState<WorkoutSession[]>([])
  const [heatmap, setHeatmap]   = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates')

  useEffect(() => {
    if (!profile) return
    Promise.all([fetchWorkoutHistory(profile.uid), fetchHeatmap(profile.uid)])
      .then(([h, m]) => { setHistory(h); setHeatmap(m) })
      .finally(() => setLoading(false))
  }, [profile])

  if (loading) return <PageLoader variant="workout" />

  const activeDays    = heatmap.filter(d => d.count > 0).length
  const totalWorkouts = heatmap.reduce((s, d) => s + d.count, 0)
  const last4Weeks    = heatmap.slice(-28).filter(d => d.count > 0).length

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
          Workout <span className="gradient-text">Hub</span>
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1">Choose a template and start training</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: 'Total Workouts', value: totalWorkouts,  icon: '🏋️', card: 'card-purple', accent: '#8b5cf6' },
          { label: 'Active Days',    value: activeDays,     icon: '📅', card: 'card-teal',   accent: '#2dc3be' },
          { label: 'Last 4 Weeks',   value: last4Weeks,     icon: '🔥', card: 'card-yellow', accent: '#f59e0b' },
        ].map((s, i) => (
          <div key={s.label}
            className={`${s.card} p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0`}
            style={{ animationFillMode: 'forwards', animationDelay: `${i * 55}ms` }}>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-base sm:text-xl mb-2 sm:mb-3"
              style={{ background: `${s.accent}20`, border: `1px solid ${s.accent}35` }}>
              {s.icon}
            </div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{s.value}</p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-text-muted mt-0.5 sm:mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card card-shadow p-3 sm:p-5 rounded-2xl mb-4 sm:mb-6 animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards', animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Activity Heatmap</h2>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">Last 16 weeks</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(108,65,210,0.15)', border: '1px solid rgba(108,65,210,0.3)', color: '#a78bfa' }}>
            {activeDays} active days
          </span>
        </div>
        <WorkoutHeatmap data={heatmap} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl mb-4 sm:mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {(['templates', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab
                ? 'gradient-brand text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
            style={activeTab === tab ? { boxShadow: '0 4px 14px rgba(108,65,210,0.4)' } : {}}>
            {tab === 'templates' ? '📋 Templates' : '📚 History'}
          </button>
        ))}
      </div>

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {BUILT_IN_TEMPLATES.map((t, i) => {
            const meta = TEMPLATE_META[t.id] ?? {
              icon: '🏋️', cardColor: 'card-purple', accent: '#8b5cf6',
              muscles: '', difficulty: 'Intermediate', diffColor: '#f59e0b',
            }
            return (
              <button key={t.id}
                onClick={() => navigate(`/workout/session/${t.id}`)}
                className={`${meta.cardColor} p-3 sm:p-5 rounded-2xl text-left group hover:-translate-y-1 transition-all duration-200 animate-fade-up opacity-0`}
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}>

                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl"
                    style={{ background: `${meta.accent}20`, border: `1px solid ${meta.accent}35` }}>
                    {meta.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${meta.diffColor}18`, color: meta.diffColor, border: `1px solid ${meta.diffColor}30` }}>
                    {meta.difficulty}
                  </span>
                </div>

                <h3 className="text-sm font-black text-text-primary mb-1 leading-tight">{t.name}</h3>
                <p className="text-[11px] text-text-muted font-semibold mb-1.5">{meta.muscles}</p>
                <p className="text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">{t.description}</p>

                <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                  <span className="font-semibold">💪 {t.exercises.length} exercises</span>
                  <span className="font-semibold">⏱️ ~{t.estimatedMinutes}min</span>
                </div>

                <div className="w-full py-2 rounded-xl gradient-brand text-white text-xs font-black text-center
                  opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
                  style={{ boxShadow: '0 4px 12px rgba(108,65,210,0.4)' }}>
                  Start Workout →
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="h-20 w-20 rounded-2xl card-purple flex items-center justify-center text-4xl animate-float">🏋️</div>
              <p className="text-base font-black text-text-primary">No workouts yet</p>
              <p className="text-sm text-text-muted">Start a template to see your history here</p>
              <button onClick={() => setActiveTab('templates')} className="btn-purple px-8 py-2.5">Browse Templates</button>
            </div>
          ) : (
            history.map((w, i) => (
              <div key={w.id}
                className="card card-shadow p-3 sm:p-5 rounded-2xl hover:-translate-y-0.5 transition-all animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 35}ms` }}>
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl gradient-brand flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0"
                      style={{ boxShadow: '0 4px 12px rgba(108,65,210,0.4)' }}>🏋️</div>
                    <div>
                      <h3 className="text-sm font-black text-text-primary">{w.name}</h3>
                      <p className="text-xs text-text-muted mt-0.5">{formatFullDate(w.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.startedAt && w.finishedAt && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(108,65,210,0.15)', color: '#a78bfa', border: '1px solid rgba(108,65,210,0.3)' }}>
                        {Math.round((w.finishedAt - w.startedAt) / 60000)} min
                      </span>
                    )}
                    {w.totalVolumeKg && w.totalVolumeKg > 0 && (
                      <span className="text-[11px] text-text-muted font-semibold">{Math.round(w.totalVolumeKg)}kg</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {w.exercises.map((e, ei) => (
                    <span key={ei} className="px-2.5 py-1 rounded-lg text-[11px] text-text-muted font-semibold"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {e.exerciseName} · {e.sets.length}×
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Heatmap ────────────────────────────────────────────────────────────────────
function WorkoutHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const map   = new Map(data.map(d => [d.date, d.count]))
  const today = new Date()
  const days: { date: string; count: number }[] = []
  for (let i = 111; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    days.push({ date: iso, count: map.get(iso) ?? 0 })
  }
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  const DAY_LABELS = ['', 'M', '', 'W', '', 'F', '']

  return (
    <div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-2 pt-5">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="h-4 w-4 flex items-center justify-center text-[9px] text-text-muted font-bold">{l}</div>
          ))}
        </div>
        <div className="overflow-x-auto flex-1 scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(day => {
                  const c = day.count
                  let bg = 'rgba(255,255,255,0.06)'
                  if (c === 1) bg = 'rgba(108,65,210,0.35)'
                  else if (c === 2) bg = 'rgba(108,65,210,0.6)'
                  else if (c >= 3) bg = 'rgba(108,65,210,0.9)'
                  return (
                    <div key={day.date} title={`${day.date}${c > 0 ? ` — ${c} workout${c > 1 ? 's' : ''}` : ''}`}
                      className="h-4 w-4 rounded-[4px] transition-transform hover:scale-125 cursor-default"
                      style={{ background: bg, border: c > 0 ? '1px solid rgba(108,65,210,0.3)' : '1px solid rgba(255,255,255,0.04)' }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[9px] text-text-muted font-semibold">Less</span>
        {[
          'rgba(255,255,255,0.06)',
          'rgba(108,65,210,0.35)',
          'rgba(108,65,210,0.6)',
          'rgba(108,65,210,0.9)',
        ].map((bg, n) => (
          <div key={n} className="h-4 w-4 rounded-[4px]"
            style={{ background: bg, border: '1px solid rgba(108,65,210,0.2)' }} />
        ))}
        <span className="text-[9px] text-text-muted font-semibold">More</span>
      </div>
    </div>
  )
}
