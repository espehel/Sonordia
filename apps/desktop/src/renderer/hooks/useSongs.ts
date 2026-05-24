import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@sonordia/ui/sonner';
import type { Song } from '../types';

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  // Track previous analysis_status per song so we only toast on transitions into error,
  // not on every push (the status field can be re-emitted multiple times during analysis).
  const prevStatus = useRef<Map<string, Song['analysis_status']>>(new Map());

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await window.api.songs.list();
    setSongs(list);
    prevStatus.current = new Map(list.map((s) => [s.id, s.analysis_status]));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  useEffect(() => {
    const unsub = window.api.onSongUpdated((updated: Song) => {
      const prev = prevStatus.current.get(updated.id);
      if (prev !== 'error' && updated.analysis_status === 'error') {
        toast.error(`Analysis failed: ${updated.title ?? 'song'}`, {
          description: updated.analysis_error ?? undefined,
          action: {
            label: 'Retry',
            onClick: () => window.api.songs.analyze(updated.id),
          },
        });
      }
      prevStatus.current.set(updated.id, updated.analysis_status);
      setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    });
    return unsub;
  }, []);

  const importFiles = useCallback(async () => {
    const added = await window.api.songs.pickFiles();
    if (added.length > 0) {
      setSongs((prev) => [...added, ...prev]);
      for (const s of added) prevStatus.current.set(s.id, s.analysis_status);
      toast.success(`Imported ${added.length} ${added.length === 1 ? 'file' : 'files'}`);
    }
    return added;
  }, []);

  const removeSong = useCallback(async (id: string) => {
    await window.api.songs.remove(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
    prevStatus.current.delete(id);
  }, []);

  const showInFolder = useCallback(async (id: string) => {
    const ok = await window.api.songs.showInFolder(id);
    if (!ok) {
      toast.error("Couldn't open file location", {
        description: 'The original file may have been moved or deleted.',
      });
    }
  }, []);

  const updateSong = useCallback(
    async (id: string, data: { title?: string | null; artist?: string | null }) => {
      try {
        const updated = await window.api.songs.updateMetadata(id, data);
        if (updated) {
          setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }
      } catch (e) {
        toast.error("Couldn't update song", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [],
  );

  const locateSong = useCallback(async (id: string) => {
    try {
      const updated = await window.api.songs.locate(id);
      if (updated) {
        setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast.success('File location updated');
      }
    } catch (e) {
      toast.error("Couldn't update file location", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  return {
    songs,
    loading,
    refresh,
    importFiles,
    removeSong,
    showInFolder,
    locateSong,
    updateSong,
  };
}
