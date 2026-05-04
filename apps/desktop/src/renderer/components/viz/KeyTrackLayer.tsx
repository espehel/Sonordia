import type { KeyTrackViz } from '../../types';

interface Props {
  data: KeyTrackViz | undefined;
  duration: number;
  width: number;
  height: number;
}

// Camelot wheel hue map: 12 positions around the wheel; minor (A) and major (B)
// share hue but differ in saturation/lightness.
function camelotColor(camelot: string): string {
  const m = camelot.match(/^(\d+)([AB])$/);
  if (!m) return '#ccc';
  const num = parseInt(m[1], 10);
  const mode = m[2];
  const hue = ((num - 1) * 30) % 360;
  const sat = mode === 'A' ? 35 : 60;
  const light = mode === 'A' ? 60 : 50;
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export function KeyTrackLayer({ data, duration, width, height }: Props) {
  if (!data || data.segments.length === 0 || duration <= 0) {
    return <div style={{ width, height, background: '#fafafa', borderTop: '1px solid #eee' }} />;
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        background: '#fafafa',
        borderTop: '1px solid #eee',
        userSelect: 'none',
      }}
    >
      {data.segments.map((seg, i) => {
        const left = (seg.start / duration) * width;
        const w = ((seg.end - seg.start) / duration) * width;
        return (
          <div
            key={i}
            title={`${seg.camelot} (${seg.start.toFixed(0)}–${seg.end.toFixed(0)}s)`}
            style={{
              position: 'absolute',
              left,
              top: 0,
              width: w,
              height,
              background: camelotColor(seg.camelot),
              borderRight: '1px solid rgba(255,255,255,0.5)',
              fontSize: 10,
              color: '#fff',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {w > 28 ? seg.camelot : ''}
          </div>
        );
      })}
    </div>
  );
}
