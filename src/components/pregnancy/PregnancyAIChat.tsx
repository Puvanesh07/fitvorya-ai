import { useState, useRef, useEffect } from 'react'
import type { AIChatMessage, AIChatContext } from '../../types/pregnancy'
import { askPregnancyAI } from '../../services/geminiService'

interface Props { context: AIChatContext }

const QUICK_QUESTIONS = [
  'What should I eat this week?',
  'Give me Tamil food suggestions',
  'Iron-rich foods for me',
  'What foods should I avoid?',
  'I have morning sickness — help',
  'Give me a 7-day meal plan',
  'Calcium without milk?',
  'Vegetarian protein sources',
]

function formatMessage(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const fmt = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-bold text-text-primary">{p}</strong> : p
    )
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <div key={i} className="flex gap-2 text-sm"><span className="text-purple-400 flex-shrink-0 mt-0.5">•</span><span>{fmt}</span></div>
    }
    if (line.startsWith('#')) {
      return <p key={i} className="font-black text-text-primary mt-1">{fmt}</p>
    }
    return <p key={i} className="text-sm leading-relaxed">{fmt}</p>
  })
}

export default function PregnancyAIChat({ context }: Props) {
  const [messages, setMessages] = useState<AIChatMessage[]>([{
    id: '0',
    role: 'assistant',
    content: `Vanakkam! 🤰 I'm your FitTracker Pregnancy Nutrition Coach.\n\nYou're in **Week ${context.week}** (Trimester ${context.trimester}). I can help with meal ideas, food safety, Tamil traditional foods, nutrition tips, and more.\n\nWhat would you like to know today?`,
    timestamp: new Date().toISOString(),
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const reply = await askPregnancyAI(trimmed, context, history)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setError('Could not connect to AI coach. Please check your internet connection and try again.')
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
          <strong>General information only.</strong> Not a substitute for medical advice.
          For symptoms, medications, or health concerns — always consult your healthcare provider.
        </p>
      </div>

      {/* Context badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="g-badge" style={{ background: 'rgb(139 92 246 / 0.15)', borderColor: 'rgb(139 92 246 / 0.3)', color: 'rgb(196 181 253)' }}>
          🤰 Week {context.week} · T{context.trimester}
        </span>
        <span className="g-badge capitalize">
          {context.dietType.replace('_', '-')}
        </span>
        {context.tamilFoodPreference && (
          <span className="g-badge" style={{ background: 'rgb(251 146 60 / 0.15)', borderColor: 'rgb(251 146 60 / 0.25)', color: 'rgb(253 186 116)' }}>
            🍚 Tamil
          </span>
        )}
      </div>

      {/* Chat window */}
      <div className="g-card-glow-purple flex flex-col overflow-hidden" style={{ minHeight: 420, maxHeight: 500 }}>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                msg.role === 'assistant'
                  ? 'gradient-brand text-white shadow-md'
                  : 'g-card-sm'
              }`}>
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className={msg.role === 'user' ? 'g-bubble-user-purple' : 'g-bubble-ai'}>
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
              <div className="flex-shrink-0 w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-xs shadow-md">🤖</div>
              <div className="g-bubble-ai">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-typing" style={{ animationDelay: `${i * 200}ms` }} />
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
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about nutrition, foods, meal plans…"
            rows={1}
            disabled={loading}
            className="g-textarea flex-1"
            style={{ maxHeight: 80, overflowY: 'auto', minHeight: 38 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="g-btn-primary g-btn-icon"
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
