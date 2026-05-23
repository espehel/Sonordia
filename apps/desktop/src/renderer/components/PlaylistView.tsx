import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@sonordia/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@sonordia/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@sonordia/ui/table';
import { cn } from '@sonordia/ui/utils';
import type { PlaylistSong, Song } from '../types';

interface PlaylistViewProps {
  playlistSongs: PlaylistSong[];
  allSongs: Song[];
  onAddSong: (songId: string) => void;
  onRemoveSong: (songId: string) => void;
  onReorder: (songIds: string[]) => void;
  onPlay?: (song: Song) => void;
  activeSongId?: string | null;
}

const truncate = 'max-w-60 truncate';

export function PlaylistView({
  playlistSongs,
  allSongs,
  onAddSong,
  onRemoveSong,
  onReorder,
  onPlay,
  activeSongId,
}: PlaylistViewProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    if (dragIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = () => {
    if (dragIdx === null || dragOverIdx === null || dragIdx === dragOverIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const ids = playlistSongs.map((s) => s.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(dragOverIdx, 0, moved);
    onReorder(ids);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const playlistSongIds = new Set(playlistSongs.map((s) => s.id));
  const addable = allSongs.filter((s) => !playlistSongIds.has(s.id));

  return (
    <div>
      {playlistSongs.length === 0 ? (
        <div className="text-muted-foreground py-10 text-center">
          No songs in this playlist. Add songs from the dropdown below.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead className="text-center">Key</TableHead>
              <TableHead className="text-center">BPM</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlistSongs.map((song, idx) => {
              const isDropTarget = dragIdx !== null && dragOverIdx === idx && dragIdx !== idx;
              const draggingDown = dragIdx !== null && dragIdx < idx;
              return (
              <TableRow
                key={song.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onClick={() => onPlay?.(song)}
                className={cn(
                  onPlay ? 'cursor-pointer' : 'cursor-grab',
                  dragIdx === idx && 'opacity-40',
                  activeSongId === song.id && 'bg-accent/40',
                  isDropTarget &&
                    (draggingDown
                      ? 'shadow-[inset_0_-2px_0_0_var(--primary)]'
                      : 'shadow-[inset_0_2px_0_0_var(--primary)]'),
                )}
              >
                <TableCell className="text-muted-foreground w-10 text-center">{idx + 1}</TableCell>
                <TableCell className={truncate}>{song.title ?? '—'}</TableCell>
                <TableCell className={truncate}>{song.artist ?? '—'}</TableCell>
                <TableCell className="text-center">{song.key_camelot ?? '—'}</TableCell>
                <TableCell className="text-center">
                  {song.bpm != null ? song.bpm.toFixed(1) : '—'}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemoveSong(song.id)}
                    aria-label="Remove from playlist"
                  >
                    <X />
                  </Button>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {addable.length > 0 && (
        <div className="mt-4">
          <Select
            value=""
            onValueChange={(value) => {
              if (value) onAddSong(value);
            }}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Add a song..." />
            </SelectTrigger>
            <SelectContent>
              {addable.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title ?? s.file_path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
