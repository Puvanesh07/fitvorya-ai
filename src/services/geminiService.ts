// ── AI Coach Service — powered by Groq (llama-3.3-70b-versatile) ─────────────
// Uses VITE_GROQ_API_KEY — baked into the bundle at build time.
// Groq API is OpenAI-compatible: https://console.groq.com/docs/openai
// Free tier: 30 req/min, 14,400 req/day — more than enough for this app.

export interface ChatMessage { role: 'user' | 'assistant'; content: string }

const GROQ_MODEL = 'qwen/qwen3.6-27b'
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'

// ── Core Groq REST call ───────────────────────────────────────────────────────
async function callGroq(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  maxTokens = 700,
): Promise<string> {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set. Add it to your .env file.')

  const messages = [
    { role: 'system',    content: systemPrompt },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user',      content: userMessage },
  ]

  const res = await fetch(GROQ_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      max_tokens:  maxTokens,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq API error ${res.status}: ${errText}`)
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string } }[]
    error?:   { message: string }
  }

  if (data.error) throw new Error(`Groq error: ${data.error.message}`)

  // Strip <think>...</think> reasoning blocks that qwen models include
  const raw  = data.choices?.[0]?.message?.content ?? ''
  const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  if (!text) throw new Error('Empty response from Groq')
  return text
}

// ─────────────────────────────────────────────────────────────────────────────
// PREGNANCY AI
// ─────────────────────────────────────────────────────────────────────────────

export interface PregnancyContext {
  week:                number
  trimester:           1 | 2 | 3
  dietType:            'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'
  restrictions:        string[]
  tamilFoodPreference: boolean
}

const PREGNANCY_MEDICAL_KEYWORDS = [
  'medication', 'medicine', 'drug', 'supplement dose', 'prescription',
  'diagnose', 'diagnosis', 'treat', 'cure', 'hospital', 'emergency',
  'bleeding', 'severe pain', 'contractions before 37', 'miscarriage',
]

function pregnancyIsMedical(msg: string): boolean {
  const lower = msg.toLowerCase()
  return PREGNANCY_MEDICAL_KEYWORDS.some(k => lower.includes(k))
}

function pregnancyRuleResponse(message: string, ctx: PregnancyContext): string | null {
  const msg   = message.toLowerCase()
  const tamil = ctx.tamilFoodPreference
  const veg   = ctx.dietType === 'vegetarian' || ctx.dietType === 'vegan'
  const week  = ctx.week
  const tri   = ctx.trimester

  if (/^(hi|hello|hey|namaste|vanakkam)[\s!.,]?$/.test(msg.trim())) {
    return `Vanakkam! 🤰 I'm your FitTracker Pregnancy Nutrition Coach. You're in week ${week} (Trimester ${tri}).\n\nI can help with:\n• What to eat this week\n• Tamil or global food suggestions\n• Iron, calcium & folate-rich foods\n• Meal plans\n• Foods to enjoy or limit\n\nWhat would you like to know?`
  }

  if (msg.includes('nausea') || msg.includes('morning sickness') || msg.includes('vomit') || msg.includes('sick')) {
    return `For nausea during pregnancy, small frequent meals often help more than large ones.\n\n🍌 **Banana** — Vitamin B6 may ease nausea\n🥣 **Ragi porridge or samai kanji** — light millet gruels\n🍘 **Plain crackers or dry toast** — eat before getting out of bed\n🫚 **Ginger** — small amounts of ginger tea; discuss with your midwife\n🥥 **Coconut water** — gentle hydration\n\n**Tips:**\n• Eat every 2–3 hours — empty stomach worsens nausea\n• Avoid strong smells while cooking\n• Stay upright after eating\n\n⚠️ If you cannot keep food or water down for more than 24 hours, contact your healthcare provider.`
  }

  if (msg.includes('iron') || msg.includes('anaemia') || msg.includes('anemia') || msg.includes('hemoglobin')) {
    const tamilIron = tamil ? '\n\n🌾 **Tamil iron-rich foods:**\n• Kambu (pearl millet) — kanji or roti\n• Ragi — koozh, dosa, porridge\n• Murungai keerai (drumstick leaves) — sambar, kootu\n• Spinach (keerai) — kootu, masiyal\n• Pomegranate\n• Beetroot poriyal' : ''
    const nonvegNote = !veg ? '\n• Well-cooked chicken and fish also provide good iron' : ''
    return `Iron is especially important in pregnancy — your blood volume increases by up to 50%.${tamilIron}\n\n🌍 **Other good iron sources:**\n• Moong dal, chana dal, rajma\n• Spinach, drumstick leaves, beetroot\n• Oats, quinoa\n• Pair with Vitamin C (orange, guava, lemon) to improve absorption${nonvegNote}\n\n⚠️ Your doctor will monitor haemoglobin levels. Iron supplements only as prescribed.`
  }

  if (msg.includes('calcium') || msg.includes('milk alternative') || msg.includes('no milk')) {
    return `Calcium is critical for your baby's bone and teeth development.\n\n${tamil ? '**Tamil calcium sources:**\n• 🌿 Ragi — one of the richest plant calcium sources\n• 🥬 Murungai keerai (drumstick leaves)\n• 🌰 Sesame seeds (ellu) — in moderation\n• 🌰 Soaked almonds\n• 🥛 Curd / dahi\n\n' : ''}**Other options:**\n• Greek yogurt, paneer\n• Fortified plant milks\n• Chia seeds, figs\n\nDiscuss calcium levels with your doctor.`
  }

  if (msg.includes('folate') || msg.includes('folic')) {
    return `Folate is critical ${week <= 13 ? 'especially in your first trimester' : 'throughout pregnancy'} for cell growth.\n\n**Good folate sources:**\n${tamil ? '• Murungai keerai, spinach\n• Ladies finger (vendaikkai)\n• Moong dal, chana dal\n• Beetroot\n• ' : ''}• Orange and orange juice\n• Avocado, lentils, oats\n\n⚠️ Take folic acid supplements only as prescribed by your doctor.`
  }

  if (msg.includes('avoid') || msg.includes('not eat') || msg.includes('unsafe')) {
    return `During pregnancy, generally avoid or limit:\n\n🚫 **Avoid completely:**\n• Alcohol\n• Raw/undercooked meat, poultry, eggs\n• Raw fish / sushi\n• Unpasteurised dairy\n• High-mercury fish: shark, swordfish, king mackerel\n• Raw sprouts\n\n⚠️ **Limit:**\n• Caffeine — under 200mg/day\n• Papaya (unripe/raw)\n• Herbal teas — check with midwife\n\n⚠️ Your healthcare provider may give additional specific advice.`
  }

  if (msg.includes('water') || msg.includes('hydrat')) {
    return `Staying hydrated is vital in pregnancy.\n\n💧 **How much:** ${week >= 29 ? '10–12' : '8–10'} glasses (~${week >= 29 ? '2.5' : '2'}L) daily\n\n✅ **Good choices:**\n• Plain water\n• Coconut water (ilaneer)\n• Buttermilk / chaas\n• Fresh lime water\n\n❌ **Limit:**\n• Carbonated drinks\n• High-sugar juices\n• Caffeine under 200mg/day\n\n💡 Dehydration can trigger Braxton Hicks contractions.`
  }

  if (msg.includes('tamil') || msg.includes('traditional') || msg.includes('south indian')) {
    return `Tamil traditional foods for week ${week}:\n\n🌾 **Millets:**\n• Kambu (pearl millet) — kanji, idli, roti\n• Ragi — koozh, dosa, mudde\n• Thinai (foxtail millet) — pongal, upma\n• Samai (little millet)\n\n🍚 **Traditional rice:**\n• Karuppu kavuni rice — antioxidants + iron\n• Red rice / hand-pounded rice\n\n🥬 **Greens:**\n• Murungai keerai — iron, calcium, folate\n• Keerai varieties\n• Vazhaithandu (banana stem)\n\n🫘 **Protein:**\n• Moong dal, sundal, karamani${!veg ? '\n• Chettinad chicken (well-cooked)\n• Fish curry (low-mercury)' : ''}\n\n✨ Trusted, nutrient-dense foods for generations.`
  }

  if (msg.includes('what to eat') || msg.includes('what should i eat') || msg.includes('today') || msg.includes('this week')) {
    return `For week ${week} (Trimester ${tri}):\n\n${
      tri === 1
        ? '🌿 **Focus:** Folate, Iron, Vitamin B6\n\n🌅 Breakfast: Ragi porridge + banana\n🍎 Snack: Orange or guava\n🍚 Lunch: Rice + drumstick sambar + keerai kootu\n🌙 Dinner: Kambu idli + moong dal'
        : tri === 2
        ? '💪 **Focus:** Iron, Protein, Calcium, Omega-3\n\n🌅 Breakfast: Oatmeal + pomegranate + almonds\n🍎 Snack: Guava + walnuts\n🍚 Lunch: Red rice + ' + (veg ? 'dal + keerai kootu' : 'fish curry + keerai') + '\n🌙 Dinner: Ragi dosa + ' + (veg ? 'dal' : 'chicken curry')
        : '🤱 **Focus:** Calcium, Iron, Light meals\n\n🌅 Breakfast: Kambu kanji + dates\n🍎 Snack: Orange + almonds\n🍚 Lunch: Rice + ' + (veg ? 'sambar + beetroot poriyal' : 'chicken curry + drumstick sambar') + '\n🌙 Dinner: Soft idli + drumstick sambar'
    }\n\n💧 Drink ${week >= 29 ? '10–12' : '8–10'} glasses of water.\n\n📋 Use the **Meal Planner** tab for a full 7-day plan!`
  }

  if (msg.includes('meal plan') || msg.includes('weekly') || msg.includes('7 day')) {
    return `Here's a sample ${tamil ? 'Tamil' : 'mixed'} ${veg ? 'vegetarian' : ''} meal plan for week ${week}:\n\n**Monday**\n🌅 Breakfast: Ragi dosa + coconut chutney\n🍎 Snack: Banana + almonds\n🍚 Lunch: Red rice + drumstick sambar + spinach kootu\n🌙 Dinner: Kambu idli + moong dal\n\n**Tuesday**\n🌅 Breakfast: Oatmeal + pomegranate + walnuts\n🍎 Snack: Guava + peanuts\n🍚 Lunch: ${veg ? 'Chana dal rice + beetroot poriyal + curd' : 'Red rice + fish curry + keerai'}\n🌙 Dinner: Thinai pongal + rasam\n\n**Wednesday**\n🌅 Breakfast: Samai upma + coconut chutney\n🍎 Snack: Orange + almonds\n🍚 Lunch: ${veg ? 'Ragi roti + dal + sabzi' : 'Rice + chicken kulambu + beans poriyal'}\n🌙 Dinner: Idli + drumstick sambar\n\n💧 Drink ${week >= 29 ? '10–12' : '8–10'} glasses of water daily.`
  }

  return null
}

export async function askPregnancyAI(
  message: string,
  ctx: PregnancyContext,
  history: ChatMessage[],
): Promise<string> {
  // 1. Safety filter
  if (pregnancyIsMedical(message)) {
    return '⚠️ **Please contact your healthcare provider.**\n\nFitTracker provides general nutrition information only and cannot give medical advice. For symptoms, medications, or urgent concerns — speak with your doctor or midwife immediately.\n\nI\'m happy to help with general nutrition questions, meal planning, and food choices.'
  }

  // 2. Rule-based (instant, no API call)
  const rule = pregnancyRuleResponse(message, ctx)
  if (rule) return rule

  // 3. Groq
  const systemPrompt = `You are FitTracker AI Pregnancy Nutrition Coach — a focused, warm nutrition assistant for pregnant women.

USER CONTEXT:
- Pregnancy week: ${ctx.week} (Trimester ${ctx.trimester})
- Diet type: ${ctx.dietType}
- Tamil food preference: ${ctx.tamilFoodPreference ? 'Yes — prioritise Tamil traditional foods like ragi, kambu, murungai keerai, red rice' : 'No preference'}
- Dietary restrictions: ${ctx.restrictions.length > 0 ? ctx.restrictions.join(', ') : 'None'}

RESPONSE LENGTH RULES — follow exactly:
- Normal answers: maximum 3 lines. Be direct and concise.
- Exception: if the user explicitly asks for a meal plan, 7-day plan, weekly plan, or table — provide a complete, well-formatted table or structured plan. No length limit for these.

TOPIC RULES:
- Only answer questions related to: pregnancy nutrition, foods to eat/avoid, meal planning, hydration, Tamil traditional foods, breastfeeding preparation, weight during pregnancy, supplements (general info only).
- If the user asks about anything unrelated (coding, sports, general knowledge, current events, etc.) — reply with exactly: "I can only help with pregnancy nutrition and wellness questions. Please ask something related to your pregnancy diet or meal planning."

SAFETY RULES:
1. General nutrition information only — never diagnose or prescribe
2. Severe pain / bleeding / emergencies → say: contact your doctor immediately
3. ⚠️ note for sensitive foods (papaya, herbal remedies, raw foods)
4. End every response with: "_ℹ️ General info only. Consult your healthcare provider._"

FORMAT: **bold** for key terms, • bullet points, emoji. Keep it clean and readable.`

  return callGroq(systemPrompt, history, message, 1200)
}

// ─────────────────────────────────────────────────────────────────────────────

export interface BabyContext {
  stageId:            string
  ageMonths:          number
  ageLabel:           string
  dietType:           'vegetarian' | 'non_vegetarian' | 'vegan'
  tamilFoodPreference: boolean
  introducedFoods:    string[]
  reportedAllergens:  string[]
}

const BABY_EMERGENCY_KEYWORDS = [
  'choking', 'not breathing', 'allergic reaction', 'swollen', 'hives',
  'vomiting blood', 'unconscious', 'seizure', 'emergency', 'ambulance',
  'hospital', 'diagnose', 'medication', 'medicine', 'prescription',
]

function babyIsEmergency(msg: string): boolean {
  return BABY_EMERGENCY_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

function babyRuleResponse(message: string, ctx: BabyContext): string | null {
  const msg          = message.toLowerCase()
  const age          = ctx.ageMonths
  const stage        = ctx.stageId
  const tamil        = ctx.tamilFoodPreference
  const veg          = ctx.dietType === 'vegetarian' || ctx.dietType === 'vegan'
  const isEarlyStage = stage === 'months_0_6'

  if (/^(hi|hello|hey|namaste|vanakkam)[\s!.,]?$/.test(msg.trim())) {
    if (isEarlyStage) {
      return `Vanakkam! 👶 I'm your FitTracker Baby Nutrition Coach.\n\nYour baby is ${ctx.ageLabel} old. At this stage, **breast milk or infant formula is the complete nutrition**.\n\nI can help with:\n• Breastfeeding guidance\n• Feeding cues and frequency\n• When to start solids\n• Safe feeding practices\n\nWhat would you like to know?`
    }
    return `Vanakkam! 👶 I'm your FitTracker Baby Nutrition Coach.\n\nYour baby is **${ctx.ageLabel}** (${stage.replace(/_/g, ' ')} stage).\n\nI can help with:\n• What foods to give today\n• Tamil traditional baby foods\n• Meal plan ideas\n• Safe textures for this age\n• Food introduction guidance\n\nWhat would you like to know?`
  }

  if (isEarlyStage && (msg.includes('food') || msg.includes('eat') || msg.includes('solid'))) {
    return `At ${ctx.ageLabel}, **breast milk or infant formula is the only nutrition your baby needs**. Solid foods are not recommended before around 6 months.\n\n🍼 **Signs of readiness (usually ~6 months):**\n• Can sit with minimal support\n• Shows interest in food\n• Loss of tongue-thrust reflex\n• Good head control\n\n**Discuss with your paediatrician before starting solids.**\n\n⚠️ Starting solids too early can carry risks.`
  }

  if (msg.includes('breastfeed') || msg.includes('breast milk') || msg.includes('nursing') || msg.includes('feeding frequency')) {
    return `**Breastfeeding guidance for ${ctx.ageLabel}:**\n\n🍼 **Frequency:**\n• Newborns: every 1.5–3 hours (8–12×/day)\n• 1–3 months: every 2–3 hours\n• 4–6 months: every 3–4 hours\n• Feed on demand — let baby guide you\n\n**Hunger cues:**\n• Rooting (turning head, moving mouth)\n• Sucking on hands\n• Increased alertness\n• Crying is a late cue\n\n**Fullness cues:**\n• Turning away from breast\n• Relaxed hands, content\n\n⚠️ For personalised support, consult a lactation consultant.`
  }

  if (msg.includes('iron')) {
    if (isEarlyStage) {
      return `For babies under 6 months, breast milk or formula provides all the iron needed.\n\nOnce ready for solids (~6 months), good iron sources include:\n${tamil ? '• Ragi (finger millet) — excellent iron\n• Moong dal — easy to digest\n• Rice khichdi with dal\n• ' : ''}• Iron-fortified baby cereals\n• Pureed chicken or fish\n• Lentils\n\nPair with Vitamin C foods to boost absorption.\n\n⚠️ Discuss iron supplementation with your paediatrician.`
    }
    return `Iron is vital for ${ctx.ageLabel} babies:\n\n${tamil ? '🌾 **Tamil iron foods:**\n• Ragi porridge / koozh\n• Kambu porridge\n• Moong dal khichdi + leafy greens\n\n' : ''}🌍 **Other sources:**\n• Iron-fortified oatmeal\n• Well-cooked egg (from ~6 months)\n• Pureed chicken, fish, lentils\n• Quinoa\n\n💡 Pair with Vitamin C for better absorption.\n\n⚠️ Consult your paediatrician if concerned about iron levels.`
  }

  if (msg.includes('what to give') || msg.includes('what can i give') || msg.includes('meal idea') || msg.includes('today')) {
    if (isEarlyStage) {
      return `At ${ctx.ageLabel}, **breast milk or formula is all your baby needs**.\n\nWhen ready (~6 months), great first foods:\n• Smooth ragi porridge\n• Moong dal puree\n• Mashed banana\n• Avocado mash\n• Pumpkin / sweet potato puree\n\n**Always discuss with your paediatrician before starting solids.**`
    }
    if (stage === 'months_6_9') {
      return `Meal ideas for ${ctx.ageLabel}:\n\n🌅 **Breakfast:** ${tamil ? 'Ragi porridge (smooth)' : 'Baby oatmeal + banana'}\n🍚 **Lunch:** ${tamil ? 'Moong dal + rice khichdi (pureed)' : 'Sweet potato puree + lentil soup'}\n🍎 **Snack:** Banana mash or avocado mash\n🌙 **Dinner:** ${tamil ? 'Bottle gourd + dal puree' : 'Pear or pumpkin puree'}\n\n🍼 Continue breast milk/formula on demand.\n**Texture:** Smooth purees.\n💡 Introduce one new food at a time. Wait 3–5 days before trying another.`
    }
    if (stage === 'months_9_12') {
      return `Meal ideas for ${ctx.ageLabel}:\n\n🌅 **Breakfast:** ${tamil ? 'Soft idli mashed with dal' : 'Oatmeal + mashed banana'}\n🍚 **Lunch:** ${tamil ? 'Dal khichdi + soft vegetables' : 'Soft pasta + vegetable sauce'}\n🍎 **Snack:** Soft banana or sweet potato pieces\n🌙 **Dinner:** ${tamil ? 'Samai pongal (soft)' : 'Scrambled egg + soft vegetables'}\n\n**Texture:** Soft mashed foods + soft finger foods.\n🍼 Breast milk/formula 3–4×/day. Small sips of water with meals.`
    }
    return `Meal ideas for your ${ctx.ageLabel} toddler:\n\n🌅 **Breakfast:** ${tamil ? 'Ragi dosa + coconut chutney' : 'Oatmeal + fruit + chopped nuts'}\n🍎 **Snack:** Banana or yogurt\n🍚 **Lunch:** ${tamil ? 'Rice + dal + soft vegetable' : 'Pasta/quinoa + vegetables + protein'}\n🌆 **Snack:** Fruit pieces or ragi ladoo\n🌙 **Dinner:** ${tamil ? 'Idli + sambar' : 'Soft chapati + dal + vegetables'}\n\n💡 It's normal for toddlers to refuse foods — keep offering without pressure.`
  }

  if (msg.includes('tamil') || msg.includes('traditional') || msg.includes('south indian')) {
    if (isEarlyStage) {
      return `Tamil foods to introduce when your baby is ready (~6 months):\n\n🥣 **First porridges:**\n• Ragi kanji — excellent calcium + iron\n• Rice kanji — gentle first grain\n• Samai kanji — light millet\n\n🫘 **First protein:**\n• Moong dal puree — easiest to digest\n• Dal-rice khichdi\n\n🥬 **First vegetables:**\n• Bottle gourd (surakkai) — very gentle\n• Pumpkin puree\n• Sweet potato mash\n\nDiscuss starting solids with your paediatrician.`
    }
    return `Tamil foods for ${ctx.ageLabel}:\n\n🥣 **Grains:**\n• Ragi porridge / koozh\n• Kambu porridge\n• Samai pongal\n• Rice kanji\n\n🫘 **Protein:**\n• Moong dal khichdi\n• Chana dal${!veg ? '\n• Soft chicken curry (well-cooked)\n• Fish (boneless, well-cooked)' : ''}\n\n🥬 **Vegetables:**\n• Pumpkin kootu\n• Bottle gourd\n• Drumstick leaves (toddler age+)\n• Carrot and beans\n\n✨ Nutrient-dense traditional foods for growing babies.`
  }

  if (msg.includes('texture') || msg.includes('puree') || msg.includes('finger food')) {
    return `**Texture progression:**\n\n🥣 **Puree** (6–7 months) — Smooth like yogurt\nRagi porridge, moong dal puree, mashed banana\n\n🥄 **Mash** (7–8 months) — Thicker, small soft lumps\nMashed khichdi, avocado\n\n🫙 **Soft lumps** (8–10 months) — Soft pieces baby can gum\nSoft idli pieces, scrambled egg\n\n✋ **Finger foods** (9–12 months) — Soft self-feed pieces\nBanana sticks, sweet potato wedges\n\n🍽️ **Family foods** (12+ months)\n\n⚠️ **Choking safety:** No whole grapes, whole nuts, raw hard vegetables for under 2.`
  }

  if (msg.includes('allerg') || msg.includes('introduce') || msg.includes('new food')) {
    return `**Introducing new foods safely for ${ctx.ageLabel}:**\n\n✅ **Key rules:**\n• One new food at a time\n• Wait 3–5 days before trying another\n• Early allergen introduction is now encouraged (discuss with paediatrician)\n\n🥜 **Common allergens to introduce carefully:**\nEgg, peanut (smooth butter), dairy, wheat, fish, soy, tree nuts, sesame\n\n**Watch for after new food:**\n• Mild: rash around mouth, slight upset stomach\n• Seek care: hives, swelling, vomiting, breathing difficulty\n\n⚠️ FitTracker cannot diagnose allergies. Always consult your paediatrician.`
  }

  if (msg.includes('meal plan') || msg.includes('weekly') || msg.includes('7 day')) {
    if (isEarlyStage) {
      return `At ${ctx.ageLabel}, no solid meal plan needed — **breast milk or formula is complete nutrition**.\n\nUse the **Meal Planner** tab once your baby is ready for solids (~6 months with paediatrician guidance).`
    }
    return `Use the **Meal Planner** tab for a full ${ctx.ageLabel} plan!\n\nSample for today:\n\n${stage === 'months_6_9'
      ? '🌅 Breakfast: Ragi porridge\n🍚 Lunch: Moong dal + rice khichdi\n🍎 Snack: Banana mash\n🌙 Dinner: Pumpkin + dal puree'
      : stage === 'months_9_12'
      ? '🌅 Breakfast: Soft idli + dal\n🍚 Lunch: Dal khichdi + vegetables\n🍎 Snack: Soft banana pieces\n🌙 Dinner: Samai pongal'
      : '🌅 Breakfast: Ragi dosa\n🍎 Snack: Banana\n🍚 Lunch: Rice + dal + vegetable\n🌆 Snack: Yogurt + fruit\n🌙 Dinner: Idli + sambar'
    }\n\n🍼 ${age < 12 ? 'Continue breast milk/formula on demand.' : 'Whole milk ~300–400ml/day.'}`
  }

  return null
}

export async function askBabyAI(
  message: string,
  ctx: BabyContext,
  history: ChatMessage[],
): Promise<string> {
  // 1. Emergency filter
  if (babyIsEmergency(message)) {
    return '🚨 **If your baby is choking, having a severe allergic reaction, or a medical emergency — call emergency services immediately (108 / 112 / 911).**\n\nFitTracker cannot provide emergency medical advice. Contact your paediatrician or emergency services.\n\nFor general nutrition questions, I\'m happy to help.'
  }

  // 2. Rule-based
  const rule = babyRuleResponse(message, ctx)
  if (rule) return rule

  // 3. Groq
  const systemPrompt = `You are FitTracker Baby & Toddler Nutrition Coach — a focused, warm nutrition assistant for parents.

BABY CONTEXT:
- Age: ${ctx.ageLabel} (${ctx.ageMonths} months)
- Stage: ${ctx.stageId}
- Diet: ${ctx.dietType}
- Tamil food preference: ${ctx.tamilFoodPreference ? 'Yes — prioritise ragi, kambu, samai, moong dal' : 'No'}
- Introduced foods: ${ctx.introducedFoods.length > 0 ? ctx.introducedFoods.join(', ') : 'Not recorded'}
- Reported allergens: ${ctx.reportedAllergens.length > 0 ? ctx.reportedAllergens.join(', ') : 'None'}

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

  return callGroq(systemPrompt, history, message, 1200)
}
// ─────────────────────────────────────────────────────────────────────────────
// FAMILY AI
// ─────────────────────────────────────────────────────────────────────────────

export interface FamilyMemberSummary {
  name:                string
  role:                string
  ageLabel:            string
  dietPref:            string
  allergies:           string[]
  pregnancyWeek?:      number
  ageMonths?:          number
  tamilFoodPreference: boolean
}

export interface FamilySummary {
  familyName:        string
  cuisinePreference: string
  members:           FamilyMemberSummary[]
}

const FAMILY_MEDICAL_KEYWORDS = [
  'diagnose', 'prescription', 'medication', 'medicine', 'treat disease',
  'cure', 'hospital emergency', 'severe allergic reaction', 'anaphylaxis',
]

function familyIsMedical(msg: string): boolean {
  return FAMILY_MEDICAL_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

const ROLE_EMOJIS: Record<string, string> = {
  adult_male: '👨', adult_female: '👩', pregnant: '🤰',
  baby: '👶', toddler: '🧒', senior_male: '👴', senior_female: '👵', child: '🧒',
}

function familyRuleResponse(message: string, summary: FamilySummary): string | null {
  const msg      = message.toLowerCase()
  const members  = summary.members
  const cuisine  = summary.cuisinePreference
  const hasTamil = cuisine === 'tamil' || cuisine === 'mixed' || members.some(m => m.tamilFoodPreference)
  const allVeg   = members.every(m => m.dietPref === 'vegetarian' || m.dietPref === 'vegan')

  if (/^(hi|hello|hey|vanakkam|namaste)[\s!.,]?$/.test(msg.trim())) {
    const list = members.map(m => `${m.name} (${m.role})`).join(', ')
    return `Vanakkam! 👨‍👩‍👧 I'm your FitTracker Family Nutrition Coach!\n\nYour family: **${list}**\n\nI can help with:\n• Family meal ideas adapted for each member\n• Weekly meal plans\n• Tamil traditional or global food options\n• Shopping list generation\n• Ingredient substitutions\n\nWhat can I help with today?`
  }

  if ((msg.includes('tamil') || msg.includes('traditional')) && (msg.includes('dinner') || msg.includes('meal'))) {
    return `Tamil family dinner idea:\n\n🍚 **Base:** Red Rice + Drumstick Sambar + Keerai Kootu + Appalam\n\n**Per member:**\n${members.map(m => {
      if (m.role === 'baby')    return `👶 ${m.name}: Soft mashed khichdi + drumstick puree`
      if (m.role === 'toddler') return `🧒 ${m.name}: Small rice + dal + mashed vegetables`
      if (m.role === 'pregnant') return `🤰 ${m.name}: Extra sambar + keerai kootu for iron + calcium`
      if (m.role === 'senior_male' || m.role === 'senior_female') return `👴 ${m.name}: Moderate portion, softer kootu, less spice`
      return `${ROLE_EMOJIS[m.role] ?? '👤'} ${m.name}: Standard portion`
    }).join('\n')}\n\n💡 Add a small curd serving for probiotics.\n\n_ℹ️ General information only. Consult healthcare provider for medical dietary needs._`
  }

  if (msg.includes('shopping') || msg.includes('grocery') || msg.includes('ingredients')) {
    const foods = hasTamil
      ? ['Ragi flour', 'Red rice', 'Moong dal', 'Drumstick leaves', 'Spinach (keerai)', 'Banana', 'Eggs', 'Curd']
      : ['Oats', 'Quinoa', 'Lentils', 'Spinach', 'Sweet potato', 'Avocado', 'Eggs', 'Greek yogurt']
    return `Quick shopping list for your family:\n\n${foods.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n📋 Use the **Shopping List** tab to generate a full categorised list you can tick off as you shop!`
  }

  if (msg.includes('vegetarian') || (allVeg && msg.includes('meal'))) {
    return `Nutritious vegetarian family meal:\n\n🍽️ **Base:** Kambu Roti + Dal Tadka + Mixed Vegetable Sabzi + Curd\n\n**Per member:**\n${members.map(m => {
      if (m.role === 'baby')     return `👶 ${m.name}: Soft moong dal + mashed sweet potato`
      if (m.role === 'toddler')  return `🧒 ${m.name}: Small roti pieces + soft dal + vegetable mash`
      if (m.role === 'pregnant') return `🤰 ${m.name}: Extra dal + iron-rich greens side`
      return `${ROLE_EMOJIS[m.role] ?? '👤'} ${m.name}: Standard portion`
    }).join('\n')}\n\n_ℹ️ General guidance only._`
  }

  if (msg.includes('weekly') || msg.includes('week plan') || msg.includes('7 day')) {
    return `Use the **Weekly Planner** tab for a full 7-day plan! 📅\n\nIt will:\n• Generate a complete plan for every family member\n• Choose Tamil, Global, or Mixed cuisine\n• Regenerate any single day\n• Include adaptations per member\n\nOr tell me what kind of week plan you want and I'll suggest ideas!`
  }

  if (msg.includes('breakfast')) {
    const options = hasTamil
      ? '• Idli + Sambar (soft mash for baby)\n• Ragi dosa + coconut chutney\n• Kambu idli + drumstick sambar'
      : '• Oatmeal with fruit (soft for baby)\n• Scrambled eggs + whole grain toast\n• Greek yogurt parfait'
    const adaptations = members
      .filter(m => ['baby', 'toddler', 'pregnant'].includes(m.role))
      .map(m => {
        if (m.role === 'baby')     return `👶 ${m.name}: Ragi porridge or mashed banana`
        if (m.role === 'toddler')  return `🧒 ${m.name}: Small idli pieces or soft dosa`
        return `🤰 ${m.name}: Extra ragi for calcium`
      }).join('\n') || 'All members: standard portion'
    return `Breakfast ideas for your family:\n\n${options}\n\n**Adaptations:**\n${adaptations}\n\n_ℹ️ General information only._`
  }

  return null
}

export async function askFamilyAI(
  message: string,
  summary: FamilySummary,
  history: ChatMessage[],
): Promise<string> {
  // 1. Medical filter
  if (familyIsMedical(message)) {
    return '⚠️ **Please contact your healthcare provider** for medical dietary advice.\n\nFitTracker provides general nutrition information only.\n\nI\'m happy to help with general family meal ideas, food choices, and meal planning.'
  }

  // 2. Rule-based
  const rule = familyRuleResponse(message, summary)
  if (rule) return rule

  // 3. Groq
  const memberContext = summary.members.map(m =>
    `- ${m.name} (${m.role}, ${m.ageLabel}): ${m.dietPref}` +
    (m.allergies.length ? `, allergic to: ${m.allergies.join(', ')}` : '') +
    (m.pregnancyWeek  ? `, pregnancy week ${m.pregnancyWeek}` : '') +
    (m.ageMonths      ? `, ${m.ageMonths} months old` : '')
  ).join('\n')

  const systemPrompt = `You are FitTracker Family Nutrition Coach — a focused, warm nutrition assistant for families.

FAMILY CONTEXT:
Family name: ${summary.familyName}
Cuisine preference: ${summary.cuisinePreference}
Members:
${memberContext}

RESPONSE LENGTH RULES — follow exactly:
- Normal answers: maximum 3 lines. Be direct and concise.
- Exception: if the user explicitly asks for a meal plan, 7-day plan, weekly plan, shopping list, or table — provide a complete, well-formatted table or structured plan. No length limit for these.

TOPIC RULES:
- Only answer questions related to: family nutrition, meal planning, food adaptations for each member, Tamil traditional foods, shopping lists, ingredient substitutions, weekly meal plans, baby/toddler/pregnancy food adaptations.
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

  return callGroq(systemPrompt, history, message, 1200)
}

