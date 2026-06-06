import { useState } from 'react';
import { AlertTriangle, MoreHorizontal } from 'lucide-react';
import { Badge } from '@sonordia/ui/badge';
import { Button } from '@sonordia/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sonordia/ui/dropdown-menu';
import { Input } from '@sonordia/ui/input';
import { Spinner } from '@sonordia/ui/spinner';
import { TableCell, TableRow } from '@sonordia/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sonordia/ui/tooltip';
import { cn } from '@sonordia/ui/utils';
import type { Song } from '../types';
import { useDeferredClick } from '../hooks/useDeferredClick';
import { visibleTagsFor } from './tagUtils';

type EditField = 'title' | 'artist';

interface SongRowProps {
  song: Song;
  onAnalyze: (id: string) => void;
  onRemove: (id: string) => void;
  onShowInFolder: (id: string) => void;
  onLocate: (id: string) => void;
  onUpdate: (id: string, data: { title?: string | null; artist?: string | null }) => void;
  onPlayPause?: (song: Song) => void;
  onSelect?: (id: string) => void;
  isActive?: boolean;
  isSelected?: boolean;
  currentPlaylistId?: string | null;
}

const truncate = 'max-w-60 truncate';

export function SongRow({
  song,
  onAnalyze,
  onRemove,
  onShowInFolder,
  onLocate,
  onUpdate,
  onPlayPause,
  onSelect,
  isActive,
  isSelected,
  currentPlaylistId,
}: SongRowProps) {
  const tags = visibleTagsFor(song, currentPlaylistId ?? null);
  const [editing, setEditing] = useState<EditField | null>(null);
  const [draft, setDraft] = useState('');
  const missing = song.file_missing;
  const playable = !!onPlayPause && !missing;
  const { deferClick, cancelClick } = useDeferredClick();

  const handleRowClick = () => deferClick(() => onSelect?.(song.id));

  const handleRowDoubleClick = () => {
    cancelClick();
    if (playable) onPlayPause?.(song);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const handleDragStart = (e: React.DragEvent) => {
    if (missing || editing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/x-sonordia-song', song.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const startEdit = (field: EditField) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft((field === 'title' ? song.title : song.artist) ?? '');
    setEditing(field);
  };

  const commit = () => {
    if (!editing) return;
    const trimmed = draft.trim();
    const next = trimmed === '' ? null : trimmed;
    const current = editing === 'title' ? song.title : song.artist;
    if (next !== current) {
      onUpdate(song.id, { [editing]: next });
    }
    setEditing(null);
  };

  const cancel = () => setEditing(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  const renderEditableCell = (field: EditField, value: string | null, prefix?: React.ReactNode) => {
    if (editing === field) {
      return (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          onClick={stop}
          onDoubleClick={stop}
          onMouseDown={stop}
          onFocus={(e) => e.target.select()}
          className="h-7 px-2 py-0 text-sm"
        />
      );
    }
    return (
      <span className="flex items-center gap-2">
        {prefix}
        <span className="cursor-text truncate" onClick={startEdit(field)}>
          {value ?? '—'}
        </span>
      </span>
    );
  };

  const missingIcon = missing ? (
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
  ) : null;

  return (
    <TableRow
      draggable={!missing && !editing}
      onDragStart={handleDragStart}
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
      className={cn(
        playable && 'cursor-pointer',
        isActive ? 'bg-accent/40' : isSelected && 'bg-accent/20',
        missing && 'opacity-70',
      )}
    >
      <TableCell className={truncate}>
        <div className="flex flex-col gap-1">
          {renderEditableCell('title', song.title, missingIcon)}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={tag.playlist_id ? 'outline' : 'secondary'}
                  className="h-4 px-1.5 text-[10px] font-normal"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className={truncate}>{renderEditableCell('artist', song.artist)}</TableCell>
      <TableCell className="text-center">
        {song.analysis_status === 'analyzing' ? (
          <Spinner className="mx-auto size-5" title="Analyzing…" background={false} />
        ) : (
          (song.key_camelot ?? '—')
        )}
      </TableCell>
      <TableCell className="text-center">
        {song.analysis_status === 'analyzing' ? (
          <Spinner className="mx-auto size-5" title="Analyzing…" background={false} />
        ) : song.bpm != null ? (
          song.bpm.toFixed(1)
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className="text-right" onClick={stop} onDoubleClick={stop}>
        <div className="flex items-center justify-end gap-1">
          {song.analysis_status === 'pending' && !missing && (
            <Button variant="outline" size="xs" onClick={() => onAnalyze(song.id)}>
              Analyze
            </Button>
          )}
          {song.analysis_status === 'error' &&
            !missing &&
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
              <DropdownMenuItem variant="destructive" onSelect={() => onRemove(song.id)}>
                Remove from library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
