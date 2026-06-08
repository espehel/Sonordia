import { useLayoutEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@sonordia/ui/button';
import { cn } from '@sonordia/ui/utils';
import type {
  BackfillProgress,
  Bookmark,
  CreateBookmarkInput,
  UpdateBookmarkPatch,
  VizPayload,
  Song,
} from '../types';
import type { VizSettings, VizLayer } from '../hooks/useVizSettings';
import { VizToolbar } from './VizToolbar';
import { WaveformLayer } from './viz/WaveformLayer';
import { RulerLayer } from './viz/RulerLayer';
import { BeatGridLayer } from './viz/BeatGridLayer';
import { RmsLayer } from './viz/RmsLayer';
import { ChromaLayer } from './viz/ChromaLayer';
import { KeyTrackLayer } from './viz/KeyTrackLayer';
import { BookmarkLayer } from './viz/BookmarkLayer';
import { BookmarkDialog, type BookmarkDraft } from './BookmarkDialog';

interface Props {
  song: Song | null;
  playlistId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  viz: VizPayload;
  vizLoading: boolean;
  vizMissing: string[];
  settings: VizSettings;
  onToggleLayer: (layer: VizLayer) => void;
  onPlayPause: () => void;
  onSeek: (sec: number) => void;
  backfill: BackfillProgress;
  bookmarks: Bookmark[];
  onCreateBookmark: (
    input: Omit<CreateBookmarkInput, 'playlist_id' | 'song_id'>,
  ) => Promise<Bookmark | null>;
  onUpdateBookmark: (id: string, patch: UpdateBookmarkPatch) => Promise<Bookmark | null>;
  onDeleteBookmark: (id: string) => Promise<void>;
}

const RULER_H = 22;
const BOOKMARK_H = 22;
const WAVEFORM_H = 80;
const CHROMA_H = 80;
const KEYTRACK_H = 22;

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerPanel(props: Props) {
  const {
    song,
    playlistId,
    isPlaying,
    currentTime,
    duration,
    viz,
    vizLoading,
    vizMissing,
    settings,
    onToggleLayer,
    onPlayPause,
    onSeek,
    backfill,
    bookmarks,
    onCreateBookmark,
    onUpdateBookmark,
    onDeleteBookmark,
  } = props;

  const stackRef = useRef<HTMLDivElement>(null);
  const [stackWidth, setStackWidth] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [defaultPos, setDefaultPos] = useState(0);

  useLayoutEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setStackWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setStackWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [song?.id]);

  if (!song) return null;

  const showRuler = settings.ruler;
  const showBookmarks = settings.bookmarks && playlistId != null;
  const showWaveformRow = settings.waveform || settings.rms;
  const showChroma = settings.chroma;
  const showKeyTrack = settings.keytrack;
  const showBeats = settings.beats;

  const bookmarkTop = showRuler ? RULER_H : 0;
  const bookmarkEnd = bookmarkTop + (showBookmarks ? BOOKMARK_H : 0);

  const stackHeight =
    (showRuler ? RULER_H : 0) +
    (showBookmarks ? BOOKMARK_H : 0) +
    (showWaveformRow ? WAVEFORM_H : 0) +
    (showChroma ? CHROMA_H : 0) +
    (showKeyTrack ? KEYTRACK_H : 0);

  const openCreate = (sec: number) => {
    setEditing(null);
    setDefaultPos(sec);
    setDialogOpen(true);
  };

  const openEdit = (bookmark: Bookmark) => {
    setEditing(bookmark);
    setDialogOpen(true);
  };

  const handleSave = async (draft: BookmarkDraft) => {
    if (editing) {
      await onUpdateBookmark(editing.id, {
        position_sec: draft.position_sec,
        name: draft.name,
        comment: draft.comment,
        ...(editing.kind === 'fade' ? { level_pct: draft.level_pct } : {}),
      });
    } else {
      await onCreateBookmark({
        kind: draft.kind,
        position_sec: draft.position_sec,
        name: draft.name,
        comment: draft.comment,
        level_pct: draft.kind === 'fade' ? draft.level_pct : null,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!editing) return;
    await onDeleteBookmark(editing.id);
    setDialogOpen(false);
  };

  const progress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
  const playheadX = stackWidth * progress;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0 || stackWidth <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="border-border bg-background fixed inset-x-0 bottom-0 z-10 border-t shadow-[0_-2px_6px_rgba(0,0,0,0.04)]">
      {/* Toolbar */}
      <div
        className={cn(
          'flex min-h-11 items-center gap-4 px-4 py-2',
          stackHeight > 0 && 'border-border border-b',
        )}
      >
        <Button
          onClick={onPlayPause}
          size="icon"
          className="size-8 shrink-0 rounded-full"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
        </Button>

        <div className="shrink-0 text-sm">
          <div className="max-w-60 truncate font-semibold">{song.title ?? '—'}</div>
          <div className="text-muted-foreground text-[11px]">{song.artist ?? '—'}</div>
        </div>

        <div className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {fmt(currentTime)} / {fmt(duration)}
        </div>

        <div className="flex-1" />

        {backfill.state === 'running' && (
          <div className="text-muted-foreground text-[11px]">
            Preparing visualizations… {backfill.completed}/{backfill.total}
          </div>
        )}
        {vizLoading && backfill.state !== 'running' && (
          <div className="text-muted-foreground text-[11px]">Loading…</div>
        )}
        {!vizLoading && vizMissing.length > 0 && backfill.state !== 'running' && (
          <div className="text-muted-foreground text-[11px]">
            Computing {vizMissing.join(', ')}…
          </div>
        )}

        <VizToolbar settings={settings} onToggle={onToggleLayer} />
      </div>

      {/* Stack of viz layers */}
      {stackHeight > 0 && (
        <div ref={stackRef} style={{ position: 'relative', width: '100%', height: stackHeight }}>
          {showRuler && (
            <RulerLayer duration={duration} beats={viz.beats} width={stackWidth} height={RULER_H} />
          )}
          {showBookmarks && (
            <BookmarkLayer
              bookmarks={bookmarks}
              duration={duration}
              width={stackWidth}
              height={BOOKMARK_H}
              onBookmarkClick={openEdit}
              onAddAtTime={openCreate}
            />
          )}
          {showWaveformRow && (
            <div
              style={{
                position: 'relative',
                width: stackWidth,
                height: WAVEFORM_H,
                background: '#fff',
              }}
            >
              {settings.waveform && (
                <WaveformLayer
                  data={viz.waveform}
                  width={stackWidth}
                  height={WAVEFORM_H}
                  progress={progress}
                />
              )}
              {settings.rms && (
                <div style={{ position: 'absolute', inset: 0 }}>
                  <RmsLayer data={viz.rms} width={stackWidth} height={WAVEFORM_H} />
                </div>
              )}
            </div>
          )}
          {showChroma && <ChromaLayer data={viz.chroma} width={stackWidth} height={CHROMA_H} />}
          {showKeyTrack && (
            <KeyTrackLayer
              data={viz.keytrack}
              duration={duration}
              width={stackWidth}
              height={KEYTRACK_H}
            />
          )}

          {showBeats && stackWidth > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: stackWidth,
                height: stackHeight,
                pointerEvents: 'none',
              }}
            >
              <BeatGridLayer
                beats={viz.beats}
                duration={duration}
                width={stackWidth}
                height={stackHeight}
              />
            </div>
          )}

          {/* Playhead */}
          {duration > 0 && (
            <div
              style={{
                position: 'absolute',
                left: playheadX,
                top: 0,
                width: 2,
                height: stackHeight,
                background: '#e63946',
                pointerEvents: 'none',
                transform: 'translateX(-1px)',
              }}
            />
          )}

          {/* Click-to-seek overlay — split around the bookmark band so its clicks reach BookmarkLayer */}
          {showBookmarks ? (
            <>
              {bookmarkTop > 0 && (
                <div
                  onClick={handleSeek}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: bookmarkTop,
                    cursor: duration > 0 ? 'pointer' : 'default',
                  }}
                />
              )}
              <div
                onClick={handleSeek}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: bookmarkEnd,
                  bottom: 0,
                  cursor: duration > 0 ? 'pointer' : 'default',
                }}
              />
            </>
          ) : (
            <div
              onClick={handleSeek}
              style={{
                position: 'absolute',
                inset: 0,
                cursor: duration > 0 ? 'pointer' : 'default',
              }}
            />
          )}
        </div>
      )}

      <BookmarkDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        bookmark={editing}
        defaultPositionSec={defaultPos}
        duration={duration}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}
