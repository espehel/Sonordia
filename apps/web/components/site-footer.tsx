import { ThemeSwitcher } from '@/components/theme-switcher';

export function SiteFooter() {
  return (
    <footer className="text-foreground/70 mx-auto flex w-full items-center justify-center gap-8 border-t py-12 text-center text-xs">
      <p>© Sonordia</p>
      <ThemeSwitcher />
    </footer>
  );
}
