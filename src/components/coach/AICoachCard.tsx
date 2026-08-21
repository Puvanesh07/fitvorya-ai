import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDailyRecommendation,
  REC_PLACEHOLDER,
  type DailyRecommendation,
} from '../../services/aiCoachService'

interface Props { uid: string }

export default function AICoachCard({ uid }: Props) {
  const navigate = useNavigate()
  const [rec,     setRec]     = useState<DailyRecommendation>(REC_PLACEHOLDER)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDailyRecommendation(uid)
      .then(setRec)
      .finally(() => setLoading(false))
  }, [uid])

  const hour    = new Date().getHours()
  const greet   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="g-card overflow-hidden animate-slide-up"
      style={{
        background: 'linear-gradient(135deg, rgb(108 65 210 / 0.22), rgb(230 55 165 / 0.14))',
        borderColor: 'rgb(108 65 210 / 0.3)',
        boxShadow: '0 8px 32px rgb(108 65 210 / 0.18)',
      }}>

      {/* Card header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgb(255 255 255 / 0.07)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center text-sm"
              style={{ boxShadow: '0 4px 12px rgb(108 65 210 / 0.5)' }}>
              ✦
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300 opacity-80">FitTracker AI Coach</p>
              <p className="text-sm font-black text-text-primary leading-tight">{greet} 👋</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/coach')}
            className="g-btn g-btn-primary g-btn-sm px-3"
            style={{ fontSize: '0.7rem' }}>
            Open Coach
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">

        {/* Summary */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[80, 60, 40].map(w => (
              <div key={w} className="h-3 rounded-full animate-pulse"
                style={{ width: `${w}%`, background: 'rgb(255 255 255 / 0.07)' }} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary leading-relaxed">{rec.summary}</p>
        )}

        {/* Rec rows */}
        {!loading && (
          <div className="flex flex-col gap-2">
            {[
              { icon: '🏋️', label: 'Workout',   val: rec.workout,   color: 'rgb(139 92 246)' },
              { icon: '🥗',  label: 'Nutrition', val: rec.nutrition, color: 'rgb(16 185 129)'  },
              { icon: '💧',  label: 'Hydration', val: rec.hydration, color: 'rgb(56 189 248)'  },
            ].map(row => (
              <div key={row.label} className="flex items-start gap-2.5 p-2.5 rounded-xl"
                style={{ background: `${row.color}10`, border: `1px solid ${row.color}22` }}>
                <span className="text-sm flex-shrink-0 mt-0.5">{row.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: row.color, opacity: 0.8 }}>{row.label}</p>
                  <p className="text-xs text-text-secondary leading-snug">{row.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['How am I doing?', "Today's workout", 'Nutrition tip'].map(q => (
            <button key={q} onClick={() => navigate('/coach', { state: { prefill: q } })}
              className="g-pill text-[10px]">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
