import { useEffect, useState, useRef, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import PageWrapper from '../components/PageWrapper'
import LoadingSpinner from '../components/LoadingSpinner'
import { computeMetrics } from '../utils/calculations'
import {
  searchFood, logMeal, fetchMealsForDate, removeMeal,
  logWater, fetchWaterForDate, removeWater, FALLBACK_FOODS,
  fetchMealsForRange,
} from '../services/nutritionService'
import type { FoodItem, MealEntry, MealType, WaterEntry } from '../types/nutrition'
import { MEAL_LABELS, MEAL_ICONS, scaleMacros, sumNutrition, sumWater } from '../types/nutrition'
import { todayISO, formatDate } from '../utils/format'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'

// ── Date helpers ──────────────────────────────────────────────────────────────
function getPast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

// ── Macro donut chart ─────────────────────────────────────────────────────────
const MACRO_COLORS = {
  protein: '#0F766E',
  carbs:   '#FB923C',
  fat:     '#F59E0B',
}

function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-text-secondary">No food logged yet</p>
      </div>
    )
  }
  const data = [
    { name: 'Protein', value: protein, color: MACRO_COLORS.protein },
    { name: 'Carbs',   value: carbs,   color: MACRO_COLORS.carbs },
    { name: 'Fat',     value: fat,     color: MACRO_COLORS.fat },
  ]
  return (
    <div className="flex items-center gap-6">
      <PieChart width={110} height={110}>
        <Pie data={data} cx={50} cy={50} innerRadius={32} outerRadius={50}
          paddingAngle={3} dataKey="value" stroke="none">
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
      </PieChart>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-xs text-text-secondary w-12">{d.name}</span>
            <span className="text-xs font-bold text-text-primary">{Math.round(d.value)}g</span>
            <span className="text-xs text-text-muted">({Math.round((d.value * 4 / (total * 4 || 1)) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const over = current > target
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className={`font-semibold ${over ? 'text-danger' : 'text-text-primary'}`}>
          {Math.round(current)}<span className="text-text-muted font-normal">/{target}g</span>
        </span>
      </div>
      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? 'rgb(220 38 38)' : color }}
        />
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-primary font-display">{title}</h2>
            <button onClick={onClose}
              className="h-7 w-7 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-secondary transition-colors">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Water tracker ─────────────────────────────────────────────────────────────
const WATER_OPTIONS = [
  { label: '150ml', amount: 150 },
  { label: '250ml', amount: 250 },
  { label: '350ml', amount: 350 },
  { label: '500ml', amount: 500 },
]

// ── Food search modal ──────────────────────────────────────────────────────────
function FoodSearchModal({
  meal, date, uid, onClose, onLogged,
}: {
  meal: MealType; date: string; uid: string;
  onClose: () => void; onLogged: () => void;
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>(FALLBACK_FOODS.slice(0, 8))
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState('100')
  const [logging, setLogging] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(val: string) {
    setQuery(val)
    if (debounce.current) clearTimeout(debounce.current)
    if (!val.trim()) { setResults(FALLBACK_FOODS.slice(0, 8)); return }
    debounce.current = setTimeout(async () => {
      setSearching(true)
      const r = await searchFood(val)
      setResults(r)
      setSearching(false)
    }, 500)
  }

  async function handleLog(e: FormEvent) {
    e.preventDefault()
    if (!selected || !grams || Number(grams) <= 0) return
    setLogging(true)
    await logMeal(uid, selected, Number(grams), meal, date)
    onLogged()
    onClose()
  }

  const preview = selected ? scaleMacros(selected, Number(grams) || 100) : null

  return (
    <Modal title={`${MEAL_ICONS[meal]} Add to ${MEAL_LABELS[meal]}`} onClose={onClose}>
      {!selected ? (
        <>
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="input pr-10"
              placeholder="Search food (e.g. chicken breast)…"
              autoFocus
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {results.length === 0 && !searching && (
              <p className="text-sm text-text-secondary text-center py-8">No results found.</p>
            )}
            {results.map((f) => (
              <button
                key={f.fdcId}
                onClick={() => setSelected(f)}
                className="text-left px-3 py-3 rounded-xl hover:bg-surface2 transition-colors border border-transparent hover:border-border"
              >
                <p className="text-sm font-semibold text-text-primary leading-snug">{f.name}</p>
                {f.brand && <p className="text-xs text-text-muted">{f.brand}</p>}
                <p className="text-xs text-text-secondary mt-0.5">
                  <span className="text-teal-700 font-semibold">{f.calories} kcal</span>
                  {' · '}P {f.protein}g · C {f.carbs}g · F {f.fat}g
                  <span className="text-text-muted"> per 100g</span>
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <form onSubmit={handleLog} className="flex flex-col gap-4">
          <div className="card-flat card p-3 rounded-xl">
            <p className="font-semibold text-text-primary text-sm">{selected.name}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {selected.calories} kcal · P {selected.protein}g · C {selected.carbs}g · F {selected.fat}g per 100g
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Amount (grams)</label>
            <div className="relative">
              <input
                type="number" min={1} max={2000} step={1}
                value={grams} onChange={(e) => setGrams(e.target.value)}
                className="input pr-10" required autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-medium">g</span>
            </div>
            {/* Quick gram buttons */}
            <div className="flex gap-2 mt-2">
              {[50, 100, 150, 200].map((g) => (
                <button key={g} type="button" onClick={() => setGrams(String(g))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    grams === String(g) ? 'border-teal-700 bg-teal-50 text-teal-700' : 'border-border text-text-secondary hover:border-teal-700/40'
                  }`}>{g}g</button>
              ))}
            </div>
          </div>

          {preview && (
            <div className="rounded-xl bg-teal-50 dark:bg-teal-50/10 border border-teal-700/20 p-3 grid grid-cols-4 gap-2 text-center animate-fade-in">
              {[
                { l: 'Calories', v: `${preview.calories}`, u: 'kcal', c: 'text-teal-700' },
                { l: 'Protein',  v: `${preview.protein}`,  u: 'g',    c: 'text-teal-700' },
                { l: 'Carbs',    v: `${preview.carbs}`,    u: 'g',    c: 'text-coral-500' },
                { l: 'Fat',      v: `${preview.fat}`,      u: 'g',    c: 'text-warning' },
              ].map((m) => (
                <div key={m.l}>
                  <p className={`text-base font-bold stat-number ${m.c}`}>{m.v}<span className="text-[10px] font-normal text-text-muted ml-0.5">{m.u}</span></p>
                  <p className="text-[10px] text-text-secondary">{m.l}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={() => setSelected(null)} className="btn-ghost flex-1 text-sm">← Back</button>
            <button type="submit" disabled={logging} className="btn-primary flex-1 text-sm">
              {logging && <LoadingSpinner size="sm" />}
              Add to {MEAL_LABELS[meal]}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Nutrition() {
  const { profile } = useAuth()
  const uid = profile?.uid ?? ''
  const [date, setDate] = useState(todayISO())
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [water, setWater] = useState<WaterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [trendData, setTrendData] = useState<{ date: string; calories: number }[]>([])
  const [trendLoading, setTrendLoading] = useState(true)

  async function loadDay() {
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

  async function loadTrend() {
    if (!uid) return
    setTrendLoading(true)
    const days = getPast7Days()
    const entries = await fetchMealsForRange(uid, days[0], days[6])
    const map = days.map((d) => {
      const dayEntries = entries.filter((e) => e.date === d)
      const cal = dayEntries.reduce((s, e) => s + scaleMacros(e.foodItem, e.grams).calories, 0)
      return { date: formatDate(d), calories: cal }
    })
    setTrendData(map)
    setTrendLoading(false)
  }

  useEffect(() => { loadDay() }, [uid, date])
  useEffect(() => { loadTrend() }, [uid])

  const totals = sumNutrition(meals)
  const totalWater = sumWater(water)
  const waterGoal = 2500 // ml
  const waterPct = Math.min(100, Math.round((totalWater / waterGoal) * 100))

  const calorieTarget = profile ? computeMetrics(profile).targetCalories : 2000
  const proteinTarget = profile ? Math.round(1.6 * profile.weight) : 120
  const carbTarget    = profile ? Math.round(calorieTarget * 0.45 / 4) : 250
  const fatTarget     = profile ? Math.round(calorieTarget * 0.25 / 9) : 65

  async function handleDeleteMeal(id: string) {
    await removeMeal(uid, id)
    loadDay()
  }

  async function handleAddWater(amount: number) {
    await logWater(uid, amount, date)
    loadDay()
  }

  async function handleDeleteWater(id: string) {
    await removeWater(uid, id)
    loadDay()
  }

  const isToday = date === todayISO()

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary">
            Nutrition <span className="gradient-text-coral">Log</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Track meals, macros, and hydration.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0]) }}
            className="btn-ghost py-2 px-3 text-lg" aria-label="Previous day">‹</button>
          <input type="date" value={date} max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto text-sm text-center py-2 px-3" />
          <button
            onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); if (d.toISOString().split('T')[0] <= todayISO()) setDate(d.toISOString().split('T')[0]) }}
            disabled={isToday}
            className="btn-ghost py-2 px-3 text-lg disabled:opacity-30" aria-label="Next day">›</button>
        </div>
      </div>

      {/* Calorie summary + macros */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Calorie ring card */}
        <div className="card p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '75ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Calories</p>
              <p className="stat-number text-3xl text-teal-700 mt-1">{totals.calories.toLocaleString()}</p>
              <p className="text-xs text-text-secondary mt-0.5">of {calorieTarget.toLocaleString()} kcal goal</p>
            </div>
            {/* SVG ring */}
            <svg width="80" height="80" className="-rotate-90">
              <circle cx="40" cy="40" r="32" className="progress-ring-track" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="32"
                className="progress-ring-fill"
                strokeWidth="7"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(1, totals.calories / calorieTarget))}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border">
            {[
              { l: 'Remaining', v: Math.max(0, calorieTarget - totals.calories), u: 'kcal', c: 'text-teal-700' },
              { l: 'Protein',   v: `${Math.round(totals.protein)}g`, u: '',       c: 'text-teal-700' },
              { l: 'Logged',    v: meals.length, u: 'items',                       c: 'text-text-primary' },
            ].map((s) => (
              <div key={s.l}>
                <p className={`text-sm font-bold ${s.c}`}>{s.v}<span className="text-xs font-normal text-text-muted ml-0.5">{s.u}</span></p>
                <p className="text-[10px] text-text-secondary">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Macro breakdown */}
        <div className="card p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-4">Macros</p>
          {loading ? (
            <div className="flex justify-center py-6"><LoadingSpinner /></div>
          ) : (
            <>
              <MacroDonut protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
              <div className="flex flex-col gap-2 mt-4">
                <MacroBar label="Protein" current={totals.protein} target={proteinTarget} color={MACRO_COLORS.protein} />
                <MacroBar label="Carbs"   current={totals.carbs}   target={carbTarget}    color={MACRO_COLORS.carbs} />
                <MacroBar label="Fat"     current={totals.fat}     target={fatTarget}     color={MACRO_COLORS.fat} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Water tracker */}
      <div className="card p-5 mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '225ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <div>
              <p className="font-bold text-text-primary font-display">Hydration</p>
              <p className="text-xs text-text-secondary">{(totalWater / 1000).toFixed(2)}L of {waterGoal / 1000}L goal</p>
            </div>
          </div>
          <span className={`badge ${waterPct >= 100 ? 'badge-teal' : 'badge-coral'}`}>
            {waterPct}%
          </span>
        </div>

        {/* Water progress bar */}
        <div className="h-3 bg-surface2 rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-700 bg-blue-500"
            style={{ width: `${waterPct}%` }} />
        </div>

        {/* Quick-add buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {WATER_OPTIONS.map((w) => (
            <button key={w.label} onClick={() => handleAddWater(w.amount)} className="water-btn">
              <span className="text-xl">💧</span>
              {w.label}
            </button>
          ))}
        </div>

        {/* Water log chips */}
        {water.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {water.map((e) => (
              <div key={e.id} className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                💧 {e.amount}ml
                <button onClick={() => handleDeleteWater(e.id)} className="ml-1 hover:text-danger transition-colors" aria-label="Remove">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal sections */}
      {(Object.keys(MEAL_LABELS) as MealType[]).map((mealType, mi) => {
        const mealEntries = meals.filter((e) => e.meal === mealType)
        const mealCals = mealEntries.reduce((s, e) => s + scaleMacros(e.foodItem, e.grams).calories, 0)

        return (
          <div key={mealType} className="card mb-4 overflow-hidden animate-fade-up opacity-0"
            style={{ animationFillMode: 'forwards', animationDelay: `${300 + mi * 75}ms` }}>
            {/* Meal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{MEAL_ICONS[mealType]}</span>
                <div>
                  <p className="font-bold text-text-primary font-display">{MEAL_LABELS[mealType]}</p>
                  {mealCals > 0 && (
                    <p className="text-xs text-text-secondary">{mealCals} kcal</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setAddMeal(mealType)}
                className="btn-primary py-1.5 px-3 text-xs"
              >
                + Add food
              </button>
            </div>

            {/* Food entries */}
            {loading ? (
              <div className="flex justify-center py-5"><LoadingSpinner size="sm" /></div>
            ) : mealEntries.length === 0 ? (
              <div className="px-5 py-5 text-center">
                <p className="text-sm text-text-muted">Nothing logged yet.</p>
                <button onClick={() => setAddMeal(mealType)} className="text-xs text-teal-700 font-semibold mt-1 hover:underline">
                  + Add food to {MEAL_LABELS[mealType].toLowerCase()}
                </button>
              </div>
            ) : (
              <div>
                {mealEntries.map((entry) => {
                  const m = scaleMacros(entry.foodItem, entry.grams)
                  return (
                    <div key={entry.id} className="meal-row group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{entry.foodItem.name}</p>
                        <p className="text-xs text-text-secondary">{entry.grams}g</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex gap-3 text-xs text-text-secondary">
                          <span>P <strong className="text-text-primary">{m.protein}g</strong></span>
                          <span>C <strong className="text-text-primary">{m.carbs}g</strong></span>
                          <span>F <strong className="text-text-primary">{m.fat}g</strong></span>
                        </div>
                        <span className="text-sm font-bold text-teal-700 w-16 text-right">{m.calories} kcal</span>
                        <button
                          onClick={() => handleDeleteMeal(entry.id)}
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-danger hover:text-danger transition-all"
                          aria-label="Remove"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
                {/* Meal total */}
                <div className="px-5 py-2.5 bg-surface2 flex justify-between items-center text-xs">
                  <span className="text-text-secondary font-medium">{mealEntries.length} items</span>
                  <span className="font-bold text-teal-700">{mealCals} kcal total</span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* 7-day calorie trend */}
      <div className="card p-5 sm:p-6 mt-2 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '600ms' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-text-primary font-display">7-Day Calorie Trend</h2>
            <p className="text-xs text-text-secondary mt-0.5">Your intake over the last week</p>
          </div>
          {!trendLoading && trendData.some(d => d.calories > 0) && (
            <span className="badge badge-teal">
              avg {Math.round(trendData.reduce((s, d) => s + d.calories, 0) / trendData.filter(d => d.calories > 0).length || 1)} kcal
            </span>
          )}
        </div>

        {trendLoading ? (
          <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="rgb(15 118 110)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(15 118 110)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: '10px', fontSize: '12px' }}
                formatter={(v) => [`${v} kcal`, 'Calories']}
              />
              <Area type="monotone" dataKey="calories" stroke="rgb(15 118 110)" strokeWidth={2.5}
                fill="url(#calGrad)" dot={{ r: 4, fill: 'rgb(15 118 110)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'rgb(251 146 60)' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Food search modal */}
      {addMeal && (
        <FoodSearchModal
          meal={addMeal} date={date} uid={uid}
          onClose={() => setAddMeal(null)}
          onLogged={() => { loadDay(); loadTrend() }}
        />
      )}
    </PageWrapper>
  )
}
