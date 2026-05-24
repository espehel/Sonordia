import { useState } from 'react';
import { AlertTriangle, MoreHorizontal } from 'lucide-react';
import { Button } from '@sonordia/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sonordia/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@sonordia/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@sonordia/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sonordia/ui/tooltip';
import { cn } from '@sonordia/ui/utils';
import type { PlaylistSong, Song } from '../types';
import { SortableHead, useSongSort, useSortedSongs } from './songSort';

interface PlaylistViewProps {
  playlistSongs: PlaylistSong[];
  allSongs: Song[];
  onAddSong: (songId: string) => void;
  onRemoveSong: (songId: string) => void;
  onShowInFolder: (id: string) => void;
  onLocate: (id: string) => void;
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
  onShowInFolder,
  onLocate,
  onReorder,
  onPlay,
  activeSongId,
}: PlaylistViewProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const { sort, toggleSort } = useSongSort();
  const sortedSongs = useSortedSongs(playlistSongs, sort);
  const dragEnabled = sort === null;

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
              <SortableHead label="Title" sortKey="title" sort={sort} onToggle={toggleSort} />
              <SortableHead label="Artist" sortKey="artist" sort={sort} onToggle={toggleSort} />
              <SortableHead label="Key" sortKey="key" sort={sort} onToggle={toggleSort} align="center" />
              <SortableHead label="BPM" sortKey="bpm" sort={sort} onToggle={toggleSort} align="center" />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSongs.map((song, idx) => {
              const isDropTarget =
                dragEnabled && dragIdx !== null && dragOverIdx === idx && dragIdx !== idx;
              const draggingDown = dragIdx !== null && dragIdx < idx;
              const missing = song.file_missing;
              const playable = !!onPlay && !missing;
              return (
              <TableRow
                key={song.id}
                draggable={dragEnabled && !missing}
                onDragStart={dragEnabled && !missing ? (e) => handleDragStart(e, idx) : undefined}
                onDragOver={dragEnabled ? (e) => handleDragOver(e, idx) : undefined}
                onDrop={dragEnabled ? handleDrop : undefined}
                onDragEnd={dragEnabled ? handleDragEnd : undefined}
                onClick={() => playable && onPlay?.(song)}
                className={cn(
                  playable ? 'cursor-pointer' : dragEnabled && !missing ? 'cursor-grab' : undefined,
                  dragEnabled && dragIdx === idx && 'opacity-40',
                  missing && 'opacity-70',
                  activeSongId === song.id && 'bg-accent/40',
                  isDropTarget &&
                    (draggingDown
                      ? 'shadow-[inset_0_-2px_0_0_var(--primary)]'
                      : 'shadow-[inset_0_2px_0_0_var(--primary)]'),
                )}
              >
                <TableCell className="text-muted-foreground w-10 text-center">{idx + 1}</TableCell>
                <TableCell className={truncate}>
                  <span className="flex items-center gap-2">
                    {missing && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle
                            className="text-destructive size-3.5 shrink-0"
                            aria-label="File not found"
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-sm">
                          File not found at:
                          <br />
                          {song.file_path}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <span className="truncate">{song.title ?? '—'}</span>
                  </span>
                </TableCell>
                <TableCell className={truncate}>{song.artist ?? '—'}</TableCell>
                <TableCell className="text-center">{song.key_camelot ?? '—'}</TableCell>
                <TableCell className="text-center">
                  {song.bpm != null ? song.bpm.toFixed(1) : '—'}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs" aria-label="More actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={missing}
                        onSelect={() => onShowInFolder(song.id)}
                      >
                        Show in folder
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onLocate(song.id)}>
                        {missing ? 'Locate file…' : 'Change file…'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onRemoveSong(song.id)}
                      >
                        Remove from playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
