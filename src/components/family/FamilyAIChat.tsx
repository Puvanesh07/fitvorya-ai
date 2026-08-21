import { useState, useRef, useEffect } from 'react'
import type { FamilyMember, FamilyChatMessage, CuisinePreference } from '../../types/family'
import { ROLE_CONFIG, getMemberAgeLabel } from '../../data/familyData'
import { askFamilyAI } from '../../services/geminiService'

interface Props {
  members: FamilyMember[]
  familyName: string
  cuisinePreference: CuisinePreference
}

const QUICK_QUESTIONS = [
  'Give us a healthy Tamil dinner',
  'Create a vegetarian family meal',
  "What's a good breakfast for everyone?",
  'Generate a family shopping list',
  'Adapt dinner for our baby',
  'Budget-friendly meal ideas',
  'Suggest a Tamil iron-rich meal',
  'Replace quinoa with something local',
]

function formatMessage(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const fmt = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-bold text-text-primary">{p}</strong> : p
    )
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <div key={i} className="flex gap-2 text-sm"><span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span><span>{fmt}</span></div>
    }
    return <p key={i} className="text-sm leading-relaxed">{fmt}</p>
  })
}

export default function FamilyAIChat({ members, familyName, cuisinePreference }: Props) {
  const introMsg = members.length > 0
    ? `Vanakkam! 👨‍👩‍👧 I'm your FitTracker Family Nutrition Coach for **${familyName}**.\n\nYour family: ${members.map(m => `${ROLE_CONFIG[m.role].emoji} ${m.name}`).join(', ')}\n\nI'll adapt every meal suggestion for each member — from babies to seniors. What can I help with today?`
    : `Vanakkam! 👨‍👩‍👧 I'm your FitTracker Family Nutrition Coach.\n\nAdd family members in the **Members** tab first so I can give personalised advice for everyone.\n\nI can help with Tamil and global family meals, weekly plans, and shopping lists.`

  const [messages, setMessages] = useState<FamilyChatMessage[]>([{
    id: '0',
    role: 'assistant',
    content: introMsg,
    timestamp: new Date().toISOString(),
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: FamilyChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    const familySummary = {
      familyName,
      cuisinePreference,
      members: members.map(m => ({
        name:                m.name,
        role:                m.role,
        ageLabel:            getMemberAgeLabel(m),
        dietPref:            m.dietPref,
        allergies:           m.allergies,
        pregnancyWeek:       m.pregnancyWeek,
        ageMonths:           m.ageMonths,
        tamilFoodPreference: m.tamilFoodPreference,
      })),
    }

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const reply = await askFamilyAI(trimmed, familySummary, history)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setError('Could not connect. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Disclaimer */}
      <div className="g-disclaimer flex items-start gap-2">
        <span className="text-amber-400 flex-shrink-0 text-sm">⚠️</span>
        <p className="flex-1">
          <strong>General information only.</strong> Not a substitute for medical or paediatric advice.
          For pregnancy, baby, or medical dietary needs — consult your healthcare provider.
        </p>
      </div>

      {/* Context badges — members */}
      <div className="flex flex-wrap gap-1.5">
        {members.map(m => (
          <span key={m.id} className="g-badge">
            {ROLE_CONFIG[m.role].emoji} {m.name}
          </span>
        ))}
        <span className="g-badge" style={{ background: 'rgb(16 185 129 / 0.15)', borderColor: 'rgb(16 185 129 / 0.25)', color: 'rgb(110 231 183)' }}>
          {cuisinePreference === 'tamil' ? '🇮🇳 Tamil' : cuisinePreference === 'global' ? '🌍 Global' : '✨ Mixed'}
        </span>
      </div>

      {/* Chat window */}
      <div className="g-card-glow-emerald flex flex-col overflow-hidden" style={{ minHeight: 420, maxHeight: 500 }}>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md'
                  : 'g-card-sm'
              }`}>
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className={msg.role === 'user' ? 'g-bubble-user-emerald' : 'g-bubble-ai'}>
                {msg.role === 'assistant'
                  ? <div className="flex flex-col gap-0.5">{formatMessage(msg.content)}</div>
                  : <p className="text-sm">{msg.content}</p>
                }
                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-text-muted'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 animate-pop-in">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs shadow-md">🤖</div>
              <div className="g-bubble-ai">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-typing" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="g-disclaimer" style={{ background: 'rgb(239 68 68 / 0.08)', borderColor: 'rgb(239 68 68 / 0.2)', color: 'rgb(248 113 113)' }}>
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-white/[0.07] p-2.5 flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about family meals, shopping lists, substitutions…"
            rows={1}
            disabled={loading}
            className="g-textarea flex-1"
            style={{ maxHeight: 80, overflowY: 'auto', minHeight: 38 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="g-btn-emerald g-btn-icon"
            style={{ width: 38, height: 38 }}
            aria-label="Send message"
          >➤</button>
        </div>
      </div>

      {/* Quick questions */}
      <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">Quick questions</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => sendMessage(q)} disabled={loading} className="g-pill">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
