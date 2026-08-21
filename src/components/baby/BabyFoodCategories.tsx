import { useState } from 'react'
import type { BabyFood, BabyFoodCategory } from '../../types/baby'
import { BABY_FOODS } from '../../data/babyData'

interface Props {
  ageMonths: number
  tamilPref: boolean
}

type TabId = BabyFoodCategory | 'all'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'all',               label: 'All',       emoji: '🍽️' },
  { id: 'tamil_traditional', label: 'Tamil',     emoji: '🍚' },
  { id: 'grains_cereals',    label: 'Grains',    emoji: '🌾' },
  { id: 'fruits',            label: 'Fruits',    emoji: '🍎' },
  { id: 'vegetables',        label: 'Veggies',   emoji: '🥕' },
  { id: 'protein',           label: 'Protein',   emoji: '💪' },
  { id: 'dairy',             label: 'Dairy',     emoji: '🥛' },
  { id: 'global',            label: 'Global',    emoji: '🌍' },
]

const SAFETY_STYLE: Record<string, { bg: string; color: string }> = {
  safe:           { bg: 'rgb(16 185 129 / 0.12)',  color: 'rgb(110 231 183)' },
  age_restricted: { bg: 'rgb(234 179 8 / 0.12)',   color: 'rgb(253 224 71)'  },
  caution:        { bg: 'rgb(249 115 22 / 0.12)',  color: 'rgb(253 186 116)' },
  avoid_under_1:  { bg: 'rgb(239 68 68 / 0.12)',   color: 'rgb(252 165 165)' },
}

export default function BabyFoodCategories({ ageMonths, tamilPref }: Props) {
  const [activeTab,    setActiveTab]    = useState<TabId>(tamilPref ? 'tamil_traditional' : 'all')
  const [selectedFood, setSelectedFood] = useState<BabyFood | null>(null)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [showAll,      setShowAll]      = useState(false)

  const filtered = BABY_FOODS.filter(f => {
    const matchesTab    = activeTab === 'all' || f.category === activeTab
    const matchesSearch = !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tamilName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const ageFiltered = filtered.filter(f => f.minAgeMonths <= ageMonths)
  const tooYoung    = filtered.filter(f => f.minAgeMonths > ageMonths)
  const displayList = showAll ? filtered : ageFiltered

  return (
    <div className="flex flex-col gap-3">

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">🔍</span>
        <input type="search" placeholder="Search foods…" value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} className="g-input pl-8" />
      </div>

      {/* Category tabs */}
      <div className="g-tab-bar overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
            className={`g-tab ${activeTab === tab.id ? 'g-tab-active-teal' : ''}`}>
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Age filter toggle */}
      {tooYoung.length > 0 && !searchQuery && (
        <button onClick={() => setShowAll(v => !v)}
          className="g-btn g-btn-sm w-full justify-between px-3">
          <span>{showAll ? 'Showing all foods' : `${ageFiltered.length} foods for current age`}</span>
          <span className="text-[10px] opacity-60">{showAll ? 'Show age-appropriate only' : `+${tooYoung.length} more later`}</span>
        </button>
      )}

      {/* Food grid */}
      {displayList.length === 0 ? (
        <div className="g-card p-10 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-text-muted text-sm">No foods found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {displayList.map(food => {
            const notYet = food.minAgeMonths > ageMonths
            return (
              <button key={food.id} onClick={() => setSelectedFood(food)}
                className="g-card p-3 text-left flex flex-col gap-2 relative transition-all"
                style={{ opacity: notYet ? 0.5 : 1 }}>
                {notYet && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgb(234 179 8 / 0.15)', color: 'rgb(253 224 71)' }}>
                    {food.minAgeMonths}m+
                  </span>
                )}
                {food.commonAllergen && (
                  <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgb(239 68 68 / 0.15)', color: 'rgb(252 165 165)' }}>
                    allergen
                  </span>
                )}
                <span className="text-2xl mt-1">{food.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-text-primary leading-tight">{food.name}</p>
                  {food.tamilName && <p className="text-[10px] text-text-muted mt-0.5">{food.tamilName}</p>}
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {food.nutrients.slice(0, 2).map(n => (
                    <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgb(32 195 190 / 0.12)', color: 'rgb(94 234 212)' }}>
                      {n}
                    </span>
                  ))}
                </div>
                {food.chokingRisk && (
                  <span className="text-[9px] font-bold" style={{ color: 'rgb(253 186 116)' }}>⚠️ Choking risk</span>
                )}
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

            {/* Modal header */}
            <div className="px-5 pt-5 pb-4" style={{
              background: 'linear-gradient(135deg, rgb(32 195 190 / 0.18), rgb(56 189 248 / 0.12))',
              borderBottom: '1px solid rgb(255 255 255 / 0.07)',
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedFood.emoji}</span>
                  <div>
                    <h3 className="font-black text-base text-text-primary">{selectedFood.name}</h3>
                    {selectedFood.tamilName && <p className="text-xs text-text-muted">{selectedFood.tamilName}</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedFood(null)}
                  className="g-btn-icon g-btn text-xs">✕</button>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                <span className="g-badge" style={{ background: 'rgb(32 195 190 / 0.15)', borderColor: 'rgb(32 195 190 / 0.25)', color: 'rgb(94 234 212)' }}>
                  From {selectedFood.minAgeMonths}m
                </span>
                {selectedFood.commonAllergen && (
                  <span className="g-badge" style={{ background: 'rgb(239 68 68 / 0.12)', borderColor: 'rgb(239 68 68 / 0.22)', color: 'rgb(252 165 165)' }}>
                    ⚠️ Allergen: {selectedFood.allergenName}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '55vh' }}>
              {/* Safety badge */}
              {selectedFood.safety && (() => {
                const s = SAFETY_STYLE[selectedFood.safety] ?? SAFETY_STYLE.safe
                return (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold w-fit"
                    style={{ background: s.bg, color: s.color }}>
                    {selectedFood.safety.replace(/_/g, ' ')}
                  </span>
                )
              })()}

              {selectedFood.safetyNote && (
                <div className="g-disclaimer">⚠️ {selectedFood.safetyNote}</div>
              )}
              {selectedFood.chokingRisk && (
                <div className="g-disclaimer" style={{ background: 'rgb(239 68 68 / 0.08)', borderColor: 'rgb(239 68 68 / 0.2)', color: 'rgb(252 165 165)' }}>
                  🚨 <strong>Choking risk:</strong> {selectedFood.chokingNote}
                </div>
              )}

              {/* Nutrients */}
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Key Nutrients</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFood.nutrients.map(n => (
                    <span key={n} className="g-badge" style={{ background: 'rgb(32 195 190 / 0.12)', borderColor: 'rgb(32 195 190 / 0.22)', color: 'rgb(94 234 212)' }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prep tips */}
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Preparation Tips</p>
                <ul className="flex flex-col gap-1">
                  {selectedFood.preparationTips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-xs text-text-secondary">
                      <span className="text-teal-400 flex-shrink-0">•</span>{t}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] text-text-muted">ℹ️ General information only. Consult your paediatrician.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
