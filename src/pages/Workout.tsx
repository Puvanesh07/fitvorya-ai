import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import { fetchWorkoutHistory, fetchHeatmap } from '../services/workoutService'
import type { WorkoutSession } from '../types/workout'
import { CATEGORY_LABELS } from '../types/workout'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { formatFullDate } from '../utils/format'

const TEMPLATE_META: Record<string, {
  icon: string
  gradient: string
  accent: string
  muscles: string
  difficulty: string
  diffColor: string
}> = {
  tpl_push:     { icon: '💪', gradient: 'from-purple-500 to-purple-700',   accent: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', muscles: 'Chest · Shoulders · Triceps', difficulty: 'Intermediate', diffColor: 'text-yellow-600' },
  tpl_pull:     { icon: '🔙', gradient: 'from-blue-500 to-blue-700',       accent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',         muscles: 'Back · Biceps',              difficulty: 'Intermediate', diffColor: 'text-yellow-600' },
  tpl_legs:     { icon: '🦵', gradient: 'from-emerald-500 to-emerald-700', accent: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', muscles: 'Quads · Hamstrings · Glutes', difficulty: 'Advanced',     diffColor: 'text-red-500' },
  tpl_upper:    { icon: '🏋️', gradient: 'from-pink-500 to-rose-600',       accent: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',           muscles: 'Full Upper Body',            difficulty: 'Intermediate', diffColor: 'text-yellow-600' },
  tpl_lower:    { icon: '⬇️', gradient: 'from-orange-500 to-orange-700',   accent: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',   muscles: 'Quads · Glutes · Hamstrings',difficulty: 'Intermediate', diffColor: 'text-yellow-600' },
  tpl_full_body:{ icon: '🏃', gradient: 'from-teal-500 to-cyan-600',       accent: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',           muscles: 'Full Body',                  difficulty: 'Beginner',     diffColor: 'text-emerald-600' },
  tpl_hiit:     { icon: '🔥', gradient: 'from-red-500 to-rose-600',        accent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',               muscles: 'Cardio · Full Body',         difficulty: 'Advanced',     diffColor: 'text-red-500' },
  tpl_5x5:      { icon: '⚡', gradient: 'from-amber-500 to-yellow-600',    accent: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',       muscles: 'Compound Strength',          difficulty: 'Advanced',     diffColor: 'text-red-500' },
}

export default function Workout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState<WorkoutSession[]>([])
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates')

  useEffect(() => {
    if (!profile) return
    Promise.all([fetchWorkoutHistory(profile.uid), fetchHeatmap(profile.uid)])
      .then(([h, m]) => { setHistory(h); setHeatmap(m) })
      .finally(() => setLoading(false))
  }, [profile])

  if (loading) return <PageLoader />

  const activeDays = heatmap.filter(d => d.count > 0).length
  const totalWorkouts = heatmap.reduce((s, d) => s + d.count, 0)

  return (
    <div className="animate-fade-in">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-primary">
          Workout <span className="gradient-text">Hub</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">Choose a template and start training</p>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Workouts', value: totalWorkouts, icon: '🏋️', color: 'card-purple' },
          { label: 'Active Days',    value: activeDays,    icon: '📅', color: 'card-green'  },
          { label: 'Last 4 Weeks',   value: heatmap.slice(-28).filter(d=>d.count>0).length, icon: '🔥', color: 'card-orange' },
        ].map(s => (
          <div key={s.label} className={`${s.color} p-4 rounded-2xl`}>
            <span className="text-xl block mb-1">{s.icon}</span>
            <p className="text-xl font-black text-text-primary">{s.value}</p>
            <p className="text-[10px] font-semibold text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Heatmap ── */}
      <div className="card card-shadow p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Activity Heatmap</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Last 16 weeks</p>
          </div>
          <span className="badge badge-brand">{activeDays} active days</span>
        </div>
        <WorkoutHeatmap data={heatmap} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-2xl mb-5 w-fit border border-border">
        {(['templates', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-md shadow-purple-500/20'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'templates' ? '📋 Templates' : '📚 History'}
          </button>
        ))}
      </div>

      {/* ── Templates ── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {BUILT_IN_TEMPLATES.map((t, i) => {
            const meta = TEMPLATE_META[t.id] ?? { icon: '🏋️', gradient: 'from-purple-500 to-purple-700', accent: '', muscles: '', difficulty: 'Intermediate', diffColor: 'text-yellow-600' }
            return (
              <button
                key={t.id}
                onClick={() => navigate(`/workout/session/${t.id}`)}
                className="card card-shadow card-hover p-0 text-left overflow-hidden animate-fade-up opacity-0 group"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 45}ms` }}
              >
                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${meta.gradient} p-5 relative overflow-hidden`}>
                  {/* Background decoration */}
                  <div className="absolute right-3 bottom-2 text-6xl opacity-20 group-hover:opacity-30 transition-opacity">{meta.icon}</div>
                  <span className="text-3xl relative z-10">{meta.icon}</span>
                  <h3 className="text-base font-black text-white mt-2 relative z-10">{t.name}</h3>
                  <p className="text-xs text-white/70 mt-0.5 relative z-10">{meta.muscles}</p>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <p className="text-xs text-text-muted mb-3 leading-relaxed">{t.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.accent}`}>
                      {CATEGORY_LABELS[t.category]}
                    </span>
                    <span className={`text-[10px] font-bold ${meta.diffColor}`}>
                      {meta.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-border">
                    <span className="flex items-center gap-1">
                      <span>💪</span> {t.exercises.length} exercises
                    </span>
                    <span className="flex items-center gap-1">
                      <span>⏱️</span> ~{t.estimatedMinutes}min
                    </span>
                  </div>

                  {/* CTA row */}
                  <div className="mt-3">
                    <div className={`w-full py-2 rounded-xl bg-gradient-to-r ${meta.gradient} text-white text-xs font-bold text-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0`}>
                      Start Workout →
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── History ── */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-4xl animate-float">
                🏋️
              </div>
              <p className="text-base font-bold text-text-primary">No workouts yet</p>
              <p className="text-sm text-text-secondary">Start a template to see your history here</p>
              <button onClick={() => setActiveTab('templates')} className="btn-purple px-6 py-2.5">
                Browse Templates
              </button>
            </div>
          ) : (
            history.map((w, i) => (
              <div
                key={w.id}
                className="card card-shadow p-5 animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">{w.name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{formatFullDate(w.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {w.startedAt && w.finishedAt && (
                      <span className="badge badge-brand">
                        {Math.round((w.finishedAt - w.startedAt) / 60000)} min
                      </span>
                    )}
                    {w.totalVolumeKg && w.totalVolumeKg > 0 && (
                      <span className="text-[10px] text-text-muted">{Math.round(w.totalVolumeKg)}kg volume</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {w.exercises.map((e, ei) => (
                    <span key={ei} className="px-2.5 py-1 rounded-lg bg-surface2 border border-border text-[11px] text-text-secondary font-medium">
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
  const map = new Map(data.map(d => [d.date, d.count]))
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
      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 mr-1 pt-5">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="h-4 w-3 flex items-center justify-center text-[9px] text-text-muted font-medium">{l}</div>
          ))}
        </div>
        <div className="overflow-x-auto flex-1">
          <div className="flex gap-0.5 min-w-max">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map(day => {
                  const c = day.count
                  const cls = c === 0
                    ? 'bg-surface2 border border-border/50'
                    : c === 1
                    ? 'bg-purple-200 dark:bg-purple-800 border border-purple-300 dark:border-purple-700'
                    : c === 2
                    ? 'bg-purple-400 dark:bg-purple-600 border border-purple-400'
                    : 'bg-purple-600 dark:bg-purple-400 border border-purple-700 dark:border-purple-300 shadow-sm'
                  return (
                    <div
                      key={day.date}
                      title={`${day.date}${c > 0 ? ` — ${c} workout${c>1?'s':''}` : ''}`}
                      className={`h-4 w-4 rounded-sm transition-all cursor-default ${cls}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-text-muted">Less</span>
        {['bg-surface2 border border-border/50','bg-purple-200 dark:bg-purple-800','bg-purple-400 dark:bg-purple-600','bg-purple-600 dark:bg-purple-400'].map((cls,n) => (
          <div key={n} className={`h-4 w-4 rounded-sm ${cls}`} />
        ))}
        <span className="text-[9px] text-text-muted">More</span>
      </div>
    </div>
  )
}
