import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import { addWeight, fetchWeightHistory, removeWeight } from '../services/weightService'
import type { WeightEntry } from '../types'
import { localTodayISO, formatFullDate } from '../utils/format'
import { useUnit, kgToDisplay, displayToKg } from '../hooks/useUnit'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function Weight() {
  const { profile } = useAuth()
  const { unit }    = useUnit()
  const uid = profile?.uid ?? ''

  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    if (!uid) return
    setLoading(true)
    const w = await fetchWeightHistory(uid)
    setWeights(w); setLoading(false)
  }

  useEffect(() => { load() }, [uid])

  const current = weights[0]
  const start   = weights[weights.length - 1]
  const change  = current && start ? current.weight - start.weight : 0
  const target  = profile?.targetWeight ?? current?.weight ?? 70

  const chartData = [...weights].reverse().slice(-30).map(w => ({
    date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    kg: unit === 'lbs' ? Math.round(kgToDisplay(w.weight, 'lbs') * 10) / 10 : w.weight,
  }))

  if (loading) return <PageLoader variant="weight" />

  const tooltipStyle = { background: 'rgb(30,28,52)', border: '1px solid rgba(108,65,210,0.3)', borderRadius: '12px', fontSize: '11px' }

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Weight <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Track your weight progress over time</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-purple btn-sm">+ Log Weight</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: '⚖️', label: 'Current Weight', card: 'card-purple', accent: '#8b5cf6',
            value: current ? kgToDisplay(current.weight, unit).toFixed(1) : '—',
          },
          {
            icon: '🎯', label: 'Goal Weight', card: 'card-teal', accent: '#2dc3be',
            value: kgToDisplay(target, unit).toFixed(1),
          },
          {
            icon: change >= 0 ? '📈' : '📉', label: 'Total Change', card: 'card-yellow', accent: '#f59e0b',
            value: `${change >= 0 ? '+' : ''}${kgToDisplay(change, unit).toFixed(1)}`,
          },
        ].map((s, i) => (
          <div key={s.label}
            className={`${s.card} p-5 rounded-2xl animate-fade-up opacity-0`}
            style={{ animationFillMode: 'forwards', animationDelay: `${i * 70}ms` }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl mb-3"
              style={{ background: `${s.accent}20`, border: `1px solid ${s.accent}35` }}>
              {s.icon}
            </div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{s.label}</p>
            <p className="text-3xl font-black text-text-primary tracking-tight">
              {s.value}
              <span className="text-sm font-normal text-text-muted ml-1.5">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card card-shadow p-5 rounded-2xl mb-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '220ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-text-primary">Weight Trend</h2>
              <p className="text-xs text-text-muted mt-0.5">Last 30 entries</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(108,65,210,0.15)', color: '#a78bfa', border: '1px solid rgba(108,65,210,0.3)' }}>
              {unit}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false}
                unit={unit === 'lbs' ? 'lb' : 'kg'} width={36} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v} ${unit}`, 'Weight']} />
              <Area type="monotone" dataKey="kg" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#wGrad)"
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: 'rgb(22,21,38)' }}
                activeDot={{ r: 6, fill: '#ec4899', stroke: 'rgb(22,21,38)', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="card card-shadow p-5 rounded-2xl">
        <h2 className="text-sm font-black text-text-primary mb-4">Weight History</h2>
        {weights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-20 w-20 rounded-2xl card-purple flex items-center justify-center text-4xl animate-float">⚖️</div>
            <p className="text-base font-black text-text-primary">No entries yet</p>
            <p className="text-sm text-text-muted">Start tracking to see your progress</p>
            <button onClick={() => setShowAdd(true)} className="btn-purple px-8 py-2.5">Log First Weight</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {weights.map((w, i) => (
              <div key={w.id}
                className="flex items-center justify-between p-4 rounded-xl transition-all animate-fade-up opacity-0"
                style={{
                  animationFillMode: 'forwards', animationDelay: `${i * 25}ms`,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                <div>
                  <p className="text-sm font-bold text-text-primary">{formatFullDate(w.date)}</p>
                  {w.note && <p className="text-xs text-text-muted mt-0.5 italic">"{w.note}"</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black text-text-primary">
                    {kgToDisplay(w.weight, unit).toFixed(1)}
                    <span className="text-sm font-normal text-text-muted ml-1">{unit}</span>
                  </p>
                  <button onClick={async () => { await removeWeight(uid, w.id); load() }}
                    aria-label={`Delete ${formatFullDate(w.date)}`}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddWeightModal uid={uid} unit={unit} lastWeightKg={current?.weight}
          onClose={() => setShowAdd(false)} onAdded={load} />
      )}
    </div>
  )
}

function AddWeightModal({ uid, unit, lastWeightKg, onClose, onAdded }: {
  uid: string; unit: 'kg' | 'lbs'; lastWeightKg?: number; onClose: () => void; onAdded: () => void
}) {
  const [date, setDate]     = useState(localTodayISO())
  const [weight, setWeight] = useState('')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [showOutlier, setShowOutlier] = useState(false)

  async function saveEntry() {
    setSaving(true); setError('')
    try {
      const kg = displayToKg(Number(weight), unit)
      await addWeight(uid, kg, date, note)
      onAdded(); onClose()
    } catch { setError('Failed to save. Please try again.') }
    finally { setSaving(false) }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!weight) { setError('Enter your weight.'); return }
    if (lastWeightKg !== undefined) {
      const enteredKg = displayToKg(Number(weight), unit)
      if (Math.abs(enteredKg - lastWeightKg) > 15) { setShowOutlier(true); return }
    }
    await saveEntry()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card card-shadow p-6 rounded-2xl"
          style={{ border: '1px solid rgba(108,65,210,0.25)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-text-primary">Log Weight</h2>
              <p className="text-xs text-text-muted mt-0.5">Track your progress</p>
            </div>
            <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
          </div>

          {showOutlier ? (
            <div className="flex flex-col gap-4">
              <div className="card-yellow p-4 rounded-xl">
                <p className="text-sm font-black text-text-primary mb-1.5">⚠️ Unusual Entry</p>
                <p className="text-xs text-text-muted leading-relaxed">
                  This entry ({weight} {unit}) differs by more than 15 kg from your last logged weight. Are you sure?
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowOutlier(false)} className="btn-ghost flex-1">← Edit</button>
                <button onClick={saveEntry} disabled={saving} className="btn-purple flex-1">
                  {saving && <LoadingSpinner size="sm" />} Yes, save it
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Date</label>
                <input type="date" value={date} max={localTodayISO()} onChange={e => setDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Weight ({unit})</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                  className="input" step="0.1" min={20} max={300}
                  placeholder={unit === 'lbs' ? '150' : '70'} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Note (optional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  className="input" placeholder="Felt great today" maxLength={200} />
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
          )}
        </div>
      </div>
    </div>
  )
}
