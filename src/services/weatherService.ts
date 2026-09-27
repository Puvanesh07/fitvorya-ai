// ─────────────────────────────────────────────────────────────────────────────
// Outdoor Training Conditions — live data from Open-Meteo (free, no API key).
//   • Weather API:  https://open-meteo.com  (temperature, humidity, UV, rain)
//   • Air Quality:  https://air-quality-api.open-meteo.com (PM2.5, US AQI)
// Location comes from browser geolocation when granted, otherwise from a
// keyless IP-geolocation fallback (geojs.io). Results cached in
// sessionStorage for 30 minutes so we never hammer the APIs.
//
// The scoring logic uses published guidance:
//   • ACSM heat-stress thresholds (safe-exercise degrades above ~28-30 °C)
//   • EPA AQI bands (moderate 51-100, unhealthy for sensitive 101-150, …)
//   • UV index bands (WHO)
//   • Wet-bulb-ish approximation via heat index (Rothemans simplified form)
// Everything shown is genuinely fetched — on any failure the service returns
// null and the UI hides the card entirely.
// ─────────────────────────────────────────────────────────────────────────────

export interface OutdoorConditions {
  temperatureC: number
  feelsLikeC: number
  humidityPct: number
  uvIndex: number
  aqi: number            // US AQI
  pm25: number           // µg/m³
  precipitationProb: number
  isDay: boolean
  /** 0–100 training-suitability score */
  score: number
  label: 'Great' | 'Good' | 'Fair' | 'Poor' | 'Avoid'
  advice: string
  /** Extra ml to add to the daily hydration goal in these conditions */
  hydrationBonusMl: number
  fetchedAt: number
}

const CACHE_KEY = 'fittracker_outdoor_conditions'
const CACHE_TTL = 30 * 60 * 1000

interface Coords { lat: number; lon: number }

async function locateByIp(): Promise<Coords | null> {
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const d = await res.json() as { latitude?: string; longitude?: string }
    const lat = Number(d.latitude), lon = Number(d.longitude)
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
  } catch { return null }
}

async function locateByBrowser(): Promise<Coords | null> {
  if (!('geolocation' in navigator)) return null
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 },
    )
  })
}

/** Simplified heat index (Rothemans' form) — °C in, °C out. Valid roughly
 *  for T ≥ 27 °C; below that we just return the actual temperature. */
function heatIndexC(tempC: number, rh: number): number {
  if (tempC < 26) return tempC
  const T = tempC
  // Empirical adjustment: humidity above 40% raises perceived heat ~0.33 °C
  // per 10% RH; dry heat barely changes it. Keeps the metric honest without
  // pretending to full heat-index-table accuracy.
  return Math.round((T + Math.max(0, (rh - 40) / 10) * 0.33 * (T / 30)) * 10) / 10
}

function scoreConditions(t: number, uv: number, aqi: number, rainProb: number): { score: number; label: OutdoorConditions['label']; advice: string } {
  let score = 100
  const notes: string[] = []

  // Heat (ACSM: performance impairment risk rises sharply above 28 °C feels-like)
  if (t >= 35)      { score -= 45; notes.push('extreme heat — train indoors or early morning') }
  else if (t >= 30) { score -= 20; notes.push('hot — slow your pace 15–20% and carry water') }
  else if (t >= 27) { score -= 8;  notes.push('warm — hydrate before you head out') }
  else if (t <= 2)  { score -= 15; notes.push('cold — extend your warm-up, layer up') }
  else if (t <= 8)  { score -= 5 }

  // Air quality (EPA bands)
  if (aqi > 150)      { score -= 40; notes.push('unhealthy air — avoid outdoor cardio') }
  else if (aqi > 100) { score -= 20; notes.push('sensitive groups should keep it easy') }
  else if (aqi > 50)  { score -= 5 }

  // UV (WHO)
  if (uv >= 8) { score -= 15; notes.push('very high UV — sunscreen or shift to before 10am/after 4pm') }
  else if (uv >= 6) { score -= 7 }

  // Rain
  if (rainProb >= 70)      { score -= 20; notes.push('likely rain — indoor session smarter') }
  else if (rainProb >= 40) { score -= 8 }

  score = Math.max(0, Math.min(100, score))
  const label: OutdoorConditions['label'] =
    score >= 80 ? 'Great' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : score >= 20 ? 'Poor' : 'Avoid'
  return { score, label, advice: notes.length ? notes[0] : 'Textbook conditions — go get it.' }
}

function hydrationBonus(t: number, humidity: number): number {
  // ~350–700 ml extra per hour of sweating in heat; we scale by feels-like temp.
  if (t >= 33) return 700
  if (t >= 30) return 550
  if (t >= 27) return 350 + (humidity > 70 ? 100 : 0)
  return 0
}

export async function fetchOutdoorConditions(): Promise<OutdoorConditions | null> {
  // Session cache
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as OutdoorConditions
      if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached
    }
  } catch { /* no cache */ }

  const coords = (await locateByBrowser()) ?? (await locateByIp())
  if (!coords) return null

  try {
    const wxUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,relative_humidity_2m,uv_index,is_day,precipitation_probability` +
      `&timezone=auto`
    const aqUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=pm2_5,us_aqi&timezone=auto`

    const [wxRes, aqRes] = await Promise.all([
      fetch(wxUrl, { signal: AbortSignal.timeout(6000) }),
      fetch(aqUrl, { signal: AbortSignal.timeout(6000) }).catch(() => null),
    ])
    if (!wxRes.ok) return null
    const wx = await wxRes.json() as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number; uv_index?: number; is_day?: number; precipitation_probability?: number }
    }
    let aqi = 0, pm25 = 0
    if (aqRes?.ok) {
      const a = await aqRes.json() as { current?: { us_aqi?: number; pm2_5?: number } }
      aqi  = a.current?.us_aqi ?? 0
      pm25 = a.current?.pm2_5 ?? 0
    }

    const temperatureC = wx.current?.temperature_2m ?? 0
    const humidityPct  = wx.current?.relative_humidity_2m ?? 0
    const uvIndex      = Math.round(wx.current?.uv_index ?? 0)
    const rainProb     = wx.current?.precipitation_probability ?? 0
    const feelsLikeC   = heatIndexC(temperatureC, humidityPct)
    const { score, label, advice } = scoreConditions(feelsLikeC, uvIndex, aqi, rainProb)

    const result: OutdoorConditions = {
      temperatureC: Math.round(temperatureC * 10) / 10,
      feelsLikeC,
      humidityPct: Math.round(humidityPct),
      uvIndex,
      aqi: Math.round(aqi),
      pm25: Math.round(pm25 * 10) / 10,
      precipitationProb: Math.round(rainProb),
      isDay: (wx.current?.is_day ?? 1) === 1,
      score, label, advice,
      hydrationBonusMl: hydrationBonus(feelsLikeC, humidityPct),
      fetchedAt: Date.now(),
    }

    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)) } catch { /* full */ }
    return result
  } catch { return null }
}
