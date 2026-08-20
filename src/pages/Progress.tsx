import { useEffect, useState, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLoader from '../components/PageLoader'
import { saveMeasurement, fetchMeasurements, removeMeasurement, fetchProgressSummary } from '../services/progressService'
import type { ProgressSummary } from '../services/progressService'
import type { Measurement, Badge } from '../types/progress'
import { MEASUREMENT_FIELDS } from '../types/progress'
import { localTodayISO, formatFullDate, formatDate } from '../utils/format'
import { useUnit, kgToDisplay } from '../hooks/useUnit'
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

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
  const [loading, setLoading]           = useState(true)
  const [showAdd, setShowAdd]           = useState(false)
  const [activeTab, setActiveTab]       = useState<'overview' | 'measurements' | 'badges'>('overview')

  async function load() {
    if (!uid) return
    setLoading(true)
    const [sum, meas] = await Promise.all([fetchProgressSummary(uid), fetchMeasurements(uid)])
    setSummary(sum); setMeasurements(meas); setLoading(false)
  }

  useEffect(() => { load() }, [uid])
  if (loading) return <PageLoader />

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Progress <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Measurements, streaks & milestones</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-purple btn-sm">+ Log Measurements</button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card-orange p-5 rounded-2xl flex flex-col items-center gap-1 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <span className="text-3xl animate-float">🔥</span>
          <p className="text-3xl font-black text-text-primary tracking-tight mt-1">{streak?.currentStreak ?? 0}</p>
          <p className="text-xs font-semibold text-text-muted">day streak</p>
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
            className={`${s.card} p-5 rounded-2xl animate-fade-up opacity-0`}
            style={{ animationFillMode: 'forwards', animationDelay: `${(i+1)*65}ms` }}>
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl mb-2">{s.icon}</div>
            <p className="text-3xl font-black text-text-primary tracking-tight">{s.value}</p>
            <p className="text-[11px] font-semibold text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {(['overview', 'measurements', 'badges'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
              activeTab === tab ? 'gradient-brand text-white' : 'text-text-muted hover:text-text-primary'
            }`}
            style={activeTab === tab ? { boxShadow: '0 4px 14px rgba(108,65,210,0.4)' } : {}}>
            {tab === 'overview' ? '📊 Overview' : tab === 'measurements' ? '📏 Measurements' : '🏅 Badges'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">
          <div className="card card-shadow p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
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
            <div className="card card-shadow p-5 rounded-2xl animate-fade-up opacity-0"
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
            <div className="card card-shadow p-5 rounded-2xl animate-fade-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: '160ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-text-primary">Your Badges</h2>
                <button onClick={() => setActiveTab('badges')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {earnedBadges.slice(0, 6).map(b => (
                  <div key={b.id} title={`${b.name}: ${b.description}`}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl card-green"
                    style={{ border: '1px solid rgba(16,185,129,0.25)' }}>
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-[10px] font-black text-text-primary text-center leading-tight">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Measurements */}
      {activeTab === 'measurements' && (
        <div className="flex flex-col gap-3">
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
                className="card card-shadow p-5 rounded-2xl hover:-translate-y-0.5 transition-all animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between mb-3">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
