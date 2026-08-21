import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import type { FamilyProfile, FamilyMember, ShoppingItem, CuisinePreference } from '../types/family'
import {
  loadFamilyProfile, saveFamilyProfile,
  saveFamilyMember, deleteFamilyMember,
  saveShoppingList, loadShoppingList,
} from '../services/familyService'

import FamilyMemberForm    from '../components/family/FamilyMemberForm'
import FamilyDashboard     from '../components/family/FamilyDashboard'
import FamilyMealGenerator from '../components/family/FamilyMealGenerator'
import FamilyWeeklyPlanner from '../components/family/FamilyWeeklyPlanner'
import FamilyShoppingList  from '../components/family/FamilyShoppingList'
import FamilyAIChat        from '../components/family/FamilyAIChat'
import PageLoader          from '../components/PageLoader'

type TabId = 'members' | 'meal' | 'planner' | 'shopping' | 'ai'

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'members',  emoji: '👨‍👩‍👧', label: 'Family'   },
  { id: 'meal',     emoji: '🍽️',    label: 'Meal'     },
  { id: 'planner',  emoji: '📅',    label: 'Planner'  },
  { id: 'shopping', emoji: '🛒',    label: 'Shopping' },
  { id: 'ai',       emoji: '🤖',    label: 'AI Coach' },
]

export default function Family() {
  const { user } = useAuth()

  const [profile,       setProfile]       = useState<FamilyProfile | null>(null)
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [activeTab,     setActiveTab]     = useState<TabId>('members')
  const [showForm,      setShowForm]      = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [showNameEdit,  setShowNameEdit]  = useState(false)
  const [familyName,    setFamilyName]    = useState('')
  const [loading,       setLoading]       = useState(true)
  const [savingMember,  setSavingMember]  = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([loadFamilyProfile(user.uid), loadShoppingList(user.uid)])
      .then(([p, shopping]) => {
        if (p) { setProfile(p); setFamilyName(p.familyName) }
        else {
          setProfile({ id: user.uid, familyName: 'Our Family', cuisinePreference: 'mixed', members: [] })
          setFamilyName('Our Family')
        }
        setShoppingItems(shopping)
      }).finally(() => setLoading(false))
  }, [user])

  async function handleSaveMember(member: FamilyMember) {
    if (!user || !profile) return
    setSavingMember(true)
    try {
      await saveFamilyMember(user.uid, member)
      await saveFamilyProfile(user.uid, { familyName: profile.familyName, cuisinePreference: profile.cuisinePreference })
      const existingIdx = profile.members.findIndex(m => m.id === member.id)
      const updatedMembers = existingIdx >= 0
        ? profile.members.map(m => m.id === member.id ? member : m)
        : [...profile.members, member]
      setProfile({ ...profile, members: updatedMembers })
    } finally { setSavingMember(false); setShowForm(false); setEditingMember(null) }
  }

  async function handleDeleteMember(id: string) {
    if (!user || !profile) return
    if (!window.confirm('Remove this family member?')) return
    await deleteFamilyMember(user.uid, id)
    setProfile({ ...profile, members: profile.members.filter(m => m.id !== id) })
  }

  async function handleCuisineChange(c: CuisinePreference) {
    if (!user || !profile) return
    await saveFamilyProfile(user.uid, { cuisinePreference: c })
    setProfile({ ...profile, cuisinePreference: c })
  }

  async function handleSaveFamilyName() {
    if (!user || !profile || !familyName.trim()) return
    await saveFamilyProfile(user.uid, { familyName: familyName.trim() })
    setProfile({ ...profile, familyName: familyName.trim() })
    setShowNameEdit(false)
  }

  const handleShoppingChange = useCallback(async (items: ShoppingItem[]) => {
    if (!user) return
    setShoppingItems(items)
    await saveShoppingList(user.uid, items)
  }, [user])

  /* ── Loading ── */
  if (loading) return <PageLoader variant="family" />

  if (!profile) return null

  return (
    <>
      {/* Member form modal */}
      {showForm && (
        <FamilyMemberForm
          existing={editingMember}
          onSave={handleSaveMember}
          onCancel={() => { setShowForm(false); setEditingMember(null) }}
        />
      )}

      {/* Family name edit modal */}
      {showNameEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 g-modal-overlay animate-pop-in">
          <div className="g-modal-panel w-full max-w-sm p-6 animate-pop-in">
            <h3 className="text-base font-black text-text-primary mb-4">Edit Family Name</h3>
            <input
              type="text"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              className="g-input mb-4"
              placeholder="e.g. The Kumar Family"
              onKeyDown={e => e.key === 'Enter' && handleSaveFamilyName()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNameEdit(false)} className="g-btn flex-1">Cancel</button>
              <button onClick={handleSaveFamilyName} className="g-btn g-btn-emerald flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 animate-slide-up max-w-[1400px] mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">
              Family <span className="gradient-text">Nutrition</span>
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              AI-powered meals personalised for every family member
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingMember(null) }}
            disabled={savingMember}
            className="g-btn g-btn-emerald g-btn-sm">
            + Add Member
          </button>
        </div>

        {/* Glassy tab bar */}
        <div className="overflow-x-auto pb-0.5">
          <div className="g-tab-bar w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`g-tab ${activeTab === tab.id ? 'g-tab-active-emerald' : ''}`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="animate-slide-up" key={activeTab}>
          {activeTab === 'members' && (
            <FamilyDashboard
              profile={profile}
              onAddMember={() => { setEditingMember(null); setShowForm(true) }}
              onEditMember={(m) => { setEditingMember(m); setShowForm(true) }}
              onDeleteMember={handleDeleteMember}
              onCuisineChange={handleCuisineChange}
              onEditFamilyName={() => setShowNameEdit(true)}
            />
          )}
          {activeTab === 'meal' && (
            <FamilyMealGenerator members={profile.members} cuisinePreference={profile.cuisinePreference} />
          )}
          {activeTab === 'planner' && (
            <FamilyWeeklyPlanner members={profile.members} cuisinePreference={profile.cuisinePreference} />
          )}
          {activeTab === 'shopping' && (
            <FamilyShoppingList items={shoppingItems} members={profile.members} cuisinePreference={profile.cuisinePreference} onItemsChange={handleShoppingChange} />
          )}
          {activeTab === 'ai' && (
            <FamilyAIChat members={profile.members} familyName={profile.familyName} cuisinePreference={profile.cuisinePreference} />
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="g-card-sm p-3 text-center">
          <p className="text-[10px] text-text-muted leading-relaxed">
            ℹ️ FitTracker provides general nutrition information and is not a substitute for advice from a qualified healthcare professional. Always consult your doctor, paediatrician, or registered dietitian for personalised guidance.
          </p>
        </div>
      </div>
    </>
  )
}
