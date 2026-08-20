import { useState } from 'react'
import type { StageGuide, AgeStage } from '../../types/baby'

interface Props {
  guide: StageGuide
  stage: AgeStage
  tamilPref: boolean
}

const STAGE_GRAD: Record<string, string> = {
  months_0_6:  'from-blue-500 to-cyan-500',
  months_6_9:  'from-teal-500 to-green-500',
  months_9_12: 'from-purple-500 to-violet-500',
  years_1_2:   'from-pink-500 to-rose-500',
  years_2_3:   'from-orange-500 to-amber-500',
}

export default function BabyStageGuide({ guide, stage, tamilPref }: Props) {
  const [open, setOpen] = useState<string | null>('overview')
  const toggle = (id: string) => setOpen(p => p === id ? null : id)
  const grad = STAGE_GRAD[stage.id] ?? 'from-teal-500 to-blue-500'

  const isMillkOnly = stage.id === 'months_0_6'

  return (
    <div className="flex flex-col gap-4">

      {/* Stage header */}
      <div className={`rounded-3xl bg-gradient-to-br ${grad} p-5 text-white card-shadow`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
              {stage.label}
            </p>
            <h2 className="text-xl font-black">{guide.title}</h2>
            <p className="text-white/80 text-sm mt-1 leading-relaxed line-clamp-2">
              {guide.overview}
            </p>
          </div>
          <span className="text-5xl flex-shrink-0 select-none">{stage.emoji}</span>
        </div>

        {/* Daily meals badge */}
        {!isMillkOnly && (
          <div className="flex gap-2 mt-4 flex-wrap">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
              {guide.dailyMeals} solid meal{guide.dailyMeals !== 1 ? 's' : ''}/day
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
              {stage.texture.replace(/_/g, ' ')} texture
            </span>
          </div>
        )}
      </div>

      {/* 0–6m special: milk-only info cards */}
      {isMillkOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { emoji: '🍼', title: 'Feeding mode', text: guide.milkFeeding ?? '' },
            { emoji: '👁️', title: 'Signs of readiness for solids', text: guide.developerMilestones.join(' • ') },
          ].map(c => (
            <div key={c.title} className="card card-shadow p-4">
              <span className="text-2xl">{c.emoji}</span>
              <p className="font-bold text-text-primary text-sm mt-2">{c.title}</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Accordion sections */}
      {[
        {
          id: 'overview',
          emoji: '📋',
          title: 'Feeding Overview',
          content: (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-secondary leading-relaxed">{guide.feedingOverview}</p>
              {guide.milkFeeding && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">🍼 Milk feeding</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{guide.milkFeeding}</p>
                </div>
              )}
              {guide.solidsFocus && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">🥣 Solid foods</p>
                  <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">{guide.solidsFocus}</p>
                </div>
              )}
            </div>
          ),
        },
        ...(!isMillkOnly ? [{
          id: 'nutrients',
          emoji: '💊',
          title: 'Key Nutrients',
          content: (
            <div className="flex flex-col gap-3">
              {guide.keyNutrients.map(n => (
                <div key={n.name} className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{n.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{n.name}</p>
                    <p className="text-xs text-text-secondary mb-1.5">{n.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {n.sources.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-surface2 rounded-full text-xs text-text-secondary border border-border">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ),
        }] : []),
        ...(!isMillkOnly ? [{
          id: 'foods',
          emoji: '🍽️',
          title: 'Foods for This Stage',
          content: (
            <div className="flex flex-col gap-4">
              {tamilPref && guide.tamilFoods.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">🍚 Tamil Traditional</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.tamilFoods.map(f => (
                      <span key={f} className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-full text-xs font-medium text-orange-700 dark:text-orange-300">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {guide.globalFoods.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">🌍 Global Foods</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.globalFoods.map(f => (
                      <span key={f} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: '🍎 Fruits', items: guide.fruits, color: 'text-green-600 dark:text-green-400' },
                  { label: '🥬 Vegetables', items: guide.vegetables, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: '💪 Protein', items: guide.proteinFoods, color: 'text-purple-600 dark:text-purple-400' },
                ].map(col => col.items.length > 0 && (
                  <div key={col.label}>
                    <p className={`text-xs font-bold mb-1.5 ${col.color}`}>{col.label}</p>
                    {col.items.map(i => <p key={i} className="text-xs text-text-secondary">• {i}</p>)}
                  </div>
                ))}
              </div>
            </div>
          ),
        }] : []),
        {
          id: 'readiness',
          emoji: '✅',
          title: 'Developmental Milestones',
          content: (
            <ul className="flex flex-col gap-2">
              {guide.developerMilestones.map((m, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-teal-500 flex-shrink-0 mt-0.5">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          id: 'safety',
          emoji: '🛡️',
          title: 'Safety & Foods to Avoid',
          content: (
            <div className="flex flex-col gap-3">
              {guide.chokingSafety.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5">⚠️ Choking safety</p>
                  {guide.chokingSafety.map((s, i) => (
                    <p key={i} className="text-xs text-text-secondary mb-1">• {s}</p>
                  ))}
                </div>
              )}
              {guide.foodsToAvoid.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5">🚫 Avoid / use caution</p>
                  {guide.foodsToAvoid.map((f, i) => (
                    <p key={i} className="text-xs text-text-secondary mb-1">• {f}</p>
                  ))}
                </div>
              )}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">👩‍⚕️ Paediatrician note</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{guide.doctorNote}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ General information only. Always follow your paediatrician's guidance.
                </p>
              </div>
            </div>
          ),
        },
      ].map(section => (
        <div key={section.id} className="card card-shadow">
          <button
            onClick={() => toggle(section.id)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{section.emoji}</span>
              <span className="font-bold text-text-primary text-sm">{section.title}</span>
            </div>
            <span className={`text-text-muted transition-transform duration-200 ${open === section.id ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open === section.id && (
            <div className="mt-4 pt-4 border-t border-border animate-fade-in">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
