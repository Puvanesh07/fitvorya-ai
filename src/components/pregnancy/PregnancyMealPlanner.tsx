// ── Pregnancy Meal Planner — real food data + mobile-first weekly UI ──────────
import { useState, useRef, useEffect } from 'react'
import type { DietType } from '../../types/pregnancy'
import type { MealSlotPlan } from '../../types/food'
import { generatePregnancyPlan, type PregnancyDayPlan } from '../../services/mealPlanEngine'

interface Props {
  week:     number
  dietType: DietType
  tamilPref: boolean
}

type PlanDays = 1 | 7
type Style    = 'tamil' | 'global' | 'mixed'

const DIET_OPTIONS: { value: DietType; label: string; emoji: string }[] = [
  { value: 'vegetarian',     label: 'Vegetarian', emoji: '🥬' },
  { value: 'eggetarian',     label: 'Eggetarian', emoji: '🥚' },
  { value: 'non_vegetarian', label: 'Non-Veg',    emoji: '🍗' },
  { value: 'vegan',          label: 'Vegan',       emoji: '🌱' },
]

// ── Slot meta ─────────────────────────────────────────────────────────────────
const SLOT_META = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.22)'  },
  snack:     { emoji: '🍎', label: 'Snack',     color: 'rgb(167 139 250)', bg: 'rgb(139 92 246 / 0.08)', border: 'rgb(139 92 246 / 0.22)' },
  lunch:     { emoji: '☀️', label: 'Lunch',     color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.22)'  },
  dinner:    { emoji: '🌙', label: 'Dinner',    color: 'rgb(125 211 252)', bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.22)' },
} as const

const ACCENT = 'rgb(139 92 246)'

// ── Macro bar ─────────────────────────────────────────────────────────────────
function MacroBar({ cal, protein, carbs, fat }: { cal: number; protein: number; carbs: number; fat: number }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-black" style={{ color: ACCENT }}>{cal} kcal</span>
      <span className="text-[10px] text-text-muted">·</span>
      <span className="text-[10px] text-emerald-400">P {protein}g</span>
      <span className="text-[10px] text-yellow-400">C {carbs}g</span>
      <span className="text-[10px] text-orange-400">F {fat}g</span>
    </div>
  )
}

// ── Meal slot card ────────────────────────────────────────────────────────────
function MealCard({ slot }: { slot: MealSlotPlan & { _key: 'breakfast' | 'snack' | 'lunch' | 'dinner' } }) {
  const [open, setOpen] = useState(false)
  const meta = SLOT_META[slot._key]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
      {/* Header row */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-xl flex-shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: meta.color, opacity: 0.8 }}>
            {meta.label}
          </p>
          <p className="font-black text-text-primary text-sm leading-tight truncate">{slot.name}</p>
          <MacroBar cal={slot.totalCalories} protein={slot.totalProtein} carbs={slot.totalCarbs} fat={slot.totalFat} />
        </div>
        <span className="text-text-muted text-xs flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 animate-fade-in"
          style={{ borderTop: `1px solid ${meta.border}` }}>

          {/* Food items */}
          <div className="flex flex-col gap-1.5 pt-3">
            {slot.foods.map(({ food, grams }, i) => {
              const cal = Math.round(food.calories * grams / 100)
              const p   = Math.round(food.protein  * grams / 100 * 10) / 10
              return (
                <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgb(255 255 255 / 0.05)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{food.name}</p>
                    <p className="text-[10px] text-text-muted">{grams}g · {food.servingUnit ?? `${grams}g`}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: meta.color }}>{cal} kcal</p>
                    <p className="text-[10px] text-text-muted">P {p}g</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Nutrient badges */}
          <div className="flex flex-wrap gap-1">
            {slot.nutrients.map(n => (
              <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: `${meta.color}18`, color: meta.color }}>
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Day selector (horizontal scroll) ─────────────────────────────────────────
function DaySelector({
  days,
  activeDay,
  onSelect,
}: {
  days: PregnancyDayPlan[]
  activeDay: number
  onSelect: (i: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll active day into view
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const btn = el.children[activeDay] as HTMLElement | undefined
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeDay])

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {days.map((d, i) => {
        const isActive = i === activeDay
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all"
            style={isActive ? {
              background:   'linear-gradient(135deg, rgb(139 92 246), rgb(244 114 182))',
              color:        'white',
              boxShadow:    '0 2px 12px rgb(139 92 246 / 0.45)',
              minWidth:     52,
            } : {
              background:   'rgb(255 255 255 / 0.05)',
              border:       '1px solid rgb(255 255 255 / 0.08)',
              color:        'rgb(var(--text-secondary))',
              minWidth:     52,
            }}
          >
            <span className="text-[10px] font-bold leading-none">{d.dayLabel.slice(0, 3)}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-white/80 mt-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Daily summary strip ───────────────────────────────────────────────────────
function DaySummary({ day }: { day: PregnancyDayPlan }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: 'Total Calories', value: `${day.totalCalories}`, unit: 'kcal', color: ACCENT },
        { label: 'Water Goal',     value: `${day.waterLiters}L`,  unit: `~${Math.round(day.waterLiters * 4)} glasses`, color: 'rgb(56 189 248)' },
        { label: 'Protein',        value: `${Math.round(day.breakfast.totalProtein + day.snack.totalProtein + day.lunch.totalProtein + day.dinner.totalProtein)}`, unit: 'g total', color: 'rgb(52 211 153)' },
        { label: 'Fibre',          value: `${Math.round((day.breakfast.totalFiber + day.snack.totalFiber + day.lunch.totalFiber + day.dinner.totalFiber) * 10) / 10}`, unit: 'g total', color: 'rgb(251 191 36)' },
      ].map(m => (
        <div key={m.label} className="flex flex-col p-3 rounded-xl"
          style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
          <p className="text-xs font-black" style={{ color: m.color }}>{m.value}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{m.unit}</p>
          <p className="text-[9px] text-text-muted mt-0.5 opacity-70">{m.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PregnancyMealPlanner({ week, dietType, tamilPref }: Props) {
  const [plan,        setPlan]        = useState<PregnancyDayPlan[] | null>(null)
  const [planDays,    setPlanDays]    = useState<PlanDays>(7)
  const [style,       setStyle]       = useState<Style>(tamilPref ? 'tamil' : 'mixed')
  // Multi-select: start with the profile's diet type pre-selected
  const [activeDiets, setActiveDiets] = useState<DietType[]>([dietType])
  const [activeDay,   setActiveDay]   = useState(0)
  const [generated,   setGenerated]   = useState(false)

  function toggleDiet(d: DietType) {
    setActiveDiets(prev =>
      prev.includes(d)
        ? prev.length > 1 ? prev.filter(x => x !== d) : prev   // keep at least one
        : [...prev, d],
    )
  }

  function generate() {
    const diet = activeDiets.length === 1 ? activeDiets[0] : activeDiets
    const p = generatePregnancyPlan({ week, diet, style, days: planDays })
    setPlan(p)
    setActiveDay(0)
    setGenerated(true)
  }

  const currentDay = plan?.[activeDay]

  return (
    <div className="flex flex-col gap-4">

      {/* Settings card */}
      <div className="g-card p-4 flex flex-col gap-4">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">
          📅 Personalise Your Meal Plan
        </h3>

        {/* Duration */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Plan duration</p>
          <div className="flex gap-2">
            {([1, 7] as PlanDays[]).map(d => (
              <button key={d} type="button" onClick={() => setPlanDays(d)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={planDays === d ? {
                  background: 'linear-gradient(135deg, rgb(139 92 246), rgb(244 114 182))',
                  color: 'white', border: 'none', boxShadow: '0 2px 12px rgb(139 92 246 / 0.4)',
                } : {
                  background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.08)',
                  color: 'rgb(var(--text-secondary))',
                }}>
                {d === 1 ? '1 Day' : '7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Food style */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Food style</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'tamil',  label: 'Tamil',  emoji: '🍚' },
              { value: 'global', label: 'Global', emoji: '🌍' },
              { value: 'mixed',  label: 'Mixed',  emoji: '✨' },
            ] as { value: Style; label: string; emoji: string }[]).map(p => (
              <button key={p.value} type="button" onClick={() => setStyle(p.value)}
                className="g-select-btn flex-col items-center justify-center gap-1 py-2.5"
                style={style === p.value ? {
                  background: 'rgb(139 92 246 / 0.18)', borderColor: 'rgb(139 92 246 / 0.45)', color: 'rgb(196 181 253)',
                } : {}}>
                <span className="text-lg">{p.emoji}</span>
                <span className="text-[11px] font-bold">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diet type — multi-select */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
            Diet type
            <span className="ml-2 normal-case font-normal opacity-70">(select all that apply)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map(d => {
              const active = activeDiets.includes(d.value)
              return (
                <button key={d.value} type="button" onClick={() => toggleDiet(d.value)}
                  className="g-select-btn gap-2 relative"
                  style={active ? {
                    background: 'rgb(139 92 246 / 0.18)', borderColor: 'rgb(139 92 246 / 0.45)', color: 'rgb(196 181 253)',
                  } : {}}>
                  {/* Checkbox indicator */}
                  <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                    style={active ? {
                      background: 'rgb(139 92 246)', color: 'white',
                    } : {
                      background: 'rgb(255 255 255 / 0.08)', border: '1px solid rgb(255 255 255 / 0.2)', color: 'transparent',
                    }}>
                    {active ? '✓' : ''}
                  </span>
                  <span>{d.emoji}</span>
                  <span className="text-xs font-bold">{d.label}</span>
                </button>
              )
            })}
          </div>
          {activeDiets.length > 1 && (
            <p className="text-[10px] text-purple-300/70 mt-1.5 px-0.5">
              ✓ Mixed plan: includes {activeDiets.map(d => d.replace('_', '-')).join(' + ')} meals
            </p>
          )}
        </div>

        <button type="button" onClick={generate} className="g-btn g-btn-primary w-full py-3">
          ✨ {generated ? 'Regenerate Meal Plan' : 'Generate My Meal Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ <strong>General meal ideas only.</strong> All nutrition values are calculated from a real food database.
        Consult your doctor or dietitian for personalised advice.
      </div>

      {/* Generated plan */}
      {plan && currentDay && (
        <div className="flex flex-col gap-3 animate-slide-up">

          {/* Week header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-text-primary text-sm">
                {plan.length === 1 ? "Today's Meal Plan" : `${plan.length}-Day Meal Plan`}
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Week {week} · {activeDiets.map(d => d.replace('_', '-')).join(' + ')} · {style}
              </p>
            </div>
            <span className="text-xl">🍽️</span>
          </div>

          {/* Day selector — horizontal scroll */}
          {plan.length > 1 && (
            <DaySelector days={plan} activeDay={activeDay} onSelect={setActiveDay} />
          )}

          {/* Day label */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-text-secondary">
              {plan.length > 1 ? currentDay.dayLabel : 'Today'}
            </p>
            <p className="text-[10px] text-text-muted">{currentDay.totalCalories} kcal total</p>
          </div>

          {/* Nutrition summary */}
          <DaySummary day={currentDay} />

          {/* Meal slots */}
          <div className="flex flex-col gap-2.5">
            {(
              [
                { ...currentDay.breakfast, _key: 'breakfast' as const },
                { ...currentDay.snack,     _key: 'snack'     as const },
                { ...currentDay.lunch,     _key: 'lunch'     as const },
                { ...currentDay.dinner,    _key: 'dinner'    as const },
              ] as (MealSlotPlan & { _key: 'breakfast' | 'snack' | 'lunch' | 'dinner' })[]
            ).map(slot => (
              <MealCard key={slot._key} slot={slot} />
            ))}
          </div>

          {/* Water reminder */}
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: 'rgb(56 189 248 / 0.08)', border: '1px solid rgb(56 189 248 / 0.2)' }}>
            <span className="text-xl">💧</span>
            <div>
              <p className="text-xs font-bold text-sky-300">
                Drink {currentDay.waterLiters}L water today
              </p>
              <p className="text-[11px] text-sky-400/70">
                ~{Math.round(currentDay.waterLiters * 4)} glasses · coconut water counts!
              </p>
            </div>
          </div>

          {/* Full week overview accordion */}
          {plan.length > 1 && (
            <details className="g-card p-3">
              <summary className="cursor-pointer text-xs font-bold text-text-secondary flex items-center gap-2 select-none list-none">
                <span>📋</span> Full week overview
                <span className="ml-auto text-[10px] text-text-muted">tap to expand</span>
              </summary>
              <div className="mt-3 flex flex-col gap-2 pt-3"
                style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
                {plan.map((day, i) => (
                  <button key={i} type="button"
                    onClick={() => setActiveDay(i)}
                    className="w-full pb-2 last:pb-0 text-left transition-all"
                    style={{ borderBottom: '1px solid rgb(255 255 255 / 0.05)' }}>
                    <p className="text-[10px] font-black mb-1"
                      style={{ color: i === activeDay ? 'rgb(196 181 253)' : 'rgb(var(--text-primary))' }}>
                      {day.dayLabel} · {day.totalCalories} kcal
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      {[
                        { emoji: '🌅', name: day.breakfast.name },
                        { emoji: '☀️', name: day.lunch.name     },
                        { emoji: '🍎', name: day.snack.name     },
                        { emoji: '🌙', name: day.dinner.name    },
                      ].map((m, j) => (
                        <div key={j} className="flex gap-1 items-start">
                          <span className="text-[10px]">{m.emoji}</span>
                          <p className="text-[10px] text-text-muted leading-tight truncate">{m.name}</p>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {!generated && (
        <div className="g-card p-8 text-center flex flex-col items-center gap-2">
          <p className="text-4xl">🍽️</p>
          <h3 className="font-black text-text-primary text-sm">Ready to generate your plan</h3>
          <p className="text-xs text-text-muted">
            All meals use real nutritional data — no dummy values.
          </p>
        </div>
      )}
    </div>
  )
}
