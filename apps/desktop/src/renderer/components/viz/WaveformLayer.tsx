import { useRef } from 'react'
import type { WaveformViz } from '../../types'
import { useCanvasDraw } from './useCanvas'

interface Props {
  data: WaveformViz | undefined
  width: number
  height: number
  progress: number // 0..1
}

const PLAYED = '#1a1a1a'
const UNPLAYED = '#bbb'

export function WaveformLayer({ data, width, height, progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useCanvasDraw(
    canvasRef,
    width,
    height,
    (ctx, w, h) => {
      if (!data || data.peaks.length === 0) return
      const peaks = data.peaks
      const playedX = Math.floor(progress * w)
      const mid = h / 2
      const amp = h / 2

      for (let x = 0; x < w; x++) {
        const i = Math.floor((x / w) * peaks.length)
        const [mn, mx] = peaks[i] ?? [0, 0]
        const top = mid - mx * amp
        const bot = mid - mn * amp
        ctx.fillStyle = x <= playedX ? PLAYED : UNPLAYED
        ctx.fillRect(x, Math.min(top, mid - 1), 1, Math.max(1, bot - top))
      }
    },
    [data, progress]
  )

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
