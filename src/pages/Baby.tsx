import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import type { BabyProfile, AgeStageId, FoodIntroRecord } from '../types/baby'
import {
  calculateAgeMonths, calculateAgeLabel, getStageIdForAge,
  saveBabyProfile, loadBabyProfile, loadFoodIntroRecords,
} from '../services/babyService'
import { AGE_STAGES, getStageById, getStageGuide } from '../data/babyData'

import BabySetup           from '../components/baby/BabySetup'
import BabyAgeTimeline     from '../components/baby/BabyAgeTimeline'
import BabyStageGuide      from '../components/baby/BabyStageGuide'
import BabyFoodCategories  from '../components/baby/BabyFoodCategories'
import BabyFoodIntroTracker from '../components/baby/BabyFoodIntroTracker'
import BabyMealPlanner     from '../components/baby/BabyMealPlanner'
import BabyAIChat          from '../components/baby/BabyAIChat'

type TabId = 'guide' | 'foods' | 'tracker' | 'planner' | 'ai'

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'guide',   emoji: '📖', label: 'Guide'      },
  { id: 'foods',   emoji: '🥗', label: 'Foods'      },
  { id: 'tracker', emoji: '✅', label: 'Tracker'    },
  { id: 'planner', emoji: '📅', label: 'Meal Plan'  },
  { id: 'ai',      emoji: '🤖', label: 'AI Coach'   },
]

export default function Baby() {
  const { user } = useAuth()

  const [profile,         setProfile]         = useState<BabyProfile | null>(null)
  const [introRecords,    setIntroRecords]     = useState<FoodIntroRecord[]>([])
  const [selectedStageId, setSelectedStageId] = useState<AgeStageId>('months_0_6')
  const [activeTab,       setActiveTab]        = useState<TabId>('guide')
  const [showSetup,       setShowSetup]        = useState(false)
  const [loading,         setLoading]          = useState(true)

  // ── Load profile + intro records ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    Promise.all([
      loadBabyProfile(user.uid),
      loadFoodIntroRecords(user.uid),
    ]).then(([p, records]) => {
      if (p) {
        setProfile(p)
        const months = calculateAgeMonths(p.dateOfBirth)
        const stageId = getStageIdForAge(months)
        setSelectedStageId(stageId)
      }
      setIntroRecords(records)
    }).finally(() => setLoading(false))
  }, [user])

  // ── Save handler ─────────────────────────────────────────────────────────────
  async function handleSave(p: BabyProfile) {
    if (!user) return
    await saveBabyProfile(user.uid, p)
    setProfile(p)
    const months = calculateAgeMonths(p.dateOfBirth)
    setSelectedStageId(getStageIdForAge(months))
    setShowSetup(false)
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const ageMonths   = profile ? calculateAgeMonths(profile.dateOfBirth) : 0
  const ageLabel    = profile ? calculateAgeLabel(ageMonths) : ''
  const currentStageId = profile ? getStageIdForAge(ageMonths) : 'months_0_6'
  const selectedStage  = getStageById(selectedStageId)
  const selectedGuide  = getStageGuide(selectedStageId)

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 animate-pulse" />
          <p className="text-text-secondary text-sm">Loading baby dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Landing — no profile yet ──────────────────────────────────────────────────
  if (!profile) {
    return (
      <>
        {showSetup && <BabySetup existing={null} onSave={handleSave} onCancel={() => setShowSetup(false)} />}
        <div className="max-w-2xl mx-auto py-12 flex flex-col items-center text-center gap-6 animate-fade-up">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-5xl shadow-2xl shadow-teal-500/30">
              👶
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-sm shadow-lg">
              ✨
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-text-primary mb-2">
              AI Baby & Toddler Nutrition Coach
            </h1>
            <p className="text-text-secondary leading-relaxed max-w-md">
              Age-appropriate food guidance, Tamil traditional baby foods, safe texture progression,
              allergen introduction tracker, and Gemini AI coach — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {[
              { emoji: '🍼', title: '5 Age Stages',        desc: '0–6m through 2–3 years' },
              { emoji: '🍚', title: 'Tamil Baby Foods',    desc: 'Ragi, kambu, idli & more' },
              { emoji: '✅', title: 'Allergen Tracker',    desc: 'Log food introductions safely' },
              { emoji: '🤖', title: 'AI Baby Coach',       desc: 'Gemini-powered nutrition advice' },
            ].map(f => (
              <div key={f.title} className="card card-shadow text-left p-4">
                <span className="text-2xl">{f.emoji}</span>
                <p className="font-bold text-text-primary text-sm mt-2">{f.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="w-full max-w-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 text-left">
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠️ <strong>Health disclaimer:</strong> FitTracker provides general nutrition information only.
              It is not a substitute for advice from a paediatrician or qualified healthcare professional.
              Always consult your doctor for personalised guidance on feeding your baby.
            </p>
          </div>

          <button
            onClick={() => setShowSetup(true)}
            className="bg-gradient-to-r from-teal-500 to-blue-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-teal-500/30 hover:opacity-90 transition-opacity text-base flex items-center gap-2"
          >
            <span>👶</span> Start Baby Journey
          </button>
        </div>
      </>
    )
  }

  // ── Main dashboard ────────────────────────────────────────────────────────────
  return (
    <>
      {showSetup && <BabySetup existing={profile} onSave={handleSave} onCancel={() => setShowSetup(false)} />}

      <div className="flex flex-col gap-6 animate-fade-up">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👶</span>
              <h1 className="text-2xl font-black text-text-primary">{profile.name}'s Nutrition</h1>
            </div>
            <p className="text-text-secondary text-sm">
              {ageLabel} old · {selectedStage.label} stage
            </p>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface2 text-sm font-semibold text-text-secondary hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
          >
            ✏️ Update Profile
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Left — timeline (sticky on desktop) */}
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

            {/* Tab bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md shadow-teal-500/20'
                      : 'bg-surface border border-border text-text-secondary hover:border-teal-300 card-shadow'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-fade-in" key={activeTab + selectedStageId}>

              {activeTab === 'guide' && (
                <BabyStageGuide
                  guide={selectedGuide}
                  stage={selectedStage}
                  tamilPref={profile.tamilFoodPreference}
                />
              )}

              {activeTab === 'foods' && (
                <BabyFoodCategories
                  ageMonths={getStageById(selectedStageId).ageRangeMonths[0]}
                  tamilPref={profile.tamilFoodPreference}
                />
              )}

              {activeTab === 'tracker' && user && (
                <BabyFoodIntroTracker
                  uid={user.uid}
                  records={introRecords}
                  onRecordsChange={setIntroRecords}
                />
              )}

              {activeTab === 'planner' && (
                <BabyMealPlanner
                  stageId={selectedStageId}
                  dietType={profile.dietType}
                  tamilPref={profile.tamilFoodPreference}
                  ageMonths={getStageById(selectedStageId).ageRangeMonths[0]}
                />
              )}

              {activeTab === 'ai' && (
                <BabyAIChat
                  context={{
                    stageId:             selectedStageId,
                    ageMonths:           getStageById(selectedStageId).ageRangeMonths[0],
                    ageLabel:            selectedStage.label,
                    dietType:            profile.dietType,
                    tamilFoodPreference: profile.tamilFoodPreference,
                    introducedFoods:     introRecords.filter(r => r.status !== 'not_introduced').map(r => r.foodName),
                    reportedAllergens:   introRecords.filter(r => r.status === 'reaction_reported').map(r => r.foodName),
                  }}
                />
              )}
            </div>

            {/* Footer disclaimer */}
            <div className="p-3 bg-surface2 border border-border rounded-2xl mt-2">
              <p className="text-[11px] text-text-muted text-center">
                ℹ️ FitTracker provides general nutrition information and is not a substitute for advice
                from a paediatrician or qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
