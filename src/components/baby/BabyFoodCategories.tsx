// ── Baby Food Categories + Integrated Food Search ────────────────────────────
// The "Foods" tab for the Baby section.
// Top section: real food search with baby/age-appropriate safety context.
// Bottom section: curated baby food library filtered by age.

import { useState } from 'react'
import type { BabyFood, BabyFoodCategory, AgeStageId } from '../../types/baby'
import { BABY_FOODS } from '../../data/babyData'
import FoodSearchPanel from '../food/FoodSearchPanel'

interface Props {
  ageMonths:        number
  tamilPref:        boolean
  selectedStageId?: AgeStageId
}

type LibTab = BabyFoodCategory | 'all'

const LIB_TABS: { id: LibTab; label: string; emoji: string }[] = [
  { id: 'all',               label: 'All',    emoji: '🍽️' },
  { id: 'tamil_traditional', label: 'Tamil',  emoji: '🍚' },
  { id: 'grains_cereals',    label: 'Grains', emoji: '🌾' },
  { id: 'fruits',            label: 'Fruits', emoji: '🍎' },
  { id: 'vegetables',        label: 'Veggies',emoji: '🥕' },
  { id: 'protein',           label: 'Protein',emoji: '💪' },
  { id: 'dairy',             label: 'Dairy',  emoji: '🥛' },
  { id: 'global',            label: 'Global', emoji: '🌍' },
]

const SAFETY_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  safe:           { bg: 'rgb(16 185 129 / 0.12)',  border: 'rgb(16 185 129 / 0.25)',  color: 'rgb(110 231 183)' },
  age_restricted: { bg: 'rgb(234 179 8 / 0.12)',   border: 'rgb(234 179 8 / 0.25)',   color: 'rgb(253 224 71)'  },
  caution:        { bg: 'rgb(249 115 22 / 0.12)',  border: 'rgb(249 115 22 / 0.25)',  color: 'rgb(253 186 116)' },
  avoid_under_1:  { bg: 'rgb(239 68 68 / 0.12)',   border: 'rgb(239 68 68 / 0.25)',   color: 'rgb(252 165 165)' },
}

export default function BabyFoodCategories({ ageMonths, tamilPref, selectedStageId }: Props) {
  const [libTab,       setLibTab]       = useState<LibTab>(tamilPref ? 'tamil_traditional' : 'all')
  const [libSearch,    setLibSearch]    = useState('')
  const [selectedFood, setSelectedFood] = useState<BabyFood | null>(null)
  const [showAll,      setShowAll]      = useState(false)
  const [view,         setView]         = useState<'search' | 'library'>('search')

  const allFiltered = BABY_FOODS.filter(f => {
    const matchTab    = libTab === 'all' || f.category === libTab
    const matchSearch = !libSearch ||
      f.name.toLowerCase().includes(libSearch.toLowerCase()) ||
      (f.tamilName ?? '').toLowerCase().includes(libSearch.toLowerCase())
    return matchTab && matchSearch
  })

  const ageAppropriate = allFiltered.filter(f => f.minAgeMonths <= ageMonths)
  const tooYoung       = allFiltered.filter(f => f.minAgeMonths > ageMonths)
  const displayList    = showAll ? allFiltered : ageAppropriate

  return (
    <div className="flex flex-col gap-4">

      {/* View toggle */}
      <div className="flex gap-2">
        {([
          { id: 'search',  label: '🔍 Food Search',    desc: 'USDA + Open Food Facts' },
          { id: 'library', label: '📚 Baby Food Guide', desc: 'Age-appropriate foods'  },
        ] as const).map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl transition-all text-center"
            style={view === v.id ? {
              background: 'linear-gradient(135deg, rgb(32 195 190 / 0.2), rgb(56 189 248 / 0.15))',
              border: '1px solid rgb(32 195 190 / 0.4)',
              color: 'rgb(94 234 212)',
            } : {
              background: 'rgb(255 255 255 / 0.04)',
              border: '1px solid rgb(255 255 255 / 0.08)',
              color: 'rgb(var(--text-secondary))',
            }}>
            <span className="text-xs font-black">{v.label}</span>
            <span className="text-[10px] opacity-70">{v.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Food Search view ── */}
      {view === 'search' && (
        <div className="flex flex-col gap-3">
          {/* Baby context banner */}
          <div className="px-3 py-2.5 rounded-xl flex items-center gap-2.5"
            style={{ background: 'rgb(32 195 190 / 0.08)', border: '1px solid rgb(32 195 190 / 0.2)' }}>
            <span className="text-lg flex-shrink-0">👶</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-teal-300">
                Age {ageMonths}m — {selectedStageId?.replace(/_/g, ' ') ?? 'current stage'}
              </p>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Search any food for full nutrition info. Age-appropriate notes are shown where available.
                Always verify with your paediatrician before introducing new foods.
              </p>
            </div>
          </div>

          <FoodSearchPanel
            contextLabel="Search Foods"
            accentColor="rgb(32 195 190)"
            contextId="baby-foods"
            safetyContext="baby"
            babyAgeMonths={ageMonths}
          />
        </div>
      )}

      {/* ── Baby Library view ── */}
      {view === 'library' && (
        <div className="flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none">🔍</span>
            <input
              type="search"
              placeholder="Search baby foods…"
              value={libSearch}
              onChange={e => setLibSearch(e.target.value)}
              className="g-input pl-8"
            />
          </div>

          {/* Category tabs */}
          <div className="g-tab-bar overflow-x-auto">
            {LIB_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setLibTab(tab.id); setLibSearch('') }}
                className={`g-tab ${libTab === tab.id ? 'g-tab-active-teal' : ''}`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Age filter toggle */}
          {tooYoung.length > 0 && !libSearch && (
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              className="g-btn g-btn-sm w-full justify-between px-3"
            >
              <span>{showAll ? 'Showing all foods' : `${ageAppropriate.length} foods for ${ageMonths}m+`}</span>
              <span className="text-[10px] opacity-60">
                {showAll ? 'Show age-appropriate only' : `+${tooYoung.length} more later`}
              </span>
            </button>
          )}

          {/* Grid */}
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
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setSelectedFood(food)}
                    className="g-card p-3 text-left flex flex-col gap-2 relative transition-transform hover:scale-[1.02] active:scale-[0.99]"
                    style={{ opacity: notYet ? 0.5 : 1 }}
                  >
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
        </div>
      )}

      {/* Detail modal */}
      {selectedFood && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 g-modal-overlay animate-pop-in"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="g-modal-panel w-full max-w-md animate-pop-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
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
                <button type="button" onClick={() => setSelectedFood(null)} className="g-btn-icon g-btn text-xs">✕</button>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                <span className="g-badge"
                  style={{ background: 'rgb(32 195 190 / 0.15)', borderColor: 'rgb(32 195 190 / 0.25)', color: 'rgb(94 234 212)' }}>
                  From {selectedFood.minAgeMonths}m
                </span>
                {selectedFood.commonAllergen && (
                  <span className="g-badge"
                    style={{ background: 'rgb(239 68 68 / 0.12)', borderColor: 'rgb(239 68 68 / 0.22)', color: 'rgb(252 165 165)' }}>
                    ⚠️ Allergen: {selectedFood.allergenName}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '55vh' }}>
              {selectedFood.safety && (() => {
                const s = SAFETY_STYLE[selectedFood.safety] ?? SAFETY_STYLE.safe
                return (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold w-fit"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                    {selectedFood.safety.replace(/_/g, ' ')}
                  </span>
                )
              })()}

              {selectedFood.safetyNote && (
                <div className="g-disclaimer">⚠️ {selectedFood.safetyNote}</div>
              )}
              {selectedFood.chokingRisk && (
                <div className="g-disclaimer"
                  style={{ background: 'rgb(239 68 68 / 0.08)', borderColor: 'rgb(239 68 68 / 0.2)', color: 'rgb(252 165 165)' }}>
                  🚨 <strong>Choking risk:</strong> {selectedFood.chokingNote}
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Key Nutrients</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFood.nutrients.map(n => (
                    <span key={n} className="g-badge"
                      style={{ background: 'rgb(32 195 190 / 0.12)', borderColor: 'rgb(32 195 190 / 0.22)', color: 'rgb(94 234 212)' }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>

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
