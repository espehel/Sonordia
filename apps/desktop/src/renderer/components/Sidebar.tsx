import { useState } from 'react'
import type { Playlist } from '../types'

interface SidebarProps {
  playlists: Playlist[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function Sidebar({ playlists, selectedId, onSelect, onCreate, onRename, onDelete }: SidebarProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    onCreate(name)
    setNewName('')
  }

  const startRename = (playlist: Playlist) => {
    setEditingId(playlist.id)
    setEditName(playlist.name)
  }

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <div style={{
      width: 220,
      borderRight: '1px solid #eee',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      flexShrink: 0
    }}>
      <div
        onClick={() => onSelect(null)}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          background: selectedId === null ? '#f0f0f0' : 'transparent'
        }}
      >
        All Songs
      </div>

      <div style={{
        fontSize: 11,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        padding: '12px 12px 4px',
        fontWeight: 600
      }}>
        Playlists
      </div>

      {playlists.map((pl) => (
        <div
          key={pl.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            background: selectedId === pl.id ? '#f0f0f0' : 'transparent',
            fontSize: 14
          }}
          onClick={() => onSelect(pl.id)}
        >
          {editingId === pl.id ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                padding: '2px 4px',
                fontSize: 14,
                border: '1px solid #ccc',
                borderRadius: 4,
                outline: 'none'
              }}
            />
          ) : (
            <>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pl.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); startRename(pl) }}
                style={iconBtn}
                title="Rename"
              >
                &#9998;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(pl.id) }}
                style={{ ...iconBtn, color: '#c00' }}
                title="Delete"
              >
                &times;
              </button>
            </>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New playlist..."
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 13,
            border: '1px solid #ddd',
            borderRadius: 4,
            outline: 'none'
          }}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          style={{
            padding: '6px 10px',
            fontSize: 13,
            borderRadius: 4,
            border: 'none',
            background: newName.trim() ? '#1a1a1a' : '#ccc',
            color: '#fff',
            cursor: newName.trim() ? 'pointer' : 'default'
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  padding: '0 2px',
  color: '#888',
  lineHeight: 1
}
