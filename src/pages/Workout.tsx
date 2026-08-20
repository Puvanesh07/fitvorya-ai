import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageWrapper from '../components/PageWrapper'
import LoadingSpinner from '../components/LoadingSpinner'
import { fetchWorkoutHistory, fetchHeatmap, formatDuration } from '../services/workoutService'
import type { WorkoutSession } from '../types/workout'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/workout'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { useUnit } from '../hooks/useUnit'
import { formatFullDate } from '../utils/format'

// ── Heatmap ───────────────────────────────────────────────────────────────────
function WorkoutHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const map = new Map(data.map(d => [d.date, d.count]))

  // Build last 16 weeks (112 days) grid
  const today = new Date()
  const days: { date: string; count: number }[] = []
  for (let i = 111; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    days.push({ date: iso, count: map.get(iso) ?? 0 })
  }

  // Split into weeks of 7
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  function cellColor(count: number) {
    if (count === 0) return 'bg-surface2 dark:bg-surface2'
    if (count === 1) return 'bg-teal-200 dark:bg-teal-900'
    if (count === 2) return 'bg-teal-400 dark:bg-teal-700'
    return 'bg-teal-600 dark:bg-teal-500'
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}${day.count > 0 ? ` — ${day.count} workout${day.count > 1 ? 's' : ''}` : ''}`}
                className={`h-3 w-3 rounded-sm transition-colors ${cellColor(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary">
        <span>Less</span>
        {[0,1,2,3].map(n => (
          <div key={n} className={`h-3 w-3 rounded-sm ${cellColor(n)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────
const TEMPLATE_ICONS: Record<string, string> = {
  tpl_push: '💪', tpl_pull: '🔙', tpl_legs: '🦵',
  tpl_upper: '🏋️', tpl_lower: '⬇️', tpl_full_body: '🏃',
  tpl_hiit: '🔥', tpl_5x5: '⚡',
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Workout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { format: fmtW } = useUnit()

  const [history, setHistory] = useState<WorkoutSession[]>([])
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates')

  const uid = profile?.uid ?? ''

  useEffect(() => {
    if (!uid) return
    Promise.all([
      fetchWorkoutHistory(uid),
      fetchHeatmap(uid),
    ]).then(([h, hm]) => {
      setHistory(h)
      setHeatmap(hm)
    }).finally(() => setLoading(false))
  }, [uid])

  const totalSessions = history.length
  const totalVolumeKg = history.reduce((s, w) => s + (w.totalVolumeKg ?? 0), 0)
  const totalDuration = history.reduce((s, w) => s + (w.durationSeconds ?? 0), 0)
  const thisWeekCount = history.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    return d >= weekStart
  }).length

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary">
            Workout <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Templates, history, and personal records.</p>
        </div>
        <button
          onClick={() => navigate('/workout/session/new')}
          className="btn-accent py-3 px-6 text-sm font-bold"
        >
          🏋️ Start Workout
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Sessions',   value: totalSessions,                      icon: '🏋️' },
          { label: 'This Week',        value: `${thisWeekCount} sessions`,          icon: '📅' },
          { label: 'Total Volume',     value: `${Math.round(totalVolumeKg / 1000)}k kg`, icon: '⚡' },
          { label: 'Total Time',       value: formatDuration(totalDuration),        icon: '⏱️' },
        ].map((s, i) => (
          <div key={s.label} className="card card-hover p-4 animate-fade-up opacity-0"
            style={{ animationFillMode: 'forwards', animationDelay: `${i * 60}ms` }}>
            <span className="text-xl mb-2 block">{s.icon}</span>
            <p className="stat-number text-xl text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card p-5 mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-display text-text-primary">Activity Heatmap</h2>
          <span className="badge badge-teal">{heatmap.reduce((s, d) => s + d.count, 0)} workouts</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><LoadingSpinner /></div>
        ) : (
          <WorkoutHeatmap data={heatmap} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-5 w-fit">
        {(['templates', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'templates' ? '📋 Templates' : '🗓️ History'}
          </button>
        ))}
      </div>

      {/* Templates tab */}
      {activeTab === 'templates' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILT_IN_TEMPLATES.map((tpl, i) => (
            <div
              key={tpl.id}
              className="card card-hover p-5 cursor-pointer animate-fade-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: `${i * 60}ms` }}
              onClick={() => navigate(`/workout/session/${tpl.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-11 w-11 rounded-xl gradient-brand flex items-center justify-center text-xl">
                  {TEMPLATE_ICONS[tpl.id] ?? '🏋️'}
                </div>
                <span className={`badge text-xs ${CATEGORY_COLORS[tpl.category]}`}>
                  {CATEGORY_LABELS[tpl.category]}
                </span>
              </div>
              <h3 className="font-bold font-display text-text-primary mb-1">{tpl.name}</h3>
              <p className="text-xs text-text-secondary mb-3 line-clamp-2">{tpl.description}</p>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span>⏱️ ~{tpl.estimatedMinutes} min</span>
                <span>·</span>
                <span>🏋️ {tpl.exercises.length} exercises</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {tpl.exercises.slice(0, 3).map(e => (
                  <span key={e.exerciseId} className="badge badge-teal text-[10px]">{e.exerciseName.split(' ')[0]}</span>
                ))}
                {tpl.exercises.length > 3 && (
                  <span className="badge badge-teal text-[10px]">+{tpl.exercises.length - 3}</span>
                )}
              </div>
            </div>
          ))}

          {/* Custom workout card */}
          <div
            className="card card-hover p-5 cursor-pointer border-dashed border-2 border-border hover:border-teal-700 flex flex-col items-center justify-center gap-3 text-center min-h-[180px] animate-fade-up opacity-0"
            style={{ animationFillMode: 'forwards', animationDelay: `${BUILT_IN_TEMPLATES.length * 60}ms` }}
            onClick={() => navigate('/workout/session/custom')}
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-teal-700/40 flex items-center justify-center text-2xl">
              +
            </div>
            <div>
              <p className="font-bold text-text-primary">Custom Workout</p>
              <p className="text-xs text-text-secondary mt-1">Build your own from the exercise library</p>
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <span className="text-5xl animate-float">🏋️</span>
              <p className="text-text-secondary text-sm">No workouts yet.</p>
              <button onClick={() => navigate('/workout/session/new')} className="btn-primary py-2.5 px-6">
                Start your first workout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((session, i) => (
                <div
                  key={session.id}
                  className="card card-hover p-4 cursor-pointer animate-fade-up opacity-0"
                  style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}
                  onClick={() => navigate(`/workout/detail/${session.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {session.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{session.name}</p>
                        <p className="text-xs text-text-secondary">{formatFullDate(session.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <p className="text-xs text-text-secondary">Volume</p>
                        <p className="text-sm font-bold text-teal-700">{fmtW(session.totalVolumeKg ?? 0)}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-text-secondary">Duration</p>
                        <p className="text-sm font-bold text-text-primary">{formatDuration(session.durationSeconds ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Exercises</p>
                        <p className="text-sm font-bold text-text-primary">{session.exercises.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
