// ── Reusable Food Search UI ───────────────────────────────────────────────────
// Used by FitTracker (Nutrition page), Pregnancy, Baby, and Family sections.
// Features: debounced search, skeleton loading, empty state, error state,
//           recent foods, per-100g macros, serving size toggle, select callback.

import { useState, useEffect, useRef } from 'react'
import type { UnifiedFood } from '../../types/food'
import {
  searchFoods,
  scaleMacros,
  getRecentFoods,
  addRecentFood,
  debounce,
} from '../../services/foodService'

// ── Props ─────────────────────────────────────────────────────────────────────
export interface FoodSearchProps {
  /** Called when a food is selected */
  onSelect: (food: UnifiedFood) => void
  /** Placeholder text */
  placeholder?: string
  /** Accent color for highlights (CSS color string) */
  accentColor?: string
  /** Context id — prevents cross-section request cancellation */
  contextId?: string
  /** Max results to show */
  maxResults?: number
  /** Auto-focus the input on mount */
  autoFocus?: boolean
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
      style={{ background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.06)' }}>
      <div className="w-10 h-10 rounded-xl flex-shrink-0"
        style={{ background: 'rgb(255 255 255 / 0.06)', animation: 'skeleton-pulse 1.4s ease-in-out infinite' }} />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-3 rounded-full w-3/4"
          style={{ background: 'rgb(255 255 255 / 0.08)', animation: 'skeleton-pulse 1.4s ease-in-out infinite' }} />
        <div className="h-2.5 rounded-full w-1/2"
          style={{ background: 'rgb(255 255 255 / 0.05)', animation: 'skeleton-pulse 1.4s ease-in-out 0.2s infinite' }} />
      </div>
      <div className="w-12 h-8 rounded-lg"
        style={{ background: 'rgb(255 255 255 / 0.05)', animation: 'skeleton-pulse 1.4s ease-in-out 0.1s infinite' }} />
    </div>
  )
}

// ── Category emoji ────────────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  grains:      '🌾',
  protein:     '🍗',
  dairy:       '🥛',
  fruits:      '🍎',
  vegetables:  '🥦',
  legumes:     '🫘',
  nuts_seeds:  '🌰',
  beverages:   '🥤',
  sweets:      '🍬',
  condiments:  '🫙',
  oils:        '🫒',
  prepared:    '🍲',
  other:       '🍽️',
}

function foodEmoji(food: UnifiedFood): string {
  return food.category ? (CATEGORY_EMOJI[food.category] ?? '🍽️') : '🍽️'
}

// ── Macro pill ────────────────────────────────────────────────────────────────
function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: `${color}1a`, color }}>
      {label} {value}g
    </span>
  )
}

// ── Food result row ───────────────────────────────────────────────────────────
function FoodRow({
  food,
  accentColor,
  onSelect,
}: {
  food: UnifiedFood
  accentColor: string
  onSelect: (f: UnifiedFood) => void
}) {
  const macros = scaleMacros(food, 100)
  const serving = food.servingSize
    ? scaleMacros(food, food.servingSize)
    : null

  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: 'rgb(255 255 255 / 0.04)',
        border:     '1px solid rgb(255 255 255 / 0.07)',
      }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
        {food.imageUrl
          ? <img src={food.imageUrl} alt="" className="w-8 h-8 object-cover rounded-lg" loading="lazy" />
          : foodEmoji(food)
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-primary leading-tight truncate">
          {food.name}
          {food.brand && (
            <span className="text-[11px] font-normal text-text-muted ml-1.5">· {food.brand}</span>
          )}
        </p>

        {/* per 100g line */}
        <p className="text-[11px] text-text-muted mt-0.5">
          {macros.calories} kcal / 100g
        </p>

        {/* Macro pills */}
        <div className="flex flex-wrap gap-1 mt-1">
          <MacroPill label="P" value={macros.protein} color="rgb(52 211 153)" />
          <MacroPill label="C" value={macros.carbs}   color="rgb(251 191 36)" />
          <MacroPill label="F" value={macros.fat}     color="rgb(249 115 22)" />
          {(food.fiber ?? 0) > 0 && (
            <MacroPill label="Fiber" value={macros.fiber} color="rgb(167 139 250)" />
          )}
        </div>

        {/* Serving hint */}
        {serving && food.servingUnit && (
          <p className="text-[10px] text-text-muted mt-0.5 opacity-70">
            {food.servingUnit}: {serving.calories} kcal
          </p>
        )}
      </div>

      {/* Add button */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg transition-all"
        style={{ background: `${accentColor}22`, color: accentColor }}>
        +
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FoodSearch({
  onSelect,
  placeholder = 'Search chicken, rice, egg…',
  accentColor = 'rgb(139 92 246)',
  contextId   = 'default',
  maxResults  = 15,
  autoFocus   = false,
}: FoodSearchProps) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<UnifiedFood[]>([])
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'error'>('idle')
  const [recent,   setRecent]   = useState<UnifiedFood[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent on mount
  useEffect(() => {
    setRecent(getRecentFoods())
    if (autoFocus) {
      // Small delay so modal transition completes first
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [autoFocus])

  // Debounced search executor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runSearch = useRef<(q: string, ctx: string, max: number) => void>(
    (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const debouncedFn = debounce((q: any, ctx: any, max: any) => {
        if (q.length < 2) { setResults([]); setStatus('idle'); return }
        setStatus('loading')
        searchFoods(q, { contextId: ctx, maxResults: max })
          .then(foods => {
            setResults(foods)
            setStatus('success' as 'idle')
          })
          .catch(() => {
            setStatus('error')
          })
      }, 320)
      return (q: string, ctx: string, max: number) => debouncedFn(q, ctx, max)
    })()
  ).current

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (val.trim().length < 2) {
      setResults([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    runSearch(val, contextId, maxResults)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setStatus('idle')
    inputRef.current?.focus()
  }

  function handleSelect(food: UnifiedFood) {
    addRecentFood(food)
    setRecent(getRecentFoods())
    onSelect(food)
  }

  const showRecent  = query.length < 2 && recent.length > 0
  const showResults = query.length >= 2
  const isEmpty     = showResults && status !== 'loading' && results.length === 0

  return (
    <div className="flex flex-col gap-3">

      {/* Search input */}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-text-muted text-base pointer-events-none select-none">🔍</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium text-text-primary outline-none transition-all"
          style={{
            background:  'rgb(255 255 255 / 0.06)',
            border:      `1px solid ${query.length >= 2 ? accentColor + '60' : 'rgb(255 255 255 / 0.1)'}`,
            boxShadow:   query.length >= 2 ? `0 0 0 2px ${accentColor}18` : 'none',
          }}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 text-text-muted hover:text-text-primary transition-colors text-sm font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {status === 'loading' && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-bold text-text-secondary">Search failed</p>
          <p className="text-xs text-text-muted">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => runSearch(query, contextId, maxResults)}
            className="mt-1 text-xs font-bold px-4 py-2 rounded-xl transition-all"
            style={{ background: `${accentColor}22`, color: accentColor }}>
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {status !== 'loading' && status !== 'error' && showResults && !isEmpty && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </p>
          {results.map(food => (
            <FoodRow
              key={food.fdcId}
              food={food}
              accentColor={accentColor}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-4xl">🍽️</span>
          <p className="text-sm font-bold text-text-secondary">No foods found</p>
          <p className="text-xs text-text-muted leading-relaxed max-w-xs">
            Try a different search term, e.g. "chicken breast", "dal rice", "banana"
          </p>
        </div>
      )}

      {/* Recent foods */}
      {showRecent && status !== 'loading' && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
            🕓 Recently searched
          </p>
          {recent.map(food => (
            <FoodRow
              key={food.fdcId}
              food={food}
              accentColor={accentColor}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Idle / prompt */}
      {!showRecent && !showResults && status !== 'loading' && (
        <div className="flex flex-col items-center gap-2 py-6 text-center opacity-60">
          <span className="text-3xl">🔍</span>
          <p className="text-xs text-text-muted">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  )
}

// ── Portion selector ──────────────────────────────────────────────────────────
// Shown after a food is selected, before confirming the add.
export interface PortionSelectorProps {
  food:     UnifiedFood
  accentColor?: string
  onConfirm: (grams: number) => void
  onBack:    () => void
}

export function PortionSelector({
  food,
  accentColor = 'rgb(139 92 246)',
  onConfirm,
  onBack,
}: PortionSelectorProps) {
  const [grams, setGrams] = useState(String(food.servingSize ?? 100))
  const numGrams  = Math.max(1, Number(grams) || 100)
  const macros    = scaleMacros(food, numGrams)
  const hasServ   = food.servingSize && food.servingUnit

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* Back header */}
      <button type="button" onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-secondary transition-colors w-fit">
        ← Back to search
      </button>

      {/* Food name card */}
      <div className="p-4 rounded-xl flex items-center gap-3"
        style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30` }}>
        <span className="text-2xl">{foodEmoji(food)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-text-primary text-sm leading-tight">{food.name}</p>
          {food.brand && <p className="text-[11px] text-text-muted">{food.brand}</p>}
          <p className="text-[11px] text-text-muted mt-0.5">{food.calories} kcal / 100g</p>
        </div>
      </div>

      {/* Serving quick-picks */}
      {hasServ && (
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setGrams('100')}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={grams === '100' ? {
              background: `${accentColor}22`, border: `1px solid ${accentColor}50`, color: accentColor,
            } : {
              background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.08)', color: 'rgb(var(--text-secondary))',
            }}>
            100g
          </button>
          <button type="button"
            onClick={() => setGrams(String(food.servingSize))}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={grams === String(food.servingSize) ? {
              background: `${accentColor}22`, border: `1px solid ${accentColor}50`, color: accentColor,
            } : {
              background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.08)', color: 'rgb(var(--text-secondary))',
            }}>
            {food.servingUnit}
          </button>
        </div>
      )}

      {/* Gram input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Amount (grams)</label>
        <input
          type="number"
          value={grams}
          onChange={e => setGrams(e.target.value)}
          min={1}
          max={2000}
          className="w-full px-4 py-3 rounded-xl text-sm font-bold text-text-primary outline-none"
          style={{
            background: 'rgb(255 255 255 / 0.06)',
            border:     `1px solid ${accentColor}40`,
          }}
        />
      </div>

      {/* Live macro preview */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Calories', value: `${macros.calories}`, unit: 'kcal', color: accentColor },
          { label: 'Protein',  value: `${macros.protein}g`, unit: '',     color: 'rgb(52 211 153)' },
          { label: 'Carbs',    value: `${macros.carbs}g`,   unit: '',     color: 'rgb(251 191 36)' },
          { label: 'Fat',      value: `${macros.fat}g`,     unit: '',     color: 'rgb(249 115 22)' },
        ].map(m => (
          <div key={m.label} className="flex flex-col items-center p-2.5 rounded-xl"
            style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
            <p className="text-xs font-black" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[9px] text-text-muted mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={() => onConfirm(numGrams)}
        className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all active:scale-[0.98]"
        style={{
          background:  `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          boxShadow:   `0 4px 16px ${accentColor}40`,
        }}>
        Add {numGrams}g · {macros.calories} kcal
      </button>
    </div>
  )
}
