/**
 * buildExerciseCatalog.mjs — one-time dev script (run with: node scripts/buildExerciseCatalog.mjs)
 *
 * Downloads the full public exercise list from wger.de (CC-BY-SA, no API key),
 * fuzzy-matches every exercise used in FitTracker (workout templates, exercise
 * library, pregnancy plan) and writes src/data/exerciseMedia.ts with real
 * animation links (H.264 demo videos / animated webp illustrations).
 *
 * The generated file is committed — no runtime API dependency.
 */

import { readFile, writeFile } from 'node:fs/promises'

const API = 'https://wger.de/api/v2/exerciseinfo/'
const OUT = new URL('../src/data/exerciseMedia.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')

// ── 1. Collect local exercises (id + name) from source files ─────────────────
const LOCAL_FILES = [
  '../src/data/exercises.ts',
  '../src/data/templates.ts',
  '../src/components/pregnancy/PregnancyExerciseAnimation.tsx',
]

async function collectLocalExercises() {
  const found = new Map() // id -> name
  for (const rel of LOCAL_FILES) {
    const src = await readFile(new URL(rel, import.meta.url), 'utf8')
    // exercises.ts / pregnancy: { id: 'x', name: 'Y' } (may span lines)
    for (const m of src.matchAll(/id:\s*'([a-z0-9_]+)',\s*name:\s*'([^']+)'/gi)) {
      if (!found.has(m[1])) found.set(m[1], m[2])
    }
    // templates.ts: exerciseId / exerciseName pairs
    for (const m of src.matchAll(/exerciseId:\s*'([a-z0-9_]+)',\s*exerciseName:\s*'([^']+)'/gi)) {
      if (!found.has(m[1])) found.set(m[1], m[2])
    }
  }
  return found
}

// ── 2. Download the wger catalog (paginated, public) ─────────────────────────
async function fetchWger() {
  const cache = new URL('./.wger-cache.json', import.meta.url)
  try {
    const cached = JSON.parse(await readFile(cache, 'utf8'))
    console.log(`  using cached catalog (${cached.length} exercises) — delete scripts/.wger-cache.json to refresh`)
    return cached
  } catch { /* no cache yet */ }
  const all = []
  let next = `${API}?language=eng&limit=100&offset=0`
  while (next) {
    process.stdout.write(`  fetching ${next} ... `)
    const res = await fetch(next, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`wger HTTP ${res.status}`)
    const page = await res.json()
    all.push(...page.results)
    console.log(`${page.results.length} (total ${all.length}/${page.count})`)
    next = page.next
  }
  await writeFile(cache, JSON.stringify(all))
  return all
}

function pickEnglishName(ex) {
  const tr = ex.translations?.find(t => t.language === 2) || ex.translations?.[0]
  return tr?.name || null
}

/** Best demo video: prefer small H.264 mp4/webm that browsers can autoplay. */
function pickVideo(ex) {
  const vids = ex.videos || []
  if (!vids.length) return null
  const score = v => {
    let s = 0
    const url = (v.video || '').toLowerCase()
    if (/\.mp4$|\.webm$/.test(url)) s += 4
    if ((v.codec_long || '').includes('Advanced Video') || (v.codec || '') === 'h264') s += 4
    if (v.is_main) s += 2
    if ((v.size || 0) < 12_000_000) s += 2
    if ((v.size || 0) > 40_000_000) s -= 4
    return s
  }
  const best = [...vids].sort((a, b) => score(b) - score(a))[0]
  const playable = score(best) >= 8 // must be web-compatible container+codec
  return { url: best.video, thumb: best.video, playable }
}

function pickImage(ex) {
  const imgs = ex.images || []
  if (!imgs.length) return null
  const main = imgs.find(i => i.is_main) || imgs[0]
  return { url: main.image, thumb: main.thumbnails?.medium || main.thumbnails?.small || main.image }
}

// ── 3. Detect animated webp (VP8X "animation" flag) via ranged fetch ─────────
async function isAnimatedWebp(url) {
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-63' } })
    if (!res.ok && res.status !== 206) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 30) return false
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return false
    // scan top-level chunks for VP8X
    let off = 12
    while (off + 8 <= buf.length) {
      const id = buf.toString('ascii', off, off + 4)
      const size = buf.readUInt32LE(off + 4)
      if (id === 'VP8X') return (buf[off + 8] & 0x02) !== 0 // animation bit
      if (id === 'ANIM') return true
      off += 8 + size + (size % 2)
    }
    return false
  } catch {
    return false
  }
}

// ── 4. Fuzzy matching ─────────────────────────────────────────────────────────
const STOP = new Set(['barbell','barbellw','dumbbell','dumbbells','db','cable','machine','band','bands','bodyweight','weighted','with','the','of','and','bent','over'])

const norm = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
const stem = t => t.replace(/(es|s)$/, '') || t
const core = s => norm(s).filter(t => !STOP.has(t)).map(stem)
const jac = (a, b) => {
  const A = new Set(a), B = new Set(b)
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / (new Set([...A, ...B]).size || 1)
}

// Manual overrides where fuzzy matching is unreliable (local id -> exact wger name).
// Every name here was verified against the downloaded catalog.
const OVERRIDES = {
  bench_press: 'Bench Press',
  incline_bench: 'Incline Bench Press - Barbell',
  db_bench: 'Bench Press',
  close_grip_bench: 'Bench Press Narrow Grip',
  db_shoulder_press: 'Shoulder Press, Dumbbells',
  ohp: 'Overhead Barbell Press',
  lateral_raise: 'Lateral Raises',
  tricep_pushdown: 'Tricep Pushdown on Cable',
  skull_crusher: 'Skullcrusher SZ-bar',
  bent_row: 'Bent Over Rowing',
  db_row: 'Single arm row',
  seated_cable_row: 'Seated Cable Row',
  rowing: 'Rowing, T-bar',
  lat_pulldown: 'Close-grip supinated lat pulldown',
  barbell_curl: 'Biceps Curls With Barbell',
  db_curl: 'Biceps Curls With Dumbbell',
  hammer_curl: 'Hammer Curls',
  preacher_curl: 'Preacher Curls',
  squat: 'Barbell Full Squat',
  front_squat: 'Dumbbell Front Squat',
  rdl: 'Romanian Deadlift',
  deadlift: 'Deadlifts',
  leg_press: 'Leg Press',
  leg_curl: 'Leg Curls (laying)',
  leg_extension: 'Leg Extension',
  hip_thrust: 'Hip Thrust',
  glute_bridge: 'Glute Bridge',
  calf_raise: 'Standing Calf Raises',
  calf_raise_preg: 'Standing Calf Raises',
  pullup: 'Pull-ups',
  chinup: 'Chin Up',
  burpee: 'Burpee',
  pushup: 'Push-Up',
  dips: 'Dips',
  plank: 'Plank',
  crunch: 'Crunches',
  ab_wheel: 'Barbell Ab Rollout',
  leg_raise: 'Leg Raises, Lying',
  jump_rope: 'Skipping Rope',
  treadmill_run: 'Treadmill Cardio',
  lunge: 'Lunges',
  face_pull: 'Dumbbell Bent Over Face Pull',
  bird_dog: 'Bird Dog',
  front_raise: 'Front Raises',
  marching: 'Marching High Knees',
}

// Fuzzy matches we deliberately reject (wrong exercise despite similar name)
const SKIP = new Set(['nordic_curl'])

function matchLocal(name, wgerList) {
  const ct = core(name)
  if (!ct.length) return null
  let best = null, bestScore = 0
  for (const w of wgerList) {
    const wt = core(w.name)
    if (!wt.length) continue
    let s = Math.max(jac(norm(name), norm(w.name)), jac(ct, wt))
    // token containment bonus: every core token of the shorter name appears in the other
    if (ct.length && (wt.every(t => ct.includes(t)) || ct.every(t => wt.includes(t)))) s = Math.max(s, 0.85)
    if (w.video?.playable) s += 0.06 // prefer a browser-playable demo video on ties
    else if (w.video) s += 0.03
    if (s > bestScore) { bestScore = s; best = w }
  }
  return bestScore >= 0.62 ? { entry: best, score: bestScore } : null
}

// ── main ───────────────────────────────────────────────────────────────────────
console.log('Collecting local exercises...')
const local = await collectLocalExercises()
console.log(`  ${local.size} local exercises`)

console.log('Downloading wger.de catalog...')
const raw = await fetchWger()
const wgerList = raw
  .map(ex => ({
    ex,
    id: ex.id,
    name: pickEnglishName(ex),
    video: pickVideo(ex),
    image: pickImage(ex),
  }))
  .filter(w => w.name && (w.video || w.image)) // only exercises we can actually show
console.log(`  ${wgerList.length} wger exercises with media (${wgerList.filter(w => w.video).length} with video)`)

console.log('Matching...')
const entries = []
const unmatched = []
for (const [lid, lname] of local) {
  if (lid.startsWith('tpl_') || SKIP.has(lid)) continue // templates / rejected fuzzy matches
  let hit = null
  const wantName = OVERRIDES[lid]
  if (wantName) {
    const exact = wgerList.find(w => norm(w.name).join(' ') === norm(wantName).join(' '))
    if (exact) hit = { entry: exact, score: 1 }
  }
  if (!hit) hit = matchLocal(lname, wgerList)
  if (!hit) { unmatched.push(`${lid} (${lname})`); continue }
  const { entry } = hit
  const image = entry.image ? { ...entry.image } : null
  if (image && image.url.endsWith('.webp')) image.animated = await isAnimatedWebp(image.url)
  entries.push({
    id: lid, // map key — stripped from the generated file below
    wgerId: entry.id,
    match: entry.name,
    video: entry.video?.playable ? entry.video.url : undefined,
    image: image?.url,
    animated: image?.animated || undefined,
    thumb: image?.thumb,
  })
  const kind = entries.at(-1).video ? 'video' : image?.animated ? 'anim-webp' : 'static'
  console.log(`  ✓ ${lid} → "${entry.name}" [${kind}] (${(hit.score * 100) | 0}%)`)
}

console.log(`\nMatched ${entries.length}/${local.size}. Unmatched: ${unmatched.join(', ') || 'none'}`)

const ts = `/**
 * EXERCISE_MEDIA — generated by scripts/buildExerciseCatalog.mjs
 * Real exercise animations (H.264 demo videos / animated illustrations) sourced
 * from wger.de and matched to every FitTracker exercise id. Do not edit by hand.
 * License: CC BY-SA 4.0 — https://wger.de
 */

export interface ExerciseMedia {
  /** wger.de exercise id (for credit links) */
  wgerId: number
  /** wger exercise name this was matched to */
  match: string
  /** Browser-playable demo video (preferred visual) */
  video?: string
  /** Illustration (animated webp when animated=true, still otherwise) */
  image?: string
  /** image is an animated webp */
  animated?: boolean
  /** small static thumbnail */
  thumb?: string
}

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = ${JSON.stringify(Object.fromEntries(entries.map(e => [e.id, (() => { const { id: _id, score: _s, ...rest } = e; return rest })()])), null, 2)}
`
await writeFile(OUT, ts, 'utf8')
console.log(`Wrote ${OUT} (${entries.length} entries)`)
