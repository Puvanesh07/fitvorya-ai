import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { computeMetrics } from '../utils/calculations'
import type { WeightEntry, MealEntry, WaterEntry } from '../types'
import type { WorkoutSession } from '../types/workout'
import { fetchWeightHistory } from '../services/weightService'
import { fetchMealsForDate, fetchWaterForDate } from '../services/nutritionService'
import { fetchWorkoutHistory } from '../services/workoutService'
import { fetchProgressSummary } from '../services/progressService'
import type { ProgressSummary } from '../services/progressService'
import { formatFullDate, todayISO } from '../utils/format'
import type { FitnessMetrics } from '../utils/calculations'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts'

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

  if (loading || !metrics || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-text-secondary">Loading your dashboard…</p>
      </div>
    )
  }

  // Today's nutrition
  const todayNutrition = meals.reduce((acc, m) => {
    const factor = m.grams / 100
    return {
      calories: acc.calories + m.foodItem.calories * factor,
      protein:  acc.protein  + m.foodItem.protein  * factor,
      carbs:    acc.carbs    + m.foodItem.carbs    * factor,
      fat:      acc.fat      + m.foodItem.fat      * factor,
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const waterTotal = water.reduce((sum, w) => sum + w.amount, 0)
  const waterGoal = 2500 // Default — will add waterGoal to profile later

  // Activity progress (last 7 days)
  const today = new Date()
  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
    const workoutsOnDay = recentWorkouts.filter(w => w.date === dateStr)
    const minutes = workoutsOnDay.reduce((sum, w) => {
      const start = w.startedAt ? new Date(w.startedAt).getTime() : 0
      const end = w.finishedAt ? w.finishedAt : 0
      return sum + (end > start ? Math.round((end - start) / 60000) : 0)
    }, 0)
    return { day: dayLabel, minutes }
  })

  // Weight trend (last 7 entries)
  const weightTrend = weights.slice(0, 7).reverse().map(w => ({
    date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    kg: w.weight,
  }))

  const targetCals = metrics.targetCalories
  const calsPct = Math.round((todayNutrition.calories / targetCals) * 100)
  const waterPct = Math.round((waterTotal / waterGoal) * 100)

  const greeting = `Hello, ${profile.displayName?.split(' ')[0] ?? 'User'}`
  const dateStr = formatFullDate(todayISO())

  return (
    <div className="animate-fade-in">
      {/* Top bar — greeting + date */}
      <div className="flex items-center justify-between mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">{dateStr}</p>
          <h1 className="text-2xl font-black text-text-primary mt-1">{greeting}</h1>
        </div>
        <Link to="/profile" className="h-11 w-11 rounded-full gradient-brand flex items-center justify-center text-white text-lg font-black shadow-lg hover:opacity-90 transition-opacity">
          {profile.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
        </Link>
      </div>

      {/* Hero section — Smart Plan card + orb + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Smart Plan card */}
        <div className="lg:col-span-3 card-purple p-6 relative overflow-hidden animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '50ms' }}>
          <h2 className="text-base font-black text-text-primary mb-1">Today —<br />Smart Plan</h2>
          <p className="text-[10px] text-text-secondary mb-4">Personalized by your AI coach</p>
          <div className="flex flex-col gap-2.5 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs">⏱️</span>
              <div>
                <p className="text-[10px] text-text-secondary">Duration</p>
                <p className="text-sm font-bold text-text-primary">45 min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">🔥</span>
              <div>
                <p className="text-[10px] text-text-secondary">Calories</p>
                <p className="text-sm font-bold text-text-primary">~{Math.round(metrics.targetCalories * 0.15)} kcal</p>
              </div>
            </div>
          </div>
          <Link to="/workout" className="btn-primary w-full py-2.5 text-xs">Start Now</Link>
        </div>

        {/* Giant orb */}
        <div className="lg:col-span-3 relative flex items-center justify-center animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}>
          <div className="orb orb-purple h-56 w-56 animate-orb-pulse shadow-2xl flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-white/95 shadow-xl flex items-center justify-center">
              <span className="text-4xl font-black gradient-text">F</span>
            </div>
          </div>
        </div>

        {/* Quick stats — 2x2 grid */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          {/* Calories */}
          <div className="card-yellow p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
            <span className="text-xl mb-2 block">🔥</span>
            <p className="text-[10px] text-text-secondary font-semibold mb-1">Calories Burned</p>
            <p className="text-3xl font-black text-text-primary mb-0.5">{todayNutrition.calories.toLocaleString()}<span className="text-base font-normal text-text-muted">kcal</span></p>
            <p className="text-[10px] text-text-secondary">+{calsPct}% from last week</p>
          </div>

          {/* Workouts */}
          <div className="card-lime p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}>
            <span className="text-xl mb-2 block">🏋️</span>
            <p className="text-[10px] text-text-secondary font-semibold mb-1">Workout Sessions</p>
            <p className="text-3xl font-black text-text-primary mb-0.5">{progressSummary?.workoutCount ?? 0}</p>
            <p className="text-[10px] text-text-secondary">+2 hours from last week</p>
          </div>

          {/* Active minutes */}
          <div className="card-pink p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
            <span className="text-xl mb-2 block">⏱️</span>
            <p className="text-[10px] text-text-secondary font-semibold mb-1">Active Minutes</p>
            <p className="text-3xl font-black text-text-primary mb-0.5">{activityData.reduce((s, d) => s + d.minutes, 0)}<span className="text-base font-normal text-text-muted">min</span></p>
            <p className="text-[10px] text-text-secondary">+0 min from last week</p>
          </div>

          {/* Steps (placeholder) */}
          <div className="card-blue p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}>
            <span className="text-xl mb-2 block">👟</span>
            <p className="text-[10px] text-text-secondary font-semibold mb-1">Steps Today</p>
            <p className="text-3xl font-black text-text-primary mb-0.5">8,450</p>
            <p className="text-[10px] text-text-secondary">234 more than last</p>
          </div>
        </div>
      </div>

      {/* Middle row — Water + Weight trend + Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Water goal */}
        <div className="lg:col-span-3 card p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Water goal</p>
              <p className="text-[10px] text-text-muted">{waterGoal / 1000} L</p>
            </div>
            <Link to="/nutrition" className="text-xs text-purple-600 font-semibold hover:underline">Log →</Link>
          </div>
          <p className="text-xs text-text-secondary mb-2">Today drink water</p>
          <p className="text-4xl font-black text-text-primary">{(waterTotal / 1000).toFixed(1)}<span className="text-lg font-normal text-text-muted">L</span></p>
          {/* Water bars (visual) */}
          <div className="flex items-end gap-1 mt-4 h-12">
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < Math.floor(waterPct / 12.5)
              return (
                <div key={i} className="flex-1 rounded-t-md transition-all"
                  style={{
                    height: `${20 + (i % 3) * 15}%`,
                    background: filled ? 'linear-gradient(180deg, #6366f1, #8b5cf6)' : 'rgb(var(--border))',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Weight trend */}
        <div className="lg:col-span-5 card p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Weight Trend</p>
              <p className="text-[10px] text-text-muted">Last 6 Months</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-text-primary">{weights[0]?.weight.toFixed(1) ?? '—'} <span className="text-xs font-normal text-text-muted">kg</span></p>
              <p className="text-[10px] text-text-muted">Goal</p>
            </div>
          </div>
          {weightTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={weightTrend} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(v) => [`${v} kg`, 'Weight']}
                />
                <Line type="monotone" dataKey="kg" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-28">
              <p className="text-xs text-text-secondary">No weight data yet</p>
            </div>
          )}
        </div>

        {/* Workouts per week */}
        <div className="lg:col-span-4 card-lime p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Workouts per Week</p>
              <p className="text-[10px] text-text-muted">Last 4 Weeks</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-text-primary">{progressSummary?.workoutCount ?? 0}</p>
              <p className="text-[10px] text-text-muted">Week</p>
            </div>
          </div>
          <div className="flex items-end justify-around h-24 gap-2">
            {[3, 5, 4, progressSummary?.workoutCount ?? 5].map((count, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full rounded-t-lg bg-gradient-to-b from-purple-500 to-purple-700 transition-all"
                  style={{ height: `${(count / 6) * 100}%`, minHeight: '8px' }} />
                <span className="text-[9px] text-text-muted font-semibold">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — Activity Progress + Today's Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Activity Progress */}
        <div className="card p-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-text-primary">Activity Progress</h2>
            <span className="text-xs text-purple-600 font-semibold">{activityData.reduce((s, d) => s + d.minutes, 0)} min / Goal</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={activityData} margin={{ top: 5, right: 0, left: -30, bottom: 5 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgb(var(--text-secondary))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: '12px', fontSize: '11px' }}
                formatter={(v) => [`${v} min`, 'Active']}
              />
              <Bar dataKey="minutes" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's workouts (example orbs) */}
        <div className="card p-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '550ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-text-primary">Today's Workouts</h2>
            <Link to="/workout" className="text-xs text-purple-600 font-semibold hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Orb 1 */}
            <div className="relative h-32 flex items-center justify-center">
              <div className="orb orb-purple h-28 w-28 animate-orb-pulse" />
              <div className="absolute text-center">
                <p className="text-2xl font-black text-white drop-shadow-lg">20<span className="text-sm">min</span></p>
                <p className="text-[10px] text-white/80 font-semibold drop-shadow">HIIT Express</p>
              </div>
            </div>
            {/* Orb 2 */}
            <div className="relative h-32 flex items-center justify-center">
              <div className="orb orb-yellow h-24 w-24 animate-orb-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute text-center">
                <p className="text-2xl font-black text-text-primary drop-shadow-lg">30<span className="text-sm">min</span></p>
                <p className="text-[10px] text-text-secondary font-semibold drop-shadow">Yoga Stretch</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs">
            <span className="text-lg">🔥</span>
            <div>
              <p className="font-semibold text-text-primary">Current Streak</p>
              <p className="text-text-secondary">{progressSummary?.streak.currentStreak ?? 0} days active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
