import { Button } from '@sonordia/ui/button';
import { Toaster } from '@sonordia/ui/sonner';
import { ThemeToggle } from '@sonordia/ui/theme-toggle';
import { TooltipProvider } from '@sonordia/ui/tooltip';
import { useSongs } from './hooks/useSongs';
import { useAnalysis } from './hooks/useAnalysis';
import { usePlaylists } from './hooks/usePlaylists';
import { usePlayer } from './hooks/usePlayer';
import { useVizSettings } from './hooks/useVizSettings';
import { useBackfill } from './hooks/useBackfill';
import { ImportButton } from './components/ImportButton';
import { SongTable } from './components/SongTable';
import { AnalysisStatus } from './components/AnalysisStatus';
import { Sidebar } from './components/Sidebar';
import { PlaylistView } from './components/PlaylistView';
import { PlayerPanel } from './components/PlayerPanel';

function App() {
  const { songs, loading, importFiles, removeSong } = useSongs();
  const { bridgeStatus, analyzeOne, analyzeAll } = useAnalysis();
  const {
    playlists,
    selectedId,
    setSelectedId,
    playlistSongs,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addSong,
    removeSong: removePlaylistSong,
    reorder,
  } = usePlaylists();
  const player = usePlayer();
  const { settings, toggle: toggleLayer } = useVizSettings();
  const backfill = useBackfill();

  const hasPending = songs.some((s) => s.analysis_status === 'pending');
  const bridgeReady = bridgeStatus.status === 'ready';
  const selectedPlaylist = playlists.find((p) => p.id === selectedId);
  const showPlayer = player.song != null;

  return (
    <TooltipProvider>
      <div className="flex h-screen font-sans">
        <Sidebar
          playlists={playlists}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={createPlaylist}
          onRename={renamePlaylist}
          onDelete={deletePlaylist}
        />

        <div className={`flex-1 overflow-auto p-6 ${showPlayer ? 'pb-[264px]' : ''}`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">
                {selectedPlaylist ? selectedPlaylist.name : 'All Songs'}
              </h1>
              <AnalysisStatus status={bridgeStatus} />
            </div>
            <div className="flex items-center gap-2">
              {!selectedId && hasPending && (
                <Button onClick={analyzeAll} disabled={!bridgeReady} variant="outline" size="sm">
                  Analyze All
                </Button>
              )}
              {!selectedId && <ImportButton onImport={importFiles} />}
              <ThemeToggle />
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
            <div className="text-muted-foreground py-16 text-center">Loading...</div>
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
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
