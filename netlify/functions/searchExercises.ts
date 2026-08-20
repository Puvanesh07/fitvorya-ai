import type { Handler } from '@netlify/functions'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExerciseResult {
  id: string
  name: string
  muscleGroup: string
  secondaryMuscles: string[]
  equipment: string
  category: string
  instructions: string[]
  gifUrl?: string
  source: 'exercisedb' | 'local'
}

interface ExerciseDBItem {
  id: string
  name: string
  bodyPart: string
  target: string
  secondaryMuscles: string[]
  equipment: string
  instructions: string[]
  gifUrl?: string
}

const BODYPART_CATEGORY: Record<string, string> = {
  chest:       'hypertrophy',
  back:        'strength',
  shoulders:   'hypertrophy',
  'upper arms':'hypertrophy',
  'lower arms':'hypertrophy',
  'upper legs':'strength',
  'lower legs':'hypertrophy',
  waist:       'strength',
  cardio:      'cardio',
  neck:        'mobility',
}

function parseExerciseDB(e: ExerciseDBItem): ExerciseResult {
  return {
    id:               e.id,
    name:             e.name.charAt(0).toUpperCase() + e.name.slice(1),
    muscleGroup:      e.target,
    secondaryMuscles: e.secondaryMuscles ?? [],
    equipment:        e.equipment,
    category:         BODYPART_CATEGORY[e.bodyPart] ?? 'strength',
    instructions:     e.instructions ?? [],
    gifUrl:           e.gifUrl,
    source:           'exercisedb',
  }
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let query = ''
  let bodyPart = ''
  try {
    const body = JSON.parse(event.body ?? '{}')
    query    = (body.query    ?? '').trim().toLowerCase()
    bodyPart = (body.bodyPart ?? '').trim().toLowerCase()
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const EXERCISEDB_KEY = process.env.EXERCISEDB_API_KEY ?? ''

  if (!EXERCISEDB_KEY) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ exercises: [], source: 'no_key' }),
    }
  }

  try {
    const endpoint = bodyPart
      ? `https://v2.exercisedb.io/exercises/bodyPart/${encodeURIComponent(bodyPart)}`
      : query
      ? `https://v2.exercisedb.io/exercises/name/${encodeURIComponent(query)}`
      : `https://v2.exercisedb.io/exercises`

    const res = await fetch(`${endpoint}?limit=20&offset=0`, {
      headers: {
        'x-rapidapi-key':  EXERCISEDB_KEY,
        'x-rapidapi-host': 'v2.exercisedb.io',
      },
    })

    if (!res.ok) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ exercises: [], source: 'api_error', status: res.status }),
      }
    }

    const data = await res.json() as ExerciseDBItem[]
    const exercises = (Array.isArray(data) ? data : [])
      .slice(0, 20)
      .map(parseExerciseDB)

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ exercises, source: 'exercisedb' }),
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ exercises: [], source: 'error', message: String(err) }),
    }
  }
}
