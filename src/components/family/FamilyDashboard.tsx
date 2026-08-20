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
    <div className="flex flex-col gap-6">

      {/* Family header */}
      <div className="card card-shadow bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Family Nutrition Coach</p>
            <h2 className="text-2xl font-black">{profile.familyName}</h2>
            <p className="text-white/80 text-sm mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''} · personalised for everyone
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEditFamilyName}
              className="px-3 py-2 bg-white/20 rounded-2xl text-xs font-bold hover:bg-white/30 transition-colors"
            >
              ✏️ Edit name
            </button>
            <button
              onClick={onAddMember}
              className="px-4 py-2 bg-white text-emerald-700 rounded-2xl text-xs font-black hover:bg-white/90 transition-colors shadow-md"
            >
              + Add member
            </button>
          </div>
        </div>

        {/* Member avatars row */}
        {members.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {members.map(m => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl border-2 border-white/40">
                  {ROLE_CONFIG[m.role].emoji}
                </div>
                <p className="text-[10px] text-white/80 font-semibold max-w-[48px] text-center truncate">{m.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cuisine preference */}
      <div className="card card-shadow flex flex-col gap-3">
        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
          <span>🍽️</span> Cuisine Preference
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {CUISINE_OPTIONS.map(c => (
            <button
              key={c.value}
              onClick={() => onCuisineChange(c.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                profile.cuisinePreference === c.value
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-transparent shadow-md'
                  : 'border-border bg-surface2 text-text-secondary hover:border-emerald-300'
              }`}
            >
              <span className="text-xl">{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Member cards */}
      {members.length === 0 ? (
        <div className="card card-shadow text-center py-16 flex flex-col items-center gap-4">
          <div className="text-6xl">👨‍👩‍👧</div>
          <h3 className="font-black text-text-primary text-lg">Add your family members</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Add each family member so FitvoryaAI can generate personalised meals for everyone — from adults to babies.
          </p>
          <button
            onClick={onAddMember}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            + Add First Member
          </button>
        </div>
      ) : (
        <div>
          <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
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
            {/* Add member card */}
            <button
              onClick={onAddMember}
              className="card border-2 border-dashed border-border hover:border-emerald-400 text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex flex-col items-center justify-center gap-2 py-8 min-h-[100px]"
            >
              <span className="text-3xl">+</span>
              <span className="text-xs font-bold">Add member</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick nutrition overview */}
      {members.length > 0 && (
        <div className="card card-shadow flex flex-col gap-3">
          <h3 className="font-bold text-text-primary text-sm flex items-center gap-2"><span>📊</span> Family Nutrition Overview</h3>
          <div className="flex flex-col gap-2">
            {members.map(m => {
              const cfg = ROLE_CONFIG[m.role]
              const needsNote =
                m.role === 'pregnant' ? '🌿 Extra iron, calcium, folate' :
                m.role === 'baby'     ? '🍼 Milk primary + age-appropriate solids' :
                m.role === 'toddler'  ? '🥣 Varied family foods in small portions' :
                m.role === 'senior_male' || m.role === 'senior_female' ? '🦴 Calcium, fibre, low salt' :
                '💪 Balanced macros'
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-surface2 rounded-2xl border border-border">
                  <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary">{m.name}</p>
                    <p className="text-xs text-text-secondary">{getMemberAgeLabel(m)} · {needsNote}</p>
                  </div>
                  {m.allergies.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-700 flex-shrink-0">
                      ⚠️ {m.allergies[0]}{m.allergies.length > 1 ? ` +${m.allergies.length-1}` : ''}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-text-muted text-center">
            ℹ️ General information only. Consult your healthcare provider for personalised advice.
          </p>
        </div>
      )}
    </div>
  )
}
