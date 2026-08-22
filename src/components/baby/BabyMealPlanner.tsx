// ── Baby Meal Planner — real food data + mobile-first weekly UI ───────────────
import { useState, useRef, useEffect } from 'react'
import type { AgeStageId } from '../../types/baby'
import type { MealSlotPlan } from '../../types/food'
import { generateBabyPlan, type BabyDayPlan, type BabyDietType, type BabyStage } from '../../services/mealPlanEngine'

interface Props {
  stageId:   AgeStageId
  dietType:  BabyDietType
  tamilPref: boolean
  ageMonths?: number
}

type PlanDays = 1 | 7

const BABY_DIET_OPTIONS: { value: BabyDietType; label: string; emoji: string }[] = [
  { value: 'vegetarian',     label: 'Veg',     emoji: '🥬' },
  { value: 'non_vegetarian', label: 'Non-Veg', emoji: '🍗' },
  { value: 'vegan',          label: 'Vegan',   emoji: '🌱' },
]

const ACCENT_TEAL = 'rgb(32 195 190)'

// ── Slot meta ─────────────────────────────────────────────────────────────────
const SLOT_META = {
  breakfast:    { emoji: '🌅', label: 'Breakfast',     color: 'rgb(234 179 8)',   bg: 'rgb(234 179 8 / 0.08)',  border: 'rgb(234 179 8 / 0.22)'  },
  morningSnack: { emoji: '🍎', label: 'Morning Snack', color: 'rgb(34 197 94)',   bg: 'rgb(34 197 94 / 0.08)',  border: 'rgb(34 197 94 / 0.22)'  },
  lunch:        { emoji: '☀️', label: 'Lunch',         color: 'rgb(56 189 248)',  bg: 'rgb(56 189 248 / 0.08)', border: 'rgb(56 189 248 / 0.22)' },
  eveningSnack: { emoji: '🌆', label: 'Evening Snack', color: 'rgb(167 139 250)', bg: 'rgb(167 139 250 / 0.08)',border: 'rgb(167 139 250 / 0.22)'},
  dinner:       { emoji: '🌙', label: 'Dinner',        color: 'rgb(129 140 248)', bg: 'rgb(129 140 248 / 0.08)',border: 'rgb(129 140 248 / 0.22)'},
} as const

type SlotKey = keyof typeof SLOT_META

// ── Meal card ─────────────────────────────────────────────────────────────────
function MealCard({ slot, slotKey }: { slot: MealSlotPlan; slotKey: SlotKey }) {
  const [open, setOpen] = useState(false)
  const meta = SLOT_META[slotKey]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(v => !v)}>
        <span className="text-xl flex-shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: meta.color, opacity: 0.8 }}>{meta.label}</p>
          <p className="font-black text-text-primary text-sm leading-tight truncate">{slot.name}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs font-black" style={{ color: ACCENT_TEAL }}>{slot.totalCalories} kcal</span>
            <span className="text-[10px] text-emerald-400">P {slot.totalProtein}g</span>
            <span className="text-[10px] text-yellow-400">C {slot.totalCarbs}g</span>
          </div>
        </div>
        <span className="text-text-muted text-xs flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 animate-fade-in"
          style={{ borderTop: `1px solid ${meta.border}` }}>
          <div className="flex flex-col gap-1.5 pt-3">
            {slot.foods.map(({ food, grams }, i) => {
              const cal = Math.round(food.calories * grams / 100)
              return (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'rgb(255 255 255 / 0.05)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{food.name}</p>
                    <p className="text-[10px] text-text-muted">{grams}g {food.servingUnit ? `· ${food.servingUnit}` : ''}</p>
                  </div>
                  <p className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: meta.color }}>{cal} kcal</p>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            {slot.nutrients.map(n => (
              <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: `${meta.color}18`, color: meta.color }}>{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Day selector ──────────────────────────────────────────────────────────────
function DaySelector({ days, activeDay, onSelect }: {
  days: BabyDayPlan[]; activeDay: number; onSelect: (i: number) => void
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
              background: 'linear-gradient(135deg, rgb(32 195 190), rgb(56 189 248))',
              color: 'white', boxShadow: '0 2px 12px rgb(32 195 190 / 0.45)', minWidth: 52,
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

// ── Stage guard ───────────────────────────────────────────────────────────────
function MilkOnlyCard() {
  return (
    <div className="g-card p-8 text-center flex flex-col items-center gap-3">
      <span className="text-4xl">🍼</span>
      <h3 className="font-black text-text-primary text-base">Milk is complete nutrition at this stage</h3>
      <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
        For babies under 6 months, breast milk or formula provides all the nutrition needed.
        Meal plans become available when your baby is ready for solids (around 6 months).
      </p>
      <div className="g-disclaimer w-full max-w-sm text-left mt-1">
        ⚠️ Always discuss starting solids with your paediatrician before introducing any food.
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BabyMealPlanner({ stageId, dietType }: Props) {
  const [plan,        setPlan]        = useState<BabyDayPlan[] | null>(null)
  const [planDays,    setPlanDays]    = useState<PlanDays>(7)
  const [activeDiets, setActiveDiets] = useState<BabyDietType[]>([dietType])
  const [activeDay,   setActiveDay]   = useState(0)
  const [generated,   setGenerated]   = useState(false)

  if (stageId === 'months_0_6') return <MilkOnlyCard />

  function toggleDiet(d: BabyDietType) {
    setActiveDiets(prev =>
      prev.includes(d)
        ? prev.length > 1 ? prev.filter(x => x !== d) : prev
        : [...prev, d],
    )
  }

  function generate() {
    const diet = activeDiets.length === 1 ? activeDiets[0] : activeDiets
    const p = generateBabyPlan({ stage: stageId as BabyStage, diet, days: planDays })
    setPlan(p)
    setActiveDay(0)
    setGenerated(true)
  }

  const currentDay = plan?.[activeDay]

  return (
    <div className="flex flex-col gap-4">

      {/* Settings */}
      <div className="g-card p-4 flex flex-col gap-4">
        <h3 className="text-sm font-black text-text-primary flex items-center gap-2">📅 Plan Settings</h3>

        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Duration</p>          <div className="flex gap-2">
            {([1, 7] as PlanDays[]).map(d => (
              <button key={d} type="button" onClick={() => setPlanDays(d)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={planDays === d ? {
                  background: 'linear-gradient(135deg, rgb(32 195 190), rgb(56 189 248))',
                  color: 'white', border: 'none', boxShadow: '0 2px 12px rgb(32 195 190 / 0.4)',
                } : {
                  background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.08)',
                  color: 'rgb(var(--text-secondary))',
                }}>
                {d === 1 ? '1 Day' : '7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Diet — multi-select */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
            Diet type
            <span className="ml-2 normal-case font-normal opacity-70">(select all that apply)</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BABY_DIET_OPTIONS.map(d => {
              const active = activeDiets.includes(d.value)
              return (
                <button key={d.value} type="button" onClick={() => toggleDiet(d.value)}
                  className="g-select-btn justify-center gap-1.5"
                  style={active ? {
                    background: 'rgb(32 195 190 / 0.15)', borderColor: 'rgb(32 195 190 / 0.4)', color: 'rgb(94 234 212)',
                  } : {}}>
                  <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-black flex-shrink-0"
                    style={active ? { background: 'rgb(32 195 190)', color: 'white' } : { background: 'rgb(255 255 255 / 0.08)', border: '1px solid rgb(255 255 255 / 0.2)' }}>
                    {active ? '✓' : ''}
                  </span>
                  <span>{d.emoji}</span>
                  <span className="text-[11px] font-bold">{d.label}</span>
                </button>
              )
            })}
          </div>
          {activeDiets.length > 1 && (
            <p className="text-[10px] text-teal-300/70 mt-1.5 px-0.5">
              ✓ Mixed: {activeDiets.map(d => d.replace('_', '-')).join(' + ')}
            </p>
          )}
        </div>

        <button type="button" onClick={generate} className="g-btn g-btn-teal w-full py-3">
          ✨ {generated ? 'Regenerate Plan' : 'Generate Meal Plan'}
        </button>
      </div>

      {/* Safety disclaimer */}
      <div className="g-disclaimer">
        ⚠️ <strong>Always prepare foods at age-appropriate textures.</strong> No honey under 12 months.
        No added salt/sugar for babies. Consult your paediatrician for allergy introduction.
      </div>

      {/* Plan */}
      {plan && currentDay && (
        <div className="flex flex-col gap-3 animate-slide-up">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-text-primary text-sm">
                {plan.length === 1 ? "Today's Meal Plan" : `${plan.length}-Day Baby Plan`}
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5 capitalize">
                {stageId.replace(/_/g, ' ')} · {activeDiets.map(d => d.replace('_', '-')).join(' + ')}
              </p>
            </div>
            <span className="text-xl">🍽️</span>
          </div>

          {plan.length > 1 && (
            <DaySelector days={plan} activeDay={activeDay} onSelect={setActiveDay} />
          )}

          {/* Day header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-text-secondary">
              {plan.length > 1 ? currentDay.dayLabel : 'Today'}
            </p>
            <p className="text-[10px] text-text-muted">{currentDay.totalCalories} kcal solids</p>
          </div>

          {/* Texture badge */}
          <div className="px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgb(32 195 190 / 0.1)', border: '1px solid rgb(32 195 190 / 0.25)' }}>
            <span className="text-sm">🥄</span>
            <p className="text-xs font-bold text-teal-300">{currentDay.texture}</p>
          </div>

          {/* Meal slots */}
          <div className="flex flex-col gap-2.5">
            {(
              [
                ['breakfast',    currentDay.breakfast   ],
                ['morningSnack', currentDay.morningSnack],
                ['lunch',        currentDay.lunch       ],
                ['eveningSnack', currentDay.eveningSnack],
                ['dinner',       currentDay.dinner      ],
              ] as [SlotKey, MealSlotPlan][]
            ).map(([key, slot]) => (
              <MealCard key={key} slot={slot} slotKey={key} />
            ))}
          </div>

          {/* Milk feeds */}
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: 'rgb(56 189 248 / 0.08)', border: '1px solid rgb(56 189 248 / 0.2)' }}>
            <span className="text-xl">🍼</span>
            <div>
              <p className="text-xs font-bold text-sky-300">Milk feeds</p>
              <p className="text-[11px] text-sky-400/80 leading-relaxed">{currentDay.milkFeeds}</p>
            </div>
          </div>

          {currentDay.waterNote && (
            <div className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: 'rgb(32 195 190 / 0.08)', border: '1px solid rgb(32 195 190 / 0.18)' }}>
              <span className="text-xl">💧</span>
              <p className="text-xs text-teal-300">{currentDay.waterNote}</p>
            </div>
          )}

          {/* Week overview */}
          {plan.length > 1 && (
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
                      style={{ color: i === activeDay ? 'rgb(94 234 212)' : 'rgb(var(--text-primary))' }}>
                      {day.dayLabel} · {day.totalCalories} kcal
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {(['breakfast', 'lunch', 'dinner'] as const).map(k => (
                        <div key={k} className="flex gap-1 items-start">
                          <span className="text-[10px]">{SLOT_META[k].emoji}</span>
                          <p className="text-[10px] text-text-muted leading-tight truncate">{day[k].name}</p>
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
          <h3 className="font-black text-text-primary text-sm">Ready to generate</h3>
          <p className="text-xs text-text-muted">Age-appropriate meals with real nutritional data.</p>
        </div>
      )}
    </div>
  )
}
