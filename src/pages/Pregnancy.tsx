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

type TabId = 'guide' | 'foods' | 'planner' | 'ai'

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'guide',   emoji: '📖', label: 'Weekly Guide' },
  { id: 'foods',   emoji: '🥗', label: 'Foods'        },
  { id: 'planner', emoji: '📅', label: 'Meal Plan'    },
  { id: 'ai',      emoji: '🤖', label: 'AI Coach'     },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-brand animate-pulse shadow-xl" />
          <p className="text-text-secondary text-sm font-semibold">Loading your pregnancy dashboard…</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <>
        {showSetup && <PregnancySetup existing={null} onSave={handleSave} onCancel={() => setShowSetup(false)} />}
        <div className="max-w-2xl mx-auto py-16 flex flex-col items-center text-center gap-8 animate-fade-up">

          {/* Hero orb */}
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl card-pink flex items-center justify-center text-6xl shadow-xl border border-pink-200 ">🤰</div>
            <div className="absolute -top-2 -right-2 w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white text-sm shadow-lg">✨</div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-text-primary mb-3 tracking-tight">
              AI Pregnancy Nutrition Coach
            </h1>
            <p className="text-text-secondary leading-relaxed max-w-md text-sm">
              Get personalised week-by-week nutrition guidance, Tamil traditional food suggestions,
              AI meal plans, and a dedicated pregnancy food library — all tailored to your stage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {[
              { emoji: '📅', title: 'Week-by-Week Guide', desc: 'Nutrition tips for all 40 weeks', color: 'card-purple' },
              { emoji: '🍚', title: 'Tamil Foods',        desc: 'Kambu, Ragi, Keerai & more',     color: 'card-lime'   },
              { emoji: '🤖', title: 'AI Coach',           desc: 'Ask any pregnancy question',      color: 'card-blue'   },
              { emoji: '🍽️', title: 'Meal Planner',       desc: '1-day or 7-day personalised',    color: 'card-yellow' },
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
              It is not a substitute for advice from a qualified healthcare professional.
              Always consult your doctor or midwife for personalised pregnancy care.
            </p>
          </div>

          <button onClick={() => setShowSetup(true)}
            className="btn-purple py-4 px-10 text-base shadow-xl flex items-center gap-2">
            🤰 Start My Pregnancy Journey
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {showSetup && <PregnancySetup existing={profile} onSave={handleSave} onCancel={() => setShowSetup(false)} />}

      <div className="flex flex-col gap-7 animate-fade-in max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">
              Pregnancy <span className="gradient-text">Nutrition</span>
            </h1>
            <p className="text-sm text-text-secondary mt-1.5">AI-powered guidance for every week of your journey</p>
          </div>
          <button onClick={() => setShowSetup(true)} className="btn-ghost py-2.5 px-5">
            ✏️ Update Details
          </button>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-7 items-start">

          {/* Left — timeline */}
          <div className="lg:sticky lg:top-6">
            <PregnancyTimeline
              stage={displayStage}
              guides={MONTHLY_GUIDES}
              selectedMonth={selectedMonth}
              onSelectMonth={m => { setSelectedMonth(m); setActiveTab('guide') }}
            />
          </div>

          {/* Right — tabs */}
          <div className="flex flex-col gap-5 min-w-0">
            {/* Tab bar */}
            <div className="flex gap-1.5 p-1.5 bg-surface2 rounded-2xl border border-border w-fit">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                    activeTab === tab.id
                      ? 'gradient-brand text-white shadow-lg shadow-purple-500/20'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}>
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="animate-fade-in" key={activeTab + selectedMonth}>
              {activeTab === 'guide' && monthGuide && (
                <PregnancyWeeklyGuide stage={displayStage} monthGuide={monthGuide} weekGuide={weekGuide} tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'foods' && (
                <PregnancyFoodCategories tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'planner' && (
                <PregnancyMealPlanner week={displayStage.week} dietType={profile.dietType} tamilPref={profile.tamilFoodPreference} />
              )}
              {activeTab === 'ai' && (
                <PregnancyAIChat context={{ week: displayStage.week, trimester: displayStage.trimester, dietType: profile.dietType, restrictions: profile.restrictions, tamilFoodPreference: profile.tamilFoodPreference }} />
              )}
            </div>

            <div className="p-4 bg-surface2 border border-border rounded-2xl">
              <p className="text-[11px] text-text-muted text-center leading-relaxed">
                ℹ️ FitTracker provides general nutrition information and is not a substitute for advice from a qualified healthcare professional. Always consult your doctor or midwife.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
