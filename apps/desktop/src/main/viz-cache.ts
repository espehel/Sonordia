import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';

export const VIZ_FEATURES = ['waveform', 'rms', 'chroma', 'keytrack', 'beats'] as const;
export type VizFeature = (typeof VIZ_FEATURES)[number];

export function getVizDir(songId: string): string {
  return join(app.getPath('userData'), 'viz', songId);
}

export function ensureVizDir(songId: string): string {
  const dir = getVizDir(songId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function getVizFilePath(songId: string, feature: VizFeature): string {
  return join(getVizDir(songId), `${feature}.json`);
}

export function hasVizFile(songId: string, feature: VizFeature): boolean {
  return existsSync(getVizFilePath(songId, feature));
}

export function listMissingFeatures(songId: string): VizFeature[] {
  return VIZ_FEATURES.filter((f) => !hasVizFile(songId, f));
}

export function readVizFile<T = unknown>(songId: string, feature: VizFeature): T | null {
  const path = getVizFilePath(songId, feature);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch (err) {
    console.error(`[viz-cache] failed to read ${path}:`, err);
    return null;
  }
}

export function readAllViz(songId: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of VIZ_FEATURES) {
    const data = readVizFile(songId, f);
    if (data) out[f] = data;
  }
  return out;
}

export function writeVizFile(songId: string, feature: VizFeature, data: unknown): void {
  ensureVizDir(songId);
  writeFileSync(getVizFilePath(songId, feature), JSON.stringify(data));
}

export function clearVizDir(songId: string): void {
  const dir = getVizDir(songId);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}
