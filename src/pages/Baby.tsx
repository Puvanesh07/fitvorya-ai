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
import PageLoader            from '../components/PageLoader'

type TabId = 'guide' | 'foods' | 'tracker' | 'planner' | 'ai'

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'guide',   emoji: '📖', label: 'Guide'     },
  { id: 'foods',   emoji: '🥗', label: 'Foods'     },
  { id: 'tracker', emoji: '✅', label: 'Tracker'   },
  { id: 'planner', emoji: '📅', label: 'Meal Plan' },
  { id: 'ai',      emoji: '🤖', label: 'AI Coach'  },
]

const FEATURES = [
  { emoji: '🍼', title: '5 Age Stages',     desc: '0–6m through 2–3 years',       color: 'rgb(56 189 248 / 0.12)',  border: 'rgb(56 189 248 / 0.22)'  },
  { emoji: '🍚', title: 'Tamil Baby Foods', desc: 'Ragi, kambu, idli & more',      color: 'rgb(132 204 22 / 0.1)',   border: 'rgb(132 204 22 / 0.2)'   },
  { emoji: '✅', title: 'Allergen Tracker', desc: 'Log introductions safely',       color: 'rgb(234 179 8 / 0.1)',    border: 'rgb(234 179 8 / 0.2)'    },
  { emoji: '🤖', title: 'AI Baby Coach',    desc: 'Gemini-powered personal advice', color: 'rgb(139 92 246 / 0.12)', border: 'rgb(139 92 246 / 0.22)'  },
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
    setProfile(p)
    setSelectedStageId(getStageIdForAge(calculateAgeMonths(p.dateOfBirth)))
    setShowSetup(false)
  }

  const ageMonths      = profile ? calculateAgeMonths(profile.dateOfBirth) : 0
  const ageLabel       = profile ? calculateAgeLabel(ageMonths) : ''
  const currentStageId = profile ? getStageIdForAge(ageMonths) : 'months_0_6'
  const selectedStage  = getStageById(selectedStageId)
  const selectedGuide  = getStageGuide(selectedStageId)

  /* ── Loading ── */
  if (loading) {
    return <PageLoader variant="baby" />
  }

  /* ── No profile — landing ── */
  if (!profile) {
    return (
      <>
        {showSetup && <BabySetup existing={null} onSave={handleSave} onCancel={() => setShowSetup(false)} />}

        <div className="max-w-lg mx-auto py-12 flex flex-col items-center text-center gap-7 animate-slide-up px-4">

          {/* Hero icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
              style={{ background: 'rgb(32 195 190 / 0.12)', border: '1px solid rgb(32 195 190 / 0.25)', boxShadow: '0 8px 32px rgb(32 195 190 / 0.2)' }}>
              👶
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white text-sm"
              style={{ boxShadow: '0 4px 14px rgb(108 65 210 / 0.5)' }}>✨</div>
          </div>

          {/* Copy */}
          <div>
            <h1 className="text-2xl font-black text-text-primary mb-2 tracking-tight">
              AI Baby & Toddler<br />
              <span className="gradient-text">Nutrition Coach</span>
            </h1>
            <p className="text-text-secondary leading-relaxed text-sm max-w-sm mx-auto">
              Age-appropriate food guidance, Tamil traditional baby foods, safe texture progression,
              allergen introduction tracker, and Gemini AI coach — all in one place.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {FEATURES.map(f => (
              <div key={f.title} className="g-card p-4 text-left"
                style={{ background: f.color, borderColor: f.border }}>
                <span className="text-2xl block mb-2">{f.emoji}</span>
                <p className="font-black text-text-primary text-sm">{f.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="g-disclaimer w-full text-left">
            ⚠️ <strong>Health disclaimer:</strong> FitTracker provides general nutrition information only.
            Always consult your paediatrician for personalised guidance.
          </div>

          <button onClick={() => setShowSetup(true)}
            className="g-btn g-btn-teal py-3.5 px-10 text-sm shadow-xl">
            👶 Start Baby Journey
          </button>
        </div>
      </>
    )
  }

  /* ── Dashboard ── */
  return (
    <>
      {showSetup && <BabySetup existing={profile} onSave={handleSave} onCancel={() => setShowSetup(false)} />}

      <div className="flex flex-col gap-6 animate-slide-up max-w-[1400px] mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">
              {profile.name}'s <span className="gradient-text">Nutrition</span>
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              {ageLabel} old · <span className="text-text-secondary font-semibold">{selectedStage.label}</span> stage
            </p>
          </div>
          <button onClick={() => setShowSetup(true)}
            className="g-btn g-btn-sm">
            ✏️ Update Profile
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

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

          {/* Right — tabs + content */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Glassy tab bar */}
            <div className="g-tab-bar w-fit overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`g-tab ${activeTab === tab.id ? 'g-tab-active-teal' : ''}`}>
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-slide-up" key={activeTab + selectedStageId}>
              {activeTab === 'guide' && (
                <BabyStageGuide guide={selectedGuide} stage={selectedStage} tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'foods' && (
                <BabyFoodCategories
                  ageMonths={getStageById(selectedStageId).ageRangeMonths[0]}
                  tamilPref={profile.tamilFoodPreference}
                  selectedStageId={selectedStageId}
                />
              )}
              {activeTab === 'tracker' && user && (
                <BabyFoodIntroTracker uid={user.uid} records={introRecords} onRecordsChange={setIntroRecords} />
              )}
              {activeTab === 'planner' && (
                <BabyMealPlanner stageId={selectedStageId} dietType={profile.dietType} tamilPref={profile.tamilFoodPreference} ageMonths={getStageById(selectedStageId).ageRangeMonths[0]} />
              )}
              {activeTab === 'ai' && (
                <BabyAIChat context={{
                  stageId: selectedStageId,
                  ageMonths: getStageById(selectedStageId).ageRangeMonths[0],
                  ageLabel: selectedStage.label,
                  dietType: profile.dietType,
                  tamilFoodPreference: profile.tamilFoodPreference,
                  introducedFoods: introRecords.filter(r => r.status !== 'not_introduced').map(r => r.foodName),
                  reportedAllergens: introRecords.filter(r => r.status === 'reaction_reported').map(r => r.foodName),
                }} />
              )}
            </div>

            {/* Footer disclaimer */}
            <div className="g-card-sm p-3 text-center">
              <p className="text-[10px] text-text-muted leading-relaxed">
                ℹ️ FitTracker provides general nutrition information and is not a substitute for advice from a paediatrician or qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
