// ── Shared browser Gemini client ──────────────────────────────────────────────
// Uses VITE_GEMINI_API_KEY — baked into the bundle at build time.
// Restrict this key to your domain in Google AI Studio for security.

export interface ChatMessage { role: 'user' | 'assistant'; content: string }

// ── Direct REST call — avoids SDK URL construction quirks in browser builds ───
async function callGeminiREST(
  systemInstruction: string,
  history: ChatMessage[],
  message: string,
  maxOutputTokens = 700,
): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!key) throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file.')

  const contents = [
    ...history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { maxOutputTokens, temperature: 0.7 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

// ─────────────────────────────────────────────────────────────────────────────
// PREGNANCY AI
// ─────────────────────────────────────────────────────────────────────────────

export interface PregnancyContext {
  week: number
  trimester: 1 | 2 | 3
  dietType: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'
  restrictions: string[]
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
  const msg  = message.toLowerCase()
  const tamil = ctx.tamilFoodPreference
  const veg   = ctx.dietType === 'vegetarian' || ctx.dietType === 'vegan'
  const week  = ctx.week
  const tri   = ctx.trimester

  if (/^(hi|hello|hey|namaste|vanakkam)[\s!.,]?$/.test(msg.trim())) {
    return `Vanakkam! 🤰 I'm your FitTracker Pregnancy Nutrition Coach. You're in week ${week} of your pregnancy (Trimester ${tri}). I can help with:\n\n• What to eat this week\n• Tamil or global food suggestions\n• Iron, calcium & folate-rich foods\n• Meal plans\n• Foods to enjoy or limit\n\nWhat would you like to know?`
  }

  if (msg.includes('nausea') || msg.includes('morning sickness') || msg.includes('vomit') || msg.includes('sick')) {
    return `For nausea during pregnancy, small frequent meals often help more than large ones.\n\n🍌 **Banana** — Vitamin B6 may ease nausea; easy to digest\n🥣 **Ragi porridge or samai kanji** — light millet gruels\n🍘 **Plain crackers or dry toast** — eat before getting out of bed\n🫚 **Ginger** — small amounts of ginger tea are traditionally used; discuss with your midwife\n🥥 **Coconut water** — gentle hydration\n\n**Tips:**\n• Eat every 2–3 hours — empty stomach worsens nausea\n• Avoid strong smells while cooking\n• Stay upright after eating\n\n⚠️ If you cannot keep food or water down for more than 24 hours, please contact your healthcare provider.`
  }

  if (msg.includes('iron') || msg.includes('anaemia') || msg.includes('anemia') || msg.includes('hemoglobin')) {
    const tamilIron = tamil ? '\n\n🌾 **Tamil iron-rich foods:**\n• Kambu (pearl millet) — kanji or roti\n• Ragi — koozh, dosa, porridge\n• Drumstick leaves (murungai keerai) — sambar, kootu\n• Spinach (keerai) — kootu, masiyal\n• Pomegranate — seeds or juice\n• Beetroot poriyal' : ''
    const nonvegNote = !veg ? '\n• Well-cooked chicken and fish also provide good iron' : ''
    return `Iron is especially important in pregnancy — your blood volume increases by up to 50%.${tamilIron}\n\n🌍 **Other good iron sources:**\n• Moong dal, chana dal, rajma\n• Spinach, drumstick leaves, beetroot\n• Oats, quinoa\n• Pair with Vitamin C (orange, guava, lemon) to improve absorption${nonvegNote}\n\n⚠️ Your doctor will monitor your haemoglobin levels. Iron supplements should only be taken as prescribed.`
  }

  if (msg.includes('calcium') || msg.includes('bone') || msg.includes('no milk') || msg.includes("don't like milk") || msg.includes('milk alternative')) {
    return `Calcium is critical for your baby's bone and teeth development.${tamil ? '\n\n**Tamil calcium sources:**\n• 🌿 Ragi (finger millet) — one of the richest plant calcium sources\n• 🥬 Drumstick leaves (murungai keerai) — exceptionally high calcium\n• 🌰 Sesame seeds (ellu) — in moderation\n• 🌰 Almonds — 8–10 soaked daily\n• 🥛 Curd / dahi — curd rice, raita\n\n' : ''}\n**You don't have to drink plain milk:**\n• Greek yogurt, paneer\n• Fortified plant milks (oat, almond, soy)\n• Chia seeds, figs\n• Ragi alone can provide significant calcium\n\nDiscuss your calcium levels with your doctor.`
  }

  if (msg.includes('folate') || msg.includes('folic') || msg.includes('neural tube')) {
    return `Folate is critical ${week <= 13 ? 'especially now in your first trimester' : 'throughout pregnancy'} for cell growth and blood production.\n\n**Good folate sources:**\n${tamil ? '• Drumstick leaves (murungai keerai)\n• Spinach (palak keerai)\n• Ladies finger (vendaikkai)\n• Moong dal, chana dal\n• Beetroot\n• ' : ''}• Orange and orange juice\n• Avocado\n• Lentils and beans\n• Oats\n\n⚠️ Folic acid supplements are typically recommended during pregnancy. Take only what your doctor has prescribed.`
  }

  if ((msg.includes('protein') && veg) || (msg.includes('vegetarian') && msg.includes('protein'))) {
    return `Great vegetarian protein sources for pregnancy:\n\n🫘 **Dals and legumes:**\n• Moong dal — easiest to digest, good folate\n• Chana dal / kabuli chana\n• Rajma, lentils, cowpeas (karamani)\n\n${ctx.dietType !== 'vegan' ? '🥛 **Dairy:**\n• Curd / Greek yogurt — protein + calcium\n• Paneer — protein + calcium\n\n' : ''}${ctx.dietType === 'eggetarian' ? '🥚 **Eggs** — complete protein with choline; always fully cooked\n\n' : ''}🌾 **Grains:**\n• Quinoa — complete protein (all amino acids)\n• Ragi — plant protein + calcium\n• Kambu — protein + iron\n\n🌰 **Nuts:** Almonds, walnuts, groundnuts, chia seeds\n\nAim to include a protein source at every meal.`
  }

  if (msg.includes('protein') && !veg) {
    return `Good protein sources for pregnancy (week ${week}):\n\n🥚 **Eggs** — complete protein + choline for brain development; always fully cooked\n🐟 **Low-mercury fish** — tilapia, catfish, sardines, rohu; 2–3 portions/week\n🍗 **Chicken** — lean protein + B vitamins; always thoroughly cooked\n\n🫘 **Plant proteins:**\n• Moong dal, chana dal, lentils\n• Curd, Greek yogurt, paneer\n${tamil ? '• Ragi, kambu, thinai\n' : ''}• Quinoa, oats\n• Almonds, groundnuts\n\nAim for protein at every meal.`
  }

  if (msg.includes('tamil') || msg.includes('traditional') || msg.includes('south indian')) {
    return `Here are wonderful Tamil traditional foods for week ${week}:\n\n🌾 **Millets (excellent iron + calcium):**\n• Kambu (pearl millet) — kanji, idli, roti\n• Ragi (finger millet) — koozh, dosa, mudde, porridge\n• Thinai (foxtail millet) — pongal, upma\n• Samai (little millet) — easy on digestion\n\n🍚 **Traditional rice:**\n• Karuppu kavuni rice — antioxidants and iron\n• Red rice / hand-pounded rice\n\n🥬 **Traditional greens:**\n• Murungai keerai (drumstick leaves) — iron, calcium, folate\n• Keerai varieties — spinach, arai keerai, siru keerai\n• Vazhaithandu (banana stem) — fibre, potassium\n\n🫘 **Proteins:**\n• Moong dal, chana dal sundal, karamani${!veg ? '\n• Chettinad chicken (well-cooked, mild)\n• Fish curry (low-mercury, well-cooked)' : ''}\n\n✨ These are nutrient-dense foods trusted across generations.`
  }

  if (msg.includes('meal plan') || msg.includes('weekly plan') || msg.includes('7 day') || msg.includes('seven day')) {
    return `Here's a sample ${tamil ? 'Tamil' : 'mixed'} ${veg ? 'vegetarian' : ''} meal plan for week ${week}:\n\n**Monday**\n🌅 Breakfast: Ragi dosa + coconut chutney + sambar\n🍎 Snack: Banana + soaked almonds\n🍚 Lunch: Red rice + drumstick sambar + spinach kootu\n🌙 Dinner: Kambu idli + moong dal\n\n**Tuesday**\n🌅 Breakfast: Oatmeal with pomegranate and walnuts\n🍎 Snack: Guava + peanuts\n🍚 Lunch: ${veg ? 'Chana dal rice + beetroot poriyal + curd' : 'Red rice + fish curry + keerai'}\n🌙 Dinner: Thinai pongal + rasam\n\n**Wednesday**\n🌅 Breakfast: Samai upma + coconut chutney\n🍎 Snack: Orange + soaked almonds\n🍚 Lunch: ${veg ? 'Ragi roti + dal + mixed vegetable curry' : 'Rice + chicken kulambu + beans poriyal'}\n🌙 Dinner: Idli + drumstick sambar\n\n💧 Drink ${week >= 29 ? '10–12' : '8–10'} glasses of water daily.\n\n📋 Use the **Meal Planner** tab for a full personalised 7-day plan!`
  }

  if (msg.includes('avoid') || msg.includes('not eat') || msg.includes('unsafe') || msg.includes('bad for')) {
    return `During pregnancy, these are generally advised to avoid or limit:\n\n🚫 **Avoid completely:**\n• Alcohol — no safe amount in pregnancy\n• Raw/undercooked meat, poultry, eggs\n• Raw fish / sushi / sashimi\n• Unpasteurised dairy and soft cheeses\n• High-mercury fish: shark, swordfish, king mackerel\n• Raw sprouts\n\n⚠️ **Moderate amounts only:**\n• Caffeine — under 200mg/day (about 1 small coffee)\n• Papaya (unripe/raw) — traditional caution applies\n• Herbal teas — not all are safe; check with your midwife\n\n⚠️ This is general guidance. Your healthcare provider may give specific advice.`
  }

  if (msg.includes('water') || msg.includes('hydrat') || msg.includes('coconut water')) {
    return `Staying well hydrated is very important during pregnancy.\n\n💧 **How much:** ${week >= 29 ? '10–12' : '8–10'} glasses (about ${week >= 29 ? '2.5' : '2'} litres) daily\n\n✅ **Good choices:**\n• Plain water — the best\n• Coconut water (ilaneer) — natural electrolytes, potassium\n• Buttermilk / chaas — probiotics + hydration\n• Fresh lime water\n\n❌ **Limit:**\n• Carbonated drinks — can worsen heartburn\n• High-sugar juices\n• Caffeine (under 200mg/day total)\n\n💡 Dehydration can trigger Braxton Hicks contractions. If contractions continue after hydrating and resting, contact your doctor.`
  }

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

export async function askPregnancyAI(
  message: string,
  ctx: PregnancyContext,
  history: ChatMessage[],
): Promise<string> {
  // 1. Safety filter
  if (pregnancyIsMedical(message)) {
    return '⚠️ **Please contact your healthcare provider.**\n\nFitTracker provides general nutrition information only and cannot give medical advice. For symptoms, medications, diagnoses, or urgent concerns — please speak with your doctor or midwife immediately.\n\nI\'m happy to help with general nutrition questions like food choices, meal planning, or what nutrients to focus on this trimester.'
  }

  // 2. Rule-based (instant, no API call)
  const rule = pregnancyRuleResponse(message, ctx)
  if (rule) return rule

  // 3. Gemini via direct REST
  const systemInstruction = `You are FitTracker AI Pregnancy Nutrition Coach — a knowledgeable, warm, and safety-conscious nutrition assistant for pregnant women.

USER CONTEXT:
- Pregnancy week: ${ctx.week} (Trimester ${ctx.trimester})
- Diet type: ${ctx.dietType}
- Tamil food preference: ${ctx.tamilFoodPreference ? 'Yes — prioritise Tamil traditional foods' : 'No preference'}
- Dietary restrictions: ${ctx.restrictions.length > 0 ? ctx.restrictions.join(', ') : 'None'}

STRICT RULES:
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

  return callGeminiREST(systemInstruction, history, message, 700)
}

// ─────────────────────────────────────────────────────────────────────────────
// BABY AI
// ─────────────────────────────────────────────────────────────────────────────

export interface BabyContext {
  stageId: string
  ageMonths: number
  ageLabel: string
  dietType: 'vegetarian' | 'non_vegetarian' | 'vegan'
  tamilFoodPreference: boolean
  introducedFoods: string[]
  reportedAllergens: string[]
}

const BABY_EMERGENCY_KEYWORDS = [
  'choking', 'not breathing', 'allergic reaction', 'swollen', 'hives',
  'vomiting blood', 'unconscious', 'seizure', 'emergency', 'ambulance',
  'hospital', 'diagnose', 'medication', 'medicine', 'prescription',
]

function babyIsEmergency(msg: string): boolean {
  const lower = msg.toLowerCase()
  return BABY_EMERGENCY_KEYWORDS.some(k => lower.includes(k))
}

function babyRuleResponse(message: string, ctx: BabyContext): string | null {
  const msg   = message.toLowerCase()
  const age   = ctx.ageMonths
  const stage = ctx.stageId
  const tamil = ctx.tamilFoodPreference
  const veg   = ctx.dietType === 'vegetarian' || ctx.dietType === 'vegan'
  const isEarlyStage = stage === 'months_0_6'

  if (/^(hi|hello|hey|namaste|vanakkam)[\s!.,]?$/.test(msg.trim())) {
    if (isEarlyStage) {
      return `Vanakkam! 👶 I'm your FitTracker Baby Nutrition Coach.\n\nYour baby is ${ctx.ageLabel} old — at this stage, **breast milk or infant formula is the complete nutrition**. I can help with:\n\n• Breastfeeding and formula feeding information\n• Feeding cues and frequency\n• When to start solids\n• Safe feeding practices\n\nWhat would you like to know?`
    }
    return `Vanakkam! 👶 I'm your FitTracker Baby Nutrition Coach.\n\nYour baby is **${ctx.ageLabel}** (${stage.replace(/_/g, ' ')}). I can help with:\n\n• What foods to give today\n• Tamil traditional baby foods\n• Meal plan ideas\n• Safe textures for this age\n• Food introduction guidance\n\nWhat would you like to know?`
  }

  if (isEarlyStage && (msg.includes('food') || msg.includes('eat') || msg.includes('feed solid') || msg.includes('start solid'))) {
    return `At ${ctx.ageLabel}, **breast milk or appropriately prepared infant formula is the only nutrition your baby needs**. Solid foods are generally not recommended before around 6 months.\n\n🍼 **Signs of readiness for solids (usually around 6 months):**\n• Can sit with minimal support\n• Shows interest in food\n• Loss of tongue-thrust reflex (stops pushing food out)\n• Good head control\n\nThese signs together — not one alone — suggest readiness. **Discuss with your paediatrician** before starting solids.\n\n⚠️ Starting solids too early can carry risks. Follow your healthcare provider's guidance.`
  }

  if (msg.includes('breastfeed') || msg.includes('breast milk') || msg.includes('nursing') || msg.includes('feed how often') || msg.includes('feeding frequency')) {
    return `**Breastfeeding guidance for ${ctx.ageLabel}:**\n\n🍼 **Frequency:**\n• Newborns: every 1.5–3 hours (8–12 times/day)\n• 1–3 months: every 2–3 hours\n• 4–6 months: every 3–4 hours\n• Feed on demand — let baby guide frequency\n\n**Hunger cues to watch for:**\n• Rooting (turning head, moving mouth)\n• Sucking on hands or fingers\n• Increased alertness\n• Crying is a late hunger cue\n\n**Fullness cues:**\n• Turning away from breast\n• Releasing nipple\n• Relaxed hands\n• Falling asleep contentedly\n\n⚠️ For personalised breastfeeding support, a lactation consultant or your healthcare provider is the best resource.`
  }

  if (msg.includes('iron')) {
    if (isEarlyStage) {
      return `For babies under 6 months, breast milk or formula provides the iron they need.\n\nOnce your baby is ready for solids (around 6 months), iron-rich foods become very important.\n\n🌾 **Good iron sources to introduce when ready:**\n${tamil ? '• Ragi (finger millet) — excellent iron\n• Moong dal — easy to digest\n• Rice khichdi with dal\n• Soft-cooked greens\n• ' : ''}• Iron-fortified baby cereals/oatmeal\n• Pureed meat (chicken, fish)\n• Well-cooked egg yolk\n• Lentils\n\nCombine with Vitamin C foods to improve absorption.\n\n⚠️ Discuss iron supplementation with your paediatrician.`
    }
    return `Iron is very important for ${ctx.ageLabel} babies. Good iron sources for this age:\n\n${tamil ? '🌾 **Tamil traditional iron foods:**\n• Ragi (finger millet) — ragi porridge, koozh\n• Kambu (pearl millet) — porridge\n• Moong dal, chana dal\n• Soft khichdi with leafy greens\n\n' : ''}🌍 **Other good iron sources:**\n• Iron-fortified baby oatmeal\n• Well-cooked egg (from ~6 months)\n• Pureed/shredded chicken and fish\n• Lentil soup\n• Quinoa\n\n💡 **Tip:** Pair iron-rich foods with Vitamin C (orange, guava, tomato) to improve absorption.\n\n⚠️ If you're concerned about your baby's iron levels, please consult your paediatrician.`
  }

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
    return `Meal ideas for your ${ctx.ageLabel} toddler:\n\n🌅 **Breakfast:** ${tamil ? 'Ragi dosa + coconut chutney' : 'Oatmeal with fruit and chopped nuts'}\n🍎 **Morning snack:** Banana or yogurt\n🍚 **Lunch:** ${tamil ? 'Rice + dal + soft vegetable' : 'Pasta/quinoa with vegetables and protein'}\n🌆 **Evening snack:** Fruit pieces or ragi ladoo\n🌙 **Dinner:** ${tamil ? 'Idli + sambar' : 'Soft chapati with dal and vegetables'}\n\n💡 Offer variety. It's normal for toddlers to refuse foods — keep offering without pressure.`
  }

  if (msg.includes('tamil') || msg.includes('traditional') || msg.includes('south indian')) {
    if (isEarlyStage) {
      return `Great traditional Tamil foods to introduce when your baby is ready for solids (around 6 months):\n\n🥣 **First porridges:**\n• Ragi kanji (finger millet porridge) — excellent calcium and iron\n• Rice kanji — gentle first grain\n• Samai kanji — light millet porridge\n\n🫘 **First protein:**\n• Moong dal puree — easiest to digest\n• Dal-rice khichdi\n\n🥬 **First vegetables:**\n• Bottle gourd (surakkai) puree — very gentle\n• Pumpkin puree\n• Sweet potato mash\n\nThese nutritious traditional foods have been trusted for generations. Discuss starting solids with your paediatrician.`
    }
    return `Tamil traditional foods for ${ctx.ageLabel}:\n\n🥣 **Grains (excellent iron & calcium):**\n• Ragi porridge / koozh — highest calcium millet\n• Kambu porridge — good iron\n• Samai pongal — light and digestible\n• Rice kanji — gentle staple\n\n🫘 **Protein:**\n• Moong dal khichdi\n• Chana dal${!veg ? '\n• Soft chicken curry (well-cooked)\n• Fish (boneless, well-cooked)' : ''}\n\n🥬 **Vegetables:**\n• Pumpkin kootu\n• Bottle gourd\n• Drumstick leaves (from toddler age)\n• Carrot and beans\n\n✨ These are nutrient-dense traditional foods perfect for growing babies.`
  }

  if (msg.includes('texture') || msg.includes('puree') || msg.includes('mash') || msg.includes('finger food') || msg.includes('lump')) {
    return `**Texture progression guide:**\n\n🥣 **Puree** (6–7 months)\nSmooth, no lumps — like yogurt consistency\nExamples: ragi porridge, moong dal puree, mashed banana\n\n🥄 **Mash** (7–8 months)\nThicker, small soft lumps okay\nExamples: mashed khichdi, mashed banana, avocado\n\n🫙 **Soft lumps** (8–10 months)\nSoft pieces baby can gum\nExamples: soft idli pieces, soft cooked vegetables, scrambled egg\n\n✋ **Finger foods** (9–12 months)\nSoft pieces baby can self-feed\nExamples: banana sticks, sweet potato wedges, soft pasta\n\n🍽️ **Family foods** (12+ months)\nMost family foods in appropriate sizes\n\n⚠️ **Choking safety:** Always cut foods to appropriate sizes. No whole grapes, whole nuts, raw hard vegetables, or large meat chunks for babies under 2.`
  }

  if (msg.includes('allerg') || msg.includes('introduce') || msg.includes('new food')) {
    return `**Introducing new foods safely for ${ctx.ageLabel}:**\n\n✅ **Current guidance:**\n• Introduce one new food at a time\n• Wait 3–5 days before trying another new food\n• This helps identify any reactions\n• Early introduction of common allergens is now encouraged for most babies (discuss with paediatrician)\n\n🥜 **Common allergens to introduce carefully:**\nEgg, peanut (thinned smooth butter), dairy, wheat, fish, soy, tree nuts, sesame, shellfish\n\n**Signs to watch for after introducing a new food:**\n• Mild: rash around mouth, slight upset stomach\n• Seek medical care for: hives, swelling, vomiting, breathing difficulty\n\n⚠️ FitTracker cannot diagnose allergies. Always consult your paediatrician.`
  }

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

export async function askBabyAI(
  message: string,
  ctx: BabyContext,
  history: ChatMessage[],
): Promise<string> {
  // 1. Emergency filter
  if (babyIsEmergency(message)) {
    return '🚨 **If your baby is choking, having a severe allergic reaction, or having a medical emergency — call emergency services immediately (108 / 112 / 911).**\n\nFitTracker cannot provide emergency medical advice. Please contact your paediatrician or emergency services.\n\nFor general nutrition questions, I\'m happy to help.'
  }

  // 2. Rule-based
  const rule = babyRuleResponse(message, ctx)
  if (rule) return rule

  // 3. Gemini
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

  return callGeminiREST(systemInstruction, history, message, 700)
}

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY AI
// ─────────────────────────────────────────────────────────────────────────────

export interface FamilyMemberSummary {
  name: string
  role: string
  ageLabel: string
  dietPref: string
  allergies: string[]
  pregnancyWeek?: number
  ageMonths?: number
  tamilFoodPreference: boolean
}

export interface FamilySummary {
  familyName: string
  cuisinePreference: string
  members: FamilyMemberSummary[]
}

const FAMILY_MEDICAL_KEYWORDS = [
  'diagnose', 'prescription', 'medication', 'medicine', 'treat disease',
  'cure', 'hospital emergency', 'allergic reaction severe', 'anaphylaxis',
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
  const hasPregnant = members.some(m => m.role === 'pregnant')
  const hasBaby     = members.some(m => m.role === 'baby')
  const allVeg      = members.every(m => m.dietPref === 'vegetarian' || m.dietPref === 'vegan')

  if (/^(hi|hello|hey|vanakkam|namaste)[\s!.,]?$/.test(msg.trim())) {
    const memberList = members.map(m => `${m.name} (${m.role})`).join(', ')
    return `Vanakkam! 👨‍👩‍👧 I'm your FitTracker Family Nutrition Coach!\n\nYour family: **${memberList}**\n\nI can help with:\n• Family meal ideas and adaptations\n• Weekly meal plans for everyone\n• Tamil traditional or global food options\n• Shopping list generation\n• Ingredient substitutions\n\nWhat can I help with today?`
  }

  if ((msg.includes('tamil') || msg.includes('traditional')) && (msg.includes('dinner') || msg.includes('meal'))) {
    const preg = hasPregnant ? '\n🤰 Pregnant member: Extra drumstick sambar for iron + calcium; no raw foods' : ''
    const baby = hasBaby ? '\n👶 Baby: Soft mashed dal and rice, age-appropriate texture' : ''
    return `Here's a Tamil family dinner idea:\n\n🍚 **Base:** Red Rice + Drumstick Sambar + Keerai Kootu + Appalam\n\n**Adaptations:**\n${members.map(m => {
      if (m.role === 'baby')    return `👶 ${m.name}: Soft mashed khichdi with drumstick puree`
      if (m.role === 'toddler') return `🧒 ${m.name}: Small portion of rice + dal + mashed vegetables`
      if (m.role === 'pregnant') return `🤰 ${m.name}: Extra sambar + a serving of keerai kootu for iron and calcium`
      if (m.role === 'senior_male' || m.role === 'senior_female') return `👴 ${m.name}: Moderate portion, softer keerai kootu, less spice`
      return `${ROLE_EMOJIS[m.role] ?? '👤'} ${m.name}: Standard portion`
    }).join('\n')}${preg}${baby}\n\n💡 Tip: Add a small serving of curd for probiotics.\n\n_ℹ️ General information only. Consult healthcare provider for medical dietary needs._`
  }

  if (msg.includes('shopping') || msg.includes('ingredients') || msg.includes('grocery')) {
    const foods = hasTamil
      ? ['Ragi flour', 'Red rice', 'Moong dal', 'Drumstick leaves', 'Spinach (keerai)', 'Banana', 'Eggs', 'Curd']
      : ['Oats', 'Quinoa', 'Lentils', 'Spinach', 'Sweet potato', 'Avocado', 'Eggs', 'Greek yogurt']
    return `Here's a quick shopping list for your family:\n\n${foods.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n📋 Use the **Shopping List** tab to generate a complete categorised list with quantities that you can tick off as you shop!`
  }

  if (msg.includes('vegetarian') || (allVeg && msg.includes('meal'))) {
    return `A nutritious vegetarian family meal:\n\n🍽️ **Base:** Kambu Roti + Dal Tadka + Mixed Vegetable Sabzi + Curd\n\n**For each member:**\n${members.map(m => {
      if (m.role === 'baby')     return `👶 ${m.name}: Soft moong dal + mashed sweet potato`
      if (m.role === 'toddler')  return `🧒 ${m.name}: Small roti pieces + soft dal + vegetable mash`
      if (m.role === 'pregnant') return `🤰 ${m.name}: Extra dal portion + iron-rich greens side`
      return `${ROLE_EMOJIS[m.role] ?? '👤'} ${m.name}: Standard portion`
    }).join('\n')}\n\n_ℹ️ General guidance only._`
  }

  if (msg.includes('weekly') || msg.includes('week plan') || msg.includes('7 day')) {
    return `I can generate a full 7-day family meal plan! 📅\n\nUse the **Weekly Planner** tab to:\n• Generate a complete 7-day plan for everyone\n• Choose Tamil, Global, or Mixed cuisine\n• Regenerate any single day\n• Get adaptations for each family member\n\nOr describe what kind of week plan you'd like and I'll suggest ideas!`
  }

  if (msg.includes('breakfast')) {
    const options = hasTamil
      ? '• Idli + Sambar (soft mash for baby, normal for adults)\n• Ragi dosa + coconut chutney\n• Kambu idli + drumstick sambar'
      : '• Oatmeal with fruit (soft for baby)\n• Scrambled eggs + whole grain toast\n• Greek yogurt parfait with granola'
    const adaptations = members
      .filter(m => m.role === 'baby' || m.role === 'toddler' || m.role === 'pregnant')
      .map(m => {
        if (m.role === 'baby')     return `👶 ${m.name}: Ragi porridge or mashed banana`
        if (m.role === 'toddler')  return `🧒 ${m.name}: Small idli pieces or soft dosa pieces`
        return `🤰 ${m.name}: Extra ragi for calcium, add a boiled egg if non-vegetarian`
      }).join('\n') || 'All members: standard portion'
    return `Breakfast ideas for your family:\n\n${options}\n\n**Quick adaptations:**\n${adaptations}\n\n_ℹ️ General information only._`
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
    return '⚠️ **Please contact your healthcare provider** for medical dietary advice. FitTracker provides general nutrition information only and cannot give medical advice.\n\nI\'m happy to help with general family meal ideas, food choices, and meal planning.'
  }

  // 2. Rule-based
  const rule = familyRuleResponse(message, summary)
  if (rule) return rule

  // 3. Gemini
  const memberContext = summary.members.map(m =>
    `- ${m.name} (${m.role}, ${m.ageLabel}): ${m.dietPref}` +
    (m.allergies.length ? `, allergic to: ${m.allergies.join(', ')}` : '') +
    (m.pregnancyWeek ? `, pregnancy week ${m.pregnancyWeek}` : '') +
    (m.ageMonths ? `, ${m.ageMonths} months old` : '')
  ).join('\n')

  const systemInstruction = `You are FitTracker Family Nutrition Coach — a warm, practical, and safety-conscious AI nutrition assistant for families.

FAMILY CONTEXT:
Family name: ${summary.familyName}
Cuisine preference: ${summary.cuisinePreference}
Members:
${memberContext}

STRICT RULES:
1. ALWAYS adapt meals for each family member individually
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

  return callGeminiREST(systemInstruction, history, message, 800)
}
