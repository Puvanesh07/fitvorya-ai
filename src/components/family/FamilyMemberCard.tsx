import type { FamilyMember } from '../../types/family'
import { ROLE_CONFIG, getMemberAgeLabel } from '../../data/familyData'

interface Props {
  member: FamilyMember
  onEdit: (m: FamilyMember) => void
  onDelete: (id: string) => void
}

const DIET_LABELS: Record<string, string> = {
  vegetarian: '🥬 Veg', eggetarian: '🥚 Eggetarian',
  non_vegetarian: '🍗 Non-Veg', vegan: '🌱 Vegan',
}

export default function FamilyMemberCard({ member, onEdit, onDelete }: Props) {
  const cfg      = ROLE_CONFIG[member.role]
  const ageLabel = getMemberAgeLabel(member)

  return (
    <div className="g-card p-3 group relative overflow-hidden transition-all hover:border-emerald-500/25">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[1rem]"
        style={{ background: `linear-gradient(90deg, ${cfg.color ?? 'rgb(16 185 129)'}, transparent)` }} />

      <div className="flex items-start gap-2.5 pt-1">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'rgb(16 185 129 / 0.12)', border: '1px solid rgb(16 185 129 / 0.25)' }}>
          {cfg.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-black text-text-primary text-sm truncate">{member.name}</p>
              <p className="text-[11px] text-text-muted">{cfg.label} · {ageLabel}</p>
            </div>
            {/* Action buttons — visible on hover */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => onEdit(member)}
                className="h-6 w-6 rounded-lg flex items-center justify-center text-[11px] text-text-muted hover:text-text-primary transition-colors"
                style={{ background: 'rgb(255 255 255 / 0.05)', border: '1px solid rgb(255 255 255 / 0.08)' }}
                title="Edit">✏️</button>
              <button onClick={() => onDelete(member.id)}
                className="h-6 w-6 rounded-lg flex items-center justify-center text-[11px] text-text-muted hover:text-red-400 transition-colors"
                style={{ background: 'rgb(255 255 255 / 0.05)', border: '1px solid rgb(255 255 255 / 0.08)' }}
                title="Remove">🗑️</button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            <span className="g-badge">{DIET_LABELS[member.dietPref]}</span>
            {member.tamilFoodPreference && (
              <span className="g-badge" style={{ background: 'rgb(251 146 60 / 0.12)', borderColor: 'rgb(251 146 60 / 0.25)', color: 'rgb(253 186 116)' }}>
                🍚 Tamil
              </span>
            )}
            {member.allergies.length > 0 && (
              <span className="g-badge" style={{ background: 'rgb(239 68 68 / 0.1)', borderColor: 'rgb(239 68 68 / 0.2)', color: 'rgb(252 165 165)' }}>
                ⚠️ {member.allergies.length} allergy
              </span>
            )}
            {member.role === 'pregnant' && member.pregnancyWeek && (
              <span className="g-badge" style={{ background: 'rgb(244 114 182 / 0.12)', borderColor: 'rgb(244 114 182 / 0.25)', color: 'rgb(249 168 212)' }}>
                🤰 Week {member.pregnancyWeek}
              </span>
            )}
          </div>

          {/* Prefs / dislikes */}
          {(member.preferences.length > 0 || member.dislikes.length > 0) && (
            <div className="mt-1.5 flex flex-col gap-0.5">
              {member.preferences.length > 0 && (
                <p className="text-[10px] text-text-muted">❤️ {member.preferences.slice(0, 3).join(', ')}</p>
              )}
              {member.dislikes.length > 0 && (
                <p className="text-[10px] text-text-muted">👎 {member.dislikes.slice(0, 3).join(', ')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
