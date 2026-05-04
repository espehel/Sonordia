import { useRef } from 'react';
import type { RmsViz } from '../../types';
import { useCanvasDraw } from './useCanvas';

interface Props {
  data: RmsViz | undefined;
  width: number;
  height: number;
}

export function RmsLayer({ data, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasDraw(
    canvasRef,
    width,
    height,
    (ctx, w, h) => {
      if (!data || data.rms.length === 0) return;
      const rms = data.rms;

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x < w; x++) {
        const i = Math.floor((x / w) * rms.length);
        const v = rms[i] ?? 0;
        const y = h - v * h * 0.9;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 138, 0, 0.18)';
      ctx.fill();

      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const i = Math.floor((x / w) * rms.length);
        const v = rms[i] ?? 0;
        const y = h - v * h * 0.9;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(204, 102, 0, 0.85)';
      ctx.lineWidth = 1.25;
      ctx.stroke();
    },
    [data],
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    />
  );
}
