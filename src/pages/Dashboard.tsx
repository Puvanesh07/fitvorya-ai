import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import AICoachCard from '../components/coach/AICoachCard'
import { computeMetrics } from '../utils/calculations'
import type { WeightEntry, MealEntry, WaterEntry } from '../types'
import type { WorkoutSession, PersonalRecord } from '../types/workout'
import { fetchWeightHistory } from '../services/weightService'
import { fetchMealsForDate, fetchMealsForRange, fetchWaterForDate } from '../services/nutritionService'
import { fetchWorkoutHistory, fetchPersonalRecords } from '../services/workoutService'
import { fetchProgressSummary } from '../services/progressService'
import type { ProgressSummary } from '../services/progressService'
import { formatFullDate, formatDate, localTodayISO, dateToISO } from '../utils/format'
import type { FitnessMetrics } from '../utils/calculations'
import { sumNutrition, sumWater } from '../types/nutrition'
import {
  calculateWaterGoal, estimateSessionCaloriesFor, sessionMinutes,
  computeWeightPace, generateInsights, lastNDates,
  sessionsThisWeek, sessionsLastWeek, pickRecommendedTemplates,
} from '../utils/insights'
import { BUILT_IN_TEMPLATES } from '../data/templates'
import { fetchOutdoorConditions, type OutdoorConditions } from '../services/weatherService'
import { kgToDisplay, useUnit } from '../hooks/useUnit'
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, BarChart, Bar as RechartsBar, Cell,
} from 'recharts'

// ── Icons ─────────────────────────────────────────────────────────────────────
function TrendUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  )
}
function TrendDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
    </svg>
  )
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit = '' }: {
  active?: boolean; payload?: { value: number; color: string }[]; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-shadow rounded-xl px-3 py-2 text-xs" style={{ background: 'rgb(30 28 52)', border: '1px solid rgba(108,65,210,0.3)' }}>
      <p className="text-text-muted mb-1">{label}</p>
      <p className="font-bold text-text-primary">{Math.round(payload[0].value)}{unit}</p>
    </div>
  )
}

// ── Circular progress ring ────────────────────────────────────────────────────
function Ring({ pct, size = 92, stroke = 9, color }: {
  pct: number; size?: number; stroke?: number; color: string
}) {
  const clamped = Math.min(100, Math.max(0, pct))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (clamped / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  )
}

// ── Today ring card ───────────────────────────────────────────────────────────
function MetricRing({ label, icon, pct, value, sub, color, to }: {
  label: string; icon: string; pct: number; value: string; sub: string; color: string; to: string
}) {
  return (
    <Link to={to} className="card card-shadow p-3 sm:p-5 rounded-2xl flex flex-col items-center gap-1.5 sm:gap-2.5 hover:-translate-y-0.5 transition-all group">
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
        <span className="text-sm sm:text-base">{icon}</span>
      </div>
      <div className="relative">
        <Ring pct={pct} color={color} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm sm:text-lg font-black text-text-primary tracking-tight">{Math.min(100, Math.round(pct))}%</span>
        </div>
      </div>
      <p className="text-sm sm:text-base font-black text-text-primary leading-none">{value}</p>
      <p className="text-[10px] text-text-muted text-center leading-snug">{sub}</p>
    </Link>
  )
}

const TONE_STYLES = {
  good: { bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.25)', accent: '#34d399' },
  warn: { bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.25)', accent: '#fbbf24' },
  info: { bg: 'rgba(96,165,250,0.09)', border: 'rgba(96,165,250,0.25)', accent: '#93c5fd' },
} as const

const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// templateId → category map for MET-based calorie estimation
const TEMPLATE_CATEGORIES: Record<string, string> = Object.fromEntries(
  BUILT_IN_TEMPLATES.map(t => [t.id, t.category]),
)

export default function Dashboard() {
  const { profile } = useAuth()
  const { unit } = useUnit()
  const [weights, setWeights]   = useState<WeightEntry[]>([])
  const [meals, setMeals]       = useState<MealEntry[]>([])
  const [weekMeals, setWeekMeals] = useState<MealEntry[]>([])
  const [water, setWater]       = useState<WaterEntry[]>([])
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [prs, setPrs]           = useState<PersonalRecord[]>([])
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [outdoor, setOutdoor]   = useState<OutdoorConditions | null>(null)

  const metrics = useMemo<FitnessMetrics | null>(() => (profile ? computeMetrics(profile) : null), [profile])

  // Live outdoor conditions (Open-Meteo — no key, cached per session).
  // Resolves to null on refusal/failure and the card simply doesn't render.
  useEffect(() => {
    let alive = true
    fetchOutdoorConditions().then(c => { if (alive && c) setOutdoor(c) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!profile) return
    const today = localTodayISO()
    const weekStart = dateToISO(new Date(Date.now() - 6 * 86400000))
    Promise.all([
      fetchWeightHistory(profile.uid),
      fetchMealsForDate(profile.uid, today),
      fetchMealsForRange(profile.uid, weekStart, today),
      fetchWaterForDate(profile.uid, today),
      fetchWorkoutHistory(profile.uid),
      fetchPersonalRecords(profile.uid),
      fetchProgressSummary(profile.uid),
    ]).then(([w, m, wm, wat, wo, pr, prog]) => {
      setWeights(w)
      setMeals(m)
      setWeekMeals(wm)
      setWater(wat)
      setWorkouts(wo)
      setPrs(pr)
      setProgressSummary(prog)
    }).catch(() => setError('Some data failed to load. Check your connection and refresh.')).finally(() => setLoading(false))
  }, [profile])

  const derived = useMemo(() => {
    if (!profile || !metrics) return null
    const today = localTodayISO()

    // ── Today's nutrition (shared summation util — same math as Nutrition page)
    const nutrition = sumNutrition(meals)
    const waterTotal = sumWater(water)
    const waterGoal = calculateWaterGoal(profile.weight, profile.activityLevel) + (outdoor?.hydrationBonusMl ?? 0)

    // ── Today's training: real sessions, MET-estimated burn
    const todaySessions = workouts.filter(w => w.date === today)
    const todayActiveMin = todaySessions.reduce((s, w) => s + sessionMinutes(w), 0)
    const todayBurnedKcal = todaySessions.reduce((s, w) => s + estimateSessionCaloriesFor(w, profile.weight, TEMPLATE_CATEGORIES), 0)

    // ── 7-day averages from real logs
    const last7 = lastNDates(7)
    const perDayCalories = last7.map(d =>
      sumNutrition(weekMeals.filter(m => m.date === d)).calories)
    const daysWithFood = perDayCalories.filter(c => c > 0).length
    const avgWeekCalories = daysWithFood > 0
      ? perDayCalories.reduce((a, b) => a + b, 0) / daysWithFood
      : 0

    // ── Weekly chart: minutes trained each of the last 7 days
    const activityData = last7.map(d => ({
      day: DAY_SHORT[new Date(d + 'T00:00:00').getDay()],
      minutes: workouts.filter(w => w.date === d).reduce((s, w) => s + sessionMinutes(w), 0),
      isToday: d === today,
    }))

    const weekCount = sessionsThisWeek(workouts)
    const lastWeekCount = sessionsLastWeek(workouts)

    // ── Weight trend + pace
    const weightTrend = weights.slice(0, 10).reverse().map(w => ({
      date: formatDate(w.date),
      [unit === 'lbs' ? 'lb' : 'kg']: unit === 'lbs'
        ? Math.round(kgToDisplay(w.weight, 'lbs') * 10) / 10
        : w.weight,
    }))
    const pace = computeWeightPace(weights, profile.targetWeight)

    // ── Insights (rule-based, all real data)
    const insights = generateInsights({
      goal: profile.goal,
      targetCalories: metrics.targetCalories,
      proteinTargetG: metrics.macros.proteinG,
      caloriesLogged: nutrition.calories,
      proteinLoggedG: nutrition.protein,
      waterMl: waterTotal,
      waterGoalMl: waterGoal,
      workoutsThisWeek: weekCount,
      workoutsLastWeek: lastWeekCount,
      activeDaysThisWeek: new Set(workouts.filter(w => w.date >= last7[0]).map(w => w.date)).size,
      streak: progressSummary?.streak.currentStreak ?? 0,
      pace,
    })

    // ── Recommendations from real templates (goal + muscle-group rotation)
    const recommended = pickRecommendedTemplates(BUILT_IN_TEMPLATES, workouts, profile.goal)

    const calPct = (nutrition.calories / metrics.targetCalories) * 100
    const proteinPct = (nutrition.protein / metrics.macros.proteinG) * 100
    const waterPct = (waterTotal / waterGoal) * 100
    const activityPct = (todayActiveMin / 30) * 100  // WHO: 30 min/day moderate activity

    return {
      nutrition, waterTotal, waterGoal, todayActiveMin, todayBurnedKcal,
      avgWeekCalories, activityData, weightTrend, pace, insights, recommended,
      calPct, proteinPct, waterPct, activityPct, weekCount,
      recentSessions: workouts.slice(0, 4),
      earnedBadges: progressSummary?.badges.filter(b => b.earned) ?? [],
      topPrs: [...prs].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 3),
    }
  }, [profile, metrics, meals, weekMeals, water, workouts, prs, progressSummary, unit, outdoor])

  if (loading || !metrics || !profile || !derived) return <PageLoader variant="dashboard" />

  const {
    nutrition, waterTotal, waterGoal, todayActiveMin, todayBurnedKcal,
    avgWeekCalories, activityData, weightTrend, pace, insights, recommended,
    calPct, proteinPct, waterPct, activityPct, weekCount,
    recentSessions, earnedBadges, topPrs,
  } = derived

  const greeting = profile.displayName?.split(' ')[0] ?? 'Athlete'
  const hour = new Date().getHours()
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const streak = progressSummary?.streak.currentStreak ?? 0
  const weightKey = unit === 'lbs' ? 'lb' : 'kg'
  const remaining = Math.round(metrics.targetCalories - nutrition.calories + todayBurnedKcal)

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 sm:mb-7 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-widest mb-0.5 sm:mb-1">
            {formatFullDate(localTodayISO())}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            {timeGreet}, <span className="gradient-text">{greeting}</span> 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl card-orange">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-black text-text-primary">{streak}</span>
              <span className="text-[10px] text-text-muted font-semibold hidden sm:inline">day streak</span>
            </div>
          )}
          <Link to="/workout" className="btn-purple btn-sm hidden sm:inline-flex">+ Start Workout</Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-xs text-amber-300 animate-fade-in"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          ⚠ {error}
        </div>
      )}

      {/* ── AI Coach Card ── */}
      <div className="mb-3 sm:mb-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '25ms' }}>
        <AICoachCard uid={profile.uid} />
      </div>

      {/* ── Today's rings ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-5">
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '50ms' }}>
          <MetricRing
            label="Calories" icon="🔥" pct={calPct} color="#8c41d4" to="/nutrition"
            value={`${Math.round(nutrition.calories)} / ${Math.round(metrics.targetCalories)}`}
            sub={remaining >= 0
              ? `${remaining} kcal left${todayBurnedKcal > 0 ? ` · +${todayBurnedKcal} burned` : ''}`
              : `${-remaining} kcal over target`}
          />
        </div>
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}>
          <MetricRing
            label="Protein" icon="🥩" pct={proteinPct} color="#10b981" to="/nutrition"
            value={`${Math.round(nutrition.protein)} / ${metrics.macros.proteinG}g`}
            sub={avgWeekCalories > 0 ? `7-day avg: ${Math.round(avgWeekCalories)} kcal/day` : 'Log meals to build your average'}
          />
        </div>
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
          <MetricRing
            label="Hydration" icon="💧" pct={waterPct} color="#60a5fa" to="/nutrition"
            value={`${(waterTotal / 1000).toFixed(1)} / ${(waterGoal / 1000).toFixed(1)}L`}
            sub={outdoor && outdoor.hydrationBonusMl > 0
              ? `incl. +${outdoor.hydrationBonusMl} ml heat adjustment`
              : 'Personalized to your weight & activity'}
          />
        </div>
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}>
          <MetricRing
            label="Activity" icon="⚡" pct={activityPct} color="#f59e0b" to="/workout"
            value={`${todayActiveMin} / 30 min`}
            sub={weekCount > 0 ? `${weekCount} session${weekCount > 1 ? 's' : ''} this week` : 'WHO target: 30 min/day'}
          />
        </div>
      </div>

      {/* ── Smart insights strip ── */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-5">
          {insights.map((ins, i) => {
            const tone = TONE_STYLES[ins.tone]
            return (
              <div key={ins.id} className="p-3 sm:p-4 rounded-2xl animate-fade-up opacity-0"
                style={{ background: tone.bg, border: `1px solid ${tone.border}`, animationFillMode: 'forwards', animationDelay: `${250 + i * 50}ms` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{ins.icon}</span>
                  <p className="text-xs font-black text-text-primary leading-tight">{ins.title}</p>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">{ins.detail}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Row: Weekly activity + Weight goal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 mb-3 sm:mb-5">

        {/* Weekly activity chart — real session minutes */}
        <div className="lg:col-span-7 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-text-primary">Training — last 7 days</h2>
              <p className="text-[10px] text-text-muted mt-0.5">
                {activityData.reduce((s, d) => s + d.minutes, 0)} active min this period
                {todayBurnedKcal > 0 && ` · ${todayBurnedKcal} kcal burned today (est.)`}
              </p>
            </div>
            <Link to="/progress" className="text-xs font-bold text-purple-400 hover:text-purple-300">Details →</Link>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={activityData} margin={{ top: 2, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'rgba(170,165,210,0.6)' }} tickLine={false} axisLine={false} width={34} unit="m" />
              <Tooltip content={<ChartTooltip unit=" min" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <RechartsBar dataKey="minutes" radius={[6, 6, 2, 2]} maxBarSize={34}>
                {activityData.map((d, i) => (
                  <Cell key={i} fill={d.minutes > 0 ? (d.isToday ? '#8c41d4' : 'rgba(140,65,212,0.55)') : 'rgba(255,255,255,0.05)'} />
                ))}
              </RechartsBar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weight + goal progress */}
        <div className="lg:col-span-5 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-text-primary">Weight Goal</h2>
              <p className="text-[10px] text-text-muted mt-0.5">
                {pace && pace.spanDays >= 7
                  ? `${pace.weeklyRateKg >= 0 ? '+' : ''}${kgToDisplay(pace.weeklyRateKg, unit).toFixed(2)} ${unit}/wk over ${pace.spanDays} days`
                  : 'Log weight to unlock pace insights'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
                {weights[0] ? kgToDisplay(weights[0].weight, unit).toFixed(1) : '—'}
                <span className="text-xs font-normal text-text-muted ml-1">{unit}</span>
              </p>
              {weights.length > 1 && (
                <p className={`text-[10px] flex items-center gap-0.5 justify-end mt-0.5 ${
                  weights[0].weight < weights[1].weight ? 'text-green-400' : 'text-red-400'
                }`}>
                  {weights[0].weight < weights[1].weight ? <TrendDownIcon /> : <TrendUpIcon />}
                  {Math.abs(kgToDisplay(Math.abs(weights[0].weight - weights[1].weight), unit)).toFixed(1)} {unit}
                </p>
              )}
            </div>
          </div>

          {weightTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={92}>
              <LineChart data={weightTrend} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6c41d2"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<ChartTooltip unit={` ${unit}`} />} />
                <Line type="monotone" dataKey={weightKey} stroke="url(#wGrad)" strokeWidth={2.5}
                  dot={false} activeDot={{ r: 5, fill: '#8b5cf6', stroke: 'rgb(22,21,38)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <div className="h-10 w-10 rounded-2xl card-purple flex items-center justify-center text-lg">⚖️</div>
              <Link to="/weight" className="text-xs text-purple-400 hover:underline font-semibold">Log your weight →</Link>
            </div>
          )}

          {/* Real progress toward target weight (start → current → goal) */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-text-muted mb-1">
              <span>{profile.startingWeight ? `${kgToDisplay(profile.startingWeight, unit).toFixed(0)} ${unit} start` : 'start'}</span>
              <span className="font-bold text-text-primary">{metrics.progressPercent}% there</span>
              <span>{kgToDisplay(profile.targetWeight, unit).toFixed(0)} {unit} goal</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${metrics.progressPercent}%`, background: 'linear-gradient(90deg,#6c41d2,#ec4899)' }} />
            </div>
            {pace?.etaDate && (
              <p className="text-[10px] text-text-muted mt-1.5">
                {pace.movingToGoal
                  ? `🎯 On track — projected to reach your goal around ${formatFullDate(pace.etaDate)}`
                  : `⚠️ Currently trending away from your goal`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Outdoor training conditions — live Open-Meteo data ── */}
      {outdoor && (
        <div className="card card-shadow p-3 sm:p-4 rounded-2xl mb-3 sm:mb-5 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '520ms' }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{outdoor.isDay ? (outdoor.score >= 60 ? '☀️' : '🌤️') : '🌙'}</span>
              <div>
                <p className="text-sm font-black text-text-primary leading-tight">
                  {outdoor.temperatureC}°C <span className="text-[10px] font-semibold text-text-muted">feels {outdoor.feelsLikeC}°C</span>
                </p>
                <p className="text-[10px] text-text-muted">Outdoor training conditions</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black"
              style={{
                background: outdoor.score >= 60 ? 'rgba(16,185,129,0.12)' : outdoor.score >= 40 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                color: outdoor.score >= 60 ? '#10b981' : outdoor.score >= 40 ? '#f59e0b' : '#ef4444',
                border: `1px solid ${outdoor.score >= 60 ? 'rgba(16,185,129,0.3)' : outdoor.score >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
              {outdoor.label} · {outdoor.score}/100
            </span>
            <div className="flex items-center gap-x-3.5 gap-y-1 flex-wrap text-[10px] text-text-muted font-semibold ml-auto sm:ml-0">
              <span title="Air quality (US EPA index)">🌫️ AQI {outdoor.aqi}</span>
              <span title="UV index (WHO scale)">🕶️ UV {outdoor.uvIndex}</span>
              <span title="Relative humidity">💧 {outdoor.humidityPct}%</span>
              <span title="Chance of precipitation">🌧️ {outdoor.precipitationProb}%</span>
            </div>
          </div>
          <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
            {outdoor.advice}
            {outdoor.hydrationBonusMl > 0 && (
              <span className="text-blue-300 font-semibold"> · Water goal raised +{outdoor.hydrationBonusMl} ml for the heat.</span>
            )}
          </p>
        </div>
      )}

      {/* ── Row: Recommendations + Recent sessions + Records/Achievements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">

        {/* Recommended workouts — real templates, goal-aware, rotation-aware */}
        <div className="lg:col-span-5 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '550ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-text-primary">Recommended for you</h2>
              <p className="text-[10px] text-text-muted mt-0.5">Based on your goal & muscle-group rotation</p>
            </div>
            <Link to="/workout" className="text-xs font-bold text-purple-400 hover:text-purple-300">All →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recommended.map((item, i) => {
              const colors = ['card-purple', 'card-green', 'card-yellow']
              const icons = ['💪', '🔥', '⚡']
              return (
                <Link key={item.id} to={`/workout/session/${item.id}`}
                  className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl ${colors[i % 3]} hover:scale-[1.01] transition-all group animate-fade-up opacity-0`}
                  style={{ animationFillMode: 'forwards', animationDelay: `${600 + i * 60}ms` }}>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
                    {icons[i % icons.length]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{item.name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{item.estimatedMinutes} min · tap to start</p>
                  </div>
                  <span className="text-text-muted group-hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100">
                    <ArrowRightIcon />
                  </span>
                </Link>
              )
            })}
          </div>
          <Link to="/workout" className="btn-purple btn-sm w-full mt-3 sm:hidden">Start Workout</Link>
        </div>

        {/* Recent sessions — real history */}
        <div className="lg:col-span-4 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Recent sessions</h2>
            <Link to="/workout" className="text-xs font-bold text-purple-400 hover:text-purple-300">History →</Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 gap-3 opacity-60">
              <div className="h-12 w-12 rounded-2xl card-purple flex items-center justify-center text-xl">🏋️</div>
              <p className="text-xs text-text-muted text-center">No workouts yet.<br />Your first session is one tap away.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSessions.map(w => (
                <div key={w.id} className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center text-white text-sm flex-shrink-0">🏋️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{w.name}</p>
                    <p className="text-[10px] text-text-muted">{formatDate(w.date)} · {sessionMinutes(w)} min</p>
                  </div>
                  {w.totalVolumeKg > 0 && (
                    <span className="text-[10px] font-bold text-text-muted flex-shrink-0">
                      {Math.round(kgToDisplay(w.totalVolumeKg, unit)).toLocaleString()} {unit} vol
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRs + achievements */}
        <div className="lg:col-span-3 flex flex-col gap-2 sm:gap-3 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '650ms' }}>

          <div className="card card-shadow p-3 sm:p-4 rounded-2xl">
            <p className="text-xs font-bold text-text-primary mb-2">🏆 Latest records</p>
            {topPrs.length === 0 ? (
              <p className="text-[11px] text-text-muted leading-snug">Complete weighted sets to start building personal records.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {topPrs.map(pr => (
                  <div key={pr.exerciseId} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg card-green">
                    <span className="text-[11px] font-bold text-text-primary truncate">{pr.exerciseName}</span>
                    <span className="text-[10px] font-black text-green-400 flex-shrink-0">
                      {kgToDisplay(pr.weightKg, unit)}{unit} × {pr.reps}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card-shadow p-3 sm:p-4 rounded-2xl flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-text-primary">🏅 Achievements</p>
              <Link to="/progress" className="text-[10px] font-bold text-purple-400 hover:text-purple-300">All →</Link>
            </div>
            <p className="text-2xl font-black text-text-primary tracking-tight">
              {earnedBadges.length}
              <span className="text-xs font-normal text-text-muted ml-1.5">badge{earnedBadges.length === 1 ? '' : 's'} earned</span>
            </p>
            {earnedBadges.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {earnedBadges.slice(0, 5).map(b => (
                  <span key={b.id} title={b.name} className="h-7 w-7 rounded-lg card-purple flex items-center justify-center text-sm">
                    {b.icon}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Macros balance (today) */}
          <div className="card card-shadow p-3 sm:p-4 rounded-2xl">
            <p className="text-xs font-bold text-text-primary mb-2.5">Today's macros vs target</p>
            {[
              { label: 'Protein', logged: nutrition.protein, target: metrics.macros.proteinG, color: '#8b5cf6' },
              { label: 'Carbs',   logged: nutrition.carbs,   target: metrics.macros.carbsG,   color: '#ec4899' },
              { label: 'Fat',     logged: nutrition.fat,     target: metrics.macros.fatG,     color: '#f59e0b' },
            ].map(m => {
              const pct = m.target > 0 ? Math.min(100, (m.logged / m.target) * 100) : 0
              return (
                <div key={m.label} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-text-muted">{m.label}</span>
                    <span className="font-bold text-text-primary">{Math.round(m.logged)} / {m.target}g</span>
                  </div>
                  <div className="progress-bar" style={{ height: '4px' }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: m.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
