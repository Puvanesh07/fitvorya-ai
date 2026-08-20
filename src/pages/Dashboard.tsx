import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageWrapper from '../components/PageWrapper'
import LoadingSpinner from '../components/LoadingSpinner'
import { computeMetrics } from '../utils/calculations'
import { fetchWeightHistory } from '../services/weightService'
import { fetchMealsForDate, fetchWaterForDate } from '../services/nutritionService'
import { fetchWorkoutHistory } from '../services/workoutService'
import { fetchProgressSummary } from '../services/progressService'
import type { ProgressSummary } from '../services/progressService'
import { GOAL_LABELS } from '../types/user'
import type { WeightEntry } from '../types/weight'
import type { FitnessMetrics } from '../utils/calculations'
import { formatDate, todayISO } from '../utils/format'
import { sumNutrition, sumWater } from '../types/nutrition'
import type { MealEntry, WaterEntry } from '../types/nutrition'
import type { WorkoutSession } from '../types/workout'
import { formatDuration } from '../services/workoutService'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(name: string) { return name.split(' ')[0] }

export default function Dashboard() {
  const { profile } = useAuth()
  const [weights, setWeights]   = useState<WeightEntry[]>([])
  const [meals, setMeals]       = useState<MealEntry[]>([])
  const [water, setWater]       = useState<WaterEntry[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([])
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null)
  const [metrics, setMetrics]   = useState<FitnessMetrics | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => { if (profile) setMetrics(computeMetrics(profile)) }, [profile])

  useEffect(() => {
    if (!profile) return
    const today = todayISO()
    Promise.all([
      fetchWeightHistory(profile.uid),
      fetchMealsForDate(profile.uid, today),
      fetchWaterForDate(profile.uid, today),
      fetchWorkoutHistory(profile.uid),
      fetchProgressSummary(profile.uid),
    ]).then(([w, m, wat, wo, prog]) => {
      setWeights(w)
      setMeals(m)
      setWater(wat)
      setRecentWorkouts(wo.slice(0, 3))
      setProgressSummary(prog)
    }).finally(() => setLoading(false))
  }, [profile])

  if (!profile || !metrics) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center animate-pulse-glow">
            <LoadingSpinner size="md" />
          </div>
          <p className="text-sm text-text-secondary">Loading your dashboard…</p>
        </div>
      </PageWrapper>
    )
  }

  const latestWeight = weights.length > 0
    ? [...weights].sort((a, b) => b.date.localeCompare(a.date))[0].weight
    : profile.weight

  const chartData = [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((w) => ({ date: formatDate(w.date), weight: w.weight }))

  const minW = chartData.length > 0 ? Math.floor(Math.min(...chartData.map(d => d.weight)) - 2) : 40
  const maxW = chartData.length > 0 ? Math.ceil(Math.max(...chartData.map(d => d.weight)) + 2) : 120

  const todayNutrition = sumNutrition(meals)
  const todayWater     = sumWater(water)

  const calorieProgress = Math.min(100, Math.round((todayNutrition.calories / metrics.targetCalories) * 100))
  const waterProgress   = Math.min(100, Math.round((todayWater / 2500) * 100))

  return (
    <PageWrapper>
      {/* Greeting */}
      <div className="mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary">
          {greeting()}, <span className="gradient-text">{firstName(profile.displayName)}</span> 👋
        </h1>
        <p className="text-sm text-text-secondary mt-1">Here's your fitness snapshot for today.</p>
      </div>

      {/* Hero row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Goal */}
        <div className="card card-hover p-5 animate-fade-up opacity-0 col-span-2 lg:col-span-1"
          style={{ animationFillMode: 'forwards', animationDelay: '0ms' }}>
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white text-lg mb-3">🎯</div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Goal</p>
          <p className="text-lg font-bold font-display gradient-text leading-snug">{GOAL_LABELS[profile.goal]}</p>
        </div>

        {/* Current weight */}
        <div className="card card-hover p-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '75ms' }}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-700 to-teal-500 flex items-center justify-center text-white text-lg mb-3">⚖️</div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Weight</p>
          <p className="stat-number text-2xl text-text-primary">{latestWeight}<span className="text-sm font-normal text-text-secondary ml-1">kg</span></p>
        </div>

        {/* Target */}
        <div className="card card-hover p-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-coral-500 to-coral-400 flex items-center justify-center text-white text-lg mb-3">🏁</div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Target</p>
          <p className="stat-number text-2xl text-text-primary">{profile.targetWeight}<span className="text-sm font-normal text-text-secondary ml-1">kg</span></p>
        </div>

        {/* Progress */}
        <div className="card card-hover p-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '225ms' }}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg mb-3">📈</div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Progress</p>
          <p className="stat-number text-2xl text-text-primary">{metrics.progressPercent}<span className="text-sm font-normal text-text-secondary">%</span></p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full gradient-brand transition-all duration-1000"
              style={{ width: `${metrics.progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Streak + badges strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card card-hover p-4 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '280ms' }}>
          <span className="text-xl mb-2 block">🔥</span>
          <p className="stat-number text-2xl text-coral-400">{progressSummary?.streak.currentStreak ?? 0}<span className="text-sm font-normal text-text-secondary ml-1">days</span></p>
          <p className="text-xs text-text-secondary mt-1">Current Streak</p>
        </div>
        <div className="card card-hover p-4 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '340ms' }}>
          <span className="text-xl mb-2 block">🏅</span>
          <p className="stat-number text-2xl text-warning">{progressSummary?.badges.filter(b => b.earned).length ?? 0}</p>
          <p className="text-xs text-text-secondary mt-1">Badges Earned</p>
        </div>
        <div className="card card-hover p-4 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '400ms' }}>
          <span className="text-xl mb-2 block">🏋️</span>
          <p className="stat-number text-2xl text-teal-700">{progressSummary?.workoutCount ?? 0}</p>
          <p className="text-xs text-text-secondary mt-1">Total Workouts</p>
        </div>
        <div className="card card-hover p-4 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '460ms' }}>
          <span className="text-xl mb-2 block">🏆</span>
          <p className="stat-number text-2xl text-teal-700">{progressSummary?.prCount ?? 0}</p>
          <p className="text-xs text-text-secondary mt-1">Personal Records</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {/* Calories */}
        <div className="card card-hover p-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">🔥</span>
            <Link to="/nutrition" className="text-xs text-teal-700 font-semibold hover:underline">Log food →</Link>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Today's Calories</p>
          <p className="stat-number text-2xl text-teal-700">{todayNutrition.calories.toLocaleString()}<span className="text-xs font-normal text-text-secondary ml-1">/ {metrics.targetCalories} kcal</span></p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full gradient-brand transition-all duration-700"
              style={{ width: `${calorieProgress}%` }} />
          </div>
        </div>

        {/* Protein */}
        <div className="card card-hover p-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '375ms' }}>
          <span className="text-xl block mb-3">🥩</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Protein Today</p>
          <p className="stat-number text-2xl text-text-primary">{Math.round(todayNutrition.protein)}<span className="text-sm font-normal text-text-secondary ml-1">/ {metrics.macros.proteinG}g</span></p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-teal-700 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((todayNutrition.protein / metrics.macros.proteinG) * 100))}%` }} />
          </div>
        </div>

        {/* Water */}
        <div className="card card-hover p-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">💧</span>
            <Link to="/nutrition" className="text-xs text-blue-500 font-semibold hover:underline">Log water →</Link>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">Hydration</p>
          <p className="stat-number text-2xl text-blue-500">{(todayWater / 1000).toFixed(1)}<span className="text-sm font-normal text-text-secondary ml-1">/ 2.5L</span></p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${waterProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Weight chart */}
      <div className="card p-5 sm:p-6 mb-6 animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards', animationDelay: '525ms' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold font-display text-text-primary">Weight Trend</h2>
            <p className="text-xs text-text-secondary mt-0.5">Last 14 entries</p>
          </div>
          <Link to="/weight" className="btn-ghost py-1.5 px-3 text-xs">+ Log weight</Link>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
        ) : chartData.length < 2 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <span className="text-4xl animate-float">📈</span>
            <p className="text-sm text-text-secondary">Log 2+ weights to see your trend.</p>
            <Link to="/weight" className="btn-primary py-2 px-5 text-sm">Add weight</Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="wGradDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="rgb(15 118 110)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(15 118 110)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} />
              <YAxis domain={[minW, maxW]} tick={{ fontSize: 11, fill: 'rgb(107,114,128)' }} tickLine={false} axisLine={false} unit="kg" />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface, white)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v) => [`${v} kg`, 'Weight']}
              />
              <ReferenceLine y={profile.targetWeight} stroke="rgb(251 146 60)" strokeDasharray="5 3" strokeWidth={1.5}
                label={{ value: `Target`, position: 'insideTopRight', fontSize: 10, fill: 'rgb(251 146 60)' }} />
              <Area type="monotone" dataKey="weight" stroke="rgb(15 118 110)" strokeWidth={2.5}
                fill="url(#wGradDash)"
                dot={{ r: 4, fill: 'rgb(15 118 110)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'rgb(251 146 60)' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Workouts */}
      <div className="card p-5 sm:p-6 mb-6 animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards', animationDelay: '600ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold font-display text-text-primary">Recent Workouts</h2>
            <p className="text-xs text-text-secondary mt-0.5">Your last 3 sessions</p>
          </div>
          <Link to="/workout" className="btn-ghost py-1.5 px-3 text-xs">View all →</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : recentWorkouts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="text-3xl animate-float">🏋️</span>
            <p className="text-sm text-text-secondary">No workouts yet.</p>
            <Link to="/workout/session/new" className="btn-accent py-2 px-5 text-sm">Start a workout</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentWorkouts.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-surface2 hover:bg-border/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white text-sm font-bold">
                    {w.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{w.name}</p>
                    <p className="text-xs text-text-secondary">{w.date} · {formatDuration(w.durationSeconds ?? 0)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-700">{Math.round(w.totalVolumeKg ?? 0)}kg</p>
                  <p className="text-xs text-text-secondary">volume</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'BMI',          value: metrics.bmi,                        unit: '',     sub: metrics.bmiCategory, icon: '📏', color: 'text-teal-700',  delay: 600 },
          { label: 'Daily Target', value: metrics.targetCalories.toLocaleString(), unit: 'kcal', icon: '🔥', color: 'text-coral-400', delay: 675 },
          { label: 'Protein Goal', value: metrics.macros.proteinG,             unit: 'g',    icon: '🥩', color: 'text-teal-700',  delay: 750 },
          { label: 'Steps Goal',   value: metrics.stepsGoal.toLocaleString(),  unit: '',     icon: '👟', color: 'text-emerald-500', delay: 825 },
          { label: 'Carbs Goal',   value: metrics.macros.carbsG,               unit: 'g',    icon: '🍚', color: 'text-coral-400', delay: 900 },
          { label: 'Fat Goal',     value: metrics.macros.fatG,                 unit: 'g',    icon: '🥑', color: 'text-warning',  delay: 975 },
          { label: 'BMR',          value: metrics.bmr.toLocaleString(),         unit: 'kcal', sub: 'Base rate', icon: '❤️', color: 'text-rose-500', delay: 1050 },
          { label: 'TDEE',         value: metrics.tdee.toLocaleString(),        unit: 'kcal', sub: 'Total exp.', icon: '⚡', color: 'text-teal-700', delay: 1125 },
        ].map((c) => (
          <div key={c.label} className="card card-hover p-4 sm:p-5 animate-fade-up opacity-0"
            style={{ animationFillMode: 'forwards', animationDelay: `${c.delay}ms` }}>
            <span className="text-xl mb-2 block">{c.icon}</span>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">{c.label}</p>
            <p className={`stat-number text-xl sm:text-2xl ${c.color}`}>
              {c.value}
              {c.unit && <span className="text-xs font-normal text-text-muted ml-0.5">{c.unit}</span>}
            </p>
            {c.sub && <p className="text-xs text-text-secondary mt-1">{c.sub}</p>}
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
