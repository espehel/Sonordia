import type { BeatsViz } from '../../types';

interface Props {
  duration: number;
  beats: BeatsViz | undefined;
  width: number;
  height: number;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function pickSecondsStep(duration: number, width: number): number {
  if (duration <= 0 || width <= 0) return 30;
  // Aim for a label every ~80px.
  const targetLabels = Math.max(2, Math.floor(width / 80));
  const rawStep = duration / targetLabels;
  const candidates = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  for (const c of candidates) if (c >= rawStep) return c;
  return 600;
}

export function RulerLayer({ duration, beats, width, height }: Props) {
  if (duration <= 0) return <div style={{ height, width }} />;

  const ticks: { x: number; label: string; major: boolean }[] = [];

  if (beats && beats.beats.length > 0) {
    // Bar markers: every 4th beat is a downbeat → bar number.
    beats.beats.forEach((t, i) => {
      const x = (t / duration) * width;
      const isDownbeat = i % 4 === 0;
      ticks.push({
        x,
        label: isDownbeat ? `${Math.floor(i / 4) + 1}` : '',
        major: isDownbeat,
      });
    });
  } else {
    // Time-only fallback.
    const step = pickSecondsStep(duration, width);
    for (let t = 0; t <= duration; t += step) {
      ticks.push({ x: (t / duration) * width, label: fmtTime(t), major: true });
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        background: '#fafafa',
        borderBottom: '1px solid #eee',
        fontSize: 10,
        color: '#888',
        userSelect: 'none',
      }}
    >
      {ticks.map((t, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: t.x,
            top: 0,
            bottom: 0,
            borderLeft: t.major ? '1px solid #bbb' : '1px solid #eee',
          }}
        >
          {t.label && (
            <span style={{ position: 'absolute', left: 3, top: 2, whiteSpace: 'nowrap' }}>
              {t.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
