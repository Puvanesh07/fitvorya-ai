import type { Exercise } from '../types/workout'

export const EXERCISES: Exercise[] = [
  // ── CHEST ─────────────────────────────────────────────────────────────────
  {
    id: 'bench_press', name: 'Barbell Bench Press',
    muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'barbell', category: 'strength',
    instructions: ['Lie flat on bench', 'Grip bar slightly wider than shoulder-width', 'Lower bar to mid-chest', 'Press explosively back up'],
    tips: 'Keep feet flat on floor, slight arch in lower back.',
  },
  {
    id: 'incline_bench', name: 'Incline Bench Press',
    muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'barbell', category: 'hypertrophy',
    instructions: ['Set bench to 30–45°', 'Grip slightly wider than shoulder-width', 'Lower to upper chest', 'Press up and slightly back'],
  },
  {
    id: 'db_bench', name: 'Dumbbell Bench Press',
    muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Lie flat, dumbbells at chest level', 'Press up until arms nearly straight', 'Lower slowly with control'],
    tips: 'Greater range of motion than barbell.',
  },
  {
    id: 'db_fly', name: 'Dumbbell Fly',
    muscleGroup: 'chest', equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Lie flat, arms above chest', 'Lower dumbbells in wide arc', 'Feel stretch, bring back up'],
    tips: 'Keep slight bend in elbows throughout.',
  },
  {
    id: 'pushup', name: 'Push-Up',
    muscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders', 'core'],
    equipment: 'bodyweight', category: 'strength',
    instructions: ['Hands shoulder-width apart', 'Lower chest to floor', 'Push back up, maintain straight body'],
  },
  {
    id: 'cable_fly', name: 'Cable Fly',
    muscleGroup: 'chest', equipment: 'cable', category: 'hypertrophy',
    instructions: ['Set cables at chest height', 'Step forward, hands forward', 'Bring hands together in front of chest'],
  },
  // ── BACK ──────────────────────────────────────────────────────────────────
  {
    id: 'deadlift', name: 'Barbell Deadlift',
    muscleGroup: 'back', secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: 'barbell', category: 'strength',
    instructions: ['Feet hip-width, bar over mid-foot', 'Hinge at hips, grip just outside legs', 'Drive through floor, lock out at top'],
    tips: 'Keep bar close to body throughout the lift.',
  },
  {
    id: 'pullup', name: 'Pull-Up',
    muscleGroup: 'back', secondaryMuscles: ['biceps'],
    equipment: 'bodyweight', category: 'strength',
    instructions: ['Hang from bar with overhand grip', 'Pull chest to bar', 'Lower with control'],
  },
  {
    id: 'chinup', name: 'Chin-Up',
    muscleGroup: 'back', secondaryMuscles: ['biceps'],
    equipment: 'bodyweight', category: 'strength',
    instructions: ['Underhand grip, shoulder-width', 'Pull until chin clears bar', 'Lower slowly'],
  },
  {
    id: 'bent_row', name: 'Barbell Bent-Over Row',
    muscleGroup: 'back', secondaryMuscles: ['biceps', 'core'],
    equipment: 'barbell', category: 'strength',
    instructions: ['Hinge at hips, back parallel to floor', 'Pull bar to lower chest', 'Squeeze shoulder blades'],
  },
  {
    id: 'db_row', name: 'Single-Arm Dumbbell Row',
    muscleGroup: 'back', secondaryMuscles: ['biceps'],
    equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Brace on bench with opposite knee and hand', 'Pull dumbbell to hip', 'Lower with control'],
  },
  {
    id: 'lat_pulldown', name: 'Lat Pulldown',
    muscleGroup: 'back', secondaryMuscles: ['biceps'],
    equipment: 'cable', category: 'hypertrophy',
    instructions: ['Grip wide bar wider than shoulder-width', 'Pull to upper chest, lean back slightly', 'Control the ascent'],
  },
  {
    id: 'seated_cable_row', name: 'Seated Cable Row',
    muscleGroup: 'back', secondaryMuscles: ['biceps'],
    equipment: 'cable', category: 'hypertrophy',
    instructions: ['Sit upright, feet on platform', 'Pull handle to abdomen', 'Squeeze and control return'],
  },
  // ── SHOULDERS ─────────────────────────────────────────────────────────────
  {
    id: 'ohp', name: 'Overhead Press (Barbell)',
    muscleGroup: 'shoulders', secondaryMuscles: ['triceps', 'core'],
    equipment: 'barbell', category: 'strength',
    instructions: ['Bar at collar bone, grip just outside shoulders', 'Press straight up', 'Lock out arms at top'],
    tips: 'Brace core, squeeze glutes for stability.',
  },
  {
    id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press',
    muscleGroup: 'shoulders', secondaryMuscles: ['triceps'],
    equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Dumbbells at ear level', 'Press overhead until arms extended', 'Lower with control'],
  },
  {
    id: 'lateral_raise', name: 'Lateral Raise',
    muscleGroup: 'shoulders', equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Start with dumbbells at sides', 'Raise to shoulder height', 'Lower slowly'],
    tips: 'Slight bend in elbows, lead with elbows not wrists.',
  },
  {
    id: 'front_raise', name: 'Front Raise',
    muscleGroup: 'shoulders', equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Arms in front at shoulder height', 'Raise one or both dumbbells', 'Lower with control'],
  },
  {
    id: 'face_pull', name: 'Face Pull',
    muscleGroup: 'shoulders', secondaryMuscles: ['back'],
    equipment: 'cable', category: 'hypertrophy',
    instructions: ['Set cable at head height', 'Pull rope to face, elbows high', 'External rotate at peak'],
  },
  // ── BICEPS ────────────────────────────────────────────────────────────────
  {
    id: 'barbell_curl', name: 'Barbell Curl',
    muscleGroup: 'biceps', equipment: 'barbell', category: 'hypertrophy',
    instructions: ['Stand, grip shoulder-width', 'Curl bar to shoulder height', 'Lower slowly'],
  },
  {
    id: 'db_curl', name: 'Dumbbell Curl',
    muscleGroup: 'biceps', equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Alternate or both arms', 'Curl to shoulder, supinate wrist', 'Lower with control'],
  },
  {
    id: 'hammer_curl', name: 'Hammer Curl',
    muscleGroup: 'biceps', secondaryMuscles: ['forearms'],
    equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Neutral grip (thumbs up)', 'Curl to shoulder', 'Lower slowly'],
  },
  {
    id: 'preacher_curl', name: 'Preacher Curl',
    muscleGroup: 'biceps', equipment: 'machine', category: 'hypertrophy',
    instructions: ['Pad under upper arms', 'Curl up, squeeze peak', 'Lower fully to stretch'],
  },
  // ── TRICEPS ───────────────────────────────────────────────────────────────
  {
    id: 'close_grip_bench', name: 'Close-Grip Bench Press',
    muscleGroup: 'triceps', secondaryMuscles: ['chest'],
    equipment: 'barbell', category: 'strength',
    instructions: ['Grip shoulder-width or narrower', 'Lower to lower chest', 'Press explosively'],
  },
  {
    id: 'tricep_pushdown', name: 'Tricep Pushdown',
    muscleGroup: 'triceps', equipment: 'cable', category: 'hypertrophy',
    instructions: ['High cable, grip bar or rope', 'Push down until arms straight', 'Control the return'],
  },
  {
    id: 'skull_crusher', name: 'Skull Crusher',
    muscleGroup: 'triceps', equipment: 'barbell', category: 'hypertrophy',
    instructions: ['Lie flat, bar above forehead', 'Lower to forehead hinging at elbows', 'Extend back up'],
  },
  {
    id: 'dips', name: 'Tricep Dips',
    muscleGroup: 'triceps', secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'bodyweight', category: 'strength',
    instructions: ['Grip parallel bars, lean slightly forward', 'Lower until 90° at elbow', 'Press back up'],
  },
  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    id: 'plank', name: 'Plank',
    muscleGroup: 'core', equipment: 'bodyweight', category: 'strength',
    instructions: ['Forearms on floor, body straight', 'Hold position', 'Breathe steadily'],
    tips: 'Do not let hips sag or pike up.',
  },
  {
    id: 'crunch', name: 'Crunch',
    muscleGroup: 'core', equipment: 'bodyweight', category: 'hypertrophy',
    instructions: ['Lie on back, knees bent', 'Curl shoulder blades off floor', 'Lower with control'],
  },
  {
    id: 'leg_raise', name: 'Hanging Leg Raise',
    muscleGroup: 'core', equipment: 'bodyweight', category: 'strength',
    instructions: ['Hang from bar', 'Raise legs to 90° or higher', 'Lower slowly'],
  },
  {
    id: 'ab_wheel', name: 'Ab Wheel Rollout',
    muscleGroup: 'core', equipment: 'other', category: 'strength',
    instructions: ['Kneel, hands on wheel', 'Roll forward until body near floor', 'Pull back using core'],
  },
  // ── QUADS ─────────────────────────────────────────────────────────────────
  {
    id: 'squat', name: 'Barbell Back Squat',
    muscleGroup: 'quads', secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: 'barbell', category: 'strength',
    instructions: ['Bar on upper traps', 'Squat below parallel', 'Drive through heels to stand'],
    tips: 'Knees track over toes, chest up.',
  },
  {
    id: 'front_squat', name: 'Front Squat',
    muscleGroup: 'quads', secondaryMuscles: ['core', 'glutes'],
    equipment: 'barbell', category: 'strength',
    instructions: ['Bar on front delts, elbows high', 'Squat deep', 'Drive up keeping torso upright'],
  },
  {
    id: 'leg_press', name: 'Leg Press',
    muscleGroup: 'quads', secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'machine', category: 'hypertrophy',
    instructions: ['Feet shoulder-width on platform', 'Lower to 90°', 'Press through heels'],
  },
  {
    id: 'lunge', name: 'Dumbbell Lunge',
    muscleGroup: 'quads', secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell', category: 'hypertrophy',
    instructions: ['Step forward', 'Lower back knee near floor', 'Drive front foot to return'],
  },
  {
    id: 'leg_extension', name: 'Leg Extension',
    muscleGroup: 'quads', equipment: 'machine', category: 'hypertrophy',
    instructions: ['Sit, pad on lower shin', 'Extend legs fully', 'Lower with control'],
  },
  // ── HAMSTRINGS ────────────────────────────────────────────────────────────
  {
    id: 'rdl', name: 'Romanian Deadlift',
    muscleGroup: 'hamstrings', secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell', category: 'hypertrophy',
    instructions: ['Hinge at hips, slight knee bend', 'Lower bar along legs', 'Feel stretch, drive hips forward'],
  },
  {
    id: 'leg_curl', name: 'Leg Curl',
    muscleGroup: 'hamstrings', equipment: 'machine', category: 'hypertrophy',
    instructions: ['Lie face down', 'Curl heels to glutes', 'Lower slowly'],
  },
  {
    id: 'nordic_curl', name: 'Nordic Curl',
    muscleGroup: 'hamstrings', equipment: 'bodyweight', category: 'strength',
    instructions: ['Anchor feet, kneel upright', 'Lower body forward slowly', 'Use hands to push back up'],
  },
  // ── GLUTES ────────────────────────────────────────────────────────────────
  {
    id: 'hip_thrust', name: 'Hip Thrust',
    muscleGroup: 'glutes', secondaryMuscles: ['hamstrings'],
    equipment: 'barbell', category: 'hypertrophy',
    instructions: ['Upper back on bench, bar on hips', 'Drive hips up to full extension', 'Squeeze glutes at top'],
  },
  {
    id: 'glute_bridge', name: 'Glute Bridge',
    muscleGroup: 'glutes', equipment: 'bodyweight', category: 'hypertrophy',
    instructions: ['Lie on back, knees bent', 'Drive hips up', 'Squeeze glutes, hold 1s'],
  },
  // ── CALVES ────────────────────────────────────────────────────────────────
  {
    id: 'calf_raise', name: 'Standing Calf Raise',
    muscleGroup: 'calves', equipment: 'machine', category: 'hypertrophy',
    instructions: ['Stand on platform, toes on edge', 'Rise onto toes', 'Lower below platform for full stretch'],
  },
  // ── CARDIO ────────────────────────────────────────────────────────────────
  {
    id: 'treadmill_run', name: 'Treadmill Run',
    muscleGroup: 'cardio', equipment: 'machine', category: 'cardio',
    instructions: ['Set speed and incline', 'Maintain steady pace', 'Log duration as reps, weight as speed (km/h)'],
  },
  {
    id: 'rowing', name: 'Rowing Machine',
    muscleGroup: 'cardio', secondaryMuscles: ['back', 'core'],
    equipment: 'machine', category: 'cardio',
    instructions: ['Drive with legs first', 'Then lean back, pull handle to abdomen', 'Return in reverse order'],
  },
  {
    id: 'jump_rope', name: 'Jump Rope',
    muscleGroup: 'cardio', secondaryMuscles: ['calves'],
    equipment: 'other', category: 'hiit',
    instructions: ['Keep elbows close to body', 'Jump with both feet or alternate', 'Log duration as reps'],
  },
  {
    id: 'burpee', name: 'Burpee',
    muscleGroup: 'full_body', secondaryMuscles: ['cardio', 'core'],
    equipment: 'bodyweight', category: 'hiit',
    instructions: ['Drop to plank, do push-up', 'Jump feet to hands', 'Explode up with jump and arm raise'],
  },
]

export const EXERCISE_MAP = new Map(EXERCISES.map(e => [e.id, e]))

export function getExercisesByMuscle(muscle: string) {
  return EXERCISES.filter(e => e.muscleGroup === muscle)
}

export function searchExercises(query: string) {
  const q = query.toLowerCase()
  return EXERCISES.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.muscleGroup.includes(q) ||
    e.equipment.includes(q),
  )
}
