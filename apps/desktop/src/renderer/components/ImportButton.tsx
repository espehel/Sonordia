interface ImportButtonProps {
  onImport: () => void
}

export function ImportButton({ onImport }: ImportButtonProps) {
  return (
    <button
      onClick={onImport}
      style={{
        padding: '8px 20px',
        fontSize: 14,
        borderRadius: 6,
        border: 'none',
        background: '#1a1a1a',
        color: '#fff',
        cursor: 'pointer'
      }}
    >
      Import Files
    </button>
  )
}
