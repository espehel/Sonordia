import { RefObject, useEffect } from 'react';

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/**
 * Re-runs `draw` whenever any value in `deps` changes or the canvas resizes.
 * Handles devicePixelRatio scaling so lines stay crisp on retina displays.
 */
export function useCanvasDraw(
  ref: RefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  draw: DrawFn,
  deps: ReadonlyArray<unknown>,
): void {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, width, height, ...deps]);
}
