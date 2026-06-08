import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { existsSync } from 'fs';
import {
  listSongs,
  addSongs,
  removeSong,
  relocateSong,
  getSong,
  updateSongAnalysis,
  updateSongMetadata,
  updateSongNotes,
  getPendingSongs,
  listPlaylists,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  getPlaylistSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
  listTags,
  findOrCreateTag,
  deleteTag,
  attachTag,
  detachTag,
  parseFilename,
  listBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  CreateBookmarkInput,
  UpdateBookmarkPatch,
  Song,
} from './db';
import { PythonBridge, BridgeMetadata } from './python-bridge';
import { inferGenre } from './genre';
import { VizBackfill } from './viz-backfill';
import {
  ensureVizDir,
  writeVizFile,
  readAllViz,
  listMissingFeatures,
  clearVizDir,
  VIZ_FEATURES,
  VizFeature,
} from './viz-cache';

function withFileStatus<T extends { file_path: string }>(song: T): T & { file_missing: boolean } {
  return { ...song, file_missing: !existsSync(song.file_path) };
}

export function registerIpc(bridge: PythonBridge, backfill: VizBackfill): void {
  // ── Songs ──

  ipcMain.handle('songs:list', () => listSongs().map(withFileStatus));

  ipcMain.handle('songs:add', (_event, filePaths: string[]) =>
    addSongs(filePaths).map(withFileStatus),
  );

  ipcMain.handle('songs:remove', (_event, id: string) => {
    removeSong(id);
    clearVizDir(id);
  });

  ipcMain.handle('songs:pick-files', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return [];
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'ogg'] }],
    });
    if (result.canceled) return [];
    return addSongs(result.filePaths).map(withFileStatus);
  });

  ipcMain.handle('songs:show-in-folder', (_event, id: string): boolean => {
    const song = getSong(id);
    if (!song || !existsSync(song.file_path)) return false;
    shell.showItemInFolder(song.file_path);
    return true;
  });

  ipcMain.handle('songs:locate', async (_event, id: string) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const song = getSong(id);
    if (!song) return null;
    const result = await dialog.showOpenDialog(win, {
      title: `Locate "${song.title ?? 'song'}"`,
      properties: ['openFile'],
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'ogg'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const updated = relocateSong(id, result.filePaths[0]);
    if (!updated) return null;
    const wrapped = withFileStatus(updated);
    sendToAllWindows('songs:updated', wrapped);
    return wrapped;
  });

  ipcMain.handle(
    'songs:update-metadata',
    (
      _event,
      { id, data }: { id: string; data: { title?: string | null; artist?: string | null } },
    ) => {
      const updated = updateSongMetadata(id, data);
      if (!updated) return null;
      const wrapped = withFileStatus(updated);
      sendToAllWindows('songs:updated', wrapped);
      return wrapped;
    },
  );

  ipcMain.handle(
    'songs:update-notes',
    (_event, { id, notes }: { id: string; notes: string | null }) => {
      const updated = updateSongNotes(id, notes);
      if (!updated) return null;
      const wrapped = withFileStatus(updated);
      sendToAllWindows('songs:updated', wrapped);
      return wrapped;
    },
  );

  ipcMain.handle('songs:analyze', async (_event, id: string) => {
    await analyzeSong(id, bridge);
  });

  ipcMain.handle('songs:analyze-all', async () => {
    const pending = getPendingSongs();
    for (const song of pending) {
      await analyzeSong(song.id, bridge);
    }
  });

  // ── Playlists ──

  ipcMain.handle('playlists:list', () => listPlaylists());

  ipcMain.handle('playlists:create', (_event, name: string) => createPlaylist(name));

  ipcMain.handle('playlists:rename', (_event, { id, name }: { id: string; name: string }) => {
    renamePlaylist(id, name);
  });

  ipcMain.handle('playlists:delete', (_event, id: string) => {
    deletePlaylist(id);
  });

  ipcMain.handle('playlists:songs', (_event, id: string) =>
    getPlaylistSongs(id).map(withFileStatus),
  );

  ipcMain.handle(
    'playlists:add-song',
    (_event, { playlistId, songId }: { playlistId: string; songId: string }) => {
      addSongToPlaylist(playlistId, songId);
    },
  );

  ipcMain.handle(
    'playlists:remove-song',
    (_event, { playlistId, songId }: { playlistId: string; songId: string }) => {
      removeSongFromPlaylist(playlistId, songId);
    },
  );

  ipcMain.handle(
    'playlists:reorder',
    (_event, { playlistId, songIds }: { playlistId: string; songIds: string[] }) => {
      reorderPlaylist(playlistId, songIds);
    },
  );

  // ── Tags ──

  ipcMain.handle('tags:list', (_event, playlistId?: string | null) => listTags(playlistId));

  ipcMain.handle(
    'tags:attach',
    (
      _event,
      { songId, name, playlistId }: { songId: string; name: string; playlistId: string | null },
    ) => {
      const tag = findOrCreateTag(name, playlistId);
      attachTag(songId, tag.id);
      const updated = getSong(songId);
      if (updated) sendToAllWindows('songs:updated', withFileStatus(updated));
      return tag;
    },
  );

  ipcMain.handle(
    'tags:detach',
    (_event, { songId, tagId }: { songId: string; tagId: string }) => {
      detachTag(songId, tagId);
      const updated = getSong(songId);
      if (updated) sendToAllWindows('songs:updated', withFileStatus(updated));
    },
  );

  ipcMain.handle('tags:delete', (_event, id: string) => {
    deleteTag(id);
  });

  // ── Bookmarks ──

  ipcMain.handle(
    'bookmarks:list',
    (_event, { playlistId, songId }: { playlistId: string; songId: string }) =>
      listBookmarks(playlistId, songId),
  );

  ipcMain.handle('bookmarks:create', (_event, input: CreateBookmarkInput) => {
    const bookmark = createBookmark(input);
    sendToAllWindows('bookmarks:updated', {
      playlistId: bookmark.playlist_id,
      songId: bookmark.song_id,
    });
    return bookmark;
  });

  ipcMain.handle(
    'bookmarks:update',
    (_event, { id, patch }: { id: string; patch: UpdateBookmarkPatch }) => {
      const bookmark = updateBookmark(id, patch);
      if (!bookmark) return null;
      sendToAllWindows('bookmarks:updated', {
        playlistId: bookmark.playlist_id,
        songId: bookmark.song_id,
      });
      return bookmark;
    },
  );

  ipcMain.handle('bookmarks:delete', (_event, id: string) => {
    const removed = deleteBookmark(id);
    if (!removed) return;
    sendToAllWindows('bookmarks:updated', {
      playlistId: removed.playlist_id,
      songId: removed.song_id,
    });
  });

  // ── Visualizations ──

  ipcMain.handle('viz:get', (_event, songId: string) => {
    const data = readAllViz(songId);
    const missing = listMissingFeatures(songId);
    return { data, missing };
  });

  ipcMain.handle('viz:compute', async (_event, songId: string) => {
    const song = getSong(songId);
    if (!song) return { written: [] };
    const missing = listMissingFeatures(songId);
    if (missing.length === 0) return { written: [] };
    const outDir = ensureVizDir(songId);
    return bridge.computeViz(song.file_path, outDir, missing as VizFeature[]);
  });

  ipcMain.handle('viz:progress', () => backfill.getProgress());

  // ── Bridge status push ──

  bridge.on('status', (status) => {
    sendToAllWindows('bridge:status', status);
  });
}

async function analyzeSong(id: string, bridge: PythonBridge): Promise<void> {
  const song = getSong(id);
  if (!song) return;

  updateSongAnalysis(id, { analysis_status: 'analyzing' });
  pushSongUpdate(getSong(id));

  try {
    const result = await bridge.analyze(song.file_path);
    updateSongAnalysis(id, {
      key_camelot: result.key.camelot,
      key_name: result.key.key_name,
      key_id: result.key.key_id,
      bpm: result.bpm.bpm,
      bpm_confidence: result.bpm.confidence,
      analysis_status: 'done',
    });
    // Beats are already computed during analyze — cache them so the bridge
    // doesn't have to redo essentia for the beat-grid layer.
    writeVizFile(id, 'beats', { bpm: result.bpm.bpm, beats: result.beats });

    enrichSong(song, result.metadata, result.bpm.bpm);

    pushSongUpdate(getSong(id));

    // Compute the remaining viz features for this song. Don't await — let it
    // run in the background; the renderer can request them on demand if needed.
    const remaining = VIZ_FEATURES.filter((f) => f !== 'beats');
    const outDir = ensureVizDir(id);
    bridge.computeViz(song.file_path, outDir, remaining as VizFeature[]).catch((err) => {
      console.error(`[viz] compute-viz failed for ${id}:`, err);
    });
  } catch (err) {
    const updated = updateSongAnalysis(id, {
      analysis_status: 'error',
      analysis_error: err instanceof Error ? err.message : String(err),
    });
    pushSongUpdate(updated);
  }
}

// Apply ID3-derived title/artist and a genre tag after analysis.
// Title/artist are only overwritten when the existing value is null or matches
// what filename parsing would have produced — preserving manual edits.
function enrichSong(song: Song, metadata: BridgeMetadata, bpm: number | null): void {
  const parsed = parseFilename(song.file_path);
  const updates: { title?: string | null; artist?: string | null } = {};

  if (metadata.title && metadata.title !== song.title) {
    const titleIsDefault = song.title === null || song.title === parsed.title;
    if (titleIsDefault) updates.title = metadata.title;
  }
  if (metadata.artist && metadata.artist !== song.artist) {
    const artistIsDefault = song.artist === null || song.artist === parsed.artist;
    if (artistIsDefault) updates.artist = metadata.artist;
  }
  if (Object.keys(updates).length > 0) {
    updateSongMetadata(song.id, updates);
  }

  const genre = inferGenre({
    filePath: song.file_path,
    bpm,
    bridgeGenre: metadata.genre,
  });
  if (genre) {
    try {
      const tag = findOrCreateTag(genre, null);
      attachTag(song.id, tag.id);
    } catch (e) {
      console.error(`[analyze] failed to attach genre tag "${genre}" to ${song.id}:`, e);
    }
  }
}

function pushSongUpdate(song: Song | undefined): void {
  if (!song) return;
  sendToAllWindows('songs:updated', withFileStatus(song));
}

function sendToAllWindows(channel: string, data: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, data);
  }
}
