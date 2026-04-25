import type { Song } from '../types'
import { SongRow } from './SongRow'

interface SongTableProps {
  songs: Song[]
  onAnalyze: (id: string) => void
  onRemove: (id: string) => void
  onPlay?: (song: Song) => void
  activeSongId?: string | null
}

export function SongTable({ songs, onAnalyze, onRemove, onPlay, activeSongId }: SongTableProps) {
  if (songs.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#888', padding: '60px 0' }}>
        No songs yet. Import audio files to get started.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {['Title', 'Artist', 'Key', 'BPM', 'Status', ''].map((header) => (
              <th
                key={header}
                style={{
                  padding: '8px 12px',
                  textAlign: header === 'Key' || header === 'BPM' || header === 'Status' ? 'center' : 'left',
                  borderBottom: '2px solid #eee',
                  fontSize: 12,
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 600
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {songs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              onAnalyze={onAnalyze}
              onRemove={onRemove}
              onPlay={onPlay}
              isActive={activeSongId === song.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
