import { useRef } from 'react'
import type { BeatsViz } from '../../types'
import { useCanvasDraw } from './useCanvas'

interface Props {
  beats: BeatsViz | undefined
  duration: number
  width: number
  height: number
}

export function BeatGridLayer({ beats, duration, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useCanvasDraw(
    canvasRef,
    width,
    height,
    (ctx, w, h) => {
      if (!beats || beats.beats.length === 0 || duration <= 0) return
      // Skip dense grids that would alias to a wash of color.
      const minSpacingPx = 3
      const expectedSpacing = w / (beats.beats.length || 1)
      if (expectedSpacing < minSpacingPx) {
        // Draw downbeats only.
        beats.beats.forEach((t, i) => {
          if (i % 4 !== 0) return
          const x = (t / duration) * w
          ctx.fillStyle = 'rgba(0,0,0,0.18)'
          ctx.fillRect(x, 0, 1, h)
        })
        return
      }

      beats.beats.forEach((t, i) => {
        const x = (t / duration) * w
        const isDownbeat = i % 4 === 0
        if (isDownbeat) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)'
          ctx.fillRect(x, 0, 1, h)
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.10)'
          ctx.fillRect(x, 0, 1, Math.min(8, h))
        }
      })
    },
    [beats, duration]
  )

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    />
  )
}
