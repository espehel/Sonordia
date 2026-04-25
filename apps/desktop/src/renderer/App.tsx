import { useSongs } from './hooks/useSongs'
import { useAnalysis } from './hooks/useAnalysis'
import { usePlaylists } from './hooks/usePlaylists'
import { usePlayer } from './hooks/usePlayer'
import { useVizSettings } from './hooks/useVizSettings'
import { useBackfill } from './hooks/useBackfill'
import { ImportButton } from './components/ImportButton'
import { SongTable } from './components/SongTable'
import { AnalysisStatus } from './components/AnalysisStatus'
import { Sidebar } from './components/Sidebar'
import { PlaylistView } from './components/PlaylistView'
import { PlayerPanel } from './components/PlayerPanel'

const PANEL_RESERVE_PX = 264

function App(): JSX.Element {
  const { songs, loading, importFiles, removeSong } = useSongs()
  const { bridgeStatus, analyzeOne, analyzeAll } = useAnalysis()
  const {
    playlists, selectedId, setSelectedId, playlistSongs,
    createPlaylist, renamePlaylist, deletePlaylist,
    addSong, removeSong: removePlaylistSong, reorder
  } = usePlaylists()
  const player = usePlayer()
  const { settings, toggle: toggleLayer } = useVizSettings()
  const backfill = useBackfill()

  const hasPending = songs.some((s) => s.analysis_status === 'pending')
  const bridgeReady = bridgeStatus.status === 'ready'
  const selectedPlaylist = playlists.find((p) => p.id === selectedId)
  const showPlayer = player.song != null

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', height: '100vh' }}>
      <Sidebar
        playlists={playlists}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={createPlaylist}
        onRename={renamePlaylist}
        onDelete={deletePlaylist}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: 24, paddingBottom: showPlayer ? PANEL_RESERVE_PX : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 22, margin: 0 }}>
              {selectedPlaylist ? selectedPlaylist.name : 'All Songs'}
            </h1>
            <AnalysisStatus status={bridgeStatus} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!selectedId && hasPending && (
              <button
                onClick={analyzeAll}
                disabled={!bridgeReady}
                style={{
                  padding: '8px 20px',
                  fontSize: 14,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: '#fff',
                  cursor: bridgeReady ? 'pointer' : 'not-allowed',
                  opacity: bridgeReady ? 1 : 0.5
                }}
              >
                Analyze All
              </button>
            )}
            {!selectedId && <ImportButton onImport={importFiles} />}
          </div>
        </div>

        {selectedId ? (
          <PlaylistView
            playlistSongs={playlistSongs}
            allSongs={songs}
            onAddSong={addSong}
            onRemoveSong={removePlaylistSong}
            onReorder={reorder}
            onPlay={player.play}
            activeSongId={player.song?.id ?? null}
          />
        ) : loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '60px 0' }}>Loading...</div>
        ) : (
          <SongTable
            songs={songs}
            onAnalyze={analyzeOne}
            onRemove={removeSong}
            onPlay={player.play}
            activeSongId={player.song?.id ?? null}
          />
        )}
      </div>

      <PlayerPanel
        song={player.song}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        viz={player.viz}
        vizLoading={player.vizLoading}
        vizMissing={player.vizMissing}
        settings={settings}
        onToggleLayer={toggleLayer}
        onPlayPause={player.toggle}
        onSeek={player.seek}
        backfill={backfill}
      />
    </div>
  )
}

export default App
