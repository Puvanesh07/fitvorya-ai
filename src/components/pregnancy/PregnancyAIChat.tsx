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
    const formatted = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="font-bold text-text-primary">{part}</strong> : part
    )
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2 text-sm">
          <span className="text-purple-500 flex-shrink-0 mt-0.5">•</span>
          <span>{formatted}</span>
        </div>
      )
    }
    if (line.startsWith('#')) {
      return <p key={i} className="font-black text-text-primary mt-1">{formatted}</p>
    }
    return <p key={i} className="text-sm leading-relaxed">{formatted}</p>
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
    <div className="flex flex-col gap-4">

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          ⚠️ <strong>General information only.</strong> FitTracker AI Coach provides nutrition guidance, not medical advice.
          For symptoms, medications, or health concerns — always consult your qualified healthcare provider.
        </p>
      </div>

      {/* Chat window */}
      <div className="card card-shadow flex flex-col" style={{ minHeight: '420px' }}>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: '420px' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                msg.role === 'assistant' ? 'gradient-brand text-white' : 'bg-surface2 border border-border text-text-primary'
              }`}>
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 flex flex-col gap-1 ${
                msg.role === 'user'
                  ? 'gradient-brand text-white rounded-tr-sm'
                  : 'bg-surface2 border border-border text-text-primary rounded-tl-sm'
              }`}>
                {msg.role === 'assistant'
                  ? <div className="text-text-primary flex flex-col gap-0.5">{formatMessage(msg.content)}</div>
                  : <p className="text-sm text-white">{msg.content}</p>
                }
                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-text-muted'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-sm">🤖</div>
              <div className="bg-surface2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-3 text-xs text-red-700 dark:text-red-300">
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about nutrition, foods, meal plans…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-surface2 border border-border rounded-2xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple-400 transition-colors"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-2xl gradient-brand text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-md shadow-purple-500/20"
            aria-label="Send message"
          >➤</button>
        </div>
      </div>

      {/* Quick questions */}
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Quick questions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => sendMessage(q)} disabled={loading}
              className="px-3 py-1.5 bg-surface2 border border-border rounded-full text-xs font-medium text-text-secondary hover:border-purple-400 hover:text-purple-400 transition-all disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Context badges */}
      <div className="flex flex-wrap gap-2 px-1">
        <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold border border-purple-200 dark:border-purple-700">
          Week {context.week} · T{context.trimester}
        </span>
        <span className="px-2.5 py-1 bg-surface2 text-text-secondary rounded-full text-xs font-medium border border-border capitalize">
          {context.dietType.replace('_', '-')}
        </span>
        {context.tamilFoodPreference && (
          <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-700">
            🍚 Tamil preference
          </span>
        )}
      </div>
    </div>
  )
}
