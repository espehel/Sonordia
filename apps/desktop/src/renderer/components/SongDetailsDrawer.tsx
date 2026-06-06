import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@sonordia/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@sonordia/ui/drawer';
import { Input } from '@sonordia/ui/input';
import { cn } from '@sonordia/ui/utils';
import type { Playlist, Song, Tag } from '../types';
import { useTags } from '../hooks/useTags';
import { collectTagPools } from './tagUtils';

interface SongDetailsDrawerProps {
  song: Song | null;
  playlist: Playlist | null;
  allSongs: Song[];
  onClose: () => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground truncate text-right">{value}</span>
    </div>
  );
}

export function SongDetailsDrawer({ song, playlist, allSongs, onClose }: SongDetailsDrawerProps) {
  return (
    <Drawer
      direction="right"
      open={!!song}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DrawerContent className="w-[440px] max-w-[90vw] sm:max-w-[440px]">
        {song && (
          <SongDetailsBody
            key={song.id}
            song={song}
            playlist={playlist}
            allSongs={allSongs}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function SongDetailsBody({
  song,
  playlist,
  allSongs,
}: {
  song: Song;
  playlist: Playlist | null;
  allSongs: Song[];
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DrawerHeader className="border-b px-5 pt-5 pb-4">
        <DrawerTitle className="truncate text-lg">{song.title ?? 'Untitled'}</DrawerTitle>
        <DrawerDescription className="truncate">
          {song.artist ?? 'Unknown artist'}
        </DrawerDescription>
      </DrawerHeader>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Section title="Details">
          <DetailRow label="Key" value={song.key_camelot ?? '—'} />
          <DetailRow
            label="BPM"
            value={song.bpm != null ? song.bpm.toFixed(1) : '—'}
          />
          <DetailRow label="Album" value={song.album ?? '—'} />
          <DetailRow label="Duration" value={formatDuration(song.duration_sec)} />
          <DetailRow
            label="Status"
            value={<span className="capitalize">{song.analysis_status}</span>}
          />
          <DetailRow
            label="File"
            value={
              <span
                className="block max-w-[280px] truncate font-mono text-xs"
                title={song.file_path}
              >
                {song.file_path}
              </span>
            }
          />
        </Section>

        <Section title="Tags">
          <TagsEditor song={song} playlist={playlist} allSongs={allSongs} />
        </Section>

        <Section title="Notes">
          <NotesEditor song={song} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function TagsEditor({
  song,
  playlist,
  allSongs,
}: {
  song: Song;
  playlist: Playlist | null;
  allSongs: Song[];
}) {
  const { attach, detach } = useTags();
  const pools = collectTagPools(allSongs, playlist?.id ?? null);

  const globalTags = song.tags.filter((t) => t.playlist_id === null);
  const playlistTags = playlist
    ? song.tags.filter((t) => t.playlist_id === playlist.id)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <TagGroup
        label="Global"
        tags={globalTags}
        suggestions={pools.global}
        placeholder="Add a global tag…"
        onAdd={(name) => attach(song.id, name, null)}
        onRemove={(tagId) => detach(song.id, tagId)}
      />
      {playlist && (
        <TagGroup
          label={`Playlist: ${playlist.name}`}
          tags={playlistTags}
          suggestions={pools.playlist}
          placeholder={`Add a tag for "${playlist.name}"…`}
          onAdd={(name) => attach(song.id, name, playlist.id)}
          onRemove={(tagId) => detach(song.id, tagId)}
        />
      )}
    </div>
  );
}

interface TagGroupProps {
  label: string;
  tags: Tag[];
  suggestions: Tag[];
  placeholder: string;
  onAdd: (name: string) => Promise<unknown> | void;
  onRemove: (tagId: string) => Promise<unknown> | void;
}

function TagGroup({ label, tags, suggestions, placeholder, onAdd, onRemove }: TagGroupProps) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  const submit = async (value?: string) => {
    const trimmed = (value ?? draft).trim();
    if (trimmed === '') return;
    setDraft('');
    await onAdd(trimmed);
  };

  const attachedIds = new Set(tags.map((t) => t.id));
  const lowerDraft = draft.trim().toLowerCase();
  const filteredSuggestions = suggestions
    .filter((t) => !attachedIds.has(t.id))
    .filter((t) => lowerDraft === '' || t.name.toLowerCase().includes(lowerDraft))
    .slice(0, 8);

  const showSuggestions = focused && filteredSuggestions.length > 0;

  return (
    <div>
      <div className="text-muted-foreground mb-1.5 text-xs">{label}</div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <span className="text-muted-foreground text-xs italic">No tags</span>
        ) : (
          tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={tag.playlist_id ? 'outline' : 'secondary'}
              className="pr-1"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                aria-label={`Remove ${tag.name}`}
                className="hover:bg-muted-foreground/20 ml-1 inline-flex size-3.5 items-center justify-center rounded-full"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
      {showSuggestions && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                void submit(tag.name);
              }}
              className="hover:bg-accent hover:text-accent-foreground bg-muted/50 text-muted-foreground inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium transition-colors"
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesEditor({ song }: { song: Song }) {
  const [draft, setDraft] = useState(song.notes ?? '');
  const lastSaved = useRef(song.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(song.notes ?? '');
    lastSaved.current = song.notes ?? '';
  }, [song.id]);

  useEffect(() => {
    if (draft === lastSaved.current) return;
    setSaving(true);
    const timer = setTimeout(async () => {
      const value = draft === '' ? null : draft;
      await window.api.songs.updateNotes(song.id, value);
      lastSaved.current = draft;
      setSaving(false);
    }, 400);
    return () => {
      clearTimeout(timer);
      setSaving(false);
    };
  }, [draft, song.id]);

  return (
    <div className="flex flex-col gap-1">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write notes about this song…"
        className={cn(
          'border-input placeholder:text-muted-foreground dark:bg-input/30',
          'min-h-32 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs',
          'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        )}
      />
      <span className="text-muted-foreground h-4 text-xs">{saving ? 'Saving…' : ''}</span>
    </div>
  );
}
