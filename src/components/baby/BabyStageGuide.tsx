import { useState } from 'react'
import type { StageGuide, AgeStage } from '../../types/baby'

interface Props {
  guide: StageGuide
  stage: AgeStage
  tamilPref: boolean
}

const STAGE_COLORS: Record<string, { glow: string; accent: string; text: string }> = {
  months_0_6:  { glow: 'rgb(56 189 248 / 0.16)',  accent: 'rgb(56 189 248)',  text: 'rgb(125 211 252)' },
  months_6_9:  { glow: 'rgb(32 195 190 / 0.16)',  accent: 'rgb(32 195 190)', text: 'rgb(94 234 212)'  },
  months_9_12: { glow: 'rgb(139 92 246 / 0.16)',  accent: 'rgb(139 92 246)', text: 'rgb(196 181 253)' },
  years_1_2:   { glow: 'rgb(244 114 182 / 0.16)', accent: 'rgb(244 114 182)',text: 'rgb(249 168 212)' },
  years_2_3:   { glow: 'rgb(251 146 60 / 0.16)',  accent: 'rgb(251 146 60)', text: 'rgb(253 186 116)' },
}

export default function BabyStageGuide({ guide, stage, tamilPref }: Props) {
  const [open, setOpen] = useState<string | null>('overview')
  const toggle = (id: string) => setOpen(p => p === id ? null : id)
  const sc = STAGE_COLORS[stage.id] ?? STAGE_COLORS['months_6_9']
  const isMilkOnly = stage.id === 'months_0_6'

  return (
    <div className="flex flex-col gap-3">

      {/* Stage header card */}
      <div className="g-card p-4 animate-slide-up" style={{
        background: sc.glow, borderColor: `${sc.accent}44`,
        boxShadow: `0 4px 24px ${sc.glow}`,
      }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: sc.text, opacity: 0.7 }}>
              {stage.label}
            </p>
            <h2 className="text-base font-black text-text-primary">{guide.title}</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">{guide.overview}</p>
          </div>
          <span className="text-4xl flex-shrink-0 select-none">{stage.emoji}</span>
        </div>
        {!isMilkOnly && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <span className="g-badge" style={{ background: `${sc.accent}18`, borderColor: `${sc.accent}33`, color: sc.text }}>
              {guide.dailyMeals} solid meal{guide.dailyMeals !== 1 ? 's' : ''}/day
            </span>
            <span className="g-badge" style={{ background: `${sc.accent}18`, borderColor: `${sc.accent}33`, color: sc.text }}>
              {stage.texture.replace(/_/g, ' ')} texture
            </span>
          </div>
        )}
      </div>

      {/* Milk-only info cards */}
      {isMilkOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { emoji: '🍼', title: 'Feeding mode',              text: guide.milkFeeding ?? '' },
            { emoji: '👁️', title: 'Signs of readiness for solids', text: guide.developerMilestones.join(' • ') },
          ].map(c => (
            <div key={c.title} className="g-card p-3">
              <span className="text-xl">{c.emoji}</span>
              <p className="font-bold text-text-primary text-xs mt-2">{c.title}</p>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Accordion sections */}
      {[
        {
          id: 'overview', emoji: '📋', title: 'Feeding Overview',
          content: (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-text-secondary leading-relaxed">{guide.feedingOverview}</p>
              {guide.milkFeeding && (
                <div className="g-card-sm p-2.5" style={{ background: 'rgb(56 189 248 / 0.08)', borderColor: 'rgb(56 189 248 / 0.2)' }}>
                  <p className="text-[10px] font-bold text-sky-300 mb-1">🍼 Milk feeding</p>
                  <p className="text-[11px] text-sky-300/80 leading-relaxed">{guide.milkFeeding}</p>
                </div>
              )}
              {guide.solidsFocus && (
                <div className="g-card-sm p-2.5" style={{ background: 'rgb(16 185 129 / 0.08)', borderColor: 'rgb(16 185 129 / 0.2)' }}>
                  <p className="text-[10px] font-bold text-emerald-400 mb-1">🥣 Solid foods</p>
                  <p className="text-[11px] text-emerald-300/80 leading-relaxed">{guide.solidsFocus}</p>
                </div>
              )}
            </div>
          ),
        },
        ...(!isMilkOnly ? [{
          id: 'nutrients', emoji: '💊', title: 'Key Nutrients',
          content: (
            <div className="flex flex-col gap-3">
              {guide.keyNutrients.map(n => (
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
        }] : []),
        ...(!isMilkOnly ? [{
          id: 'foods', emoji: '🍽️', title: 'Foods for This Stage',
          content: (
            <div className="flex flex-col gap-3">
              {tamilPref && guide.tamilFoods.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold mb-1.5" style={{ color: 'rgb(253 186 116)' }}>🍚 Tamil Traditional</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.tamilFoods.map(f => (
                      <span key={f} className="g-badge" style={{ background: 'rgb(251 146 60 / 0.12)', borderColor: 'rgb(251 146 60 / 0.25)', color: 'rgb(253 186 116)' }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {guide.globalFoods.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold mb-1.5" style={{ color: 'rgb(125 211 252)' }}>🌍 Global Foods</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.globalFoods.map(f => (
                      <span key={f} className="g-badge" style={{ background: 'rgb(56 189 248 / 0.1)', borderColor: 'rgb(56 189 248 / 0.22)', color: 'rgb(125 211 252)' }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { label: '🍎 Fruits',     items: guide.fruits,       color: 'rgb(110 231 183)' },
                  { label: '🥬 Vegetables', items: guide.vegetables,   color: 'rgb(94 234 212)'  },
                  { label: '💪 Protein',    items: guide.proteinFoods, color: 'rgb(196 181 253)' },
                ].map(col => col.items.length > 0 && (
                  <div key={col.label}>
                    <p className="text-[10px] font-bold mb-1" style={{ color: col.color }}>{col.label}</p>
                    {col.items.map(i => <p key={i} className="text-[11px] text-text-muted">• {i}</p>)}
                  </div>
                ))}
              </div>
            </div>
          ),
        }] : []),
        {
          id: 'readiness', emoji: '✅', title: 'Developmental Milestones',
          content: (
            <ul className="flex flex-col gap-1.5">
              {guide.developerMilestones.map((m, i) => (
                <li key={i} className="flex gap-2 text-xs text-text-secondary">
                  <span className="text-teal-400 flex-shrink-0 mt-0.5">•</span><span>{m}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          id: 'safety', emoji: '🛡️', title: 'Safety & Foods to Avoid',
          content: (
            <div className="flex flex-col gap-2.5">
              {guide.chokingSafety.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: 'rgb(252 165 165)' }}>⚠️ Choking safety</p>
                  {guide.chokingSafety.map((s, i) => (
                    <p key={i} className="text-[11px] text-text-muted mb-0.5">• {s}</p>
                  ))}
                </div>
              )}
              {guide.foodsToAvoid.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: 'rgb(252 165 165)' }}>🚫 Avoid / use caution</p>
                  {guide.foodsToAvoid.map((f, i) => (
                    <p key={i} className="text-[11px] text-text-muted mb-0.5">• {f}</p>
                  ))}
                </div>
              )}
              <div className="g-card-sm p-2.5" style={{ background: 'rgb(56 189 248 / 0.07)', borderColor: 'rgb(56 189 248 / 0.18)' }}>
                <p className="text-[10px] font-bold text-sky-300 mb-0.5">👩‍⚕️ Paediatrician note</p>
                <p className="text-[11px] text-sky-300/70 leading-relaxed">{guide.doctorNote}</p>
              </div>
              <div className="g-disclaimer">
                ⚠️ General information only. Always follow your paediatrician's guidance.
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
