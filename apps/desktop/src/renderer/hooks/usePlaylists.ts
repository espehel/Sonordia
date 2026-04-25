import { useState, useEffect, useCallback } from 'react'
import type { Playlist, PlaylistSong } from '../types'

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([])

  const refreshPlaylists = useCallback(async () => {
    const list = await window.api.playlists.list()
    setPlaylists(list)
  }, [])

  useEffect(() => {
    refreshPlaylists()
  }, [refreshPlaylists])

  const refreshSongs = useCallback(async (id: string) => {
    const songs = await window.api.playlists.songs(id)
    setPlaylistSongs(songs)
  }, [])

  useEffect(() => {
    if (selectedId) {
      refreshSongs(selectedId)
    } else {
      setPlaylistSongs([])
    }
  }, [selectedId, refreshSongs])

  const createPlaylist = useCallback(async (name: string) => {
    const playlist = await window.api.playlists.create(name)
    setPlaylists((prev) => [playlist, ...prev])
    return playlist
  }, [])

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    await window.api.playlists.rename(id, name)
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }, [])

  const deletePlaylist = useCallback(async (id: string) => {
    await window.api.playlists.delete(id)
    setPlaylists((prev) => prev.filter((p) => p.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
  }, [selectedId])

  const addSong = useCallback(async (songId: string) => {
    if (!selectedId) return
    await window.api.playlists.addSong(selectedId, songId)
    await refreshSongs(selectedId)
  }, [selectedId, refreshSongs])

  const removeSong = useCallback(async (songId: string) => {
    if (!selectedId) return
    await window.api.playlists.removeSong(selectedId, songId)
    setPlaylistSongs((prev) => prev.filter((s) => s.id !== songId))
  }, [selectedId])

  const reorder = useCallback(async (songIds: string[]) => {
    if (!selectedId) return
    await window.api.playlists.reorder(selectedId, songIds)
    await refreshSongs(selectedId)
  }, [selectedId, refreshSongs])

  return {
    playlists,
    selectedId,
    setSelectedId,
    playlistSongs,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addSong,
    removeSong,
    reorder
  }
}
