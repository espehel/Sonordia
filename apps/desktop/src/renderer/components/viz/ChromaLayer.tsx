import { useRef } from "react";
import type { ChromaViz } from "../../types";
import { useCanvasDraw } from "./useCanvas";

interface Props {
  data: ChromaViz | undefined;
  width: number;
  height: number;
}

// Index 0 = C (bottom row), 11 = B (top row).
const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function ChromaLayer({ data, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasDraw(
    canvasRef,
    width,
    height,
    (ctx, _w, _h) => {
      if (!data || data.frames === 0) return;
      const rows = data.chroma.length;
      const cols = data.frames;
      // putImageData ignores the canvas transform, so fill the raw backing
      // buffer dimensions directly rather than the CSS-pixel size.
      const bufW = ctx.canvas.width;
      const bufH = ctx.canvas.height;
      if (bufW === 0 || bufH === 0) return;

      const img = ctx.createImageData(bufW, bufH);
      for (let y = 0; y < bufH; y++) {
        // Row 0 (C) at the bottom; row 11 (B) at the top.
        const pitchIdx = Math.max(0, rows - 1 - Math.floor((y / bufH) * rows));
        for (let x = 0; x < bufW; x++) {
          const colIdx = Math.floor((x / bufW) * cols);
          const v = Math.min(1, Math.max(0, data.chroma[pitchIdx]?.[colIdx] ?? 0));
          // Single-hue ramp (teal): low = white, high = #0d6e6e
          const r = Math.round(255 - v * (255 - 13));
          const g = Math.round(255 - v * (255 - 110));
          const b = Math.round(255 - v * (255 - 110));
          const off = (y * bufW + x) * 4;
          img.data[off] = r;
          img.data[off + 1] = g;
          img.data[off + 2] = b;
          img.data[off + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    [data]
  );

  const rowH = height / PITCH_NAMES.length;
  const isNatural = (n: string) => !n.includes("#");

  return (
    <div style={{ position: "relative", width, height }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 20,
          height,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {PITCH_NAMES.map((n, i) => {
          // Index 0 (C) at the bottom of the canvas.
          const centerY = (PITCH_NAMES.length - 1 - i + 0.5) * rowH;
          return (
            <span
              key={n}
              style={{
                position: "absolute",
                left: 2,
                top: centerY,
                transform: "translateY(-50%)",
                fontSize: 8,
                lineHeight: 1,
                fontWeight: isNatural(n) ? 600 : 400,
                color: isNatural(n) ? "#222" : "#666",
                background: "rgba(255,255,255,0.7)",
                padding: "0 2px",
                borderRadius: 2,
              }}
            >
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}
