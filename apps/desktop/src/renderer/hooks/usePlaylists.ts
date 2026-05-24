import { useState, useEffect, useCallback } from 'react';
import { toast } from '@sonordia/ui/sonner';
import type { Playlist, PlaylistSong } from '../types';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);

  const refreshPlaylists = useCallback(async () => {
    const list = await window.api.playlists.list();
    setPlaylists(list);
  }, []);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  const refreshSongs = useCallback(async (id: string) => {
    const songs = await window.api.playlists.songs(id);
    setPlaylistSongs(songs);
  }, []);

  useEffect(() => {
    if (selectedId) {
      refreshSongs(selectedId);
    } else {
      setPlaylistSongs([]);
    }
  }, [selectedId, refreshSongs]);

  useEffect(() => {
    const unsub = window.api.onSongUpdated((updated) => {
      setPlaylistSongs((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...updated, position: s.position } : s)),
      );
    });
    return unsub;
  }, []);

  const createPlaylist = useCallback(async (name: string) => {
    try {
      const playlist = await window.api.playlists.create(name);
      setPlaylists((prev) => [playlist, ...prev]);
      toast.success(`Created “${playlist.name}”`);
      return playlist;
    } catch (e) {
      toast.error('Failed to create playlist', { description: errorMessage(e) });
      throw e;
    }
  }, []);

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    try {
      await window.api.playlists.rename(id, name);
      setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
      toast.success(`Renamed to “${name}”`);
    } catch (e) {
      toast.error('Failed to rename playlist', { description: errorMessage(e) });
      throw e;
    }
  }, []);

  const deletePlaylist = useCallback(
    async (id: string) => {
      const target = playlists.find((p) => p.id === id);
      try {
        await window.api.playlists.delete(id);
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
        }
        if (target) toast.success(`Deleted “${target.name}”`);
      } catch (e) {
        toast.error('Failed to delete playlist', { description: errorMessage(e) });
        throw e;
      }
    },
    [selectedId, playlists],
  );

  const addSong = useCallback(
    async (songId: string) => {
      if (!selectedId) return;
      await window.api.playlists.addSong(selectedId, songId);
      await refreshSongs(selectedId);
    },
    [selectedId, refreshSongs],
  );

  const addSongToPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      const target = playlists.find((p) => p.id === playlistId);
      try {
        await window.api.playlists.addSong(playlistId, songId);
        if (selectedId === playlistId) {
          await refreshSongs(playlistId);
        }
        if (target) toast.success(`Added to “${target.name}”`);
      } catch (e) {
        toast.error('Failed to add song', { description: errorMessage(e) });
      }
    },
    [playlists, selectedId, refreshSongs],
  );

  const removeSong = useCallback(
    async (songId: string) => {
      if (!selectedId) return;
      await window.api.playlists.removeSong(selectedId, songId);
      setPlaylistSongs((prev) => prev.filter((s) => s.id !== songId));
    },
    [selectedId],
  );

  const reorder = useCallback(
    async (songIds: string[]) => {
      if (!selectedId) return;
      await window.api.playlists.reorder(selectedId, songIds);
      await refreshSongs(selectedId);
    },
    [selectedId, refreshSongs],
  );

  return {
    playlists,
    selectedId,
    setSelectedId,
    playlistSongs,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addSong,
    addSongToPlaylist,
    removeSong,
    reorder,
  };
}
