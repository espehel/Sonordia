import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Bookmark,
  CreateBookmarkInput,
  FadeBookmark,
  UpdateBookmarkPatch,
} from '../types';

interface UseBookmarksResult {
  bookmarks: Bookmark[];
  fades: FadeBookmark[];
  loading: boolean;
  create: (input: Omit<CreateBookmarkInput, 'playlist_id' | 'song_id'>) => Promise<Bookmark | null>;
  update: (id: string, patch: UpdateBookmarkPatch) => Promise<Bookmark | null>;
  remove: (id: string) => Promise<void>;
}

export function useBookmarks(
  playlistId: string | null,
  songId: string | null,
): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!playlistId || !songId) {
      setBookmarks([]);
      return;
    }
    setLoading(true);
    try {
      const list = await window.api.bookmarks.list(playlistId, songId);
      setBookmarks(list);
    } finally {
      setLoading(false);
    }
  }, [playlistId, songId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!playlistId || !songId) return;
    return window.api.onBookmarksUpdated((event) => {
      if (event.playlistId === playlistId && event.songId === songId) {
        void refresh();
      }
    });
  }, [playlistId, songId, refresh]);

  const fades = useMemo(
    () => bookmarks.filter((b): b is FadeBookmark => b.kind === 'fade'),
    [bookmarks],
  );

  const create = useCallback<UseBookmarksResult['create']>(
    async (input) => {
      if (!playlistId || !songId) return null;
      return window.api.bookmarks.create({ ...input, playlist_id: playlistId, song_id: songId });
    },
    [playlistId, songId],
  );

  const update = useCallback<UseBookmarksResult['update']>(
    (id, patch) => window.api.bookmarks.update(id, patch),
    [],
  );

  const remove = useCallback<UseBookmarksResult['remove']>(
    (id) => window.api.bookmarks.delete(id),
    [],
  );

  return { bookmarks, fades, loading, create, update, remove };
}

/**
 * Returns the effective level (0..100) at playback time `t`, given a list of
 * fade bookmarks. Implicit anchor: level is 100 at t=0. After the last fade,
 * the level holds.
 */
export function levelAt(t: number, fades: FadeBookmark[]): number {
  if (fades.length === 0) return 100;
  const sorted = [...fades].sort((a, b) => a.position_sec - b.position_sec);
  if (t <= sorted[0].position_sec) {
    return equalPowerInterp(0, 100, sorted[0].position_sec, sorted[0].level_pct, t);
  }
  const last = sorted[sorted.length - 1];
  if (t >= last.position_sec) return last.level_pct;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.position_sec && t <= b.position_sec) {
      return equalPowerInterp(a.position_sec, a.level_pct, b.position_sec, b.level_pct, t);
    }
  }
  return 100;
}

function equalPowerInterp(
  aT: number,
  aLevel: number,
  bT: number,
  bLevel: number,
  t: number,
): number {
  const span = bT - aT;
  if (span <= 0) return bLevel;
  const p = Math.max(0, Math.min(1, (t - aT) / span));
  const w = Math.sin((p * Math.PI) / 2) ** 2;
  return aLevel * (1 - w) + bLevel * w;
}
