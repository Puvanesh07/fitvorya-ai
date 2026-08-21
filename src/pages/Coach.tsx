import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAICoach } from '../hooks/useAICoach'

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTED = [
  'How am I doing overall?',
  "What should I eat today?",
  "Create today's workout",
  'Why did my weight change?',
  'Am I hitting my protein goals?',
  'How can I improve my sleep?',
  'Give me a 7-day meal plan',
  'I feel low energy — tips?',
]

// ── Markdown-lite formatter ───────────────────────────────────────────────────
function formatMessage(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const fmt = parts.map((p, j) =>
      j % 2 === 1
        ? <strong key={j} className="font-bold text-text-primary">{p}</strong>
        : p,
    )
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2 text-xs leading-relaxed">
          <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
          <span>{fmt}</span>
        </div>
      )
    }
    if (/^#{1,3}\s/.test(line)) {
      return <p key={i} className="text-sm font-black text-text-primary mt-1">{fmt}</p>
    }
    return <p key={i} className="text-xs leading-relaxed">{fmt}</p>
  })
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 h-4 px-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-typing"
          style={{ animationDelay: `${i * 200}ms` }} />
      ))}
    </div>
  )
}

export default function Coach() {
  const { user, profile } = useAuth()
  const location          = useLocation()
  const uid               = user?.uid ?? ''
  const { messages, streamingText, loading, error, sendMessage, clearHistory } = useAICoach(uid)

  const [input,       setInput]       = useState('')
  const [showSuggest, setShowSuggest] = useState(true)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages / streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Pre-fill from dashboard card quick prompts
  useEffect(() => {
    const prefill = (location.state as { prefill?: string } | null)?.prefill
    if (prefill) {
      setInput(prefill)
      inputRef.current?.focus()
    }
  }, [location.state])

  // Hide suggested prompts once the user sends a message
  useEffect(() => {
    if (messages.length > 0) setShowSuggest(false)
  }, [messages.length])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    await sendMessage(msg)
  }

  const name    = profile?.displayName?.split(' ')[0] ?? 'there'
  const hour    = new Date().getHours()
  const greet   = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const hasChat = messages.length > 0 || !!streamingText

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-3xl mx-auto animate-slide-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-1 pb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-text-primary tracking-tight">
            AI <span className="gradient-text">Health Coach</span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Powered by your real data · Good {greet}, {name}
          </p>
        </div>
        {hasChat && (
          <button onClick={clearHistory} className="g-btn g-btn-sm text-[11px]">
            New chat
          </button>
        )}
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 pb-2">

        {/* Welcome state */}
        {!hasChat && (
          <div className="flex flex-col items-center justify-center flex-1 gap-5 py-8 animate-slide-up">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-3xl"
              style={{ boxShadow: '0 8px 28px rgb(108 65 210 / 0.5)' }}>
              ✦
            </div>
            <div className="text-center max-w-xs">
              <h2 className="text-base font-black text-text-primary mb-1">Your Personal Coach</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                I know your weight, workouts, nutrition, and hydration data.
                Ask me anything about your fitness journey.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="g-disclaimer max-w-sm text-center">
              ⚠️ General fitness guidance only — not medical advice.
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i}
            className={`flex gap-2.5 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

            {/* Avatar */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
              msg.role === 'assistant'
                ? 'gradient-brand text-white shadow-md'
                : 'g-card-sm text-text-muted'
            }`}>
              {msg.role === 'assistant' ? '✦' : '👤'}
            </div>

            {/* Bubble */}
            <div className={msg.role === 'user' ? 'g-bubble-user-purple' : 'g-bubble-ai'}>
              {msg.role === 'assistant'
                ? <div className="flex flex-col gap-0.5">{formatMessage(msg.content)}</div>
                : <p className="text-xs">{msg.content}</p>
              }
              <p className={`text-[10px] mt-1.5 ${
                msg.role === 'user' ? 'text-white/50 text-right' : 'text-text-muted'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming reply */}
        {loading && (
          <div className="flex gap-2.5 animate-pop-in">
            <div className="flex-shrink-0 w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-xs shadow-md text-white">
              ✦
            </div>
            <div className="g-bubble-ai">
              {streamingText
                ? <div className="flex flex-col gap-0.5">{formatMessage(streamingText)}</div>
                : <TypingDots />
              }
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="g-disclaimer flex items-start gap-2"
            style={{ background: 'rgb(239 68 68 / 0.08)', borderColor: 'rgb(239 68 68 / 0.2)', color: 'rgb(252 165 165)' }}>
            <span className="flex-shrink-0">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggested prompts ── */}
      {showSuggest && !hasChat && (
        <div className="flex-shrink-0 pb-3">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-0.5">
            Try asking
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => handleSend(q)}
                disabled={loading}
                className="g-pill">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 flex gap-2 pt-2"
        style={{ borderTop: '1px solid rgb(255 255 255 / 0.07)' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          placeholder="Ask your AI health coach…"
          rows={1}
          disabled={loading}
          className="g-textarea flex-1"
          style={{ minHeight: 40, maxHeight: 120, resize: 'none' }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          aria-label="Send"
          className="g-btn g-btn-primary g-btn-icon flex-shrink-0"
          style={{ width: 40, height: 40, alignSelf: 'flex-end' }}>
          ➤
        </button>
      </div>

      {/* Bottom disclaimer */}
      <p className="text-center text-[10px] text-text-muted pt-2 pb-1 opacity-60 flex-shrink-0">
        FitTracker AI provides general fitness guidance — not medical advice.
      </p>
    </div>
  )
}
