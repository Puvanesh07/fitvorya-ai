// ── Family Weekly Planner — real food data + mobile-first weekly UI ───────────
import { useState, useRef, useEffect } from 'react'
import type { FamilyMember, CuisinePreference } from '../../types/family'
import type { MealSlotPlan } from '../../types/food'
import {
  generateFamilyPlan,
  regenerateFamilyMeal,
  type FamilyDayPlan,
  type FamilyMealSlot,
  type FamilyMember as EngineMember,
} from '../../services/mealPlanEngine'

interface Props {
  members:           FamilyMember[]
  cuisinePreference: CuisinePreference
}

// ── Slot meta ─────────────────────────────────────────────────────────────────
const SLOT_META = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.22)'  },
  lunch:     { emoji: '☀️', label: 'Lunch',     color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.22)'  },
  snack:     { emoji: '🍎', label: 'Snack',     color: 'rgb(167 139 250)', bg: 'rgb(167 139 250 / 0.08)',border: 'rgb(167 139 250 / 0.22)'},
  dinner:    { emoji: '🌙', label: 'Dinner',    color: 'rgb(56 189 248)',  bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.22)' },
} as const

type SlotKey = keyof typeof SLOT_META

// ── Helpers ───────────────────────────────────────────────────────────────────
function toEngineMembers(members: FamilyMember[]): EngineMember[] {
  return members.map(m => ({
    id:             m.id,
    name:           m.name,
    role:           m.role,
    dietPref:       m.dietPref,
    ageMonths:      m.ageMonths,
    pregnancyWeek:  m.pregnancyWeek,
  }))
}

// ── Food items breakdown ──────────────────────────────────────────────────────
function FoodBreakdown({ slot, color }: { slot: MealSlotPlan; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {slot.foods.map(({ food, grams }, i) => {
        const cal = Math.round(food.calories * grams / 100)
        const p   = Math.round(food.protein  * grams / 100 * 10) / 10
        const c   = Math.round(food.carbs    * grams / 100 * 10) / 10
        return (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgb(255 255 255 / 0.05)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{food.name}</p>
              <p className="text-[10px] text-text-muted">{grams}g{food.servingUnit ? ` · ${food.servingUnit}` : ''}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-xs font-bold" style={{ color }}>{cal} kcal</p>
              <p className="text-[10px] text-text-muted">P{p} C{c}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Family meal card ──────────────────────────────────────────────────────────
function FamilyMealCard({
  mealSlot,
  slotKey,
  onRegen,
}: {
  mealSlot:  FamilyMealSlot
  slotKey:   SlotKey
  onRegen:   () => void
}) {
  const [open,       setOpen]       = useState(false)
  const [showFoods,  setShowFoods]  = useState(false)
  const meta = SLOT_META[slotKey]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => setOpen(v => !v)}>
          <span className="text-xl flex-shrink-0">{meta.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: meta.color, opacity: 0.8 }}>{meta.label}</p>
            <p className="font-black text-text-primary text-sm leading-tight truncate">
              {mealSlot.base.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-black" style={{ color: meta.color }}>{mealSlot.base.totalCalories} kcal</span>
              <span className="text-[10px] text-emerald-400">P {mealSlot.base.totalProtein}g</span>
              <span className="text-[10px] text-yellow-400">C {mealSlot.base.totalCarbs}g</span>
            </div>
          </div>
          <span className="text-text-muted text-xs flex-shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>
        {/* Regen button */}
        <button type="button" onClick={onRegen}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110 active:scale-95"
          style={{ background: `${meta.color}18`, color: meta.color }}
          title="Regenerate this meal">
          🔄
        </button>
      </div>

      {/* Expanded */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 animate-fade-in"
          style={{ borderTop: `1px solid ${meta.border}` }}>

          {/* Nutrient tags */}
          <div className="flex flex-wrap gap-1 pt-3">
            {mealSlot.base.nutrients.map(n => (
              <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: `${meta.color}18`, color: meta.color }}>{n}</span>
            ))}
          </div>

          {/* Food breakdown toggle */}
          <button type="button"
            onClick={() => setShowFoods(v => !v)}
            className="text-[11px] font-semibold text-text-muted hover:text-text-secondary transition-colors text-left flex items-center gap-1">
            🥘 {showFoods ? 'Hide' : 'Show'} food breakdown ({mealSlot.base.foods.length} items)
          </button>

          {showFoods && (
            <FoodBreakdown slot={mealSlot.base} color={meta.color} />
          )}

          {/* Member adaptations */}
          <details>
            <summary className="cursor-pointer text-[11px] font-semibold text-text-muted hover:text-text-secondary transition-colors select-none list-none flex items-center gap-1">
              👨‍👩‍👧 Family adaptations ({mealSlot.adaptations.length} members)
            </summary>
            <div className="mt-2 flex flex-col gap-1.5 pt-2"
              style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
              {mealSlot.adaptations.map(a => (
                <div key={a.memberId} className="flex gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgb(255 255 255 / 0.04)' }}>
                  <span className="text-base flex-shrink-0">{a.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-text-primary">
                      {a.memberName}
                      <span className="font-normal text-text-muted ml-1">— {a.portion}</span>
                    </p>
                    <p className="text-[11px] text-text-muted leading-relaxed">{a.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

// ── Day selector ──────────────────────────────────────────────────────────────
function DaySelector({ days, activeDay, onSelect }: {
  days: FamilyDayPlan[]; activeDay: number; onSelect: (i: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const btn = el.children[activeDay] as HTMLElement | undefined
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeDay])

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
      {days.map((d, i) => {
        const isActive = i === activeDay
        return (
          <button key={i} type="button" onClick={() => onSelect(i)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all"
            style={isActive ? {
              background: 'linear-gradient(135deg, rgb(16 185 129), rgb(52 211 153))',
              color: 'white', boxShadow: '0 2px 12px rgb(16 185 129 / 0.4)', minWidth: 52,
            } : {
              background: 'rgb(255 255 255 / 0.05)', border: '1px solid rgb(255 255 255 / 0.08)',
              color: 'rgb(var(--text-secondary))', minWidth: 52,
            }}>
            <span className="text-[10px] font-bold leading-none">{d.dayLabel.slice(0, 3)}</span>
            {isActive && <span className="w-1 h-1 rounded-full bg-white/80 mt-0.5" />}
          </button>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const CUISINE_LABEL: Record<string, string> = {
  tamil: '🇮🇳 Tamil / Indian', global: '🌍 Global', mixed: '✨ Mixed',
}

export default function FamilyWeeklyPlanner({ members, cuisinePreference }: Props) {
  const [plan,      setPlan]      = useState<FamilyDayPlan[] | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [generated, setGenerated] = useState(false)

  const engineMembers = toEngineMembers(members)

  if (members.length === 0) {
    return (
      <div className="g-card p-10 text-center flex flex-col items-center gap-3">
        <p className="text-4xl">📅</p>
        <p className="font-bold text-text-primary text-sm">Add family members first</p>
        <p className="text-xs text-text-muted">Weekly plan requires at least one family member.</p>
      </div>
    )
  }

  function generatePlan() {
    setPlan(generateFamilyPlan(engineMembers, cuisinePreference, 7))
    setActiveDay(0)
    setGenerated(true)
  }

  function regenDay(dayIdx: number) {
    if (!plan) return
    const slots: (keyof Omit<FamilyDayPlan, 'dayLabel' | 'dayIndex' | 'totalCalories'>)[] = ['breakfast', 'lunch', 'snack', 'dinner']
    const newDay = { ...plan[dayIdx] }
    for (const slot of slots) {
      newDay[slot] = regenerateFamilyMeal(slot, engineMembers, cuisinePreference, [plan[dayIdx][slot].base.name])
    }
    newDay.totalCalories = newDay.breakfast.base.totalCalories + newDay.lunch.base.totalCalories +
      newDay.snack.base.totalCalories + newDay.dinner.base.totalCalories
    setPlan(prev => {
      if (!prev) return prev
      const days = [...prev]; days[dayIdx] = newDay; return days
    })
  }

  function regenMeal(dayIdx: number, slot: SlotKey) {
    if (!plan) return
    const newMeal = regenerateFamilyMeal(slot, engineMembers, cuisinePreference, [plan[dayIdx][slot].base.name])
    setPlan(prev => {
      if (!prev) return prev
      const days = [...prev]
      const day  = { ...days[dayIdx], [slot]: newMeal }
      day.totalCalories = day.breakfast.base.totalCalories + day.lunch.base.totalCalories +
        day.snack.base.totalCalories + day.dinner.base.totalCalories
      days[dayIdx] = day
      return days
    })
  }

  const currentDay = plan?.[activeDay]

  return (
    <div className="flex flex-col gap-4">

      {/* Header card */}
      <div className="g-card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">📅 7-Day Family Meal Plan</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          A full week of real meals adapted for every member — nutrition calculated from actual food data.
        </p>
        <div className="g-card-sm px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Cuisine</span>
          <span className="text-xs font-bold text-text-secondary">{CUISINE_LABEL[cuisinePreference]}</span>
        </div>
        <button type="button" onClick={generatePlan} className="g-btn g-btn-emerald w-full py-3">
          ✨ {generated ? 'Regenerate Full Week' : 'Generate 7-Day Plan'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="g-disclaimer">
        ⚠️ General meal ideas only. Ensure foods are appropriate for each member's age and health needs.
      </div>

      {plan && currentDay && (
        <div className="flex flex-col gap-3 animate-slide-up">

          {/* Day selector */}
          <DaySelector days={plan} activeDay={activeDay} onSelect={setActiveDay} />

          {/* Day header */}
          <div className="flex items-center justify-between">
            <h4 className="font-black text-text-primary text-sm">{currentDay.dayLabel}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted">{currentDay.totalCalories} kcal</span>
              <button type="button" onClick={() => regenDay(activeDay)}
                className="g-btn g-btn-sm gap-1 text-[11px]">
                🔄 Regen day
              </button>
            </div>
          </div>

          {/* Meal slots */}
          <div className="flex flex-col gap-2.5">
            {(['breakfast', 'lunch', 'snack', 'dinner'] as SlotKey[]).map(key => (
              <FamilyMealCard
                key={key}
                mealSlot={currentDay[key]}
                slotKey={key}
                onRegen={() => regenMeal(activeDay, key)}
              />
            ))}
          </div>

          {/* Week overview */}
          <details className="g-card p-3">
            <summary className="cursor-pointer text-xs font-bold text-text-secondary flex items-center gap-2 select-none list-none">
              <span>📋</span> Full week overview
              <span className="ml-auto text-text-muted text-[10px]">tap to expand</span>
            </summary>
            <div className="mt-3 flex flex-col gap-2 pt-3"
              style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
              {plan.map((day, i) => (
                <button key={i} type="button" onClick={() => setActiveDay(i)}
                  className="w-full pb-2 last:pb-0 text-left"
                  style={{ borderBottom: '1px solid rgb(255 255 255 / 0.05)' }}>
                  <p className="text-[10px] font-black mb-1"
                    style={{ color: i === activeDay ? 'rgb(52 211 153)' : 'rgb(var(--text-primary))' }}>
                    {day.dayLabel} · {day.totalCalories} kcal
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {(['breakfast', 'lunch', 'snack', 'dinner'] as SlotKey[]).map(k => (
                      <div key={k} className="flex gap-1 items-start">
                        <span className="text-[10px]">{SLOT_META[k].emoji}</span>
                        <p className="text-[10px] text-text-muted leading-tight truncate">{day[k].base.name}</p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </details>
        </div>
      )}

      {!generated && (
        <div className="g-card p-8 text-center flex flex-col items-center gap-2">
          <p className="text-4xl">📅</p>
          <p className="font-black text-text-primary text-sm">Ready to generate your family plan</p>
          <p className="text-xs text-text-muted">Real nutritional data for every meal, adapted per member.</p>
        </div>
      )}
    </div>
  )
}
