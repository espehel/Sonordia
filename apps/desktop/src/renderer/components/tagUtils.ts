import type { Song, Tag } from '../types';

export function visibleTagsFor(song: Song, currentPlaylistId: string | null): Tag[] {
  return song.tags.filter(
    (t) => t.playlist_id === null || (currentPlaylistId && t.playlist_id === currentPlaylistId),
  );
}

export interface TagPools {
  global: Tag[];
  playlist: Tag[];
}

export function collectTagPools(songs: Song[], currentPlaylistId: string | null): TagPools {
  const globalMap = new Map<string, Tag>();
  const playlistMap = new Map<string, Tag>();
  for (const song of songs) {
    for (const tag of song.tags) {
      if (tag.playlist_id === null) {
        globalMap.set(tag.id, tag);
      } else if (currentPlaylistId && tag.playlist_id === currentPlaylistId) {
        playlistMap.set(tag.id, tag);
      }
    }
  }
  const byName = (a: Tag, b: Tag) => a.name.localeCompare(b.name);
  return {
    global: [...globalMap.values()].sort(byName),
    playlist: [...playlistMap.values()].sort(byName),
  };
}

export function songMatchesFilter(song: Song, selectedTagIds: Set<string>): boolean {
  if (selectedTagIds.size === 0) return true;
  for (const tag of song.tags) {
    if (selectedTagIds.has(tag.id)) return true;
  }
  return false;
}
