import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { fetchWorkoutHistory, fetchHeatmap } from '../services/workoutService'
import type { WorkoutSession } from '../types/workout'
import { CATEGORY_LABELS } from '../types/workout'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { formatFullDate } from '../utils/format'

const TEMPLATE_ICONS: Record<string, string> = {
  tpl_push: '💪', tpl_pull: '🔙', tpl_legs: '🦵',
  tpl_upper: '🏋️', tpl_lower: '⬇️', tpl_full_body: '🏃',
  tpl_hiit: '🔥', tpl_5x5: '⚡',
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
    Promise.all([
      fetchWorkoutHistory(profile.uid),
      fetchHeatmap(profile.uid),
    ]).then(([h, m]) => {
      setHistory(h)
      setHeatmap(m)
    }).finally(() => setLoading(false))
  }, [profile])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Workout <span className="gradient-text">Hub</span></h1>
          <p className="text-sm text-text-secondary mt-1">Templates & workout history</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Heatmap card */}
          <div className="card p-6 mb-6">
            <h2 className="text-base font-bold text-text-primary mb-4">Activity Heatmap</h2>
            <WorkoutHeatmap data={heatmap} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-5 w-fit">
            {(['templates', 'history'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}>
                {tab === 'templates' ? '📋 Templates' : '📚 History'}
              </button>
            ))}
          </div>

          {/* Templates tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BUILT_IN_TEMPLATES.map((t, i) => {
                const icon = TEMPLATE_ICONS[t.id] ?? '🏋️'
                return (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/workout/session/${t.id}`)}
                    className="card card-hover p-5 text-left animate-fade-up opacity-0"
                    style={{ animationFillMode: 'forwards', animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{icon}</span>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-text-primary mb-1">{t.name}</h3>
                        <p className="text-xs text-text-secondary">{CATEGORY_LABELS[t.category]}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted mb-3">{t.description}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="badge badge-brand">{t.exercises.length} exercises</span>
                      <span>•</span>
                      <span>{t.exercises.reduce((sum, e) => sum + e.defaultSets, 0)} sets</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <span className="text-5xl animate-float">🏋️</span>
                  <p className="text-sm text-text-secondary">No workout history yet</p>
                  <button onClick={() => setActiveTab('templates')} className="btn-purple py-2.5 px-6">
                    Start your first workout
                  </button>
                </div>
              ) : (
                history.map((w, i) => (
                  <div key={w.id} className="card p-5 animate-fade-up opacity-0"
                    style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-bold text-text-primary">{w.name}</h3>
                        <p className="text-xs text-text-secondary mt-0.5">{formatFullDate(w.date)}</p>
                      </div>
                      {w.startedAt && w.finishedAt && (
                        <span className="badge badge-teal">
                          {Math.round((w.finishedAt - w.startedAt) / 60000)} min
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {w.exercises.map((e, ei) => (
                        <div key={ei} className="px-3 py-1.5 rounded-lg bg-surface2 text-xs text-text-secondary">
                          {e.exerciseName} · {e.sets.length} sets
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
function WorkoutHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const map = new Map(data.map(d => [d.date, d.count]))
  const today = new Date()
  const days: { date: string; count: number }[] = []
  for (let i = 111; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    days.push({ date: iso, count: map.get(iso) ?? 0 })
  }
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  function cellColor(count: number) {
    if (count === 0) return 'bg-surface2'
    if (count === 1) return 'bg-purple-200 dark:bg-purple-900'
    if (count === 2) return 'bg-purple-400 dark:bg-purple-700'
    return 'bg-purple-600 dark:bg-purple-500'
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
        {[0, 1, 2, 3].map(n => (
          <div key={n} className={`h-3 w-3 rounded-sm ${cellColor(n)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
