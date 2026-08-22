import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import type { PregnancyProfile, PregnancyStage } from '../types/pregnancy'
import { calculateStage, savePregnancyProfile, loadPregnancyProfile } from '../services/pregnancyService'
import { MONTHLY_GUIDES, getMonthlyGuide, getWeeklyGuide } from '../data/pregnancyData'

import PregnancySetup          from '../components/pregnancy/PregnancySetup'
import PregnancyTimeline       from '../components/pregnancy/PregnancyTimeline'
import PregnancyWeeklyGuide    from '../components/pregnancy/PregnancyWeeklyGuide'
import PregnancyFoodCategories from '../components/pregnancy/PregnancyFoodCategories'
import PregnancyAIChat         from '../components/pregnancy/PregnancyAIChat'
import PregnancyMealPlanner    from '../components/pregnancy/PregnancyMealPlanner'
import PageLoader               from '../components/PageLoader'
import PregnancyExerciseCoach  from '../components/pregnancy/PregnancyExerciseCoach'

type TabId = 'guide' | 'foods' | 'planner' | 'ai' | 'exercise'

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'guide',    emoji: '📖', label: 'Guide'     },
  { id: 'foods',    emoji: '🥗', label: 'Foods'     },
  { id: 'planner',  emoji: '📅', label: 'Meal Plan' },
  { id: 'exercise', emoji: '🏃', label: 'Exercise'  },
  { id: 'ai',       emoji: '🤖', label: 'AI Coach'  },
]

const FEATURES = [
  { emoji: '📅', title: 'Week-by-Week Guide', desc: 'Nutrition tips for all 40 weeks', color: 'rgb(139 92 246 / 0.12)', border: 'rgb(139 92 246 / 0.22)' },
  { emoji: '🍚', title: 'Tamil Foods',        desc: 'Kambu, Ragi, Keerai & more',     color: 'rgb(132 204 22 / 0.1)',  border: 'rgb(132 204 22 / 0.2)'  },
  { emoji: '🏃', title: 'Exercise Coach',     desc: 'Safe prenatal workout plans',     color: 'rgb(244 114 182 / 0.1)', border: 'rgb(244 114 182 / 0.2)' },
  { emoji: '🤖', title: 'AI Coach',           desc: 'Ask any pregnancy question',      color: 'rgb(56 189 248 / 0.1)',  border: 'rgb(56 189 248 / 0.2)'  },
  { emoji: '🍽️', title: 'Meal Planner',       desc: '1-day or 7-day personalised',    color: 'rgb(234 179 8 / 0.1)',   border: 'rgb(234 179 8 / 0.2)'   },
]

export default function Pregnancy() {
  const { user } = useAuth()

  const [profile,       setProfile]       = useState<PregnancyProfile | null>(null)
  const [stage,         setStage]         = useState<PregnancyStage | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [activeTab,     setActiveTab]     = useState<TabId>('guide')
  const [showSetup,     setShowSetup]     = useState(false)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!user) return
    loadPregnancyProfile(user.uid).then(p => {
      if (p) { setProfile(p); const s = calculateStage(p.startDate); setStage(s); setSelectedMonth(s.month) }
    }).finally(() => setLoading(false))
  }, [user])

  async function handleSave(p: PregnancyProfile) {
    if (!user) return
    await savePregnancyProfile(user.uid, p)
    setProfile(p)
    const s = calculateStage(p.startDate)
    setStage(s); setSelectedMonth(s.month); setShowSetup(false)
  }

  const monthGuide = getMonthlyGuide(selectedMonth)
  const displayStage: PregnancyStage = stage ?? {
    week: (selectedMonth - 1) * 4 + 1, month: selectedMonth,
    trimester: selectedMonth <= 3 ? 1 : selectedMonth <= 6 ? 2 : 3,
    weeksRemaining: (10 - selectedMonth) * 4, daysUntilDue: (10 - selectedMonth) * 28, isOverdue: false,
  }
  const weekGuide = getWeeklyGuide(displayStage.week)

  /* ── Loading ── */
  if (loading) return <PageLoader variant="pregnancy" />

  /* ── No profile — landing ── */
  if (!profile) {
    return (
      <>
        {showSetup && <PregnancySetup existing={null} onSave={handleSave} onCancel={() => setShowSetup(false)} />}

        <div className="max-w-lg mx-auto py-12 flex flex-col items-center text-center gap-7 animate-slide-up px-4">

          {/* Hero icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
              style={{ background: 'rgb(244 114 182 / 0.12)', border: '1px solid rgb(244 114 182 / 0.25)', boxShadow: '0 8px 32px rgb(244 114 182 / 0.18)' }}>
              🤰
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white text-sm"
              style={{ boxShadow: '0 4px 14px rgb(108 65 210 / 0.5)' }}>✨</div>
          </div>

          {/* Copy */}
          <div>
            <h1 className="text-2xl font-black text-text-primary mb-2 tracking-tight">
              AI Pregnancy<br />
              <span className="gradient-text">Nutrition Coach</span>
            </h1>
            <p className="text-text-secondary leading-relaxed text-sm max-w-sm mx-auto">
              Personalised week-by-week nutrition guidance, Tamil traditional food suggestions,
              AI meal plans, and a dedicated pregnancy food library — tailored to your stage.
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
            Always consult your doctor or midwife for personalised pregnancy care.
          </div>

          <button onClick={() => setShowSetup(true)}
            className="g-btn g-btn-primary py-3.5 px-10 text-sm shadow-xl">
            🤰 Start My Pregnancy Journey
          </button>
        </div>
      </>
    )
  }

  /* ── Dashboard ── */
  return (
    <>
      {showSetup && <PregnancySetup existing={profile} onSave={handleSave} onCancel={() => setShowSetup(false)} />}

      <div className="flex flex-col gap-6 animate-slide-up max-w-[1400px] mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">
              Pregnancy <span className="gradient-text">Nutrition</span>
            </h1>
            <p className="text-sm text-text-muted mt-0.5">AI-powered guidance for every week of your journey</p>
          </div>
          <button onClick={() => setShowSetup(true)} className="g-btn g-btn-sm">
            ✏️ Update Details
          </button>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Left — timeline */}
          <div className="lg:sticky lg:top-6">
            <PregnancyTimeline
              stage={displayStage}
              guides={MONTHLY_GUIDES}
              selectedMonth={selectedMonth}
              onSelectMonth={m => { setSelectedMonth(m); setActiveTab('guide') }}
            />
          </div>

          {/* Right — tabs + content */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Glassy tab bar */}
            <div className="g-tab-bar w-fit overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`g-tab ${activeTab === tab.id ? 'g-tab-active' : ''}`}>
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-slide-up" key={activeTab + selectedMonth}>
              {activeTab === 'guide' && monthGuide && (
                <PregnancyWeeklyGuide stage={displayStage} monthGuide={monthGuide} weekGuide={weekGuide} tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'foods' && (
                <PregnancyFoodCategories
                  tamilPref={profile.tamilFoodPreference}
                  week={displayStage.week}
                  trimester={displayStage.trimester}
                />
              )}
              {activeTab === 'planner' && (
                <PregnancyMealPlanner week={displayStage.week} dietType={profile.dietType} tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'ai' && (
                <PregnancyAIChat context={{
                  week: displayStage.week,
                  trimester: displayStage.trimester,
                  dietType: profile.dietType,
                  restrictions: profile.restrictions,
                  tamilFoodPreference: profile.tamilFoodPreference,
                }} />
              )}
              {activeTab === 'exercise' && user && (
                <PregnancyExerciseCoach
                  pregnancyWeek={displayStage.week}
                  uid={user.uid}
                />
              )}
            </div>

            {/* Footer disclaimer */}
            <div className="g-card-sm p-3 text-center">
              <p className="text-[10px] text-text-muted leading-relaxed">
                ℹ️ FitTracker provides general nutrition information and is not a substitute for advice from a qualified healthcare professional. Always consult your doctor or midwife.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
