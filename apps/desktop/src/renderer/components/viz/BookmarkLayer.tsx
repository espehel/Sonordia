import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Bookmark, FadeBookmark } from '../../types';
import { levelAt } from '../../hooks/useBookmarks';

interface Props {
  bookmarks: Bookmark[];
  duration: number;
  width: number;
  height: number;
  onBookmarkClick: (bookmark: Bookmark) => void;
  onAddAtTime: (sec: number) => void;
}

const CURVE_SAMPLES = 48;

export function BookmarkLayer(props: Props) {
  const { bookmarks, duration, width, height, onBookmarkClick, onAddAtTime } = props;

  const fades = useMemo(
    () =>
      bookmarks
        .filter((b): b is FadeBookmark => b.kind === 'fade')
        .sort((a, b) => a.position_sec - b.position_sec),
    [bookmarks],
  );

  const curvePath = useMemo(() => {
    if (duration <= 0 || width <= 0 || fades.length === 0) return '';
    const top = 4;
    const bottom = height - 4;
    const yForLevel = (pct: number) => bottom - (pct / 100) * (bottom - top);
    const points: string[] = [];
    const totalSamples = CURVE_SAMPLES * Math.max(1, fades.length + 1);
    for (let i = 0; i <= totalSamples; i++) {
      const t = (i / totalSamples) * duration;
      const x = (t / duration) * width;
      const y = yForLevel(levelAt(t, fades));
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [fades, duration, width, height]);

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0 || width <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onAddAtTime(ratio * duration);
  };

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        position: 'relative',
        width,
        height,
        background: '#fbfbfb',
        borderBottom: '1px solid #eee',
        cursor: duration > 0 ? 'copy' : 'default',
        userSelect: 'none',
      }}
      title="Click empty space to add a bookmark"
    >
      {/* Fade curve */}
      {curvePath && (
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <path d={curvePath} fill="none" stroke="#f59e0b" strokeWidth={1.5} opacity={0.7} />
        </svg>
      )}

      {/* Hint icon (only when empty) */}
      {bookmarks.length === 0 && (
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: '#bbb',
            fontSize: 10,
            pointerEvents: 'none',
          }}
        >
          <Plus size={12} />
          <span>Click to add a bookmark</span>
        </div>
      )}

      {/* Glyphs */}
      {duration > 0 &&
        bookmarks.map((b) => {
          const x = (b.position_sec / duration) * width;
          return b.kind === 'fade' ? (
            <FadeGlyph
              key={b.id}
              x={x}
              height={height}
              bookmark={b}
              onClick={() => onBookmarkClick(b)}
            />
          ) : (
            <MarkerGlyph
              key={b.id}
              x={x}
              height={height}
              bookmark={b}
              onClick={() => onBookmarkClick(b)}
            />
          );
        })}
    </div>
  );
}

interface GlyphProps<B extends Bookmark> {
  x: number;
  height: number;
  bookmark: B;
  onClick: () => void;
}

function MarkerGlyph({ x, height, bookmark, onClick }: GlyphProps<Bookmark>) {
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  const tooltip = [bookmark.name, bookmark.comment].filter(Boolean).join(' — ') || 'Marker';
  return (
    <div
      onClick={handle}
      title={tooltip}
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        height,
        width: 14,
        transform: 'translateX(-7px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          background: '#2563eb',
          transform: 'rotate(45deg)',
          border: '1px solid #1e40af',
        }}
      />
    </div>
  );
}

function FadeGlyph({ x, height, bookmark, onClick }: GlyphProps<FadeBookmark>) {
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  const tooltip =
    [bookmark.name, bookmark.comment].filter(Boolean).join(' — ') ||
    `Fade to ${Math.round(bookmark.level_pct)}%`;
  return (
    <div
      onClick={handle}
      title={tooltip}
      style={{
        position: 'absolute',
        left: x,
        top: 1,
        height: height - 2,
        transform: 'translateX(-50%)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: '#f59e0b',
          color: '#fff',
          fontSize: 9,
          fontWeight: 600,
          padding: '1px 4px',
          borderRadius: 9,
          lineHeight: 1.2,
          border: '1px solid #b45309',
          whiteSpace: 'nowrap',
        }}
      >
        {Math.round(bookmark.level_pct)}%
      </div>
    </div>
  );
}
