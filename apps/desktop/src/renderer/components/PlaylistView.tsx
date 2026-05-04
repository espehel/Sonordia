import { useState, useRef } from 'react';
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
  const dragOverIdx = useRef<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  };

  const handleDrop = () => {
    if (dragIdx === null || dragOverIdx.current === null || dragIdx === dragOverIdx.current) {
      setDragIdx(null);
      return;
    }
    const ids = playlistSongs.map((s) => s.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(dragOverIdx.current, 0, moved);
    onReorder(ids);
    setDragIdx(null);
    dragOverIdx.current = null;
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
            {playlistSongs.map((song, idx) => (
              <TableRow
                key={song.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDrop}
                onClick={() => onPlay?.(song)}
                className={cn(
                  onPlay ? 'cursor-pointer' : 'cursor-grab',
                  dragIdx === idx && 'opacity-40',
                  activeSongId === song.id && 'bg-accent/40',
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
            ))}
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
