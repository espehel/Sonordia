import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

export interface Tag {
  id: string;
  name: string;
  playlist_id: string | null;
  created_at: string;
}

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
  notes: string | null;
  tags: Tag[];
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

let db: Database.Database;

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'library.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      file_path TEXT UNIQUE NOT NULL,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration_sec REAL,
      key_camelot TEXT,
      key_name TEXT,
      key_id INTEGER,
      bpm REAL,
      bpm_confidence REAL,
      analysis_status TEXT NOT NULL DEFAULT 'pending',
      analysis_error TEXT,
      added_at TEXT NOT NULL,
      analyzed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlist_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, song_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      playlist_id TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (name, playlist_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS song_tags (
      song_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (song_id, tag_id),
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  const hasNotes = db
    .prepare("SELECT 1 FROM pragma_table_info('songs') WHERE name = 'notes'")
    .get();
  if (!hasNotes) {
    db.exec('ALTER TABLE songs ADD COLUMN notes TEXT');
  }
}

export function getDb(): Database.Database {
  return db;
}

// ── Songs ──

type SongRow = Omit<Song, 'tags'>;

function attachTags(rows: SongRow[]): Song[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const tagRows = db
    .prepare(
      `SELECT st.song_id AS song_id, t.id, t.name, t.playlist_id, t.created_at
       FROM song_tags st
       JOIN tags t ON t.id = st.tag_id
       WHERE st.song_id IN (${placeholders})
       ORDER BY t.created_at ASC`,
    )
    .all(...ids) as (Tag & { song_id: string })[];
  const bySong = new Map<string, Tag[]>();
  for (const row of tagRows) {
    const { song_id, ...tag } = row;
    if (!bySong.has(song_id)) bySong.set(song_id, []);
    bySong.get(song_id)!.push(tag);
  }
  return rows.map((row) => ({ ...row, tags: bySong.get(row.id) ?? [] }));
}

function attachTagsOne(row: SongRow | undefined): Song | undefined {
  if (!row) return undefined;
  return attachTags([row])[0];
}

export function listSongs(): Song[] {
  const rows = db.prepare('SELECT * FROM songs ORDER BY added_at DESC').all() as SongRow[];
  return attachTags(rows);
}

export function getSong(id: string): Song | undefined {
  const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as SongRow | undefined;
  return attachTagsOne(row);
}

export function parseFilename(filePath: string): { title: string; artist: string | null } {
  const basename =
    filePath
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ?? filePath;
  // Try "Artist - Title" pattern (common in music files)
  const match = basename.match(/^(.+?)\s*-\s*(.+)$/);
  if (match) {
    return { artist: match[1].trim(), title: match[2].trim() };
  }
  return { title: basename, artist: null };
}

export function addSongs(filePaths: string[]): Song[] {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO songs (id, file_path, title, artist, added_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  const rows: SongRow[] = [];

  const insertMany = db.transaction((paths: string[]) => {
    for (const filePath of paths) {
      const id = uuid();
      const { title, artist } = parseFilename(filePath);
      insert.run(id, filePath, title, artist, now);
      const song = db
        .prepare('SELECT * FROM songs WHERE file_path = ?')
        .get(filePath) as SongRow;
      if (song) rows.push(song);
    }
  });

  insertMany(filePaths);
  return attachTags(rows);
}

export function removeSong(id: string): void {
  db.prepare('DELETE FROM songs WHERE id = ?').run(id);
}

export function relocateSong(id: string, newPath: string): Song | undefined {
  const conflict = db
    .prepare('SELECT id FROM songs WHERE file_path = ? AND id != ?')
    .get(newPath, id) as { id: string } | undefined;
  if (conflict) {
    throw new Error('Another song in your library already references this file.');
  }
  db.prepare('UPDATE songs SET file_path = ? WHERE id = ?').run(newPath, id);
  return getSong(id);
}

export function updateSongAnalysis(
  id: string,
  data: {
    key_camelot?: string;
    key_name?: string;
    key_id?: number;
    bpm?: number;
    bpm_confidence?: number;
    analysis_status: Song['analysis_status'];
    analysis_error?: string | null;
  },
): Song | undefined {
  const now = new Date().toISOString();
  db.prepare(
    `
    UPDATE songs SET
      key_camelot = COALESCE(?, key_camelot),
      key_name = COALESCE(?, key_name),
      key_id = COALESCE(?, key_id),
      bpm = COALESCE(?, bpm),
      bpm_confidence = COALESCE(?, bpm_confidence),
      analysis_status = ?,
      analysis_error = ?,
      analyzed_at = ?
    WHERE id = ?
  `,
  ).run(
    data.key_camelot ?? null,
    data.key_name ?? null,
    data.key_id ?? null,
    data.bpm ?? null,
    data.bpm_confidence ?? null,
    data.analysis_status,
    data.analysis_error ?? null,
    now,
    id,
  );
  return getSong(id);
}

export function getPendingSongs(): Song[] {
  const rows = db
    .prepare("SELECT * FROM songs WHERE analysis_status = 'pending'")
    .all() as SongRow[];
  return attachTags(rows);
}

export function updateSongNotes(id: string, notes: string | null): Song | undefined {
  const trimmed = notes && notes.trim() !== '' ? notes : null;
  db.prepare('UPDATE songs SET notes = ? WHERE id = ?').run(trimmed, id);
  return getSong(id);
}

export function updateSongMetadata(
  id: string,
  data: { title?: string | null; artist?: string | null },
): Song | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (Object.prototype.hasOwnProperty.call(data, 'artist')) {
    fields.push('artist = ?');
    values.push(data.artist);
  }
  if (fields.length === 0) return getSong(id);
  values.push(id);
  db.prepare(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getSong(id);
}

// ── Playlists ──

export function listPlaylists(): Playlist[] {
  return db.prepare('SELECT * FROM playlists ORDER BY created_at DESC').all() as Playlist[];
}

export function createPlaylist(name: string): Playlist {
  const id = uuid();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
    id,
    name,
    now,
    now,
  );
  return { id, name, created_at: now, updated_at: now };
}

export function renamePlaylist(id: string, name: string): void {
  const now = new Date().toISOString();
  db.prepare('UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?').run(name, now, id);
}

export function deletePlaylist(id: string): void {
  db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
}

// ── Playlist Songs ──

export function getPlaylistSongs(playlistId: string): PlaylistSong[] {
  const rows = db
    .prepare(
      `
    SELECT s.*, ps.position FROM songs s
    JOIN playlist_songs ps ON ps.song_id = s.id
    WHERE ps.playlist_id = ?
    ORDER BY ps.position ASC
  `,
    )
    .all(playlistId) as (SongRow & { position: number })[];
  const songs = attachTags(rows);
  return songs.map((song, i) => ({ ...song, position: rows[i].position }));
}

export function addSongToPlaylist(playlistId: string, songId: string): void {
  const maxPos = db
    .prepare(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM playlist_songs WHERE playlist_id = ?',
    )
    .get(playlistId) as { max_pos: number };

  db.prepare(
    'INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
  ).run(playlistId, songId, maxPos.max_pos + 1);

  const now = new Date().toISOString();
  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(now, playlistId);
}

export function removeSongFromPlaylist(playlistId: string, songId: string): void {
  db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?').run(
    playlistId,
    songId,
  );
  const now = new Date().toISOString();
  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(now, playlistId);
}

export function reorderPlaylist(playlistId: string, songIds: string[]): void {
  const update = db.prepare(
    'UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?',
  );
  const reorder = db.transaction((ids: string[]) => {
    ids.forEach((songId, index) => {
      update.run(index, playlistId, songId);
    });
  });
  reorder(songIds);

  const now = new Date().toISOString();
  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(now, playlistId);
}

// ── Tags ──

export function listTags(playlistId?: string | null): Tag[] {
  if (playlistId === undefined) {
    return db.prepare('SELECT * FROM tags ORDER BY created_at ASC').all() as Tag[];
  }
  if (playlistId === null) {
    return db
      .prepare('SELECT * FROM tags WHERE playlist_id IS NULL ORDER BY created_at ASC')
      .all() as Tag[];
  }
  return db
    .prepare('SELECT * FROM tags WHERE playlist_id = ? ORDER BY created_at ASC')
    .all(playlistId) as Tag[];
}

export function findOrCreateTag(name: string, playlistId: string | null): Tag {
  const trimmed = name.trim();
  if (trimmed === '') throw new Error('Tag name cannot be empty');
  const existing = db
    .prepare(
      playlistId === null
        ? 'SELECT * FROM tags WHERE name = ? AND playlist_id IS NULL'
        : 'SELECT * FROM tags WHERE name = ? AND playlist_id = ?',
    )
    .get(...(playlistId === null ? [trimmed] : [trimmed, playlistId])) as Tag | undefined;
  if (existing) return existing;
  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO tags (id, name, playlist_id, created_at) VALUES (?, ?, ?, ?)',
  ).run(id, trimmed, playlistId, now);
  return { id, name: trimmed, playlist_id: playlistId, created_at: now };
}

export function deleteTag(id: string): void {
  db.prepare('DELETE FROM tags WHERE id = ?').run(id);
}

export function attachTag(songId: string, tagId: string): void {
  db.prepare('INSERT OR IGNORE INTO song_tags (song_id, tag_id) VALUES (?, ?)').run(
    songId,
    tagId,
  );
}

export function detachTag(songId: string, tagId: string): void {
  db.prepare('DELETE FROM song_tags WHERE song_id = ? AND tag_id = ?').run(songId, tagId);
}
