import { useEffect, useState, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLoader from '../components/PageLoader'
import { saveMeasurement, fetchMeasurements, removeMeasurement, fetchProgressSummary } from '../services/progressService'
import type { ProgressSummary } from '../services/progressService'
import { fetchWorkoutHistory, fetchPersonalRecords } from '../services/workoutService'
import type { WorkoutSession, PersonalRecord } from '../types/workout'
import type { Measurement, Badge } from '../types/progress'
import { MEASUREMENT_FIELDS } from '../types/progress'
import { localTodayISO, formatFullDate, formatDate, dateToISO } from '../utils/format'
import { computeTrainingLoad, ZONE_META } from '../utils/trainingLoad'
import {
  estimateBodyComposition, bodyFatCategory, bodyCompMissingFields,
  latestNavyEligibleMeasurement,
} from '../utils/bodyComp'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { useUnit, kgToDisplay } from '../hooks/useUnit'
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// templateId → category map so the load engine can resolve MET per session
const TEMPLATE_CATEGORIES: Record<string, string> = Object.fromEntries(
  BUILT_IN_TEMPLATES.map(t => [t.id, t.category]),
)

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all ${
      badge.earned
        ? 'card-green hover:-translate-y-0.5 hover:shadow-lg cursor-default'
        : 'opacity-40 grayscale cursor-default'
    }`}
    style={{
      border: badge.earned ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
      background: badge.earned ? undefined : 'rgba(255,255,255,0.03)',
    }}>
      <div className={`text-3xl ${badge.earned ? 'animate-float' : ''}`}>{badge.icon}</div>
      <p className="text-xs font-black leading-tight text-text-primary">{badge.name}</p>
      <p className="text-[10px] text-text-muted leading-snug">{badge.description}</p>
      {badge.earned && (
        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full gradient-brand flex items-center justify-center"
          style={{ boxShadow: '0 2px 8px rgba(108,65,210,0.5)' }}>
          <span className="text-white text-[9px] font-black">✓</span>
        </div>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="card card-shadow p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
          style={{ border: '1px solid rgba(108,65,210,0.25)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-text-primary">{title}</h2>
            <button onClick={onClose} aria-label={`Close ${title}`}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function MeasurementForm({ uid, onSaved, onClose }: { uid: string; onSaved: () => void; onClose: () => void }) {
  const { unit } = useUnit()
  const [date, setDate]     = useState(localTodayISO())
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const hasValue = Object.values(values).some(v => v !== '' && !isNaN(Number(v)))
    if (!hasValue) { setError('Enter at least one measurement.'); return }
    setSaving(true); setError('')
    try {
      const entry: Omit<Measurement, 'id' | 'createdAt'> = { date, notes }
      for (const field of MEASUREMENT_FIELDS) {
        const v = values[field.key]
        if (v && !isNaN(Number(v))) {
          const num = Number(v)
          if (field.key === 'weight') {
            entry.weight = unit === 'lbs' ? Math.round(num / 2.20462 * 10) / 10 : num
          } else {
            (entry as Record<string, unknown>)[field.key] = num
          }
        }
      }
      await saveMeasurement(uid, entry)
      onSaved(); onClose()
    } catch { setError('Failed to save. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-bold text-text-primary mb-2">Date</label>
        <input type="date" value={date} max={localTodayISO()} onChange={e => setDate(e.target.value)} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MEASUREMENT_FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-bold text-text-muted mb-1.5">
              {f.icon} {f.label} ({f.key === 'weight' ? unit : f.unit})
            </label>
            <input type="number" step="0.1" min={0}
              value={values[f.key] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="input py-2.5 text-sm" placeholder="—" />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-bold text-text-primary mb-2">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          className="input" placeholder="Optional note" maxLength={200} />
      </div>
      {error && (
        <p className="text-xs text-danger rounded-xl px-4 py-2.5"
          style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.25)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
        <button type="submit" disabled={saving} className="btn-purple flex-1">
          {saving && <LoadingSpinner size="sm" />} Save
        </button>
      </div>
    </form>
  )
}

export default function Progress() {
  const { profile } = useAuth()
  const { unit }    = useUnit()
  const uid = profile?.uid ?? ''

  const [summary, setSummary]           = useState<ProgressSummary | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [workouts, setWorkouts]         = useState<WorkoutSession[]>([])
  const [prs, setPrs]                   = useState<PersonalRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [loadError, setLoadError]       = useState('')
  const [showAdd, setShowAdd]           = useState(false)
  const [activeTab, setActiveTab]       = useState<'overview' | 'load' | 'measurements' | 'badges'>('overview')

  async function load() {
    if (!uid) return
    setLoading(true)
    setLoadError('')
    try {
      const [sum, meas, wo, pr] = await Promise.all([
        fetchProgressSummary(uid), fetchMeasurements(uid),
        fetchWorkoutHistory(uid), fetchPersonalRecords(uid),
      ])
      setSummary(sum); setMeasurements(meas); setWorkouts(wo); setPrs(pr)
    } catch {
      setLoadError('Some progress data failed to load. Pull a refresh or retry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [uid])

  // ── Weekly training volume — real kg lifted, last 8 Monday-based weeks ──
  // (plain derivation, not useMemo — runs before the early return to keep hook order stable)
  const mondayOf = (d: Date) => {
    const m = new Date(d); m.setHours(0, 0, 0, 0)
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
    return m
  }
  const volumeChart: { week: string; volume: number }[] = []
  if (!loading) {
    const buckets = new Map<string, number>()
    for (let i = 7; i >= 0; i--) {
      const w = mondayOf(new Date()); w.setDate(w.getDate() - i * 7)
      buckets.set(dateToISO(w), 0)
    }
    workouts.forEach(s => {
      const key = dateToISO(mondayOf(new Date(s.date + 'T00:00:00')))
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + (s.totalVolumeKg || 0))
    })
    buckets.forEach((kg, week) => {
      volumeChart.push({
        week: formatDate(week),
        volume: unit === 'lbs' ? Math.round(kgToDisplay(kg, 'lbs')) : Math.round(kg),
      })
    })
    // Map insertion order (oldest week → newest) is already chronological
  }

  const rankedPrs = [...prs].sort((a, b) => b.oneRepMaxKg - a.oneRepMaxKg).slice(0, 6)

  // ── Training-load engine (sTRIMP load, ACWR, monotony/strain, readiness)
  //    from real sessions — plain derivation to keep hook order stable ──
  const loadSummary = !loading && profile
    ? computeTrainingLoad(workouts, profile.weight, TEMPLATE_CATEGORIES)
    : null

  // ── U.S. Navy body-fat estimate from the newest eligible tape record ──
  const navySource = !loading && profile
    ? latestNavyEligibleMeasurement(measurements, profile.gender)
    : undefined
  const bodyComp = profile && navySource
    ? estimateBodyComposition(navySource, profile.height, profile.gender, profile.weight)
    : null

  if (loading) return <PageLoader variant="progress" />

  const weightChartData = [...measurements].filter(m => m.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(-16)
    .map(m => ({ date: formatDate(m.date), weight: unit === 'lbs' ? Math.round(kgToDisplay(m.weight!, 'lbs') * 10) / 10 : m.weight }))

  const waistChartData = [...measurements].filter(m => m.waist != null)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(-16)
    .map(m => ({ date: formatDate(m.date), waist: m.waist }))

  const earnedBadges = summary?.badges.filter(b => b.earned)  ?? []
  const lockedBadges = summary?.badges.filter(b => !b.earned) ?? []
  const streak       = summary?.streak

  const tooltipStyle = { background: 'rgb(30,28,52)', border: '1px solid rgba(108,65,210,0.3)', borderRadius: '12px', fontSize: '11px' }

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-7">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Progress <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1">Measurements, streaks & milestones</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-purple btn-sm self-start sm:self-auto">+ Log Measurements</button>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-xs text-amber-300 animate-fade-in"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          ⚠ {loadError}
          <button onClick={load} className="ml-2 font-bold underline">Retry</button>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="card-orange p-3 sm:p-5 rounded-2xl flex flex-col items-center gap-1 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <span className="text-2xl sm:text-3xl animate-float">🔥</span>
          <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-0.5 sm:mt-1">{streak?.currentStreak ?? 0}</p>
          <p className="text-[10px] sm:text-xs font-semibold text-text-muted">day streak</p>
          {(streak?.currentStreak ?? 0) > 0 && (
            <p className="text-[10px] text-text-muted">Best: {streak?.longestStreak}d</p>
          )}
        </div>
        {[
          { label: 'Active Days',   value: streak?.totalActiveDays ?? 0,    icon: '📅', card: 'card-purple' },
          { label: 'Badges Earned', value: earnedBadges.length,              icon: '🏅', card: 'card-green'  },
          { label: 'Measurements',  value: summary?.measurementCount ?? 0,   icon: '📏', card: 'card-blue'   },
        ].map((s, i) => (
          <div key={s.label}
            className={`${s.card} p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0`}
            style={{ animationFillMode: 'forwards', animationDelay: `${(i+1)*65}ms` }}>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-white/10 flex items-center justify-center text-lg sm:text-xl mb-1.5 sm:mb-2">{s.icon}</div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{s.value}</p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-text-muted mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl mb-4 sm:mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {(['overview', 'load', 'measurements', 'badges'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all capitalize ${
              activeTab === tab ? 'gradient-brand text-white' : 'text-text-muted hover:text-text-primary'
            }`}
            style={activeTab === tab ? { boxShadow: '0 4px 14px rgba(108,65,210,0.4)' } : {}}>
            {tab === 'overview' ? '📊 Overview' : tab === 'load' ? '⚡ Load' : tab === 'measurements' ? '📏 Measures' : '🏅 Badges'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-3 sm:gap-5">
          {/* Weekly training volume — real lifted tonnage by week */}
          <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-text-primary">Weekly Training Volume</h2>
                <p className="text-xs text-text-muted mt-0.5">Total weight lifted per week · last 8 weeks</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('load')}
                  className="text-xs font-bold px-3 py-1 rounded-full transition-colors hover:opacity-80"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                  ⚡ Load analysis →
                </button>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(108,65,210,0.15)', color: '#a78bfa', border: '1px solid rgba(108,65,210,0.3)' }}>
                  {unit}
                </span>
              </div>
            </div>
            {volumeChart.every(v => v.volume === 0) ? (
              <div className="flex h-36 flex-col items-center justify-center gap-3 opacity-40">
                <span className="text-4xl">🏋️</span>
                <p className="text-sm text-text-muted text-center">Log weight-based workouts to build your volume curve</p>
                <Link to="/workout" className="text-xs text-purple-400 hover:underline font-semibold">Browse templates →</Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={volumeChart} margin={{ top: 5, right: 5, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} width={44} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [`${Number(v).toLocaleString()} ${unit}`, 'Volume']} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="volume" radius={[6, 6, 2, 2]} maxBarSize={38}
                    fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Personal records leaderboard */}
          {rankedPrs.length > 0 && (
            <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: '60ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-black text-text-primary">Personal Records</h2>
                  <p className="text-xs text-text-muted mt-0.5">Best estimated 1RM per exercise</p>
                </div>
                <span className="text-lg">🏆</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rankedPrs.map((pr, i) => (
                  <div key={pr.exerciseId} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'card-yellow' : 'card-purple'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{pr.exerciseName}</p>
                      <p className="text-[10px] text-text-muted">{formatFullDate(pr.achievedAt.slice(0, 10))}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-text-primary">{kgToDisplay(pr.oneRepMaxKg, unit)} <span className="text-[10px] font-normal text-text-muted">{unit} 1RM</span></p>
                      <p className="text-[10px] text-text-muted">{kgToDisplay(pr.weightKg, unit)}{unit} × {pr.reps}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-text-primary">Weight Trend</h2>
                <p className="text-xs text-text-muted mt-0.5">From measurements</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'rgba(108,65,210,0.15)', color: '#a78bfa', border: '1px solid rgba(108,65,210,0.3)' }}>
                {unit}
              </span>
            </div>
            {weightChartData.length < 2 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3 opacity-40">
                <span className="text-4xl">📈</span>
                <p className="text-sm text-text-muted">Log measurements with weight to see your trend</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wGradP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} unit={unit === 'lbs' ? 'lb' : 'kg'} width={36} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v} ${unit}`, 'Weight']} />
                  <Area type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#wGradP)"
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: 'rgb(22,21,38)' }}
                    activeDot={{ r: 6, fill: '#ec4899', stroke: 'rgb(22,21,38)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {waistChartData.length >= 2 && (
            <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: '80ms' }}>
              <h2 className="text-sm font-black text-text-primary mb-4">Waist Trend</h2>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={waistChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} unit="cm" width={32} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v} cm`, 'Waist']} />
                  <Line type="monotone" dataKey="waist" stroke="#f59e0b" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: 'rgb(22,21,38)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {earnedBadges.length > 0 && (
            <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: '160ms' }}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-sm font-black text-text-primary">Your Badges</h2>
                <button onClick={() => setActiveTab('badges')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                {earnedBadges.slice(0, 6).map(b => (
                  <div key={b.id} title={`${b.name}: ${b.description}`}
                    className="flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl card-green"
                    style={{ border: '1px solid rgba(16,185,129,0.25)' }}>
                    <span className="text-xl sm:text-2xl">{b.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-text-primary text-center leading-tight">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training load — sTRIMP units, acute:chronic ratio, readiness */}
      {activeTab === 'load' && (
        <div className="flex flex-col gap-3 sm:gap-5">
          {!loadSummary || loadSummary.chronicWeekly === 0 ? (
            <div className="card card-shadow p-6 sm:p-10 rounded-2xl flex flex-col items-center gap-3 text-center animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
              <span className="text-4xl">⚡</span>
              <p className="text-sm font-black text-text-primary">No training load yet</p>
              <p className="text-xs text-text-muted max-w-sm">Finish a few timed workouts — load, acute:chronic ratio and readiness unlock once real sessions are logged.</p>
              <Link to="/workout" className="btn-purple btn-sm mt-1">Start a workout →</Link>
            </div>
          ) : (
            <>
              {/* Readiness · ACWR · Weekly stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Readiness ring */}
                <div className="card card-shadow p-4 sm:p-5 rounded-2xl flex items-center gap-4 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <svg viewBox="0 0 96 96" className="h-20 w-20 -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                      <circle cx="48" cy="48" r="40" fill="none"
                        stroke={loadSummary.readiness >= 70 ? '#10b981' : loadSummary.readiness >= 45 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="9" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 40 * loadSummary.readiness / 100} ${2 * Math.PI * 40}`}
                        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-text-primary">{loadSummary.readiness}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary">Readiness</p>
                    <p className="text-[11px] text-text-muted leading-snug mt-1">
                      Load-pattern recovery score from your last 28 days of training.
                    </p>
                  </div>
                </div>

                {/* ACWR zone */}
                <div className="card card-shadow p-4 sm:p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '60ms' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-black text-text-primary">Acute : Chronic</p>
                    <span className="text-lg font-black" style={{ color: ZONE_META[loadSummary.zone].color }}>
                      {loadSummary.acwr != null ? loadSummary.acwr.toFixed(2) : '—'}
                    </span>
                  </div>
                  {/* Zone meter: 0 → 2.0 mapped across the bar */}
                  <div className="relative h-2.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '40%', background: 'rgba(96,165,250,0.45)' }} />
                    <div style={{ width: '25%', background: 'rgba(16,185,129,0.5)' }} />
                    <div style={{ width: '10%', background: 'rgba(245,158,11,0.5)' }} />
                    <div style={{ width: '25%', background: 'rgba(239,68,68,0.45)' }} />
                    {loadSummary.acwr != null && (
                      <div className="absolute top-1/2 -translate-y-1/2 h-4 w-1.5 rounded-full bg-white"
                        style={{ left: `calc(${Math.min(100, (Math.min(loadSummary.acwr, 2) / 2) * 100)}% - 3px)`, boxShadow: '0 0 6px rgba(255,255,255,0.7)', transition: 'left 0.6s ease' }} />
                    )}
                  </div>
                  <p className="text-[10px] font-bold mt-2" style={{ color: ZONE_META[loadSummary.zone].color }}>
                    {ZONE_META[loadSummary.zone].label}
                  </p>
                  <p className="text-[11px] text-text-muted leading-snug mt-0.5">{ZONE_META[loadSummary.zone].advice}</p>
                </div>

                {/* Numbers */}
                <div className="card card-shadow p-4 sm:p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '120ms' }}>
                  <p className="text-sm font-black text-text-primary mb-2">This Week</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <p className="text-text-muted">Acute load <span className="font-black text-text-primary">{Math.round(loadSummary.acuteLoad)}</span></p>
                    <p className="text-text-muted">Avg weekly <span className="font-black text-text-primary">{loadSummary.chronicWeekly}</span></p>
                    <p className="text-text-muted">Sessions <span className="font-black text-text-primary">{loadSummary.sessionsLast7}</span></p>
                    <p className="text-text-muted">Rest days <span className="font-black text-text-primary">{loadSummary.restDaysLast7}/7</span></p>
                    <p className="text-text-muted">Monotony <span className="font-black text-text-primary">{loadSummary.monotony ?? '—'}</span></p>
                    <p className="text-text-muted">Strain <span className="font-black text-text-primary">{loadSummary.strain ?? '—'}</span></p>
                  </div>
                </div>
              </div>

              {/* 28-day daily load */}
              <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '180ms' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-black text-text-primary">Daily Training Load — last 28 days</h2>
                    <p className="text-xs text-text-muted mt-0.5">Intensity-weighted (sTRIMP-style) · red days exceed 150% of your average</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={loadSummary.daily.map(d => ({ ...d, label: formatDate(d.date) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" interval={3} tick={{ fontSize: 9, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v} units`, 'Load']} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="load" radius={[4, 4, 1, 1]} maxBarSize={16}>
                      {loadSummary.daily.map((d, i) => (
                        <Cell key={i} fill={
                          d.load > loadSummary.chronicWeekly / 7 * 1.5 ? '#ef4444'
                            : d.load > 0 ? '#8b5cf6'
                            : 'rgba(255,255,255,0.05)'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* Measurements */}
      {activeTab === 'measurements' && (
        <div className="flex flex-col gap-3">
          {/* Body composition — U.S. Navy circumference method */}
          {bodyComp ? (
            <div className="card card-shadow p-4 sm:p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-black text-text-primary">Body Composition</h2>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    U.S. Navy estimate · from your {formatFullDate(bodyComp.basedOnDate)} tape log
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black"
                  style={{
                    background: `${bodyFatCategory(bodyComp.bodyFatPct, profile!.gender).color}1f`,
                    color: bodyFatCategory(bodyComp.bodyFatPct, profile!.gender).color,
                    border: `1px solid ${bodyFatCategory(bodyComp.bodyFatPct, profile!.gender).color}4d`,
                  }}>
                  {bodyFatCategory(bodyComp.bodyFatPct, profile!.gender).label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="card-purple rounded-xl px-3 py-3 text-center">
                  <p className="text-[10px] text-text-muted font-semibold">Body Fat</p>
                  <p className="text-xl font-black text-text-primary mt-0.5">{bodyComp.bodyFatPct}<span className="text-xs font-normal text-text-muted">%</span></p>
                </div>
                <div className="card-green rounded-xl px-3 py-3 text-center">
                  <p className="text-[10px] text-text-muted font-semibold">Lean Mass</p>
                  <p className="text-xl font-black text-text-primary mt-0.5">{kgToDisplay(bodyComp.leanMassKg, unit).toFixed(1)}<span className="text-xs font-normal text-text-muted"> {unit}</span></p>
                </div>
                <div className="card-blue rounded-xl px-3 py-3 text-center">
                  <p className="text-[10px] text-text-muted font-semibold">Fat Mass</p>
                  <p className="text-xl font-black text-text-primary mt-0.5">{kgToDisplay(bodyComp.fatMassKg, unit).toFixed(1)}<span className="text-xs font-normal text-text-muted"> {unit}</span></p>
                </div>
              </div>
              {!bodyComp.confident && (
                <p className="text-[10px] text-amber-300/80 mt-2">ℹ️ Outside the method's most accurate range — treat as a trend marker, not a clinical value.</p>
              )}
            </div>
          ) : profile && (
            <div className="p-3 sm:p-4 rounded-2xl animate-fade-up opacity-0"
              style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)', animationFillMode: 'forwards' }}>
              <p className="text-xs font-black text-text-primary mb-0.5">🎯 Unlock your body-fat estimate</p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {profile.gender === 'other'
                  ? 'The U.S. Navy method needs a binary gender setting for its validated formulas.'
                  : `Log a measurement with ${bodyCompMissingFields(measurements[0], profile.gender, profile.height).join(', ') || 'waist & neck'} (cm) to calculate body composition from tape measurements.`}
              </p>
            </div>
          )}

          {measurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="h-20 w-20 rounded-2xl card-purple flex items-center justify-center text-4xl animate-float">📏</div>
              <p className="text-base font-black text-text-primary">No measurements yet</p>
              <p className="text-sm text-text-muted">Start logging to track your body composition</p>
              <button onClick={() => setShowAdd(true)} className="btn-purple px-8 py-2.5">Log First Measurement</button>
            </div>
          ) : (
            measurements.map((m, i) => (
              <div key={m.id}
                className="card card-shadow p-3 sm:p-5 rounded-2xl hover:-translate-y-0.5 transition-all animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div>
                    <p className="text-sm font-black text-text-primary">{formatFullDate(m.date)}</p>
                    {m.notes && <p className="text-xs text-text-muted mt-0.5 italic">"{m.notes}"</p>}
                  </div>
                  <button onClick={async () => { await removeMeasurement(uid, m.id); load() }}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    aria-label="Delete">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
                  {MEASUREMENT_FIELDS.map(f => {
                    const raw = m[f.key] as number | undefined
                    if (raw == null) return null
                    const display = f.key === 'weight' ? kgToDisplay(raw, unit) : raw
                    const dUnit   = f.key === 'weight' ? unit : f.unit
                    return (
                      <div key={f.key} className="card-purple rounded-xl px-3 py-2 text-center">
                        <p className="text-[10px] text-text-muted font-semibold">{f.icon} {f.label}</p>
                        <p className="font-black text-text-primary text-sm mt-0.5">
                          {display} <span className="text-xs font-normal text-text-muted">{dUnit}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Badges */}
      {activeTab === 'badges' && (
        <div className="flex flex-col gap-6">
          {earnedBadges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-black text-text-primary">Earned</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                  {earnedBadges.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {earnedBadges.map(b => <BadgeCard key={b.id} badge={b} />)}
              </div>
            </div>
          )}
          {lockedBadges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-black text-text-muted">Locked</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(170,165,210,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {lockedBadges.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {lockedBadges.map(b => <BadgeCard key={b.id} badge={b} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <Modal title="Log Measurements" onClose={() => setShowAdd(false)}>
          <MeasurementForm uid={uid} onSaved={load} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
