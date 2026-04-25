import { useState, useRef } from 'react'
import type { PlaylistSong, Song } from '../types'

interface PlaylistViewProps {
  playlistSongs: PlaylistSong[]
  allSongs: Song[]
  onAddSong: (songId: string) => void
  onRemoveSong: (songId: string) => void
  onReorder: (songIds: string[]) => void
}

export function PlaylistView({ playlistSongs, allSongs, onAddSong, onRemoveSong, onReorder }: PlaylistViewProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  const handleDragStart = (idx: number) => {
    setDragIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    dragOverIdx.current = idx
  }

  const handleDrop = () => {
    if (dragIdx === null || dragOverIdx.current === null || dragIdx === dragOverIdx.current) {
      setDragIdx(null)
      return
    }
    const ids = playlistSongs.map((s) => s.id)
    const [moved] = ids.splice(dragIdx, 1)
    ids.splice(dragOverIdx.current, 0, moved)
    onReorder(ids)
    setDragIdx(null)
    dragOverIdx.current = null
  }

  // Songs not already in the playlist
  const playlistSongIds = new Set(playlistSongs.map((s) => s.id))
  const addable = allSongs.filter((s) => !playlistSongIds.has(s.id))

  return (
    <div>
      {playlistSongs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
          No songs in this playlist. Add songs from the dropdown below.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {['#', 'Title', 'Artist', 'Key', 'BPM', ''].map((h) => (
                <th key={h} style={{
                  padding: '8px 12px',
                  textAlign: h === 'Key' || h === 'BPM' || h === '#' ? 'center' : 'left',
                  borderBottom: '2px solid #eee',
                  fontSize: 12,
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 600
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playlistSongs.map((song, idx) => (
              <tr
                key={song.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDrop}
                style={{
                  opacity: dragIdx === idx ? 0.4 : 1,
                  cursor: 'grab'
                }}
              >
                <td style={{ ...cell, textAlign: 'center', color: '#aaa', width: 40 }}>{idx + 1}</td>
                <td style={cell}>{song.title ?? '—'}</td>
                <td style={cell}>{song.artist ?? '—'}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{song.key_camelot ?? '—'}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{song.bpm != null ? song.bpm.toFixed(1) : '—'}</td>
                <td style={{ ...cell, textAlign: 'right' }}>
                  <button onClick={() => onRemoveSong(song.id)} style={removeBtn}>&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {addable.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onAddSong(e.target.value)
                e.target.value = ''
              }
            }}
            style={{
              padding: '6px 8px',
              fontSize: 13,
              border: '1px solid #ddd',
              borderRadius: 4,
              minWidth: 200
            }}
          >
            <option value="" disabled>Add a song...</option>
            {addable.map((s) => (
              <option key={s.id} value={s.id}>{s.title ?? s.file_path}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

const cell: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 240
}

const removeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  color: '#c00',
  padding: '2px 6px'
}
