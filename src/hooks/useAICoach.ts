import { useState, useCallback, useRef } from 'react'
import {
  collectUserData,
  buildContext,
  streamChat,
  type CoachMessage,
} from '../services/aiCoachService'

interface UseAICoachReturn {
  messages:      CoachMessage[]
  streamingText: string
  loading:       boolean
  error:         string | null
  sendMessage:   (text: string) => Promise<void>
  clearHistory:  () => void
}

export function useAICoach(uid: string): UseAICoachReturn {
  const [messages,      setMessages]      = useState<CoachMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  // Keep a stable ref to latest messages to avoid stale closure in sendMessage
  const messagesRef  = useRef<CoachMessage[]>([])
  const abortRef     = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const userMsg: CoachMessage = {
      role:      'user',
      content:   trimmed,
      timestamp: new Date().toISOString(),
    }

    const history = messagesRef.current
    messagesRef.current = [...history, userMsg]
    setMessages(messagesRef.current)
    setStreamingText('')
    setError(null)
    setLoading(true)

    try {
      const data    = await collectUserData(uid)
      const context = buildContext(data)

      const reply = await streamChat({
        context,
        history,
        userMessage: trimmed,
        onToken:     setStreamingText,
        signal:      abortRef.current.signal,
      })

      const aiMsg: CoachMessage = {
        role:      'assistant',
        content:   reply,
        timestamp: new Date().toISOString(),
      }
      messagesRef.current = [...messagesRef.current, aiMsg]
      setMessages(messagesRef.current)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(
        msg.includes('VITE_GROQ_API_KEY')
          ? 'Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file.'
          : 'Could not reach AI coach. Check your connection and try again.',
      )
    } finally {
      setStreamingText('')
      setLoading(false)
    }
  }, [uid, loading])

  const clearHistory = useCallback(() => {
    messagesRef.current = []
    setMessages([])
    setStreamingText('')
    setError(null)
  }, [])

  return { messages, streamingText, loading, error, sendMessage, clearHistory }
}
