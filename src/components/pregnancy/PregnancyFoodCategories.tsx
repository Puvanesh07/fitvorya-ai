import { useState } from 'react'
import type { PregnancyFood, FoodCategory } from '../../types/pregnancy'
import { PREGNANCY_FOODS, getSafetyColor, getSafetyLabel } from '../../data/pregnancyData'

interface Props {
  tamilPref: boolean
}

type Tab = { id: FoodCategory | 'all'; label: string; emoji: string }

const TABS: Tab[] = [
  { id: 'all',              label: 'All Foods',     emoji: '🍽️' },
  { id: 'millets',          label: 'Millets',       emoji: '🌾' },
  { id: 'rice',             label: 'Traditional Rice', emoji: '🍚' },
  { id: 'vegetables',       label: 'Vegetables',    emoji: '🥬' },
  { id: 'fruits',           label: 'Fruits',        emoji: '🍎' },
  { id: 'protein',          label: 'Protein',       emoji: '💪' },
  { id: 'global',           label: 'Global',        emoji: '🌍' },
  { id: 'dairy',            label: 'Dairy',         emoji: '🥛' },
  { id: 'healthy_fats',     label: 'Healthy Fats',  emoji: '🥑' },
  { id: 'grains',           label: 'Grains',        emoji: '🍞' },
]

export default function PregnancyFoodCategories({ tamilPref }: Props) {
  const [activeTab,    setActiveTab]    = useState<Tab['id']>(tamilPref ? 'millets' : 'all')
  const [selectedFood, setSelectedFood] = useState<PregnancyFood | null>(null)
  const [searchQuery,  setSearchQuery]  = useState('')

  const filtered = PREGNANCY_FOODS.filter(f => {
    const matchesTab   = activeTab === 'all' || f.category === activeTab
    const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.tamilName?.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTab && matchesSearch
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
        <input
          type="search"
          placeholder="Search foods (e.g. ragi, banana, iron)…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Category tabs — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'gradient-brand text-white shadow-md shadow-purple-500/20'
                : 'bg-surface2 text-text-secondary border border-border hover:border-purple-300'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-text-muted px-1">
        {filtered.length} food{filtered.length !== 1 ? 's' : ''} {activeTab !== 'all' ? `in this category` : 'total'}
      </p>

      {/* Food grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-text-secondary text-sm">No foods found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(food => (
            <button
              key={food.id}
              onClick={() => setSelectedFood(food)}
              className="card card-shadow card-hover text-left flex flex-col gap-2 p-3"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-2xl">{food.emoji}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getSafetyColor(food.safety)}`}>
                  {food.safety === 'safe' ? '✓' : food.safety === 'avoid' ? '✗' : '⚠'}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary leading-tight">{food.name}</p>
                {food.tamilName && (
                  <p className="text-xs text-text-muted mt-0.5">{food.tamilName}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-auto">
                {food.nutrients.slice(0, 2).map(n => (
                  <span key={n} className="text-[10px] px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full">
                    {n}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Food detail modal */}
      {selectedFood && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="bg-surface rounded-3xl card-shadow w-full max-w-md animate-scale-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedFood.emoji}</span>
                  <div>
                    <h3 className="font-black text-lg">{selectedFood.name}</h3>
                    {selectedFood.tamilName && (
                      <p className="text-white/70 text-sm">{selectedFood.tamilName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {/* Safety badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold w-fit ${getSafetyColor(selectedFood.safety)}`}>
                {getSafetyLabel(selectedFood.safety)}
              </div>

              {/* Safety note */}
              {selectedFood.safetyNote && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl">
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    ⚠️ {selectedFood.safetyNote}
                  </p>
                </div>
              )}

              {/* Nutrients */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Key Nutrients</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFood.nutrients.map(n => (
                    <span key={n} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Benefits</p>
                <ul className="flex flex-col gap-1.5">
                  {selectedFood.benefits.map(b => (
                    <li key={b} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-success flex-shrink-0">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Serving */}
              {selectedFood.servingSuggestion && (
                <div className="p-3 bg-surface2 rounded-2xl border border-border">
                  <p className="text-xs font-bold text-text-secondary mb-1">🍽️ How to use</p>
                  <p className="text-sm text-text-primary">{selectedFood.servingSuggestion}</p>
                </div>
              )}

              {/* Disclaimer */}
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
