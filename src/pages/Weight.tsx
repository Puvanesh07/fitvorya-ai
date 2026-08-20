import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import { addWeight, fetchWeightHistory, removeWeight } from '../services/weightService'
import type { WeightEntry } from '../types'
import { todayISO, formatFullDate } from '../utils/format'
import { useUnit, kgToDisplay, displayToKg } from '../hooks/useUnit'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function Weight() {
  const { profile } = useAuth()
  const { unit } = useUnit()
  const uid = profile?.uid ?? ''

  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    if (!uid) return
    setLoading(true)
    const w = await fetchWeightHistory(uid)
    setWeights(w)
    setLoading(false)
  }

  useEffect(() => { load() }, [uid])

  const current = weights[0]
  const start = weights[weights.length - 1]
  const change = current && start ? current.weight - start.weight : 0
  const target = profile?.targetWeight ?? current?.weight ?? 70

  const chartData = [...weights].reverse().slice(-30).map(w => ({
    date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    kg: unit === 'lbs' ? Math.round(kgToDisplay(w.weight, 'lbs') * 10) / 10 : w.weight,
  }))

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Weight <span className="gradient-text">Tracker</span></h1>
          <p className="text-sm text-text-secondary mt-1">Track your weight progress over time</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-purple py-2.5 px-5">
          ⚖️ Log Weight
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="card-purple p-6">
          <span className="text-2xl mb-3 block">⚖️</span>
          <p className="text-xs font-semibold text-text-secondary mb-1">Current Weight</p>
          <p className="text-3xl font-black text-text-primary">
            {current ? kgToDisplay(current.weight, unit).toFixed(1) : '—'}
            <span className="text-base font-normal text-text-muted ml-1">{unit}</span>
          </p>
        </div>

        <div className="card-green p-6">
          <span className="text-2xl mb-3 block">🎯</span>
          <p className="text-xs font-semibold text-text-secondary mb-1">Goal Weight</p>
          <p className="text-3xl font-black text-text-primary">
            {kgToDisplay(target, unit).toFixed(1)}
            <span className="text-base font-normal text-text-muted ml-1">{unit}</span>
          </p>
        </div>

        <div className="card-yellow p-6">
          <span className="text-2xl mb-3 block">{change >= 0 ? '📈' : '📉'}</span>
          <p className="text-xs font-semibold text-text-secondary mb-1">Total Change</p>
          <p className="text-3xl font-black text-text-primary">
            {change >= 0 ? '+' : ''}{kgToDisplay(change, unit).toFixed(1)}
            <span className="text-base font-normal text-text-muted ml-1">{unit}</span>
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-text-primary">Weight Trend</h2>
            <span className="badge badge-brand">{unit}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--text-secondary))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--text-secondary))' }} tickLine={false} axisLine={false} unit={unit === 'lbs' ? ' lb' : ' kg'} />
              <Tooltip
                contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v) => [`${v} ${unit}`, 'Weight']}
              />
              <Area type="monotone" dataKey="kg" stroke="#8b5cf6" strokeWidth={3} fill="url(#wGrad)"
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#ec4899' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-text-primary mb-4">Weight History</h2>
        {weights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-5xl animate-float">⚖️</span>
            <p className="text-sm text-text-secondary">No weight entries yet</p>
            <button onClick={() => setShowAdd(true)} className="btn-purple py-2.5 px-6">
              Log your first weight
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {weights.map((w, i) => (
              <div key={w.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface2 transition-colors animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 30}ms` }}>
                <div>
                  <p className="text-sm font-bold text-text-primary">{formatFullDate(w.date)}</p>
                  {w.note && <p className="text-xs text-text-secondary mt-0.5 italic">"{w.note}"</p>}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-black text-text-primary">
                    {kgToDisplay(w.weight, unit).toFixed(1)} <span className="text-sm font-normal text-text-muted">{unit}</span>
                  </p>
                  <button onClick={async () => { await removeWeight(uid, w.id); load(); }}
                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-danger hover:text-danger transition-all">
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

      {/* Add Weight Modal */}
      {showAdd && <AddWeightModal uid={uid} unit={unit} onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  )
}

// ── Add Weight Modal ──────────────────────────────────────────────────────────
function AddWeightModal({
  uid, unit, onClose, onAdded,
}: {
  uid: string; unit: 'kg' | 'lbs'; onClose: () => void; onAdded: () => void;
}) {
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!weight) { setError('Enter your weight.'); return }
    setSaving(true)
    setError('')
    try {
      const kg = displayToKg(Number(weight), unit)
      await addWeight(uid, kg, date, note)
      onAdded()
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-text-primary">Log Weight</h2>
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-secondary transition-colors">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Date</label>
              <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Weight ({unit})</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                className="input" step="0.1" min={20} max={300} placeholder={unit === 'lbs' ? '150' : '70'} required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Note (optional)</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                className="input" placeholder="Felt great today" maxLength={200} />
            </div>

            {error && <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-purple flex-1">
                {saving && <LoadingSpinner size="sm" />}
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
