import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import { computeMetrics } from '../utils/calculations'
import {
  logMeal, fetchMealsForDate, removeMeal,
  logWater, fetchWaterForDate, removeWater,
} from '../services/nutritionService'
import type { FoodItem, MealEntry, MealType, WaterEntry } from '../types/nutrition'
import type { UnifiedFood } from '../types/food'
import { MEAL_LABELS, MEAL_ICONS, scaleMacros, sumNutrition, sumWater } from '../types/nutrition'
import { localTodayISO, formatFullDate } from '../utils/format'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import FoodSearch from '../components/food/FoodSearch'

const WATER_PRESETS = [250, 500, 750, 1000]
const MACRO_COLORS = { protein: '#8b5cf6', carbs: '#ec4899', fat: '#f59e0b' }

const MEAL_CARD_COLORS: Record<MealType, { card: string; accent: string; icon_bg: string }> = {
  breakfast: { card: 'card-yellow', accent: '#f59e0b', icon_bg: 'rgba(245,158,11,0.15)' },
  lunch:     { card: 'card-green',  accent: '#10b981', icon_bg: 'rgba(16,185,129,0.15)' },
  dinner:    { card: 'card-blue',   accent: '#60a5fa', icon_bg: 'rgba(96,165,250,0.15)' },
  snacks:    { card: 'card-pink',   accent: '#ec4899', icon_bg: 'rgba(236,72,153,0.15)' },
}

export default function Nutrition() {
  const { profile } = useAuth()
  const uid = profile?.uid ?? ''
  const metrics = profile ? computeMetrics(profile) : null

  const [date, setDate]           = useState(localTodayISO())
  const [meals, setMeals]         = useState<MealEntry[]>([])
  const [water, setWater]         = useState<WaterEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [showAddFood, setShowAddFood] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast')

  async function load() {
    if (!uid) return
    setLoading(true)
    const [m, w] = await Promise.all([fetchMealsForDate(uid, date), fetchWaterForDate(uid, date)])
    setMeals(m); setWater(w); setLoading(false)
  }

  useEffect(() => { load() }, [uid, date])

  const nutrition  = sumNutrition(meals)
  const waterTotal = sumWater(water)
  const waterGoal  = 2500
  const targetCals = metrics?.targetCalories ?? 2000
  const calPct     = Math.min(100, Math.round((nutrition.calories / targetCals) * 100))
  const waterPct   = Math.min(100, Math.round((waterTotal / waterGoal) * 100))

  const macroData = [
    { name: 'Protein', value: Math.round(nutrition.protein), color: MACRO_COLORS.protein },
    { name: 'Carbs',   value: Math.round(nutrition.carbs),   color: MACRO_COLORS.carbs   },
    { name: 'Fat',     value: Math.round(nutrition.fat),     color: MACRO_COLORS.fat      },
  ].filter(d => d.value > 0)

  const mealGroups = (['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map(type => ({
    type,
    entries: meals.filter(m => m.meal === type),
  }))

  if (loading) return <PageLoader variant="nutrition" />

  async function handleAddWater(ml: number) { await logWater(uid, ml, date); load() }
  async function handleDeleteMeal(id: string) { await removeMeal(uid, id); load() }
  async function handleDeleteWater(id: string) { await removeWater(uid, id); load() }

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-7">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Nutrition <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1">{formatFullDate(date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date" value={date} max={localTodayISO()}
            onChange={e => setDate(e.target.value)}
            className="input py-2 text-sm w-auto"
            style={{ minWidth: 0 }}
          />
          <button onClick={() => setShowAddFood(true)} className="btn-purple btn-sm whitespace-nowrap">
            + Add Food
          </button>
        </div>
      </div>

      {/* ── Summary row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">

        {/* Calories */}
        <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-lg sm:text-xl"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>🔥</div>
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>{calPct}%</span>
          </div>
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">Calories</p>
          <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {Math.round(nutrition.calories).toLocaleString()}
            <span className="text-xs sm:text-sm font-normal text-text-muted ml-1">/ {Math.round(targetCals)}</span>
          </p>
          <div className="mt-3 progress-bar">
            <div className="progress-bar-fill progress-bar-amber" style={{ width: `${calPct}%`,
              background: 'linear-gradient(90deg,#f59e0b,#f97316)' }} />
          </div>
        </div>

        {/* Macros donut */}
        <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '60ms' }}>
          <p className="text-xs sm:text-sm font-black text-text-primary mb-3 sm:mb-4">Macros</p>
          {macroData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={88} height={88}>
                  <PieChart>
                    <Pie data={macroData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={26} outerRadius={42} paddingAngle={3}>
                      {macroData.map((d, i) => (
                        <Cell key={i} fill={d.color}
                          style={{ filter: `drop-shadow(0 0 4px ${d.color}60)` }} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgb(30,28,52)', border: '1px solid rgba(108,65,210,0.3)', borderRadius: '10px', fontSize: '11px' }}
                      formatter={(v, n) => [`${v}g`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {[
                  { label: 'Protein', value: nutrition.protein, color: MACRO_COLORS.protein },
                  { label: 'Carbs',   value: nutrition.carbs,   color: MACRO_COLORS.carbs   },
                  { label: 'Fat',     value: nutrition.fat,     color: MACRO_COLORS.fat      },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-text-muted font-semibold">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                      {m.label}
                    </span>
                    <span className="text-sm font-black text-text-primary">{Math.round(m.value)}g</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-20 gap-2 opacity-40">
              <span className="text-3xl">🥗</span>
              <p className="text-xs text-text-muted">No food logged</p>
            </div>
          )}
        </div>

        {/* Water */}
        <div className="card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-lg sm:text-xl"
              style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)' }}>💧</div>
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>{waterPct}%</span>
          </div>
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">Hydration</p>
          <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {(waterTotal / 1000).toFixed(1)}
            <span className="text-xs sm:text-sm font-normal text-text-muted ml-1">/ {waterGoal / 1000}L</span>
          </p>
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {WATER_PRESETS.map(ml => (
              <button key={ml} onClick={() => handleAddWater(ml)}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all text-xs font-bold"
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#93c5fd' }}>
                <span>💧</span>
                <span>{ml < 1000 ? `${ml}` : '1L'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Meal sections ── */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {mealGroups.map(({ type, entries }, gi) => {
          const mealNutrition = sumNutrition(entries)
          const meta = MEAL_CARD_COLORS[type]
          return (
            <div key={type}
              className={`${meta.card} rounded-2xl overflow-hidden animate-fade-up opacity-0`}
              style={{ animationFillMode: 'forwards', animationDelay: `${gi * 55}ms` }}>

              {/* Meal header */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                    style={{ background: meta.icon_bg, border: `1px solid ${meta.accent}33` }}>
                    {MEAL_ICONS[type]}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-primary">{MEAL_LABELS[type]}</h3>
                    {entries.length > 0 && (
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {Math.round(mealNutrition.calories)} kcal · P:{Math.round(mealNutrition.protein)}g
                        · C:{Math.round(mealNutrition.carbs)}g · F:{Math.round(mealNutrition.fat)}g
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedMeal(type); setShowAddFood(true) }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: `${meta.accent}18`, border: `1px solid ${meta.accent}30`, color: meta.accent }}>
                  + Add
                </button>
              </div>

              {/* Entries */}
              {entries.length > 0 && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {entries.map(e => {
                    const macros = scaleMacros(e.foodItem, e.grams)
                    return (
                      <div key={e.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {e.foodItem.name}
                            {e.foodItem.brand && (
                              <span className="text-xs font-normal text-text-muted ml-1">({e.foodItem.brand})</span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">{e.grams}g · {macros.calories} kcal</p>
                        </div>
                        <button onClick={() => handleDeleteMeal(e.id)}
                          aria-label={`Remove ${e.foodItem.name}`}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger transition-colors ml-3 flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {entries.length === 0 && (
                <p className="text-xs text-text-muted text-center pb-5 opacity-50">Nothing logged — tap + Add</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Water log */}
      {water.length > 0 && (
        <div className="card card-shadow p-5 rounded-2xl mt-4">
          <h3 className="text-sm font-black text-text-primary mb-3">Water Log</h3>
          <div className="flex flex-wrap gap-2">
            {water.map(w => (
              <div key={w.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
                <span className="text-sm">💧</span>
                <span className="text-xs font-bold text-blue-300">{w.amount}ml</span>
                <button onClick={() => handleDeleteWater(w.id)} aria-label="Remove water"
                  className="text-text-muted hover:text-danger transition-colors ml-0.5">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Food Modal */}
      {showAddFood && (
        <AddFoodModal
          uid={uid} date={date} meal={selectedMeal}
          onClose={() => setShowAddFood(false)} onAdded={load}
        />
      )}
    </div>
  )
}

// ── Add Food Modal ─────────────────────────────────────────────────────────────
// Uses unified FoodSearch component — same service as Pregnancy/Baby/Family.
function AddFoodModal({ uid, date, meal, onClose, onAdded }: {
  uid: string; date: string; meal: MealType; onClose: () => void; onAdded: () => void
}) {
  const accentColor = MEAL_CARD_COLORS[meal].accent
  const [selected,  setSelected]  = useState<UnifiedFood | null>(null)
  const [grams,     setGrams]     = useState('100')
  const [adding,    setAdding]    = useState(false)
  const [addError,  setAddError]  = useState(false)

  const previewMacros = selected ? scaleMacros(selected as FoodItem, Number(grams) || 100) : null

  async function handleAdd() {
    if (!selected) return
    const g = Number(grams)
    if (!g || g <= 0) return
    setAdding(true)
    setAddError(false)
    try {
      await logMeal(uid, selected as FoodItem, g, meal, date)
      onAdded()
      onClose()
    } catch {
      setAddError(true)
      setAdding(false)
    }
  }

  function handleSelect(food: UnifiedFood) {
    setSelected(food)
    setGrams(String((food as FoodItem).servingSize ?? 100))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="card card-shadow p-5 rounded-2xl max-h-[92vh] overflow-y-auto"
          style={{ border: `1px solid ${accentColor}33` }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-text-primary">Add Food</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {MEAL_ICONS[meal]} to {MEAL_LABELS[meal]}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
          </div>

          {/* ── Step 1: Search ── */}
          {!selected && (
            <FoodSearch
              contextId={`nutrition-${meal}`}
              accentColor={accentColor}
              onSelect={handleSelect}
              maxResults={15}
              autoFocus
            />
          )}

          {/* ── Step 2: Portion + Nutrition preview ── */}
          {selected && (
            <div className="flex flex-col gap-4 animate-fade-in">

              {/* Selected food header */}
              <div className="flex items-start justify-between gap-3 p-4 rounded-xl"
                style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-text-primary leading-tight">{selected.name}</p>
                  {selected.brand && (
                    <p className="text-xs text-text-muted mt-0.5">{selected.brand}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">
                    Per 100g: <span className="font-bold" style={{ color: accentColor }}>{selected.calories} kcal</span>
                    {' · '}P:{selected.protein}g C:{selected.carbs}g F:{selected.fat}g
                  </p>
                </div>
                <button type="button" onClick={() => { setSelected(null); setGrams('100') }}
                  className="text-xs font-bold flex-shrink-0 px-2 py-1 rounded-lg transition-all"
                  style={{ color: accentColor, background: `${accentColor}15` }}>
                  Change
                </button>
              </div>

              {/* Serving size selector */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Serving Size (grams)
                </label>
                {(selected as FoodItem).servingSize && (selected as FoodItem).servingUnit && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-text-muted">
                      Typical: <strong className="text-text-primary">{(selected as FoodItem).servingUnit}</strong>
                      {' ≈ '}{(selected as FoodItem).servingSize}g
                    </span>
                    <button type="button"
                      onClick={() => setGrams(String((selected as FoodItem).servingSize))}
                      className="text-xs font-bold px-2.5 py-0.5 rounded-lg transition-all"
                      style={{ color: accentColor, border: `1px solid ${accentColor}50`, background: `${accentColor}12` }}>
                      Use
                    </button>
                  </div>
                )}
                {/* Quick gram presets */}
                <div className="flex gap-2 mb-2">
                  {[50, 100, 150, 200].map(g => (
                    <button key={g} type="button" onClick={() => setGrams(String(g))}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={Number(grams) === g
                        ? { background: accentColor, color: 'white' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgb(var(--text-secondary))', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {g}g
                    </button>
                  ))}
                </div>
                <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
                  className="input w-full" min={1} step={1} placeholder="Enter grams" />
              </div>

              {/* Nutrition preview */}
              {previewMacros && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                    Nutrition for {grams}g
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {[
                      { label: 'Calories', value: `${previewMacros.calories}`,            color: accentColor },
                      { label: 'Protein',  value: `${Math.round(previewMacros.protein)}g`, color: '#8b5cf6' },
                      { label: 'Carbs',    value: `${Math.round(previewMacros.carbs)}g`,   color: '#ec4899' },
                      { label: 'Fat',      value: `${Math.round(previewMacros.fat)}g`,     color: '#f59e0b' },
                    ].map(n => (
                      <div key={n.label} className="p-2 rounded-lg" style={{ background: `${n.color}10` }}>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-wide">{n.label}</p>
                        <p className="text-base font-black mt-0.5" style={{ color: n.color }}>{n.value}</p>
                      </div>
                    ))}
                  </div>
                  {previewMacros.fiber > 0 && (
                    <p className="text-[10px] text-text-muted text-center mt-2">
                      Fibre: {previewMacros.fiber}g
                    </p>
                  )}
                </div>
              )}

              {/* Error state */}
              {addError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgb(239 68 68 / 0.1)', border: '1px solid rgb(239 68 68 / 0.25)' }}>
                  <span className="text-red-400 text-sm">⚠</span>
                  <p className="text-xs text-red-300">Failed to add food. Check your connection and try again.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setSelected(null); setGrams('100') }}
                  className="btn-ghost flex-1">
                  ← Back
                </button>
                <button type="button" onClick={handleAdd} disabled={adding || !grams || Number(grams) <= 0}
                  className="btn-purple flex-1 flex items-center justify-center gap-2">
                  {adding && <LoadingSpinner size="sm" />}
                  {adding ? 'Adding…' : `Add to ${MEAL_LABELS[meal]}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
