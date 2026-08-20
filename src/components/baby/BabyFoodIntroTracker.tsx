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

export default function BabyFoodIntroTracker({ uid, records, onRecordsChange }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [showReactionWarning, setShowReactionWarning] = useState(false)

  // Merge saved records with defaults (so all 9 allergens always appear)
  const allItems: FoodIntroRecord[] = DEFAULT_ALLERGEN_FOODS.map(def => {
    const saved = records.find(r => r.foodId === def.foodId)
    return saved ?? {
      foodId:   def.foodId,
      foodName: def.foodName,
      emoji:    def.emoji,
      category: def.category,
      status:   'not_introduced',
    }
  })

  async function cycleStatus(item: FoodIntroRecord) {
    const currentIdx = STATUS_ORDER.indexOf(item.status)
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length]

    if (nextStatus === 'reaction_reported') {
      setShowReactionWarning(true)
    }

    const updated: FoodIntroRecord = {
      ...item,
      status: nextStatus,
      dateIntroduced: nextStatus === 'introduced' || nextStatus === 'tolerated'
        ? (item.dateIntroduced ?? new Date().toISOString().split('T')[0])
        : item.dateIntroduced,
    }

    setSaving(item.foodId)
    try {
      await saveFoodIntroRecord(uid, updated)
      onRecordsChange(
        allItems.map(r => r.foodId === updated.foodId ? updated : r)
      )
    } finally {
      setSaving(null)
    }
  }

  async function saveNote(item: FoodIntroRecord) {
    const updated: FoodIntroRecord = { ...item, notes: noteText }
    setSaving(item.foodId)
    try {
      await saveFoodIntroRecord(uid, updated)
      onRecordsChange(allItems.map(r => r.foodId === updated.foodId ? updated : r))
      setEditingId(null)
    } finally {
      setSaving(null)
    }
  }

  const introduced  = allItems.filter(r => r.status !== 'not_introduced').length
  const tolerated   = allItems.filter(r => r.status === 'tolerated').length
  const reactions   = allItems.filter(r => r.status === 'reaction_reported').length

  return (
    <div className="flex flex-col gap-4">

      {/* Warning modal for reaction */}
      {showReactionWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl card-shadow w-full max-w-sm p-6 animate-scale-in">
            <div className="text-4xl mb-3">🚨</div>
            <h3 className="font-black text-text-primary text-lg mb-2">Reaction reported</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              If your baby is experiencing a <strong>severe allergic reaction</strong> (hives, swelling, breathing difficulty, vomiting) —
              <strong className="text-red-600"> seek emergency medical care immediately.</strong>
            </p>
            <p className="text-sm text-text-secondary mb-4">
              FitTracker cannot diagnose allergies. Always consult your paediatrician after any suspected reaction.
            </p>
            <button
              onClick={() => setShowReactionWarning(false)}
              className="w-full py-3 rounded-2xl gradient-brand text-white font-bold text-sm"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Introduced',   value: introduced,  bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
          { label: 'Tolerated',    value: tolerated,   bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
          { label: 'Reactions',    value: reactions,   bg: 'bg-red-50 dark:bg-red-900/20',     text: 'text-red-700 dark:text-red-300'   },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-3 text-center ${s.bg}`}>
            <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
            <p className={`text-xs font-semibold ${s.text}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          ⚠️ <strong>Important:</strong> This tracker is for your reference only. FitTracker cannot diagnose allergies.
          Introduce common allergens one at a time and consult your paediatrician for guidance,
          especially if your baby has eczema or a family history of allergies.
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Allergen introduction progress</span>
          <span>{introduced}/{allItems.length} introduced</span>
        </div>
        <div className="h-2 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(introduced / allItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* How to use */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>How to use:</strong> Tap a food card to cycle through statuses:
          Not introduced → Introduced → Tolerated → Reaction noted.
          Add notes by tapping the ✏️ icon.
        </p>
      </div>

      {/* Food cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allItems.map(item => {
          const cfg = STATUS_CONFIG[item.status]
          const isSaving = saving === item.foodId
          const isEditing = editingId === item.foodId
          return (
            <div
              key={item.foodId}
              className={`rounded-2xl border-2 p-4 transition-all ${cfg.bg}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-bold text-text-primary text-sm">{item.foodName}</p>
                    {item.dateIntroduced && (
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Introduced {new Date(item.dateIntroduced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Edit note */}
                  <button
                    onClick={() => { setEditingId(isEditing ? null : item.foodId); setNoteText(item.notes ?? '') }}
                    className="h-7 w-7 rounded-lg bg-surface/60 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-xs"
                    title="Add note"
                  >✏️</button>
                  {/* Cycle status */}
                  <button
                    onClick={() => cycleStatus(item)}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface/80 border border-border text-xs font-semibold text-text-primary hover:bg-surface2 transition-all disabled:opacity-50"
                  >
                    {isSaving ? '…' : cfg.emoji}
                    <span className="hidden sm:inline">{cfg.label}</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              {isEditing && (
                <div className="mt-3 flex gap-2 animate-fade-in">
                  <input
                    type="text"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note (e.g. no reaction, slight rash)…"
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-teal-400"
                  />
                  <button
                    onClick={() => saveNote(item)}
                    className="px-3 py-1.5 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
              {!isEditing && item.notes && (
                <p className="text-xs text-text-secondary mt-2 pl-1 italic">📝 {item.notes}</p>
              )}

              {/* Reaction warning inline */}
              {item.status === 'reaction_reported' && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
                  <p className="text-[10px] text-red-700 dark:text-red-300 font-semibold">
                    ⚠️ Consult your paediatrician. Seek emergency care for severe reactions.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom disclaimer */}
      <p className="text-[11px] text-text-muted text-center px-4">
        ℹ️ This tracker is a personal log only. FitTracker does not diagnose allergies or medical conditions.
      </p>
    </div>
  )
}
