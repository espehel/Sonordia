import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@sonordia/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sonordia/ui/dialog';
import { Input } from '@sonordia/ui/input';
import { Label } from '@sonordia/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sonordia/ui/select';
import { cn } from '@sonordia/ui/utils';
import type { Bookmark, BookmarkKind } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing bookmark when editing, null when creating. */
  bookmark: Bookmark | null;
  /** Default timestamp (seconds) when creating a new bookmark. */
  defaultPositionSec: number;
  duration: number;
  onSave: (data: BookmarkDraft) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export interface BookmarkDraft {
  kind: BookmarkKind;
  position_sec: number;
  name: string | null;
  comment: string | null;
  level_pct: number;
}

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTime(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  if (trimmed.includes(':')) {
    const [m, s] = trimmed.split(':');
    const minutes = parseInt(m, 10);
    const seconds = parseFloat(s);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }
  const n = parseFloat(trimmed);
  return Number.isNaN(n) ? null : n;
}

export function BookmarkDialog(props: Props) {
  const { open, onClose, bookmark, defaultPositionSec, duration, onSave, onDelete } = props;

  const [kind, setKind] = useState<BookmarkKind>('marker');
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [level, setLevel] = useState(100);

  useEffect(() => {
    if (!open) return;
    if (bookmark) {
      setKind(bookmark.kind);
      setName(bookmark.name ?? '');
      setComment(bookmark.comment ?? '');
      setTimeStr(fmt(bookmark.position_sec));
      setLevel(bookmark.kind === 'fade' ? bookmark.level_pct : 100);
    } else {
      setKind('marker');
      setName('');
      setComment('');
      setTimeStr(fmt(defaultPositionSec));
      setLevel(100);
    }
  }, [open, bookmark, defaultPositionSec]);

  const parsedTime = parseTime(timeStr);
  const timeValid =
    parsedTime !== null && parsedTime >= 0 && (duration <= 0 || parsedTime <= duration);

  const handleSave = () => {
    if (!timeValid || parsedTime === null) return;
    void onSave({
      kind,
      position_sec: parsedTime,
      name: name.trim() === '' ? null : name.trim(),
      comment: comment.trim() === '' ? null : comment.trim(),
      level_pct: Math.max(0, Math.min(100, level)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bookmark ? 'Edit bookmark' : 'New bookmark'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!bookmark && (
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as BookmarkKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marker">Marker</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-time">Time</Label>
            <Input
              id="bookmark-time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              placeholder="m:ss"
              aria-invalid={!timeValid}
            />
            {!timeValid && (
              <span className="text-destructive text-xs">
                Enter a valid time within the track.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-name">Name</Label>
            <Input
              id="bookmark-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Intro, drop, breakdown…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-comment">Comment</Label>
            <textarea
              id="bookmark-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional notes"
              className={cn(
                'border-input placeholder:text-muted-foreground dark:bg-input/30',
                'min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs',
                'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
              )}
            />
          </div>

          {kind === 'fade' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bookmark-level">Level</Label>
                <span className="text-muted-foreground text-xs tabular-nums">{level}%</span>
              </div>
              <input
                id="bookmark-level"
                type="range"
                min={0}
                max={100}
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="accent-primary"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between">
          {bookmark && onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onDelete()}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!timeValid}>
              {bookmark ? 'Save' : 'Add'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
