import type { BridgeStatus } from '../types'

interface AnalysisStatusProps {
  status: BridgeStatus
}

const statusConfig: Record<string, { color: string; label: string }> = {
  starting: { color: '#e6a200', label: 'Bridge starting...' },
  restarting: { color: '#e6a200', label: 'Bridge restarting...' },
  ready: { color: '#2d8a4e', label: 'Bridge ready' },
  exited: { color: '#c00', label: 'Bridge exited' },
  error: { color: '#c00', label: 'Bridge error' }
}

export function AnalysisStatus({ status }: AnalysisStatusProps) {
  const config = statusConfig[status.status] ?? { color: '#888', label: status.status }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: config.color
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.color,
          display: 'inline-block'
        }}
      />
      {config.label}
      {status.error && (
        <span style={{ color: '#888' }} title={status.error}>
          — {status.error}
        </span>
      )}
    </div>
  )
}
