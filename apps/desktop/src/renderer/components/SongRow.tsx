import type { Song } from '../types'

interface SongRowProps {
  song: Song
  onAnalyze: (id: string) => void
  onRemove: (id: string) => void
  onPlay?: (song: Song) => void
  isActive?: boolean
}

const statusColors: Record<Song['analysis_status'], string> = {
  pending: '#888',
  analyzing: '#e6a200',
  done: '#2d8a4e',
  error: '#c00'
}

export function SongRow({ song, onAnalyze, onRemove, onPlay, isActive }: SongRowProps) {
  const handleRowClick = () => {
    if (onPlay) onPlay(song)
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <tr
      onClick={handleRowClick}
      style={{
        background: isActive ? '#f4f8ff' : 'transparent',
        cursor: onPlay ? 'pointer' : 'default'
      }}
    >
      <td style={cellStyle}>{song.title ?? '—'}</td>
      <td style={cellStyle}>{song.artist ?? '—'}</td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>{song.key_camelot ?? '—'}</td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        {song.bpm != null ? song.bpm.toFixed(1) : '—'}
      </td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        <span style={{ color: statusColors[song.analysis_status], fontWeight: 500 }}>
          {song.analysis_status}
        </span>
      </td>
      <td style={{ ...cellStyle, textAlign: 'right' }} onClick={stop}>
        {song.analysis_status === 'pending' && (
          <button onClick={() => onAnalyze(song.id)} style={actionBtn}>
            Analyze
          </button>
        )}
        {song.analysis_status === 'error' && (
          <button onClick={() => onAnalyze(song.id)} style={actionBtn} title={song.analysis_error ?? ''}>
            Retry
          </button>
        )}
        <button onClick={() => onRemove(song.id)} style={{ ...actionBtn, color: '#c00' }}>
          Remove
        </button>
      </td>
    </tr>
  )
}

const cellStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 240
}

const actionBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  borderRadius: 4,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
  marginLeft: 4
}
