import { useCallback, useEffect, useState } from 'react';

export type VizLayer = 'waveform' | 'ruler' | 'beats' | 'rms' | 'chroma' | 'keytrack';

export type VizSettings = Record<VizLayer, boolean>;

const STORAGE_KEY = 'sonordia:viz-settings';

const defaults: VizSettings = {
  waveform: true,
  ruler: true,
  beats: true,
  rms: true,
  chroma: true,
  keytrack: true,
};

function load(): VizSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<VizSettings>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function useVizSettings() {
  const [settings, setSettings] = useState<VizSettings>(() =>
    typeof window !== 'undefined' ? load() : defaults,
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage may be disabled — ignore
    }
  }, [settings]);

  const toggle = useCallback((layer: VizLayer) => {
    setSettings((s) => ({ ...s, [layer]: !s[layer] }));
  }, []);

  const set = useCallback((layer: VizLayer, value: boolean) => {
    setSettings((s) => ({ ...s, [layer]: value }));
  }, []);

  return { settings, toggle, set };
}
