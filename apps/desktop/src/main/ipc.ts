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
  getPendingSongs,
  listPlaylists,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  getPlaylistSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
  Song,
} from './db';
import { PythonBridge } from './python-bridge';
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
    const updated = updateSongAnalysis(id, {
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
    pushSongUpdate(updated);

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

function pushSongUpdate(song: Song | undefined): void {
  if (!song) return;
  sendToAllWindows('songs:updated', withFileStatus(song));
}

function sendToAllWindows(channel: string, data: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, data);
  }
}
