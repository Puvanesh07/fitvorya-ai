/**
 * PageLoader — unique themed loader per page/section.
 *
 * Usage:  <PageLoader variant="dashboard" />
 * Default variant is "default" (generic branded loader).
 */

export type LoaderVariant =
  | 'default'
  | 'dashboard'
  | 'workout'
  | 'nutrition'
  | 'weight'
  | 'progress'
  | 'baby'
  | 'pregnancy'
  | 'family'
  | 'profile'

interface Props {
  variant?: LoaderVariant
  /** Optional label override */
  label?: string
}

// ── Shared wrapper ────────────────────────────────────────────────────────────
function Wrap({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {children}
        <p className="text-xs text-text-muted font-semibold tracking-wide">{label}</p>
      </div>
    </div>
  )
}

// ── Default / Dashboard — triple orbit ───────────────────────────────────────
function OrbitLoader({ color1 = '#8b5cf6', color2 = '#ec4899', color3 = '#60a5fa', label }: {
  color1?: string; color2?: string; color3?: string; label: string
}) {
  return (
    <Wrap label={label}>
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        {/* Centre brand dot */}
        <div style={{
          position: 'absolute', inset: 0, margin: 'auto',
          width: 18, height: 18, borderRadius: '50%',
          background: `linear-gradient(135deg, ${color1}, ${color2})`,
          boxShadow: `0 0 16px ${color1}60`,
        }} />
        {/* Three orbiting dots */}
        {[
          { color: color1, anim: 'orbit  1.4s linear infinite' },
          { color: color2, anim: 'orbit2 1.4s linear infinite' },
          { color: color3, anim: 'orbit3 1.4s linear infinite' },
        ].map((o, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, margin: 'auto',
            width: 8, height: 8, borderRadius: '50%',
            background: o.color,
            boxShadow: `0 0 8px ${o.color}`,
            animation: o.anim,
          }} />
        ))}
      </div>
    </Wrap>
  )
}

// ── Workout — vertical equaliser bars ────────────────────────────────────────
function EqualizerLoader({ label }: { label: string }) {
  const bars = [
    { h: 28, delay: '0ms',   color: '#ec4899' },
    { h: 40, delay: '80ms',  color: '#8b5cf6' },
    { h: 20, delay: '160ms', color: '#f97316' },
    { h: 44, delay: '80ms',  color: '#8b5cf6' },
    { h: 32, delay: '0ms',   color: '#ec4899' },
  ]
  return (
    <Wrap label={label}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 48 }}>
        {bars.map((b, i) => (
          <div key={i} style={{
            width: 7, height: b.h, borderRadius: 4,
            background: b.color,
            boxShadow: `0 0 8px ${b.color}80`,
            transformOrigin: 'bottom',
            animation: `bar-eq 0.9s ease-in-out infinite`,
            animationDelay: b.delay,
          }} />
        ))}
      </div>
    </Wrap>
  )
}

// ── Nutrition — pulse ring with fork/spoon emoji ──────────────────────────────
function PulseRingLoader({ emoji, color, label }: { emoji: string; color: string; label: string }) {
  return (
    <Wrap label={label}>
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Two expanding rings */}
        {[0, 400].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: `pulse-ring 1.6s cubic-bezier(0.2,0.6,0.4,1) infinite`,
            animationDelay: `${delay}ms`,
          }} />
        ))}
        {/* Centre emoji */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: `${color}18`,
          border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {emoji}
        </div>
      </div>
    </Wrap>
  )
}

// ── Weight — morphing blob ────────────────────────────────────────────────────
function MorphLoader({ label }: { label: string }) {
  return (
    <Wrap label={label}>
      <div style={{ position: 'relative', width: 58, height: 58 }}>
        <div style={{
          width: 58, height: 58,
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          boxShadow: '0 0 24px rgba(245,158,11,0.45)',
          animation: 'morph 3s ease-in-out infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          ⚖️
        </div>
      </div>
    </Wrap>
  )
}

// ── Progress — animated chart bars ───────────────────────────────────────────
function ChartBarsLoader({ label }: { label: string }) {
  const cols = [
    { h: 18, color: '#60a5fa', delay: '0ms'   },
    { h: 30, color: '#8b5cf6', delay: '120ms' },
    { h: 22, color: '#60a5fa', delay: '240ms' },
    { h: 40, color: '#ec4899', delay: '120ms' },
    { h: 28, color: '#8b5cf6', delay: '0ms'   },
    { h: 36, color: '#60a5fa', delay: '240ms' },
  ]
  return (
    <Wrap label={label}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 48, padding: '0 4px' }}>
        {cols.map((c, i) => (
          <div key={i} style={{
            width: 9, borderRadius: '4px 4px 2px 2px',
            background: `linear-gradient(to top, ${c.color}cc, ${c.color})`,
            boxShadow: `0 0 8px ${c.color}60`,
            height: c.h,
            animation: `bar-eq 1.1s ease-in-out infinite`,
            animationDelay: c.delay,
          }} />
        ))}
      </div>
    </Wrap>
  )
}

// ── Baby — wave dots (gentle / playful) ──────────────────────────────────────
function WaveDotsLoader({ colors, label }: { colors: string[]; label: string }) {
  return (
    <Wrap label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {colors.map((c, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: c,
            boxShadow: `0 0 10px ${c}80`,
            animation: `wave-dot 1.2s ease-in-out infinite`,
            animationDelay: `${i * 140}ms`,
          }} />
        ))}
      </div>
    </Wrap>
  )
}

// ── Pregnancy — heartbeat + ripple ───────────────────────────────────────────
function HeartbeatLoader({ label }: { label: string }) {
  return (
    <Wrap label={label}>
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ripple rings */}
        {[0, 500, 1000].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid #f472b6',
            animation: `ripple 1.8s ease-out infinite`,
            animationDelay: `${delay}ms`,
          }} />
        ))}
        {/* Heart emoji */}
        <div style={{
          fontSize: 26,
          animation: 'heartbeat 1.4s ease-in-out infinite',
          filter: 'drop-shadow(0 0 8px #f472b680)',
        }}>
          🤰
        </div>
      </div>
    </Wrap>
  )
}

// ── Family — 3-person orbit ───────────────────────────────────────────────────
function FamilyOrbitLoader({ label }: { label: string }) {
  return (
    <Wrap label={label}>
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        {/* Centre home */}
        <div style={{
          position: 'absolute', inset: 0, margin: 'auto',
          width: 20, height: 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #34d399)',
          boxShadow: '0 0 14px rgba(16,185,129,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11,
        }}>🏠</div>
        {[
          { emoji: '👨', anim: 'orbit  1.6s linear infinite', color: '#10b981' },
          { emoji: '👩', anim: 'orbit2 1.6s linear infinite', color: '#34d399' },
          { emoji: '👶', anim: 'orbit3 1.6s linear infinite', color: '#6ee7b7' },
        ].map((o, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, margin: 'auto',
            width: 16, height: 16, borderRadius: '50%',
            background: o.color + '22',
            border: `1.5px solid ${o.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9,
            animation: o.anim,
            boxShadow: `0 0 6px ${o.color}60`,
          }}>
            {o.emoji}
          </div>
        ))}
      </div>
    </Wrap>
  )
}

// ── Profile — scanning silhouette ────────────────────────────────────────────
function ScanLoader({ label }: { label: string }) {
  return (
    <Wrap label={label}>
      <div style={{ position: 'relative', width: 48, height: 60, overflow: 'hidden' }}>
        {/* Silhouette */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(251,146,60,0.25)', border: '1.5px solid rgba(251,146,60,0.5)' }} />
          <div style={{ width: 32, height: 28, borderRadius: '8px 8px 4px 4px', background: 'rgba(251,146,60,0.2)', border: '1.5px solid rgba(251,146,60,0.4)' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 14, borderRadius: 3, background: 'rgba(251,146,60,0.2)', border: '1.5px solid rgba(251,146,60,0.35)' }} />
            <div style={{ width: 12, height: 14, borderRadius: 3, background: 'rgba(251,146,60,0.2)', border: '1.5px solid rgba(251,146,60,0.35)' }} />
          </div>
        </div>
        {/* Scan line */}
        <div style={{
          position: 'absolute', left: -4, right: -4, height: 2,
          background: 'linear-gradient(90deg, transparent, #fb923c, #fb923c, transparent)',
          boxShadow: '0 0 8px #fb923c',
          animation: 'scan 1.6s ease-in-out infinite',
        }} />
      </div>
    </Wrap>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PageLoader({ variant = 'default', label }: Props) {
  switch (variant) {
    case 'dashboard':
      return <OrbitLoader color1="#8b5cf6" color2="#ec4899" color3="#60a5fa" label={label ?? 'Loading dashboard…'} />

    case 'workout':
      return <EqualizerLoader label={label ?? 'Loading workouts…'} />

    case 'nutrition':
      return <PulseRingLoader emoji="🥗" color="#10b981" label={label ?? 'Loading nutrition…'} />

    case 'weight':
      return <MorphLoader label={label ?? 'Loading weight history…'} />

    case 'progress':
      return <ChartBarsLoader label={label ?? 'Loading progress…'} />

    case 'baby':
      return <WaveDotsLoader colors={['#20c3be', '#38bdf8', '#20c3be', '#6ee7b7', '#38bdf8']} label={label ?? 'Loading Baby AI…'} />

    case 'pregnancy':
      return <HeartbeatLoader label={label ?? 'Loading Pregnancy AI…'} />

    case 'family':
      return <FamilyOrbitLoader label={label ?? 'Loading Family AI…'} />

    case 'profile':
      return <ScanLoader label={label ?? 'Loading profile…'} />

    default:
      return <OrbitLoader color1="#8b5cf6" color2="#ec4899" color3="#60a5fa" label={label ?? 'Loading…'} />
  }
}
