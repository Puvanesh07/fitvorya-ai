import type { Handler } from '@netlify/functions'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface RequestBody {
  message: string
  context: {
    week:                number
    trimester:           1 | 2 | 3
    dietType:            'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'
    restrictions:        string[]
    tamilFoodPreference: boolean
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

const MEDICAL_KEYWORDS = [
  'medication', 'medicine', 'drug', 'supplement dose', 'prescription',
  'diagnose', 'diagnosis', 'treat', 'cure', 'hospital', 'emergency',
  'bleeding', 'severe pain', 'contractions before 37', 'miscarriage',
]

function isMedical(msg: string): boolean {
  return MEDICAL_KEYWORDS.some(k => msg.toLowerCase().includes(k))
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

  if (isMedical(message)) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: '⚠️ **Please contact your healthcare provider.**\n\nFitTracker provides general nutrition information only and cannot give medical advice. For symptoms, medications, or urgent concerns — speak with your doctor or midwife immediately.',
        source: 'safety_filter',
      }),
    }
  }

  const systemPrompt = `You are FitTracker AI Pregnancy Nutrition Coach — a focused, warm nutrition assistant for pregnant women.

USER CONTEXT:
- Pregnancy week: ${context.week} (Trimester ${context.trimester})
- Diet type: ${context.dietType}
- Tamil food preference: ${context.tamilFoodPreference ? 'Yes — prioritise Tamil traditional foods: ragi, kambu, murungai keerai, red rice, thinai, samai' : 'No preference'}
- Dietary restrictions: ${context.restrictions.length > 0 ? context.restrictions.join(', ') : 'None'}

RESPONSE LENGTH RULES — follow exactly:
- Normal answers: maximum 3 lines. Be direct and concise.
- Exception: if the user explicitly asks for a meal plan, 7-day plan, weekly plan, or table — provide a complete, well-formatted table or structured plan. No length limit for these.

TOPIC RULES:
- Only answer questions related to: pregnancy nutrition, foods to eat/avoid, meal planning, hydration, Tamil traditional foods, breastfeeding preparation, weight during pregnancy, supplements (general info only).
- If the user asks about anything unrelated — reply with exactly: "I can only help with pregnancy nutrition and wellness questions. Please ask something related to your pregnancy diet or meal planning."

SAFETY RULES:
1. General nutrition information only — never diagnose or prescribe
2. Severe pain / bleeding / emergencies → say: contact your doctor immediately
3. ⚠️ note for sensitive foods (papaya, herbal remedies, raw foods)
4. End every response with: "_ℹ️ General info only. Consult your healthcare provider._"

FORMAT: **bold** for key terms, • bullet points, emoji.`

  try {
    const response = await callGroq(systemPrompt, history, message, 1200)
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ response, source: 'groq' }) }
  } catch {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: `I'm here to help with your pregnancy nutrition! For week ${context.week} (Trimester ${context.trimester}), focus on:\n\n🌿 **Folate** — drumstick leaves, spinach, moong dal\n💪 **Iron** — kambu, ragi, keerai, pomegranate\n🦴 **Calcium** — ragi, curd, almonds\n💧 **Hydration** — ${context.week >= 29 ? '10–12' : '8–10'} glasses daily\n\nTry asking:\n• "What should I eat this week?"\n• "Give me Tamil food ideas"\n• "What foods should I avoid?"\n\n_ℹ️ General information only. Consult your healthcare provider._`,
        source: 'fallback',
      }),
    }
  }
}
