import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'sonordia-theme';

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function apply(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStored);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(readStored()));

  useEffect(() => {
    const next = resolve(theme);
    setResolved(next);
    apply(next);

    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const r: ResolvedTheme = mq.matches ? 'dark' : 'light';
      setResolved(r);
      apply(r);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    if (next === 'system') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
  };

  return { theme, resolved, setTheme };
}
