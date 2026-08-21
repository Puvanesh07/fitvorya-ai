import type { FamilyProfile, FamilyMember, CuisinePreference } from '../../types/family'
import { ROLE_CONFIG, getMemberAgeLabel } from '../../data/familyData'
import FamilyMemberCard from './FamilyMemberCard'

interface Props {
  profile: FamilyProfile
  onAddMember: () => void
  onEditMember: (m: FamilyMember) => void
  onDeleteMember: (id: string) => void
  onCuisineChange: (c: CuisinePreference) => void
  onEditFamilyName: () => void
}

const CUISINE_OPTIONS: { value: CuisinePreference; label: string; emoji: string }[] = [
  { value: 'tamil',  label: 'Tamil / Indian', emoji: '🇮🇳' },
  { value: 'global', label: 'Global',         emoji: '🌍'  },
  { value: 'mixed',  label: 'Mixed',          emoji: '✨'  },
]

export default function FamilyDashboard({
  profile, onAddMember, onEditMember, onDeleteMember, onCuisineChange, onEditFamilyName,
}: Props) {
  const members = profile.members

  return (
    <div className="flex flex-col gap-4">

      {/* Family header card */}
      <div className="g-card-glow-emerald p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Family Nutrition Coach</p>
            <h2 className="text-xl font-black text-text-primary">{profile.familyName}</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''} · personalised for everyone
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEditFamilyName} className="g-btn g-btn-sm">
              ✏️ Edit name
            </button>
            <button onClick={onAddMember} className="g-btn g-btn-emerald g-btn-sm">
              + Add member
            </button>
          </div>
        </div>

        {/* Member avatar row */}
        {members.length > 0 && (
          <div className="flex gap-2.5 mt-4 flex-wrap">
            {members.map(m => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                  style={{ background: 'rgb(16 185 129 / 0.15)', border: '1px solid rgb(16 185 129 / 0.3)' }}>
                  {ROLE_CONFIG[m.role].emoji}
                </div>
                <p className="text-[9px] text-text-muted font-semibold max-w-[40px] text-center truncate">{m.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cuisine preference */}
      <div className="g-card p-4 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
          <span>🍽️</span> Cuisine Preference
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {CUISINE_OPTIONS.map(c => (
            <button
              key={c.value}
              onClick={() => onCuisineChange(c.value)}
              className={`g-select-btn flex-col items-center justify-center gap-1 py-3 ${
                profile.cuisinePreference === c.value ? 'g-select-btn-active' : ''
              }`}
              style={profile.cuisinePreference === c.value ? {
                background: 'rgb(16 185 129 / 0.18)',
                borderColor: 'rgb(16 185 129 / 0.45)',
                color: 'rgb(110 231 183)',
                boxShadow: '0 0 0 1px rgb(16 185 129 / 0.12)',
              } : {}}
            >
              <span className="text-lg">{c.emoji}</span>
              <span className="text-[11px] font-bold">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Member cards */}
      {members.length === 0 ? (
        <div className="g-card p-12 text-center flex flex-col items-center gap-4">
          <div className="text-5xl">👨‍👩‍👧</div>
          <h3 className="font-black text-text-primary text-base">Add your family members</h3>
          <p className="text-sm text-text-muted max-w-xs leading-relaxed">
            Add each family member so FitvoryaAI can generate personalised meals for everyone — from adults to babies.
          </p>
          <button onClick={onAddMember} className="g-btn g-btn-emerald mt-1">
            + Add First Member
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-bold text-text-secondary mb-2.5 flex items-center gap-1.5">
            <span>👨‍👩‍👧</span> Family Members
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map(m => (
              <FamilyMemberCard
                key={m.id}
                member={m}
                onEdit={onEditMember}
                onDelete={onDeleteMember}
              />
            ))}
            {/* Add member tile */}
            <button
              onClick={onAddMember}
              className="g-card flex flex-col items-center justify-center gap-2 py-8 min-h-[100px] border-dashed hover:border-emerald-500/40"
            >
              <span className="text-2xl text-text-muted">+</span>
              <span className="text-xs font-bold text-text-muted">Add member</span>
            </button>
          </div>
        </div>
      )}

      {/* Nutrition overview */}
      {members.length > 0 && (
        <div className="g-card p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
            <span>📊</span> Family Nutrition Overview
          </h3>
          <div className="flex flex-col gap-2">
            {members.map(m => {
              const cfg = ROLE_CONFIG[m.role]
              const needsNote =
                m.role === 'pregnant'                                     ? '🌿 Extra iron, calcium, folate' :
                m.role === 'baby'                                         ? '🍼 Milk primary + age-appropriate solids' :
                m.role === 'toddler'                                      ? '🥣 Varied family foods in small portions' :
                m.role === 'senior_male' || m.role === 'senior_female'    ? '🦴 Calcium, fibre, low salt' :
                '💪 Balanced macros'
              return (
                <div key={m.id} className="g-card-sm flex items-center gap-3 p-3">
                  <span className="text-lg flex-shrink-0">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary">{m.name}</p>
                    <p className="text-xs text-text-muted">{getMemberAgeLabel(m)} · {needsNote}</p>
                  </div>
                  {m.allergies.length > 0 && (
                    <span className="g-badge flex-shrink-0"
                      style={{ background: 'rgb(239 68 68 / 0.1)', borderColor: 'rgb(239 68 68 / 0.2)', color: 'rgb(252 165 165)' }}>
                      ⚠️ {m.allergies[0]}{m.allergies.length > 1 ? ` +${m.allergies.length - 1}` : ''}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-text-muted text-center">
            ℹ️ General information only. Consult your healthcare provider for personalised advice.
          </p>
        </div>
      )}
    </div>
  )
}
