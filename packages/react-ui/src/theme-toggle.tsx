import { Moon, Sun } from 'lucide-react';
import { Button } from './components/button/button';
import { useTheme } from './theme';

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
