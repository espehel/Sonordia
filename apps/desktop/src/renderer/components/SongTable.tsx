import { Table, TableBody, TableHead, TableHeader, TableRow } from "@sonordia/ui/table";
import type { Song } from "../types";
import { SongRow } from "./SongRow";

interface SongTableProps {
  songs: Song[];
  onAnalyze: (id: string) => void;
  onRemove: (id: string) => void;
  onPlay?: (song: Song) => void;
  activeSongId?: string | null;
}

export function SongTable({ songs, onAnalyze, onRemove, onPlay, activeSongId }: SongTableProps) {
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
          <TableHead>Title</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead className="text-center">Key</TableHead>
          <TableHead className="text-center">BPM</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {songs.map((song) => (
          <SongRow
            key={song.id}
            song={song}
            onAnalyze={onAnalyze}
            onRemove={onRemove}
            onPlay={onPlay}
            isActive={activeSongId === song.id}
          />
        ))}
      </TableBody>
    </Table>
  );
}
