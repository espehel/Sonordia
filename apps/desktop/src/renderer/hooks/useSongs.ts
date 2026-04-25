import { useState, useEffect, useCallback } from 'react'
import type { Song } from '../types'

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await window.api.songs.list()
    setSongs(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Listen for real-time song updates from the main process
  useEffect(() => {
    const unsub = window.api.onSongUpdated((updated: Song) => {
      setSongs((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      )
    })
    return unsub
  }, [])

  const importFiles = useCallback(async () => {
    const added = await window.api.songs.pickFiles()
    if (added.length > 0) {
      setSongs((prev) => [...added, ...prev])
    }
    return added
  }, [])

  const removeSong = useCallback(async (id: string) => {
    await window.api.songs.remove(id)
    setSongs((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { songs, loading, refresh, importFiles, removeSong }
}
