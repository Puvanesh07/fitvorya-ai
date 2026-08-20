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
    <div className="card card-shadow group relative overflow-hidden">
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.color} rounded-t-2xl`} />

      <div className="flex items-start gap-3 pt-2">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-2xl shadow-md`}>
          {cfg.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-black text-text-primary truncate">{member.name}</p>
              <p className="text-xs text-text-secondary">{cfg.label} · {ageLabel}</p>
            </div>
            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => onEdit(member)}
                className="h-7 w-7 rounded-lg bg-surface2 border border-border flex items-center justify-center text-xs text-text-secondary hover:text-text-primary transition-colors"
                title="Edit"
              >✏️</button>
              <button
                onClick={() => onDelete(member.id)}
                className="h-7 w-7 rounded-lg bg-surface2 border border-border flex items-center justify-center text-xs text-text-secondary hover:text-red-500 transition-colors"
                title="Remove"
              >🗑️</button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="px-2 py-0.5 bg-surface2 rounded-full text-[10px] font-semibold text-text-secondary border border-border">
              {DIET_LABELS[member.dietPref]}
            </span>
            {member.tamilFoodPreference && (
              <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 rounded-full text-[10px] font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700">
                🍚 Tamil
              </span>
            )}
            {member.allergies.length > 0 && (
              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded-full text-[10px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700">
                ⚠️ {member.allergies.length} allergy
              </span>
            )}
            {member.role === 'pregnant' && member.pregnancyWeek && (
              <span className="px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 rounded-full text-[10px] font-semibold text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-700">
                🤰 Week {member.pregnancyWeek}
              </span>
            )}
          </div>

          {/* Preferences / dislikes */}
          {(member.preferences.length > 0 || member.dislikes.length > 0) && (
            <div className="mt-2 flex flex-col gap-0.5">
              {member.preferences.length > 0 && (
                <p className="text-[10px] text-text-muted">❤️ Likes: {member.preferences.slice(0, 3).join(', ')}</p>
              )}
              {member.dislikes.length > 0 && (
                <p className="text-[10px] text-text-muted">👎 Dislikes: {member.dislikes.slice(0, 3).join(', ')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
