// ── Pregnancy Food Categories + Integrated Food Search ───────────────────────
// The "Foods" tab for the Pregnancy section.
// Top section: real food search (USDA + Open Food Facts + local DB) with
//   pregnancy-specific safety context.
// Bottom section: curated pregnancy food library (local data).

import { useState } from 'react'
import type { PregnancyFood, FoodCategory } from '../../types/pregnancy'
import { PREGNANCY_FOODS, getSafetyLabel } from '../../data/pregnancyData'
import FoodSearchPanel from '../food/FoodSearchPanel'

interface Props {
  tamilPref:  boolean
  week?:      number
  trimester?: 1 | 2 | 3
}

type LibTab = FoodCategory | 'all'

const LIB_TABS: { id: LibTab; label: string; emoji: string }[] = [
  { id: 'all',              label: 'All',     emoji: '🍽️' },
  { id: 'millets',          label: 'Millets', emoji: '🌾' },
  { id: 'rice',             label: 'Rice',    emoji: '🍚' },
  { id: 'vegetables',       label: 'Veggies', emoji: '🥬' },
  { id: 'fruits',           label: 'Fruits',  emoji: '🍎' },
  { id: 'protein',          label: 'Protein', emoji: '💪' },
  { id: 'global',           label: 'Global',  emoji: '🌍' },
  { id: 'dairy',            label: 'Dairy',   emoji: '🥛' },
  { id: 'healthy_fats',     label: 'Fats',    emoji: '🥑' },
  { id: 'grains',           label: 'Grains',  emoji: '🍞' },
]

const SAFETY_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  safe:    { bg: 'rgb(16 185 129 / 0.12)',  border: 'rgb(16 185 129 / 0.25)',  color: 'rgb(110 231 183)' },
  caution: { bg: 'rgb(234 179 8 / 0.12)',   border: 'rgb(234 179 8 / 0.25)',   color: 'rgb(253 224 71)'  },
  avoid:   { bg: 'rgb(239 68 68 / 0.12)',   border: 'rgb(239 68 68 / 0.25)',   color: 'rgb(252 165 165)' },
  moderate:{ bg: 'rgb(249 115 22 / 0.12)',  border: 'rgb(249 115 22 / 0.25)',  color: 'rgb(253 186 116)' },
}

export default function PregnancyFoodCategories({ tamilPref, week = 1, trimester = 1 }: Props) {
  const [libTab,       setLibTab]       = useState<LibTab>(tamilPref ? 'millets' : 'all')
  const [libSearch,    setLibSearch]    = useState('')
  const [selectedFood, setSelectedFood] = useState<PregnancyFood | null>(null)
  const [view,         setView]         = useState<'search' | 'library'>('search')

  const libFiltered = PREGNANCY_FOODS.filter(f => {
    const matchTab    = libTab === 'all' || f.category === libTab
    const matchSearch = !libSearch ||
      f.name.toLowerCase().includes(libSearch.toLowerCase()) ||
      (f.tamilName ?? '').toLowerCase().includes(libSearch.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="flex flex-col gap-4">

      {/* View toggle */}
      <div className="flex gap-2">
        {([
          { id: 'search',  label: '🔍 Food Search', desc: 'USDA + Open Food Facts' },
          { id: 'library', label: '📚 Pregnancy Library', desc: 'Curated safe foods' },
        ] as const).map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl transition-all text-center"
            style={view === v.id ? {
              background: 'linear-gradient(135deg, rgb(244 114 182 / 0.2), rgb(139 92 246 / 0.15))',
              border: '1px solid rgb(244 114 182 / 0.4)',
              color: 'rgb(249 168 212)',
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
          {/* Pregnancy context banner */}
          <div className="px-3 py-2.5 rounded-xl flex items-center gap-2.5"
            style={{ background: 'rgb(244 114 182 / 0.08)', border: '1px solid rgb(244 114 182 / 0.2)' }}>
            <span className="text-lg flex-shrink-0">🤰</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-pink-300">
                Week {week} · Trimester {trimester} context
              </p>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Search any food for full nutrition info. Safety notes reflect general pregnancy guidance — always verify with your healthcare provider.
              </p>
            </div>
          </div>

          <FoodSearchPanel
            contextLabel="Search Foods"
            accentColor="rgb(244 114 182)"
            contextId="pregnancy-foods"
            safetyContext="pregnancy"
            pregnancyWeek={week}
          />
        </div>
      )}

      {/* ── Pregnancy Library view ── */}
      {view === 'library' && (
        <div className="flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none">🔍</span>
            <input
              type="search"
              placeholder="Search pregnancy foods (e.g. ragi, banana, iron)…"
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
                className={`g-tab ${libTab === tab.id ? 'g-tab-active' : ''}`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-text-muted px-0.5">
            {libFiltered.length} food{libFiltered.length !== 1 ? 's' : ''}
            {libTab !== 'all' ? ' in this category' : ' — curated for pregnancy'}
          </p>

          {/* Food grid */}
          {libFiltered.length === 0 ? (
            <div className="g-card p-10 text-center">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-text-muted text-sm">No foods found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {libFiltered.map(food => {
                const ss = SAFETY_STYLE[food.safety] ?? SAFETY_STYLE.caution
                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setSelectedFood(food)}
                    className="g-card p-3 text-left flex flex-col gap-2 hover:scale-[1.02] active:scale-[0.99] transition-transform"
                  >
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
              background: 'linear-gradient(135deg, rgb(139 92 246 / 0.18), rgb(244 114 182 / 0.12))',
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
                <button type="button" onClick={() => setSelectedFood(null)} className="g-btn g-btn-icon text-xs">✕</button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '55vh' }}>
              {(() => {
                const ss = SAFETY_STYLE[selectedFood.safety] ?? SAFETY_STYLE.caution
                return (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold w-fit"
                    style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                    {getSafetyLabel(selectedFood.safety)}
                  </span>
                )
              })()}

              {selectedFood.safetyNote && (
                <div className="g-disclaimer">⚠️ {selectedFood.safetyNote}</div>
              )}

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
