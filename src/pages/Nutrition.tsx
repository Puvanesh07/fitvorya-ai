import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import { computeMetrics } from '../utils/calculations'
import {
  searchFood, logMeal, fetchMealsForDate, removeMeal,
  logWater, fetchWaterForDate, removeWater,
} from '../services/nutritionService'
import type { FoodItem, MealEntry, MealType, WaterEntry } from '../types/nutrition'
import { MEAL_LABELS, MEAL_ICONS, scaleMacros, sumNutrition, sumWater } from '../types/nutrition'
import { localTodayISO, formatFullDate } from '../utils/format'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const WATER_PRESETS = [250, 500, 750, 1000]
const MACRO_COLORS = { protein: '#8b5cf6', carbs: '#ec4899', fat: '#f59e0b' }

export default function Nutrition() {
  const { profile } = useAuth()
  const uid = profile?.uid ?? ''
  const metrics = profile ? computeMetrics(profile) : null

  const [date, setDate] = useState(localTodayISO())
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [water, setWater] = useState<WaterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddFood, setShowAddFood] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast')

  async function load() {
    if (!uid) return
    setLoading(true)
    const [m, w] = await Promise.all([
      fetchMealsForDate(uid, date),
      fetchWaterForDate(uid, date),
    ])
    setMeals(m)
    setWater(w)
    setLoading(false)
  }

  useEffect(() => { load() }, [uid, date])

  const nutrition = sumNutrition(meals)
  const waterTotal = sumWater(water)
  const waterGoal = 2500 // Default

  const targetCals = metrics?.targetCalories ?? 2000
  const calPct = Math.min(100, Math.round((nutrition.calories / targetCals) * 100))
  const waterPct = Math.min(100, Math.round((waterTotal / waterGoal) * 100))

  const macroData = [
    { name: 'Protein', value: nutrition.protein, color: MACRO_COLORS.protein },
    { name: 'Carbs',   value: nutrition.carbs,   color: MACRO_COLORS.carbs },
    { name: 'Fat',     value: nutrition.fat,     color: MACRO_COLORS.fat },
  ].filter(d => d.value > 0)

  const mealGroups = (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => ({
    type,
    entries: meals.filter(m => m.meal === type),
  }))

  if (loading) {
    return <PageLoader />
  }

  async function handleAddWater(ml: number) {
    await logWater(uid, ml, date)
    load()
  }

  async function handleDeleteMeal(id: string) {
    await removeMeal(uid, id)
    load()
  }

  async function handleDeleteWater(id: string) {
    await removeWater(uid, id)
    load()
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Nutrition <span className="gradient-text">Tracker</span></h1>
          <p className="text-sm text-text-secondary mt-1">{formatFullDate(date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            max={localTodayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="input py-2 text-sm"
          />
          <button onClick={() => setShowAddFood(true)} className="btn-purple py-2.5 px-5">
            + Add Food
          </button>
        </div>
      </div>

      {/* Top cards — Calories + Macros + Water */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Calories */}
            <div className="card-yellow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">🔥</span>
                <span className="text-xs font-bold text-text-secondary">{calPct}%</span>
              </div>
              <p className="text-xs font-semibold text-text-secondary mb-1">Calories</p>
              <p className="text-3xl font-black text-text-primary mb-1">
                {nutrition.calories.toLocaleString()}<span className="text-base font-normal text-text-muted"> / {targetCals}</span>
              </p>
              <div className="progress-bar mt-3">
                <div className="progress-bar-fill" style={{ width: `${calPct}%` }} />
              </div>
            </div>

            {/* Macros donut */}
            <div className="card p-6">
              <p className="text-xs font-semibold text-text-secondary mb-4">Macros Breakdown</p>
              {macroData.length > 0 ? (
                <div className="flex items-center justify-between">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={macroData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={2}>
                        {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: MACRO_COLORS.protein }} />
                        Protein
                      </span>
                      <span className="font-bold text-text-primary">{Math.round(nutrition.protein)}g</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: MACRO_COLORS.carbs }} />
                        Carbs
                      </span>
                      <span className="font-bold text-text-primary">{Math.round(nutrition.carbs)}g</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: MACRO_COLORS.fat }} />
                        Fat
                      </span>
                      <span className="font-bold text-text-primary">{Math.round(nutrition.fat)}g</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary text-center py-8">No food logged yet</p>
              )}
            </div>

            {/* Water */}
            <div className="card-blue p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">💧</span>
                <span className="text-xs font-bold text-text-secondary">{waterPct}%</span>
              </div>
              <p className="text-xs font-semibold text-text-secondary mb-1">Water</p>
              <p className="text-3xl font-black text-text-primary mb-1">
                {(waterTotal / 1000).toFixed(1)}<span className="text-base font-normal text-text-muted">L / {waterGoal / 1000}L</span>
              </p>
              <div className="flex gap-2 mt-4">
                {WATER_PRESETS.map(ml => (
                  <button key={ml} onClick={() => handleAddWater(ml)}
                    className="water-btn flex-1">
                    <span className="text-lg">💧</span>
                    <span>{ml}ml</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Meals */}
          <div className="flex flex-col gap-4">
            {mealGroups.map(({ type, entries }) => {
              const mealNutrition = sumNutrition(entries)
              return (
                <div key={type} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MEAL_ICONS[type]}</span>
                      <h3 className="text-base font-bold text-text-primary">{MEAL_LABELS[type]}</h3>
                      <span className="badge badge-brand text-[10px]">{entries.length}</span>
                    </div>
                    <button onClick={() => { setSelectedMeal(type); setShowAddFood(true); }}
                      className="text-xs text-purple-600 font-semibold hover:underline">
                      + Add
                    </button>
                  </div>
                  {entries.length > 0 ? (
                    <>
                      <div className="flex flex-col gap-1 mb-3">
                        {entries.map(e => {
                          const macros = scaleMacros(e.foodItem, e.grams)
                          return (
                            <div key={e.id} className="meal-row">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-text-primary">
                                  {e.foodItem.name} {e.foodItem.brand && <span className="text-xs text-text-muted">({e.foodItem.brand})</span>}
                                </p>
                                <p className="text-xs text-text-secondary">{e.grams}g · {macros.calories} cal</p>
                              </div>
                              <button onClick={() => handleDeleteMeal(e.id)}
                                className="text-text-muted hover:text-danger transition-colors">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-xs font-semibold text-text-secondary">Totals</span>
                        <div className="flex gap-4 text-xs">
                          <span className="font-bold text-text-primary">{mealNutrition.calories} cal</span>
                          <span className="text-text-secondary">P: {Math.round(mealNutrition.protein)}g</span>
                          <span className="text-text-secondary">C: {Math.round(mealNutrition.carbs)}g</span>
                          <span className="text-text-secondary">F: {Math.round(mealNutrition.fat)}g</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-text-secondary text-center py-4">No food logged for this meal</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Water log */}
          {water.length > 0 && (
            <div className="card p-5 mt-5">
              <h3 className="text-base font-bold text-text-primary mb-3">Water Log</h3>
              <div className="flex flex-wrap gap-2">
                {water.map(w => (
                  <div key={w.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface2 border border-border">
                    <span className="text-sm">💧</span>
                    <span className="text-sm font-semibold text-text-primary">{w.amount}ml</span>
                    <button onClick={() => handleDeleteWater(w.id)}
                      className="text-text-muted hover:text-danger transition-colors ml-1">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          uid={uid}
          date={date}
          meal={selectedMeal}
          onClose={() => setShowAddFood(false)}
          onAdded={load}
        />
      )}
    </div>
  )
}

// ── Add Food Modal ────────────────────────────────────────────────────────────
function AddFoodModal({
  uid, date, meal, onClose, onAdded,
}: {
  uid: string; date: string; meal: MealType; onClose: () => void; onAdded: () => void;
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState('100')
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const foods = await searchFood(query)
    setResults(foods)
    setSearching(false)
  }

  async function handleAdd() {
    if (!selected || !grams) return
    setAdding(true)
    await logMeal(uid, selected, Number(grams), meal, date)
    onAdded()
    onClose()
  }

  const previewMacros = selected ? scaleMacros(selected, Number(grams) || 100) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="card p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-text-primary">Add Food to {MEAL_LABELS[meal]}</h2>
            <button onClick={onClose} aria-label="Close food search" className="h-8 w-8 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-secondary transition-colors">
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          {!selected ? (
            <>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  className="input flex-1" placeholder="Search food (e.g. chicken breast, idli, banana)" />
                <button type="submit" disabled={searching} className="btn-purple px-5">
                  {searching ? <LoadingSpinner size="sm" /> : '🔍'}
                </button>
              </form>

              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {results.map(f => (
                  <button key={f.fdcId} onClick={() => {
                      setSelected(f)
                      // Pre-fill with typical serving size if defined, else 100g
                      setGrams(String(f.servingSize ?? 100))
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{f.name}</p>
                      {f.brand && <p className="text-xs text-text-muted">{f.brand}</p>}
                      <p className="text-xs text-text-secondary mt-1">
                        {f.calories} cal · P: {f.protein}g C: {f.carbs}g F: {f.fat}g
                        {f.servingUnit && <span className="ml-1 text-text-muted">· per 100g</span>}
                      </p>
                    </div>
                    <span className="text-purple-600 text-xl" aria-hidden="true">→</span>
                  </button>
                ))}
                {results.length === 0 && !searching && (
                  <p className="text-xs text-text-secondary text-center py-8">Search to find foods</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="card-purple p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary mb-1">{selected.name}</p>
                    {selected.brand && <p className="text-xs text-text-muted mb-2">{selected.brand}</p>}
                    <p className="text-xs text-text-secondary">Per 100g: {selected.calories} cal</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs text-text-secondary hover:text-text-primary">
                    Change
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Serving Size (grams)
                </label>
                {selected.servingSize && selected.servingUnit && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-text-secondary">
                      Typical serving: <strong>{selected.servingUnit}</strong> ≈ {selected.servingSize}g
                    </span>
                    <button
                      type="button"
                      onClick={() => setGrams(String(selected.servingSize))}
                      className="text-xs font-semibold text-purple-600 border border-purple-300 rounded-lg px-2 py-0.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      Use
                    </button>
                  </div>
                )}
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="input"
                  min={1}
                  step={1}
                  aria-label="Serving size in grams"
                />
              </div>

              {previewMacros && (
                <div className="card-yellow p-4 mb-5">
                  <p className="text-xs font-semibold text-text-secondary mb-3">Nutrition for {grams}g</p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xs text-text-secondary">Calories</p>
                      <p className="text-lg font-bold text-text-primary">{previewMacros.calories}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Protein</p>
                      <p className="text-lg font-bold text-text-primary">{Math.round(previewMacros.protein)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Carbs</p>
                      <p className="text-lg font-bold text-text-primary">{Math.round(previewMacros.carbs)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Fat</p>
                      <p className="text-lg font-bold text-text-primary">{Math.round(previewMacros.fat)}g</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-ghost flex-1">Back</button>
                <button onClick={handleAdd} disabled={adding} className="btn-purple flex-1">
                  {adding && <LoadingSpinner size="sm" />}
                  Add to {MEAL_LABELS[meal]}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
