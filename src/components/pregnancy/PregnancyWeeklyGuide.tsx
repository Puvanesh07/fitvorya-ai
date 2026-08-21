import { useState } from 'react'
import type { MonthlyGuide, WeeklyGuide, PregnancyStage } from '../../types/pregnancy'

interface Props {
  stage: PregnancyStage
  monthGuide: MonthlyGuide
  weekGuide: WeeklyGuide
  tamilPref: boolean
}

const TRIM_COLORS: Record<number, { glow: string; accent: string; text: string }> = {
  1: { glow: 'rgb(139 92 246 / 0.16)',  accent: 'rgb(139 92 246)', text: 'rgb(196 181 253)' },
  2: { glow: 'rgb(244 114 182 / 0.16)', accent: 'rgb(244 114 182)',text: 'rgb(249 168 212)' },
  3: { glow: 'rgb(251 146 60 / 0.16)',  accent: 'rgb(251 146 60)', text: 'rgb(253 186 116)' },
}

export default function PregnancyWeeklyGuide({ stage, monthGuide, weekGuide, tamilPref }: Props) {
  const [open, setOpen] = useState<string | null>('baby')
  const toggle = (id: string) => setOpen(p => p === id ? null : id)
  const tc = TRIM_COLORS[stage.trimester]

  return (
    <div className="flex flex-col gap-3">

      {/* Week header */}
      <div className="g-card p-4 animate-slide-up" style={{
        background: tc.glow, borderColor: `${tc.accent}44`,
        boxShadow: `0 4px 20px ${tc.glow}`,
      }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: tc.text, opacity: 0.7 }}>
              {monthGuide.title}
            </p>
            <h2 className="text-xl font-black text-text-primary">Week {stage.week}</h2>
            <p className="text-xs mt-0.5" style={{ color: tc.text }}>{monthGuide.weeks}</p>
          </div>
          <span className="text-4xl select-none">🤰</span>
        </div>

        {/* Nutrition focus pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {monthGuide.nutritionFocus.map(n => (
            <span key={n} className="g-badge" style={{ background: `${tc.accent}18`, borderColor: `${tc.accent}33`, color: tc.text }}>
              {n}
            </span>
          ))}
        </div>

        {/* Hydration */}
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgb(255 255 255 / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)' }}>
          <span className="text-base">💧</span>
          <p className="text-xs text-text-secondary">{monthGuide.hydration}</p>
        </div>
      </div>

      {/* Week highlight */}
      <div className="g-card-sm p-3" style={{ background: `${tc.accent}10`, borderColor: `${tc.accent}28` }}>
        <p className="text-xs text-text-secondary leading-relaxed">{weekGuide.highlights}</p>
      </div>

      {/* Accordion sections */}
      {[
        {
          id: 'baby', emoji: '👶', title: 'Baby Development',
          content: (
            <p className="text-xs text-text-secondary leading-relaxed">{monthGuide.babyDevelopment}</p>
          ),
        },
        {
          id: 'mother', emoji: '🤱', title: "What's Happening to You",
          content: (
            <p className="text-xs text-text-secondary leading-relaxed">{monthGuide.motherChanges}</p>
          ),
        },
        {
          id: 'nutrients', emoji: '💊', title: 'Key Nutrients This Month',
          content: (
            <div className="flex flex-col gap-3">
              {monthGuide.keyNutrients.map(n => (
                <div key={n.name} className="flex gap-2.5">
                  <span className="text-xl flex-shrink-0">{n.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-text-primary">{n.name}</p>
                    <p className="text-[11px] text-text-muted mb-1.5">{n.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {n.sources.map(s => (
                        <span key={s} className="g-badge text-[10px]">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: 'meals', emoji: '🍽️', title: "Today's Meal Ideas",
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {weekGuide.mealIdeas.map((m, i) => (
                <div key={i} className="g-card-sm p-2.5 flex gap-2">
                  <span className="text-xl flex-shrink-0">{m.emoji}</span>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide">{m.time}</p>
                    <p className="text-xs font-bold text-text-primary">{m.name}</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: 'foods', emoji: '🍚', title: tamilPref ? 'Tamil Traditional Foods' : 'Suggested Foods',
          content: (
            <div className="flex flex-col gap-3">
              {tamilPref && (
                <div>
                  <p className="text-[10px] font-bold mb-1.5" style={{ color: 'rgb(253 186 116)' }}>🍚 Tamil Traditional</p>
                  <div className="flex flex-wrap gap-1.5">
                    {monthGuide.tamilFoods.map(f => (
                      <span key={f} className="g-badge" style={{ background: 'rgb(251 146 60 / 0.12)', borderColor: 'rgb(251 146 60 / 0.25)', color: 'rgb(253 186 116)' }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold mb-1.5" style={{ color: 'rgb(125 211 252)' }}>🌍 Global Foods</p>
                <div className="flex flex-wrap gap-1.5">
                  {monthGuide.globalFoods.map(f => (
                    <span key={f} className="g-badge" style={{ background: 'rgb(56 189 248 / 0.1)', borderColor: 'rgb(56 189 248 / 0.22)', color: 'rgb(125 211 252)' }}>{f}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: 'rgb(110 231 183)' }}>🍎 Fruits</p>
                  {monthGuide.fruits.map(f => <p key={f} className="text-[11px] text-text-muted">• {f}</p>)}
                </div>
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: 'rgb(94 234 212)' }}>🥬 Vegetables</p>
                  {monthGuide.vegetables.map(v => <p key={v} className="text-[11px] text-text-muted">• {v}</p>)}
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'wellness', emoji: '🧘', title: 'Wellness Tips',
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-text-secondary leading-relaxed">💪 {weekGuide.nutritionTip}</p>
              <p className="text-xs text-text-secondary leading-relaxed">🧘 {weekGuide.wellnessTip}</p>
              {monthGuide.symptomsToNote.length > 0 && (
                <div className="mt-1">
                  <p className="text-[10px] font-bold text-text-muted mb-1.5">Common symptoms this month:</p>
                  <div className="flex flex-wrap gap-1">
                    {monthGuide.symptomsToNote.map(s => (
                      <span key={s} className="g-badge">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ),
        },
        {
          id: 'cautions', emoji: '⚠️', title: 'Foods to Be Cautious About',
          content: (
            <div className="flex flex-col gap-2">
              {monthGuide.cautions.map((c, i) => (
                <div key={i} className="flex gap-2 text-xs text-text-secondary">
                  <span className="flex-shrink-0" style={{ color: 'rgb(253 186 116)' }}>•</span>
                  <span>{c}</span>
                </div>
              ))}
              {monthGuide.doctorNote && (
                <div className="g-card-sm p-2.5 mt-1" style={{ background: 'rgb(56 189 248 / 0.07)', borderColor: 'rgb(56 189 248 / 0.18)' }}>
                  <p className="text-[10px] font-bold text-sky-300 mb-0.5">👩‍⚕️ Doctor / Midwife Note</p>
                  <p className="text-[11px] text-sky-300/70 leading-relaxed">{monthGuide.doctorNote}</p>
                </div>
              )}
              <div className="g-disclaimer mt-1">
                ⚠️ General information only. Always follow advice from your qualified healthcare provider.
              </div>
            </div>
          ),
        },
      ].map(section => (
        <div key={section.id} className="g-card p-3 transition-all">
          <button onClick={() => toggle(section.id)}
            className="w-full flex items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <span className="text-base">{section.emoji}</span>
              <span className="font-bold text-text-primary text-xs">{section.title}</span>
            </div>
            <span className="text-text-muted text-xs transition-transform duration-200"
              style={{ transform: open === section.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          </button>
          {open === section.id && (
            <div className="mt-3 pt-3 animate-slide-up" style={{ borderTop: '1px solid rgb(255 255 255 / 0.06)' }}>
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
