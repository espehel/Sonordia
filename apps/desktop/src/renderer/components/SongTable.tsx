import { Table, TableBody, TableHead, TableHeader, TableRow } from '@sonordia/ui/table';
import type { Song } from '../types';
import { SongRow } from './SongRow';
import { SortableHead, useSongSort, useSortedSongs } from './songSort';

interface SongTableProps {
  songs: Song[];
  onAnalyze: (id: string) => void;
  onRemove: (id: string) => void;
  onShowInFolder: (id: string) => void;
  onLocate: (id: string) => void;
  onUpdate: (id: string, data: { title?: string | null; artist?: string | null }) => void;
  onPlayPause?: (song: Song) => void;
  onOpenDetails?: (id: string) => void;
  activeSongId?: string | null;
  detailsSongId?: string | null;
  currentPlaylistId?: string | null;
}

export function SongTable({
  songs,
  onAnalyze,
  onRemove,
  onShowInFolder,
  onLocate,
  onUpdate,
  onPlayPause,
  onOpenDetails,
  activeSongId,
  detailsSongId,
  currentPlaylistId,
}: SongTableProps) {
  const { sort, toggleSort } = useSongSort();
  const sortedSongs = useSortedSongs(songs, sort);

  if (songs.length === 0) {
    return (
      <div className="text-muted-foreground py-16 text-center">
        No songs yet. Import audio files to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Title" sortKey="title" sort={sort} onToggle={toggleSort} />
          <SortableHead label="Artist" sortKey="artist" sort={sort} onToggle={toggleSort} />
          <SortableHead label="Key" sortKey="key" sort={sort} onToggle={toggleSort} align="center" />
          <SortableHead label="BPM" sortKey="bpm" sort={sort} onToggle={toggleSort} align="center" />
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedSongs.map((song) => (
          <SongRow
            key={song.id}
            song={song}
            onAnalyze={onAnalyze}
            onRemove={onRemove}
            onShowInFolder={onShowInFolder}
            onLocate={onLocate}
            onUpdate={onUpdate}
            onPlayPause={onPlayPause}
            onSelect={onOpenDetails}
            isActive={activeSongId === song.id}
            isSelected={detailsSongId === song.id}
            currentPlaylistId={currentPlaylistId ?? null}
          />
        ))}
      </TableBody>
    </Table>
  );
}
