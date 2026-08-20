import { useState, useEffect, useRef, useCallback } from 'react'

/** Generates a short beep using Web Audio API — no file needed */
function playBeep(audioCtx: AudioContext, frequency = 880, duration = 0.15, volume = 0.4) {
  const osc  = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(volume, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration)
  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + duration)
}

/** Three quick beeps when timer hits 0 */
function playFinishSound(audioCtx: AudioContext) {
  [0, 0.2, 0.4].forEach(delay => {
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.value = 1046.5 // C6
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + 0.2)
    osc.start(audioCtx.currentTime + delay)
    osc.stop(audioCtx.currentTime + delay + 0.3)
  })
}

interface UseRestTimerReturn {
  timeLeft: number
  isRunning: boolean
  isMuted: boolean
  progress: number   // 0–100
  start: (seconds: number) => void
  stop: () => void
  toggleMute: () => void
}

export function useRestTimer(): UseRestTimerReturn {
  const [timeLeft, setTimeLeft]   = useState(0)
  const [total, setTotal]         = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isMuted, setIsMuted]     = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mutedRef    = useRef(false)

  // Keep mutedRef in sync
  useEffect(() => { mutedRef.current = isMuted }, [isMuted])

  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const start = useCallback((seconds: number) => {
    clearTimer()
    setTotal(seconds)
    setTimeLeft(seconds)
    setIsRunning(true)

    // Play a soft tick when starting
    if (!mutedRef.current) {
      try { playBeep(getAudioCtx(), 660, 0.08, 0.2) } catch { /* ignore */ }
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          setIsRunning(false)
          if (!mutedRef.current) {
            try { playFinishSound(getAudioCtx()) } catch { /* ignore */ }
          }
          return 0
        }
        // Warn beep at 3 seconds
        if (prev === 4 && !mutedRef.current) {
          try { playBeep(getAudioCtx(), 880, 0.1, 0.3) } catch { /* ignore */ }
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    setIsRunning(false)
    setTimeLeft(0)
    setTotal(0)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(m => !m)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [])

  const progress = total > 0 ? Math.round(((total - timeLeft) / total) * 100) : 0

  return { timeLeft, isRunning, isMuted, progress, start, stop, toggleMute }
}
