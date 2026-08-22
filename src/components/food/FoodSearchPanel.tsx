// ── Food Search Panel ─────────────────────────────────────────────────────────
// Self-contained panel: Search → Portion selector → Full nutrition detail.
// Used inside the Foods tab of Pregnancy, Baby, and Family sections.
// Supports comprehensive age-based and pregnancy-week-aware safety evaluation.

import { useState, useEffect } from 'react'
import type { UnifiedFood } from '../../types/food'
import FoodSearch, { PortionSelector } from './FoodSearch'
import { scaleMacros } from '../../services/foodService'
import { 
  evaluateBabyFoodSafety, 
  formatBabySafetyForUI, 
  getAgeStage,
  type BabySafetyResult 
} from '../../services/babySafetyService'
import { 
  evaluatePregnancyFoodSafety, 
  formatPregnancySafetyForUI, 
  getTrimester,
  type PregnancySafetyResult 
} from '../../services/pregnancySafetyService'

export type SafetyContext = 'general' | 'pregnancy' | 'baby' | 'family'

export interface FoodSearchPanelProps {
  contextLabel?:   string
  accentColor?:    string
  contextId?:      string
  safetyContext?:  SafetyContext
  /** Pregnancy week — used for trimester-specific guidance */
  pregnancyWeek?:  number
  /** Baby age in months — dynamically evaluates safety */
  babyAgeMonths?:  number
  /** Called with food + grams when user confirms — optional */
  onAdd?: (food: UnifiedFood, grams: number) => void
}

// ── Safety badge for Baby ─────────────────────────────────────────────────────
function BabySafetyBadge({ result }: { result: BabySafetyResult }) {
  const s = formatBabySafetyForUI(result)
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2.5 p-3 rounded-xl"
        style={{ background: s.bgColor, border: `1px solid ${s.borderColor}` }}>
        <span className="text-base font-black flex-shrink-0" style={{ color: s.color }}>{s.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-1" style={{ color: s.color }}>
            {result.level === 'appropriate' ? '✓ Appropriate' : 
             result.level === 'not-appropriate' ? '✗ Not Appropriate' :
             result.level === 'caution' ? '⚠ Requires Preparation' : 'ℹ Information'}
          </p>
          <p className="text-[10px] text-text-muted mb-1">Age: {result.ageGuidance}</p>
          <p className="text-[11px] leading-relaxed text-text-secondary">{result.reason}</p>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(255 255 255 / 0.04)' }}>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Recommendation</p>
        <p className="text-[11px] leading-relaxed text-text-secondary">{result.recommendation}</p>
      </div>

      {/* Preparation notes */}
      {result.preparationNotes && (
        <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(56 189 248 / 0.08)', border: '1px solid rgb(56 189 248 / 0.2)' }}>
          <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider mb-1">Preparation</p>
          <p className="text-[11px] leading-relaxed text-sky-200/90">{result.preparationNotes}</p>
        </div>
      )}

      {/* Medical disclaimer */}
      <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(234 179 8 / 0.06)', border: '1px solid rgb(234 179 8 / 0.15)' }}>
        <p className="text-[10px] leading-relaxed text-yellow-200/70">
          ⚠️ This information is for educational purposes only. Always consult your paediatrician before introducing new foods or if you have concerns about allergies, choking risks, or nutritional needs.
        </p>
      </div>
    </div>
  )
}

// ── Safety badge for Pregnancy ────────────────────────────────────────────────
function PregnancySafetyBadge({ result }: { result: PregnancySafetyResult }) {
  const s = formatPregnancySafetyForUI(result)
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2.5 p-3 rounded-xl"
        style={{ background: s.bgColor, border: `1px solid ${s.borderColor}` }}>
        <span className="text-base font-black flex-shrink-0" style={{ color: s.color }}>{s.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-1" style={{ color: s.color }}>
            {result.level === 'suitable' ? '✓ Suitable' : 
             result.level === 'avoid' ? '✗ Avoid' :
             result.level === 'caution' ? '⚠ Use Caution' : 'ℹ Information'}
          </p>
          <p className="text-[10px] text-text-muted mb-1">{result.trimester}</p>
          <p className="text-[11px] leading-relaxed text-text-secondary">{result.reason}</p>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(255 255 255 / 0.04)' }}>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Guidance</p>
        <p className="text-[11px] leading-relaxed text-text-secondary">{result.recommendation}</p>
      </div>

      {/* Trimester-specific preparation */}
      {result.preparationGuidance && (
        <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(139 92 246 / 0.08)', border: '1px solid rgb(139 92 246 / 0.2)' }}>
          <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">Trimester Note</p>
          <p className="text-[11px] leading-relaxed text-purple-200/90">{result.preparationGuidance}</p>
        </div>
      )}

      {/* Medical disclaimer */}
      <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(234 179 8 / 0.06)', border: '1px solid rgb(234 179 8 / 0.15)' }}>
        <p className="text-[10px] leading-relaxed text-yellow-200/70">
          ⚠️ This information is for educational purposes only. Always consult your healthcare provider or midwife for personalised advice, especially if you have specific health conditions or dietary restrictions.
        </p>
      </div>
    </div>
  )
}

// ── Nutrition macro grid ──────────────────────────────────────────────────────
function NutritionGrid({ food, grams, accentColor }: { food: UnifiedFood; grams: number; accentColor: string }) {
  const m = scaleMacros(food, grams)
  const macros = [
    { label: 'Calories', value: `${m.calories}`,   unit: 'kcal',         color: accentColor },
    { label: 'Protein',  value: `${m.protein}g`,   unit: 'builds muscle',color: 'rgb(52 211 153)'  },
    { label: 'Carbs',    value: `${m.carbs}g`,     unit: 'energy',       color: 'rgb(251 191 36)'  },
    { label: 'Fat',      value: `${m.fat}g`,       unit: 'healthy fats', color: 'rgb(249 115 22)'  },
    { label: 'Fibre',    value: `${m.fiber}g`,     unit: 'digestion',    color: 'rgb(167 139 250)' },
    { label: 'Per 100g', value: `${food.calories}`,unit: 'kcal base',    color: 'rgb(var(--text-secondary))' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {macros.map(item => (
        <div key={item.label} className="flex flex-col p-3 rounded-xl"
          style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
          <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{item.unit}</p>
          <p className="text-[9px] text-text-muted opacity-70">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FoodSearchPanel({
  contextLabel    = 'Food Search',
  accentColor     = 'rgb(139 92 246)',
  contextId       = 'panel',
  safetyContext   = 'general',
  pregnancyWeek   = 1,
  babyAgeMonths   = 6,
  onAdd,
}: FoodSearchPanelProps) {
  const [selected,  setSelected]  = useState<UnifiedFood | null>(null)
  const [confirmed, setConfirmed] = useState<{ food: UnifiedFood; grams: number } | null>(null)
  const [babySafety, setBabySafety] = useState<BabySafetyResult | null>(null)
  const [pregnancySafety, setPregnancySafety] = useState<PregnancySafetyResult | null>(null)

  // Re-evaluate safety whenever age/week or selected food changes
  useEffect(() => {
    if (!confirmed) {
      setBabySafety(null)
      setPregnancySafety(null)
      return
    }

    if (safetyContext === 'baby') {
      const result = evaluateBabyFoodSafety(confirmed.food, babyAgeMonths)
      setBabySafety(result)
    } else if (safetyContext === 'pregnancy') {
      const result = evaluatePregnancyFoodSafety(confirmed.food, pregnancyWeek)
      setPregnancySafety(result)
    }
  }, [confirmed, safetyContext, babyAgeMonths, pregnancyWeek])

  function handleSelect(food: UnifiedFood) {
    setSelected(food)
    setConfirmed(null)
  }

  function handleConfirm(grams: number) {
    if (!selected) return
    setConfirmed({ food: selected, grams })
    onAdd?.(selected, grams)
  }

  function handleReset() {
    setSelected(null)
    setConfirmed(null)
    setBabySafety(null)
    setPregnancySafety(null)
  }

  // ── Confirmed nutrition detail ─────────────────────────────────────────────
  if (confirmed) {
    const { food, grams } = confirmed

    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Back */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-text-primary">{contextLabel}</p>
          <button type="button" onClick={handleReset}
            className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: `${accentColor}18`, color: accentColor }}>
            ← Search again
          </button>
        </div>

        {/* Food header */}
        <div className="p-4 rounded-2xl"
          style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}28` }}>
          <p className="font-black text-text-primary text-base leading-tight">{food.name}</p>
          {food.brand && <p className="text-xs text-text-muted mt-0.5">{food.brand}</p>}
          <p className="text-xs text-text-muted mt-1">
            {grams}g serving
            {food.servingUnit ? ` · ${food.servingUnit}` : ''}
          </p>
          {food.category && (
            <p className="text-[10px] text-text-muted mt-0.5 capitalize">
              Category: {food.category.replace(/_/g, ' ')}
            </p>
          )}
        </div>

        {/* Nutrition macros */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Nutrition</p>
          <NutritionGrid food={food} grams={grams} accentColor={accentColor} />
        </div>

        {/* Context-specific safety evaluation */}
        {safetyContext === 'baby' && babySafety && (
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Baby Safety · {getAgeStage(babyAgeMonths)}
            </p>
            <BabySafetyBadge result={babySafety} />
          </div>
        )}

        {safetyContext === 'pregnancy' && pregnancySafety && (
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Pregnancy Suitability · {getTrimester(pregnancyWeek)}
            </p>
            <PregnancySafetyBadge result={pregnancySafety} />
          </div>
        )}

        {safetyContext === 'general' && (
          <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(56 189 248 / 0.08)' }}>
            <p className="text-[11px] text-sky-200/90 leading-relaxed">
              Nutrition information provided. For personalised dietary advice, consult a healthcare professional or registered dietitian.
            </p>
          </div>
        )}

        {safetyContext === 'family' && (
          <div className="px-3 py-2 rounded-lg" style={{ background: 'rgb(52 211 153 / 0.08)' }}>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Suitable for family meals. Adjust portions and preparations based on each family member's age and dietary needs.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── Search mode ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-text-primary">{contextLabel}</p>
        {safetyContext === 'baby' && (
          <p className="text-[10px] text-text-muted px-2 py-1 rounded-lg" style={{ background: 'rgb(255 255 255 / 0.04)' }}>
            Age: {getAgeStage(babyAgeMonths)}
          </p>
        )}
        {safetyContext === 'pregnancy' && (
          <p className="text-[10px] text-text-muted px-2 py-1 rounded-lg" style={{ background: 'rgb(255 255 255 / 0.04)' }}>
            Week {pregnancyWeek} · {getTrimester(pregnancyWeek)}
          </p>
        )}
      </div>

      <FoodSearch
        contextId={contextId}
        accentColor={accentColor}
        onSelect={handleSelect}
        maxResults={15}
        autoFocus={false}
      />

      {selected && (
        <div className="flex flex-col gap-3 animate-slide-up">
          <div className="p-3 rounded-xl" style={{ background: 'rgb(255 255 255 / 0.04)' }}>
            <p className="text-sm font-bold text-text-primary">{selected.name}</p>
            {selected.brand && <p className="text-xs text-text-muted mt-0.5">{selected.brand}</p>}
          </div>

          <PortionSelector
            food={selected}
            accentColor={accentColor}
            onConfirm={handleConfirm}
            onBack={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  )
}
