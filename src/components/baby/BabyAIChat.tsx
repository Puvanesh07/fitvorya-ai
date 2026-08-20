import { useState, useRef, useEffect } from 'react'
import type { BabyChatMessage, BabyChatContext } from '../../types/baby'

interface Props { context: BabyChatContext }

const NETLIFY_BASE = import.meta.env.VITE_NETLIFY_BASE ?? ''

const QUICK_QUESTIONS = [
  'What can I give today?',
  'Tamil food ideas for this age',
  'Iron-rich foods for my baby',
  'What texture is safe now?',
  'How do I introduce new foods?',
  'Give me a 7-day meal plan',
  'What foods should I avoid?',
  'Good breakfast ideas',
]

function formatMessage(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const fmt = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-bold text-text-primary">{p}</strong> : p
    )
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <div key={i} className="flex gap-2 text-sm"><span className="text-teal-500 flex-shrink-0 mt-0.5">•</span><span>{fmt}</span></div>
    }
    return <p key={i} className="text-sm leading-relaxed">{fmt}</p>
  })
}

export default function BabyAIChat({ context }: Props) {
  const [messages, setMessages] = useState<BabyChatMessage[]>([{
    id: '0', role: 'assistant', timestamp: new Date().toISOString(),
    content: `Vanakkam! 👶 I'm your Baby Nutrition Coach.\n\nYour baby is **${context.ageLabel}** (${context.stageId.replace(/_/g, ' ')} stage).\n\nI can help with meal ideas, food safety, texture guidance, and Tamil traditional baby foods.\n\nWhat would you like to know?`,
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: BabyChatMessage = { id: Date.now().toString(), role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch(`${NETLIFY_BASE}/.netlify/functions/babyAI`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context, history }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { response: string }
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: data.response, timestamp: new Date().toISOString() }])
    } catch {
      setError('Could not connect. Please check your connection and try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          ⚠️ <strong>General information only.</strong> Not a substitute for paediatric advice.
          For emergencies — call 108/112 immediately.
        </p>
      </div>

      {/* Chat */}
      <div className="card card-shadow flex flex-col" style={{ minHeight: 400 }}>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 420 }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${msg.role === 'assistant' ? 'bg-gradient-to-br from-teal-400 to-blue-500 text-white' : 'bg-surface2 border border-border text-text-primary'}`}>
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white rounded-tr-sm' : 'bg-surface2 border border-border text-text-primary rounded-tl-sm'}`}>
                {msg.role === 'assistant'
                  ? <div className="text-text-primary flex flex-col gap-0.5">{formatMessage(msg.content)}</div>
                  : <p className="text-sm text-white">{msg.content}</p>}
                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-text-muted'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-sm">🤖</div>
              <div className="bg-surface2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
              </div>
            </div>
          )}
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-3 text-xs text-red-700 dark:text-red-300">⚠️ {error}</div>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about baby nutrition, foods, meal plans…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-surface2 border border-border rounded-2xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-teal-400 transition-colors"
            style={{ maxHeight: 100, overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shadow-md"
          >➤</button>
        </div>
      </div>

      {/* Quick questions */}
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Quick questions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => sendMessage(q)} disabled={loading}
              className="px-3 py-1.5 bg-surface2 border border-border rounded-full text-xs font-medium text-text-secondary hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Context badges */}
      <div className="flex flex-wrap gap-2 px-1">
        <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-xs font-semibold border border-teal-200 dark:border-teal-700">{context.ageLabel}</span>
        <span className="px-2.5 py-1 bg-surface2 text-text-secondary rounded-full text-xs font-medium border border-border capitalize">{context.dietType.replace('_','-')}</span>
        {context.tamilFoodPreference && <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-700">🍚 Tamil</span>}
      </div>
    </div>
  )
}
