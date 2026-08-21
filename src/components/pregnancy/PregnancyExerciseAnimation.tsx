/**
 * PregnancyExerciseAnimation
 *
 * CSS-animated SVG figure + step-by-step instruction panel.
 * Same architecture as WorkoutAnimation.tsx but covers pregnancy-safe
 * exercises: walking, pelvic floor, cat-cow, bird-dog, wall squat,
 * side-lying leg raise, breathing, shoulder rolls, calf raise, child's pose.
 *
 * The animated figure is always female + bump-aware (third-trimester belly
 * is slightly larger). No AI generates the instructions — all content is
 * human-reviewed and baked into EXERCISE_DB below.
 */

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Motion =
  | 'walk'
  | 'pelvic'
  | 'catcow'
  | 'birddog'
  | 'wallsquat'
  | 'sidelying'
  | 'breathing'
  | 'shoulder'
  | 'calf'
  | 'childs'
  | 'kegel'
  | 'march'

export interface PregnancyExercise {
  id:                  string
  name:                string
  category:            'warmup' | 'strength' | 'mobility' | 'breathing' | 'rest'
  motion:              Motion
  durationMin:         number
  reps?:               string        // e.g. "10–12 reps"
  difficulty:          'Gentle' | 'Moderate'
  trimesterSuitable:   (1 | 2 | 3)[]
  muscles:             string
  pregnancyNote:       string
  safetyNote:          string
  steps:               string[]
  tips:                string[]
  activityLevels:      ('beginner' | 'moderate' | 'active')[]
}

// ── Exercise database ──────────────────────────────────────────────────────────

export const PREGNANCY_EXERCISES: PregnancyExercise[] = [
  {
    id: 'brisk_walk', name: 'Brisk Walk', category: 'warmup', motion: 'walk',
    durationMin: 10, difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Full body · Cardiovascular system',
    pregnancyNote: 'Excellent for all trimesters. Slow pace as bump grows if balance feels off.',
    safetyNote: 'Stop if dizzy, short of breath beyond normal, or contractions start.',
    steps: [
      'Wear supportive, flat shoes with good grip.',
      'Walk at a pace where you can still hold a conversation.',
      'Keep shoulders relaxed and arms swinging naturally.',
      'Land midfoot — not on your heel or toes.',
      'Take shorter strides as your bump grows for better balance.',
    ],
    tips: ['Start with 10 min; build to 30 min if comfortable', 'Early morning or evening avoids heat', 'Bring water'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'marching', name: 'Standing March', category: 'warmup', motion: 'march',
    durationMin: 5, reps: '20 marches', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Hip flexors · Core · Balance',
    pregnancyNote: 'Great low-impact warm-up. Use a wall for balance in T3.',
    safetyNote: 'Hold a wall or chair if balance is uncertain.',
    steps: [
      'Stand tall with feet hip-width apart, hand on wall for support.',
      'Lift your right knee to hip height (or as comfortable).',
      'Lower and repeat on the left.',
      'Alternate knees in a slow, controlled march.',
      'Keep core gently braced — don\'t hold your breath.',
    ],
    tips: ['Arms can swing opposite to legs', 'Don\'t force high knees in T3', 'Breathe steadily'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'pelvic_tilt', name: 'Pelvic Tilt', category: 'strength', motion: 'pelvic',
    durationMin: 5, reps: '10–15 reps', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Pelvic floor · Lower back · Deep core',
    pregnancyNote: 'Relieves lower back ache — one of the safest pregnancy exercises.',
    safetyNote: 'Perform slowly. Never flatten your back forcefully. Stop if back pain worsens.',
    steps: [
      'Sit on a birth ball or stand with back flat against a wall.',
      'Inhale to prepare.',
      'Exhale and gently tuck your pelvis forward, flattening the lower back.',
      'Hold for 3 seconds, then release.',
      'Repeat 10–15 times in a slow, controlled rhythm.',
    ],
    tips: ['Can also be done on all-fours', 'Imagine your pelvis is a bowl — tip water forward', 'Great for back pain relief'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'kegel', name: 'Kegel Exercise', category: 'strength', motion: 'kegel',
    durationMin: 5, reps: '10 holds × 5 sec', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Pelvic floor muscles',
    pregnancyNote: 'Strengthens pelvic floor for birth and recovery. Can be done anywhere.',
    safetyNote: 'Never hold breath. Don\'t tighten stomach, buttocks, or thighs — isolate pelvic floor only.',
    steps: [
      'Sit comfortably or lie on your side.',
      'Identify pelvic floor muscles — imagine stopping urine flow.',
      'Gently squeeze and lift those muscles upward.',
      'Hold for 5 seconds, then fully release for 5 seconds.',
      'Repeat 10 times. Aim for 3 sets per day.',
    ],
    tips: ['Full release is as important as the squeeze', 'Do them while watching TV or resting', 'Build to 10-second holds over weeks'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'cat_cow', name: 'Cat-Cow Stretch', category: 'mobility', motion: 'catcow',
    durationMin: 5, reps: '10 slow cycles', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Spine · Lower back · Hips · Core',
    pregnancyNote: 'Reduces back ache and helps baby position. Safe throughout all trimesters.',
    safetyNote: 'Keep wrists under shoulders, knees under hips. Don\'t over-arch in T3.',
    steps: [
      'Start on all-fours: wrists under shoulders, knees under hips.',
      'Inhale — let your belly drop toward the floor, lift your head and tailbone (Cow).',
      'Exhale — round your spine toward the ceiling, tuck chin and pelvis (Cat).',
      'Flow smoothly between the two positions.',
      'Repeat 10 slow cycles, following your breath.',
    ],
    tips: ['Move only as far as comfortable', 'Great first thing in the morning', 'Can also help with baby positioning in T3'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'bird_dog', name: 'Bird-Dog', category: 'strength', motion: 'birddog',
    durationMin: 6, reps: '8 each side', difficulty: 'Moderate', trimesterSuitable: [1,2],
    muscles: 'Deep core · Glutes · Erector spinae · Balance',
    pregnancyNote: 'Excellent core stability. Best in T1–T2. May be modified on a bench in T3.',
    safetyNote: 'Stop if you feel hip or pelvic pain. Keep hips level — no rotation.',
    steps: [
      'On all-fours, wrists under shoulders, knees under hips.',
      'Brace core gently — imagine pulling belly button up.',
      'Extend your right arm forward and left leg back simultaneously.',
      'Hold level for 2 seconds — hips must not rotate.',
      'Return slowly, then switch sides.',
      'Complete 8 repetitions each side.',
    ],
    tips: ['Use a mirror to check hip level', 'Slow and controlled beats fast', 'Modify on a bench if floor is uncomfortable in T3'],
    activityLevels: ['moderate','active'],
  },
  {
    id: 'wall_squat', name: 'Wall Squat', category: 'strength', motion: 'wallsquat',
    durationMin: 6, reps: '10–12 reps', difficulty: 'Moderate', trimesterSuitable: [1,2,3],
    muscles: 'Quads · Glutes · Hamstrings · Pelvic floor',
    pregnancyNote: 'Wall provides support and takes stress off lower back. Great for birth prep.',
    safetyNote: 'Keep knees tracking over toes. Don\'t go below 90° in T3. Stop if pelvic pain.',
    steps: [
      'Stand with your back flat against a wall, feet 30 cm away, hip-width apart.',
      'Slide your back down the wall until thighs are parallel to floor (or as far as comfortable).',
      'Hold for 5–10 seconds, squeezing glutes and engaging pelvic floor.',
      'Press through heels to slide back up.',
      'Repeat 10–12 times with controlled breathing.',
    ],
    tips: ['Place a small ball between knees for inner-thigh engagement', 'Hold longer for endurance', 'Great for birth prep in T3'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'side_leg_raise', name: 'Side-Lying Leg Raise', category: 'strength', motion: 'sidelying',
    durationMin: 6, reps: '12 each side', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Outer hip · Glutes · Abductors',
    pregnancyNote: 'Side-lying removes pressure from the uterus. Ideal in T2–T3 to avoid lying flat.',
    safetyNote: 'Use a pillow between knees for comfort. Stop if hip or pelvic pain occurs.',
    steps: [
      'Lie on your side with a pillow between your knees and one under your head.',
      'Stack hips and keep a slight bend in the lower knee.',
      'Keep top leg straight and foot flexed.',
      'Lift top leg to hip height — no higher.',
      'Lower slowly. Complete 12 reps, then switch sides.',
    ],
    tips: ['Flex foot to activate glutes more', 'Keep hips stacked — don\'t roll back', 'Pillow between knees prevents pelvic girdle pain'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'diaphragm_breathing', name: 'Diaphragmatic Breathing', category: 'breathing', motion: 'breathing',
    durationMin: 5, reps: '5 min / 10 cycles', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Diaphragm · Pelvic floor · Nervous system',
    pregnancyNote: 'Reduces anxiety, trains pelvic floor coordination, prepares for labour breathing.',
    safetyNote: 'Never hyperventilate. If dizzy, pause and breathe normally.',
    steps: [
      'Sit comfortably or lie on your left side.',
      'Place one hand on your chest, one on your belly.',
      'Inhale slowly through your nose for 4 counts — belly rises, chest stays still.',
      'Exhale slowly through pursed lips for 6 counts — belly falls.',
      'Feel the pelvic floor gently lower on inhale and lift on exhale.',
      'Repeat for 10 cycles or 5 minutes.',
    ],
    tips: ['Belly breathing — not chest breathing', '4 in : 6 out rhythm is calming', 'Practice during stress or before sleep'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'shoulder_rolls', name: 'Shoulder Rolls & Neck Stretch', category: 'mobility', motion: 'shoulder',
    durationMin: 4, reps: '10 rolls each direction', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Shoulders · Neck · Upper back',
    pregnancyNote: 'Relieves upper back and neck tension from postural changes as bump grows.',
    safetyNote: 'Move slowly and smoothly. Don\'t roll head backward fully.',
    steps: [
      'Sit or stand tall with arms relaxed at sides.',
      'Roll both shoulders forward in big, slow circles × 10.',
      'Reverse — roll backward × 10.',
      'Gently drop your right ear toward your right shoulder. Hold 20 seconds.',
      'Repeat on the left side.',
    ],
    tips: ['Do these every hour when sitting at a desk', 'Breathe throughout', 'Great paired with diaphragm breathing'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'calf_raise_preg', name: 'Calf Raise (Chair Support)', category: 'strength', motion: 'calf',
    durationMin: 5, reps: '15–20 reps', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Calves · Circulation · Ankle stability',
    pregnancyNote: 'Reduces swelling and improves circulation — great for the third trimester.',
    safetyNote: 'Hold a chair for balance. Stop if any calf pain or cramping.',
    steps: [
      'Stand behind a chair, hands lightly on the back for balance.',
      'Feet hip-width apart, parallel.',
      'Rise onto your toes as high as comfortable.',
      'Hold for 2 seconds at the top.',
      'Lower slowly and fully — heels back to floor.',
      'Repeat 15–20 times.',
    ],
    tips: ['Slow descent is key for calf strength', 'Great for reducing ankle swelling', 'Can be done on a step for greater range'],
    activityLevels: ['beginner','moderate','active'],
  },
  {
    id: 'childs_pose', name: "Child's Pose", category: 'rest', motion: 'childs',
    durationMin: 3, reps: 'Hold 30–60 sec', difficulty: 'Gentle', trimesterSuitable: [1,2,3],
    muscles: 'Lower back · Hips · Inner thighs · Spine',
    pregnancyNote: 'Modified with knees wide to accommodate bump. Excellent cool-down and stress reliever.',
    safetyNote: 'Widen knees to make room for bump. Stop if pressure on abdomen is felt.',
    steps: [
      'Kneel on a mat with knees wide enough to accommodate your bump.',
      'Sit back toward your heels (as far as comfortable).',
      'Walk hands forward and lower forehead to the mat (or a folded blanket).',
      'Let your back broaden and your spine lengthen.',
      'Breathe slowly and hold for 30–60 seconds.',
    ],
    tips: ['Place a pillow under your chest if forehead doesn\'t reach mat', 'Great after any session', 'Can hold up to 2–3 minutes'],
    activityLevels: ['beginner','moderate','active'],
  },
]

// ── Weekly plan template ───────────────────────────────────────────────────────

type DayFocus = 'walking' | 'strength' | 'mobility' | 'breathing' | 'rest'

const WEEKLY_FOCUS: Record<string, DayFocus> = {
  Mon: 'walking',   Tue: 'strength', Wed: 'mobility',
  Thu: 'breathing', Fri: 'walking',  Sat: 'strength', Sun: 'rest',
}

export function buildDailySession(params: {
  week: number
  activityLevel: 'beginner' | 'moderate' | 'active'
  dayOfWeek: string
}): { isRestDay: boolean; exercises: PregnancyExercise[]; totalMinutes: number } {
  const { week, activityLevel, dayOfWeek } = params
  const focus = WEEKLY_FOCUS[dayOfWeek] ?? 'rest'
  if (focus === 'rest') return { isRestDay: true, exercises: [], totalMinutes: 0 }

  const trimester: 1|2|3 = week <= 13 ? 1 : week <= 27 ? 2 : 3

  const pool = PREGNANCY_EXERCISES.filter(ex =>
    ex.trimesterSuitable.includes(trimester) &&
    ex.activityLevels.includes(activityLevel)
  )

  const pick = (cat: PregnancyExercise['category'], count = 1) =>
    pool.filter(e => e.category === cat).slice(0, count)

  let session: PregnancyExercise[] = []

  if (focus === 'walking') {
    session = [
      ...pick('warmup', 1),
      ...pick('strength', 1),
      ...pick('breathing', 1),
    ]
  } else if (focus === 'strength') {
    session = [
      ...pick('warmup', 1),
      ...pick('strength', activityLevel === 'beginner' ? 2 : 3),
      ...pick('rest', 1),
    ]
  } else if (focus === 'mobility') {
    session = [
      ...pick('warmup', 1),
      ...pick('mobility', 2),
      ...pick('breathing', 1),
    ]
  } else if (focus === 'breathing') {
    session = [
      ...pick('breathing', 1),
      ...pick('mobility', 1),
      ...pick('rest', 1),
    ]
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = session.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })

  return {
    isRestDay:    false,
    exercises:    unique,
    totalMinutes: unique.reduce((s, e) => s + e.durationMin, 0),
  }
}

// ── CSS animations ─────────────────────────────────────────────────────────────

const ANIM_CSS = `
  @keyframes pregWalk  { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-6px)} }
  @keyframes pregWalkL { 0%,100%{transform:rotate(20deg)}   50%{transform:rotate(-20deg)}  }
  @keyframes pregWalkR { 0%,100%{transform:rotate(-20deg)}  50%{transform:rotate(20deg)}   }
  @keyframes pregPelv  { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(-10deg)}  }
  @keyframes pregCatC  { 0%,100%{transform:scaleY(1)translateY(0)}    50%{transform:scaleY(0.88)translateY(6px)} }
  @keyframes pregBreath{ 0%,100%{transform:scale(1)}        50%{transform:scale(1.12)}     }
  @keyframes pregShldr { 0%,25%{transform:rotate(0deg)} 50%{transform:rotate(-18deg)} 75%{transform:rotate(-10deg)} 100%{transform:rotate(0deg)} }
  @keyframes pregCalf  { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-12px)} }
  @keyframes pregLeg   { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-16px)} }
  @keyframes pregBob   { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-4px)}  }
  @keyframes pregChild { 0%,100%{transform:scaleY(1)}       50%{transform:scaleY(0.95)}    }
  @keyframes pregMarch { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(-35deg)}  }
  @keyframes pregMarchR{ 0%,100%{transform:rotate(-35deg)}  50%{transform:rotate(0deg)}    }
  @keyframes pregKegel { 0%,100%{transform:scaleX(1) scaleY(1)} 50%{transform:scaleX(0.95) scaleY(1.05)} }
  @keyframes pregBird  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-4px) rotate(-5deg)} }
  @keyframes pregWallSq{ 0%,100%{transform:translateY(0)}   50%{transform:translateY(14px)} }

  .pa-walk   {animation:pregBob    1.0s ease-in-out infinite}
  .pa-walkL  {animation:pregWalkL  0.5s ease-in-out infinite; transform-origin:34px 58px}
  .pa-walkR  {animation:pregWalkR  0.5s ease-in-out infinite; transform-origin:46px 58px}
  .pa-march  {animation:pregBob    0.8s ease-in-out infinite}
  .pa-marchL {animation:pregMarch  0.6s ease-in-out infinite; transform-origin:34px 58px}
  .pa-marchR {animation:pregMarchR 0.6s ease-in-out infinite; transform-origin:46px 58px}
  .pa-pelv   {animation:pregPelv   1.2s ease-in-out infinite; transform-origin:40px 65px}
  .pa-catcow {animation:pregCatC   1.4s ease-in-out infinite; transform-origin:40px 60px}
  .pa-breath {animation:pregBreath 2.0s ease-in-out infinite; transform-origin:40px 50px}
  .pa-shldrL {animation:pregShldr  1.0s ease-in-out infinite; transform-origin:28px 30px}
  .pa-shldrR {animation:pregShldr  1.0s ease-in-out infinite 0.5s; transform-origin:52px 30px}
  .pa-calf   {animation:pregCalf   0.9s ease-in-out infinite; transform-origin:40px 95px}
  .pa-sidelg {animation:pregLeg    1.1s ease-in-out infinite; transform-origin:40px 65px}
  .pa-child  {animation:pregChild  2.0s ease-in-out infinite; transform-origin:40px 75px}
  .pa-kegel  {animation:pregKegel  1.5s ease-in-out infinite; transform-origin:40px 60px}
  .pa-bird   {animation:pregBird   1.3s ease-in-out infinite; transform-origin:40px 55px}
  .pa-wallsq {animation:pregWallSq 1.3s ease-in-out infinite; transform-origin:40px 55px}
`

// ── Shared figure colours ──────────────────────────────────────────────────────

const skin  = '#f4b896'
const hair  = '#92400e'
const shirt = '#ec4899'   // pink — pregnancy theme
const pant  = '#a855f7'
const shoe  = '#374151'
const bump  = '#fce7f3'   // pale pink bump

// ── SVG Figure ─────────────────────────────────────────────────────────────────

function PregFigure({ motion, week, size = 110 }: { motion: Motion; week: number; size?: number }) {
  const isBig = week >= 28   // T3 — bigger bump radius

  // Shared body parts
  const Head = () => (
    <>
      <ellipse cx="40" cy="9" rx="12" ry="7" fill={hair} />
      <circle cx="40" cy="18" r="10" fill={skin} />
      <circle cx="36.5" cy="16" r="1.3" fill="#5b3a1a" />
      <circle cx="43.5" cy="16" r="1.3" fill="#5b3a1a" />
      <path d="M37.5 21 Q40 23 42.5 21" stroke="#5b3a1a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </>
  )
  const Torso = ({ bumpR = 0 }: { bumpR?: number }) => (
    <>
      <rect x="27" y="28" width="26" height="26" rx="6" fill={shirt} />
      {bumpR > 0 && <ellipse cx="40" cy="50" rx={bumpR} ry={bumpR * 0.8} fill={bump} opacity="0.85" />}
    </>
  )
  const Arms = ({ spread = 0 }: { spread?: number }) => (
    <>
      <line x1="28" y1="33" x2={18 - spread} y2={52 + spread} stroke={skin} strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="33" x2={62 + spread} y2={52 + spread} stroke={skin} strokeWidth="5" strokeLinecap="round" />
    </>
  )
  const Legs = () => (
    <>
      <line x1="35" y1="54" x2="30" y2="80" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="45" y1="54" x2="50" y2="80" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
      <ellipse cx="29" cy="83" rx="6.5" ry="3" fill={shoe} />
      <ellipse cx="51" cy="83" rx="6.5" ry="3" fill={shoe} />
    </>
  )

  const bumpR = isBig ? 13 : 10

  return (
    <div style={{ width: size, height: size * 1.35 }}>
      <style>{ANIM_CSS}</style>
      <svg viewBox="0 0 80 115" width={size} height={size * 1.35} xmlns="http://www.w3.org/2000/svg">

        {/* WALK */}
        {motion === 'walk' && (
          <g className="pa-walk">
            <Head />
            <Torso bumpR={bumpR} />
            <line x1="28" y1="33" x2="16" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="52" y1="33" x2="64" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <g className="pa-walkL"><line x1="35" y1="54" x2="24" y2="80" stroke={pant} strokeWidth="6.5" strokeLinecap="round" /><ellipse cx="22" cy="83" rx="6.5" ry="3" fill={shoe} /></g>
            <g className="pa-walkR"><line x1="45" y1="54" x2="56" y2="80" stroke={pant} strokeWidth="6.5" strokeLinecap="round" /><ellipse cx="58" cy="83" rx="6.5" ry="3" fill={shoe} /></g>
          </g>
        )}

        {/* MARCH */}
        {motion === 'march' && (
          <g className="pa-march">
            <Head />
            <Torso bumpR={bumpR} />
            <line x1="28" y1="33" x2="16" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="52" y1="33" x2="64" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="45" y1="54" x2="50" y2="80" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <ellipse cx="51" cy="83" rx="6.5" ry="3" fill={shoe} />
            <g className="pa-marchL" style={{ transformOrigin: '35px 54px' }}>
              <line x1="35" y1="54" x2="30" y2="70" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <ellipse cx="29" cy="73" rx="6.5" ry="3" fill={shoe} />
            </g>
          </g>
        )}

        {/* PELVIC TILT — seated on ball */}
        {motion === 'pelvic' && (
          <g>
            <ellipse cx="40" cy="98" rx="22" ry="12" fill="#8b5cf6" opacity="0.35" />
            <g className="pa-pelv">
              <Head />
              <Torso bumpR={bumpR} />
              <line x1="28" y1="33" x2="18" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
              <line x1="52" y1="33" x2="62" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
              <line x1="35" y1="54" x2="28" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <line x1="45" y1="54" x2="52" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <ellipse cx="27" cy="81" rx="6.5" ry="3" fill={shoe} />
              <ellipse cx="53" cy="81" rx="6.5" ry="3" fill={shoe} />
            </g>
          </g>
        )}

        {/* KEGEL — seated still, belly pulses */}
        {motion === 'kegel' && (
          <g>
            <ellipse cx="40" cy="98" rx="22" ry="12" fill="#8b5cf6" opacity="0.35" />
            <Head />
            <rect x="27" y="28" width="26" height="26" rx="6" fill={shirt} />
            <g className="pa-kegel"><ellipse cx="40" cy="50" rx={bumpR} ry={bumpR * 0.8} fill={bump} opacity="0.85" /></g>
            <line x1="28" y1="33" x2="18" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="52" y1="33" x2="62" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="35" y1="54" x2="28" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <line x1="45" y1="54" x2="52" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <ellipse cx="27" cy="81" rx="6.5" ry="3" fill={shoe} />
            <ellipse cx="53" cy="81" rx="6.5" ry="3" fill={shoe} />
          </g>
        )}

        {/* CAT-COW — all fours */}
        {motion === 'catcow' && (
          <g className="pa-catcow">
            {/* head sideways */}
            <ellipse cx="10" cy="52" rx="9" ry="6" fill={hair} />
            <circle cx="10" cy="60" r="9" fill={skin} />
            {/* spine */}
            <rect x="14" y="58" width="48" height="12" rx="5" fill={shirt} />
            {/* bump hanging down */}
            <ellipse cx="38" cy="73" rx={bumpR * 0.9} ry={isBig ? 9 : 7} fill={bump} opacity="0.85" />
            {/* arms */}
            <line x1="14" y1="63" x2="4"  y2="80" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="28" y1="63" x2="22" y2="80" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            {/* legs */}
            <line x1="52" y1="70" x2="52" y2="88" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <line x1="62" y1="70" x2="62" y2="88" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
          </g>
        )}

        {/* BIRD-DOG — all fours + one arm/leg out */}
        {motion === 'birddog' && (
          <g className="pa-bird">
            <ellipse cx="14" cy="50" rx="9" ry="6" fill={hair} />
            <circle cx="14" cy="58" r="9" fill={skin} />
            <rect x="18" y="57" width="38" height="12" rx="5" fill={shirt} />
            <ellipse cx="37" cy="72" rx={bumpR * 0.85} ry={isBig ? 8 : 6} fill={bump} opacity="0.85" />
            {/* right arm extends forward */}
            <line x1="18" y1="62" x2="4"  y2="56" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            {/* left arm down */}
            <line x1="32" y1="62" x2="26" y2="78" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            {/* right leg back extended */}
            <line x1="56" y1="68" x2="74" y2="62" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            {/* left leg down */}
            <line x1="50" y1="69" x2="50" y2="88" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
          </g>
        )}

        {/* WALL SQUAT */}
        {motion === 'wallsquat' && (
          <>
            {/* Wall */}
            <rect x="66" y="0" width="6" height="115" fill="#374151" opacity="0.25" rx="2" />
            <g className="pa-wallsq">
              <Head />
              <Torso bumpR={bumpR} />
              <Arms />
              <line x1="35" y1="54" x2="24" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <line x1="45" y1="54" x2="56" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <ellipse cx="23" cy="81" rx="6.5" ry="3" fill={shoe} />
              <ellipse cx="57" cy="81" rx="6.5" ry="3" fill={shoe} />
            </g>
          </>
        )}

        {/* SIDE-LYING LEG RAISE */}
        {motion === 'sidelying' && (
          <g>
            {/* body horizontal */}
            <ellipse cx="10" cy="62" rx="9" ry="6" fill={hair} />
            <circle cx="10" cy="70" r="9" fill={skin} />
            <rect x="14" y="68" width="44" height="13" rx="5" fill={shirt} />
            <ellipse cx="36" cy="79" rx={bumpR * 0.9} ry={isBig ? 8 : 6} fill={bump} opacity="0.85" />
            {/* lower leg */}
            <line x1="52" y1="81" x2="72" y2="85" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            {/* raised top leg */}
            <g className="pa-sidelg" style={{ transformOrigin: '52px 78px' }}>
              <line x1="52" y1="78" x2="72" y2="72" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <ellipse cx="74" cy="71" rx="6.5" ry="3" fill={shoe} />
            </g>
            <ellipse cx="74" cy="88" rx="6.5" ry="3" fill={shoe} />
            {/* arm up as pillow */}
            <line x1="14" y1="72" x2="4" y2="60" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="26" y1="72" x2="20" y2="86" stroke={skin} strokeWidth="5" strokeLinecap="round" />
          </g>
        )}

        {/* DIAPHRAGMATIC BREATHING — seated, belly expanding */}
        {motion === 'breathing' && (
          <g>
            <ellipse cx="40" cy="98" rx="22" ry="12" fill="#8b5cf6" opacity="0.25" />
            <Head />
            <rect x="27" y="28" width="26" height="26" rx="6" fill={shirt} />
            {/* breathing belly pulses */}
            <g className="pa-breath" style={{ transformOrigin: '40px 50px' }}>
              <ellipse cx="40" cy="50" rx={bumpR} ry={bumpR * 0.8} fill={bump} opacity="0.85" />
            </g>
            {/* hands on belly */}
            <line x1="28" y1="33" x2="30" y2="50" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="52" y1="33" x2="50" y2="50" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            {/* breath ring expanding */}
            <circle cx="40" cy="50" r="18" fill="none" stroke="#ec4899" strokeWidth="1.5" opacity="0.25" className="pa-breath" />
            <line x1="35" y1="54" x2="28" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <line x1="45" y1="54" x2="52" y2="78" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <ellipse cx="27" cy="81" rx="6.5" ry="3" fill={shoe} />
            <ellipse cx="53" cy="81" rx="6.5" ry="3" fill={shoe} />
          </g>
        )}

        {/* SHOULDER ROLLS — standing */}
        {motion === 'shoulder' && (
          <g className="pa-bob" style={{ animation: 'pregBob 1.2s ease-in-out infinite' }}>
            <Head />
            <Torso bumpR={bumpR} />
            <g className="pa-shldrL"><line x1="28" y1="33" x2="14" y2="48" stroke={skin} strokeWidth="5" strokeLinecap="round" /></g>
            <g className="pa-shldrR"><line x1="52" y1="33" x2="66" y2="48" stroke={skin} strokeWidth="5" strokeLinecap="round" /></g>
            <Legs />
          </g>
        )}

        {/* CALF RAISE — standing with chair suggestion */}
        {motion === 'calf' && (
          <>
            <rect x="2" y="90" width="10" height="25" rx="2" fill="#9ca3af" opacity="0.4" />
            <rect x="2" y="87" width="22" height="5" rx="2" fill="#9ca3af" opacity="0.4" />
            <g className="pa-calf">
              <Head />
              <Torso bumpR={bumpR} />
              <line x1="28" y1="33" x2="16" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
              {/* hand on chair */}
              <line x1="28" y1="52" x2="14" y2="88" stroke={skin} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
              <line x1="52" y1="33" x2="62" y2="52" stroke={skin} strokeWidth="5" strokeLinecap="round" />
              <line x1="35" y1="54" x2="32" y2="80" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <line x1="45" y1="54" x2="48" y2="80" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
              <ellipse cx="31" cy="81" rx="5" ry="2.5" fill={shoe} />
              <ellipse cx="49" cy="81" rx="5" ry="2.5" fill={shoe} />
            </g>
          </>
        )}

        {/* CHILD'S POSE — kneeling, arms forward */}
        {motion === 'childs' && (
          <g className="pa-child">
            <ellipse cx="8" cy="62" rx="8" ry="5" fill={hair} />
            <circle cx="8" cy="70" r="8" fill={skin} />
            {/* arms stretched forward */}
            <line x1="12" y1="72" x2="2"  y2="86" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            <line x1="20" y1="72" x2="10" y2="86" stroke={skin} strokeWidth="5" strokeLinecap="round" />
            {/* torso low */}
            <rect x="12" y="71" width="38" height="11" rx="5" fill={shirt} />
            <ellipse cx="31" cy="80" rx={bumpR * 0.8} ry={isBig ? 7 : 5} fill={bump} opacity="0.75" />
            {/* knees + hips */}
            <line x1="44" y1="82" x2="50" y2="98" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <line x1="50" y1="82" x2="60" y2="98" stroke={pant} strokeWidth="6.5" strokeLinecap="round" />
            <ellipse cx="50" cy="101" rx="7" ry="3.5" fill={shoe} />
            <ellipse cx="61" cy="101" rx="7" ry="3.5" fill={shoe} />
          </g>
        )}

      </svg>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

interface Props {
  exercise: PregnancyExercise
  week: number
  size?: number
}

export default function PregnancyExerciseAnimation({ exercise, week, size = 100 }: Props) {
  const [showSteps, setShowSteps] = useState(false)

  const diffStyle = exercise.difficulty === 'Gentle'
    ? { bg: 'rgb(16 185 129 / 0.12)', color: 'rgb(110 231 183)', border: 'rgb(16 185 129 / 0.25)' }
    : { bg: 'rgb(234 179 8 / 0.12)',  color: 'rgb(253 224 71)',   border: 'rgb(234 179 8 / 0.25)'  }

  return (
    <div className="flex flex-col w-full">

      {/* Animation + info row */}
      <div className="flex items-start gap-4 w-full">

        {/* Animated figure */}
        <div className="flex-shrink-0 flex items-center justify-center rounded-2xl p-3"
          style={{ background: 'rgb(244 114 182 / 0.08)', border: '1px solid rgb(244 114 182 / 0.15)', minWidth: size + 16 }}>
          <PregFigure motion={exercise.motion} week={week} size={size} />
        </div>

        {/* Info panel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.border}` }}>
              {exercise.difficulty}
            </span>
            {exercise.reps && (
              <span className="g-badge">{exercise.reps}</span>
            )}
            <span className="g-badge">{exercise.durationMin} min</span>
          </div>

          <p className="text-xs font-semibold text-text-secondary mb-2 leading-snug">{exercise.muscles}</p>

          {/* Tips preview */}
          <div className="flex flex-col gap-0.5 mb-2">
            {exercise.tips.slice(0, 2).map((tip, i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="text-pink-400 text-[10px] mt-0.5 flex-shrink-0">✦</span>
                <p className="text-[10px] text-text-muted leading-snug">{tip}</p>
              </div>
            ))}
          </div>

          {/* Toggle */}
          <button
            onClick={() => setShowSteps(s => !s)}
            className="flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 transition-colors">
            <span className="transition-transform duration-200" style={{ display: 'inline-block', transform: showSteps ? 'rotate(90deg)' : 'none' }}>▶</span>
            {showSteps ? 'Hide steps' : 'How to perform'}
          </button>
        </div>
      </div>

      {/* Steps panel */}
      {showSteps && (
        <div className="w-full mt-3 rounded-2xl p-4 animate-slide-up"
          style={{ background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.08)' }}>

          <p className="text-xs font-bold text-text-primary mb-3 flex items-center gap-1.5">
            <span>📋</span> Step-by-step
          </p>

          <ol className="flex flex-col gap-2 mb-3">
            {exercise.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
                  {i + 1}
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          {/* Pregnancy note */}
          <div className="rounded-xl p-2.5 mb-2"
            style={{ background: 'rgb(244 114 182 / 0.1)', border: '1px solid rgb(244 114 182 / 0.2)' }}>
            <p className="text-[11px] text-pink-300 leading-relaxed">🤰 {exercise.pregnancyNote}</p>
          </div>

          {/* Safety note */}
          <div className="g-disclaimer">
            ⚠️ {exercise.safetyNote}
          </div>
        </div>
      )}
    </div>
  )
}
