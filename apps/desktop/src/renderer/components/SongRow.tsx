import { Button } from '@sonordia/ui/button';
import { TableCell, TableRow } from '@sonordia/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sonordia/ui/tooltip';
import { cn } from '@sonordia/ui/utils';
import type { Song } from '../types';

interface SongRowProps {
  song: Song;
  onAnalyze: (id: string) => void;
  onRemove: (id: string) => void;
  onPlay?: (song: Song) => void;
  isActive?: boolean;
}

const statusClass: Record<Song['analysis_status'], string> = {
  pending: 'text-muted-foreground',
  analyzing: 'text-amber-600',
  done: 'text-emerald-600',
  error: 'text-destructive',
};

const truncate = 'max-w-60 truncate';

export function SongRow({ song, onAnalyze, onRemove, onPlay, isActive }: SongRowProps) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <TableRow
      onClick={() => onPlay?.(song)}
      className={cn(onPlay && 'cursor-pointer', isActive && 'bg-accent/40')}
    >
      <TableCell className={truncate}>{song.title ?? '—'}</TableCell>
      <TableCell className={truncate}>{song.artist ?? '—'}</TableCell>
      <TableCell className="text-center">{song.key_camelot ?? '—'}</TableCell>
      <TableCell className="text-center">{song.bpm != null ? song.bpm.toFixed(1) : '—'}</TableCell>
      <TableCell className="text-center">
        <span className={cn('font-medium', statusClass[song.analysis_status])}>
          {song.analysis_status}
        </span>
      </TableCell>
      <TableCell className="text-right" onClick={stop}>
        <div className="flex justify-end gap-1">
          {song.analysis_status === 'pending' && (
            <Button variant="outline" size="xs" onClick={() => onAnalyze(song.id)}>
              Analyze
            </Button>
          )}
          {song.analysis_status === 'error' &&
            (song.analysis_error ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="xs" onClick={() => onAnalyze(song.id)}>
                    Retry
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{song.analysis_error}</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="outline" size="xs" onClick={() => onAnalyze(song.id)}>
                Retry
              </Button>
            ))}
          <Button
            variant="ghost"
            size="xs"
            className="text-destructive hover:text-destructive"
            onClick={() => onRemove(song.id)}
          >
            Remove
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
