import type { Handler } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface RequestBody {
  message: string
  context: {
    week: number
    trimester: 1 | 2 | 3
    dietType: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'
    restrictions: string[]
    tamilFoodPreference: boolean
  }
  history: ChatMessage[]
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

// ── Safety filter — blocks medical advice requests ────────────────────────────
const MEDICAL_KEYWORDS = [
  'medication', 'medicine', 'drug', 'supplement dose', 'prescription',
  'diagnose', 'diagnosis', 'treat', 'cure', 'hospital', 'emergency',
  'bleeding', 'severe pain', 'contractions before 37', 'miscarriage',
]

function isMedicalQuery(msg: string): boolean {
  const lower = msg.toLowerCase()
  return MEDICAL_KEYWORDS.some(k => lower.includes(k))
}

// ── Rule-based responses (instant, free, no API key needed) ───────────────────
function getRuleBasedResponse(
  message: string,
  context: RequestBody['context'],
): string | null {
  const msg   = message.toLowerCase()
  const tamil = context.tamilFoodPreference
  const veg   = context.dietType === 'vegetarian' || context.dietType === 'vegan'
  const week  = context.week
  const tri   = context.trimester

  // Greeting
  if (/^(hi|hello|hey|namaste|vanakkam)[\s!.,]?$/.test(msg.trim())) {
    return `Vanakkam! 🤰 I'm your FitTracker Pregnancy Nutrition Coach. You're in week ${week} of your pregnancy (Trimester ${tri}). I can help with:\n\n• What to eat this week\n• Tamil or global food suggestions\n• Iron, calcium & folate-rich foods\n• Meal plans\n• Foods to enjoy or limit\n\nWhat would you like to know?`
  }

  // Morning sickness / nausea
  if (msg.includes('nausea') || msg.includes('morning sickness') || msg.includes('vomit') || msg.includes('sick')) {
    return `For nausea during pregnancy, small frequent meals often help more than large ones.\n\n🍌 **Banana** — Vitamin B6 may ease nausea; easy to digest\n🥣 **Ragi porridge or samai kanji** — light millet gruels\n🍘 **Plain crackers or dry toast** — eat before getting out of bed\n🫚 **Ginger** — small amounts of ginger tea are traditionally used; discuss with your midwife\n🥥 **Coconut water** — gentle hydration\n\n**Tips:**\n• Eat every 2–3 hours — empty stomach worsens nausea\n• Avoid strong smells while cooking\n• Stay upright after eating\n\n⚠️ If you cannot keep food or water down for more than 24 hours, please contact your healthcare provider.`
  }

  // Iron
  if (msg.includes('iron') || msg.includes('anaemia') || msg.includes('anemia') || msg.includes('hemoglobin')) {
    const tamilIron = tamil ? '\n\n🌾 **Tamil iron-rich foods:**\n• Kambu (pearl millet) — kanji or roti\n• Ragi — koozh, dosa, porridge\n• Drumstick leaves (murungai keerai) — sambar, kootu\n• Spinach (keerai) — kootu, masiyal\n• Pomegranate — seeds or juice\n• Beetroot poriyal' : ''
    const nonvegNote = !veg ? '\n• Well-cooked chicken and fish also provide good iron' : ''
    return `Iron is especially important in pregnancy — your blood volume increases by up to 50%.${tamilIron}\n\n🌍 **Other good iron sources:**\n• Moong dal, chana dal, rajma\n• Spinach, drumstick leaves, beetroot\n• Oats, quinoa\n• Pair with Vitamin C (orange, guava, lemon) to improve absorption${nonvegNote}\n\n⚠️ Your doctor will monitor your haemoglobin levels. Iron supplements should only be taken as prescribed.`
  }

  // Calcium / milk alternatives
  if (msg.includes('calcium') || msg.includes('bone') || msg.includes('no milk') || msg.includes("don't like milk") || msg.includes('milk alternative')) {
    return `Calcium is critical for your baby's bone and teeth development. ${tamil ? '\n\n**Tamil calcium sources:**\n• 🌿 Ragi (finger millet) — one of the richest plant calcium sources\n• 🥬 Drumstick leaves (murungai keerai) — exceptionally high calcium\n• 🌰 Sesame seeds (ellu) — in moderation\n• 🌰 Almonds — 8–10 soaked daily\n• 🥛 Curd / dahi — curd rice, raita\n\n' : ''}**You don't have to drink plain milk:**\n• Greek yogurt, paneer\n• Fortified plant milks (oat, almond, soy)\n• Chia seeds, figs\n• Ragi alone can provide significant calcium\n\nDiscuss your calcium levels with your doctor.`
  }

  // Folate
  if (msg.includes('folate') || msg.includes('folic') || msg.includes('neural tube')) {
    return `Folate is critical ${week <= 13 ? 'especially now in your first trimester' : 'throughout pregnancy'} for cell growth and blood production.\n\n**Good folate sources:**\n${tamil ? '• Drumstick leaves (murungai keerai)\n• Spinach (palak keerai)\n• Ladies finger (vendaikkai)\n• Moong dal, chana dal\n• Beetroot\n• ' : ''}• Orange and orange juice\n• Avocado\n• Lentils and beans\n• Oats\n\n⚠️ Folic acid supplements are typically recommended during pregnancy. Take only what your doctor has prescribed.`
  }

  // Protein (vegetarian)
  if ((msg.includes('protein') && veg) || (msg.includes('vegetarian') && msg.includes('protein'))) {
    return `Great vegetarian protein sources for pregnancy:\n\n🫘 **Dals and legumes:**\n• Moong dal — easiest to digest, good folate\n• Chana dal / kabuli chana\n• Rajma, lentils, cowpeas (karamani)\n\n${context.dietType !== 'vegan' ? '🥛 **Dairy:**\n• Curd / Greek yogurt — protein + calcium\n• Paneer — protein + calcium\n\n' : ''}${context.dietType === 'eggetarian' ? '🥚 **Eggs** — complete protein with choline; always fully cooked\n\n' : ''}🌾 **Grains:**\n• Quinoa — complete protein (all amino acids)\n• Ragi — plant protein + calcium\n• Kambu — protein + iron\n\n🌰 **Nuts:** Almonds, walnuts, groundnuts, chia seeds\n\nAim to include a protein source at every meal.`
  }

  // Protein (non-veg)
  if (msg.includes('protein') && !veg) {
    return `Good protein sources for pregnancy (week ${week}):\n\n🥚 **Eggs** — complete protein + choline for brain development; always fully cooked\n🐟 **Low-mercury fish** — tilapia, catfish, sardines, rohu; 2–3 portions/week\n🍗 **Chicken** — lean protein + B vitamins; always thoroughly cooked\n\n🫘 **Plant proteins:**\n• Moong dal, chana dal, lentils\n• Curd, Greek yogurt, paneer\n${tamil ? '• Ragi, kambu, thinai\n' : ''}• Quinoa, oats\n• Almonds, groundnuts\n\nAim for protein at every meal — it supports rapid baby growth this trimester.`
  }

  // Tamil food
  if (msg.includes('tamil') || msg.includes('traditional') || msg.includes('south indian')) {
    return `Here are wonderful Tamil traditional foods for week ${week}:\n\n🌾 **Millets (excellent iron + calcium):**\n• Kambu (pearl millet) — kanji, idli, roti\n• Ragi (finger millet) — koozh, dosa, mudde, porridge\n• Thinai (foxtail millet) — pongal, upma\n• Samai (little millet) — easy on digestion\n\n🍚 **Traditional rice:**\n• Karuppu kavuni rice — antioxidants and iron\n• Red rice / hand-pounded rice\n\n🥬 **Traditional greens:**\n• Murungai keerai (drumstick leaves) — iron, calcium, folate\n• Keerai varieties — spinach, arai keerai, siru keerai\n• Vazhaithandu (banana stem) — fibre, potassium\n\n🫘 **Proteins:**\n• Moong dal, chana dal sundal, karamani${!veg ? '\n• Chettinad chicken (well-cooked, mild)\n• Fish curry (low-mercury, well-cooked)' : ''}\n\n✨ These are nutrient-dense foods trusted across generations.`
  }

  // Meal plan
  if (msg.includes('meal plan') || msg.includes('weekly plan') || msg.includes('7 day') || msg.includes('seven day')) {
    return `Here's a sample ${tamil ? 'Tamil' : 'mixed'} ${veg ? 'vegetarian' : ''} meal plan for week ${week}:\n\n**Monday**\n🌅 Breakfast: Ragi dosa + coconut chutney + sambar\n🍎 Snack: Banana + soaked almonds\n🍚 Lunch: Red rice + drumstick sambar + spinach kootu\n🌙 Dinner: Kambu idli + moong dal\n\n**Tuesday**\n🌅 Breakfast: Oatmeal with pomegranate and walnuts\n🍎 Snack: Guava + peanuts\n🍚 Lunch: ${veg ? 'Chana dal rice + beetroot poriyal + curd' : 'Red rice + fish curry + keerai'}\n🌙 Dinner: Thinai pongal + rasam\n\n**Wednesday**\n🌅 Breakfast: Samai upma + coconut chutney\n🍎 Snack: Orange + soaked almonds\n🍚 Lunch: ${veg ? 'Ragi roti + dal + mixed vegetable curry' : 'Rice + chicken kulambu + beans poriyal'}\n🌙 Dinner: Idli + drumstick sambar\n\n💧 Drink ${week >= 29 ? '10–12' : '8–10'} glasses of water daily.\n\n📋 Use the **Meal Planner** tab for a full personalised 7-day plan!`
  }

  // Avoid foods
  if (msg.includes('avoid') || msg.includes('not eat') || msg.includes('unsafe') || msg.includes('bad for')) {
    return `During pregnancy, these are generally advised to avoid or limit:\n\n🚫 **Avoid completely:**\n• Alcohol — no safe amount in pregnancy\n• Raw/undercooked meat, poultry, eggs\n• Raw fish / sushi / sashimi\n• Unpasteurised dairy and soft cheeses\n• High-mercury fish: shark, swordfish, king mackerel\n• Raw sprouts\n\n⚠️ **Moderate amounts only:**\n• Caffeine — under 200mg/day (about 1 small coffee)\n• Papaya (unripe/raw) — traditional caution applies\n• Herbal teas — not all are safe; check with your midwife\n\n⚠️ This is general guidance. Your healthcare provider may give specific advice.`
  }

  // Hydration
  if (msg.includes('water') || msg.includes('hydrat') || msg.includes('coconut water')) {
    return `Staying well hydrated is very important during pregnancy.\n\n💧 **How much:** ${week >= 29 ? '10–12' : '8–10'} glasses (about ${week >= 29 ? '2.5' : '2'} litres) daily\n\n✅ **Good choices:**\n• Plain water — the best\n• Coconut water (ilaneer) — natural electrolytes, potassium\n• Buttermilk / chaas — probiotics + hydration\n• Fresh lime water\n\n❌ **Limit:**\n• Carbonated drinks — can worsen heartburn\n• High-sugar juices\n• Caffeine (under 200mg/day total)\n\n💡 Dehydration can trigger Braxton Hicks contractions. If contractions continue after hydrating and resting, contact your doctor.`
  }

  // What to eat today/this week
  if (msg.includes('what to eat') || msg.includes('what should i eat') || msg.includes('what can i eat') || msg.includes('today') || msg.includes('this week')) {
    return `For week ${week} (Trimester ${tri}), here's today's focus:\n\n${
      tri === 1
        ? '🌿 **First trimester:** Folate, Iron, Vitamin B6 (for nausea)\n\n🌅 Breakfast: Ragi porridge with banana\n🍎 Snack: Orange or guava\n🍚 Lunch: Rice + drumstick sambar + keerai kootu\n🌙 Dinner: Kambu idli + moong dal'
        : tri === 2
        ? '💪 **Second trimester:** Iron, Protein, Calcium, Omega-3\n\n🌅 Breakfast: Oatmeal with pomegranate + almonds\n🍎 Snack: Guava + walnuts\n🍚 Lunch: Red rice + ' + (veg ? 'dal + keerai kootu' : 'fish curry + keerai') + '\n🌙 Dinner: Ragi dosa + ' + (veg ? 'egg bhurji' : 'chicken curry')
        : '🤱 **Third trimester:** Calcium, Iron, Light meals\n\n🌅 Breakfast: Kambu kanji with dates\n🍎 Snack: Orange + soaked almonds\n🍚 Lunch: Rice + ' + (veg ? 'sambar + beetroot poriyal' : 'chicken curry + drumstick sambar') + '\n🌙 Dinner: Soft idli + drumstick sambar'
    }\n\n💧 Drink ${week >= 29 ? '10–12' : '8–10'} glasses of water today.\n\n📋 For a full 7-day plan, use the **Meal Planner** tab!`
  }

  return null
}

// ── Gemini 2.5 Flash call ─────────────────────────────────────────────────────
async function callGemini(
  message: string,
  context: RequestBody['context'],
  history: ChatMessage[],
): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('no_key')

  const ai = new GoogleGenAI({ apiKey: key })

  const systemInstruction = `You are FitTracker AI Pregnancy Nutrition Coach — a knowledgeable, warm, and safety-conscious nutrition assistant for pregnant women.

USER CONTEXT:
- Pregnancy week: ${context.week} (Trimester ${context.trimester})
- Diet type: ${context.dietType}
- Tamil food preference: ${context.tamilFoodPreference ? 'Yes — prioritise Tamil traditional foods' : 'No preference'}
- Dietary restrictions: ${context.restrictions.length > 0 ? context.restrictions.join(', ') : 'None'}

STRICT RULES — follow always:
1. Provide GENERAL NUTRITION INFORMATION only — you are not a doctor
2. Always recommend consulting a qualified healthcare provider for medical issues
3. Never diagnose, prescribe, or recommend specific supplement doses
4. For symptoms like severe pain, bleeding, reduced fetal movement — immediately say: contact your doctor
5. Never claim any food can treat a pregnancy complication or replace medical care
6. Keep responses warm, clear, practical, and under 400 words
7. Prioritise Tamil traditional foods when tamilFoodPreference is true
8. Add ⚠️ safety note for sensitive foods (papaya, herbal remedies, raw foods)
9. Always end with: "_ℹ️ General nutrition information only. Consult your healthcare provider._"

FORMAT: Use **bold** for headings, bullet points with •, emoji for readability.`

  // Build conversation history for Gemini
  const contents = [
    // Inject history as alternating turns
    ...history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user' as const,
      parts: [{ text: m.content }],
    })),
    // Current user message
    { role: 'user' as const, parts: [{ text: message }] },
  ]

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction,
      maxOutputTokens: 700,
      temperature: 0.7,
    },
  })

  const text = response.text ?? ''
  if (!text) throw new Error('empty_response')
  return text
}

// ── Main handler ──────────────────────────────────────────────────────────────
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  let body: RequestBody
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { message, context, history = [] } = body
  if (!message?.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Empty message' }) }
  }

  // ── 1. Medical safety filter ─────────────────────────────────────────────
  if (isMedicalQuery(message)) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: '⚠️ **Please contact your healthcare provider.**\n\nFitTracker provides general nutrition information only and cannot give medical advice. For symptoms, medications, diagnoses, or urgent concerns — please speak with your doctor or midwife immediately.\n\nI\'m happy to help with general nutrition questions like food choices, meal planning, or what nutrients to focus on this trimester.',
        source: 'safety_filter',
      }),
    }
  }

  // ── 2. Rule-based (fast, free, works without any API key) ────────────────
  const ruleResponse = getRuleBasedResponse(message, context)
  if (ruleResponse) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ response: ruleResponse, source: 'rules' }),
    }
  }

  // ── 3. Gemini 2.5 Flash ──────────────────────────────────────────────────
  try {
    const aiResponse = await callGemini(message, context, history)
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ response: aiResponse, source: 'gemini' }),
    }
  } catch (err) {
    const errMsg = String(err)
    const isNoKey = errMsg.includes('no_key')

    // ── 4. Fallback (no key or API error) ──────────────────────────────────
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: `I'm here to help with your pregnancy nutrition questions! For week ${context.week} (Trimester ${context.trimester}), key focus areas are:\n\n🌿 **Folate** — drumstick leaves, spinach, moong dal, orange\n💪 **Iron** — kambu, ragi, keerai, pomegranate\n🦴 **Calcium** — ragi, curd, almonds, drumstick leaves\n💧 **Hydration** — ${context.week >= 29 ? '10–12' : '8–10'} glasses of water daily\n\nTry asking me something specific:\n• "What should I eat for breakfast?"\n• "Give me iron-rich Tamil foods"\n• "What foods should I avoid?"\n• "Give me a 7-day meal plan"\n\n_ℹ️ General nutrition information only. Always consult your healthcare provider._${isNoKey ? '\n\n_(Add GEMINI_API_KEY to Netlify environment variables to enable AI responses.)_' : ''}`,
        source: 'fallback',
      }),
    }
  }
}
