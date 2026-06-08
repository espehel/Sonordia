import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@sonordia/ui/button';
import { Toaster } from '@sonordia/ui/sonner';
import { ThemeToggle } from '@sonordia/ui/theme-toggle';
import { TooltipProvider } from '@sonordia/ui/tooltip';
import type { Song } from './types';
import { useSongs } from './hooks/useSongs';
import { useAnalysis } from './hooks/useAnalysis';
import { usePlaylists } from './hooks/usePlaylists';
import { usePlayer } from './hooks/usePlayer';
import { useVizSettings } from './hooks/useVizSettings';
import { useBackfill } from './hooks/useBackfill';
import { useBookmarks } from './hooks/useBookmarks';
import { ImportButton } from './components/ImportButton';
import { SongTable } from './components/SongTable';
import { AnalysisStatus } from './components/AnalysisStatus';
import { Sidebar } from './components/Sidebar';
import { PlaylistView } from './components/PlaylistView';
import { PlayerPanel } from './components/PlayerPanel';
import { SongDetailsDrawer } from './components/SongDetailsDrawer';
import { TagFilterDrawer } from './components/TagFilterDrawer';
import { songMatchesFilter } from './components/tagUtils';

function App() {
  const { songs, loading, importFiles, removeSong, showInFolder, locateSong, updateSong } =
    useSongs();
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
    addSongToPlaylist,
    removeSong: removePlaylistSong,
    reorder,
  } = usePlaylists();
  const player = usePlayer();
  const playerBookmarks = useBookmarks(player.playlistId, player.song?.id ?? null);
  const { settings, toggle: toggleLayer } = useVizSettings();
  const backfill = useBackfill();

  useEffect(() => {
    player.setFades(playerBookmarks.fades);
  }, [playerBookmarks.fades, player.setFades]);
  const [detailsSongId, setDetailsSongId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  const toggleTagFilter = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const clearTagFilter = useCallback(() => {
    setSelectedTagIds(new Set());
  }, []);

  const filteredSongs = useMemo(
    () => songs.filter((s) => songMatchesFilter(s, selectedTagIds)),
    [songs, selectedTagIds],
  );
  const filteredPlaylistSongs = useMemo(
    () => playlistSongs.filter((s) => songMatchesFilter(s, selectedTagIds)),
    [playlistSongs, selectedTagIds],
  );

  const playOrToggle = useCallback(
    (song: Song) => {
      if (player.song?.id === song.id) {
        player.toggle();
      } else {
        player.play(song);
      }
    },
    [player],
  );

  const hasPending = songs.some((s) => s.analysis_status === 'pending');
  const bridgeReady = bridgeStatus.status === 'ready';
  const selectedPlaylist = playlists.find((p) => p.id === selectedId);
  const showPlayer = player.song != null;
  const detailsSong = detailsSongId
    ? (playlistSongs.find((s) => s.id === detailsSongId) ??
      songs.find((s) => s.id === detailsSongId) ??
      null)
    : null;

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
          onDropSong={addSongToPlaylist}
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
              <TagFilterDrawer
                songs={selectedId ? playlistSongs : songs}
                currentPlaylistId={selectedId}
                currentPlaylistName={selectedPlaylist?.name ?? null}
                selectedTagIds={selectedTagIds}
                onToggle={toggleTagFilter}
                onClear={clearTagFilter}
              />
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
              playlistSongs={filteredPlaylistSongs}
              allSongs={songs}
              playlistId={selectedId}
              onAddSong={addSong}
              onRemoveSong={removePlaylistSong}
              onShowInFolder={showInFolder}
              onLocate={locateSong}
              onReorder={reorder}
              onPlay={(song) => player.play(song, selectedId)}
              onOpenDetails={setDetailsSongId}
              activeSongId={player.song?.id ?? null}
              detailsSongId={detailsSongId}
              disableReorder={selectedTagIds.size > 0}
            />
          ) : loading ? (
            <div className="text-muted-foreground py-16 text-center">Loading...</div>
          ) : (
            <SongTable
              songs={filteredSongs}
              onAnalyze={analyzeOne}
              onRemove={removeSong}
              onShowInFolder={showInFolder}
              onLocate={locateSong}
              onUpdate={updateSong}
              onPlayPause={playOrToggle}
              onOpenDetails={setDetailsSongId}
              activeSongId={player.song?.id ?? null}
              detailsSongId={detailsSongId}
              currentPlaylistId={null}
            />
          )}
        </div>

        <PlayerPanel
          song={player.song}
          playlistId={player.playlistId}
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
          bookmarks={playerBookmarks.bookmarks}
          onCreateBookmark={playerBookmarks.create}
          onUpdateBookmark={playerBookmarks.update}
          onDeleteBookmark={playerBookmarks.remove}
        />

        <SongDetailsDrawer
          song={detailsSong}
          playlist={selectedPlaylist ?? null}
          allSongs={songs}
          onClose={() => setDetailsSongId(null)}
        />
      </div>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
