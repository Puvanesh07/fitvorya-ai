import { useEffect, useState, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLoader from '../components/PageLoader'
import {
  saveMeasurement, fetchMeasurements, removeMeasurement, fetchProgressSummary,
} from '../services/progressService'
import type { ProgressSummary } from '../services/progressService'
import type { Measurement, Badge } from '../types/progress'
import { MEASUREMENT_FIELDS } from '../types/progress'
import { todayISO, formatFullDate } from '../utils/format'
import { useUnit } from '../hooks/useUnit'
import { kgToDisplay } from '../hooks/useUnit'
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { formatDate } from '../utils/format'

// ── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
      badge.earned
        ? 'border-teal-700/30 bg-teal-50 dark:bg-teal-900/15 card-hover'
        : 'border-border bg-surface2 opacity-40 grayscale'
    }`}>
      <div className={`text-3xl transition-all ${badge.earned ? 'animate-float' : ''}`}>
        {badge.icon}
      </div>
      <p className={`text-xs font-bold leading-tight ${badge.earned ? 'text-text-primary' : 'text-text-secondary'}`}>
        {badge.name}
      </p>
      <p className="text-[10px] text-text-secondary leading-snug">{badge.description}</p>
      {badge.earned && (
        <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full gradient-brand flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">✓</span>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="card p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold font-display text-text-primary">{title}</h2>
            <button onClick={onClose}
              className="h-7 w-7 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-secondary transition-colors">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Measurement form ──────────────────────────────────────────────────────────
function MeasurementForm({
  uid, onSaved, onClose,
}: { uid: string; onSaved: () => void; onClose: () => void }) {
  const { unit } = useUnit()
  const [date, setDate] = useState(todayISO())
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const hasValue = Object.values(values).some(v => v !== '' && !isNaN(Number(v)))
    if (!hasValue) { setError('Enter at least one measurement.'); return }
    setSaving(true)
    setError('')
    try {
      const entry: Omit<Measurement, 'id' | 'createdAt'> = { date, notes }
      for (const field of MEASUREMENT_FIELDS) {
        const v = values[field.key]
        if (v && !isNaN(Number(v))) {
          // Convert weight from display unit to kg
          const num = Number(v)
          if (field.key === 'weight') {
            entry.weight = unit === 'lbs' ? Math.round(num / 2.20462 * 10) / 10 : num
          } else {
            (entry as Record<string, unknown>)[field.key] = num
          }
        }
      }
      await saveMeasurement(uid, entry)
      onSaved()
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Date</label>
        <input type="date" value={date} max={todayISO()}
          onChange={(e) => setDate(e.target.value)} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MEASUREMENT_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {f.icon} {f.label} ({f.key === 'weight' ? unit : f.unit})
            </label>
            <input
              type="number" step="0.1" min={0}
              value={values[f.key] ?? ''}
              onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="input py-2 text-sm"
              placeholder="—"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Notes</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
          className="input" placeholder="Optional note" maxLength={200} />
      </div>
      {error && <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving && <LoadingSpinner size="sm" />} Save
        </button>
      </div>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Progress() {
  const { profile } = useAuth()
  const { unit } = useUnit()
  const uid = profile?.uid ?? ''

  const [summary, setSummary]         = useState<ProgressSummary | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading]         = useState(true)
  const [showAdd, setShowAdd]         = useState(false)
  const [activeTab, setActiveTab]     = useState<'overview' | 'measurements' | 'badges'>('overview')

  async function load() {
    if (!uid) return
    setLoading(true)
    const [sum, meas] = await Promise.all([
      fetchProgressSummary(uid),
      fetchMeasurements(uid),
    ])
    setSummary(sum)
    setMeasurements(meas)
    setLoading(false)
  }

  useEffect(() => { load() }, [uid])

  if (loading) return <PageLoader />

  // Chart data — weight trend from measurements
  const weightChartData = [...measurements]
    .filter(m => m.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-16)
    .map(m => ({
      date: formatDate(m.date),
      weight: unit === 'lbs'
        ? Math.round(kgToDisplay(m.weight!, 'lbs') * 10) / 10
        : m.weight,
    }))

  // Waist trend
  const waistChartData = [...measurements]
    .filter(m => m.waist != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-16)
    .map(m => ({ date: formatDate(m.date), waist: m.waist }))

  const earnedBadges  = summary?.badges.filter(b => b.earned)  ?? []
  const lockedBadges  = summary?.badges.filter(b => !b.earned) ?? []
  const streak = summary?.streak

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            Progress <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Measurements, streaks, and milestones.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-purple py-2.5 px-5">
          📏 Log Measurements
        </button>
      </div>

      {/* Streak + summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {/* Streak card */}
            <div className="card card-hover p-5 col-span-2 sm:col-span-1 flex flex-col items-center gap-2 animate-fade-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: '0ms' }}>
              <span className="text-3xl animate-float">🔥</span>
              <p className="stat-number text-4xl text-coral-400">{streak?.currentStreak ?? 0}</p>
              <p className="text-xs text-text-secondary text-center">day streak</p>
              {(streak?.currentStreak ?? 0) > 0 && (
                <p className="text-[10px] text-teal-700 font-semibold">Best: {streak?.longestStreak} days</p>
              )}
            </div>

            {[
              { label: 'Total Active Days', value: streak?.totalActiveDays ?? 0,    icon: '📅', color: 'text-teal-700' },
              { label: 'Badges Earned',     value: earnedBadges.length,             icon: '🏅', color: 'text-warning'  },
              { label: 'Measurements',      value: summary?.measurementCount ?? 0,  icon: '📏', color: 'text-teal-700' },
            ].map((s, i) => (
              <div key={s.label} className="card card-hover p-4 sm:p-5 animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${(i + 1) * 75}ms` }}>
                <span className="text-xl mb-2 block">{s.icon}</span>
                <p className={`stat-number text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-text-secondary mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-5 w-fit">
            {(['overview', 'measurements', 'badges'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}>
                {tab === 'overview' ? '📊 Overview' : tab === 'measurements' ? '📏 Measurements' : '🏅 Badges'}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-5">
              {/* Weight trend chart */}
              <div className="card p-5 sm:p-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold font-display text-text-primary">Weight Trend</h2>
                  <span className="badge badge-teal">{unit}</span>
                </div>
                {weightChartData.length < 2 ? (
                  <div className="flex h-40 flex-col items-center justify-center gap-2">
                    <span className="text-3xl animate-float">📈</span>
                    <p className="text-sm text-text-secondary">Log measurements with weight to see trend.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weightChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wGradP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="rgb(15 118 110)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="rgb(15 118 110)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} unit={unit === 'lbs' ? ' lb' : ' kg'} />
                      <Tooltip
                        contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(v) => [`${v} ${unit}`, 'Weight']}
                      />
                      <Area type="monotone" dataKey="weight" stroke="rgb(15 118 110)" strokeWidth={2.5}
                        fill="url(#wGradP)" dot={{ r: 4, fill: 'rgb(15 118 110)', strokeWidth: 0 }} activeDot={{ r: 6, fill: 'rgb(251 146 60)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Waist trend chart */}
              {waistChartData.length >= 2 && (
                <div className="card p-5 sm:p-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}>
                  <h2 className="font-bold font-display text-text-primary mb-5">Waist Trend</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={waistChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} unit=" cm" />
                      <Tooltip
                        contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(v) => [`${v} cm`, 'Waist']}
                      />
                      <Line type="monotone" dataKey="waist" stroke="rgb(251 146 60)" strokeWidth={2.5}
                        dot={{ r: 4, fill: 'rgb(251 146 60)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Earned badges preview */}
              {earnedBadges.length > 0 && (
                <div className="card p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold font-display text-text-primary">Your Badges</h2>
                    <button onClick={() => setActiveTab('badges')} className="text-xs text-teal-700 font-semibold hover:underline">
                      View all →
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {earnedBadges.slice(0, 6).map(b => (
                      <div key={b.id} title={`${b.name}: ${b.description}`}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-teal-50 dark:bg-teal-900/15 border border-teal-700/20">
                        <span className="text-2xl">{b.icon}</span>
                        <span className="text-[10px] text-teal-700 font-semibold text-center leading-tight">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Measurements tab ── */}
          {activeTab === 'measurements' && (
            <div className="flex flex-col gap-4">
              {measurements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <span className="text-5xl animate-float">📏</span>
                  <p className="text-text-secondary text-sm">No measurements yet.</p>
                  <button onClick={() => setShowAdd(true)} className="btn-primary py-2.5 px-6">
                    Log your first measurement
                  </button>
                </div>
              ) : (
                measurements.map((m, i) => (
                  <div key={m.id} className="card p-5 animate-fade-up opacity-0"
                    style={{ animationFillMode: 'forwards', animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold font-display text-text-primary">{formatFullDate(m.date)}</p>
                        {m.notes && <p className="text-xs text-text-secondary mt-0.5 italic">"{m.notes}"</p>}
                      </div>
                      <button onClick={async () => { await removeMeasurement(uid, m.id); load() }}
                        className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-danger hover:text-danger transition-all"
                        aria-label="Delete">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {MEASUREMENT_FIELDS.map(f => {
                        const raw = m[f.key] as number | undefined
                        if (raw == null) return null
                        const display = f.key === 'weight' ? kgToDisplay(raw, unit) : raw
                        const displayUnit = f.key === 'weight' ? unit : f.unit
                        return (
                          <div key={f.key} className="bg-surface2 rounded-xl px-3 py-2 text-center">
                            <p className="text-xs text-text-secondary">{f.icon} {f.label}</p>
                            <p className="font-bold text-text-primary text-sm mt-0.5">
                              {display} <span className="text-xs font-normal text-text-muted">{displayUnit}</span>
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

          {/* ── Badges tab ── */}
          {activeTab === 'badges' && (
            <div className="flex flex-col gap-6">
              {earnedBadges.length > 0 && (
                <div>
                  <h2 className="font-bold font-display text-text-primary mb-3">
                    Earned <span className="badge badge-teal ml-2">{earnedBadges.length}</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {earnedBadges.map(b => <BadgeCard key={b.id} badge={b} />)}
                  </div>
                </div>
              )}
              {lockedBadges.length > 0 && (
                <div>
                  <h2 className="font-bold font-display text-text-secondary mb-3">
                    Locked <span className="badge badge-coral ml-2">{lockedBadges.length}</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {lockedBadges.map(b => <BadgeCard key={b.id} badge={b} />)}
                  </div>
                </div>
              )}
            </div>
          )}

      {showAdd && (
        <Modal title="📏 Log Measurements" onClose={() => setShowAdd(false)}>
          <MeasurementForm uid={uid} onSaved={load} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
