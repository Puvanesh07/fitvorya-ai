import { useState } from 'react'
import type { FoodIntroRecord, IntroStatus } from '../../types/baby'
import { DEFAULT_ALLERGEN_FOODS } from '../../data/babyData'
import { STATUS_CONFIG, saveFoodIntroRecord } from '../../services/babyService'

interface Props {
  uid: string
  records: FoodIntroRecord[]
  onRecordsChange: (updated: FoodIntroRecord[]) => void
}

const STATUS_ORDER: IntroStatus[] = ['not_introduced', 'introduced', 'tolerated', 'reaction_reported']

const STATUS_STYLE: Record<IntroStatus, { bg: string; border: string; text: string }> = {
  not_introduced:    { bg: 'rgb(255 255 255 / 0.03)', border: 'rgb(255 255 255 / 0.07)', text: 'rgb(var(--text-muted))' },
  introduced:        { bg: 'rgb(234 179 8 / 0.08)',   border: 'rgb(234 179 8 / 0.2)',    text: 'rgb(253 224 71)'       },
  tolerated:         { bg: 'rgb(16 185 129 / 0.08)',  border: 'rgb(16 185 129 / 0.22)',  text: 'rgb(110 231 183)'      },
  reaction_reported: { bg: 'rgb(239 68 68 / 0.08)',   border: 'rgb(239 68 68 / 0.22)',   text: 'rgb(252 165 165)'      },
}

export default function BabyFoodIntroTracker({ uid, records, onRecordsChange }: Props) {
  const [saving,              setSaving]              = useState<string | null>(null)
  const [editingId,           setEditingId]           = useState<string | null>(null)
  const [noteText,            setNoteText]            = useState('')
  const [showReactionWarning, setShowReactionWarning] = useState(false)

  const allItems: FoodIntroRecord[] = DEFAULT_ALLERGEN_FOODS.map(def => {
    const saved = records.find(r => r.foodId === def.foodId)
    return saved ?? { foodId: def.foodId, foodName: def.foodName, emoji: def.emoji, category: def.category, status: 'not_introduced' }
  })

  async function cycleStatus(item: FoodIntroRecord) {
    const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(item.status) + 1) % STATUS_ORDER.length]
    if (nextStatus === 'reaction_reported') setShowReactionWarning(true)
    const updated: FoodIntroRecord = {
      ...item, status: nextStatus,
      dateIntroduced: nextStatus === 'introduced' || nextStatus === 'tolerated'
        ? (item.dateIntroduced ?? new Date().toISOString().split('T')[0])
        : item.dateIntroduced,
    }
    setSaving(item.foodId)
    try {
      await saveFoodIntroRecord(uid, updated)
      onRecordsChange(allItems.map(r => r.foodId === updated.foodId ? updated : r))
    } finally { setSaving(null) }
  }

  async function saveNote(item: FoodIntroRecord) {
    const updated: FoodIntroRecord = { ...item, notes: noteText }
    setSaving(item.foodId)
    try {
      await saveFoodIntroRecord(uid, updated)
      onRecordsChange(allItems.map(r => r.foodId === updated.foodId ? updated : r))
      setEditingId(null)
    } finally { setSaving(null) }
  }

  const introduced = allItems.filter(r => r.status !== 'not_introduced').length
  const tolerated  = allItems.filter(r => r.status === 'tolerated').length
  const reactions  = allItems.filter(r => r.status === 'reaction_reported').length

  return (
    <div className="flex flex-col gap-3">

      {/* Reaction warning modal */}
      {showReactionWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 g-modal-overlay animate-pop-in">
          <div className="g-modal-panel w-full max-w-sm p-5 animate-pop-in">
            <div className="text-3xl mb-2">🚨</div>
            <h3 className="font-black text-text-primary text-base mb-2">Reaction reported</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              If your baby is experiencing a <strong>severe allergic reaction</strong> (hives, swelling, breathing difficulty) —
              <strong className="text-red-400"> seek emergency medical care immediately.</strong>
            </p>
            <p className="text-xs text-text-muted mb-4">
              FitTracker cannot diagnose allergies. Always consult your paediatrician after any suspected reaction.
            </p>
            <button onClick={() => setShowReactionWarning(false)} className="g-btn g-btn-primary w-full py-2.5">
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Introduced', value: introduced, bg: 'rgb(234 179 8 / 0.1)',  border: 'rgb(234 179 8 / 0.2)',   color: 'rgb(253 224 71)'  },
          { label: 'Tolerated',  value: tolerated,  bg: 'rgb(16 185 129 / 0.1)', border: 'rgb(16 185 129 / 0.2)',  color: 'rgb(110 231 183)' },
          { label: 'Reactions',  value: reactions,  bg: 'rgb(239 68 68 / 0.1)',  border: 'rgb(239 68 68 / 0.2)',   color: 'rgb(252 165 165)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-text-muted mb-1">
          <span>Allergen introduction progress</span>
          <span>{introduced}/{allItems.length} introduced</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(255 255 255 / 0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(introduced / allItems.length) * 100}%`, background: 'linear-gradient(90deg, rgb(32 195 190), rgb(56 189 248))' }} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ <strong>Important:</strong> Introduce allergens one at a time. Consult your paediatrician, especially if your baby has eczema or family history of allergies. This tracker is for personal reference only.
      </div>

      {/* How to use */}
      <div className="g-card-sm p-2.5"
        style={{ background: 'rgb(56 189 248 / 0.07)', borderColor: 'rgb(56 189 248 / 0.18)' }}>
        <p className="text-xs text-sky-300">
          💡 <strong>Tap a card</strong> to cycle: Not introduced → Introduced → Tolerated → Reaction. Use ✏️ to add notes.
        </p>
      </div>

      {/* Food cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {allItems.map(item => {
          const cfg       = STATUS_CONFIG[item.status]
          const ss        = STATUS_STYLE[item.status]
          const isSaving  = saving === item.foodId
          const isEditing = editingId === item.foodId
          return (
            <div key={item.foodId} className="rounded-xl p-3 transition-all"
              style={{ background: ss.bg, border: `1px solid ${ss.border}` }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-text-primary truncate">{item.foodName}</p>
                    {item.dateIntroduced && (
                      <p className="text-[10px] text-text-muted">
                        {new Date(item.dateIntroduced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingId(isEditing ? null : item.foodId); setNoteText(item.notes ?? '') }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-xs"
                    style={{ background: 'rgb(255 255 255 / 0.05)' }}>
                    ✏️
                  </button>
                  <button onClick={() => cycleStatus(item)} disabled={isSaving}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                    style={{ background: 'rgb(255 255 255 / 0.06)', border: '1px solid rgb(255 255 255 / 0.1)', color: ss.text }}>
                    {isSaving ? '…' : `${cfg.emoji} ${cfg.label}`}
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-2 flex gap-1.5 animate-slide-up">
                  <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Add note (e.g. no reaction, slight rash)…"
                    className="g-input flex-1 text-[11px] py-1.5" />
                  <button onClick={() => saveNote(item)}
                    className="g-btn g-btn-teal g-btn-sm px-2.5">Save</button>
                </div>
              )}
              {!isEditing && item.notes && (
                <p className="text-[10px] text-text-secondary mt-1.5 italic">📝 {item.notes}</p>
              )}
              {item.status === 'reaction_reported' && (
                <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgb(239 68 68 / 0.1)', border: '1px solid rgb(239 68 68 / 0.15)' }}>
                  <p className="text-[10px] text-red-400 font-semibold">⚠️ Consult your paediatrician. Seek emergency care for severe reactions.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-text-muted text-center">
        ℹ️ This tracker is a personal log only. FitTracker does not diagnose allergies or medical conditions.
      </p>
    </div>
  )
}
