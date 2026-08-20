import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import type { PregnancyProfile, PregnancyStage } from '../types/pregnancy'
import {
  calculateStage, savePregnancyProfile, loadPregnancyProfile,
} from '../services/pregnancyService'
import {
  MONTHLY_GUIDES, getMonthlyGuide, getWeeklyGuide,
} from '../data/pregnancyData'

import PregnancySetup       from '../components/pregnancy/PregnancySetup'
import PregnancyTimeline    from '../components/pregnancy/PregnancyTimeline'
import PregnancyWeeklyGuide from '../components/pregnancy/PregnancyWeeklyGuide'
import PregnancyFoodCategories from '../components/pregnancy/PregnancyFoodCategories'
import PregnancyAIChat      from '../components/pregnancy/PregnancyAIChat'
import PregnancyMealPlanner from '../components/pregnancy/PregnancyMealPlanner'

// ── Tab definitions ───────────────────────────────────────────────────────────
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

  // ── Load saved profile ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    loadPregnancyProfile(user.uid)
      .then(p => {
        if (p) {
          setProfile(p)
          const s = calculateStage(p.startDate)
          setStage(s)
          setSelectedMonth(s.month)
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  // ── Save handler ────────────────────────────────────────────────────────────
  async function handleSave(p: PregnancyProfile) {
    if (!user) return
    await savePregnancyProfile(user.uid, p)
    setProfile(p)
    const s = calculateStage(p.startDate)
    setStage(s)
    setSelectedMonth(s.month)
    setShowSetup(false)
  }

  // ── Derive data from selected month ─────────────────────────────────────────
  const monthGuide  = getMonthlyGuide(selectedMonth)
  const displayStage: PregnancyStage = stage ?? {
    week: (selectedMonth - 1) * 4 + 1,
    month: selectedMonth,
    trimester: selectedMonth <= 3 ? 1 : selectedMonth <= 6 ? 2 : 3,
    weeksRemaining: (10 - selectedMonth) * 4,
    daysUntilDue: (10 - selectedMonth) * 28,
    isOverdue: false,
  }
  const weekGuide = getWeeklyGuide(displayStage.week)

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-brand animate-pulse" />
          <p className="text-text-secondary text-sm">Loading your pregnancy dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Not set up yet — landing screen ─────────────────────────────────────────
  if (!profile) {
    return (
      <>
        {showSetup && (
          <PregnancySetup
            existing={null}
            onSave={handleSave}
            onCancel={() => setShowSetup(false)}
          />
        )}
        <div className="max-w-2xl mx-auto py-12 flex flex-col items-center text-center gap-6 animate-fade-up">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-5xl shadow-2xl shadow-purple-500/30">
              🤰
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm shadow-lg">
              ✨
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-text-primary mb-2">
              AI Pregnancy Nutrition Coach
            </h1>
            <p className="text-text-secondary leading-relaxed max-w-md">
              Get personalised week-by-week nutrition guidance, Tamil traditional food suggestions,
              AI meal plans, and a dedicated pregnancy food library — all tailored to your stage.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {[
              { emoji: '📅', title: 'Week-by-Week Guide', desc: 'Nutrition tips for all 40 weeks' },
              { emoji: '🍚', title: 'Tamil Foods', desc: 'Kambu, Ragi, Keerai & more' },
              { emoji: '🤖', title: 'AI Coach', desc: 'Ask any pregnancy nutrition question' },
              { emoji: '🍽️', title: 'Meal Planner', desc: '1-day or 7-day personalised plans' },
            ].map(f => (
              <div key={f.title} className="card card-shadow text-left p-4">
                <span className="text-2xl">{f.emoji}</span>
                <p className="font-bold text-text-primary text-sm mt-2">{f.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="w-full max-w-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed text-left">
              ⚠️ <strong>Health disclaimer:</strong> FitTracker provides general nutrition information only.
              It is not a substitute for advice from a qualified healthcare professional.
              Always consult your doctor or midwife for personalised pregnancy care.
            </p>
          </div>

          <button
            onClick={() => setShowSetup(true)}
            className="gradient-brand text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-purple-500/30 hover:opacity-90 transition-opacity text-base flex items-center gap-2"
          >
            <span>🤰</span> Start My Pregnancy Journey
          </button>
        </div>
      </>
    )
  }

  // ── Main dashboard ────────────────────────────────────────────────────────────
  return (
    <>
      {showSetup && (
        <PregnancySetup
          existing={profile}
          onSave={handleSave}
          onCancel={() => setShowSetup(false)}
        />
      )}

      <div className="flex flex-col gap-6 animate-fade-up">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🤰</span>
              <h1 className="text-2xl font-black text-text-primary">Pregnancy Nutrition</h1>
            </div>
            <p className="text-text-secondary text-sm">
              AI-powered guidance for every week of your journey.
            </p>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface2 text-sm font-semibold text-text-secondary hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
          >
            ✏️ Update Details
          </button>
        </div>

        {/* Layout: sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

          {/* Left column — timeline (sticks on desktop) */}
          <div className="lg:sticky lg:top-6">
            <PregnancyTimeline
              stage={displayStage}
              guides={MONTHLY_GUIDES}
              selectedMonth={selectedMonth}
              onSelectMonth={m => {
                setSelectedMonth(m)
                setActiveTab('guide')
              }}
            />
          </div>

          {/* Right column — tabs + content */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Tab bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'gradient-brand text-white shadow-md shadow-purple-500/20'
                      : 'bg-surface border border-border text-text-secondary hover:border-purple-300 card-shadow'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-fade-in" key={activeTab + selectedMonth}>

              {activeTab === 'guide' && monthGuide && (
                <PregnancyWeeklyGuide
                  stage={displayStage}
                  monthGuide={monthGuide}
                  weekGuide={weekGuide}
                  tamilPref={profile.tamilFoodPreference}
                />
              )}

              {activeTab === 'foods' && (
                <PregnancyFoodCategories tamilPref={profile.tamilFoodPreference} />
              )}

              {activeTab === 'planner' && (
                <PregnancyMealPlanner
                  week={displayStage.week}
                  dietType={profile.dietType}
                  tamilPref={profile.tamilFoodPreference}
                />
              )}

              {activeTab === 'ai' && (
                <PregnancyAIChat
                  context={{
                    week:                displayStage.week,
                    trimester:           displayStage.trimester,
                    dietType:            profile.dietType,
                    restrictions:        profile.restrictions,
                    tamilFoodPreference: profile.tamilFoodPreference,
                  }}
                />
              )}
            </div>

            {/* Footer disclaimer */}
            <div className="p-3 bg-surface2 border border-border rounded-2xl mt-2">
              <p className="text-[11px] text-text-muted leading-relaxed text-center">
                ℹ️ FitTracker provides general nutrition information and is not a substitute for
                advice from a qualified healthcare professional. Always consult your doctor or midwife.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
