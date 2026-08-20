/**
 * WorkoutAnimation — CSS-animated SVG figure + full exercise instructions.
 * Covers every exercise in templates.ts with a unique motion and step-by-step guide.
 */

import { useState } from 'react'

interface Props {
  gender?: 'male' | 'female' | 'other'
  exerciseName?: string
  exerciseId?: string
}

// ── Exercise database ──────────────────────────────────────────────────────────
const EXERCISE_DB: Record<string, {
  motion: 'squat' | 'deadlift' | 'push' | 'pull' | 'curl' | 'press' | 'run' | 'plank' | 'lunge' | 'row' | 'raise' | 'calf' | 'hipthrust'
  muscles: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  tips: string[]
  steps: string[]
}> = {
  bench_press:       { motion: 'push',    muscles: 'Chest · Triceps · Front Delt', difficulty: 'Intermediate', tips: ['Keep shoulder blades retracted', 'Feet flat on floor', 'Bar path slight arc'], steps: ['Lie flat on bench, grip slightly wider than shoulder-width', 'Unrack bar above chest with arms fully extended', 'Lower bar to lower chest, elbows ~75° out', 'Press explosively back to start', 'Repeat for target reps'] },
  incline_bench:     { motion: 'push',    muscles: 'Upper Chest · Front Delt', difficulty: 'Intermediate', tips: ['Bench at 30–45°', 'Control the descent', 'Don\'t bounce off chest'], steps: ['Set bench to 30–45° incline', 'Grip bar slightly wider than shoulders', 'Lower to upper chest under control', 'Press up and slightly back', 'Full extension at top'] },
  db_shoulder_press: { motion: 'press',   muscles: 'Shoulders · Triceps', difficulty: 'Intermediate', tips: ['Don\'t arch back', 'Core braced', 'Controlled descent'], steps: ['Hold dumbbells at shoulder height, palms forward', 'Brace core and press straight overhead', 'Fully extend without locking elbows', 'Lower slowly to shoulder height', 'Repeat'] },
  ohp:               { motion: 'press',   muscles: 'Shoulders · Triceps · Core', difficulty: 'Intermediate', tips: ['Stack bar over mid-foot', 'Squeeze glutes', 'Bar clears chin before head forward'], steps: ['Stand with bar at upper chest, hands just outside shoulders', 'Brace entire body', 'Press bar straight up, head slightly back', 'Lock out overhead', 'Lower under control to collarbone'] },
  lateral_raise:     { motion: 'raise',   muscles: 'Side Deltoids', difficulty: 'Beginner', tips: ['Slight bend in elbows', 'Lead with elbows', 'Don\'t shrug'], steps: ['Stand holding dumbbells at sides', 'Slight bend in elbows', 'Raise arms to shoulder height — no higher', 'Hold 1 second at top', 'Lower slowly in 3 seconds'] },
  tricep_pushdown:   { motion: 'pull',    muscles: 'Triceps', difficulty: 'Beginner', tips: ['Keep elbows fixed', 'Full extension at bottom', 'Control the return'], steps: ['Stand at cable machine, grip bar overhand', 'Elbows at sides — keep them there throughout', 'Push bar down until arms fully extended', 'Squeeze triceps at bottom', 'Return slowly to start'] },
  skull_crusher:     { motion: 'push',    muscles: 'Triceps', difficulty: 'Intermediate', tips: ['Keep elbows pointing ceiling', 'Use spotter for heavy weights', 'Slow negative'], steps: ['Lie on bench holding EZ-bar above chest', 'Bend elbows, lowering bar toward forehead', 'Keep upper arms vertical throughout', 'Extend arms back to start', 'Repeat for reps'] },
  deadlift:          { motion: 'deadlift',muscles: 'Back · Glutes · Hamstrings', difficulty: 'Advanced', tips: ['Bar over mid-foot', 'Neutral spine always', 'Drive floor away'], steps: ['Stand with bar over mid-foot, hip-width stance', 'Hinge, grip just outside legs', 'Brace — chest up, neutral spine', 'Drive through floor, bar stays close', 'Lock out hips at top', 'Hinge back to set down'] },
  pullup:            { motion: 'pull',    muscles: 'Lats · Biceps · Rear Delt', difficulty: 'Intermediate', tips: ['Full dead hang at bottom', 'Drive elbows to pockets', 'Avoid kipping unless trained'], steps: ['Hang from bar, overhand grip shoulder-width', 'Depress and retract scapula', 'Pull until chin clears bar', 'Hold briefly at top', 'Lower fully to dead hang'] },
  bent_row:          { motion: 'row',     muscles: 'Back · Biceps · Rear Delt', difficulty: 'Intermediate', tips: ['Torso ~45°', 'Pull to lower chest', 'Squeeze scapula at top'], steps: ['Hinge at hips, torso ~45°, bar hanging', 'Grip just outside knees', 'Pull bar to lower chest/upper abdomen', 'Squeeze shoulder blades together', 'Lower with control'] },
  lat_pulldown:      { motion: 'pull',    muscles: 'Lats · Biceps', difficulty: 'Beginner', tips: ['Lean back slightly', 'Pull to upper chest', 'Don\'t use momentum'], steps: ['Sit, grip bar wide overhand', 'Slight lean back, chest up', 'Pull bar to upper chest leading with elbows', 'Squeeze lats at bottom', 'Return slowly to full extension'] },
  barbell_curl:      { motion: 'curl',    muscles: 'Biceps · Forearms', difficulty: 'Beginner', tips: ['Keep elbows at sides', 'Don\'t swing', 'Squeeze at top'], steps: ['Stand holding barbell, underhand grip shoulder-width', 'Elbows pinned to sides', 'Curl bar toward shoulders', 'Squeeze biceps at top', 'Lower fully in 3 seconds'] },
  db_curl:           { motion: 'curl',    muscles: 'Biceps', difficulty: 'Beginner', tips: ['Supinate at top', 'Alternate arms or together', 'No swinging'], steps: ['Hold dumbbells at sides, palms in', 'Curl one arm, rotating palm up', 'Squeeze at top', 'Lower slowly', 'Alternate sides'] },
  hammer_curl:       { motion: 'curl',    muscles: 'Biceps · Brachialis · Forearms', difficulty: 'Beginner', tips: ['Neutral grip throughout', 'Elbows stay at sides', 'Controlled tempo'], steps: ['Hold dumbbells, palms facing each other', 'Keep neutral grip throughout — no rotation', 'Curl to shoulder height', 'Squeeze and hold', 'Lower slowly'] },
  squat:             { motion: 'squat',   muscles: 'Quads · Glutes · Hamstrings', difficulty: 'Intermediate', tips: ['Knees track over toes', 'Hip crease below knee at parallel', 'Brace hard before descent'], steps: ['Bar on upper traps, feet shoulder-width', 'Big breath, brace core', 'Break at hips and knees simultaneously', 'Descend until hip crease below knee', 'Drive through floor to stand', 'Exhale at top'] },
  rdl:               { motion: 'deadlift',muscles: 'Hamstrings · Glutes · Erectors', difficulty: 'Intermediate', tips: ['Soft knee bend', 'Bar stays close to body', 'Feel hamstring stretch'], steps: ['Stand holding barbell, feet hip-width', 'Soft bend in knees — maintain throughout', 'Hinge at hips, bar slides down thighs', 'Lower until hamstring stretch (mid-shin)', 'Drive hips forward to stand', 'Squeeze glutes at top'] },
  leg_press:         { motion: 'squat',   muscles: 'Quads · Glutes', difficulty: 'Beginner', tips: ['Don\'t lock knees at top', 'Full range of motion', 'Feet shoulder-width on platform'], steps: ['Sit in machine, feet shoulder-width on platform', 'Release safety handles', 'Lower platform until 90° knee angle', 'Press through heels to start position', 'Don\'t lock knees', 'Repeat'] },
  leg_curl:          { motion: 'lunge',   muscles: 'Hamstrings', difficulty: 'Beginner', tips: ['Full range of motion', 'Squeeze hamstrings at top', 'No hip lift'], steps: ['Lie on machine, pads just above ankles', 'Grip handles', 'Curl legs toward glutes', 'Squeeze hamstrings at full flex', 'Lower slowly to start'] },
  leg_extension:     { motion: 'squat',   muscles: 'Quadriceps', difficulty: 'Beginner', tips: ['Full extension at top', 'Slow negative', 'Don\'t use momentum'], steps: ['Sit in machine, pads just above ankles', 'Grip handles for stability', 'Extend legs to full extension', 'Hold and squeeze quads', 'Lower slowly to 90°'] },
  calf_raise:        { motion: 'calf',    muscles: 'Gastrocnemius · Soleus', difficulty: 'Beginner', tips: ['Full stretch at bottom', 'Pause at top', 'Slow and controlled'], steps: ['Stand on edge of step or platform', 'Lower heels below step for full stretch', 'Rise onto toes as high as possible', 'Hold 2 seconds at top', 'Lower slowly for full stretch'] },
  hip_thrust:        { motion: 'hipthrust',muscles: 'Glutes · Hamstrings', difficulty: 'Intermediate', tips: ['Bar over hip crease with pad', 'Chin tucked, neutral spine', 'Squeeze glutes hard at top'], steps: ['Upper back against bench, bar across hip crease', 'Feet flat, knees 90° at top', 'Drive hips up by squeezing glutes', 'Fully extend hips, hold 1 second', 'Lower under control', 'Don\'t hyperextend spine'] },
  lunge:             { motion: 'lunge',   muscles: 'Quads · Glutes · Balance', difficulty: 'Beginner', tips: ['Keep torso upright', 'Don\'t let front knee pass toe', 'Equal weight distribution'], steps: ['Stand tall, dumbbells at sides', 'Step forward with one leg', 'Lower back knee toward floor', 'Front thigh parallel to floor', 'Push off front foot to return', 'Alternate legs'] },
  plank:             { motion: 'plank',   muscles: 'Core · Glutes · Shoulders', difficulty: 'Beginner', tips: ['Hips level — not up or down', 'Brace as if taking a punch', 'Breathe normally'], steps: ['Forearms on floor, elbows under shoulders', 'Toes on floor, body straight', 'Brace core and squeeze glutes', 'Hold for prescribed time', 'Breathe steadily throughout'] },
  burpee:            { motion: 'run',     muscles: 'Full Body · Cardio', difficulty: 'Intermediate', tips: ['Explosive jump at top', 'Fast hands to floor', 'Land softly'], steps: ['Stand tall', 'Drop hands to floor, jump feet back to plank', 'Perform a push-up (optional)', 'Jump feet back to hands', 'Explode up with a jump and clap overhead', 'Land softly and repeat'] },
  jump_rope:         { motion: 'run',     muscles: 'Calves · Cardio · Coordination', difficulty: 'Beginner', tips: ['Small bounces', 'Wrists do the work', 'Land on balls of feet'], steps: ['Hold handles, rope behind feet', 'Swing rope overhead with wrists', 'Jump 2–4 cm off ground', 'Land on balls of feet', 'Keep elbows close to body', 'Maintain rhythm'] },
  pushup:            { motion: 'push',    muscles: 'Chest · Triceps · Core', difficulty: 'Beginner', tips: ['Straight line from head to heel', 'Elbows 45° from body', 'Full range of motion'], steps: ['Hands slightly wider than shoulders', 'Body straight from head to heels', 'Lower chest to just above floor', 'Push up explosively', 'Lock out at top without sagging hips'] },
  leg_raise:         { motion: 'plank',   muscles: 'Lower Abs · Hip Flexors', difficulty: 'Beginner', tips: ['Keep lower back pressed down', 'Slow negative', 'Control the movement'], steps: ['Lie flat, hands under hips', 'Keep legs straight', 'Raise legs to 90° overhead', 'Lower slowly — stop before touching floor', 'Repeat without momentum'] },
}

function getExerciseData(exerciseName: string, exerciseId?: string) {
  const byId = exerciseId ? EXERCISE_DB[exerciseId] : null
  if (byId) return byId
  const n = exerciseName.toLowerCase()
  for (const [key, val] of Object.entries(EXERCISE_DB)) {
    if (n.includes(key.replace(/_/g, ' ')) || key.replace(/_/g, ' ').includes(n)) return val
  }
  // Fuzzy fallback by motion keywords
  if (/squat|lunge|leg press/.test(n))              return EXERCISE_DB.squat
  if (/deadlift|rdl|romanian/.test(n))              return EXERCISE_DB.deadlift
  if (/push.?up|bench|chest/.test(n))               return EXERCISE_DB.pushup
  if (/pull.?up|pulldown|lat/.test(n))              return EXERCISE_DB.pullup
  if (/curl|bicep|hammer/.test(n))                  return EXERCISE_DB.barbell_curl
  if (/press|shoulder|overhead/.test(n))             return EXERCISE_DB.ohp
  if (/row/.test(n))                                 return EXERCISE_DB.bent_row
  if (/raise/.test(n))                               return EXERCISE_DB.lateral_raise
  if (/calf/.test(n))                                return EXERCISE_DB.calf_raise
  if (/plank|core|ab/.test(n))                       return EXERCISE_DB.plank
  if (/run|hiit|burpee|jump|cardio/.test(n))         return EXERCISE_DB.burpee
  if (/hip thrust/.test(n))                          return EXERCISE_DB.hip_thrust
  return EXERCISE_DB.barbell_curl
}

// ── SVG Figure ─────────────────────────────────────────────────────────────────
function Figure({
  motion, gender, size = 110,
}: {
  motion: string
  gender: 'male' | 'female' | 'other'
  size?: number
}) {
  const isFemale = gender === 'female'
  const skin  = isFemale ? '#f4b896' : '#e8955a'
  const shirt = isFemale ? '#ec4899' : '#8b5cf6'
  const pant  = isFemale ? '#a855f7' : '#3b82f6'
  const hair  = isFemale ? '#92400e' : '#1c1917'
  const shoe  = '#374151'

  const css = `
    @keyframes wSq  { 0%,100%{transform:translateY(0)scaleY(1)}50%{transform:translateY(16px)scaleY(.82)} }
    @keyframes wDl  { 0%,100%{transform:translateY(0)rotate(0deg)}50%{transform:translateY(8px)rotate(-8deg)} }
    @keyframes wPsh { 0%,100%{transform:translateY(0)}50%{transform:translateY(14px)} }
    @keyframes wPul { 0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)} }
    @keyframes wCurl{ 0%,100%{transform:rotate(15deg)}50%{transform:rotate(-65deg)} }
    @keyframes wPrs { 0%,100%{transform:rotate(20deg)}50%{transform:rotate(-130deg)} }
    @keyframes wRun { 0%,100%{transform:rotate(35deg)}50%{transform:rotate(-35deg)} }
    @keyframes wRuR { 0%,100%{transform:rotate(-35deg)}50%{transform:rotate(35deg)} }
    @keyframes wLng { 0%,100%{transform:translateY(0)}50%{transform:translateY(14px)} }
    @keyframes wPlk { 0%,100%{transform:scaleY(1)}50%{transform:scaleY(.92)} }
    @keyframes wClf { 0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)} }
    @keyframes wHip { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-25deg)} }
    @keyframes wRow { 0%,100%{transform:rotate(10deg)}50%{transform:rotate(-50deg)} }
    @keyframes wRaise{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-70deg)} }
    @keyframes wBob { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
    .sq   {animation:wSq   1.2s ease-in-out infinite;transform-origin:40px 95px}
    .dl   {animation:wDl   1.4s ease-in-out infinite;transform-origin:40px 70px}
    .psh  {animation:wPsh  1.0s ease-in-out infinite;transform-origin:40px 80px}
    .pul  {animation:wPul  1.1s ease-in-out infinite;transform-origin:40px 30px}
    .curL {animation:wCurl 1.0s ease-in-out infinite;transform-origin:52px 32px}
    .curR {animation:wCurl 1.0s ease-in-out infinite .5s;transform-origin:28px 32px}
    .prsL {animation:wPrs  1.1s ease-in-out infinite;transform-origin:28px 30px}
    .prsR {animation:wPrs  1.1s ease-in-out infinite .55s;transform-origin:52px 30px}
    .runL {animation:wRun  .52s ease-in-out infinite;transform-origin:35px 55px}
    .runR {animation:wRuR  .52s ease-in-out infinite;transform-origin:45px 55px}
    .raL  {animation:wRaise 1.2s ease-in-out infinite;transform-origin:28px 30px}
    .raR  {animation:wRaise 1.2s ease-in-out infinite .6s;transform-origin:52px 30px}
    .lng  {animation:wLng  1.1s ease-in-out infinite;transform-origin:40px 55px}
    .plk  {animation:wPlk  1.5s ease-in-out infinite;transform-origin:40px 75px}
    .clf  {animation:wClf  0.9s ease-in-out infinite;transform-origin:40px 100px}
    .hip  {animation:wHip  1.2s ease-in-out infinite;transform-origin:40px 65px}
    .row  {animation:wRow  1.0s ease-in-out infinite;transform-origin:52px 35px}
    .bob  {animation:wBob  1.2s ease-in-out infinite}
  `

  // ── Standing figure base ──────────────────────────────────────────────────
  const StandBase = ({ wrapClass = '' }: { wrapClass?: string }) => (
    <g className={wrapClass}>
      {isFemale && <ellipse cx="40" cy="9" rx="13" ry="7" fill={hair} />}
      <circle cx="40" cy="18" r="11" fill={skin} />
      {/* Shirt */}
      <rect x="27" y="29" width="26" height="28" rx="6" fill={shirt} />
      {/* Face */}
      <circle cx="36" cy="16" r="1.5" fill="#5b3a1a" />
      <circle cx="44" cy="16" r="1.5" fill="#5b3a1a" />
      <path d="M37 21 Q40 23 43 21" stroke="#5b3a1a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  )
  const Legs = () => (
    <>
      <line x1="34" y1="57" x2="30" y2="84" stroke={pant} strokeWidth="7" strokeLinecap="round" />
      <line x1="46" y1="57" x2="50" y2="84" stroke={pant} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="29" cy="87" rx="7" ry="3.5" fill={shoe} />
      <ellipse cx="51" cy="87" rx="7" ry="3.5" fill={shoe} />
    </>
  )

  return (
    <div style={{ width: size, height: size * 1.35 }}>
      <style>{css}</style>
      <svg viewBox="0 0 80 120" width={size} height={size * 1.35} xmlns="http://www.w3.org/2000/svg">

        {/* SQUAT */}
        {(motion === 'squat') && (
          <g className="sq">
            <StandBase />
            <line x1="28" y1="34" x2="14" y2="52" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="52" y1="34" x2="66" y2="52" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="34" y1="57" x2="22" y2="80" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <line x1="46" y1="57" x2="58" y2="80" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="21" cy="83" rx="7" ry="3.5" fill={shoe} />
            <ellipse cx="59" cy="83" rx="7" ry="3.5" fill={shoe} />
          </g>
        )}

        {/* DEADLIFT */}
        {motion === 'deadlift' && (
          <g className="dl">
            {isFemale && <ellipse cx="40" cy="9" rx="13" ry="7" fill={hair} />}
            <circle cx="40" cy="18" r="11" fill={skin} />
            <rect x="27" y="29" width="26" height="28" rx="6" fill={shirt} />
            <line x1="28" y1="34" x2="18" y2="55" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="52" y1="34" x2="62" y2="55" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            {/* Bar */}
            <rect x="14" y="58" width="52" height="5" rx="2.5" fill="#374151" />
            <rect x="10" y="54" width="6" height="13" rx="2" fill="#6b7280" />
            <rect x="64" y="54" width="6" height="13" rx="2" fill="#6b7280" />
            <line x1="34" y1="57" x2="30" y2="84" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <line x1="46" y1="57" x2="50" y2="84" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="29" cy="87" rx="7" ry="3.5" fill={shoe} />
            <ellipse cx="51" cy="87" rx="7" ry="3.5" fill={shoe} />
          </g>
        )}

        {/* PUSH (bench press / pushup / skull crusher) */}
        {motion === 'push' && (
          <g className="psh" style={{ transformOrigin: '40px 75px' }}>
            {isFemale && <ellipse cx="12" cy="50" rx="9" ry="6" fill={hair} />}
            <circle cx="12" cy="58" r="9" fill={skin} />
            <rect x="14" y="63" width="44" height="16" rx="6" fill={shirt} />
            <line x1="14" y1="68" x2="4"  y2="84" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="58" y1="68" x2="68" y2="84" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            {/* Bar */}
            <rect x="2" y="82" width="76" height="5" rx="2.5" fill="#374151" />
            <circle cx="5"  cy="84" r="5" fill="#6b7280" />
            <circle cx="75" cy="84" r="5" fill="#6b7280" />
            <rect x="44" y="79" width="20" height="12" rx="4" fill={pant} />
            <ellipse cx="68" cy="91" rx="8" ry="4" fill={shoe} />
          </g>
        )}

        {/* PULL (pull-up / lat pulldown / tricep pushdown) */}
        {motion === 'pull' && (
          <g className="pul">
            {isFemale && <ellipse cx="40" cy="9" rx="13" ry="7" fill={hair} />}
            <circle cx="40" cy="20" r="11" fill={skin} />
            {/* Bar above */}
            <rect x="16" y="3" width="48" height="5" rx="2.5" fill="#374151" />
            {/* Arms up */}
            <line x1="40" y1="9"  x2="28" y2="4"  stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="40" y1="9"  x2="52" y2="4"  stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <rect x="27" y="31" width="26" height="28" rx="6" fill={shirt} />
            <line x1="34" y1="59" x2="30" y2="82" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <line x1="46" y1="59" x2="50" y2="82" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="29" cy="85" rx="7" ry="3.5" fill={shoe} />
            <ellipse cx="51" cy="85" rx="7" ry="3.5" fill={shoe} />
          </g>
        )}

        {/* CURL */}
        {motion === 'curl' && (
          <g className="bob">
            <StandBase />
            {/* Left arm static */}
            <line x1="28" y1="34" x2="18" y2="56" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            {/* Right arm curling */}
            <g className="curL">
              <line x1="52" y1="32" x2="65" y2="54" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
              <rect x="60" y="52" width="14" height="4.5" rx="2" fill="#374151" />
              <rect x="59" y="49" width="5" height="10" rx="1.5" fill="#6b7280" />
              <rect x="69" y="49" width="5" height="10" rx="1.5" fill="#6b7280" />
            </g>
            <Legs />
          </g>
        )}

        {/* PRESS (shoulder press / OHP) */}
        {motion === 'press' && (
          <g className="bob">
            <StandBase />
            <g className="prsL">
              <line x1="28" y1="30" x2="12" y2="12" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
              <rect x="4" y="6" width="16" height="4.5" rx="2" fill="#374151" />
            </g>
            <g className="prsR">
              <line x1="52" y1="30" x2="68" y2="12" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
              <rect x="60" y="6" width="16" height="4.5" rx="2" fill="#374151" />
            </g>
            <Legs />
          </g>
        )}

        {/* ROW */}
        {motion === 'row' && (
          <g>
            {isFemale && <ellipse cx="40" cy="9" rx="13" ry="7" fill={hair} />}
            <circle cx="40" cy="18" r="11" fill={skin} />
            <rect x="27" y="29" width="26" height="24" rx="6" fill={shirt} />
            {/* Hinge body */}
            <g style={{ transform: 'rotate(-40deg)', transformOrigin: '40px 50px' }}>
              {/* Bar */}
              <rect x="12" y="60" width="56" height="5" rx="2.5" fill="#374151" />
              <rect x="8"  y="56" width="7" height="14" rx="2" fill="#6b7280" />
              <rect x="65" y="56" width="7" height="14" rx="2" fill="#6b7280" />
            </g>
            {/* Pull arm */}
            <g className="row">
              <line x1="52" y1="35" x2="64" y2="55" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            </g>
            <line x1="28" y1="35" x2="16" y2="55" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="34" y1="53" x2="30" y2="80" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <line x1="46" y1="53" x2="50" y2="80" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="29" cy="83" rx="7" ry="3.5" fill={shoe} />
            <ellipse cx="51" cy="83" rx="7" ry="3.5" fill={shoe} />
          </g>
        )}

        {/* RAISE (lateral raise) */}
        {motion === 'raise' && (
          <g className="bob">
            <StandBase />
            <g className="raL">
              <line x1="28" y1="30" x2="10" y2="44" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
              <circle cx="8" cy="46" r="5" fill="#6b7280" />
            </g>
            <g className="raR">
              <line x1="52" y1="30" x2="70" y2="44" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
              <circle cx="72" cy="46" r="5" fill="#6b7280" />
            </g>
            <Legs />
          </g>
        )}

        {/* RUN / HIIT */}
        {motion === 'run' && (
          <g className="bob">
            <StandBase />
            <g className="runL" style={{ transformOrigin: '30px 33px' }}>
              <line x1="28" y1="34" x2="16" y2="54" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            </g>
            <g className="runR" style={{ transformOrigin: '52px 33px' }}>
              <line x1="52" y1="34" x2="64" y2="54" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            </g>
            <g className="runL">
              <line x1="34" y1="57" x2="24" y2="82" stroke={pant} strokeWidth="7" strokeLinecap="round" />
              <ellipse cx="22" cy="85" rx="7" ry="3.5" fill={shoe} />
            </g>
            <g className="runR">
              <line x1="46" y1="57" x2="56" y2="82" stroke={pant} strokeWidth="7" strokeLinecap="round" />
              <ellipse cx="58" cy="85" rx="7" ry="3.5" fill={shoe} />
            </g>
          </g>
        )}

        {/* LUNGE */}
        {motion === 'lunge' && (
          <g className="lng">
            <StandBase />
            <line x1="28" y1="34" x2="18" y2="52" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="52" y1="34" x2="62" y2="52" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            {/* Front leg */}
            <line x1="38" y1="57" x2="28" y2="78" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            {/* Back leg */}
            <line x1="44" y1="57" x2="58" y2="84" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="26" cy="81" rx="7" ry="3.5" fill={shoe} />
            <ellipse cx="60" cy="87" rx="7" ry="3.5" fill={shoe} />
          </g>
        )}

        {/* PLANK */}
        {motion === 'plank' && (
          <g className="plk">
            {isFemale && <ellipse cx="10" cy="55" rx="9" ry="6" fill={hair} />}
            <circle cx="10" cy="62" r="9" fill={skin} />
            <rect x="12" y="68" width="50" height="14" rx="6" fill={shirt} />
            {/* Forearms */}
            <line x1="12" y1="72" x2="2"  y2="86" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="28" y1="72" x2="22" y2="86" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <rect x="55" y="76" width="18" height="12" rx="4" fill={pant} />
            <ellipse cx="74" cy="88" rx="8" ry="4" fill={shoe} />
          </g>
        )}

        {/* CALF RAISE */}
        {motion === 'calf' && (
          <g className="clf">
            <StandBase />
            <line x1="28" y1="34" x2="18" y2="52" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="52" y1="34" x2="62" y2="52" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="34" y1="57" x2="32" y2="82" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            <line x1="46" y1="57" x2="48" y2="82" stroke={pant} strokeWidth="7" strokeLinecap="round" />
            {/* Up on toes */}
            <ellipse cx="31" cy="83" rx="5" ry="2" fill={shoe} />
            <ellipse cx="49" cy="83" rx="5" ry="2" fill={shoe} />
            {/* Step edge */}
            <rect x="20" y="88" width="40" height="4" rx="2" fill="#9ca3af" opacity="0.5" />
          </g>
        )}

        {/* HIP THRUST */}
        {motion === 'hipthrust' && (
          <g>
            {/* Bench */}
            <rect x="2" y="68" width="30" height="8" rx="3" fill="#9ca3af" opacity="0.5" />
            {isFemale && <ellipse cx="12" cy="54" rx="9" ry="6" fill={hair} />}
            <circle cx="12" cy="61" r="9" fill={skin} />
            <g className="hip">
              <rect x="14" y="66" width="38" height="14" rx="6" fill={shirt} />
              {/* Bar across hips */}
              <rect x="10" y="70" width="56" height="5" rx="2.5" fill="#374151" />
              <circle cx="10" cy="72" r="6" fill="#6b7280" />
              <circle cx="70" cy="72" r="6" fill="#6b7280" />
              {/* Legs going to floor */}
              <line x1="32" y1="80" x2="26" y2="98" stroke={pant} strokeWidth="7" strokeLinecap="round" />
              <line x1="46" y1="80" x2="52" y2="98" stroke={pant} strokeWidth="7" strokeLinecap="round" />
              <ellipse cx="25" cy="101" rx="7" ry="3.5" fill={shoe} />
              <ellipse cx="53" cy="101" rx="7" ry="3.5" fill={shoe} />
            </g>
          </g>
        )}

      </svg>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WorkoutAnimation({
  gender = 'other',
  exerciseName = '',
  exerciseId,
}: Props) {
  const [showInstructions, setShowInstructions] = useState(false)
  const data = getExerciseData(exerciseName, exerciseId)
  const g = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'other'

  const diffColor = {
    Beginner:     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    Intermediate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    Advanced:     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }[data.difficulty]

  return (
    <div className="flex flex-col items-center w-full">
      {/* Animation + info header */}
      <div className="flex items-center gap-4 w-full">
        {/* SVG figure */}
        <div className="flex-shrink-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-3 flex items-center justify-center" style={{ minWidth: 100 }}>
          <Figure motion={data.motion} gender={g} size={90} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffColor}`}>
              {data.difficulty}
            </span>
          </div>
          <p className="text-xs font-semibold text-text-secondary mb-2 leading-snug">{data.muscles}</p>

          {/* Tips */}
          <div className="flex flex-col gap-0.5">
            {data.tips.slice(0, 2).map((tip, i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="text-purple-500 text-[10px] mt-0.5">✦</span>
                <p className="text-[10px] text-text-muted leading-snug">{tip}</p>
              </div>
            ))}
          </div>

          {/* Instructions toggle */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="mt-2 flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors"
          >
            <span className={`transition-transform duration-200 ${showInstructions ? 'rotate-90' : ''}`}>▶</span>
            {showInstructions ? 'Hide' : 'How to perform'}
          </button>
        </div>
      </div>

      {/* Step-by-step instructions panel */}
      {showInstructions && (
        <div className="w-full mt-3 bg-surface2 border border-border rounded-2xl p-4 animate-fade-in">
          <p className="text-xs font-bold text-text-primary mb-3 flex items-center gap-1.5">
            <span>📋</span> Step-by-step instructions
          </p>
          <ol className="flex flex-col gap-2">
            {data.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          {data.tips.length > 2 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] font-bold text-text-secondary mb-1.5">💡 Pro tips</p>
              {data.tips.slice(2).map((tip, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <span className="text-yellow-500 text-[10px]">★</span>
                  <p className="text-[10px] text-text-muted">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
