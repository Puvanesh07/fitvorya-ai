/**
 * ExerciseVisual — renders the REAL exercise demonstration (looping H.264 demo
 * video or animated illustration from wger.de, matched at build time in
 * src/data/exerciseMedia.ts). Falls back to the supplied CSS-animated SVG
 * figure when no real media exists for the exercise.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { lookupExerciseMedia } from '../services/exerciseMediaService'

// ── Component ──────────────────────────────────────────────────────────────────
interface Props {
  exerciseId?: string
  exerciseName?: string
  /** pixel size of the square media box */
  size?: number
  /** shown when no real media exists (the CSS-animated SVG figure) */
  fallback: ReactNode
  /** tailwind classes for the outer wrapper */
  className?: string
}

export default function ExerciseVisual({ exerciseId, exerciseName, size = 132, fallback, className = '' }: Props) {
  const media = lookupExerciseMedia(exerciseId, exerciseName)
  // which media layer failed for the CURRENT exercise (video → image → SVG fallback)
  const [failedSource, setFailedSource] = useState<string | null>(null)

  if (!media) return <>{fallback}</>

  const src = media.video || media.image || ''
  if (failedSource === src) return <>{fallback}</>
  const useVideo = !!media.video && failedSource !== media.video

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ width: size }}>
      <div
        className="relative overflow-hidden rounded-xl bg-white/90 dark:bg-white/10"
        style={{ width: size, height: size }}
      >
        {useVideo ? (
          <video
            src={media.video}
            poster={media.thumb}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setFailedSource(media.video!)}
            className="h-full w-full object-contain"
          />
        ) : media.image ? (
          <img
            src={media.image}
            alt={exerciseName || media.match}
            loading="lazy"
            onError={() => setFailedSource(media.image || src)}
            className="h-full w-full object-contain"
          />
        ) : (
          // video-only entry whose video failed — nothing else to show inline
          <div className="h-full w-full flex items-center justify-center">
            <div style={{ transform: 'scale(0.85)' }}>{fallback}</div>
          </div>
        )}

        {/* badge */}
        <span className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-black/55 text-white pointer-events-none">
          {useVideo ? '● LIVE DEMO' : media.animated ? '● ANIMATED' : 'PHOTO'}
        </span>
      </div>

      {/* attribution required by the CC-BY-SA license */}
      <p className="mt-1 text-[8px] leading-none text-text-muted">
        Demo: <a
          href={`https://wger.de/en/exercise/${media.wgerId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted hover:text-purple-400"
          onClick={e => e.stopPropagation()}
        >wger.de</a> · CC BY-SA
      </p>
    </div>
  )
}
