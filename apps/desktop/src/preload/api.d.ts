export interface Song {
  id: string;
  file_path: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  duration_sec: number | null;
  key_camelot: string | null;
  key_name: string | null;
  key_id: number | null;
  bpm: number | null;
  bpm_confidence: number | null;
  analysis_status: 'pending' | 'analyzing' | 'done' | 'error';
  analysis_error: string | null;
  added_at: string;
  analyzed_at: string | null;
  file_missing: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistSong extends Song {
  position: number;
}

export interface BridgeStatus {
  status: string;
  error?: string;
  code?: number;
}

export interface WaveformViz {
  peaks: [number, number][];
  duration: number;
}

export interface RmsViz {
  rms: number[];
  duration: number;
}

export interface ChromaViz {
  chroma: number[][];
  frames: number;
  duration: number;
}

export interface KeyTrackSegment {
  start: number;
  end: number;
  key_id: number;
  camelot: string;
}

export interface KeyTrackViz {
  segments: KeyTrackSegment[];
}

export interface BeatsViz {
  bpm: number;
  beats: number[];
}

export interface VizPayload {
  waveform?: WaveformViz;
  rms?: RmsViz;
  chroma?: ChromaViz;
  keytrack?: KeyTrackViz;
  beats?: BeatsViz;
}

export interface VizGetResult {
  data: VizPayload;
  missing: string[];
}

export interface BackfillProgress {
  state: 'idle' | 'running' | 'done';
  total: number;
  completed: number;
  currentSongId?: string;
  error?: string;
}

export interface ElectronAPI {
  songs: {
    list: () => Promise<Song[]>;
    add: (paths: string[]) => Promise<Song[]>;
    remove: (id: string) => Promise<void>;
    analyze: (id: string) => Promise<void>;
    analyzeAll: () => Promise<void>;
    pickFiles: () => Promise<Song[]>;
    showInFolder: (id: string) => Promise<boolean>;
    locate: (id: string) => Promise<Song | null>;
    updateMetadata: (
      id: string,
      data: { title?: string | null; artist?: string | null },
    ) => Promise<Song | null>;
  };
  playlists: {
    list: () => Promise<Playlist[]>;
    create: (name: string) => Promise<Playlist>;
    rename: (id: string, name: string) => Promise<void>;
    delete: (id: string) => Promise<void>;
    songs: (id: string) => Promise<PlaylistSong[]>;
    addSong: (playlistId: string, songId: string) => Promise<void>;
    removeSong: (playlistId: string, songId: string) => Promise<void>;
    reorder: (playlistId: string, songIds: string[]) => Promise<void>;
  };
  viz: {
    get: (songId: string) => Promise<VizGetResult>;
    compute: (songId: string) => Promise<{ written: string[] }>;
    getProgress: () => Promise<BackfillProgress>;
    audioUrl: (songId: string) => string;
  };
  onSongUpdated: (cb: (song: Song) => void) => () => void;
  onBridgeStatus: (cb: (status: BridgeStatus) => void) => () => void;
  onVizProgress: (cb: (progress: BackfillProgress) => void) => () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
