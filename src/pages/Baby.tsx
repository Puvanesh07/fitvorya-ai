import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import type { BabyProfile, AgeStageId, FoodIntroRecord } from '../types/baby'
import {
  calculateAgeMonths, calculateAgeLabel, getStageIdForAge,
  saveBabyProfile, loadBabyProfile, loadFoodIntroRecords,
} from '../services/babyService'
import { AGE_STAGES, getStageById, getStageGuide } from '../data/babyData'

import BabySetup            from '../components/baby/BabySetup'
import BabyAgeTimeline      from '../components/baby/BabyAgeTimeline'
import BabyStageGuide       from '../components/baby/BabyStageGuide'
import BabyFoodCategories   from '../components/baby/BabyFoodCategories'
import BabyFoodIntroTracker from '../components/baby/BabyFoodIntroTracker'
import BabyMealPlanner      from '../components/baby/BabyMealPlanner'
import BabyAIChat           from '../components/baby/BabyAIChat'

type TabId = 'guide' | 'foods' | 'tracker' | 'planner' | 'ai'

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'guide',   emoji: '📖', label: 'Guide'     },
  { id: 'foods',   emoji: '🥗', label: 'Foods'     },
  { id: 'tracker', emoji: '✅', label: 'Tracker'   },
  { id: 'planner', emoji: '📅', label: 'Meal Plan' },
  { id: 'ai',      emoji: '🤖', label: 'AI Coach'  },
]

export default function Baby() {
  const { user } = useAuth()

  const [profile,         setProfile]         = useState<BabyProfile | null>(null)
  const [introRecords,    setIntroRecords]     = useState<FoodIntroRecord[]>([])
  const [selectedStageId, setSelectedStageId] = useState<AgeStageId>('months_0_6')
  const [activeTab,       setActiveTab]        = useState<TabId>('guide')
  const [showSetup,       setShowSetup]        = useState(false)
  const [loading,         setLoading]          = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([loadBabyProfile(user.uid), loadFoodIntroRecords(user.uid)])
      .then(([p, records]) => {
        if (p) { setProfile(p); setSelectedStageId(getStageIdForAge(calculateAgeMonths(p.dateOfBirth))) }
        setIntroRecords(records)
      }).finally(() => setLoading(false))
  }, [user])

  async function handleSave(p: BabyProfile) {
    if (!user) return
    await saveBabyProfile(user.uid, p)
    setProfile(p); setSelectedStageId(getStageIdForAge(calculateAgeMonths(p.dateOfBirth))); setShowSetup(false)
  }

  const ageMonths      = profile ? calculateAgeMonths(profile.dateOfBirth) : 0
  const ageLabel       = profile ? calculateAgeLabel(ageMonths) : ''
  const currentStageId = profile ? getStageIdForAge(ageMonths) : 'months_0_6'
  const selectedStage  = getStageById(selectedStageId)
  const selectedGuide  = getStageGuide(selectedStageId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-brand animate-pulse shadow-xl" />
          <p className="text-text-secondary text-sm font-semibold">Loading baby dashboard…</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <>
        {showSetup && <BabySetup existing={null} onSave={handleSave} onCancel={() => setShowSetup(false)} />}
        <div className="max-w-2xl mx-auto py-16 flex flex-col items-center text-center gap-8 animate-fade-up">

          <div className="relative">
            <div className="w-28 h-28 rounded-3xl card-blue flex items-center justify-center text-6xl" style={{ boxShadow: '0 8px 32px rgba(96,165,250,0.25)' }}>👶</div>
            <div className="absolute -top-2 -right-2 w-9 h-9 rounded-xl card-pink flex items-center justify-center text-xl shadow-lg">✨</div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-text-primary mb-3 tracking-tight">
              AI Baby & Toddler Nutrition Coach
            </h1>
            <p className="text-text-secondary leading-relaxed max-w-md text-sm">
              Age-appropriate food guidance, Tamil traditional baby foods, safe texture progression,
              allergen introduction tracker, and Gemini AI coach — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {[
              { emoji: '🍼', title: '5 Age Stages',     desc: '0–6m through 2–3 years',   color: 'card-blue'   },
              { emoji: '🍚', title: 'Tamil Baby Foods', desc: 'Ragi, kambu, idli & more',  color: 'card-lime'   },
              { emoji: '✅', title: 'Allergen Tracker', desc: 'Log food introductions safely', color: 'card-yellow' },
              { emoji: '🤖', title: 'AI Baby Coach',    desc: 'Gemini-powered advice',     color: 'card-purple' },
            ].map(f => (
              <div key={f.title} className={`${f.color} p-5 rounded-2xl text-left shadow-md`}>
                <span className="text-2xl block mb-2">{f.emoji}</span>
                <p className="font-black text-text-primary text-sm">{f.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="w-full max-w-md card-yellow p-5 rounded-2xl text-left shadow-md">
            <p className="text-xs text-text-secondary leading-relaxed">
              ⚠️ <strong>Health disclaimer:</strong> FitTracker provides general nutrition information only.
              Always consult your paediatrician for personalised guidance on feeding your baby.
            </p>
          </div>

          <button onClick={() => setShowSetup(true)} className="btn-purple py-4 px-10 text-base shadow-xl flex items-center gap-2">
            👶 Start Baby Journey
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {showSetup && <BabySetup existing={profile} onSave={handleSave} onCancel={() => setShowSetup(false)} />}

      <div className="flex flex-col gap-7 animate-fade-in max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">
              {profile.name}'s <span className="gradient-text">Nutrition</span>
            </h1>
            <p className="text-sm text-text-secondary mt-1.5">
              {ageLabel} old · {selectedStage.label} stage
            </p>
          </div>
          <button onClick={() => setShowSetup(true)} className="btn-ghost py-2.5 px-5">
            ✏️ Update Profile
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-7 items-start">

          {/* Left — timeline */}
          <div className="lg:sticky lg:top-6">
            <BabyAgeTimeline
              stages={AGE_STAGES}
              currentStageId={currentStageId}
              selectedStageId={selectedStageId}
              ageMonths={ageMonths}
              ageLabel={ageLabel}
              onSelectStage={id => { setSelectedStageId(id); setActiveTab('guide') }}
            />
          </div>

          {/* Right — tabs */}
          <div className="flex flex-col gap-5 min-w-0">
            <div className="flex gap-1.5 p-1.5 bg-surface2 rounded-2xl border border-border w-fit overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                    activeTab === tab.id
                      ? 'gradient-brand text-white shadow-lg shadow-purple-500/20'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}>
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="animate-fade-in" key={activeTab + selectedStageId}>
              {activeTab === 'guide' && (
                <BabyStageGuide guide={selectedGuide} stage={selectedStage} tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'foods' && (
                <BabyFoodCategories ageMonths={getStageById(selectedStageId).ageRangeMonths[0]} tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'tracker' && user && (
                <BabyFoodIntroTracker uid={user.uid} records={introRecords} onRecordsChange={setIntroRecords} />
              )}
              {activeTab === 'planner' && (
                <BabyMealPlanner stageId={selectedStageId} dietType={profile.dietType} tamilPref={profile.tamilFoodPreference} ageMonths={getStageById(selectedStageId).ageRangeMonths[0]} />
              )}
              {activeTab === 'ai' && (
                <BabyAIChat context={{ stageId: selectedStageId, ageMonths: getStageById(selectedStageId).ageRangeMonths[0], ageLabel: selectedStage.label, dietType: profile.dietType, tamilFoodPreference: profile.tamilFoodPreference, introducedFoods: introRecords.filter(r => r.status !== 'not_introduced').map(r => r.foodName), reportedAllergens: introRecords.filter(r => r.status === 'reaction_reported').map(r => r.foodName) }} />
              )}
            </div>

            <div className="p-4 bg-surface2 border border-border rounded-2xl">
              <p className="text-[11px] text-text-muted text-center leading-relaxed">
                ℹ️ FitTracker provides general nutrition information and is not a substitute for advice from a paediatrician or qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
