import type { Handler } from '@netlify/functions'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface MemberSummary {
  name:                string
  role:                string
  ageLabel:            string
  dietPref:            string
  allergies:           string[]
  pregnancyWeek?:      number
  ageMonths?:          number
  tamilFoodPreference: boolean
}

interface RequestBody {
  message: string
  familySummary: {
    familyName:        string
    cuisinePreference: string
    members:           MemberSummary[]
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
  'diagnose', 'prescription', 'medication', 'medicine', 'treat disease',
  'cure', 'hospital emergency', 'severe allergic reaction', 'anaphylaxis',
]

function isMedical(msg: string): boolean {
  return MEDICAL_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

async function callGroq(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  maxTokens = 800,
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

  const { message, familySummary, history = [] } = body
  if (!message?.trim()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Empty message' }) }

  if (isMedical(message)) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: '⚠️ **Please contact your healthcare provider** for medical dietary advice. FitTracker provides general nutrition information only.\n\nI\'m happy to help with general family meal ideas, food choices, and meal planning.',
        source: 'safety_filter',
      }),
    }
  }

  const memberContext = familySummary.members.map(m =>
    `- ${m.name} (${m.role}, ${m.ageLabel}): ${m.dietPref}` +
    (m.allergies.length ? `, allergic to: ${m.allergies.join(', ')}` : '') +
    (m.pregnancyWeek    ? `, pregnancy week ${m.pregnancyWeek}` : '') +
    (m.ageMonths        ? `, ${m.ageMonths} months old` : '')
  ).join('\n')

  const systemPrompt = `You are FitTracker Family Nutrition Coach — a focused, warm nutrition assistant for families.

FAMILY CONTEXT:
Family name: ${familySummary.familyName}
Cuisine preference: ${familySummary.cuisinePreference}
Members:
${memberContext}

RESPONSE LENGTH RULES — follow exactly:
- Normal answers: maximum 3 lines. Be direct and concise.
- Exception: if the user explicitly asks for a meal plan, 7-day plan, weekly plan, shopping list, or table — provide a complete, well-formatted table or structured plan. No length limit for these.

TOPIC RULES:
- Only answer questions related to: family nutrition, meal planning, food adaptations per member, Tamil traditional foods, shopping lists, ingredient substitutions, weekly meal plans, baby/toddler/pregnancy food adaptations.
- If the user asks about anything unrelated — reply with exactly: "I can only help with family nutrition and meal planning questions. Please ask something related to your family's diet."

SAFETY RULES:
1. Adapt meals individually for each family member
2. Babies under 6 months: NEVER suggest solid foods
3. Pregnant members: no raw/undercooked foods
4. NEVER suggest foods to members with recorded allergies
5. Never diagnose or recommend medications
6. General information only — consult healthcare provider
7. End every response with: "_ℹ️ General info only. Consult your healthcare provider._"

FORMAT: **bold** for key terms, • bullet points, emoji.`

  try {
    const response = await callGroq(systemPrompt, history, message, 1200)
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ response, source: 'groq' }) }
  } catch {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: `I'm ready to help with family nutrition! Try asking:\n\n• "Give us a healthy Tamil dinner"\n• "Create a vegetarian family meal"\n• "What's a good breakfast for everyone?"\n• "Generate a shopping list"\n• "Give us a weekly meal plan"\n\n_ℹ️ General information only. Consult your healthcare provider._`,
        source: 'fallback',
      }),
    }
  }
}
