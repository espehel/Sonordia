import { TableHead } from '@sonordia/ui/table';
import { cn } from '@sonordia/ui/utils';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Song } from '../types';

export type SortKey = 'title' | 'artist' | 'key' | 'bpm';
export type SortDir = 'asc' | 'desc';
export type SortState = { key: SortKey; dir: SortDir } | null;

const camelotRank = (value: string | null): number | null => {
  if (!value) return null;
  const match = /^(\d+)([AB])$/i.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 2 + (match[2].toUpperCase() === 'B' ? 1 : 0);
};

const compareNullable = <T,>(a: T | null, b: T | null, cmp: (a: T, b: T) => number): number => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return cmp(a, b);
};

export function compareSongs(a: Song, b: Song, key: SortKey): number {
  switch (key) {
    case 'title':
      return compareNullable(a.title, b.title, (x, y) => x.localeCompare(y));
    case 'artist':
      return compareNullable(a.artist, b.artist, (x, y) => x.localeCompare(y));
    case 'key':
      return compareNullable(camelotRank(a.key_camelot), camelotRank(b.key_camelot), (x, y) => x - y);
    case 'bpm':
      return compareNullable(a.bpm, b.bpm, (x, y) => x - y);
  }
}

export function useSongSort() {
  const [sort, setSort] = useState<SortState>(null);
  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };
  return { sort, toggleSort };
}

export function useSortedSongs<T extends Song>(songs: T[], sort: SortState): T[] {
  return useMemo(() => {
    if (!sort) return songs;
    const copy = songs.slice();
    copy.sort((a, b) => {
      const result = compareSongs(a, b, sort.key);
      return sort.dir === 'asc' ? result : -result;
    });
    return copy;
  }, [songs, sort]);
}

interface SortableHeadProps {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onToggle: (key: SortKey) => void;
  align?: 'left' | 'center';
}

export function SortableHead({ label, sortKey, sort, onToggle, align = 'left' }: SortableHeadProps) {
  const active = sort?.key === sortKey;
  const Icon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <TableHead className={align === 'center' ? 'text-center' : undefined}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1 select-none',
          align === 'center' && 'mx-auto',
          !active && 'text-muted-foreground',
        )}
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-60')} />
      </button>
    </TableHead>
  );
}
