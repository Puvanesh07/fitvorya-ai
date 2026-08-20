import { useState } from 'react'
import type { MonthlyGuide, WeeklyGuide, PregnancyStage } from '../../types/pregnancy'

interface Props {
  stage: PregnancyStage
  monthGuide: MonthlyGuide
  weekGuide: WeeklyGuide
  tamilPref: boolean
}

export default function PregnancyWeeklyGuide({ stage, monthGuide, weekGuide, tamilPref }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>('baby')

  function toggle(id: string) {
    setExpandedSection(prev => prev === id ? null : id)
  }

  const trimColors = {
    1: { bg: 'from-violet-500 to-purple-500', light: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-700', text: 'text-violet-700 dark:text-violet-300' },
    2: { bg: 'from-pink-500 to-rose-500',     light: 'bg-pink-50 dark:bg-pink-900/20',     border: 'border-pink-200 dark:border-pink-700',     text: 'text-pink-700 dark:text-pink-300' },
    3: { bg: 'from-orange-500 to-amber-500',  light: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300' },
  }[stage.trimester]

  return (
    <div className="flex flex-col gap-4">

      {/* Week header card */}
      <div className={`rounded-3xl bg-gradient-to-br ${trimColors.bg} p-5 text-white card-shadow`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
              {monthGuide.title}
            </p>
            <h2 className="text-2xl font-black">Week {stage.week}</h2>
            <p className="text-white/80 text-sm mt-0.5">{monthGuide.weeks}</p>
          </div>
          <div className="text-5xl select-none">🤰</div>
        </div>

        {/* Nutrition focus pills */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {monthGuide.nutritionFocus.map(n => (
            <span key={n} className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
              {n}
            </span>
          ))}
        </div>

        {/* Hydration */}
        <div className="flex items-center gap-2 mt-3 bg-white/15 rounded-2xl px-3 py-2">
          <span className="text-lg">💧</span>
          <p className="text-sm text-white/90">{monthGuide.hydration}</p>
        </div>
      </div>

      {/* Week highlight */}
      <div className={`rounded-2xl p-4 border ${trimColors.light} ${trimColors.border}`}>
        <p className="text-sm font-semibold text-text-primary leading-relaxed">{weekGuide.highlights}</p>
      </div>

      {/* Expandable sections */}
      {[
        {
          id: 'baby',
          emoji: '👶',
          title: 'Baby Development',
          content: (
            <p className="text-sm text-text-secondary leading-relaxed">{monthGuide.babyDevelopment}</p>
          ),
        },
        {
          id: 'mother',
          emoji: '🤱',
          title: "What's Happening to You",
          content: (
            <p className="text-sm text-text-secondary leading-relaxed">{monthGuide.motherChanges}</p>
          ),
        },
        {
          id: 'nutrients',
          emoji: '💊',
          title: 'Key Nutrients This Month',
          content: (
            <div className="flex flex-col gap-3">
              {monthGuide.keyNutrients.map(n => (
                <div key={n.name} className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{n.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{n.name}</p>
                    <p className="text-xs text-text-secondary mb-1">{n.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {n.sources.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-surface2 rounded-full text-xs text-text-secondary border border-border">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: 'meals',
          emoji: '🍽️',
          title: "Today's Meal Ideas",
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {weekGuide.mealIdeas.map((m, i) => (
                <div key={i} className="flex gap-2 p-3 bg-surface2 rounded-2xl border border-border">
                  <span className="text-xl flex-shrink-0">{m.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-text-secondary uppercase">{m.time}</p>
                    <p className="text-sm font-semibold text-text-primary">{m.name}</p>
                    <p className="text-xs text-text-muted">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: 'tamil',
          emoji: '🍚',
          title: tamilPref ? 'Tamil Traditional Foods This Month' : 'Suggested Foods This Month',
          content: (
            <div className="flex flex-col gap-3">
              {tamilPref && (
                <div>
                  <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1.5">🍚 Tamil Traditional</p>
                  <div className="flex flex-wrap gap-1.5">
                    {monthGuide.tamilFoods.map(f => (
                      <span key={f} className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-full text-xs font-medium text-orange-700 dark:text-orange-300">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">🌍 Global Foods</p>
                <div className="flex flex-wrap gap-1.5">
                  {monthGuide.globalFoods.map(f => (
                    <span key={f} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1.5">🍎 Fruits</p>
                  <div className="flex flex-col gap-1">
                    {monthGuide.fruits.map(f => (
                      <span key={f} className="text-xs text-text-secondary">• {f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">🥬 Vegetables</p>
                  <div className="flex flex-col gap-1">
                    {monthGuide.vegetables.map(v => (
                      <span key={v} className="text-xs text-text-secondary">• {v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'wellness',
          emoji: '🧘',
          title: 'Wellness Tips',
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-secondary leading-relaxed">💪 {weekGuide.nutritionTip}</p>
              <p className="text-sm text-text-secondary leading-relaxed">🧘 {weekGuide.wellnessTip}</p>
              {monthGuide.symptomsToNote.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs font-bold text-text-primary mb-1">Common symptoms this month:</p>
                  <div className="flex flex-wrap gap-1">
                    {monthGuide.symptomsToNote.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-surface2 rounded-full text-xs text-text-secondary border border-border">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ),
        },
        {
          id: 'cautions',
          emoji: '⚠️',
          title: 'Foods to Be Cautious About',
          content: (
            <div className="flex flex-col gap-2">
              {monthGuide.cautions.map((c, i) => (
                <div key={i} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-orange-500 flex-shrink-0">•</span>
                  <span>{c}</span>
                </div>
              ))}
              {monthGuide.doctorNote && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-0.5">👩‍⚕️ Doctor / Midwife Note</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{monthGuide.doctorNote}</p>
                </div>
              )}
              <div className="mt-1 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ This is general information only. Always follow advice from your qualified healthcare provider.
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
            <span className={`text-text-muted transition-transform duration-200 ${expandedSection === section.id ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
          {expandedSection === section.id && (
            <div className="mt-4 pt-4 border-t border-border animate-fade-in">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
