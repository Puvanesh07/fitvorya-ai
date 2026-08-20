import type { Handler } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface MemberSummary {
  name: string; role: string; ageLabel: string
  dietPref: string; allergies: string[]
  pregnancyWeek?: number; ageMonths?: number
  tamilFoodPreference: boolean
}

interface RequestBody {
  message: string
  familySummary: {
    familyName: string
    cuisinePreference: string
    members: MemberSummary[]
  }
  history: ChatMessage[]
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

// ── Safety filter ─────────────────────────────────────────────────────────────
const MEDICAL_KEYWORDS = [
  'diagnose','prescription','medication','medicine','treat disease',
  'cure','hospital emergency','allergic reaction severe','anaphylaxis',
]
function isMedicalQuery(msg: string): boolean {
  return MEDICAL_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

// ── Rule-based responses ──────────────────────────────────────────────────────
function getRuleResponse(message: string, req: RequestBody): string | null {
  const msg     = message.toLowerCase()
  const members = req.familySummary.members
  const cuisine = req.familySummary.cuisinePreference
  const hasTamil = cuisine === 'tamil' || cuisine === 'mixed' || members.some(m => m.tamilFoodPreference)
  const hasPregnant = members.some(m => m.role === 'pregnant')
  const hasBaby     = members.some(m => m.role === 'baby')
  const allVeg      = members.every(m => m.dietPref === 'vegetarian' || m.dietPref === 'vegan')

  // Greeting
  if (/^(hi|hello|hey|vanakkam|namaste)[\s!.,]?$/.test(msg.trim())) {
    const summary = members.map(m => `${m.name} (${m.role})`).join(', ')
    return `Vanakkam! 👨‍👩‍👧 I'm your FitTracker Family Nutrition Coach!\n\nYour family: **${summary}**\n\nI can help with:\n• Family meal ideas and adaptations\n• Weekly meal plans for everyone\n• Tamil traditional or global food options\n• Shopping list generation\n• Ingredient substitutions\n\nWhat can I help with today?`
  }

  // Tamil dinner request
  if ((msg.includes('tamil') || msg.includes('traditional')) && (msg.includes('dinner') || msg.includes('meal'))) {
    const preg = hasPregnant ? '\n🤰 Pregnant member: Extra drumstick sambar for iron + calcium; no raw foods' : ''
    const baby = hasBaby ? '\n👶 Baby: Soft mashed dal and rice, age-appropriate texture' : ''
    return `Here's a Tamil family dinner idea:\n\n🍚 **Base:** Red Rice + Drumstick Sambar + Keerai Kootu + Appalam\n\n**Adaptations:**\n${members.map(m => {
      if (m.role === 'baby') return `👶 ${m.name}: Soft mashed khichdi with drumstick puree`
      if (m.role === 'toddler') return `🧒 ${m.name}: Small portion of rice + dal + mashed vegetables`
      if (m.role === 'pregnant') return `🤰 ${m.name}: Extra sambar + a serving of keerai kootu for iron and calcium`
      if (m.role === 'senior_male' || m.role === 'senior_female') return `👴 ${m.name}: Moderate portion, softer keerai kootu, less spice`
      return `${ROLE_EMOJIS[m.role] ?? '👤'} ${m.name}: Standard portion`
    }).join('\n')}\n${preg}${baby}\n\n💡 Tip: Add a small serving of curd for probiotics.\n\n_ℹ️ General information only. Consult healthcare provider for medical dietary needs._`
  }

  // Shopping list request
  if (msg.includes('shopping') || msg.includes('ingredients') || msg.includes('grocery')) {
    const foods = hasTamil
      ? ['Ragi flour', 'Red rice', 'Moong dal', 'Drumstick leaves', 'Spinach (keerai)', 'Banana', 'Eggs', 'Curd']
      : ['Oats', 'Quinoa', 'Lentils', 'Spinach', 'Sweet potato', 'Avocado', 'Eggs', 'Greek yogurt']
    return `Here's a quick shopping list for your family:\n\n${foods.map((f, i) => `${i+1}. ${f}`).join('\n')}\n\n📋 Use the **Shopping List** tab to generate a complete categorised list with quantities that you can tick off as you shop!`
  }

  // Vegetarian meal
  if (msg.includes('vegetarian') || (allVeg && msg.includes('meal'))) {
    return `A nutritious vegetarian family meal:\n\n🍽️ **Base:** Kambu Roti + Dal Tadka + Mixed Vegetable Sabzi + Curd\n\n**For each member:**\n${members.map(m => {
      if (m.role === 'baby') return `👶 ${m.name}: Soft moong dal + mashed sweet potato`
      if (m.role === 'toddler') return `🧒 ${m.name}: Small roti pieces + soft dal + vegetable mash`
      if (m.role === 'pregnant') return `🤰 ${m.name}: Extra dal portion + iron-rich greens side`
      return `${ROLE_EMOJIS[m.role] ?? '👤'} ${m.name}: Standard portion`
    }).join('\n')}\n\n_ℹ️ General guidance only._`
  }

  // Weekly plan
  if (msg.includes('weekly') || msg.includes('week plan') || msg.includes('7 day')) {
    return `I can generate a full 7-day family meal plan! 📅\n\nUse the **Weekly Planner** tab to:\n• Generate a complete 7-day plan for everyone\n• Choose Tamil, Global, or Mixed cuisine\n• Regenerate any single day\n• Get adaptations for each family member\n\nOr describe what kind of week plan you'd like and I'll suggest ideas!`
  }

  // Breakfast ideas
  if (msg.includes('breakfast')) {
    const options = hasTamil
      ? '• Idli + Sambar (soft mash for baby, normal for adults)\n• Ragi dosa + coconut chutney\n• Kambu idli + drumstick sambar'
      : '• Oatmeal with fruit (soft for baby)\n• Scrambled eggs + whole grain toast\n• Greek yogurt parfait with granola'
    return `Breakfast ideas for your family:\n\n${options}\n\n**Quick adaptations:**\n${members.filter(m => m.role === 'baby' || m.role === 'toddler' || m.role === 'pregnant').map(m => {
      if (m.role === 'baby') return `👶 ${m.name}: Ragi porridge or mashed banana`
      if (m.role === 'toddler') return `🧒 ${m.name}: Small idli pieces or soft dosa pieces`
      return `🤰 ${m.name}: Extra ragi for calcium, add a boiled egg if non-vegetarian`
    }).join('\n') || 'All members: standard portion'}\n\n_ℹ️ General information only._`
  }

  return null
}

const ROLE_EMOJIS: Record<string, string> = {
  adult_male: '👨', adult_female: '👩', pregnant: '🤰',
  baby: '👶', toddler: '🧒', senior_male: '👴', senior_female: '👵', child: '🧒',
}

// ── Gemini 2.5 Flash ──────────────────────────────────────────────────────────
async function callGemini(message: string, req: RequestBody): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('no_key')

  const ai = new GoogleGenAI({ apiKey: key })

  const memberContext = req.familySummary.members.map(m =>
    `- ${m.name} (${m.role}, ${m.ageLabel}): ${m.dietPref}${m.allergies.length ? ', allergic to: ' + m.allergies.join(', ') : ''}${m.pregnancyWeek ? ', pregnancy week ' + m.pregnancyWeek : ''}${m.ageMonths ? ', ' + m.ageMonths + ' months old' : ''}`
  ).join('\n')

  const systemInstruction = `You are FitTracker Family Nutrition Coach — a warm, practical, and safety-conscious AI nutrition assistant for families.

FAMILY CONTEXT:
Family name: ${req.familySummary.familyName}
Cuisine preference: ${req.familySummary.cuisinePreference}
Members:
${memberContext}

STRICT RULES:
1. ALWAYS adapt meals for each family member individually — never give the same generic advice for everyone
2. For babies under 6 months: NEVER suggest solid foods
3. For pregnant members: follow safe pregnancy nutrition guidance; no raw/undercooked foods
4. NEVER suggest a food to a member with a recorded allergy
5. For medical emergencies — direct to emergency services immediately
6. Never diagnose allergies or medical conditions
7. Never recommend medications or supplement doses
8. Always note: general information only, consult healthcare provider
9. Prioritise Tamil traditional foods when cuisine preference includes Tamil
10. Keep responses practical, warm, under 500 words
11. Format with **bold**, bullet points, emoji

End every response with: "_ℹ️ General nutrition information only. Consult your healthcare provider for personalised advice._"`

  const contents = [
    ...req.history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user' as const,
      parts: [{ text: m.content }],
    })),
    { role: 'user' as const, parts: [{ text: message }] },
  ]

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: { systemInstruction, maxOutputTokens: 800, temperature: 0.7 },
  })

  const text = response.text ?? ''
  if (!text) throw new Error('empty_response')
  return text
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  let body: RequestBody
  try { body = JSON.parse(event.body ?? '{}') }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { message, familySummary, history = [] } = body
  if (!message?.trim()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Empty message' }) }

  if (isMedicalQuery(message)) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: '⚠️ **Please contact your healthcare provider** for medical dietary advice. FitTracker provides general nutrition information only and cannot give medical advice.\n\nI\'m happy to help with general family meal ideas, food choices, and meal planning.',
        source: 'safety_filter',
      }),
    }
  }

  const rule = getRuleResponse(message, body)
  if (rule) return { statusCode: 200, headers: CORS, body: JSON.stringify({ response: rule, source: 'rules' }) }

  try {
    const ai = await callGemini(message, { message, familySummary, history })
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ response: ai, source: 'gemini' }) }
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
