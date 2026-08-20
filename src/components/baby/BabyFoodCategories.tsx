import { useState } from 'react'
import type { BabyFood, BabyFoodCategory } from '../../types/baby'
import { BABY_FOODS } from '../../data/babyData'

interface Props {
  ageMonths: number
  tamilPref: boolean
}

type TabId = BabyFoodCategory | 'all'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'all',              label: 'All',         emoji: '🍽️' },
  { id: 'tamil_traditional',label: 'Tamil',       emoji: '🍚' },
  { id: 'grains_cereals',   label: 'Grains',      emoji: '🌾' },
  { id: 'fruits',           label: 'Fruits',      emoji: '🍎' },
  { id: 'vegetables',       label: 'Vegetables',  emoji: '🥕' },
  { id: 'protein',          label: 'Protein',     emoji: '💪' },
  { id: 'dairy',            label: 'Dairy',       emoji: '🥛' },
  { id: 'global',           label: 'Global',      emoji: '🌍' },
]

const SAFETY_COLORS: Record<string, string> = {
  safe:           'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  age_restricted: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  caution:        'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  avoid_under_1:  'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
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

  const ageFiltered   = filtered.filter(f => f.minAgeMonths <= ageMonths)
  const tooYoung      = filtered.filter(f => f.minAgeMonths > ageMonths)
  const displayList   = showAll ? filtered : ageFiltered

  return (
    <div className="flex flex-col gap-4">

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
        <input
          type="search"
          placeholder="Search foods…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
                : 'bg-surface2 text-text-secondary border border-border hover:border-teal-300'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Age filter toggle */}
      {tooYoung.length > 0 && !searchQuery && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-border bg-surface2 text-sm font-semibold text-text-secondary hover:border-teal-300 transition-all"
        >
          <span>{showAll ? 'Showing all foods (including not-yet-appropriate)' : `Showing ${ageFiltered.length} foods suitable for current age`}</span>
          <span className="text-xs ml-2">{showAll ? 'Show age-appropriate only' : `+ ${tooYoung.length} more when older`}</span>
        </button>
      )}

      {/* Food grid */}
      {displayList.length === 0 ? (
        <div className="text-center py-12 card card-shadow">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-text-secondary text-sm">No foods found for this search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayList.map(food => {
            const notYet = food.minAgeMonths > ageMonths
            return (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className={`card card-shadow card-hover text-left flex flex-col gap-2 p-3 relative ${notYet ? 'opacity-50' : ''}`}
              >
                {notYet && (
                  <span className="absolute top-2 right-2 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                    {food.minAgeMonths}m+
                  </span>
                )}
                {food.commonAllergen && (
                  <span className="absolute top-2 left-2 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                    allergen
                  </span>
                )}
                <span className="text-3xl mt-2">{food.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-text-primary leading-tight">{food.name}</p>
                  {food.tamilName && <p className="text-xs text-text-muted mt-0.5">{food.tamilName}</p>}
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {food.nutrients.slice(0, 2).map(n => (
                    <span key={n} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full">{n}</span>
                  ))}
                </div>
                {food.chokingRisk && (
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">⚠️ Choking care needed</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedFood && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="bg-surface rounded-3xl card-shadow w-full max-w-md animate-scale-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedFood.emoji}</span>
                  <div>
                    <h3 className="font-black text-lg">{selectedFood.name}</h3>
                    {selectedFood.tamilName && <p className="text-white/70 text-sm">{selectedFood.tamilName}</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedFood(null)} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">✕</button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold">From {selectedFood.minAgeMonths} months</span>
                {selectedFood.commonAllergen && (
                  <span className="px-2.5 py-1 bg-red-400/40 rounded-full text-xs font-semibold">⚠️ Allergen: {selectedFood.allergenName}</span>
                )}
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {/* Safety */}
              <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold w-fit ${SAFETY_COLORS[selectedFood.safety]}`}>
                {selectedFood.safety.replace(/_/g, ' ')}
              </span>
              {selectedFood.safetyNote && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl">
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">⚠️ {selectedFood.safetyNote}</p>
                </div>
              )}
              {selectedFood.chokingRisk && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">🚨 Choking risk</p>
                  <p className="text-xs text-red-700 dark:text-red-300">{selectedFood.chokingNote}</p>
                </div>
              )}
              {/* Nutrients */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Key Nutrients</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFood.nutrients.map(n => (
                    <span key={n} className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 rounded-full text-xs font-semibold">{n}</span>
                  ))}
                </div>
              </div>
              {/* Prep tips */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Preparation Tips</p>
                <ul className="flex flex-col gap-1.5">
                  {selectedFood.preparationTips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-teal-500 flex-shrink-0">•</span>{t}
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
