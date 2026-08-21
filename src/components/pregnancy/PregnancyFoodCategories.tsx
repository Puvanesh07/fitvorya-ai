import { useState } from 'react'
import type { PregnancyFood, FoodCategory } from '../../types/pregnancy'
import { PREGNANCY_FOODS, getSafetyLabel } from '../../data/pregnancyData'

interface Props { tamilPref: boolean }

type TabId = FoodCategory | 'all'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'all',          label: 'All',       emoji: '🍽️' },
  { id: 'millets',      label: 'Millets',   emoji: '🌾' },
  { id: 'rice',         label: 'Rice',      emoji: '🍚' },
  { id: 'vegetables',   label: 'Veggies',   emoji: '🥬' },
  { id: 'fruits',       label: 'Fruits',    emoji: '🍎' },
  { id: 'protein',      label: 'Protein',   emoji: '💪' },
  { id: 'global',       label: 'Global',    emoji: '🌍' },
  { id: 'dairy',        label: 'Dairy',     emoji: '🥛' },
  { id: 'healthy_fats', label: 'Fats',      emoji: '🥑' },
  { id: 'grains',       label: 'Grains',    emoji: '🍞' },
]

const SAFETY_STYLE: Record<string, { bg: string; color: string }> = {
  safe:    { bg: 'rgb(16 185 129 / 0.12)',  color: 'rgb(110 231 183)' },
  caution: { bg: 'rgb(234 179 8 / 0.12)',   color: 'rgb(253 224 71)'  },
  avoid:   { bg: 'rgb(239 68 68 / 0.12)',   color: 'rgb(252 165 165)' },
}

export default function PregnancyFoodCategories({ tamilPref }: Props) {
  const [activeTab,    setActiveTab]    = useState<TabId>(tamilPref ? 'millets' : 'all')
  const [selectedFood, setSelectedFood] = useState<PregnancyFood | null>(null)
  const [searchQuery,  setSearchQuery]  = useState('')

  const filtered = PREGNANCY_FOODS.filter(f => {
    const matchesTab    = activeTab === 'all' || f.category === activeTab
    const matchesSearch = !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tamilName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="flex flex-col gap-3">

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">🔍</span>
        <input type="search" placeholder="Search foods (e.g. ragi, banana, iron)…"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="g-input pl-8" />
      </div>

      {/* Category tabs */}
      <div className="g-tab-bar overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
            className={`g-tab ${activeTab === tab.id ? 'g-tab-active' : ''}`}>
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-[10px] text-text-muted px-0.5">
        {filtered.length} food{filtered.length !== 1 ? 's' : ''} {activeTab !== 'all' ? 'in this category' : 'total'}
      </p>

      {/* Food grid */}
      {filtered.length === 0 ? (
        <div className="g-card p-10 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-text-muted text-sm">No foods found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filtered.map(food => {
            const ss = SAFETY_STYLE[food.safety] ?? SAFETY_STYLE.caution
            return (
              <button key={food.id} onClick={() => setSelectedFood(food)}
                className="g-card p-3 text-left flex flex-col gap-2">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-2xl">{food.emoji}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: ss.bg, color: ss.color }}>
                    {food.safety === 'safe' ? '✓ safe' : food.safety === 'avoid' ? '✗ avoid' : '⚠ caution'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary leading-tight">{food.name}</p>
                  {food.tamilName && <p className="text-[10px] text-text-muted mt-0.5">{food.tamilName}</p>}
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {food.nutrients.slice(0, 2).map(n => (
                    <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgb(139 92 246 / 0.12)', color: 'rgb(196 181 253)' }}>
                      {n}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 g-modal-overlay animate-pop-in"
          onClick={() => setSelectedFood(null)}>
          <div className="g-modal-panel w-full max-w-md animate-pop-in overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-5 pt-5 pb-4" style={{
              background: 'linear-gradient(135deg, rgb(139 92 246 / 0.18), rgb(244 114 182 / 0.12))',
              borderBottom: '1px solid rgb(255 255 255 / 0.07)',
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedFood.emoji}</span>
                  <div>
                    <h3 className="font-black text-base text-text-primary">{selectedFood.name}</h3>
                    {selectedFood.tamilName && (
                      <p className="text-xs text-text-muted">{selectedFood.tamilName}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedFood(null)} className="g-btn g-btn-icon text-xs">✕</button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '55vh' }}>

              {/* Safety badge */}
              {(() => {
                const ss = SAFETY_STYLE[selectedFood.safety] ?? SAFETY_STYLE.caution
                return (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold w-fit"
                    style={{ background: ss.bg, color: ss.color }}>
                    {getSafetyLabel(selectedFood.safety)}
                  </span>
                )
              })()}

              {selectedFood.safetyNote && (
                <div className="g-disclaimer">⚠️ {selectedFood.safetyNote}</div>
              )}

              {/* Nutrients */}
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Key Nutrients</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFood.nutrients.map(n => (
                    <span key={n} className="g-badge"
                      style={{ background: 'rgb(139 92 246 / 0.12)', borderColor: 'rgb(139 92 246 / 0.25)', color: 'rgb(196 181 253)' }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Benefits</p>
                <ul className="flex flex-col gap-1">
                  {selectedFood.benefits.map(b => (
                    <li key={b} className="flex gap-2 text-xs text-text-secondary">
                      <span className="text-emerald-400 flex-shrink-0">✓</span>{b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Serving */}
              {selectedFood.servingSuggestion && (
                <div className="g-card-sm p-2.5">
                  <p className="text-[10px] font-bold text-text-muted mb-0.5">🍽️ How to use</p>
                  <p className="text-xs text-text-secondary">{selectedFood.servingSuggestion}</p>
                </div>
              )}

              <p className="text-[10px] text-text-muted leading-relaxed">
                ℹ️ General nutrition information only. Not medical advice. Consult your healthcare provider.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
