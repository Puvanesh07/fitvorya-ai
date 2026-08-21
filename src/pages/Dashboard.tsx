import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import { computeMetrics } from '../utils/calculations'
import type { WeightEntry, MealEntry, WaterEntry } from '../types'
import type { WorkoutSession } from '../types/workout'
import { fetchWeightHistory } from '../services/weightService'
import { fetchMealsForDate, fetchWaterForDate } from '../services/nutritionService'
import { fetchWorkoutHistory } from '../services/workoutService'
import { fetchProgressSummary } from '../services/progressService'
import type { ProgressSummary } from '../services/progressService'
import { formatFullDate, localTodayISO, dateToISO } from '../utils/format'
import type { FitnessMetrics } from '../utils/calculations'
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Area, AreaChart,
} from 'recharts'

// ── Tiny icons ────────────────────────────────────────────────────────────────
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
function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
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

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit = '' }: {
  active?: boolean; payload?: { value: number; color: string }[]; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-shadow rounded-xl px-3 py-2 text-xs" style={{ background: 'rgb(30 28 52)', border: '1px solid rgba(108,65,210,0.3)' }}>
      <p className="text-text-muted mb-1">{label}</p>
      <p className="font-bold text-text-primary">{payload[0].value}{unit}</p>
    </div>
  )
}

// ── Circular progress ─────────────────────────────────────────────────────────
function CircularProgress({ pct, size = 120, stroke = 10, color = '#6c41d2', trackColor = 'rgba(255,255,255,0.06)' }: {
  pct: number; size?: number; stroke?: number; color?: string; trackColor?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
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
    const today = localTodayISO()
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
      setRecentWorkouts(wo.slice(0, 5))
      setProgressSummary(prog)
    }).finally(() => setLoading(false))
  }, [profile])

  if (loading || !metrics || !profile) return <PageLoader variant="dashboard" />

  const todayNutrition = meals.reduce((acc, m) => {
    const f = m.grams / 100
    return {
      calories: acc.calories + m.foodItem.calories * f,
      protein:  acc.protein  + m.foodItem.protein  * f,
      carbs:    acc.carbs    + m.foodItem.carbs    * f,
      fat:      acc.fat      + m.foodItem.fat      * f,
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const waterTotal = water.reduce((sum, w) => sum + w.amount, 0)
  const waterGoal  = 2500
  const waterPct   = Math.min(100, Math.round((waterTotal / waterGoal) * 100))
  const calPct     = Math.min(100, Math.round((todayNutrition.calories / metrics.targetCalories) * 100))

  const todayDate  = new Date()
  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - (6 - i))
    const dateStr  = dateToISO(d)
    const dayLabel = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
    const wos = recentWorkouts.filter(w => w.date === dateStr)
    const minutes = wos.reduce((sum, w) => {
      const start = w.startedAt ? new Date(w.startedAt).getTime() : 0
      const end   = w.finishedAt ? w.finishedAt : 0
      return sum + (end > start ? Math.round((end - start) / 60000) : 0)
    }, 0)
    return { day: dayLabel, minutes }
  })

  const weightTrend = weights.slice(0, 8).reverse().map(w => ({
    date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    kg: w.weight,
  }))

  const totalActiveMin = activityData.reduce((s, d) => s + d.minutes, 0)
  const greeting = profile.displayName?.split(' ')[0] ?? 'User'
  const dateStr  = formatFullDate(localTodayISO())

  // Macros breakdown
  const totalMacros = todayNutrition.protein + todayNutrition.carbs + todayNutrition.fat || 1
  const proteinPct  = Math.round((todayNutrition.protein / totalMacros) * 100)
  const carbsPct    = Math.round((todayNutrition.carbs   / totalMacros) * 100)

  // Month activity (simulated last 12 weeks of data bucketed by month)
  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const currentMonth = todayDate.getMonth()
  const monthActivity = monthLabels.map((m, idx) => ({
    month: m,
    value: idx === currentMonth
      ? Math.max(totalActiveMin, 5)
      : Math.floor(Math.random() * 30 + 5),
    isCurrent: idx === currentMonth,
  }))

  // Recommend activity items (real workout templates)
  const recommendItems = [
    { icon: '💪', label: 'Full Body Strength', sub: 'Push · Pull · Core', color: 'card-purple', mins: 45 },
    { icon: '🔥', label: 'HIIT Cardio',        sub: 'High Intensity',     color: 'card-pink',   mins: 30 },
    { icon: '🦵', label: 'Leg Day',            sub: 'Quads · Glutes',     color: 'card-green',  mins: 50 },
    { icon: '⚡', label: 'StrongLifts 5×5',    sub: 'Compound Strength',  color: 'card-yellow', mins: 55 },
  ]

  return (
    <div className="animate-fade-in">

      {/* Page header */}
      <div className="flex items-center justify-between mb-4 sm:mb-7 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-widest mb-0.5 sm:mb-1">{dateStr}</p>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Hello, <span className="gradient-text">{greeting}</span> 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/workout"
            className="btn-purple btn-sm hidden sm:inline-flex">
            + Start Workout
          </Link>
        </div>
      </div>

      {/* ── Row 1 — Overview + Today's Activity + Output + Calories ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-5 mb-3 sm:mb-5">

        {/* Overview card */}
        <div className="sm:col-span-1 lg:col-span-3 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '50ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Overview</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Monthly <ChevronDownIcon />
            </button>
          </div>

          {/* Circular progress + legend */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              <CircularProgress pct={calPct} size={88} stroke={8} color="#8c41d4" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-text-primary">{calPct > 0 ? `+${Math.round(calPct - 77)}%` : '0%'}</span>
                <span className="text-[8px] text-text-muted font-medium">Total</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {[
                { dot: '#8b5cf6', label: 'Calories burn', val: `${Math.round(todayNutrition.calories * 0.8 / metrics.targetCalories * 100)}%`, change: '+1.25%' },
                { dot: '#f59e0b', label: 'Protein',       val: `${todayNutrition.protein.toFixed(1)}g`,                                        change: '+3.43%' },
                { dot: '#10b981', label: 'Carbs',         val: `${carbsPct}%`,                                                                  change: '+2.12%' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                    <span className="text-[10px] text-text-muted">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-primary">{row.val}</span>
                    <span className="text-[9px] text-green-400 flex items-center gap-0.5"><TrendUpIcon />{row.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="sm:col-span-1 lg:col-span-3 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Today's activity</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Recent <ChevronDownIcon />
            </button>
          </div>

          {/* Highlight stat */}
          <div className="gradient-brand rounded-xl p-3 sm:p-4 mb-3 text-center"
            style={{ boxShadow: '0 6px 20px rgba(108,65,210,0.4)' }}>
            <p className="text-xl sm:text-2xl font-black text-white">{progressSummary?.workoutCount ?? 0}</p>
            <p className="text-[10px] text-white/70 font-medium">Sessions / Week</p>
          </div>

          {/* Activity bullets */}
          <div className="flex flex-col gap-2">
            {[
              { dot: '#8b5cf6', label: 'Squats',        sub: `${Math.max(activityData[activityData.length-1].minutes, 0)} sets` },
              { dot: '#f59e0b', label: 'Low lunges',     sub: '15 sets' },
              { dot: '#10b981', label: 'Battling rope',  sub: '20 sets' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.dot, boxShadow: `0 0 6px ${item.dot}` }} />
                <span className="text-xs font-semibold text-text-primary flex-1">{item.label}</span>
                <span className="text-[10px] text-text-muted">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="sm:col-span-1 lg:col-span-3 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Output</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Last week <ChevronDownIcon />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Calorie loss */}
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl" style={{ background: 'rgba(245,175,30,0.1)', border: '1px solid rgba(245,175,30,0.2)' }}>
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                🔥
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted">Calorie loss</p>
                <p className="text-sm font-black text-amber-400">−{(metrics.targetCalories * 0.12).toFixed(2)} m</p>
              </div>
              {/* mini sparkline */}
              <svg width="36" height="20" viewBox="0 0 36 20">
                <polyline points="0,15 8,10 16,13 24,6 36,3"
                  fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Weight loss */}
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                ⚖️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted">Weight loss</p>
                <p className="text-sm font-black text-green-400">
                  {weights.length > 1 ? `−${(weights[1].weight - weights[0].weight).toFixed(3)} kg` : '—'}
                </p>
              </div>
              <svg width="36" height="20" viewBox="0 0 36 20">
                <polyline points="0,5 8,8 16,6 24,10 36,14"
                  fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Calories gauge */}
        <div className="sm:col-span-2 lg:col-span-3 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Calories</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Today <ChevronDownIcon />
            </button>
          </div>

          {/* Semi-circle gauge */}
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 120, height: 65, overflow: 'hidden' }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0 }}>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6c41d2"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
                  strokeDasharray={`${Math.PI * 48} ${2 * Math.PI * 48}`} strokeLinecap="round"
                  style={{ transform: 'rotate(180deg)', transformOrigin: '60px 60px' }} />
                {/* Fill */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
                  strokeDasharray={`${(calPct / 100) * Math.PI * 48} ${2 * Math.PI * 48}`} strokeLinecap="round"
                  style={{ transform: 'rotate(180deg)', transformOrigin: '60px 60px', filter: 'drop-shadow(0 0 6px rgba(108,65,210,0.5))' }} />
                <text x="60" y="52" textAnchor="middle" fontSize="14" fontWeight="900" fill="white">{calPct}%</text>
                <text x="60" y="64" textAnchor="middle" fontSize="7" fill="rgba(170,165,210,0.8)" fontWeight="600">Based on workout</text>
              </svg>
            </div>
            <div className="flex justify-between w-full mt-2 px-2">
              <span className="text-[10px] text-text-muted font-medium">0%</span>
              <span className="text-lg font-black gradient-text">{calPct.toFixed(2)} %</span>
              <span className="text-[10px] text-text-muted font-medium">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2 — Recommend Activity + Activity chart + Popular Workouts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 mb-3 sm:mb-5">

        {/* Recommend activity list */}
        <div className="lg:col-span-5 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Recommend activity</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Daily <ChevronDownIcon />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {recommendItems.map((item, i) => (
              <Link
                key={item.label}
                to="/workout"
                className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-white/5 transition-all group animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${300 + i * 50}ms` }}
              >
                {/* Icon */}
                <div className={`${item.color} h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0`}>
                  {item.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{item.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.sub}</p>
                </div>

                {/* Duration badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(108,65,210,0.2)', color: 'rgb(175,135,255)', border: '1px solid rgba(108,65,210,0.3)' }}>
                    ~{item.mins}min
                  </span>
                  <span className="text-text-muted group-hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100">
                    <ArrowRightIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Monthly activity chart */}
        <div className="lg:col-span-4 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Activity</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Monthly <ChevronDownIcon />
            </button>
          </div>
          {/* Y-axis labels */}
          <div className="flex gap-0 h-36">
            <div className="flex flex-col justify-between text-[9px] text-text-muted pb-5 pr-1.5" style={{ minWidth: 20 }}>
              {['40%','30%','20%','10%','0'].map(l => <span key={l}>{l}</span>)}
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthActivity} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02"/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(170,165,210,0.7)' }} tickLine={false} axisLine={false} interval={0} />
                  <Tooltip content={<ChartTooltip unit=" min" />} />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#actGrad)"
                    dot={(props) => {
                      const { cx, cy, payload } = props
                      if (!payload.isCurrent) return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={3} fill="#8b5cf6" fillOpacity={0.5} stroke="none" />
                      return (
                        <g key={`dot-${props.index}`}>
                          <circle cx={cx} cy={cy} r={5} fill="#6c41d2" stroke="white" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 6px rgba(108,65,210,0.8))' }} />
                        </g>
                      )
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Popular workout cards */}
        <div className="lg:col-span-3 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Popular workout</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Cardio <ChevronDownIcon />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { name: 'Push Day', sub: 'Chest expert', img: '💪', color: '#6c41d2', followers: 22, rating: 13 },
              { name: 'MMA Circuit', sub: 'Full body', img: '🥊', color: '#d97706', followers: 23, rating: 14 },
              { name: 'Cardio Blast', sub: 'Endurance', img: '🏃', color: '#059669', followers: 24, rating: 15 },
            ].map((trainer, i) => (
              <Link
                key={trainer.name}
                to="/workout"
                className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl hover:bg-white/5 transition-all group animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${400 + i * 60}ms` }}
              >
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                  style={{ background: `${trainer.color}22`, border: `1px solid ${trainer.color}44` }}>
                  {trainer.img}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">{trainer.name}</p>
                  <p className="text-[10px] text-text-muted">{trainer.sub}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] text-text-muted">{trainer.followers}</span>
                    <span className="text-[9px] text-text-muted">·</span>
                    <span className="text-[9px] text-text-muted">{trainer.rating}</span>
                    <span className="text-[9px] text-purple-400 font-semibold ml-auto group-hover:underline">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3 — Fitness Goals + Weight Trend + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">

        {/* Fitness goals */}
        <div className="lg:col-span-5 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-black text-text-primary">Fitness goal</h2>
            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              Today <ChevronDownIcon />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { icon: '🧘', label: 'ABS & Stretch', mins: '12 minutes', sub: 'Core strength training', color: 'card-yellow', mintColor: '#f59e0b' },
              { icon: '🏃', label: 'Lifting & Jogging', mins: '10 minutes', sub: 'Cardio endurance', color: 'card-purple', mintColor: '#8b5cf6' },
              { icon: '💪', label: 'Upper Body', mins: '20 minutes', sub: 'Push & pull day', color: 'card-blue', mintColor: '#60a5fa' },
              { icon: '🦵', label: 'Leg Press', mins: '15 minutes', sub: 'Lower body strength', color: 'card-green', mintColor: '#10b981' },
            ].map(goal => (
              <div key={goal.label}
                className={`${goal.color} p-2.5 sm:p-3.5 rounded-xl hover:scale-[1.02] transition-transform cursor-pointer`}>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/10 flex items-center justify-center text-sm sm:text-base">{goal.icon}</div>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full"
                    style={{ background: `${goal.mintColor}22`, color: goal.mintColor }}>
                    {goal.mins}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-text-primary leading-tight">{goal.label}</p>
                <p className="text-[10px] text-text-muted mt-0.5 truncate">{goal.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weight trend chart */}
        <div className="lg:col-span-4 card card-shadow p-3 sm:p-5 rounded-2xl animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-text-primary">Weight Trend</h2>
              <p className="text-[10px] text-text-muted mt-0.5">Last entries</p>
            </div>
            <div className="text-right">
              <p className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
                {weights[0]?.weight.toFixed(1) ?? '—'}
                <span className="text-xs font-normal text-text-muted ml-1">kg</span>
              </p>
              {weights.length > 1 && (
                <p className={`text-[10px] flex items-center gap-0.5 justify-end mt-0.5 ${
                  weights[0].weight < weights[1].weight ? 'text-green-400' : 'text-red-400'
                }`}>
                  {weights[0].weight < weights[1].weight ? <TrendDownIcon /> : <TrendUpIcon />}
                  {Math.abs(weights[0].weight - weights[1].weight).toFixed(1)} kg
                </p>
              )}
            </div>
          </div>
          {weightTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={weightTrend} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6c41d2"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(170,165,210,0.6)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(170,165,210,0.6)' }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip unit=" kg" />} />
                <Line type="monotone" dataKey="kg" stroke="url(#wGrad)" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6c41d2', strokeWidth: 2, stroke: 'rgb(22,21,38)' }}
                  activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'rgb(22,21,38)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="h-12 w-12 rounded-2xl card-purple flex items-center justify-center text-xl">⚖️</div>
              <p className="text-xs text-text-muted">No weight data yet</p>
              <Link to="/weight" className="text-xs text-purple-400 hover:underline font-semibold">Log weight →</Link>
            </div>
          )}
        </div>

        {/* Quick stats column */}
        <div className="lg:col-span-3 flex flex-col gap-2 sm:gap-3 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '500ms' }}>
          {/* Water */}
          <div className="card card-shadow p-3 sm:p-4 rounded-2xl flex-1">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <p className="text-xs font-bold text-text-primary">Hydration</p>
              <span className="text-[10px] text-blue-400 font-bold">{waterPct}%</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-text-primary tracking-tight mb-2">
              {(waterTotal/1000).toFixed(1)}<span className="text-xs sm:text-sm font-normal text-text-muted ml-1">L</span>
            </p>
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${30 + (i % 4) * 18}%`,
                    background: i < Math.round(waterPct / 10)
                      ? 'linear-gradient(180deg,#60a5fa,#2563eb)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-muted">0L</span>
              <span className="text-[10px] text-text-muted">{waterGoal/1000}L goal</span>
            </div>
          </div>

          {/* Streak */}
          <div className="card-purple p-3 sm:p-4 rounded-2xl flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl gradient-brand flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
              style={{ boxShadow: '0 4px 12px rgba(108,65,210,0.45)' }}>
              🔥
            </div>
            <div>
              <p className="text-xs text-text-muted">Current Streak</p>
              <p className="text-lg sm:text-xl font-black text-text-primary">{progressSummary?.streak.currentStreak ?? 0}
                <span className="text-xs font-normal text-text-muted ml-1">days</span>
              </p>
            </div>
          </div>

          {/* Macros */}
          <div className="card card-shadow p-3 sm:p-4 rounded-2xl flex-1">
            <p className="text-xs font-bold text-text-primary mb-3">Today's Macros</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Protein', val: `${todayNutrition.protein.toFixed(0)}g`, pct: proteinPct, color: '#8b5cf6' },
                { label: 'Carbs',   val: `${todayNutrition.carbs.toFixed(0)}g`,   pct: carbsPct,   color: '#ec4899' },
                { label: 'Fat',     val: `${todayNutrition.fat.toFixed(0)}g`,     pct: 100-proteinPct-carbsPct, color: '#f59e0b' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-text-muted">{m.label}</span>
                    <span className="font-bold text-text-primary">{m.val}</span>
                  </div>
                  <div className="progress-bar" style={{ height: '4px' }}>
                    <div className="progress-bar-fill" style={{ width: `${Math.min(100, m.pct)}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
