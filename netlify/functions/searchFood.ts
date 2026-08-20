import type { Handler } from '@netlify/functions'

// ── Types ─────────────────────────────────────────────────────────────────────
interface FoodResult {
  fdcId: string
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  source: 'usda' | 'openfoodfacts' | 'indian'
}

interface USDAFood {
  fdcId: number
  description: string
  brandOwner?: string
  foodNutrients: Array<{ nutrientId: number; value: number }>
}

interface OFFProduct {
  id?: string
  product_name?: string
  brands?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'proteins_100g'?: number
    'carbohydrates_100g'?: number
    'fat_100g'?: number
    'fiber_100g'?: number
  }
}

// ── USDA parser ───────────────────────────────────────────────────────────────
function parseUSDA(f: USDAFood): FoodResult {
  const get = (id: number) => f.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0
  return {
    fdcId:    String(f.fdcId),
    name:     f.description,
    brand:    f.brandOwner,
    calories: Math.round(get(1008)),
    protein:  Math.round(get(1003) * 10) / 10,
    carbs:    Math.round(get(1005) * 10) / 10,
    fat:      Math.round(get(1004) * 10) / 10,
    fiber:    Math.round(get(1079) * 10) / 10,
    source:   'usda',
  }
}

// ── OpenFoodFacts parser ──────────────────────────────────────────────────────
function parseOFF(p: OFFProduct): FoodResult | null {
  if (!p.product_name || !p.nutriments) return null
  const n = p.nutriments
  const cal = n['energy-kcal_100g'] ?? 0
  if (!cal) return null
  return {
    fdcId:    `off_${p.id ?? Math.random()}`,
    name:     p.product_name,
    brand:    p.brands,
    calories: Math.round(cal),
    protein:  Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
    carbs:    Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    fat:      Math.round((n['fat_100g'] ?? 0) * 10) / 10,
    fiber:    Math.round((n['fiber_100g'] ?? 0) * 10) / 10,
    source:   'openfoodfacts',
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
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let query = ''
  try {
    const body = JSON.parse(event.body ?? '{}')
    query = (body.query ?? '').trim()
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  if (!query || query.length < 2) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ foods: [], source: 'empty' }) }
  }

  const results: FoodResult[] = []
  const seen = new Set<string>()

  function addResult(r: FoodResult) {
    if (!seen.has(r.fdcId) && r.calories > 0) {
      seen.add(r.fdcId)
      results.push(r)
    }
  }

  const USDA_KEY = process.env.USDA_API_KEY ?? ''

  // ── 1. USDA FoodData Central ──────────────────────────────────────────────
  if (USDA_KEY) {
    try {
      const url =
        `https://api.nal.usda.gov/fdc/v1/foods/search` +
        `?api_key=${USDA_KEY}` +
        `&query=${encodeURIComponent(query)}` +
        `&dataType=Foundation,SR%20Legacy,Branded` +
        `&pageSize=15`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json() as { foods?: USDAFood[] }
        for (const f of (data.foods ?? []).slice(0, 12)) {
          addResult(parseUSDA(f))
        }
      }
    } catch { /* fall through */ }
  }

  // ── 2. Open Food Facts (branded/packaged foods) ───────────────────────────
  if (results.length < 10) {
    try {
      const url =
        `https://world.openfoodfacts.org/cgi/search.pl` +
        `?search_terms=${encodeURIComponent(query)}` +
        `&search_simple=1&action=process&json=1&page_size=8` +
        `&fields=id,product_name,brands,nutriments`

      const res = await fetch(url, {
        headers: { 'User-Agent': 'FitvoryaAI/1.0 (contact@fitvoryaai.app)' },
      })
      if (res.ok) {
        const data = await res.json() as { products?: OFFProduct[] }
        for (const p of (data.products ?? []).slice(0, 6)) {
          const f = parseOFF(p)
          if (f) addResult(f)
        }
      }
    } catch { /* fall through */ }
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ foods: results.slice(0, 20), source: results.length > 0 ? 'api' : 'empty' }),
  }
}
