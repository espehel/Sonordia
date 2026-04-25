import type { VizLayer, VizSettings } from '../hooks/useVizSettings'

interface Props {
  settings: VizSettings
  onToggle: (layer: VizLayer) => void
}

const LAYERS: { key: VizLayer; label: string }[] = [
  { key: 'waveform', label: 'Wave' },
  { key: 'ruler', label: 'Ruler' },
  { key: 'beats', label: 'Beats' },
  { key: 'rms', label: 'RMS' },
  { key: 'chroma', label: 'Chroma' },
  { key: 'keytrack', label: 'Key' }
]

export function VizToolbar({ settings, onToggle }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {LAYERS.map(({ key, label }) => {
        const active = settings[key]
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 12,
              border: '1px solid',
              borderColor: active ? '#1a1a1a' : '#ddd',
              background: active ? '#1a1a1a' : '#fff',
              color: active ? '#fff' : '#888',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
