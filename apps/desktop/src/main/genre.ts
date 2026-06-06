import { basename } from 'path';

// Maps lowercase keyword → canonical genre name. Multi-word entries take
// priority over single-word ones (we sort by length descending below).
const GENRE_KEYWORDS: Record<string, string> = {
  'tech house': 'Tech House',
  'tech-house': 'Tech House',
  'deep house': 'Deep House',
  'progressive house': 'Progressive House',
  'progressive trance': 'Progressive Trance',
  'psy trance': 'Psy Trance',
  'psy-trance': 'Psy Trance',
  'future bass': 'Future Bass',
  'drum and bass': 'Drum & Bass',
  'drum & bass': 'Drum & Bass',
  'drum n bass': 'Drum & Bass',
  'hip hop': 'Hip Hop',
  'hip-hop': 'Hip Hop',
  'r&b': 'R&B',
  rnb: 'R&B',
  psytrance: 'Psy Trance',
  dnb: 'Drum & Bass',
  techno: 'Techno',
  house: 'House',
  trance: 'Trance',
  ambient: 'Ambient',
  dubstep: 'Dubstep',
  hardstyle: 'Hardstyle',
  hardcore: 'Hardcore',
  garage: 'Garage',
  jungle: 'Jungle',
  breakbeat: 'Breakbeat',
  breaks: 'Breaks',
  acid: 'Acid',
  minimal: 'Minimal',
  electro: 'Electro',
  disco: 'Disco',
  funk: 'Funk',
  soul: 'Soul',
  jazz: 'Jazz',
  rock: 'Rock',
  pop: 'Pop',
  rap: 'Hip Hop',
  trap: 'Trap',
  reggae: 'Reggae',
  dancehall: 'Dancehall',
  afrobeat: 'Afrobeat',
  afro: 'Afro',
  latin: 'Latin',
  downtempo: 'Downtempo',
  lofi: 'Lo-Fi',
  'lo-fi': 'Lo-Fi',
};

function normalizeId3Genre(raw: string): string | null {
  // mutagen with easy=True returns ID3v1 numeric codes wrapped like "(7)" sometimes;
  // multi-genre tags can be separated by ";" or "/". Take the first non-empty piece.
  const cleaned = raw
    .replace(/^\((\d+)\)$/, '') // drop pure numeric code like "(7)"
    .split(/[;/]/)[0]
    .trim();
  return cleaned || null;
}

function findKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  const sorted = Object.keys(GENRE_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const kw of sorted) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    // \b doesn't treat `-` as a boundary, so anchor on non-letter or string edges.
    const re = new RegExp(`(?:^|[^a-z])${escaped}(?:[^a-z]|$)`, 'i');
    if (re.test(lower)) return GENRE_KEYWORDS[kw];
  }
  return null;
}

function genreFromBpm(bpm: number): string | null {
  if (bpm < 70) return 'Ambient';
  if (bpm < 100) return 'Hip Hop';
  if (bpm < 118) return 'Pop';
  if (bpm < 128) return 'House';
  if (bpm < 135) return 'Techno';
  if (bpm < 150) return 'Trance';
  if (bpm < 180) return 'Drum & Bass';
  return 'Hardcore';
}

export function inferGenre(args: {
  filePath: string;
  bpm: number | null;
  bridgeGenre: string | null;
}): string | null {
  if (args.bridgeGenre) {
    const normalized = normalizeId3Genre(args.bridgeGenre);
    if (normalized) return normalized;
  }
  const fromFilename = findKeyword(basename(args.filePath));
  if (fromFilename) return fromFilename;
  if (args.bpm && args.bpm > 0) return genreFromBpm(args.bpm);
  return null;
}
