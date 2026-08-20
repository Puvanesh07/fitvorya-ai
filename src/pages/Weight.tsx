import { useEffect, useState, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import PageWrapper from '../components/PageWrapper'
import LoadingSpinner from '../components/LoadingSpinner'
import { fetchWeightHistory, addWeight, editWeight, removeWeight } from '../services/weightService'
import type { WeightEntry } from '../types/weight'
import { todayISO, formatFullDate, formatDate } from '../utils/format'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'

// ── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="card p-6 shadow-2xl glow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-primary">{title}</h2>
            <button onClick={onClose} className="h-7 w-7 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors" aria-label="Close">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Weight form ───────────────────────────────────────────────────────────────

interface WeightFormProps {
  initialWeight?: string
  initialDate?: string
  initialNote?: string
  saving: boolean
  onSubmit: (weight: string, date: string, note: string) => void
  onCancel: () => void
  submitLabel: string
}

function WeightForm({ initialWeight = '', initialDate, initialNote = '', saving, onSubmit, onCancel, submitLabel }: WeightFormProps) {
  const [weight, setWeight] = useState(initialWeight)
  const [date, setDate] = useState(initialDate ?? todayISO())
  const [note, setNote] = useState(initialNote)
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!weight || Number(weight) < 20 || Number(weight) > 400) { setError('Enter a valid weight (20–400 kg).'); return }
    if (!date) { setError('Select a date.'); return }
    setError('')
    onSubmit(weight, date, note)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Weight</label>
        <div className="relative">
          <input type="number" step="0.1" min={20} max={400} value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="input pr-10" placeholder="77.5" required autoFocus />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium">kg</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Date</label>
        <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="input" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Note <span className="text-text-secondary font-normal text-xs">(optional)</span>
        </label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          className="input" placeholder="e.g. After morning workout" maxLength={120} />
      </div>
      {error && <p role="alert" className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3 mt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">{submitLabel === 'Save' ? 'Cancel' : '← Cancel'}</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving && <LoadingSpinner size="sm" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Weight() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<WeightEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WeightEntry | null>(null)

  const uid = profile?.uid ?? ''

  async function load() {
    if (!uid) return
    setLoading(true)
    const data = await fetchWeightHistory(uid)
    setEntries([...data].sort((a, b) => b.date.localeCompare(a.date)))
    setLoading(false)
  }

  useEffect(() => { load() }, [uid])

  async function handleAdd(w: string, d: string, n: string) {
    setSaving(true); await addWeight(uid, Number(w), d, n); await load(); setShowAdd(false); setSaving(false)
  }
  async function handleEdit(w: string, d: string, n: string) {
    if (!editTarget) return
    setSaving(true); await editWeight(uid, editTarget.id, Number(w), d, n); await load(); setEditTarget(null); setSaving(false)
  }
  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true); await removeWeight(uid, deleteTarget.id); await load(); setDeleteTarget(null); setSaving(false)
  }

  const sortedAsc = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const chartData = sortedAsc.slice(-20).map((e) => ({ date: formatDate(e.date), weight: e.weight }))
  const latestWeight = entries[0]?.weight ?? profile?.weight ?? 0
  const oldestWeight = sortedAsc[0]?.weight ?? latestWeight
  const totalChange = parseFloat((latestWeight - oldestWeight).toFixed(1))
  const minW = chartData.length > 0 ? Math.floor(Math.min(...chartData.map(d => d.weight)) - 2) : 0
  const maxW = chartData.length > 0 ? Math.ceil(Math.max(...chartData.map(d => d.weight)) + 2) : 100

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Weight <span className="gradient-text">Tracker</span></h1>
          <p className="text-text-secondary text-sm mt-1">Log your weight, watch your progress.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary py-2.5 px-5">
          <span aria-hidden="true" className="text-base">+</span>
          <span className="hidden sm:inline">Add Weight</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Current', value: `${latestWeight} kg`, color: 'gradient-text', icon: '⚖️' },
          { label: 'Target', value: `${profile?.targetWeight ?? '—'} kg`, color: 'text-text-primary', icon: '🎯' },
          { label: 'Change', value: `${totalChange > 0 ? '+' : ''}${totalChange} kg`,
            color: totalChange < 0 ? 'text-success' : totalChange > 0 ? 'text-danger' : 'text-text-primary', icon: totalChange < 0 ? '📉' : totalChange > 0 ? '📈' : '➡️' },
        ].map((s, i) => (
          <div key={s.label} className="card card-hover p-4 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: `${i * 75}ms` }}>
            <span className="text-xl mb-2 block">{s.icon}</span>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {!loading && chartData.length >= 2 && (
        <div className="card p-5 sm:p-6 mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
          <h2 className="font-bold text-text-primary mb-4">Progress Chart</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(129,140,248)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(129,140,248)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }} tickLine={false} axisLine={false} />
              <YAxis domain={[minW, maxW]} tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }} tickLine={false} axisLine={false} unit="kg" />
              <Tooltip
                contentStyle={{ background: 'rgb(14,14,28)', border: '1px solid rgb(30,30,58)', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: 'rgb(241,245,249)', fontWeight: 600 }}
                formatter={(v) => [`${v} kg`, 'Weight']}
              />
              {profile?.targetWeight && (
                <ReferenceLine y={profile.targetWeight} stroke="rgb(192,132,252)" strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: `Target`, position: 'insideTopRight', fontSize: 10, fill: 'rgb(192,132,252)' }} />
              )}
              <Area type="monotone" dataKey="weight" stroke="rgb(129,140,248)" strokeWidth={2.5}
                fill="url(#wGrad)" dot={{ r: 4, fill: 'rgb(129,140,248)', strokeWidth: 0 }} activeDot={{ r: 6, fill: 'rgb(192,132,252)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="card overflow-hidden animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '350ms' }}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-text-primary">History</h2>
          <span className="badge badge-brand">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
        ) : entries.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <span className="text-4xl animate-float">📋</span>
            <p className="text-sm text-text-secondary">No entries yet.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary py-2 px-5 text-sm">Add first entry</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface2 transition-colors group animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {entry.weight}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{entry.weight} kg</p>
                    <p className="text-xs text-text-secondary">{formatFullDate(entry.date)}</p>
                    {entry.note && <p className="text-xs text-text-secondary italic mt-0.5">"{entry.note}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditTarget(entry)}
                    aria-label="Edit"
                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-brand hover:text-brand transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(entry)}
                    aria-label="Delete"
                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-danger hover:text-danger transition-all"
                  >
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

      {/* Modals */}
      {showAdd && (
        <Modal title="➕ Add Weight Entry" onClose={() => setShowAdd(false)}>
          <WeightForm saving={saving} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} submitLabel="Save" />
        </Modal>
      )}
      {editTarget && (
        <Modal title="✏️ Edit Weight Entry" onClose={() => setEditTarget(null)}>
          <WeightForm initialWeight={String(editTarget.weight)} initialDate={editTarget.date} initialNote={editTarget.note ?? ''}
            saving={saving} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} submitLabel="Update" />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="🗑️ Delete Entry" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-text-secondary mb-6">
            Delete <strong className="text-text-primary">{deleteTarget.weight} kg</strong> on{' '}
            <strong className="text-text-primary">{formatFullDate(deleteTarget.date)}</strong>? This can't be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger flex-1">
              {saving && <LoadingSpinner size="sm" />} Delete
            </button>
          </div>
        </Modal>
      )}
    </PageWrapper>
  )
}
