import type { Handler } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface RequestBody {
  message: string
  context: {
    stageId: string
    ageMonths: number
    ageLabel: string
    dietType: 'vegetarian' | 'non_vegetarian' | 'vegan'
    tamilFoodPreference: boolean
    introducedFoods: string[]
    reportedAllergens: string[]
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
const EMERGENCY_KEYWORDS = [
  'choking', 'not breathing', 'allergic reaction', 'swollen', 'hives',
  'vomiting blood', 'unconscious', 'seizure', 'emergency', 'ambulance',
  'hospital', 'diagnose', 'medication', 'medicine', 'prescription',
]

function isEmergencyQuery(msg: string): boolean {
  const lower = msg.toLowerCase()
  return EMERGENCY_KEYWORDS.some(k => lower.includes(k))
}

// ── Rule-based responses ──────────────────────────────────────────────────────
function getRuleBasedResponse(
  message: string,
  ctx: RequestBody['context'],
): string | null {
  const msg    = message.toLowerCase()
  const age    = ctx.ageMonths
  const stage  = ctx.stageId
  const tamil  = ctx.tamilFoodPreference
  const veg    = ctx.dietType === 'vegetarian' || ctx.dietType === 'vegan'
  const isEarlyStage = stage === 'months_0_6'

  // Greeting
  if (/^(hi|hello|hey|namaste|vanakkam)[\s!.,]?$/.test(msg.trim())) {
    if (isEarlyStage) {
      return `Vanakkam! 👶 I'm your FitTracker Baby Nutrition Coach.\n\nYour baby is ${ctx.ageLabel} old — at this stage, **breast milk or infant formula is the complete nutrition**. I can help with:\n\n• Breastfeeding and formula feeding information\n• Feeding cues and frequency\n• When to start solids\n• Safe feeding practices\n\nWhat would you like to know?`
    }
    return `Vanakkam! 👶 I'm your FitTracker Baby Nutrition Coach.\n\nYour baby is **${ctx.ageLabel}** (${stage.replace(/_/g, ' ')}). I can help with:\n\n• What foods to give today\n• Tamil traditional baby foods\n• Meal plan ideas\n• Safe textures for this age\n• Food introduction guidance\n\nWhat would you like to know?`
  }

  // 0–6 months: no solid food questions
  if (isEarlyStage && (msg.includes('food') || msg.includes('eat') || msg.includes('feed solid') || msg.includes('start solid'))) {
    return `At ${ctx.ageLabel}, **breast milk or appropriately prepared infant formula is the only nutrition your baby needs**. Solid foods are generally not recommended before around 6 months.\n\n🍼 **Signs of readiness for solids (usually around 6 months):**\n• Can sit with minimal support\n• Shows interest in food\n• Loss of tongue-thrust reflex (stops pushing food out)\n• Good head control\n\nThese signs together — not one alone — suggest readiness. **Discuss with your paediatrician** before starting solids.\n\n⚠️ Starting solids too early can carry risks. Follow your healthcare provider's guidance.`
  }

  // Breastfeeding / feeding frequency
  if (msg.includes('breastfeed') || msg.includes('breast milk') || msg.includes('nursing') || msg.includes('feed how often') || msg.includes('feeding frequency')) {
    return `**Breastfeeding guidance for ${ctx.ageLabel}:**\n\n🍼 **Frequency:**\n• Newborns: every 1.5–3 hours (8–12 times/day)\n• 1–3 months: every 2–3 hours\n• 4–6 months: every 3–4 hours\n• Feed on demand — let baby guide frequency\n\n**Hunger cues to watch for:**\n• Rooting (turning head, moving mouth)\n• Sucking on hands or fingers\n• Increased alertness\n• Crying is a late hunger cue\n\n**Fullness cues:**\n• Turning away from breast\n• Releasing nipple\n• Relaxed hands\n• Falling asleep contentedly\n\n⚠️ For personalised breastfeeding support, a lactation consultant or your healthcare provider is the best resource.`
  }

  // Iron-rich foods
  if (msg.includes('iron')) {
    if (isEarlyStage) {
      return `For babies under 6 months, breast milk or formula provides the iron they need.\n\nOnce your baby is ready for solids (around 6 months), iron-rich foods become very important.\n\n🌾 **Good iron sources to introduce when ready:**\n${tamil ? '• Ragi (finger millet) — excellent iron\n• Moong dal — easy to digest\n• Rice khichdi with dal\n• Soft-cooked greens\n• ' : ''}• Iron-fortified baby cereals/oatmeal\n• Pureed meat (chicken, fish)\n• Well-cooked egg yolk\n• Lentils\n\nCombine with Vitamin C foods to improve absorption.\n\n⚠️ Discuss iron supplementation with your paediatrician.`
    }
    return `Iron is very important for ${ctx.ageLabel} babies. Good iron sources for this age:\n\n${tamil ? '🌾 **Tamil traditional iron foods:**\n• Ragi (finger millet) — ragi porridge, koozh\n• Kambu (pearl millet) — porridge\n• Moong dal, chana dal\n• Soft khichdi with leafy greens\n\n' : ''}🌍 **Other good iron sources:**\n• Iron-fortified baby oatmeal\n• Well-cooked egg (from ~6 months)\n• Pureed/shredded chicken and fish\n• Lentil soup\n• Quinoa\n\n💡 **Tip:** Pair iron-rich foods with Vitamin C (orange, guava, tomato) to improve absorption.\n\n⚠️ If you're concerned about your baby's iron levels, please consult your paediatrician.`
  }

  // What to eat today / this age
  if (msg.includes('what to give') || msg.includes('what can i give') || msg.includes('what to eat') || msg.includes('today') || msg.includes('meal idea')) {
    if (isEarlyStage) {
      return `At ${ctx.ageLabel}, **breast milk or formula is all your baby needs**. No solid foods are needed at this stage for most babies.\n\nOnce your baby shows signs of readiness (usually around 6 months), great first foods include:\n• Smooth ragi porridge\n• Moong dal puree\n• Mashed banana\n• Avocado mash\n• Pumpkin or sweet potato puree\n\n**Always discuss with your paediatrician before starting solids.**`
    }
    if (stage === 'months_6_9') {
      return `Good meal ideas for ${ctx.ageLabel} baby:\n\n🌅 **Breakfast:** ${tamil ? 'Ragi porridge (smooth)' : 'Baby oatmeal with banana'}\n🍚 **Lunch:** ${tamil ? 'Moong dal & rice khichdi (pureed)' : 'Sweet potato puree + lentil soup'}\n🍎 **Snack:** Banana mash or avocado mash\n🌙 **Dinner:** ${tamil ? 'Bottle gourd & dal puree' : 'Pear puree or pumpkin puree'}\n\n🍼 Continue breast milk or formula on demand.\n\n**Texture:** Smooth purees at this stage.\n\n💡 Introduce one new food at a time. Wait 3–5 days before trying another new food.`
    }
    if (stage === 'months_9_12') {
      return `Meal ideas for ${ctx.ageLabel} baby:\n\n🌅 **Breakfast:** ${tamil ? 'Soft idli mashed with dal' : 'Oatmeal with mashed banana'}\n🍚 **Lunch:** ${tamil ? 'Dal khichdi with soft vegetables' : 'Soft pasta with vegetable sauce'}\n🍎 **Snack:** Soft banana or sweet potato pieces (finger food)\n🌙 **Dinner:** ${tamil ? 'Samai pongal (soft)' : 'Scrambled egg with soft vegetables'}\n\n**Texture:** Soft mashed foods and soft finger foods.\n\n🍼 Continue breast milk/formula 3–4 times/day.\n💧 Small sips of water with meals.`
    }
    return `Meal ideas for your ${ctx.ageLabel} toddler:\n\n🌅 **Breakfast:** ${tamil ? 'Ragi dosa + coconut chutney' : 'Oatmeal with fruit and chopped nuts'}\n🍎 **Morning snack:** Banana or yogurt\n🍚 **Lunch:** ${tamil ? 'Rice + dal + soft vegetable' : 'Pasta/quinoa with vegetables and protein'}\n🌆 **Evening snack:** Fruit pieces or ragi ladoo\n🌙 **Dinner:** ${tamil ? 'Idli + sambar' : 'Soft chapati with dal and vegetables'}\n\n💡 Offer variety. It\'s normal for toddlers to refuse foods — keep offering without pressure.`
  }

  // Tamil food
  if (msg.includes('tamil') || msg.includes('traditional') || msg.includes('south indian')) {
    if (isEarlyStage) {
      return `Great traditional Tamil foods to introduce when your baby is ready for solids (around 6 months):\n\n🥣 **First porridges:**\n• Ragi kanji (finger millet porridge) — excellent calcium and iron\n• Rice kanji — gentle first grain\n• Samai kanji — light millet porridge\n\n🫘 **First protein:**\n• Moong dal puree — easiest to digest\n• Dal-rice khichdi\n\n🥬 **First vegetables:**\n• Bottle gourd (surakkai) puree — very gentle\n• Pumpkin puree\n• Sweet potato mash\n\nThese nutritious traditional foods have been trusted for generations. Discuss starting solids with your paediatrician.`
    }
    return `Tamil traditional foods for ${ctx.ageLabel}:\n\n🥣 **Grains (excellent iron & calcium):**\n• Ragi porridge / koozh — highest calcium millet\n• Kambu porridge — good iron\n• Samai pongal — light and digestible\n• Rice kanji — gentle staple\n\n🫘 **Protein:**\n• Moong dal khichdi\n• Chana dal${!veg ? '\n• Soft chicken curry (well-cooked)\n• Fish (boneless, well-cooked)' : ''}\n\n🥬 **Vegetables:**\n• Pumpkin kootu\n• Bottle gourd\n• Drumstick leaves (from toddler age)\n• Carrot and beans\n\n✨ These are nutrient-dense traditional foods perfect for growing babies.`
  }

  // Texture guidance
  if (msg.includes('texture') || msg.includes('puree') || msg.includes('mash') || msg.includes('finger food') || msg.includes('lump')) {
    return `**Texture progression guide:**\n\n🥣 **Puree** (6–7 months)\nSmooth, no lumps — like yogurt consistency\nExamples: ragi porridge, moong dal puree, mashed banana\n\n🥄 **Mash** (7–8 months)\nThicker, small soft lumps okay\nExamples: mashed khichdi, mashed banana, avocado\n\n🫙 **Soft lumps** (8–10 months)\nSoft pieces baby can gum\nExamples: soft idli pieces, soft cooked vegetables, scrambled egg\n\n✋ **Finger foods** (9–12 months)\nSoft pieces baby can self-feed\nExamples: banana sticks, sweet potato wedges, soft pasta\n\n🍽️ **Family foods** (12+ months)\nMost family foods in appropriate sizes\n\n⚠️ **Choking safety:** Always cut foods to appropriate sizes. No whole grapes, whole nuts, raw hard vegetables, or large meat chunks for babies under 2.`
  }

  // Allergy / introduction
  if (msg.includes('allerg') || msg.includes('introduce') || msg.includes('new food')) {
    return `**Introducing new foods safely for ${ctx.ageLabel}:**\n\n✅ **Current guidance:**\n• Introduce one new food at a time\n• Wait 3–5 days before trying another new food\n• This helps identify any reactions\n• Early introduction of common allergens is now encouraged for most babies (discuss with paediatrician)\n\n🥜 **Common allergens to introduce carefully:**\nEgg, peanut (thinned smooth butter), dairy, wheat, fish, soy, tree nuts, sesame, shellfish\n\n**Signs to watch for after introducing a new food:**\n• Mild: rash around mouth, slight upset stomach\n• Seek medical care for: hives, swelling, vomiting, breathing difficulty\n\n⚠️ **If your baby has eczema or a family history of allergies** — discuss allergen introduction timing with your paediatrician before starting.\n\n⚠️ FitTracker cannot diagnose allergies. Always consult your paediatrician.`
  }

  // Meal plan
  if (msg.includes('meal plan') || msg.includes('weekly') || msg.includes('7 day') || msg.includes('seven day')) {
    if (isEarlyStage) {
      return `At ${ctx.ageLabel}, no solid food meal plan is needed — **breast milk or formula is complete nutrition**.\n\nUse the **Meal Planner** tab once your baby is ready for solids (typically around 6 months with paediatrician guidance).`
    }
    return `Use the **Meal Planner** tab to generate a full ${ctx.ageLabel} meal plan with one click! You can choose:\n• Tamil traditional foods\n• Global foods\n• Mixed\n• 1-day or 7-day plan\n\nHere's a quick sample for today:\n\n${stage === 'months_6_9'
      ? '🌅 Breakfast: Ragi porridge\n🍚 Lunch: Moong dal & rice khichdi\n🍎 Snack: Banana mash\n🌙 Dinner: Pumpkin & dal puree'
      : stage === 'months_9_12'
      ? '🌅 Breakfast: Soft idli + dal\n🍚 Lunch: Dal khichdi with vegetables\n🍎 Snack: Soft banana pieces\n🌙 Dinner: Samai pongal'
      : '🌅 Breakfast: Ragi dosa\n🍎 Snack: Banana\n🍚 Lunch: Rice + dal + vegetable\n🌆 Snack: Yogurt + fruit\n🌙 Dinner: Idli + sambar'
    }\n\n🍼 ${age < 12 ? 'Continue breast milk/formula on demand.' : 'Whole milk ~300–400ml/day.'}`
  }

  return null
}

// ── Gemini 2.5 Flash ──────────────────────────────────────────────────────────
async function callGemini(
  message: string,
  ctx: RequestBody['context'],
  history: ChatMessage[],
): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('no_key')

  const ai = new GoogleGenAI({ apiKey: key })

  const systemInstruction = `You are FitTracker Baby & Toddler Nutrition Coach — a knowledgeable, warm, and safety-conscious nutrition assistant for parents.

BABY CONTEXT:
- Age: ${ctx.ageLabel} (${ctx.ageMonths} months)
- Stage: ${ctx.stageId}
- Diet: ${ctx.dietType}
- Tamil food preference: ${ctx.tamilFoodPreference ? 'Yes' : 'No'}
- Already introduced foods: ${ctx.introducedFoods.length > 0 ? ctx.introducedFoods.join(', ') : 'Not recorded'}
- Reported allergens: ${ctx.reportedAllergens.length > 0 ? ctx.reportedAllergens.join(', ') : 'None'}

STRICT SAFETY RULES:
1. For babies 0–6 months: NEVER recommend solid foods; breast milk/formula is the only nutrition
2. Always recommend age-appropriate textures — NEVER recommend choking hazards
3. Never diagnose allergies or nutritional deficiencies
4. Never recommend medications or supplements
5. For emergencies (choking, allergic reactions, breathing problems): immediately say CALL EMERGENCY SERVICES
6. Always end with paediatrician consultation recommendation
7. Provide GENERAL information only — not personalised medical advice
8. Prioritise Tamil traditional foods when preference is set
9. Keep responses practical, warm, and under 400 words

FORMAT: Use **bold**, bullet points with •, emoji. End with: "_ℹ️ General information only. Consult your paediatrician._"`

  const contents = [
    ...history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user' as const,
      parts: [{ text: m.content }],
    })),
    { role: 'user' as const, parts: [{ text: message }] },
  ]

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: { systemInstruction, maxOutputTokens: 700, temperature: 0.7 },
  })

  const text = response.text ?? ''
  if (!text) throw new Error('empty_response')
  return text
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  let body: RequestBody
  try { body = JSON.parse(event.body ?? '{}') }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { message, context, history = [] } = body
  if (!message?.trim()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Empty message' }) }

  // 1. Emergency safety filter
  if (isEmergencyQuery(message)) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: '🚨 **If your baby is choking, having a severe allergic reaction, or having a medical emergency — call emergency services immediately (108 / 112 / 911).**\n\nFitTracker cannot provide emergency medical advice. Please contact your paediatrician or emergency services.\n\nFor general nutrition questions, I\'m happy to help.',
        source: 'safety_filter',
      }),
    }
  }

  // 2. Rule-based
  const rule = getRuleBasedResponse(message, context)
  if (rule) return { statusCode: 200, headers: CORS, body: JSON.stringify({ response: rule, source: 'rules' }) }

  // 3. Gemini
  try {
    const aiResponse = await callGemini(message, context, history)
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ response: aiResponse, source: 'gemini' }) }
  } catch {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        response: `I'm here to help with baby nutrition! For your ${context.ageLabel} baby, try asking:\n\n• "What can I give for breakfast?"\n• "Give me Tamil food ideas"\n• "What textures are safe at this age?"\n• "How do I introduce new foods?"\n• "Give me a 7-day meal plan"\n\n_ℹ️ General information only. Always consult your paediatrician for personalised advice._`,
        source: 'fallback',
      }),
    }
  }
}
