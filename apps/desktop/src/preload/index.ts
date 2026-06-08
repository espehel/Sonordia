import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  Song,
  BridgeStatus,
  BackfillProgress,
  BookmarksUpdatedEvent,
  ElectronAPI,
} from './api';

const api: ElectronAPI = {
  songs: {
    list: () => ipcRenderer.invoke('songs:list'),
    add: (paths: string[]) => ipcRenderer.invoke('songs:add', paths),
    remove: (id: string) => ipcRenderer.invoke('songs:remove', id),
    analyze: (id: string) => ipcRenderer.invoke('songs:analyze', id),
    analyzeAll: () => ipcRenderer.invoke('songs:analyze-all'),
    pickFiles: () => ipcRenderer.invoke('songs:pick-files'),
    showInFolder: (id: string) => ipcRenderer.invoke('songs:show-in-folder', id),
    locate: (id: string) => ipcRenderer.invoke('songs:locate', id),
    updateMetadata: (id, data) => ipcRenderer.invoke('songs:update-metadata', { id, data }),
    updateNotes: (id, notes) => ipcRenderer.invoke('songs:update-notes', { id, notes }),
  },
  tags: {
    list: (playlistId) => ipcRenderer.invoke('tags:list', playlistId),
    attach: (songId, name, playlistId) =>
      ipcRenderer.invoke('tags:attach', { songId, name, playlistId }),
    detach: (songId, tagId) => ipcRenderer.invoke('tags:detach', { songId, tagId }),
    delete: (id) => ipcRenderer.invoke('tags:delete', id),
  },
  playlists: {
    list: () => ipcRenderer.invoke('playlists:list'),
    create: (name: string) => ipcRenderer.invoke('playlists:create', name),
    rename: (id: string, name: string) => ipcRenderer.invoke('playlists:rename', { id, name }),
    delete: (id: string) => ipcRenderer.invoke('playlists:delete', id),
    songs: (id: string) => ipcRenderer.invoke('playlists:songs', id),
    addSong: (playlistId: string, songId: string) =>
      ipcRenderer.invoke('playlists:add-song', { playlistId, songId }),
    removeSong: (playlistId: string, songId: string) =>
      ipcRenderer.invoke('playlists:remove-song', { playlistId, songId }),
    reorder: (playlistId: string, songIds: string[]) =>
      ipcRenderer.invoke('playlists:reorder', { playlistId, songIds }),
  },
  viz: {
    get: (songId: string) => ipcRenderer.invoke('viz:get', songId),
    compute: (songId: string) => ipcRenderer.invoke('viz:compute', songId),
    getProgress: () => ipcRenderer.invoke('viz:progress'),
    audioUrl: (songId: string) => `audio://${encodeURIComponent(songId)}`,
  },
  bookmarks: {
    list: (playlistId, songId) =>
      ipcRenderer.invoke('bookmarks:list', { playlistId, songId }),
    create: (input) => ipcRenderer.invoke('bookmarks:create', input),
    update: (id, patch) => ipcRenderer.invoke('bookmarks:update', { id, patch }),
    delete: (id) => ipcRenderer.invoke('bookmarks:delete', id),
  },
  onSongUpdated: (cb: (song: Song) => void) => {
    const listener = (_event: IpcRendererEvent, song: Song) => cb(song);
    ipcRenderer.on('songs:updated', listener);
    return () => ipcRenderer.removeListener('songs:updated', listener);
  },
  onBridgeStatus: (cb: (status: BridgeStatus) => void) => {
    const listener = (_event: IpcRendererEvent, status: BridgeStatus) => cb(status);
    ipcRenderer.on('bridge:status', listener);
    return () => ipcRenderer.removeListener('bridge:status', listener);
  },
  onVizProgress: (cb: (progress: BackfillProgress) => void) => {
    const listener = (_event: IpcRendererEvent, progress: BackfillProgress) => cb(progress);
    ipcRenderer.on('viz:progress', listener);
    return () => ipcRenderer.removeListener('viz:progress', listener);
  },
  onBookmarksUpdated: (cb: (event: BookmarksUpdatedEvent) => void) => {
    const listener = (_event: IpcRendererEvent, payload: BookmarksUpdatedEvent) => cb(payload);
    ipcRenderer.on('bookmarks:updated', listener);
    return () => ipcRenderer.removeListener('bookmarks:updated', listener);
  },
};

contextBridge.exposeInMainWorld('api', api);
