import type { Handler } from '@netlify/functions'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface RequestBody {
  message: string
  context: {
    stageId:             string
    ageMonths:           number
    ageLabel:            string
    dietType:            'vegetarian' | 'non_vegetarian' | 'vegan'
    tamilFoodPreference: boolean
    introducedFoods:     string[]
    reportedAllergens:   string[]
  }
  history: ChatMessage[]
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
}

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'qwen/qwen3.6-27b'

const EMERGENCY_KEYWORDS = [
  'choking', 'not breathing', 'allergic reaction', 'swollen', 'hives',
  'vomiting blood', 'unconscious', 'seizure', 'emergency', 'ambulance',
  'hospital', 'diagnose', 'medication', 'medicine', 'prescription',
]

function isEmergency(msg: string): boolean {
  return EMERGENCY_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

async function callGroq(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  maxTokens = 700,
): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set')

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user',   content: userMessage },
  ]

  const res = await fetch(GROQ_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature: 0.7 }),
  })

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`)

  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  const raw  = data.choices?.[0]?.message?.content ?? ''
  const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  if (!text) throw new Error('Empty response')
  return text
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  let body: RequestBody
  try { body = JSON.parse(event.body ?? '{}') }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { message, context, history = [] } = body
  if (!message?.trim()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Empty message' }) }

  if (isEmergency(message)) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: '🚨 **If your baby is choking, having a severe allergic reaction, or a medical emergency — call emergency services immediately (108 / 112 / 911).**\n\nFitTracker cannot provide emergency medical advice.',
        source: 'safety_filter',
      }),
    }
  }

  const systemPrompt = `You are FitTracker Baby & Toddler Nutrition Coach — a focused, warm nutrition assistant for parents.

BABY CONTEXT:
- Age: ${context.ageLabel} (${context.ageMonths} months)
- Stage: ${context.stageId}
- Diet: ${context.dietType}
- Tamil food preference: ${context.tamilFoodPreference ? 'Yes — prioritise ragi, kambu, samai, moong dal' : 'No'}
- Introduced foods: ${context.introducedFoods.length > 0 ? context.introducedFoods.join(', ') : 'Not recorded'}
- Reported allergens: ${context.reportedAllergens.length > 0 ? context.reportedAllergens.join(', ') : 'None'}

RESPONSE LENGTH RULES — follow exactly:
- Normal answers: maximum 3 lines. Be direct and concise.
- Exception: if the user explicitly asks for a meal plan, 7-day plan, weekly plan, or table — provide a complete, well-formatted table or structured plan. No length limit for these.

TOPIC RULES:
- Only answer questions related to: baby/toddler nutrition, age-appropriate foods, textures, feeding schedules, food introduction, Tamil baby foods, breastfeeding, meal planning for babies and toddlers.
- If the user asks about anything unrelated — reply with exactly: "I can only help with baby and toddler nutrition questions. Please ask something related to your baby's diet or feeding."

SAFETY RULES:
1. 0–6 months: NEVER recommend solid foods
2. Age-appropriate textures only — never suggest choking hazards
3. Never diagnose, prescribe, or recommend medications
4. Emergencies: say CALL EMERGENCY SERVICES immediately
5. General information only — not medical advice
6. End every response with: "_ℹ️ General info only. Consult your paediatrician._"

FORMAT: **bold** for key terms, • bullet points, emoji.`

  try {
    const response = await callGroq(systemPrompt, history, message, 1200)
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ response, source: 'groq' }) }
  } catch {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: `I'm here to help with baby nutrition! For your ${context.ageLabel} baby, try asking:\n\n• "What can I give for breakfast?"\n• "Give me Tamil food ideas"\n• "What textures are safe at this age?"\n• "How do I introduce new foods?"\n• "Give me a 7-day meal plan"\n\n_ℹ️ General information only. Always consult your paediatrician._`,
        source: 'fallback',
      }),
    }
  }
}
